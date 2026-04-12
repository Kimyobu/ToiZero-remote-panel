# ToiZero Remote Panel - AI Context Guide

## 📌 Project Overview
**ToiZero Panel** is a web dashboard and VS Code extension for the TOI/POSN Olympiad programming platform.
- **`backend/`**: Node.js API (Port 3001) for CMS connection and session management.
- **`frontend/`**: React Vite application for the Web Dashboard interface.
- **`vscode-ext/`**: VS Code extension enabling real-time workspace syncing and 1-click submit.

## 🤖 AI Instructions (Token Optimization)
To save context credits and reduce initial analysis time on new chats, **DO NOT** manually recursively read directories or guess file structures unless explicitly asked.

**If you need to understand file dependencies or find which file exports a specific function/component:**
1. Use `view_file` to read `toizero-context-pro/.context-advanced.txt`
2. This file contains the complete pre-mapped dependency graph and exports of all files.
3. Only use `view_file` on the specific source files (`.ts`, `.tsx`) when you need to read the actual logic.

Following these steps will drastically reduce context credit usage while keeping you fully aware of the architecture.
