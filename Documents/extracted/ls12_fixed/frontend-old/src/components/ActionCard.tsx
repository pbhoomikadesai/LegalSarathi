import React from 'react';

export function ActionCard({ title, steps, links = {} }: { title: string, steps: string[], links?: Record<string, string> }) {
  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
      <h3 className="font-bold text-lg text-orange-800 mb-2">{title}</h3>
      {steps.length > 0 ? (
        <ol className="list-decimal list-inside space-y-1 mb-4">
          {steps.map((step, idx) => (
            <li key={idx} className="text-gray-700">{step}</li>
          ))}
        </ol>
      ) : (
        <p className="text-gray-700 italic mb-4">No specific actionable steps found. Refer to guidance.</p>
      )}
      
      {Object.entries(links).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(links).map(([name, url], idx) => (
            <a 
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition text-sm font-medium"
            >
              {name.startsWith("Source") ? "View Law Source" : `Go to ${name}`}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
