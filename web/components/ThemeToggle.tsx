'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
      <button
        onClick={() => setTheme('light')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          theme === 'light'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title="Light mode"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          theme === 'system'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title="System preference"
      >
        💻
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          theme === 'dark'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title="Dark mode"
      >
        🌙
      </button>
    </div>
  );
}
