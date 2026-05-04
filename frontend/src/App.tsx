import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { PasswordPrompt } from './components/PasswordPrompt';
import AdminDashboard from './components/AdminDashboard';
import { Chat } from './types';
import { storageService } from './utils/storage';
import { generateId, generateChatTitle } from './utils/generateTitle';

interface AuthUser {
  username: string;
  isAdmin: boolean;
}

function App() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    const user = sessionStorage.getItem('user');
    
    if (token && user) {
      setAuthToken(token);
      setAuthUser(JSON.parse(user));
    }
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
    setAuthToken(null);
    setAuthUser(null);
    setChats([]);
    setCurrentChatId(null);
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
  };

  const handlePasswordSubmit = () => {
    const dummyToken = 'static-site-token';
    const dummyUser: AuthUser = {
      username: 'user',
      isAdmin: false
    };
    setAuthToken(dummyToken);
    setAuthUser(dummyUser);
    sessionStorage.setItem('authToken', dummyToken);
    sessionStorage.setItem('user', JSON.stringify(dummyUser));
  };

  // If not authenticated, show password prompt
  if (!authToken || !authUser) {
    return <PasswordPrompt onPasswordSubmit={handlePasswordSubmit} />;
  }

  // If admin, show admin dashboard
  if (authUser.isAdmin) {
    return <AdminDashboard token={authToken} username={authUser.username} onLogout={handleLogout} />;
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
    if (!currentChat || !authUser || !authToken) return;

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
    fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/admin/track/message`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    }).catch(err => console.error('Failed to track message:', err));
  };

  const handleAssistantMessage = (content: string, formattedContent?: string) => {
    if (!authUser || !authToken) return;

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
        authToken={authToken}
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
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
}

export default App;
