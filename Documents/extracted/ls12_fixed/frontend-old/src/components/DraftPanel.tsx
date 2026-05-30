import React, { useState } from 'react';

export function DraftPanel({ content, query }: { content: string, query?: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!content) return;
    setDownloading(true);
    try {
      const res = await fetch('http://localhost:8000/api/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guidance: content, query: query || '' }),
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'legal_draft.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Error generating PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-orange-900">Document Draft Preview</h3>
        <button 
          onClick={handleDownload}
          disabled={downloading || !content}
          className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
        >
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
      <div className="p-4 bg-white border rounded whitespace-pre-wrap font-mono text-sm">
        {content || "No document drafted yet."}
      </div>
    </div>
  );
}
