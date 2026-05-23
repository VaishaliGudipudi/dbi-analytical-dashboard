from assistant_service import AssistantService
from voice.listen import TranscriptionError


def main() -> None:
    service = AssistantService()

    try:
        result = service.run_voice_cycle()
        print(f"Recognized text: {result['transcript']}")
    except TranscriptionError as error:
        print(f"Transcription error: {error}")
    except Exception as error:
        print(f"Unexpected error: {error}")


if __name__ == "__main__":
    main()
