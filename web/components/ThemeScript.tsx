"use client";

/**
 * Keep the first paint on the editorial warm-dark design system.
 */
export default function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        document.documentElement.classList.remove('dark', 'theme-glass', 'theme-snow');
        document.documentElement.classList.add('dark');
        localStorage.setItem('deeptutor-theme', 'dark');
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
