import { Chat, ChatListItem } from '../types';

const STORAGE_KEY_PREFIX = 'bible-ai-chats';
const MAX_CHATS = 30;

// Get per-user storage key
function getUserStorageKey(username: string): string {
  return `${STORAGE_KEY_PREFIX}-${username}`;
}

export const storageService = {
  // Get all chats for a user
  getAllChats(username?: string): Chat[] {
    try {
      // For backward compatibility, if no username provided, try old key first
      if (!username) {
        const data = localStorage.getItem(STORAGE_KEY_PREFIX);
        return data ? JSON.parse(data) : [];
      }

      const storageKey = getUserStorageKey(username);
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading chats from storage:', error);
      return [];
    }
  },

  // Get single chat
  getChat(chatId: string, username?: string): Chat | null {
    const chats = this.getAllChats(username);
    return chats.find(chat => chat.id === chatId) || null;
  },

  // Save or update chat
  saveChat(chat: Chat, username?: string): void {
    try {
      if (!username) return;

      const storageKey = getUserStorageKey(username);
      const chats = this.getAllChats(username);
      const index = chats.findIndex(c => c.id === chat.id);

      if (index > -1) {
        chats[index] = { ...chat, updatedAt: Date.now() };
      } else {
        if (chats.length >= MAX_CHATS) {
          // Remove oldest chat if we've hit the limit
          chats.sort((a, b) => a.updatedAt - b.updatedAt);
          chats.shift();
        }
        chats.push({ ...chat, createdAt: Date.now(), updatedAt: Date.now() });
      }

      chats.sort((a, b) => b.updatedAt - a.updatedAt);
      localStorage.setItem(storageKey, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chat to storage:', error);
    }
  },

  // Delete chat
  deleteChat(chatId: string, username?: string): void {
    try {
      if (!username) return;

      const storageKey = getUserStorageKey(username);
      const chats = this.getAllChats(username);
      const filtered = chats.filter(chat => chat.id !== chatId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  },

  // Clear all chats for a user
  clearAllChats(username?: string): void {
    try {
      if (!username) return;

      const storageKey = getUserStorageKey(username);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing chats:', error);
    }
  },

  // Get chat list (summary info only)
  getChatList(username?: string): ChatListItem[] {
    return this.getAllChats(username).map(chat => ({
      id: chat.id,
      title: chat.title,
      updatedAt: chat.updatedAt
    }));
  },

  // Export all chats as JSON
  exportChats(username?: string): string {
    try {
      const chats = this.getAllChats(username);
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        username: username || 'default',
        chats: chats
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting chats:', error);
      throw error;
    }
  },

  // Import chats from JSON
  importChats(jsonData: string, username?: string, merge: boolean = true): { success: boolean; message: string; importedCount?: number } {
    try {
      if (!username) {
        return { success: false, message: 'Username required for import' };
      }

      const importData = JSON.parse(jsonData);

      // Validate structure
      if (!Array.isArray(importData.chats)) {
        return { success: false, message: 'Invalid export file format' };
      }

      let chats = merge ? this.getAllChats(username) : [];
      const incomingChats = importData.chats as Chat[];

      if (merge) {
        // Merge: add incoming chats, updating existing ones by ID
        const chatMap = new Map(chats.map(c => [c.id, c]));
        incomingChats.forEach(chat => {
          chatMap.set(chat.id, chat);
        });
        chats = Array.from(chatMap.values());
      } else {
        // Replace: use only incoming chats
        chats = incomingChats;
      }

      // Sort by update date (newest first)
      chats.sort((a, b) => b.updatedAt - a.updatedAt);

      // Enforce max chats limit
      if (chats.length > MAX_CHATS) {
        chats = chats.slice(0, MAX_CHATS);
      }

      const storageKey = getUserStorageKey(username);
      localStorage.setItem(storageKey, JSON.stringify(chats));

      return {
        success: true,
        message: `Successfully imported ${incomingChats.length} chat(s)`,
        importedCount: incomingChats.length
      };
    } catch (error) {
      console.error('Error importing chats:', error);
      return { success: false, message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  },

  // Export single chat as JSON
  exportSingleChat(chat: Chat): string {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        chat: chat
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting chat:', error);
      throw error;
    }
  },

  // Download export as file
  downloadExport(username?: string, filename?: string): void {
    try {
      const data = this.exportChats(username);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `bible-ai-chats-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading export:', error);
    }
  },

  // Download single chat as JSON file
  downloadSingleChatJson(chat: Chat): void {
    try {
      const data = this.exportSingleChat(chat);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename from chat title
      const title = chat.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const date = new Date().toISOString().split('T')[0];
      link.download = `chat-${title}-${date}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading chat:', error);
    }
  }
};
