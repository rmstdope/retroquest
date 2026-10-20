"""Exercise the production image without exposing any host ports."""

import argparse
import json
import re
import subprocess
import time


def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True).stdout.strip()


def verify(image, revision):
    container = run("docker", "run", "--detach", "--network", "none", image)
    try:
        for _ in range(30):
            health = run("docker", "inspect", "--format", "{{.State.Health.Status}}", container)
            if health == "healthy":
                break
            if health == "unhealthy":
                raise AssertionError("Container is unhealthy")
            time.sleep(1)
        else:
            raise AssertionError("Container did not become healthy")

        def fetch(path):
            response = subprocess.run(
                ["docker", "exec", container, "wget", "-S", "-O", "-",
                 "http://127.0.0.1:8080" + path],
                text=True, capture_output=True,
            )
            return response.returncode, response.stdout, response.stderr.lower()

        code, body, headers = fetch("/")
        assert code == 0 and "<html" in body, "Production HTML is not served"
        assert "cache-control: no-cache" in headers, "HTML must revalidate"
        assets = re.findall(r'(?:src|href)="(/assets/[^"]+)"', body)
        assert assets, "Production HTML has no built assets"
        for asset in assets:
            code, body, headers = fetch(asset)
            assert code == 0, f"Asset is missing: {asset}"
            assert "max-age=31536000, immutable" in headers, "Hashed assets must be cacheable"
        code, body, headers = fetch("/release.json")
        assert code == 0 and json.loads(body) == {"revision": revision}, "Wrong release identity"
        assert "cache-control: no-cache" in headers, "Release identity must revalidate"
        code, body, _ = fetch("/healthz")
        assert code == 0 and body == "ok", "Health endpoint failed"
        for missing in ("/assets/not-present.js", "/not-present.js", "/not-present.css"):
            code, _, headers = fetch(missing)
            assert code != 0 and "404" in headers, f"Missing asset must return 404: {missing}"
        code, body, _ = fetch("/adventure/act-one")
        assert code == 0 and "<html" in body, "SPA navigation fallback failed"
        print("Production container smoke checks passed.")
    finally:
        subprocess.run(["docker", "rm", "--force", container], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("image")
    parser.add_argument("--revision", required=True)
    args = parser.parse_args()
    verify(args.image, args.revision)
