from __future__ import annotations

from dataclasses import dataclass, field
import os
import tempfile
from threading import Lock, Thread
from uuid import uuid4

from voice.listen import SpeechListener, TranscriptionError
from voice.speak import Speaker


@dataclass
class VoiceJob:
    job_id: str
    state: str = "queued"
    transcript: str = ""
    reply: str = ""
    error: str = ""
    success: bool = False
    done: bool = False
    history: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "state": self.state,
            "transcript": self.transcript,
            "reply": self.reply,
            "error": self.error,
            "success": self.success,
            "done": self.done,
            "history": self.history,
        }


class AssistantService:
    """Coordinates the Phase 1 voice input/output cycle."""

    def __init__(self) -> None:
        self.speaker = Speaker()
        self.listener = SpeechListener()
        self._run_lock = Lock()
        self._jobs: dict[str, VoiceJob] = {}

    def start_voice_cycle(self) -> VoiceJob:
        job = VoiceJob(job_id=uuid4().hex)
        self._jobs[job.job_id] = job

        worker = Thread(target=self._run_voice_cycle_job, args=(job.job_id,), daemon=True)
        worker.start()
        return job

    def get_job(self, job_id: str) -> VoiceJob | None:
        return self._jobs.get(job_id)

    def run_voice_cycle(self) -> dict:
        job = self.start_voice_cycle()

        while True:
            current = self.get_job(job.job_id)
            if current is None:
                raise RuntimeError("Voice job disappeared before completion.")
            if current.done:
                if current.error:
                    raise TranscriptionError(current.error)
                return current.to_dict()

    def process_browser_audio(self, audio_bytes: bytes, suffix: str = ".webm") -> dict:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name

        try:
            transcript = self.listener.transcribe_existing_audio(temp_path)

            if transcript:
                reply = f"You said: {transcript}"
                return {
                    "success": True,
                    "transcript": transcript,
                    "reply": reply,
                }

            return {
                "success": False,
                "transcript": "",
                "reply": "I did not catch anything. Please try again.",
            }
        except TranscriptionError:
            raise
        except Exception as error:
            raise TranscriptionError(
                f"Could not process browser audio: {error}"
            ) from error
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def _run_voice_cycle_job(self, job_id: str) -> None:
        job = self._jobs[job_id]

        with self._run_lock:
            try:
                self._update_job(job, "speaking", "Speaking startup prompt.")
                self.speaker.say("Assistant core is ready. I will listen after the beep.")

                self._update_job(job, "recording", "Recording microphone input.")
                transcript = self.listener.capture_and_transcribe_with_updates(
                    status_callback=lambda message: self._update_job(job, "transcribing", message)
                )

                if transcript:
                    reply = f"You said: {transcript}"
                    print(f"Recognized text: {transcript}")
                    job.transcript = transcript
                    job.reply = reply
                    job.success = True

                    self._update_job(job, "speaking_reply", "Speaking the assistant reply.")
                    self.speaker.say(reply)
                else:
                    reply = "I did not catch anything. Please try again."
                    print("No speech was recognized.")
                    job.reply = reply

                    self._update_job(job, "speaking_reply", "No speech recognized. Speaking retry message.")
                    self.speaker.say(reply)

                self._update_job(job, "done", "Voice test completed.")
                job.done = True
            except TranscriptionError as error:
                print(f"Transcription error: {error}")
                job.error = str(error)
                job.reply = "I ran into a speech recognition error. Please check the terminal."
                self._update_job(job, "error", str(error))
                job.done = True
            except Exception as error:
                print(f"Unexpected error: {error}")
                job.error = f"Unexpected error: {error}"
                job.reply = "Something unexpected happened. Please check the terminal output."
                self._update_job(job, "error", job.error)
                job.done = True

    def _update_job(self, job: VoiceJob, state: str, message: str) -> None:
        job.state = state
        job.history.append(message)
        print(f"[voice-job:{job.job_id}] {message}")
