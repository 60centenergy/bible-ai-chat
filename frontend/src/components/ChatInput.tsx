import { useState, useRef, useEffect } from 'react';
import { Send, ChevronUp } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  showScrollButton?: boolean;
  onScrollToPrevious?: () => void;
}

export default function ChatInput({ 
  onSendMessage, 
  isLoading,
  showScrollButton = false,
  onScrollToPrevious = () => {}
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow shift+enter for new lines
        return;
      }
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
      {/* Scroll to previous button */}
      {showScrollButton && (
        <button
          onClick={onScrollToPrevious}
          className="
            mb-3 mx-auto block p-2 rounded-full bg-gray-200 hover:bg-gray-300
            transition opacity-60 hover:opacity-100 text-gray-600
          "
          aria-label="Scroll to previous question"
          title="Scroll to previous question"
        >
          <ChevronUp size={20} />
        </button>
      )}
      
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the Bible AI..."
          disabled={isLoading}
          className="
            flex-1 p-3 border border-gray-300 rounded-lg resize-none
            focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            max-h-30 text-sm sm:text-base scrollbar-hide
          "
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="
            p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition flex items-center justify-center
            flex-shrink-0 h-12 w-12
          "
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {isLoading && '⏳ Bible AI is thinking...'}
      </p>
    </div>
  );
}
