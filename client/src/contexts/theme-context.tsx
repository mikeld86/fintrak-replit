import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type Theme = "blue" | "pink" | "green" | "orange" | "red";

type ThemeProviderState = {
  theme: Theme;
  darkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
};

const initialState: ThemeProviderState = {
  theme: "blue",
  darkMode: false,
  setTheme: () => null,
  toggleDarkMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("blue");
  const [darkMode, setDarkModeState] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // Set initial theme class on body
    const body = document.body;
    body.classList.remove("theme-blue", "theme-pink", "theme-green", "theme-orange", "theme-red");
    body.classList.add("theme-blue"); // Default theme
  }, []);

  // Detect if device is mobile
  const isMobile = () => {
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // System theme detection with debugging
  const getSystemDarkMode = () => {
    if (typeof window === 'undefined') return false;
    
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      console.log('System prefers dark mode:', mediaQuery.matches);
      return mediaQuery.matches;
    } catch (error) {
      console.error('Error detecting system theme:', error);
      return false;
    }
  };

  // Initialize theme from user data or localStorage, with system preference detection for mobile
  useEffect(() => {
    const mobile = isMobile();
    console.log('Is mobile device:', mobile);
    
    if (mobile) {
      // For mobile: Always use blue theme and detect system dark mode preference
      setThemeState("blue");
      const systemDarkMode = getSystemDarkMode();
      console.log('Setting mobile dark mode to:', systemDarkMode);
      setDarkModeState(systemDarkMode);
      
      // Force immediate application of dark mode on mobile
      const html = document.documentElement;
      const body = document.body;
      if (systemDarkMode) {
        html.classList.add("dark");
        body.classList.add("dark");
        html.setAttribute("data-theme", "dark");
      }
    } else {
      const savedTheme = localStorage.getItem("theme") as Theme;
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      if (savedTheme) setThemeState(savedTheme);
      setDarkModeState(savedDarkMode);
    }
  }, []);

  // Listen for system theme changes on mobile with improved detection
  useEffect(() => {
    const mobile = isMobile();
    if (!mobile) return;

    let mediaQuery: MediaQueryList;
    
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        const isDark = e.matches;
        console.log('System theme changed to:', isDark ? 'dark' : 'light');
        console.log('Current document settings - appearance:', getComputedStyle(document.documentElement).colorScheme);
        setDarkModeState(isDark);
      };

      // Initial check with more detailed logging
      console.log('Initial media query check:', mediaQuery.matches);
      console.log('Document color scheme:', getComputedStyle(document.documentElement).colorScheme);
      handleChange(mediaQuery);

      // Add a periodic check to ensure we stay in sync
      const interval = setInterval(() => {
        const currentSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (currentSystemDark !== darkMode) {
          console.log('System theme drift detected, correcting...');
          setDarkModeState(currentSystemDark);
        }
      }, 5000);

      // Listen for changes - use both methods for compatibility
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
      }

      return () => {
        clearInterval(interval);
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(handleChange);
        }
      };
    } catch (error) {
      console.error('Error setting up system theme listener:', error);
    }
  }, [darkMode]);

  // Apply theme classes to body and document element
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    
    // Remove any existing theme classes
    body.classList.remove("theme-blue", "theme-pink", "theme-green", "theme-orange", "theme-red");
    html.classList.remove("theme-blue", "theme-pink", "theme-green", "theme-orange", "theme-red");
    
    // Add the current theme class to both
    body.classList.add(`theme-${theme}`);
    html.classList.add(`theme-${theme}`);
    
    // Apply dark mode to both body and html element for Tailwind compatibility
    if (darkMode) {
      body.classList.add("dark");
      html.classList.add("dark");
      // Also set data attribute for additional compatibility
      html.setAttribute("data-theme", "dark");
    } else {
      body.classList.remove("dark");
      html.classList.remove("dark");
      html.setAttribute("data-theme", "light");
    }
    
    console.log('Applied theme:', theme, 'and dark mode:', darkMode, 'to both body and html elements');
    console.log('HTML classes:', html.className);
    console.log('Body classes:', body.className);
  }, [theme, darkMode]);

  const setTheme = async (newTheme: Theme) => {
    const mobile = isMobile();
    if (mobile) {
      console.log('Theme change blocked on mobile device');
      return; // Prevent theme changes on mobile
    }
    
    setThemeState(newTheme);
    
    localStorage.setItem("theme", newTheme);
    
    try {
      await apiRequest("PATCH", "/api/auth/user", { theme: newTheme });
    } catch (error) {
      console.log("Theme saved locally only:", error);
    }
  };

  const toggleDarkMode = async () => {
    const mobile = isMobile();
    if (mobile) {
      console.log('Dark mode toggle blocked on mobile - using system preference');
      return; // Prevent manual dark mode toggle on mobile
    }
    
    const newDarkMode = !darkMode;
    setDarkModeState(newDarkMode);
    
    localStorage.setItem("darkMode", String(newDarkMode));
    
    try {
      await apiRequest("PATCH", "/api/auth/user", { darkMode: newDarkMode });
    } catch (error) {
      console.log("Dark mode saved locally only:", error);
    }
  };

  return (
    <ThemeProviderContext.Provider value={{
      theme,
      darkMode,
      setTheme,
      toggleDarkMode,
    }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
