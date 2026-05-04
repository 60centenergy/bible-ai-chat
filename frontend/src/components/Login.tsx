import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: { username: string; isAdmin: boolean }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // API URL detection
      const hostname = window.location.hostname;
      let apiUrl: string;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168')) {
        apiUrl = 'http://localhost:5000/api';
      } else {
        // All production environments use Render backend
        apiUrl = 'https://bible-ai-backend-3flg.onrender.com/api';
      }
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store token in session storage (cleared when browser closes)
      sessionStorage.setItem('authToken', data.data.token);
      sessionStorage.setItem('user', JSON.stringify(data.data.user));

      onLogin(data.data.token, data.data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Bible AI Chat</h1>
        <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your username"
              className="
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                text-gray-900
              "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your password"
              className="
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                text-gray-900
              "
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="
              w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg
              transition-colors duration-200
              disabled:bg-gray-400 disabled:cursor-not-allowed
            "
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
