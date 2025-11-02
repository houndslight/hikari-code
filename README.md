# 🌸 Hikari — Lightweight Coding Chatbot

**Hikari** is a free and open-source coding assistant built for people with older or lower-end computers.  
It helps you **write, fix, and explain code** using modern open models that run locally — no internet required once installed.

This project was created to make AI-powered development **accessible everywhere** 🌍.

---

## 🧠 Features

- 💻 Runs entirely **offline** using [Ollama](https://ollama.com)
- ⚡ Works fast even on low-VRAM GPUs or CPUs
- 🪶 Simple, minimalist Japanese-inspired web UI
- 🧩 Supports small coding models like:
  - `phi3:mini` (Microsoft — very efficient)
  - `codellama:7b-instruct`
  - `deepseek-coder:1.3b-instruct`

---

## 🧰 Requirements

Before starting, make sure you have:

| Tool | Description | Download |
|------|--------------|-----------|
| **Python 3.10+** | Needed for the backend (FastAPI) | [python.org/downloads](https://www.python.org/downloads/) |
| **Node.js 18+** | Needed for the frontend build | [nodejs.org](https://nodejs.org/) |
| **Ollama** | Runs the AI model locally | [ollama.com/download](https://ollama.com/download) |

🖥️ Recommended minimum hardware:  
**Ryzen 5 / i5 CPU**, 8 GB RAM, optional GPU (4 GB VRAM or higher).

---

## 🚀 Quick Start

### 1️⃣ Clone or download Hikari

```bash
git clone https://github.com/YOURUSERNAME/hikari.git
cd hikari
```

---

### 2️⃣ Install the backend (AI server)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Then start the server:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8080
```

If it works, you’ll see:

```
✓ Ollama is available
Uvicorn running on http://0.0.0.0:8080
```

---

### 3️⃣ Install Ollama and pull a model

Go to [https://ollama.com/download](https://ollama.com/download) and install it.

Then open a terminal and type:

```bash
ollama pull phi3:mini
```

🟢 *Phi-3 Mini* is small, fast, and great for writing code.

---

### 4️⃣ Build the web UI (frontend)

```bash
cd ../frontend
npm install
npm run build
```

When it finishes, you’ll see a new folder called `dist/`.

---

### 5️⃣ Open the chatbot

Go back to the backend folder and start Hikari again:

```bash
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8080
```

Now open your browser and visit:

👉 **http://localhost:8080**

You should see your Hikari chat window appear 🌸  
Type something like:

> write me a hello world in python

---

## 🧩 Common Problems & Fixes

| Problem | Cause | Fix |
|----------|--------|-----|
| ❌ `sh : command not found` | You tried to run Linux install commands on Windows. | Use the **Windows Ollama installer** from the [download page](https://ollama.com/download). |
| ⚠️ `No backends available!` | Ollama isn’t running or no model is pulled. | Run `ollama pull phi3:mini`, then restart the backend. |
| ❌ `uvicorn: command not found` | FastAPI server not installed in the virtual environment. | Run `pip install fastapi uvicorn httpx` inside `backend/venv`. |
| ⚠️ `Static directory not found` | You haven’t built the frontend yet. | Run `npm run build` inside `frontend/`. |
| 🧱 `EPERM: operation not permitted, stat 'postcss-nested'` | Windows permission lock on `node_modules`. | Close VS Code, delete `node_modules`, run `npm install` again as Administrator. |
| 😵 "Sorry, I encountered an error" in web UI | Frontend expected JSON but backend sent a stream. | Make sure your backend has the **non-streaming fix** enabled (see docs below). |
| 🐢 Everything is slow | Running a big model on CPU. | Try `phi3:mini` instead of `codellama:7b-instruct`. |

---

## 🧠 Tips for Low-Spec PCs

- Use `phi3:mini` or `tinyllama:1.1b` for best performance.  
- Keep the **FastAPI window open** while using Hikari.  
- Close browsers/tabs to free up RAM.  
- To move models to another drive:  
  ```powershell
  mklink /D "C:\Users\<YourUser>\.ollama\models" "D:\LLMs\models"
  ```

---

## 🧩 Folder Structure

```
hikari/
 ├── backend/         # FastAPI + Ollama server
 │   ├── main.py
 │   ├── requirements.txt
 ├── frontend/        # Web UI built with Vite
 │   ├── dist/
 │   ├── package.json
 └── README.md
```

---

## 💡 Future Updates

- Real-time typing (streaming responses)  
- More supported models  
- Offline installer package  
- UI themes (Rose Pine / Tokyo Night)

---

## 🪴 License

Released under the **MIT License**.  
You’re free to use, modify, and share — just credit **Houndslight / Hikari**.

---

### 🌸 Created with love by [Houndslight](https://houndslight.online)
> “From us, to you — harness your empty desires.”
