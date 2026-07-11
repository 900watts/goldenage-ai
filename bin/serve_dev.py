#!/usr/bin/env python3
"""
Static file server that disables caching. Useful during development
when the browser otherwise serves stale JS/HTML after a code change.
"""
import sys
import os
import socketserver
from http.server import SimpleHTTPRequestHandler

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    # Serve from the project root (the parent of this script's bin/ dir).
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'bin' else script_dir
    os.chdir(project_root)
    sys.stderr.write(f"Serving {project_root} on 0.0.0.0:{port} with no-cache headers\n")
    with socketserver.ThreadingTCPServer(("0.0.0.0", port), NoCacheHandler) as httpd:
        httpd.serve_forever()
