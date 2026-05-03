import { useEffect, useRef, useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Chat } from '../types';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import HomeScreen from './HomeScreen';

interface ChatAreaProps {
  chat: Chat | undefined;
  onSendMessage: (message: string) => void;
  onAssistantMessage: (content: string, formattedContent?: string) => void;
  authToken?: string;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function ChatArea({
  chat,
  onSendMessage,
  onAssistantMessage,
  authToken,
  onToggleSidebar,
  sidebarOpen
}: ChatAreaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Pass hamburger button to HomeScreen via context or wrapper
  const homeScreenWithButton = (
    <div className="w-full h-full relative">
      {onToggleSidebar && !sidebarOpen && (
        <button
          onClick={onToggleSidebar}
          className="lg:hidden absolute top-6 left-4 p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition z-10"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
      )}
      <HomeScreen />
    </div>
  );

  // Handle scroll detection for the scroll-to-previous button
  const handleScroll = useCallback(() => {
    if (chat?.messages) {
      const userMessages = chat.messages.filter(m => m.role === 'user');
      // Show button if there are multiple user messages
      setShowScrollButton(userMessages.length > 1);
    }
  }, [chat?.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  // Attach scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Scroll to the last user prompt that isn't currently in view
  const scrollToPreviousQuestion = () => {
    if (!chat?.messages || !messagesContainerRef.current) return;

    const userMessages = chat.messages.filter(m => m.role === 'user');
    if (userMessages.length < 2) return;

    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const viewportBottom = scrollTop + container.clientHeight;

    // Find the most recent (last) user message that's NOT currently in view
    // and is above the current viewport
    let targetMessage = null;

    for (let i = userMessages.length - 1; i >= 0; i--) {
      const element = document.getElementById(`message-${userMessages[i].id}`);
      if (element) {
        // Calculate position relative to container using getBoundingClientRect
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // Position relative to the scroll container
        const messageTop = elementRect.top - containerRect.top + scrollTop;
        const messageBottom = messageTop + element.offsetHeight;

        // Check if message is in view
        const isInView = messageBottom > scrollTop && messageTop < viewportBottom;

        // We want the most recent message that's NOT in view and is above the viewport
        if (!isInView && messageTop < scrollTop) {
          targetMessage = messageTop;
          break;
        }
      }
    }

    // Scroll to the target message if found
    // Position it right below the header for a clean look
    if (targetMessage !== null) {
      // Use the header ref to get accurate height
      let headerHeight = 80; // default fallback
      
      if (headerRef.current) {
        headerHeight = headerRef.current.offsetHeight;
      }
      
      // Position message right below header with no extra margin
      const offsetScroll = Math.max(0, targetMessage - headerHeight);
      container.scrollTo({
        top: offsetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!chat) return;

    // Add user message
    onSendMessage(message);
    setIsLoading(true);

    try {
      // Import API service here to avoid circular dependencies
      const { apiService } = await import('../services/apiService');

      // Prepare messages for API
      const messagesForApi = [
        ...chat.messages,
        { role: 'user' as const, content: message }
      ];

      // Send to API
      const response = await apiService.sendMessage({
        messages: messagesForApi
      }, authToken);

      // Add assistant message
      onAssistantMessage(response.content, response.formattedContent);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      onAssistantMessage(
        `Error: ${errorMessage}`,
        `<p style="color: red;">Error: ${errorMessage}</p>`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!chat) {
    return homeScreenWithButton;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div 
        ref={headerRef}
        className="border-b border-gray-200 p-4 sm:p-6 relative flex flex-col items-center justify-center"
      >
        {onToggleSidebar && !sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden absolute left-4 p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
        )}
        <div className="text-center">
          <h2 className="adaptive-header-title font-semibold text-gray-900">
            {chat.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {chat.messages.filter(msg => msg.role === 'user').length} question{chat.messages.filter(msg => msg.role === 'user').length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {chat.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Start your conversation</p>
              <p className="text-sm text-gray-400">Ask the Bible AI anything</p>
            </div>
          </div>
        ) : (
          <MessageList messages={chat.messages} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        showScrollButton={showScrollButton}
        onScrollToPrevious={scrollToPreviousQuestion}
      />
    </div>
  );
}
