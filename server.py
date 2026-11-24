import os
import sys
import json
import http.server
import socketserver
import time
from urllib.parse import urlparse

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Ensure local dir is in sys.path
STUDIO_ROOT = os.path.dirname(os.path.abspath(__file__))
if STUDIO_ROOT not in sys.path:
    sys.path.insert(0, STUDIO_ROOT)

from pipeline.orchestrator import StatutoryStudioOrchestrator

AUDIO_DIR = os.path.join(STUDIO_ROOT, "static", "audio")
orchestrator = StatutoryStudioOrchestrator(static_audio_dir=AUDIO_DIR)

class StudioHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STUDIO_ROOT, **kwargs)

    def log_message(self, format, *args):
        sys.stderr.write("%s - - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format % args))

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path in ['', '/studio']:
            self.send_response(302)
            self.send_header('Location', '/static/index.html')
            self.end_headers()
            return
        super().do_GET()

    def send_head(self):
        """HTTP Range support for seeking audio files in browsers."""
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        fs = os.fstat(f.fileno())
        total_len = fs.st_size
        range_header = self.headers.get('Range')

        if range_header and range_header.startswith('bytes='):
            try:
                ranges = range_header.replace('bytes=', '').split('-')
                start = int(ranges[0]) if ranges[0] else 0
                end = int(ranges[1]) if len(ranges) > 1 and ranges[1] else total_len - 1
                if start >= total_len:
                    self.send_error(416, "Requested Range Not Satisfiable")
                    f.close()
                    return None
                end = min(end, total_len - 1)
                length = end - start + 1

                self.send_response(206)
                ctype = self.guess_type(path)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Range", f"bytes {start}-{end}/{total_len}")
                self.send_header("Content-Length", str(length))
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                self.end_headers()

                f.seek(start)

                class LimitedReader:
                    def __init__(self, file_obj, max_bytes):
                        self.f = file_obj
                        self.remaining = max_bytes
                    def read(self, size=-1):
                        if self.remaining <= 0:
                            return b""
                        if size < 0 or size > self.remaining:
                            size = self.remaining
                        data = self.f.read(size)
                        self.remaining -= len(data)
                        return data
                    def close(self):
                        self.f.close()

                return LimitedReader(f, length)
            except Exception:
                pass

        self.send_response(200)
        ctype = self.guess_type(path)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(total_len))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/generate_story':
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_len)
                req_data = json.loads(body.decode('utf-8'))
                
                provision_text = req_data.get('provision_text', '').strip()
                topic_hint = req_data.get('topic', '').strip()

                if not provision_text:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'provision_text is required'}).encode('utf-8'))
                    return

                print(f"\n[STUDIO SERVER] Generating 2-Phase Story Screenplay for pasted provision...", flush=True)
                result = orchestrator.generate_story_only(
                    provision_text=provision_text,
                    topic_hint=topic_hint
                )

                resp_bytes = json.dumps(result, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)
                print(f"[STUDIO SERVER] 2-Phase Story Generated: {result.get('act_name')} - {result.get('section_code')}", flush=True)

            except Exception as e:
                print(f"[STUDIO SERVER ERROR] {e}", flush=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        elif parsed.path == '/api/generate_presentation':
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_len)
                req_data = json.loads(body.decode('utf-8'))
                
                provision_text = req_data.get('provision_text', '').strip()
                topic_hint = req_data.get('topic', '').strip()
                voice_name = req_data.get('voice', 'Aoede').strip()

                if not provision_text:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'provision_text is required'}).encode('utf-8'))
                    return

                print(f"\n[STUDIO SERVER] Orchestrating presentation for: {topic_hint or provision_text[:50]}...", flush=True)
                result = orchestrator.process_provision(
                    provision_text=provision_text,
                    topic_hint=topic_hint,
                    voice_name=voice_name
                )

                resp_bytes = json.dumps(result, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(resp_bytes)))
                self.end_headers()
                self.wfile.write(resp_bytes)
                print(f"[STUDIO SERVER] Orchestration complete for {result.get('section_code')}", flush=True)

            except Exception as e:
                print(f"[STUDIO SERVER ERROR] {e}", flush=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint not found")

def run_server(port=8090):
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), StudioHTTPHandler) as httpd:
        print(f"\n=======================================================")
        print(f"🎬 Statutory Kinetic Presentation Studio Running!")
        print(f"👉 Local URL: http://localhost:{port}/static/index.html")
        print(f"=======================================================\n", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    run_server(port)
