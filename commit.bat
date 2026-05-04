@echo off
cd /d "c:\Users\zamos\SynologyDrive\Online Bible AI site\bible-ai-chat"
"C:\Program Files\Git\bin\git.exe" add backend/src/index.ts
"C:\Program Files\Git\bin\git.exe" commit -m "Fix: Aggressive CORS headers with res.header() and /api/test endpoint for diagnosis"
"C:\Program Files\Git\bin\git.exe" push origin main
pause
