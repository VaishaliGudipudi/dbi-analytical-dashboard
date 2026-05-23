import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    0: {
      transcript: string;
    };
    isFinal: boolean;
  }>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useVoiceSession({ onAudioCaptured }: { onAudioCaptured: (audioBlob: Blob) => Promise<void> | void }) {
  const STOP_PHRASE = "apply changes";
  const MAX_RECORDING_MS = 60000;

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [permissionState, setPermissionState] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");
  const [lastError, setLastError] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const onAudioCapturedRef = useRef(onAudioCaptured);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const monitorFrameRef = useRef<number | null>(null);
  const maxDurationTimeoutRef = useRef<number | null>(null);
  const shouldRestartRecognitionRef = useRef(false);

  useEffect(() => {
    onAudioCapturedRef.current = onAudioCaptured;
  }, [onAudioCaptured]);

  const cleanupAudioMonitoring = useCallback(() => {
    if (monitorFrameRef.current !== null) {
      cancelAnimationFrame(monitorFrameRef.current);
      monitorFrameRef.current = null;
    }

    if (maxDurationTimeoutRef.current !== null) {
      window.clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    shouldRestartRecognitionRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Best effort cleanup for flaky browser speech APIs.
      }
      recognitionRef.current = null;
    }

    sourceNodeRef.current?.disconnect();
    analyserRef.current?.disconnect();
    sourceNodeRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const refreshPermission = useCallback(async () => {
    try {
      if (!navigator.permissions?.query) {
        setPermissionState("unknown");
        return;
      }

      const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
      setPermissionState((current) => (current === status.state ? current : (status.state as "granted" | "denied" | "prompt")));
      status.onchange = () => {
        setPermissionState((current) => (current === status.state ? current : (status.state as "granted" | "denied" | "prompt")));
      };
    } catch {
      setPermissionState("unknown");
    }
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setSupported(false);
      return;
    }

    setSupported(true);
    void refreshPermission();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      cleanupAudioMonitoring();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      streamRef.current = null;
      recognitionRef.current = null;
    };
  }, [cleanupAudioMonitoring, refreshPermission]);

  const requestPermission = useCallback(async () => {
    try {
      setLastError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      await refreshPermission();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Microphone permission was denied.";
      setLastError(message);
      setPermissionState("denied");
      throw error;
    }
  }, [refreshPermission]);

  const stopListening = useCallback(() => {
    cleanupAudioMonitoring();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      setListening(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [cleanupAudioMonitoring]);

  const startListening = useCallback(async () => {
    if (permissionState !== "granted") {
      await requestPermission();
    }

    setLastError("");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });

    recorder.addEventListener("stop", async () => {
      setListening(false);
      cleanupAudioMonitoring();
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      try {
        await onAudioCapturedRef.current(blob);
      } catch (error) {
        setLastError(error instanceof Error ? error.message : "Audio upload failed.");
      }
    });

    recorder.addEventListener("error", (event) => {
      setListening(false);
      cleanupAudioMonitoring();
      setLastError(event.error?.message || "Audio recording failed.");
    });

    const RecognitionConstructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (RecognitionConstructor) {
      const recognition = new RecognitionConstructor();
      shouldRestartRecognitionRef.current = true;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      recognition.onresult = (event) => {
        let combinedTranscript = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          combinedTranscript += ` ${event.results[index][0].transcript}`;
        }

        const normalizedTranscript = combinedTranscript
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (normalizedTranscript.includes(STOP_PHRASE)) {
          shouldRestartRecognitionRef.current = false;
          stopListening();
        }
      };
      recognition.onerror = (event) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setLastError(`Stop phrase listener error: ${event.error}`);
        }
      };
      recognition.onend = () => {
        if (shouldRestartRecognitionRef.current && mediaRecorderRef.current?.state !== "inactive") {
          try {
            recognition.start();
          } catch {
            // Ignore browser restart races.
          }
        }
      };
      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch {
        setLastError("Could not start stop-phrase detection. You can still stop recording with the mic button.");
      }
    }

    recorder.start();
    maxDurationTimeoutRef.current = window.setTimeout(() => {
      shouldRestartRecognitionRef.current = false;
      stopListening();
    }, MAX_RECORDING_MS);
    setListening(true);
  }, [cleanupAudioMonitoring, permissionState, requestPermission, stopListening]);

  return useMemo(
    () => ({
      supported,
      listening,
      permissionState,
      lastError,
      requestPermission,
      startListening,
      stopListening,
    }),
    [supported, listening, permissionState, lastError, requestPermission, startListening, stopListening],
  );
}
