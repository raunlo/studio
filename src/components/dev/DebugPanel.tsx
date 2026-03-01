'use client';
import React, { useEffect, useState } from 'react';

interface DebugInfo {
  apiCallCount: number;
  lastError: string | null;
  lastErrorTime: number | null;
  sessionId: boolean;
  url: string;
}

export const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    apiCallCount: 0,
    lastError: null,
    lastErrorTime: null,
    sessionId: false,
    url: '',
  });

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Check cookies
    const checkCookies = () => {
      const cookies = document.cookie.split(';').reduce(
        (acc, c) => {
          const [k, v] = c.trim().split('=');
          acc[k] = !!v;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      setDebugInfo((prev) => ({
        ...prev,
        sessionId: !!cookies['session_id'],
        url: window.location.href,
      }));
    };

    checkCookies();

    // Intercept console.error to track errors
    const originalError = console.error;
    console.error = function (...args: any[]) {
      const errorMsg = args
        .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ')
        .substring(0, 100);

      setDebugInfo((prev) => ({
        ...prev,
        lastError: errorMsg,
        lastErrorTime: Date.now(),
        apiCallCount: prev.apiCallCount + 1,
      }));

      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const timeSinceError = debugInfo.lastErrorTime
    ? Math.round((Date.now() - debugInfo.lastErrorTime) / 1000)
    : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-red-500 bg-gray-900 p-3 font-mono text-xs text-white">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold">🐛 Debug Panel</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 text-red-500 hover:text-red-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1 text-gray-300">
        <div>
          <span className="text-yellow-400">API Calls:</span> {debugInfo.apiCallCount}
        </div>
        <div>
          <span className="text-yellow-400">Last Error:</span>
          <div className="break-words text-red-400">
            {debugInfo.lastError ? `${debugInfo.lastError} (${timeSinceError}s ago)` : 'None'}
          </div>
        </div>
        <div className="mt-1 border-t border-gray-600 pt-1">
          <span className="text-cyan-400">Cookies:</span>
          <div className={debugInfo.sessionId ? 'text-green-400' : 'text-red-400'}>
            session_id: {debugInfo.sessionId ? '✓' : '✗'}
          </div>
        </div>
        <div className="mt-1 border-t border-gray-600 pt-1 text-[10px] text-gray-500">
          <div className="break-words">{debugInfo.url}</div>
        </div>
      </div>

      <button
        onClick={() =>
          setDebugInfo((prev) => ({
            ...prev,
            apiCallCount: 0,
            lastError: null,
            lastErrorTime: null,
          }))
        }
        className="mt-2 w-full rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
      >
        Reset
      </button>
    </div>
  );
};
