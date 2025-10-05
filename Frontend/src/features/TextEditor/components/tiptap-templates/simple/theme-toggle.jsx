"use client";
import * as React from "react";
// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon";
import { SunIcon } from "@/components/tiptap-icons/sun-icon";

export function ThemeToggle({isDarkMode,setIsDarkMode}) {

  // Initialize theme from localStorage or system preference
  React.useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (storedTheme) {
      setIsDarkMode(storedTheme === "dark");
    } else {
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // Update document class and localStorage when theme changes
  React.useEffect(() => {
    if (isDarkMode === null) return; // Skip initial null state

    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Handle system preference changes (only if no stored preference)
  React.useEffect(() => {
    if (localStorage.getItem("theme")) return; // Skip if user has set preference

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleDarkMode = () =>
    setIsDarkMode((prev) => (prev === null ? false : !prev));

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      data-style="ghost"
      disabled={isDarkMode === null} // Disable while determining initial theme
    >
      {isDarkMode === null ? (
        <div className="tiptap-button-icon animate-pulse" /> // Loading state
      ) : isDarkMode ? (

        <SunIcon className="tiptap-button-icon" />
      ) : (
        <MoonStarIcon className="tiptap-button-icon" />
      )}
    </Button>
  );
}
