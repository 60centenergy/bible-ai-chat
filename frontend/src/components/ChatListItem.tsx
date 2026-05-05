import { useState } from 'react';
import { MoreVertical, Trash2, Download, AlertCircle } from 'lucide-react';
import { Chat } from '../types';
import { exportChatToPdf } from '../utils/exportPdf';
import { storageService } from '../utils/storage';

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}

export default function ChatListItem({
  chat,
  isActive,
  onSelect,
  onDelete
}: ChatListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      await exportChatToPdf(chat);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export chat to PDF');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const handleExportJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      storageService.downloadSingleChatJson(chat);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export chat to JSON');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const confirmDelete = () => {
    onDelete(chat.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const formattedDate = new Date(chat.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={`
        relative group p-3 rounded-lg cursor-pointer transition-colors
        ${isActive 
          ? 'bg-gray-700 text-white' 
          : 'hover:bg-gray-800 text-gray-300'
        }
      `}
      onClick={() => onSelect(chat.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{chat.title}</h3>
          <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
        </div>

        {/* Options Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Options Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50 min-w-max">
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download size={14} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={handleExportJson}
            disabled={isExporting}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-700 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            {isExporting ? 'Exporting...' : 'Export Chat'}
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-700 flex items-center gap-2 text-red-400 transition"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Close menu when clicking outside */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-600" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Delete Chat?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
