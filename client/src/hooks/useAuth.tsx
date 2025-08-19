import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  theme?: string;
  darkMode?: boolean;
};

type LoginData = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const userQuery = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      console.log("Fetching user auth status...");
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        console.log("Auth response status:", response.status);
        if (response.status === 401) {
          console.log("User not authenticated (401)");
          return null; // User not logged in
        }
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }
        const userData = await response.json();
        console.log("User authenticated:", userData);
        return userData;
      } catch (error) {
        console.log("Auth check failed:", error);
        return null; // Treat errors as not logged in
      }
    },
    retry: false,
    staleTime: 0, // Always check fresh
    gcTime: 0, // Don't cache auth state (renamed from cacheTime in v5)
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error.message);
    },
  });

  const contextValue = {
    user: userQuery.data ?? null,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    loginMutation,
    logoutMutation,
    isAuthenticated: !!userQuery.data,
  };

  console.log("AuthProvider contextValue:", contextValue);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Instead of throwing an error immediately, return a safe default
    console.warn("useAuth called outside AuthProvider - returning safe defaults");
    return {
      user: null,
      isLoading: false, // Changed to false so login page shows
      error: null,
      loginMutation: { mutate: () => {}, isPending: false },
      logoutMutation: { mutate: () => {}, isPending: false },
      isAuthenticated: false,
    };
  }
  return context;
}
