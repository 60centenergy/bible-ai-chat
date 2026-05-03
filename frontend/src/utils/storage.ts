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
  }
};
