# Bible AI Chat - Interactive Bible Assistant

A modern, polished web application for chatting with an AI-powered Bible assistant. Built with React, TypeScript, and Express.js.

## Features

- 💬 **Interactive Chat Interface** - Clean, modern chat UI similar to ChatGPT
- 📱 **Mobile Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 💾 **Chat History** - Up to 30 chats stored locally with auto-save
- 📊 **Sidebar Navigation** - Easy access to all past conversations
- 📄 **PDF Export** - Export entire chats to PDF format
- 🗑️ **Chat Management** - Delete individual chats or clear all at once
- 🔄 **Persistent Formatting** - Message formatting preserved across sessions
- 🌐 **Network Accessible** - Access from any device on your local network

## Project Structure

```
bible-ai-chat/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Styles
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Express.js backend
│   ├── src/
│   │   └── index.ts         # Main server file
│   ├── package.json
│   └── tsconfig.json
│
├── .env                      # Environment variables
├── .env.example              # Example environment file
└── package.json              # Root workspace config
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **API**: Groq (llama-based models)
- **Storage**: LocalStorage + IndexedDB
- **Export**: jsPDF + html2canvas

## Prerequisites

- Node.js 18+ and npm
- Groq API key (already configured)

## Installation & Setup

### 1. Install Dependencies

```bash
# Install all dependencies (frontend and backend)
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with:
- Groq API Key
- Model: openai/gpt-oss-120b
- Server port: 5000
- Frontend API URL: http://localhost:5000/api

### 3. Start Development Servers

```bash
# Option 1: Run both frontend and backend (from root directory)
npm run dev

# Option 2: Run separately
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Access the Application

- **Local**: http://localhost:5173
- **Network**: http://<your-machine-ip>:5173
  - Find your machine IP with: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

## Usage

1. **Start a New Chat** - Click "New Chat" in the sidebar
2. **Ask Questions** - Type your question and press Enter
3. **View History** - All chats are listed in the sidebar
4. **Export Chat** - Click options menu (⋮) and select "Export PDF"
5. **Delete Chat** - Click options menu (⋮) and select "Delete"
6. **Clear All** - Click "Clear All" button to remove all chats
7. **Responsive Design** - On mobile, toggle sidebar with menu button

## Configuration

### System Prompt

To customize the AI's behavior, you'll provide a system prompt that defines its personality and guidelines. This will be integrated into the backend API calls.

### API Endpoint

- **POST** `/api/chat` - Send messages and get AI responses
- **GET** `/api/health` - Check server status

### Max Chats

Default: 30 chats stored locally. Adjust in `frontend/src/utils/storage.ts` if needed.

## Building for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
cd backend
npm run start
```

Frontend files will be in `frontend/dist/`, ready to be served by the backend.

## Network Access

The application is configured to:
- Listen on all network interfaces (0.0.0.0)
- Allow cross-origin requests (CORS)
- Be accessible from any device on the same network

## Known Limitations

- LocalStorage has a ~5-10MB limit (sufficient for ~30 chats)
- PDF export depends on browser capabilities
- Network access limited to devices on the same network (by default)

## Next Steps

1. Add custom system prompt for the Bible AI behavior
2. Test on mobile devices
3. Deploy to a public domain (when ready)
4. Add user authentication (if needed)
5. Add database backend (if moving beyond local storage)

## Support

For issues or questions, check the browser console (F12) for detailed error messages.
