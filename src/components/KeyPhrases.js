export default function KeyPhrases({ phrases }) {
  if (!phrases || phrases.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {phrases.map((phrase, index) => (
        <div 
          key={index}
          className="px-3 py-1 bg-blue-900/30 rounded-full border border-blue-800 text-blue-300 text-sm"
        >
          {phrase}
        </div>
      ))}
    </div>
  );
}