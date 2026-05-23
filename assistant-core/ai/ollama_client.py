from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any
from urllib import error, request


class OllamaError(Exception):
    """Raised when the local Ollama server cannot fulfill a request."""


@dataclass
class OllamaConfig:
    base_url: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    default_model: str = os.getenv("OLLAMA_MODEL", "meditron:7b")
    timeout_seconds: int = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))


class OllamaClient:
    def __init__(self, config: OllamaConfig | None = None) -> None:
        self.config = config or OllamaConfig()

    def generate(
        self,
        *,
        prompt: str,
        system: str,
        model: str | None = None,
        format_schema: dict[str, Any] | None = None,
        temperature: float = 0.1,
    ) -> str:
        payload: dict[str, Any] = {
            "model": model or self.config.default_model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }
        if format_schema:
            payload["format"] = format_schema

        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            url=f"{self.config.base_url}/api/generate",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=self.config.timeout_seconds) as response:
                data = json.loads(response.read().decode("utf-8"))
                result = data.get("response", "").strip()
                if not result:
                    raise OllamaError("Ollama returned an empty response.")
                return result
        except error.URLError as exc:
            raise OllamaError(
                "Could not reach Ollama. Start it with `ollama serve` and confirm the configured model is available."
            ) from exc
        except json.JSONDecodeError as exc:
            raise OllamaError("Ollama returned malformed JSON.") from exc
