# Project Structure

Complete file structure of the Bible AI Chat project.

```
bible-ai-chat/
│
├── frontend/                          # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx               # Main app component
│   │   │   ├── Sidebar.tsx           # Sidebar with chat list
│   │   │   ├── ChatListItem.tsx      # Individual chat in sidebar
│   │   │   ├── ChatArea.tsx          # Main chat interface
│   │   │   ├── MessageList.tsx       # Display messages
│   │   │   ├── ChatInput.tsx         # Message input box
│   │   │   └── HomeScreen.tsx        # Welcome screen
│   │   │
│   │   ├── services/
│   │   │   └── apiService.ts         # Backend API communication
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   │
│   │   ├── utils/
│   │   │   ├── storage.ts            # LocalStorage management
│   │   │   ├── exportPdf.ts          # PDF export functionality
│   │   │   └── generateTitle.ts      # Chat title generation
│   │   │
│   │   ├── main.tsx                  # React entry point
│   │   ├── App.tsx                   # App component (moved to components)
│   │   └── index.css                 # Global styles with Tailwind
│   │
│   ├── public/                        # Static assets
│   ├── index.html                     # HTML entry point
│   ├── package.json                   # Frontend dependencies
│   ├── tsconfig.json                  # TypeScript config
│   ├── tsconfig.node.json             # TS config for Vite
│   ├── vite.config.ts                 # Vite build config
│   ├── tailwind.config.js             # Tailwind CSS config
│   └── postcss.config.js              # PostCSS config
│
├── backend/                           # Express TypeScript backend
│   ├── src/
│   │   └── index.ts                  # Express server & API routes
│   │
│   ├── package.json                   # Backend dependencies
│   └── tsconfig.json                  # TypeScript config
│
├── .env                               # Environment variables (configured)
├── .env.example                       # Example environment file
├── .npmrc                             # npm configuration
├── .gitignore                         # Git ignore rules
├── package.json                       # Root workspace config
├── README.md                          # Full documentation
├── SETUP.md                           # Quick start guide
└── PROJECT_STRUCTURE.md               # This file
```

## Key Files Description

### Frontend Components

| File | Purpose |
|------|---------|
| `App.tsx` | Main app container, manages chat state |
| `Sidebar.tsx` | Left sidebar with chat list and controls |
| `ChatListItem.tsx` | Individual chat item with export/delete options |
| `ChatArea.tsx` | Main chat display area |
| `MessageList.tsx` | Renders all messages in current chat |
| `ChatInput.tsx` | Text input and send button |
| `HomeScreen.tsx` | Welcome/information screen |

### Frontend Services & Utils

| File | Purpose |
|------|---------|
| `apiService.ts` | Axios client for backend communication |
| `storage.ts` | LocalStorage CRUD operations for chats |
| `exportPdf.ts` | jsPDF integration for chat export |
| `generateTitle.ts` | Auto-generate chat titles from first message |
| `types/index.ts` | Shared TypeScript interfaces |

### Backend

| File | Purpose |
|------|---------|
| `index.ts` | Express server, Groq API integration, endpoints |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` | API keys, ports, environment settings |
| `vite.config.ts` | Frontend build and dev server config |
| `tsconfig.json` | TypeScript compiler options |
| `tailwind.config.js` | Tailwind CSS theme and plugins |
| `package.json` | Dependencies and scripts |

## Data Flow

```
User Types Message
    ↓
ChatInput Component captures text
    ↓
App.tsx: handleSendMessage() called
    ↓
Message added to current chat
    ↓
storageService.saveChat() updates LocalStorage
    ↓
apiService.sendMessage() → Backend
    ↓
Backend calls Groq API
    ↓
Response formatted and returned
    ↓
App.tsx: onAssistantMessage() called
    ↓
AI response added to chat
    ↓
storageService.saveChat() updates LocalStorage
    ↓
MessageList re-renders with new message
```

## Storage Structure

### LocalStorage Key: `bible-ai-chats`

```json
[
  {
    "id": "1714376400000z6...",
    "title": "What is the meaning of John 3:16?",
    "messages": [
      {
        "id": "1714376400001a2...",
        "role": "user",
        "content": "What is the meaning of John 3:16?",
        "timestamp": 1714376400000,
        "formattedContent": null
      },
      {
        "id": "1714376401000b3...",
        "role": "assistant",
        "content": "John 3:16 is...",
        "timestamp": 1714376401000,
        "formattedContent": "<p>John 3:16 is...</p>"
      }
    ],
    "createdAt": 1714376400000,
    "updatedAt": 1714376401000
  }
]
```

## API Endpoints

### Health Check
```
GET /api/health
Response: { success: true, data: { status: "OK" } }
```

### Chat Message
```
POST /api/chat
Request: { messages: [{ role: "user|assistant", content: "..." }] }
Response: { 
  success: true, 
  data: { 
    content: "AI response...",
    formattedContent: "<p>AI response...</p>"
  } 
}
```

## Dependencies Summary

### Frontend
- `react` 18 - UI framework
- `vite` 5 - Build tool
- `tailwindcss` 3 - Styling
- `axios` - HTTP client
- `jspdf` & `html2canvas` - PDF export
- `lucide-react` - Icons

### Backend
- `express` 4 - Web framework
- `groq-sdk` - Groq AI API
- `cors` - Cross-origin support
- `dotenv` - Environment variables

## Development Tips

1. **Hot Reload** - Both frontend and backend auto-reload on file changes
2. **TypeScript** - Full type safety across frontend and backend
3. **Tailwind** - JIT CSS compilation, see `tailwind.config.js`
4. **LocalStorage** - Max ~5-10MB (plenty for 30 chats)
5. **CORS** - Currently allows all origins, restrict as needed

## Build Output

- **Frontend**: `frontend/dist/` - Static files for production
- **Backend**: `backend/dist/` - Compiled JavaScript
