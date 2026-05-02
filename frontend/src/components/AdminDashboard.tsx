import { useState, useEffect } from 'react';
import { LogOut, Users, Activity, BarChart3, RefreshCw, MessageSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { Chat } from '../types';
import ChatArea from './ChatArea';
import Sidebar from './Sidebar';
import { generateId, generateChatTitle } from '../utils/generateTitle';
import { storageService } from '../utils/storage';

interface AdminDashboardProps {
  token: string;
  username: string;
  onLogout: () => void;
}

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  created_at: string;
  lastLogin: string;
  totalChats: number;
  totalMessages: number;
}

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
  username: string;
}

interface Stats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalPdfExports: number;
  recentActivity: any[];
}

export default function AdminDashboard({ token, username, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity' | 'chat'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // User creation form state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState('');
  
  // User edit form state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserMessage, setEditUserMessage] = useState('');
  
  // User delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  
  // Chat state
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const apiUrl = `${window.location.protocol}//${window.location.hostname}/bibleai/api`;

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch stats
      const statsResponse = await fetch(`${apiUrl}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch users
      const usersResponse = await fetch(`${apiUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data.users);
      }

      // Fetch activity
      const activityResponse = await fetch(`${apiUrl}/admin/activity?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivities(activityData.data.activities);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load admin's chats from localStorage
  useEffect(() => {
    const savedChats = storageService.getAllChats(username);
    setChats(savedChats);
    
    // Set current chat to most recent if available
    if (savedChats.length > 0) {
      setCurrentChatId(savedChats[0].id);
    }
  }, [username]);

  // Chat handlers
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
    storageService.saveChat(newChat, username);
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    storageService.deleteChat(chatId, username);
    
    if (currentChatId === chatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const handleClearAll = () => {
    setChats([]);
    storageService.clearAllChats(username);
    setCurrentChatId(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setCreateUserMessage('');

    try {
      const response = await fetch(`${apiUrl}/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUserUsername,
          password: newUserPassword,
          isAdmin: newUserIsAdmin
        })
      });

      const data = await response.json();

      if (data.success) {
        setCreateUserMessage('User created successfully!');
        setNewUserUsername('');
        setNewUserPassword('');
        setNewUserIsAdmin(false);
        
        // Refresh user list
        setTimeout(() => {
          fetchData();
          setShowCreateUserModal(false);
        }, 1000);
      } else {
        setCreateUserMessage(data.error || 'Failed to create user');
      }
    } catch (err) {
      setCreateUserMessage(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleEditUserClick = (user: User) => {
    setEditingUserId(user.id);
    setEditingUsername(user.username);
    setEditingPassword('');
    setEditUserMessage('');
    setShowEditUserModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    setEditUserLoading(true);
    setEditUserMessage('');

    try {
      const response = await fetch(`${apiUrl}/admin/users/${editingUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editingUsername,
          password: editingPassword || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setEditUserMessage('User updated successfully!');
        
        setTimeout(() => {
          fetchData();
          setShowEditUserModal(false);
          setEditingUserId(null);
          setEditingUsername('');
          setEditingPassword('');
        }, 1000);
      } else {
        setEditUserMessage(data.error || 'Failed to update user');
      }
    } catch (err) {
      setEditUserMessage(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleDeleteUserClick = (user: User) => {
    setDeleteUserId(user.id);
    setDeleteUsername(user.username);
    setDeleteMessage('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    setDeleteLoading(true);
    setDeleteMessage('');

    try {
      const response = await fetch(`${apiUrl}/admin/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDeleteMessage('User deleted successfully!');
        
        setTimeout(() => {
          fetchData();
          setShowDeleteConfirm(false);
          setDeleteUserId(null);
          setDeleteUsername('');
        }, 1000);
      } else {
        setDeleteMessage(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setDeleteMessage(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendMessage = (message: string) => {
    if (!currentChat || !token) return;

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
    storageService.saveChat(updatedChat, username);

    // Track message in backend
    fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/admin/track/message`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.error('Failed to track message:', err));
  };

  const handleAssistantMessage = (content: string, formattedContent?: string) => {
    if (!token) return;

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

      storageService.saveChat(updatedChat, username);
      return updatedChats;
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm">Logged in as: {username}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8" aria-label="Tabs">
            {['overview', 'users', 'activity', 'chat'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'users' && 'Users'}
                {tab === 'activity' && 'Activity Log'}
                {tab === 'chat' && 'Chat'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab !== 'chat' && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && <div className="text-center text-gray-600">Loading...</div>}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                </div>
                <Users size={32} className="text-blue-500" />
              </div>
            </div>

            {/* Total Chats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Chats</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalChats}</p>
                </div>
                <BarChart3 size={32} className="text-green-500" />
              </div>
            </div>

            {/* Total Messages */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Messages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMessages}</p>
                </div>
                <Activity size={32} className="text-purple-500" />
              </div>
            </div>

            {/* PDF Exports */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">PDF Exports</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPdfExports}</p>
                </div>
                <RefreshCw size={32} className="text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && !isLoading && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Manage Users</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                Create User
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Chats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.isAdmin 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                        }
                      `}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.totalChats}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.totalMessages}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.lastLogin).toLocaleDateString()} {new Date(user.lastLogin).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUserClick(user)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUserClick(user)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && !isLoading && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(activity.created_at).toLocaleDateString()} {new Date(activity.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activity.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {activity.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {activity.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
      )}

      {/* Chat Tab - Full Chat Interface */}
      {activeTab === 'chat' && (
        <div className="w-full h-[calc(100vh-180px)] bg-gray-900 flex overflow-hidden">
          {/* Use the original Sidebar component */}
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onClearAll={handleClearAll}
            authToken={token}
          />

          {/* Main Chat Area */}
          <main 
            className="flex-1 flex flex-col bg-white overflow-hidden"
            onClick={() => sidebarOpen && setSidebarOpen(false)}
          >
            {!currentChat ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg font-medium">No chat selected</p>
                  <p className="text-gray-500 text-sm mt-2">Create a new chat or select an existing one</p>
                </div>
              </div>
            ) : (
              <ChatArea
                chat={currentChat}
                onSendMessage={handleSendMessage}
                onAssistantMessage={handleAssistantMessage}
                authToken={token}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
              />
            )}
          </main>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                  disabled={createUserLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  disabled={createUserLoading}
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={newUserIsAdmin}
                  onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={createUserLoading}
                />
                <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                  Admin User
                </label>
              </div>

              {createUserMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  createUserMessage.includes('successfully')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {createUserMessage}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {createUserLoading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setCreateUserMessage('');
                  }}
                  disabled={createUserLoading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h2>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editingUsername}
                  onChange={(e) => setEditingUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new username"
                  disabled={editUserLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editingPassword}
                  onChange={(e) => setEditingPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  disabled={editUserLoading}
                />
              </div>

              {editUserMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  editUserMessage.includes('successfully')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {editUserMessage}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {editUserLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUserId(null);
                    setEditingUsername('');
                    setEditingPassword('');
                    setEditUserMessage('');
                  }}
                  disabled={editUserLoading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete User</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the user <strong>{deleteUsername}</strong>? This action cannot be undone.
            </p>

            {deleteMessage && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${
                deleteMessage.includes('successfully')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {deleteMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteUserId(null);
                  setDeleteUsername('');
                  setDeleteMessage('');
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
