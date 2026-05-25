from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any
from urllib import error, request

from ai.ollama_client import OllamaClient, OllamaError


class LLMClientError(Exception):
    """Raised when the configured language model provider cannot fulfill a request."""


@dataclass
class OpenAICompatibleConfig:
    api_key: str = os.getenv("OPENAI_API_KEY", "")
    base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    timeout_seconds: int = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "120"))


class OpenAICompatibleClient:
    def __init__(self, config: OpenAICompatibleConfig | None = None) -> None:
        self.config = config or OpenAICompatibleConfig()

    def generate(
        self,
        *,
        prompt: str,
        system: str,
        format_schema: dict[str, Any] | None = None,
        temperature: float = 0.1,
    ) -> str:
        if not self.config.api_key:
            raise LLMClientError(
                "OPENAI_API_KEY is missing. Set it in Render to enable hosted copilot reasoning."
            )

        payload: dict[str, Any] = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
        }
        if format_schema:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": "copilot_response",
                    "strict": True,
                    "schema": format_schema,
                },
            }

        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            url=f"{self.config.base_url.rstrip('/')}/chat/completions",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.config.api_key}",
            },
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=self.config.timeout_seconds) as response:
                data = json.loads(response.read().decode("utf-8"))
                choices = data.get("choices") or []
                if not choices:
                    raise LLMClientError("The hosted LLM returned no choices.")

                message = choices[0].get("message") or {}
                content = message.get("content", "")
                if isinstance(content, list):
                    content = "".join(
                        item.get("text", "")
                        for item in content
                        if isinstance(item, dict)
                    )

                result = str(content).strip()
                if not result:
                    raise LLMClientError("The hosted LLM returned an empty response.")
                return result
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="ignore")
            raise LLMClientError(
                f"Hosted LLM request failed with HTTP {exc.code}. {details}".strip()
            ) from exc
        except error.URLError as exc:
            raise LLMClientError(
                "Could not reach the hosted LLM provider. Check OPENAI_BASE_URL and network access."
            ) from exc
        except json.JSONDecodeError as exc:
            raise LLMClientError("The hosted LLM returned malformed JSON.") from exc


class LLMClient:
    def __init__(self) -> None:
        self.provider = os.getenv("LLM_PROVIDER", "ollama").strip().lower()
        self._ollama = OllamaClient()
        self._openai = OpenAICompatibleClient()

    def generate(
        self,
        *,
        prompt: str,
        system: str,
        format_schema: dict[str, Any] | None = None,
        temperature: float = 0.1,
    ) -> str:
        if self.provider in {"disabled", "none", "local-only"}:
            raise LLMClientError("Hosted LLM provider is disabled.")

        if self.provider in {"openai", "openai-compatible", "hosted"}:
            return self._openai.generate(
                prompt=prompt,
                system=system,
                format_schema=format_schema,
                temperature=temperature,
            )

        try:
            return self._ollama.generate(
                prompt=prompt,
                system=system,
                format_schema=format_schema,
                temperature=temperature,
            )
        except OllamaError as exc:
            raise LLMClientError(str(exc)) from exc
