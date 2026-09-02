#!/usr/bin/env python3
"""Local preview. python3 serve.py -> http://localhost:8121"""
import functools, http.server, pathlib, socketserver

PORT = 8121
ROOT = pathlib.Path(__file__).resolve().parent


class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.webmanifest': 'application/manifest+json',
                      '.woff2': 'font/woff2', '.webp': 'image/webp',
                      '.mp4': 'video/mp4', '.js': 'text/javascript'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT),
                                functools.partial(H, directory=str(ROOT))) as httpd:
        print(f'جریان  →  http://localhost:{PORT}')
        httpd.serve_forever()
