"use client";

import React from 'react';

/**
 * Development helper component to test token refresh behavior
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

  const deleteRefreshToken = () => {
    document.cookie = 'refresh_token=; Max-Age=0; path=/';
    console.log('🗑️ Deleted refresh_token cookie');
    refreshCookies();
    alert('Refresh token deleted! Now try using the app - it should redirect to login when the user_token expires.');
  };

  const deleteUserToken = () => {
    document.cookie = 'user_token=; Max-Age=0; path=/';
    console.log('🗑️ Deleted user_token cookie');
    refreshCookies();
    alert('User token deleted! Next API call will try to refresh (and fail if refresh_token is also deleted).');
  };

  const deleteAllTokens = () => {
    document.cookie = 'user_token=; Max-Age=0; path=/';
    document.cookie = 'refresh_token=; Max-Age=0; path=/';
    document.cookie = 'session=; Max-Age=0; path=/';
    console.log('🗑️ Deleted all auth cookies');
    refreshCookies();
    alert('All tokens deleted! You should be redirected to login on next API call.');
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-sm">
      <h3 className="font-bold text-sm mb-2">🧪 Token Test Helper</h3>
      
      <div className="space-y-2 mb-3">
        <button
          onClick={deleteRefreshToken}
          className="w-full px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs"
        >
          Delete refresh_token
        </button>
        <button
          onClick={deleteUserToken}
          className="w-full px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
        >
          Delete user_token
        </button>
        <button
          onClick={deleteAllTokens}
          className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
        >
          Delete ALL tokens
        </button>
        <button
          onClick={refreshCookies}
          className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          Refresh view
        </button>
      </div>

      <div className="text-xs bg-gray-800 p-2 rounded max-h-32 overflow-auto">
        <div className="font-mono break-all">
          {cookies || 'No cookies found'}
        </div>
      </div>
    </div>
  );
}
