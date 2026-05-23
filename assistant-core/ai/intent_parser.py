class IntentParser:
    """Placeholder parser for the next phase of the assistant."""

    def parse(self, text: str) -> dict:
        return {
            "raw_text": text,
            "intent": "echo",
            "entities": {},
        }
