export const THEME_STORAGE_KEY = "slotback-theme";

/**
 * Runs synchronously during HTML parsing, before first paint, so the page never flashes
 * the wrong theme. Reads the saved preference ("system" | "light" | "dark") and resolves it.
 */
const script = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.dataset.themePreference=p}catch(e){document.documentElement.dataset.theme="light"}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
