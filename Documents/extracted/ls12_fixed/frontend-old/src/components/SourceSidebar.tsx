import React from 'react';

export function SourceSidebar({ webContext }: { webContext?: string }) {
  if (!webContext) return null;

  // Split by [Source: Title] to format it nicely
  const parts = webContext.split(/\[Source:\s*(.*?)\]/).filter(Boolean);
  
  const sources = [];
  for (let i = 0; i < parts.length; i += 2) {
    if (i + 1 < parts.length) {
      sources.push({
        title: parts[i].trim(),
        snippet: parts[i + 1].trim()
      });
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-full">
      <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Web Context
      </h3>
      
      <div className="space-y-4">
        {sources.length > 0 ? sources.map((source, idx) => (
          <div key={idx} className="bg-white p-3 rounded border border-blue-100 shadow-sm text-sm">
            <h4 className="font-semibold text-blue-800 mb-1">{source.title}</h4>
            <p className="text-gray-600 line-clamp-4">{source.snippet}</p>
          </div>
        )) : (
          <p className="text-sm text-gray-600">{webContext}</p>
        )}
      </div>
    </div>
  );
}
