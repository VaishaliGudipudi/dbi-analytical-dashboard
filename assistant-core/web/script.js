const startButton = document.getElementById("startButton");
const permissionButton = document.getElementById("permissionButton");
const statusElement = document.getElementById("status");
const transcriptElement = document.getElementById("transcript");
const replyElement = document.getElementById("reply");
let activeJobId = null;
let mediaStream = null;

function speakReply(text) {
  if (!("speechSynthesis" in window) || !text) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function ensureMicrophonePermission() {
  if (mediaStream) {
    return mediaStream;
  }

  statusElement.textContent = "Requesting microphone permission from the browser...";
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  statusElement.textContent = "Microphone permission granted.";
  return mediaStream;
}

function stopTracks(stream) {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => track.stop());
}

function recordForFiveSeconds(stream) {
  return new Promise((resolve, reject) => {
    const mimeType = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    const chunks = [];
    let secondsLeft = 5;

    statusElement.textContent = "Recording starts now.";
    transcriptElement.textContent = "Listening...";
    replyElement.textContent = "Recording your voice...";

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });

    recorder.addEventListener("stop", () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      resolve(blob);
    });

    recorder.addEventListener("error", (event) => {
      reject(event.error || new Error("Browser recording failed."));
    });

    recorder.start();

    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        statusElement.textContent = `Recording... ${secondsLeft} second(s) left`;
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      recorder.stop();
    }, 5000);
  });
}

function updateUiFromJob(data) {
  const latestMessage = data.history && data.history.length
    ? data.history[data.history.length - 1]
    : "Working...";

  statusElement.textContent = data.done
    ? data.error
      ? "Error"
      : data.success
        ? "Success"
        : "Completed with no speech recognized."
    : latestMessage;

  transcriptElement.textContent = data.transcript || "Waiting for transcript...";
  replyElement.textContent = data.error || data.reply || "Waiting for assistant reply...";
}

async function pollJob(jobId) {
  while (activeJobId === jobId) {
    const response = await fetch(`/api/voice-cycle/status/${jobId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not read voice job status.");
    }

    updateUiFromJob(data);

    if (data.done) {
      startButton.disabled = false;
      activeJobId = null;
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function runVoiceCycle() {
  startButton.disabled = true;
  permissionButton.disabled = true;
  statusElement.textContent = "Starting voice test...";
  transcriptElement.textContent = "Waiting for transcript...";
  replyElement.textContent = "Waiting for assistant reply...";

  try {
    const stream = await ensureMicrophonePermission();
    const audioBlob = await recordForFiveSeconds(stream);
    stopTracks(stream);
    mediaStream = null;

    statusElement.textContent = "Uploading audio to the local assistant...";

    const response = await fetch("/api/browser-voice-cycle", {
      method: "POST",
      headers: {
        "Content-Type": audioBlob.type || "audio/webm"
      },
      body: audioBlob
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "The voice test failed.");
    }

    statusElement.textContent = data.success
      ? "Success"
      : "Completed, but no speech was recognized.";
    transcriptElement.textContent = data.transcript || "No text recognized.";
    replyElement.textContent = data.reply || "No reply returned.";
    speakReply(data.reply || "");
  } catch (error) {
    activeJobId = null;
    stopTracks(mediaStream);
    mediaStream = null;
    statusElement.textContent = "Error";
    transcriptElement.textContent = "No transcript available.";
    replyElement.textContent = error.message;
    startButton.disabled = false;
    permissionButton.disabled = false;
    return;
  }

  startButton.disabled = false;
  permissionButton.disabled = false;
}

permissionButton.addEventListener("click", async () => {
  permissionButton.disabled = true;
  try {
    const stream = await ensureMicrophonePermission();
    stopTracks(stream);
    mediaStream = null;
    replyElement.textContent = "Browser microphone access is allowed.";
  } catch (error) {
    statusElement.textContent = "Permission denied or unavailable.";
    replyElement.textContent = error.message;
  } finally {
    permissionButton.disabled = false;
  }
});

startButton.addEventListener("click", runVoiceCycle);
