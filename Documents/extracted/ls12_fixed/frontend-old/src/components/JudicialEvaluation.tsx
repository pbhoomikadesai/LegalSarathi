import React from 'react';

export function JudicialEvaluation({ keys }: { keys: string[] }) {
  if (!keys || keys.length === 0) return null;

  return (
    <div className="mt-8 bg-gray-900 text-gray-100 p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
      <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-yellow-400">
        <span>⚖️</span> Judicial Hint
      </h3>
      <p className="text-sm text-gray-300 mb-2">
        Based on the extracted legal framework, this scenario heavily relies on:
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        {keys.map((key, idx) => (
          <span key={idx} className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-full text-xs font-semibold text-yellow-100">
            {key}
          </span>
        ))}
      </div>
    </div>
  );
}
