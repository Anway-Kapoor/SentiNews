import { format } from 'date-fns';
import { FiThumbsUp, FiShare2 } from 'react-icons/fi';

export default function TopPosts({ posts, showTopicSource = false }) {
  if (!posts || posts.length === 0) {
    return <div className="text-center text-gray-400">No posts available</div>;
  }

  // Helper function to get styling based on sentiment category
  const getSentimentStyle = (category) => {
    // Simplify categories to just positive, neutral, negative
    let simplifiedCategory = category;
    if (category === 'very positive') simplifiedCategory = 'positive';
    if (category === 'very negative') simplifiedCategory = 'negative';
    
    switch (simplifiedCategory) {
      case 'positive':
        return { border: 'border-green-600', bg: 'bg-green-900/20', text: 'text-green-400' };
      case 'neutral':
        return { border: 'border-gray-600', bg: 'bg-gray-700/20', text: 'text-gray-300' };
      case 'negative':
        return { border: 'border-red-600', bg: 'bg-red-900/20', text: 'text-red-400' };
      default:
        return { border: 'border-gray-600', bg: 'bg-gray-700/20', text: 'text-gray-300' };
    }
  };

  return (
    <div className="space-y-4">
      {posts.map(post => {
        // Check if post has sentiment data, if not, use a default
        const hasSentiment = post.sentiment && post.sentiment.category;
        const style = hasSentiment 
          ? getSentimentStyle(post.sentiment.category)
          : { border: 'border-gray-600', bg: 'bg-gray-700/20', text: 'text-gray-300' };
        
        // Simplify displayed category text
        let displayCategory = hasSentiment ? post.sentiment.category : 'unknown';
        if (displayCategory === 'very positive') displayCategory = 'positive';
        if (displayCategory === 'very negative') displayCategory = 'negative';
        
        return (
          <div 
            key={post.id} 
            className={`p-4 rounded-lg border ${style.border} ${style.bg}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center flex-wrap">
                <span className="font-medium text-gray-300">{post.platform}</span>
                <span className="mx-2 text-gray-500">•</span>
                <span className="text-sm text-gray-400">
                  {format(new Date(post.date), 'MMM d, yyyy')}
                </span>
                {showTopicSource && post.topicSource && (
                  <>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-sm font-medium text-blue-400">
                      #{post.topicSource}
                    </span>
                  </>
                )}
              </div>
              {hasSentiment && (
                <div className={`px-2 py-1 rounded text-xs font-medium bg-opacity-50 ${style.bg} ${style.text}`}>
                  {displayCategory.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </div>
              )}
            </div>
            
            <p className="mb-3 text-white">{post.text}</p>
            
            <div className="flex items-center text-sm text-gray-400">
              <div className="flex items-center mr-4">
                <FiThumbsUp className="mr-1" />
                <span>{post.likes || 0}</span>
              </div>
              <div className="flex items-center">
                <FiShare2 className="mr-1" />
                <span>{post.shares || 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}