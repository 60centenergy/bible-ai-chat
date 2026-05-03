export default function HomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="text-6xl mb-6">📖</div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Bible AI Chat
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 mb-8">
          Your interactive AI assistant for exploring the Bible
        </p>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What You Can Do
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <span>
                <strong>Ask Questions</strong> - Get answers about Bible passages, 
                theology, and spiritual topics
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">📚</span>
              <span>
                <strong>Explore Scripture</strong> - Deep dive into biblical texts 
                and their meanings
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <span>
                <strong>Find Answers</strong> - Discover biblical perspectives on 
                life's important questions
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <span>
                <strong>Export Chats</strong> - Save conversations as PDF for later 
                reference
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">💾</span>
              <span>
                <strong>Keep History</strong> - Your chats are saved automatically 
                and accessible anytime
              </span>
            </li>
          </ul>
        </div>

        {/* Getting Started */}
        <div className="space-y-4">
          <p className="text-gray-600">
            Start a new chat using the "New Chat" button in the sidebar to begin 
            your conversation with Bible AI.
          </p>
          <div className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold">
            Ready? Create your first chat →
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-500">
            Bible AI Chat • Powered by Advanced AI • 
            <span className="block mt-2">
              Accessible on all your devices from any network
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
