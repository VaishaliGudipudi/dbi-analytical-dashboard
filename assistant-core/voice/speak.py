import pyttsx3


class Speaker:
    def __init__(self, rate: int = 180, volume: float = 1.0) -> None:
        self.engine = pyttsx3.init()
        self.engine.setProperty("rate", rate)
        self.engine.setProperty("volume", volume)

    def say(self, text: str) -> None:
        print(f"Assistant: {text}")
        self.engine.say(text)
        self.engine.runAndWait()
