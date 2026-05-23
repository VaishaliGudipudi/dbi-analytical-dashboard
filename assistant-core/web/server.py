import json
import re
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ai.copilot_service import CopilotService, CopilotServiceError
from assistant_service import AssistantService
from voice.listen import TranscriptionError


INDEX_FILE = BASE_DIR / "index.html"
assistant_service = AssistantService()
copilot_service = CopilotService()
DEFAULT_STOP_PHRASE = "apply changes"


class AssistantHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        parsed_url = urlparse(self.path)

        if parsed_url.path in {"/", "/index.html"}:
            self._serve_index()
            return

        if parsed_url.path.startswith("/api/voice-cycle/status/"):
            job_id = parsed_url.path.rsplit("/", 1)[-1]
            self._handle_voice_cycle_status(job_id)
            return

        self._send_json(
            HTTPStatus.NOT_FOUND,
            {"success": False, "error": "Page not found."},
        )

    def do_POST(self) -> None:
        if self.path == "/api/copilot/voice-command":
            self._handle_copilot_voice_command()
            return

        if self.path == "/api/copilot/command":
            self._handle_copilot_command()
            return

        if self.path == "/api/copilot/summary":
            self._handle_copilot_summary()
            return

        if self.path == "/api/copilot/recommendations":
            self._handle_copilot_recommendations()
            return

        if self.path == "/api/browser-voice-cycle":
            self._handle_browser_voice_cycle()
            return

        if self.path == "/api/voice-cycle":
            self._start_voice_cycle()
            return

        self._send_json(
            HTTPStatus.NOT_FOUND,
            {"success": False, "error": "API route not found."},
        )

    def _serve_index(self) -> None:
        html = INDEX_FILE.read_text(encoding="utf-8")
        encoded = html.encode("utf-8")

        self.send_response(HTTPStatus.OK)
        self._set_cors_headers()
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _start_voice_cycle(self) -> None:
        try:
            job = assistant_service.start_voice_cycle()
            self._send_json(
                HTTPStatus.ACCEPTED,
                {
                    "success": True,
                    "job_id": job.job_id,
                    "state": job.state,
                    "done": job.done,
                },
            )
        except TranscriptionError as error:
            self._send_json(
                HTTPStatus.BAD_REQUEST,
                {"success": False, "error": str(error)},
            )
        except Exception as error:
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"success": False, "error": f"Unexpected error: {error}"},
            )

    def _handle_voice_cycle_status(self, job_id: str) -> None:
        job = assistant_service.get_job(job_id)
        if job is None:
            self._send_json(
                HTTPStatus.NOT_FOUND,
                {"success": False, "error": "Voice job not found."},
            )
            return

        self._send_json(HTTPStatus.OK, {"success": True, **job.to_dict()})

    def _handle_browser_voice_cycle(self) -> None:
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0:
                self._send_json(
                    HTTPStatus.BAD_REQUEST,
                    {"success": False, "error": "No audio data was uploaded."},
                )
                return

            content_type = self.headers.get("Content-Type", "")
            suffix = ".webm"
            if "audio/wav" in content_type or "audio/wave" in content_type:
                suffix = ".wav"
            elif "audio/mp4" in content_type or "audio/m4a" in content_type:
                suffix = ".m4a"
            elif "audio/ogg" in content_type:
                suffix = ".ogg"

            audio_bytes = self.rfile.read(content_length)
            result = assistant_service.process_browser_audio(audio_bytes, suffix=suffix)
            self._send_json(HTTPStatus.OK, result)
        except TranscriptionError as error:
            self._send_json(
                HTTPStatus.BAD_REQUEST,
                {"success": False, "error": str(error)},
            )
        except Exception as error:
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"success": False, "error": f"Unexpected error: {error}"},
            )

    def _handle_copilot_command(self) -> None:
        try:
            payload = self._read_json_body()
            result = copilot_service.parse_command(
                transcript=payload.get("transcript", ""),
                current_route=payload.get("current_route", ""),
                current_section=payload.get("current_section"),
                available_routes=payload.get("available_routes", []),
                available_patients=payload.get("available_patients", []),
                available_sections=payload.get("available_sections", []),
                available_tools=payload.get("available_tools", []),
                available_pathways=payload.get("available_pathways", []),
            )
            self._send_json(HTTPStatus.OK, {"success": True, **result})
        except CopilotServiceError as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"success": False, "error": str(error)})
        except Exception as error:
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"success": False, "error": f"Unexpected error: {error}"},
            )

    def _handle_copilot_voice_command(self) -> None:
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0:
                self._send_json(
                    HTTPStatus.BAD_REQUEST,
                    {"success": False, "error": "No voice command audio was uploaded."},
                )
                return

            context_header = self.headers.get("X-Copilot-Context", "{}")
            context = json.loads(unquote(context_header))

            content_type = self.headers.get("Content-Type", "")
            suffix = ".webm"
            if "audio/wav" in content_type or "audio/wave" in content_type:
                suffix = ".wav"
            elif "audio/mp4" in content_type or "audio/m4a" in content_type:
                suffix = ".m4a"
            elif "audio/ogg" in content_type:
                suffix = ".ogg"

            audio_bytes = self.rfile.read(content_length)
            transcript_result = assistant_service.process_browser_audio(audio_bytes, suffix=suffix)
            transcript = transcript_result.get("transcript", "").strip()
            stop_phrase = str(context.get("stop_phrase", DEFAULT_STOP_PHRASE)).strip()
            transcript = self._strip_stop_phrase(transcript, stop_phrase)

            if not transcript:
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "success": False,
                        "transcript": "",
                        "intent": "unknown",
                        "response_text": "No speech was recognized.",
                        "confidence": 0,
                    },
                )
                return

            command_result = copilot_service.parse_command(
                transcript=transcript,
                current_route=context.get("current_route", ""),
                current_section=context.get("current_section"),
                available_routes=context.get("available_routes", []),
                available_patients=context.get("available_patients", []),
                available_sections=context.get("available_sections", []),
                available_tools=context.get("available_tools", []),
                available_pathways=context.get("available_pathways", []),
            )
            self._send_json(
                HTTPStatus.OK,
                {
                    "success": True,
                    "transcript": transcript,
                    **command_result,
                },
            )
        except (CopilotServiceError, TranscriptionError) as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"success": False, "error": str(error)})
        except Exception as error:
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"success": False, "error": f"Unexpected error: {error}"},
            )

    def _handle_copilot_summary(self) -> None:
        try:
            payload = self._read_json_body()
            result = copilot_service.generate_summary(payload.get("encounter_context", {}))
            self._send_json(HTTPStatus.OK, {"success": True, **result})
        except CopilotServiceError as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"success": False, "error": str(error)})
        except Exception as error:
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"success": False, "error": f"Unexpected error: {error}"},
            )

    def _handle_copilot_recommendations(self) -> None:
        try:
            payload = self._read_json_body()
            result = copilot_service.recommend(payload.get("encounter_context", {}))
            self._send_json(HTTPStatus.OK, {"success": True, **result})
        except CopilotServiceError as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"success": False, "error": str(error)})
        except Exception as error:
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"success": False, "error": f"Unexpected error: {error}"},
            )

    def _read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        return json.loads(raw_body.decode("utf-8"))

    def _send_json(self, status: HTTPStatus, payload: dict) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._set_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _set_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Copilot-Context")

    def _strip_stop_phrase(self, transcript: str, stop_phrase: str) -> str:
        cleaned = transcript.strip()
        if not cleaned or not stop_phrase:
            return cleaned

        pattern = re.compile(rf"\b{re.escape(stop_phrase)}\b[\s\.,;:!?-]*", re.IGNORECASE)
        cleaned = pattern.sub(" ", cleaned)
        return re.sub(r"\s+", " ", cleaned).strip(" ,.;:!?-")

    def log_message(self, format: str, *args) -> None:
        return


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    server = ThreadingHTTPServer((host, port), AssistantHTTPRequestHandler)
    print(f"Dummy frontend running at http://{host}:{port}")
    print("Open that URL in your browser, then click the button to test the voice pipeline.")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
