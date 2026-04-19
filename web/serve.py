"""Development server for the RetroQuest web frontend."""

import http.server
import json
import os
import sys
from pathlib import Path
from urllib.parse import unquote


def _build_manifest(src_dir: str) -> list[str]:
    """Scan src/ for Python files and return relative paths."""
    src_path = Path(src_dir)
    manifest = []
    for py_file in sorted(src_path.rglob('*.py')):
        rel = py_file.relative_to(src_path)
        manifest.append(str(rel))
    return manifest


class RetroQuestHandler(http.server.SimpleHTTPRequestHandler):
    """Serve web/ as root and mount src/ at /src/ for Pyodide."""

    def __init__(self, *args, web_dir: str, src_dir: str, **kwargs):
        self.web_dir = web_dir
        self.src_dir = src_dir
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests, including the dynamic manifest."""
        if self.path == '/src/manifest.json':
            manifest = _build_manifest(self.src_dir)
            body = json.dumps(manifest).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def translate_path(self, path: str) -> str:
        """Map URL paths to filesystem paths."""
        # Strip query string and fragment
        path = path.split('?', 1)[0].split('#', 1)[0]

        if path.startswith('/src/'):
            # Serve Python source files from the src/ directory.
            # URL-decode so filenames with spaces (e.g. MP3 tracks) resolve
            # correctly — mirrors what SimpleHTTPRequestHandler does by default.
            rel = unquote(path[len('/src/'):])
            src_root = Path(self.src_dir).resolve()
            candidate = (src_root / rel).resolve()
            try:
                candidate.relative_to(src_root)
            except ValueError:
                return str(src_root / '__forbidden_path__')
            return str(candidate)

        # Default: serve from web/ directory
        return os.path.join(
            self.web_dir,
            path.lstrip('/')
        )

    def end_headers(self):
        """Add CORS and caching headers needed by Pyodide."""
        self.send_header(
            'Cross-Origin-Opener-Policy', 'same-origin'
        )
        self.send_header(
            'Cross-Origin-Embedder-Policy', 'require-corp'
        )
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def guess_type(self, path: str) -> str:
        """Ensure .py files are served as text/plain."""
        if path.endswith('.py'):
            return 'text/plain'
        return super().guess_type(path)


def main() -> None:
    """Start the development server."""
    repo_root = Path(__file__).resolve().parent.parent
    web_dir = str(repo_root / 'web')
    src_dir = str(repo_root / 'src')

    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

    def handler_factory(*args, **kwargs):
        return RetroQuestHandler(
            *args,
            web_dir=web_dir,
            src_dir=src_dir,
            **kwargs
        )

    server = http.server.HTTPServer(
        ('', port), handler_factory
    )
    print(
        f"RetroQuest dev server running at "
        f"http://localhost:{port}"
    )
    print(
        f"  web/  -> http://localhost:{port}/"
    )
    print(
        f"  src/  -> http://localhost:{port}/src/"
    )
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()


if __name__ == '__main__':
    main()
