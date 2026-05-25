# Assistant Core - Phase 1

This module is the first building block of your Jarvis-style assistant.

In this phase, the assistant will:

1. Speak a startup message.
2. Record your voice from the microphone.
3. Convert speech to text using Whisper.
4. Speak the recognized text back to you.
5. Optionally test the same flow from a simple local browser page.

## Folder structure

```text
assistant-core/
│
├── main.py
├── assistant_service.py
├── requirements.txt
│
├── voice/
│   ├── __init__.py
│   ├── listen.py
│   └── speak.py
│
├── web/
│   ├── index.html
│   └── server.py
│
├── ai/
│   ├── __init__.py
│   └── intent_parser.py
│
├── router/
│   ├── __init__.py
│   └── command_router.py
│
└── skills/
    ├── __init__.py
    ├── apps/
    │   └── README.md
    ├── browser/
    │   └── README.md
    ├── system/
    │   └── README.md
    └── utilities/
        └── README.md
```

## What you need to install on Windows

### 1. Install Python

1. Download Python 3.11 or newer from the official Python website:
   https://www.python.org/downloads/windows/
2. During installation, make sure you check:
   `Add Python to PATH`
3. Finish the install.

### 2. Verify Python is installed

Open a new terminal in VS Code and run:

```powershell
python --version
```

Expected result:

```text
Python 3.11.x
```

If `python` does not work, try:

```powershell
py --version
```

### 3. Install FFmpeg

Whisper needs FFmpeg to process audio correctly.

Recommended Windows install using Chocolatey:

```powershell
choco install ffmpeg
```

If you do not have Chocolatey, install FFmpeg manually:

1. Download FFmpeg from:
   https://www.gyan.dev/ffmpeg/builds/
2. Extract it.
3. Add the `bin` folder to your Windows PATH.
4. Restart VS Code after updating PATH.

Verify FFmpeg:

```powershell
ffmpeg -version
```

### 4. Create and activate a virtual environment

In VS Code terminal, move into the assistant folder:

```powershell
cd assistant-core
```

Create the virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then activate again:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 5. Install Python packages

With the virtual environment activated, run:

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

This installs the Render-friendly text backend only.

If you also want local voice features, install the optional voice stack:

```powershell
pip install -r requirements.voice.txt
```

### 6. Optional: install Ollama

Download and install Ollama from:

https://ollama.com/download

Then start the local Ollama service:

```powershell
ollama serve
```

### 7. Optional: pull the default medical model

The copilot backend now defaults to `meditron:7b`, which is an official Ollama medical model.

Pull it once:

```powershell
ollama pull meditron:7b
```

Verify it:

```powershell
ollama list
```

## How to run Phase 1

From inside `assistant-core` with the virtual environment active:

```powershell
python main.py
```

## How to run the dummy frontend

This gives you a single browser page for testing instead of only using the terminal.

From inside `assistant-core` with the virtual environment active:

```powershell
python web\server.py
```

Then open this URL in your browser:

```text
http://127.0.0.1:8000
```

Then:

1. Click `Ask Microphone Permission`
2. When the browser shows the permission popup, click `Allow`
3. Click `Start Voice Test`
4. Speak into your microphone for about 5 seconds
5. Wait while the browser uploads the audio to the local Python assistant
6. Watch the transcript appear on the page
7. Hear the assistant reply spoken by the browser

## How to run the copilot backend for the React app

The same Python backend now also exposes local APIs for:

1. command understanding
2. encounter summaries
3. workflow recommendations

Start it from inside `assistant-core`:

```powershell
python web\server.py
```

The frontend is configured to call:

```text
http://127.0.0.1:8000
```

If you want to override that later in the React app, use:

```text
VITE_COPILOT_API_BASE=http://127.0.0.1:8000
```

## Deploy on Render

The backend now supports Render-friendly text mode:

1. It binds to `0.0.0.0:$PORT`
2. Voice features are optional
3. The LLM provider is configured using environment variables

If you use the root `render.yaml`, Render can create the service automatically. If you configure it manually, use:

```text
Root Directory: assistant-core
Build Command: pip install -r requirements.txt
Start Command: python web/server.py
Health Check Path: /health
```

Recommended environment variables:

