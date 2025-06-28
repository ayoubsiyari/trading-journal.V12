import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

export default function DarkModeToggle({ className = '' }) {
  const context = React.useContext(ThemeContext);
  
  // Log the context to help diagnose the issue
  console.log('ThemeContext:', context);
  
  // Use fallback values if context is undefined
  const isDarkMode = context?.isDarkMode ?? false;
  const toggleTheme = context?.toggleTheme ?? (() => {
    console.warn('ThemeContext not initialized - toggleTheme called');
  });

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition ${className}`}
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600" />
      )}
    </button>
  );
}
