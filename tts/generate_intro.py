"""Synthesise a text file with MisoTTS, one sentence at a time.

Each sentence is generated with the previous few generated sentences as
context, so the voice stays the same across the whole passage. An optional
reference clip (plus its transcript) fixes the voice from the start.

Run with the MisoTTS environment:
    tts/vendor/MisoTTS/.venv/bin/python tts/generate_intro.py tts/out/act1-intro.txt tts/out/act1-intro.wav
"""

import argparse
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "vendor" / "MisoTTS"))

import torch  # noqa: E402
import torchaudio  # noqa: E402
from transformers import AutoTokenizer  # noqa: E402
from tokenizers.processors import TemplateProcessing  # noqa: E402

import generator as miso  # noqa: E402

# meta-llama/Llama-3.2-1B is gated on Hugging Face; this mirror ships the same tokenizer.
TOKENIZER_REPO = "unsloth/Llama-3.2-1B"
CONTEXT_SEGMENTS = 3
SENTENCE_PAUSE_S = 0.35
PARAGRAPH_PAUSE_S = 0.8


def load_tokenizer():
    """The Llama 3 tokenizer with the BOS/EOS template MisoTTS expects."""
    tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_REPO)
    bos, eos = tokenizer.bos_token, tokenizer.eos_token
    tokenizer._tokenizer.post_processor = TemplateProcessing(
        single=f"{bos}:0 $A:0 {eos}:0",
        pair=f"{bos}:0 $A:0 {eos}:0 {bos}:1 $B:1 {eos}:1",
        special_tokens=[(bos, tokenizer.bos_token_id), (eos, tokenizer.eos_token_id)],
    )
    return tokenizer


def load_model_lean(model_path_or_repo_id: str, config, device: str, dtype: torch.dtype):
    """Upstream's _load_model without its memory peak.

    The published checkpoint is float32 (33 GB). Upstream builds a float32 model and loads
    the whole state dict beside it (~66 GB). Here the model is built directly in `dtype`
    and each tensor is cast as it is read, so the peak stays near the bfloat16 size (~16 GB).
    """
    from huggingface_hub import hf_hub_download
    from safetensors import safe_open

    path = Path(model_path_or_repo_id)
    if path.is_dir():
        path = path / "model.safetensors"
    if not path.is_file():
        path = Path(hf_hub_download(repo_id=model_path_or_repo_id, filename="model.safetensors"))

    previous_dtype = torch.get_default_dtype()
    torch.set_default_dtype(dtype)
    try:
        model = miso.Model(config)
    finally:
        torch.set_default_dtype(previous_dtype)

    params = dict(model.named_parameters()) | dict(model.named_buffers())
    loaded = set()
    with safe_open(str(path), framework="pt", device="cpu") as checkpoint, torch.no_grad():
        for key in checkpoint.keys():
            name = key.removeprefix("module.")
            if name not in params:
                raise KeyError(f"Unexpected checkpoint tensor: {key}")
            params[name].copy_(checkpoint.get_tensor(key).to(dtype))
            loaded.add(name)
    missing = set(dict(model.named_parameters())) - loaded
    if missing:
        raise KeyError(f"Checkpoint is missing parameters: {sorted(missing)[:5]}")

    model.to(device=device, dtype=dtype)
    model.eval()
    return model


def split_text(text: str) -> list[list[str]]:
    """Paragraphs, each a list of sentences (quoted speech stays with its sentence)."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return [re.split(r'(?:(?<=[.!?])|(?<=[.!?]"))\s+(?=["A-Z])', p) for p in paragraphs]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("text_file", type=Path)
    parser.add_argument("out_wav", type=Path)
    parser.add_argument("--device", default="mps" if torch.backends.mps.is_available() else "cpu")
    parser.add_argument("--speaker", type=int, default=0)
    parser.add_argument("--temperature", type=float, default=0.9)
    parser.add_argument("--topk", type=int, default=50)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--prompt-wav", type=Path, help="reference clip that fixes the voice")
    parser.add_argument("--prompt-text", help="transcript of --prompt-wav")
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    miso.load_llama3_tokenizer = load_tokenizer
    miso._load_model = load_model_lean

    started = time.time()
    gen = miso.load_miso_8b(device=args.device)
    print(f"model loaded on {args.device} in {time.time() - started:.0f}s", flush=True)

    prompt = []
    if args.prompt_wav:
        audio, rate = torchaudio.load(args.prompt_wav)
        audio = torchaudio.functional.resample(audio.mean(0), orig_freq=rate, new_freq=gen.sample_rate)
        prompt = [miso.Segment(speaker=args.speaker, text=args.prompt_text or "", audio=audio.to(gen.device))]

    def silence(seconds: float) -> torch.Tensor:
        return torch.zeros(int(seconds * gen.sample_rate))

    history: list[miso.Segment] = []
    pieces: list[torch.Tensor] = []
    for p_index, sentences in enumerate(split_text(args.text_file.read_text())):
        if p_index:
            pieces.append(silence(PARAGRAPH_PAUSE_S))
        for s_index, sentence in enumerate(sentences):
            started = time.time()
            audio = gen.generate(
                text=sentence,
                speaker=args.speaker,
                context=prompt + history[-CONTEXT_SEGMENTS:],
                max_audio_length_ms=max(5_000, len(sentence) * 120),
                temperature=args.temperature,
                topk=args.topk,
            )
            seconds = audio.shape[-1] / gen.sample_rate
            print(f"[{time.time() - started:5.0f}s] {seconds:4.1f}s audio  {sentence}", flush=True)
            history.append(miso.Segment(speaker=args.speaker, text=sentence, audio=audio))
            if s_index:
                pieces.append(silence(SENTENCE_PAUSE_S))
            pieces.append(audio.cpu())

    args.out_wav.parent.mkdir(parents=True, exist_ok=True)
    torchaudio.save(str(args.out_wav), torch.cat(pieces).unsqueeze(0), gen.sample_rate)
    print(f"wrote {args.out_wav}")


if __name__ == "__main__":
    main()
