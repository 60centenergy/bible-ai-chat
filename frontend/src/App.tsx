import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AdminDashboard from './components/AdminDashboard';
import { PasswordPrompt } from './components/PasswordPrompt';
import { Chat } from './types';
import { storageService } from './utils/storage';
import { generateId, generateChatTitle } from './utils/generateTitle';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if already authenticated in this session
  useEffect(() => {
    const isAuth = sessionStorage.getItem('authenticated') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      loadChats();
    }
  }, []);

  const loadChats = () => {
    const savedChats = storageService.getAllChats('user');
    setChats(savedChats);
    if (savedChats.length > 0) {
      setCurrentChatId(savedChats[0].id);
    }
  };

  const handlePasswordSubmit = () => {
    sessionStorage.setItem('authenticated', 'true');
    setIsAuthenticated(true);
    loadChats();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setChats([]);
    setCurrentChatId(null);
    sessionStorage.removeItem('authenticated');
  };

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return <PasswordPrompt onPasswordSubmit={handlePasswordSubmit} />;
  }

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    storageService.saveChat(newChat, 'user');
    setCurrentChatId(newChat.id);
  };

  const handleSendMessage = (message: string) => {
    if (!currentChat) return;

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
    storageService.saveChat(updatedChat, 'user');
  };

  const handleAssistantMessage = (content: string, formattedContent?: string) => {
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

      storageService.saveChat(updatedChat, 'user');
      return updatedChats;
    });
  };

  const handleDeleteChat = (chatId: string) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    storageService.deleteChat(chatId, 'user');
    
    if (currentChatId === chatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const handleClearAllChats = () => {
    setChats([]);
    setCurrentChatId(null);
    storageService.clearAllChats('user');
  };

  // Chat interface
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
        onLogout={handleLogout}
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
