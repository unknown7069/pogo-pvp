#!/usr/bin/env bash
set -euo pipefail

# Resolve the key directories once up front.
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
public_dir="$root_dir/public"
dist_dir="$root_dir/dist"

export ROOT_DIR="$root_dir"
export PUBLIC_DIR="$public_dir"
export DIST_DIR="$dist_dir"

export PYTHONUNBUFFERED=1

python - <<'PY'
import http.server
import os
import pathlib
import socketserver
import sys

PORT = int(os.environ.get("PORT", "8000"))
BIND = os.environ.get("BIND", "127.0.0.1")
PUBLIC = pathlib.Path(os.environ["PUBLIC_DIR"])
DIST = pathlib.Path(os.environ["DIST_DIR"])

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        resolved = pathlib.Path(super().translate_path(path))

        try:
            rel_to_public = resolved.relative_to(PUBLIC)
        except ValueError:
            return str(resolved)

        dist_candidate = DIST / rel_to_public.relative_to("dist") if rel_to_public.parts and rel_to_public.parts[0] == "dist" else None
        if dist_candidate and dist_candidate.exists():
            return str(dist_candidate)

        return str(resolved)

    def log_message(self, format: str, *args) -> None:
        sys.stdout.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), format % args))
        sys.stdout.flush()

Handler.directory = str(PUBLIC)

with socketserver.ThreadingTCPServer((BIND, PORT), Handler) as httpd:
    print(f"Serving {PUBLIC} at http://{BIND}:{PORT} (dist assets mapped from {DIST})")
    print("Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
PY
