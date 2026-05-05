import { useState, useRef } from 'react';
import { Plus, Trash2, AlertCircle, MoreVertical, Download, Upload } from 'lucide-react';
import { Chat } from '../types';
import { storageService } from '../utils/storage';
import ChatListItem from './ChatListItem';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onClearAll: () => void;
  authToken?: string;
  username?: string;
  onChatsImported?: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onClearAll,
  username,
  onChatsImported
}: SidebarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearAll = () => {
    setShowClearConfirm(true);
    setShowMenu(false);
  };

  const confirmClearAll = () => {
    onClearAll();
    setShowClearConfirm(false);
  };

  const handleExport = () => {
    try {
      storageService.downloadExport(username);
      setImportMessage('Chats exported successfully!');
      setImportStatus('success');
      setShowMenu(false);
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      setImportMessage('Failed to export chats');
      setImportStatus('error');
    }
  };

  const handleImportClick = () => {
    setShowImportOptions(true);
    setShowMenu(false);
  };

  const handleImportFile = async (merge: boolean) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = storageService.importChats(text, username, merge);

      setImportMessage(result.message);
      setImportStatus(result.success ? 'success' : 'error');
      setShowImportOptions(false);

      if (result.success && onChatsImported) {
        onChatsImported();
      }

      setTimeout(() => setImportStatus('idle'), 4000);
    } catch (error) {
      setImportMessage('Failed to process import file');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImport = (merge: boolean) => {
    const input = fileInputRef.current;
    if (input) {
      input.onchange = () => handleImportFile(merge);
      input.click();
    }
  };

  return (
    <>
      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30 pointer-events-none"
        />
      )}
      
      {/* Close area - clicks outside sidebar close it on all screen sizes */}
      {isOpen && (
        <div
          className="fixed inset-0 z-35"
          onClick={onToggle}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-40 h-full bg-gray-900 text-white flex flex-col overflow-hidden pointer-events-auto
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 lg:w-64
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-sm">
                📖
              </div>
              Bible AI
            </h1>
            {/* Clear All Menu Button */}
            {chats.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg hover:bg-gray-700 transition text-gray-300 hover:text-white"
                  aria-label="Options menu"
                >
                  <MoreVertical size={18} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-700">
                    <button
                      onClick={handleExport}
                      disabled={chats.length === 0}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg transition flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={16} />
                      Export Chats
                    </button>
                    <button
                      onClick={handleImportClick}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg transition flex items-center gap-2 text-green-400 hover:text-green-300 text-sm border-t border-gray-700"
                    >
                      <Upload size={16} />
                      Import Chats
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg transition flex items-center gap-2 text-red-400 hover:text-red-300 text-sm border-t border-gray-700"
                    >
                      <Trash2 size={16} />
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Chat Assistant</p>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewChat();
            onToggle();
          }}
          className="m-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          New Chat
        </button>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-0 touch-manipulation overscroll-y-contain" style={{ overscrollBehavior: 'contain' }}>
          {chats.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-2">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-2 pb-48">
              {chats.map(chat => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={currentChatId === chat.id}
                  onSelect={onSelectChat}
                  onDelete={onDeleteChat}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-600" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Clear All Chats?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all chats? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) {
            // File will be handled by import dialog
          }
        }}
      />

      {/* Import Options Modal */}
      {showImportOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Import Chats</h2>
            <p className="text-gray-600 mb-6">
              Choose how to import chats:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => triggerImport(true)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
              >
                Merge with Existing
              </button>
              <button
                onClick={() => triggerImport(false)}
                className="w-full py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium text-sm"
              >
                Replace All
              </button>
            </div>
            <button
              onClick={() => setShowImportOptions(false)}
              className="w-full mt-3 py-2 px-4 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import/Export Status Message */}
      {importStatus !== 'idle' && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          importStatus === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <span className="text-sm font-medium">{importMessage}</span>
        </div>
      )}
    </>
  );
}
