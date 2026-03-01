'use client';

import React from 'react';

/**
 * Development helper component to test session-based auth behavior
 * Add this to your layout or any page during development
 *
 * Usage: <TokenTestHelper />
 */
export function TokenTestHelper() {
  const [cookies, setCookies] = React.useState<string>('');

  const refreshCookies = () => {
    if (typeof document !== 'undefined') {
      setCookies(document.cookie);
    }
  };

  React.useEffect(() => {
    refreshCookies();
  }, []);

  const deleteSession = () => {
    document.cookie = 'session_id=; Max-Age=0; path=/';
    console.log('🗑️ Deleted session_id cookie');
    refreshCookies();
    alert('Session deleted! You should be redirected to login on next API call or page refresh.');
  };

  const checkSession = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, {
        credentials: 'include',
      });
      const data = await response.json();
      alert(`Session status: ${JSON.stringify(data, null, 2)}`);
      console.log('Session status:', data);
    } catch (error) {
      alert(`Session check failed: ${error}`);
      console.error('Session check failed:', error);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-gray-900 p-4 text-white shadow-xl">
      <h3 className="mb-2 text-sm font-bold">🧪 Session Test Helper</h3>

      <div className="mb-3 space-y-2">
        <button
          onClick={checkSession}
          className="w-full rounded bg-green-600 px-3 py-1 text-xs hover:bg-green-700"
        >
          Check Session Status
        </button>
        <button
          onClick={deleteSession}
          className="w-full rounded bg-red-600 px-3 py-1 text-xs hover:bg-red-700"
        >
          Delete Session
        </button>
        <button
          onClick={refreshCookies}
          className="w-full rounded bg-blue-600 px-3 py-1 text-xs hover:bg-blue-700"
        >
          Refresh view
        </button>
      </div>

      <div className="max-h-32 overflow-auto rounded bg-gray-800 p-2 text-xs">
        <div className="break-all font-mono">{cookies || 'No cookies found'}</div>
      </div>
    </div>
  );
}
