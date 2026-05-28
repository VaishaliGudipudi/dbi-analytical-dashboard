import os
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import whisper


class TranscriptionError(Exception):
    """Raised when audio capture or transcription fails."""


@dataclass
class ListenerConfig:
    sample_rate: int = 16000
    channels: int = 1
    recording_seconds: int = 5
    model_name: str = os.getenv("WHISPER_MODEL", "base")
    language: str | None = os.getenv("WHISPER_LANGUAGE", "en") or None
    device: int | None = None


class SpeechListener:
    def __init__(self, config: ListenerConfig | None = None) -> None:
        self.config = config or ListenerConfig()
        self._model = None

    def capture_and_transcribe(self) -> str:
        audio_data = self._record_audio()
        with self._create_temp_wav(audio_data) as audio_path:
            return self._transcribe_file(audio_path)

    def capture_and_transcribe_with_updates(self, status_callback=None) -> str:
        if status_callback:
            status_callback("Listening now.")
        audio_data = self._record_audio()

        if status_callback:
            status_callback("Audio captured. Preparing transcription.")

        with self._create_temp_wav(audio_data) as audio_path:
            return self._transcribe_file(audio_path, status_callback=status_callback)

    def transcribe_existing_audio(
        self,
        audio_path: str | Path,
        status_callback=None,
        initial_prompt: str | None = None,
    ) -> str:
        return self._transcribe_file(str(audio_path), status_callback=status_callback, initial_prompt=initial_prompt)

    def _record_audio(self) -> np.ndarray:
        try:
            import sounddevice as sd

            print("Listening now...")
            print(f"Recording for {self.config.recording_seconds} seconds.")
            frames = int(self.config.sample_rate * self.config.recording_seconds)
            audio_data = sd.rec(
                frames,
                samplerate=self.config.sample_rate,
                channels=self.config.channels,
                dtype="float32",
                device=self.config.device,
            )
            sd.wait()
            return audio_data
        except ModuleNotFoundError as error:
            raise TranscriptionError(
                "Microphone capture is unavailable because the optional 'sounddevice' package is not installed."
            ) from error
        except Exception as error:
            raise TranscriptionError(
                "Microphone recording failed. Check your microphone permissions and device settings."
            ) from error

    def _create_temp_wav(self, audio_data: np.ndarray):
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        temp_file.close()

        clipped_audio = np.clip(audio_data, -1.0, 1.0)
        pcm_audio = (clipped_audio * 32767).astype(np.int16)

        with wave.open(temp_file.name, "wb") as wav_file:
            wav_file.setnchannels(self.config.channels)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.config.sample_rate)
            wav_file.writeframes(pcm_audio.tobytes())

        return _TempAudioFile(temp_file.name)

    def _load_model(self, status_callback=None):
        if self._model is None:
            print(f"Loading Whisper model: {self.config.model_name}")
            if status_callback:
                status_callback(f"Loading Whisper model: {self.config.model_name}")
            self._model = whisper.load_model(self.config.model_name)
        return self._model

    def _transcribe_file(
        self,
        audio_path: str,
        status_callback=None,
        initial_prompt: str | None = None,
    ) -> str:
        try:
            if status_callback:
                status_callback("Transcribing audio with Whisper.")
            model = self._load_model(status_callback=status_callback)
            transcribe_kwargs = {
                "fp16": False,
            }
            if self.config.language:
                transcribe_kwargs["language"] = self.config.language
            if initial_prompt:
                transcribe_kwargs["initial_prompt"] = initial_prompt

            result = model.transcribe(audio_path, **transcribe_kwargs)
            return result["text"].strip()
        except Exception as error:
            raise TranscriptionError(
                "Whisper could not transcribe the audio. Confirm FFmpeg is installed and available in PATH."
            ) from error


class _TempAudioFile:
    def __init__(self, path: str) -> None:
        self.path = path

    def __enter__(self) -> str:
        return self.path

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if os.path.exists(self.path):
            os.remove(self.path)
