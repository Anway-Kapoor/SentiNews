import Dashboard from '../components/Dashboard';
import AllTopicsFeed from '../components/AllTopicsFeed';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Remove the duplicate heading */}
        
        {/* Use the Dashboard with full functionality */}
        <div className="mb-12">
          <Dashboard showOnlySearchBar={false} />
        </div>
        
        {/* Keep the real-time feed below */}
        <div className="mb-12">
          <AllTopicsFeed />
        </div>
      </div>
    </main>
  );
}
