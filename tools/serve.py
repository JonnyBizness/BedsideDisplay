"""Local preview server.

Plain `python -m http.server` lets the browser cache ES modules, which
silently mixes old and new files after an edit and produces failures that
look like real bugs. This sends no-store on everything.

    python tools/serve.py [port]
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    handler = partial(NoCacheHandler, directory=str(ROOT))
    print(f"serving {ROOT} at http://localhost:{PORT} (no-store)")
    ThreadingHTTPServer(("", PORT), handler).serve_forever()
