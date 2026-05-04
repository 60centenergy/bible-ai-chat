import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AdminDashboard from './components/AdminDashboard';
import { Chat } from './types';
import { storageService } from './utils/storage';
import { generateId, generateChatTitle } from './utils/generateTitle';

interface AuthUser {
  username: string;
  isAdmin: boolean;
}

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize API key from environment on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // API key should be set via environment variable or config
      const key = import.meta.env.VITE_API_KEY || sessionStorage.getItem('apiKey');
      
      if (key) {
        setApiKey(key);
        
        // Verify the API key is valid
        try {
          const hostname = window.location.hostname;
          let apiUrl = 'https://bible-ai-backend-3flg.onrender.com/api';
          
          if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168')) {
            apiUrl = 'http://localhost:5000/api';
          }
          
          const response = await fetch(`${apiUrl}/auth/verify`, {
            method: 'POST',
            headers: { 'x-api-key': key }
          });
          
          if (response.ok) {
            const data = await response.json();
            setAuthUser({
              username: data.data.user.username,
              isAdmin: data.data.user.isAdmin
            });
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
        }
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Load chats from storage on mount (per-user storage)
  useEffect(() => {
    if (!authUser) return;
    
    const savedChats = storageService.getAllChats(authUser.username);
    setChats(savedChats);
    
    // Set current chat to most recent if available
    if (savedChats.length > 0) {
      setCurrentChatId(savedChats[0].id);
    }
  }, [authUser]);

  const handleLogout = () => {
    setApiKey(null);
    setAuthUser(null);
    setChats([]);
    setCurrentChatId(null);
    sessionStorage.removeItem('apiKey');
  };

  // If not authenticated, show loading or error
  if (!apiKey) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If no auth user loaded yet, wait
  if (!authUser && !isLoading) {
    return <div className="flex items-center justify-center h-screen">Authentication failed</div>;
  }

  // If admin, show admin dashboard
  if (authUser?.isAdmin) {
    return <AdminDashboard apiKey={apiKey} username={authUser.username} onLogout={handleLogout} />;
  }

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const handleNewChat = () => {
    if (!authUser) return;
    
    const newChat: Chat = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    storageService.saveChat(newChat, authUser.username);
    setCurrentChatId(newChat.id);
  };

  const handleSendMessage = (message: string) => {
    if (!currentChat || !authUser || !apiKey) return;

    const updatedChat = { ...currentChat };
    
    // Update title if this is the first message
    if (updatedChat.messages.length === 0) {
      updatedChat.title = generateChatTitle(message);
    }

    updatedChat.messages.push({
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    const updatedChats = chats.map(chat => 
      chat.id === currentChat.id ? updatedChat : chat
    );
    
    setChats(updatedChats);
    storageService.saveChat(updatedChat, authUser.username);

    // Track message in backend
    const hostname = window.location.hostname;
    const trackUrl = (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168'))
      ? 'http://localhost:5000/api/admin/track/message'
      : '/api/admin/track/message';
    
    fetch(trackUrl, {
      method: 'POST',
      headers: { 'x-api-key': apiKey }
    }).catch(err => console.error('Failed to track message:', err));
  };

  const handleAssistantMessage = (content: string, formattedContent?: string) => {
    if (!authUser || !apiKey) return;

    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(c => c.id === currentChatId);
      if (chatIndex === -1) return prevChats;

      const chatToUpdate = prevChats[chatIndex];
      const updatedChat = {
        ...chatToUpdate,
        messages: [
          ...chatToUpdate.messages,
          {
            id: generateId(),
            role: 'assistant' as const,
            content: content,
            formattedContent: formattedContent,
            timestamp: Date.now()
          }
        ]
      };

      const updatedChats = [
        updatedChat,
        ...prevChats.slice(0, chatIndex),
        ...prevChats.slice(chatIndex + 1)
      ];

      storageService.saveChat(updatedChat, authUser.username);
      return updatedChats;
    });
  };

  const handleDeleteChat = (chatId: string) => {
    if (!authUser) return;

    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    storageService.deleteChat(chatId, authUser.username);
    
    if (currentChatId === chatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const handleClearAllChats = () => {
    if (!authUser) return;

    setChats([]);
    setCurrentChatId(null);
    storageService.clearAllChats(authUser.username);
  };

  // Regular user chat interface
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onClearAll={handleClearAllChats}
        authToken={apiKey}
      />

      {/* Main Chat Area */}
      <div 
        className="flex-1 flex flex-col overflow-hidden"
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      >
        <ChatArea
          chat={currentChat}
          onSendMessage={handleSendMessage}
          onAssistantMessage={handleAssistantMessage}
          authToken={apiKey}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
}

export default App;
