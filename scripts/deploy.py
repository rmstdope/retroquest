"""Deploy the retroquest web app to a remote server via SFTP."""

# Requires: pip install paramiko

import argparse
import getpass
import shutil
import stat
import subprocess
import sys
from pathlib import Path

import paramiko

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "web" / "dist"
HTACCESS_SRC = REPO_ROOT / "web" / ".htaccess"
REMOTE_BASE = "webroots/www/retroquest"
PRESERVE_DIRS: set[str] = set()


def abort(msg: str) -> None:
    """Print an error message to stderr and exit with code 1."""
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def run(cmd: list[str], **kwargs) -> None:
    """Run a shell command, raising RuntimeError on non-zero exit."""
    result = subprocess.run(cmd, **kwargs)
    if result.returncode != 0:
        raise RuntimeError(
            f"Command failed (exit {result.returncode}): {' '.join(cmd)}"
        )


def git_current_ref() -> str:
    """Return the current git branch name, or the commit hash if detached HEAD."""
    result = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    ref = result.stdout.strip()
    if ref == "HEAD":
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        ref = result.stdout.strip()
    return ref


def check_clean_worktree() -> None:
    """Abort if the working tree has any uncommitted or staged changes."""
    result = subprocess.run(
        ["git", "diff", "--quiet"], cwd=REPO_ROOT
    )
    if result.returncode != 0:
        abort("Working tree has unstaged changes. Commit or stash them first.")
    result = subprocess.run(
        ["git", "diff", "--cached", "--quiet"], cwd=REPO_ROOT
    )
    if result.returncode != 0:
        abort("Index has staged but uncommitted changes. Commit or stash them first.")


def resolve_tag(tag: str) -> str:
    """Return the actual git tag name, trying both the given name and a 'v' prefix."""
    result = subprocess.run(
        ["git", "tag", "-l", tag], cwd=REPO_ROOT, capture_output=True, text=True
    )
    if result.stdout.strip():
        return tag
    prefixed = f"v{tag}"
    result = subprocess.run(
        ["git", "tag", "-l", prefixed],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if result.stdout.strip():
        return prefixed
    raise RuntimeError(f"Tag '{tag}' not found (also tried '{prefixed}')")


def build(tag: str | None = None) -> None:
    """Check out the given tag (if any), build the web app, and copy .htaccess."""
    if tag is not None:
        resolved = resolve_tag(tag)
        print(f"Checking out tag: {resolved}")
        run(["git", "checkout", resolved], cwd=REPO_ROOT)
    else:
        print(f"Building current branch: {git_current_ref()}")
    print("Building web app...")
    run(["npm", "run", "build"], cwd=REPO_ROOT / "web")
    if HTACCESS_SRC.exists():
        print("Copying .htaccess into dist/")
        shutil.copy2(HTACCESS_SRC, DIST_DIR / ".htaccess")


def rmtree_sftp(sftp: paramiko.SFTPClient, remote_path: str) -> None:
    """Recursively remove a remote directory tree via SFTP."""
    for entry in sftp.listdir_attr(remote_path):
        child = f"{remote_path}/{entry.filename}"
        if stat.S_ISDIR(entry.st_mode):
            rmtree_sftp(sftp, child)
            sftp.rmdir(child)
        else:
            sftp.remove(child)


def clean_remote(
    sftp: paramiko.SFTPClient, remote_base: str, dry_run: bool = False
) -> None:
    """Delete everything in remote_base except entries listed in PRESERVE_DIRS."""
    print(f"Cleaning remote {remote_base}/ (preserving {PRESERVE_DIRS})...")
    for entry in sftp.listdir_attr(remote_base):
        if entry.filename in PRESERVE_DIRS:
            continue
        child = f"{remote_base}/{entry.filename}"
        if dry_run:
            print(f"[dry-run] Would delete {child}")
            continue
        if stat.S_ISDIR(entry.st_mode):
            rmtree_sftp(sftp, child)
            sftp.rmdir(child)
        else:
            sftp.remove(child)


def upload_dir(
    sftp: paramiko.SFTPClient, local_path: Path, remote_path: str
) -> None:
    """Recursively upload a local directory to the remote path via SFTP."""
    for item in sorted(local_path.iterdir()):
        remote_item = f"{remote_path}/{item.name}"
        if item.is_dir():
            try:
                sftp.mkdir(remote_item)
            except OSError:
                pass  # directory may already exist
            upload_dir(sftp, item, remote_item)
        else:
            print(f"  Uploading {item.relative_to(DIST_DIR)} -> {remote_item}")
            sftp.put(str(item), remote_item)


def deploy(
    username: str, hostname: str, password: str, dry_run: bool = False
) -> None:
    """Connect via SSH and deploy dist/ to REMOTE_BASE on the server."""
    print(f"Connecting to {username}@{hostname}...")
    ssh = paramiko.SSHClient()
    ssh.load_system_host_keys()
    ssh.set_missing_host_key_policy(paramiko.RejectPolicy())
    ssh.connect(hostname, username=username, password=password)
    try:
        sftp = ssh.open_sftp()
        try:
            clean_remote(sftp, REMOTE_BASE, dry_run=dry_run)
            if not dry_run:
                print(f"Uploading dist/ -> {REMOTE_BASE}/")
                upload_dir(sftp, DIST_DIR, REMOTE_BASE)
            else:
                print(f"[dry-run] Would upload dist/ -> {REMOTE_BASE}/")
        finally:
            sftp.close()
    finally:
        ssh.close()


def main() -> None:
    """Parse arguments and orchestrate the build + deploy workflow."""
    parser = argparse.ArgumentParser(
        description="Deploy the retroquest web app to a remote server."
    )
    parser.add_argument("username", help="SSH username for the remote host")
    parser.add_argument("hostname", help="Hostname or IP of the remote server")
    parser.add_argument(
        "tag",
        nargs="?",
        help="Git tag to check out and deploy (omit to deploy current branch)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be deleted/uploaded without making any changes.",
    )
    args = parser.parse_args()

    if args.tag:
        check_clean_worktree()

    original_ref = git_current_ref() if args.tag else None
    password = getpass.getpass(f"Password for {args.username}@{args.hostname}: ")

    try:
        build(args.tag)
        deploy(args.username, args.hostname, password, dry_run=args.dry_run)
        print("Deployment successful!")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if original_ref is not None:
            print(f"Restoring branch: {original_ref}")
            subprocess.run(["git", "checkout", original_ref], cwd=REPO_ROOT)


if __name__ == "__main__":
    main()
