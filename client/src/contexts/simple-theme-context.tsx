import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type Theme = "blue" | "pink" | "green" | "orange" | "red";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "blue",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("blue");

  // Initialize theme on mount - always blue for mobile, or from localStorage
  useEffect(() => {
    const mobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (mobile) {
      // Mobile always uses blue theme
      setThemeState("blue");
    } else {
      // Desktop: check localStorage or default to blue
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      } else {
        setThemeState("blue");
      }
    }
  }, []);

  // Apply theme class to body
  useEffect(() => {
    const body = document.body;
    
    // Remove any existing theme classes
    body.classList.remove("theme-blue", "theme-pink", "theme-green", "theme-orange", "theme-red");
    
    // Add the current theme class
    body.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    const mobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (mobile) {
      // Prevent theme changes on mobile
      return;
    }
    
    setThemeState(newTheme);
    
    // Always save to localStorage, and optionally try to save to server
    localStorage.setItem("theme", newTheme);
    
    try {
      await apiRequest("PATCH", "/api/auth/user", { theme: newTheme });
    } catch (error) {
      // If server save fails, localStorage will still work
      console.log("Theme saved locally only:", error);
    }
  };

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
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