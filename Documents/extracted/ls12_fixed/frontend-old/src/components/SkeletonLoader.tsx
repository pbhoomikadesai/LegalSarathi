import React from 'react';

export function SkeletonLoader({ withWaveform = false }: { withWaveform?: boolean }) {
  return (
    <div className="animate-pulse space-y-6 mt-6">
      {withWaveform ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex items-end gap-1 h-16 w-64">
            {Array(24).fill(0).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-orange-300 rounded-full"
                style={{
                  height: `${20 + Math.sin(i * 0.6) * 18 + Math.cos(i * 1.2) * 14}px`,
                  animationDelay: `${i * 40}ms`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
          <p className="text-orange-500 font-semibold text-sm animate-bounce">Processing voice query...</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-200 h-8 w-1/3 rounded"></div>

          <div className="bg-white p-4 rounded shadow-sm border border-gray-100 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 h-32 rounded-lg border border-orange-100"></div>
            <div className="bg-blue-50 h-32 rounded-lg border border-blue-100"></div>
          </div>
        </>
      )}
    </div>
  );
}
