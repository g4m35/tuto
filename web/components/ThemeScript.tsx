"use client";

/**
 * Apply the stored light/dark preference before React hydrates.
 */
export default function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem('deeptutor-theme');
        var theme = stored === 'dark' || stored === 'light' || stored === 'glass' || stored === 'snow'
          ? stored
          : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.remove('dark', 'theme-glass', 'theme-snow');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'glass') {
          document.documentElement.classList.add('dark', 'theme-glass');
        } else if (theme === 'snow') {
          document.documentElement.classList.add('theme-snow');
        }
      } catch (e) {
        // Silently fail - localStorage may be disabled
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
    />
  );
}
