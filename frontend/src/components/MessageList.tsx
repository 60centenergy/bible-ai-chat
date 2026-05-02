import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyMessage = (message: Message) => {
    // Get the plain text content
    const textToCopy = message.content || '';
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          console.log('Text copied to clipboard successfully');
          setCopiedId(message.id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy with Clipboard API:', err);
          // Fallback to older method
          fallbackCopyToClipboard(textToCopy, message.id);
        });
    } else {
      // Fallback for older browsers
      fallbackCopyToClipboard(textToCopy, message.id);
    }
  };

  const fallbackCopyToClipboard = (text: string, messageId: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        console.log('Text copied using fallback method');
        setCopiedId(messageId);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        console.error('Copy command was unsuccessful');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {messages.map((message) => (
        <div
          key={message.id}
          id={`message-${message.id}`}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`
            max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl px-4 py-3 rounded-lg group
            ${message.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }
          `}>
            {message.formattedContent ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: message.formattedContent }}
              />
            ) : (
              <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            
            {/* Timestamp and copy button on same line */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <p className={`
                text-xs ${
                  message.role === 'user'
                    ? 'text-blue-100'
                    : 'text-gray-500'
                }
              `}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              
              {/* Copy button - unified for all screen sizes */}
              <button
                onClick={() => handleCopyMessage(message)}
                className={`
                  p-1.5 rounded transition-all duration-200
                  flex items-center justify-center flex-shrink-0
                  ${message.role === 'user'
                    ? 'sm:opacity-0 sm:group-hover:opacity-100 text-blue-100 hover:bg-blue-500'
                    : 'sm:opacity-0 sm:group-hover:opacity-100 text-gray-600 hover:bg-gray-200'
                  }
                  md:opacity-0 md:group-hover:opacity-100
                `}
                title="Copy to clipboard"
                aria-label="Copy message"
              >
                {copiedId === message.id ? (
                  <Check size={14} className={message.role === 'user' ? 'text-blue-100' : 'text-green-600'} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
