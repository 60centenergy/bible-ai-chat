# Setup Guide - Bible AI Chat

Quick start guide to get the Bible AI Chat application running.

## Prerequisites

- Windows 10/11
- Node.js 18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

## Step 1: Verify Node.js Installation

Open PowerShell and verify Node.js is installed:

```powershell
node --version
npm --version
```

Should show version numbers like `v18.x.x` and `10.x.x`.

## Step 2: Install Dependencies

From the project root directory:

```powershell
cd "C:\Users\Zack\SynologyDrive\Online Bible AI site\bible-ai-chat"
npm install
```

This will install dependencies for both frontend and backend automatically.

## Step 3: Start the Servers

### Option A: Start Both Servers (Recommended for Development)

From the root directory:

```powershell
npm run dev
```

You'll see output like:
- Backend: `🚀 Bible AI Server running on http://0.0.0.0:5000`
- Frontend: `VITE v5.0.0 ready in xxx ms` with local URL

### Option B: Start Servers Separately

Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```

Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
```

## Step 4: Access the Application

Open your browser and go to:
- **Local Machine**: http://localhost:5173
- **From Other Machines on Network**: http://<YOUR_MACHINE_IP>:5173

To find your machine IP:
```powershell
ipconfig
# Look for "IPv4 Address" under your active network
```

## Step 5: Verify Everything Works

1. ✅ Frontend loads at http://localhost:5173
2. ✅ See the "Bible AI Chat" home screen
3. ✅ Click "New Chat" button
4. ✅ Type a message and press Enter
5. ✅ AI responds with a message

## Troubleshooting

### Port Already in Use

If you get "Port 5000 already in use" or "Port 5173 already in use":

```powershell
# Kill process on port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### npm install fails

Try clearing npm cache:
```powershell
npm cache clean --force
rm -r node_modules
npm install
```

### API Connection Error

Make sure:
1. Backend is running on port 5000
2. Check .env file has GROQ_API_KEY set
3. Check browser console (F12) for error details

### Module Not Found

Try reinstalling dependencies:
```powershell
npm install
```

## Development Workflow

1. **Make changes to frontend** - Auto-reloads at http://localhost:5173
2. **Make changes to backend** - Auto-reloads (using `--watch` flag)
3. **Check console errors** - Press F12 in browser for frontend errors
4. **Check terminal** - Backend errors appear in terminal

## Next: Provide System Prompt

Once everything is running, let me know and you can provide the custom system prompt for the Bible AI. This will control how the AI responds to questions.

## Support Files

- `README.md` - Full project documentation
- `.env` - Configuration (already set with Groq API key)
- `backend/src/index.ts` - Backend server code
- `frontend/src/App.tsx` - Frontend main app component
