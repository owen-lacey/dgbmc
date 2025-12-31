'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleToggle = () => {
    if (theme === 'system') {
      // If currently on system, switch to the opposite of current resolved theme
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // If manually set, toggle to the opposite
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  const isDark = resolvedTheme === 'dark';
  const isSystem = theme === 'system';

  return (
    <button
      onClick={handleToggle}
      className="p-2.5 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
      title={isSystem ? `System (${isDark ? 'Dark' : 'Light'})` : (isDark ? 'Dark mode' : 'Light mode')}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>

        {/* Moon icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>

        {/* System indicator dot */}
        {isSystem && (
          <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        )}
      </div>
    </button>
  );
}
