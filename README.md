# ToiZero Remote Panel

Custom dashboard for [TOI Coding](https://toi-coding.informatics.buu.ac.th/00-pre-toi) — replacing manual website usage with a powerful local client.

## Features

- 📋 **Task Overview** — task list with filters, search, status colors
- 📄 **PDF Viewer** — embedded PDF.js with fallback filename detection  
- 📤 **Submit System** — drag & drop upload + CSRF token extraction
- 📚 **Submission History** — per-task history with result colors
- 📁 **Local File Integration** — auto-detect solution files from local folder
- 📝 **Notes Editor** — markdown editor with autosave per task
- ⚡ **Activity Feed** — last opened, submitted, refreshed
- 🛠️ **Dev Console** — live HTTP request log
- 🌙 **Dark Mode** — compact, keyboard-friendly UI

## Prerequisites

- Node.js 18+
- npm 8+

## Quick Start

```bash
# 1. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# 2. Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env:
#   TOI_LOCAL_PATH=/path/to/your/TOI   ← your local TOI folder
#   PORT=3001

# 3. Run both servers
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

## How to Get Session Cookie

1. Open [TOI Coding](https://toi-coding.informatics.buu.ac.th) and log in
2. Press `F12` → Application → Cookies
3. Copy the value of `00-pre-toi_login`
4. Paste it in the app's Connect dialog

## Local Folder Structure

```
TOI/
├── A1-001/
│   ├── solution.py      # auto-detected, quick submit
│   ├── notes.md         # editable notes (autosaved)
│   └── problem.pdf      # local PDF (optional)
├── A1-002/
│   ├── main.cpp
│   └── notes.md
```

Set `TOI_LOCAL_PATH` in `backend/.env` to point to this folder.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus search |
| `Enter` | Open selected task |
| `Ctrl+Enter` | Submit solution |
| `Escape` | Close/blur |

## Architecture

```
ToiZero-remote-panel/
├── backend/               # Express backend (port 3001)
│   └── src/
│       ├── server.ts      # Express entry point
│       ├── toiClient.ts   # HTTP layer (axios + cookie + throttle)
│       ├── parser.ts      # HTML parsing (cheerio)
│       └── routes/        # API endpoints
│           ├── auth.ts    # Session validation
│           ├── tasks.ts   # Task list + detail
│           ├── pdf.ts     # PDF proxy + fallback
│           ├── submit.ts  # Submission
│           ├── local.ts   # Local file system
│           └── devlog.ts  # Request log
│
└── frontend/              # React + Vite (port 5173)
    └── src/
        ├── components/    # UI components
        ├── pages/         # Login, Dashboard
        ├── stores/        # Zustand state (auth, tasks, settings)
        └── api/           # Axios client
```
