"use client";

/**
 * Keep the first paint on the light learning design system.
 */
export default function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        document.documentElement.classList.remove('dark', 'theme-glass', 'theme-snow');
        document.documentElement.classList.add('theme-snow');
        localStorage.setItem('deeptutor-theme', 'light');
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