```text
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Supported values for `LLM_PROVIDER`:

```text
openai
openai-compatible
ollama
disabled
```

Notes:

1. `ollama` is still useful for local development.
2. `openai-compatible` also works with providers that expose a compatible `/v1/chat/completions` API.
3. Voice endpoints may be unavailable on Render unless you separately install `requirements.voice.txt`.

## What should happen

1. The assistant says:
   `Assistant core is ready. I will listen after the beep.`
2. Your microphone records for a few seconds.
3. Whisper converts your speech into text.
4. The terminal prints the recognized text.
5. The assistant speaks:
   `You said: ...`

## First run note about Whisper models

On the first run, Whisper may download the selected model automatically.
That can take a little time depending on your internet speed.
During that first run, the browser page should now show live progress messages instead of appearing frozen.

## How the code is organized

### `main.py`

The entry point of the assistant.
It connects listening and speaking together.

### `assistant_service.py`

This is the shared service layer.
It keeps the voice workflow reusable so both:

1. the terminal runner
2. the browser demo

can use the same assistant logic.

### `voice/listen.py`

Handles:

1. microphone recording
2. temporary WAV file creation
3. Whisper transcription

### `voice/speak.py`

Handles offline text-to-speech using `pyttsx3`.

### `web/server.py`

Runs a tiny local Python web server.
It exposes:

1. `/` for the demo page
2. `/api/voice-cycle` for the voice test action
3. `/api/copilot/command` for command parsing
4. `/api/copilot/summary` for encounter summaries
5. `/api/copilot/recommendations` for workflow nudges and suggestions

### `web/index.html`

The temporary single-file frontend for easy testing.
It calls the local Python server and displays:

1. status
2. transcript
3. assistant reply

### `ai/llm_client.py`

Selects between local Ollama and a hosted OpenAI-compatible LLM API.

### `ai/copilot_service.py`

This is the first real reasoning layer for the copilot.
It handles:

1. command parsing
2. summary generation
3. recommendation generation

### `ai/intent_parser.py`

A placeholder for the future command understanding layer.
Not used yet in Phase 1.

### `router/command_router.py`

A placeholder for the future command routing layer.
Not used yet in Phase 1.

## Debugging guide

### Problem: `python is not recognized`

Fix:

1. Reinstall Python.
2. Make sure `Add Python to PATH` is checked.
3. Restart VS Code.

### Problem: `ffmpeg is not recognized`

Fix:

1. Confirm FFmpeg is installed.
2. Confirm the FFmpeg `bin` folder is in PATH.
3. Restart VS Code terminal.

### Problem: microphone is not recording

Fix:

1. Check Windows microphone permissions.
2. Go to:
   `Settings > Privacy & security > Microphone`
3. Make sure microphone access is enabled.
4. Make sure VS Code is allowed to use the microphone.

### Problem: no text is recognized

Fix:

1. Speak clearly.
2. Move closer to the microphone.
3. Increase the recording duration in `voice/listen.py`.
4. Try a quieter room.

### Problem: text-to-speech does not speak

Fix:

1. Check Windows sound output.
2. Make sure speakers or headphones are connected.
3. Try running the file again.

### Problem: browser page opens but button fails

Fix:

1. Make sure the Python server is still running.
2. Confirm you started:
   ```powershell
   python web\server.py
   ```
3. Confirm you opened:
   `http://127.0.0.1:8000`
4. Check the VS Code terminal for the exact error.

### Problem: the browser never asks for microphone permission

Fix:

1. Use `http://127.0.0.1:8000` exactly, not a local file opened directly.
2. Click `Ask Microphone Permission`
3. Check the browser address bar for a blocked microphone icon
4. In Chrome or Edge, allow microphone access for this local page and refresh

### Problem: Whisper install fails

Fix:

1. Upgrade pip:
   ```powershell
   pip install --upgrade pip
   ```
2. Install wheel tools:
   ```powershell
   pip install wheel setuptools setuptools-rust
   ```
3. Run:
   ```powershell
   pip install -r requirements.voice.txt
   ```

### Problem: copilot requests fail with hosted LLM errors

Fix:

1. Confirm `LLM_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_BASE_URL` are set correctly.
2. Confirm your hosted provider supports `/v1/chat/completions`.
3. Check Render logs for the returned HTTP error body.

### Problem: copilot requests fail with Ollama errors

Fix:

1. Make sure Ollama is running:
   ```powershell
   ollama serve
   ```
2. Make sure the default model is pulled:
   ```powershell
   ollama pull meditron:7b
   ```
3. Test the model directly:
   ```powershell
   ollama run meditron:7b
   ```

## Next phase later

Later we can add:

1. continuous listening
2. wake word detection
3. intent parsing
4. command routing
5. skill plugins

This current structure is already prepared for that expansion.
