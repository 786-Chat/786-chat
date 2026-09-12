import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
};

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  isLoading: true,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  ...props
}: ThemeProviderProps) {
  const [theme, setLocalTheme] = useState<Theme>(defaultTheme);
  const queryClient = useQueryClient();

  // Fetch user preferences from database
  const { data: userPreferences, isLoading } = useQuery<{ theme?: string }>({
    queryKey: ['/api/user/preferences'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if user not authenticated
  });

  // Update theme when preferences are loaded
  useEffect(() => {
    if (userPreferences?.theme) {
      const dbTheme = userPreferences.theme;
      // Map database theme values to our Theme type
      const validTheme: Theme = (dbTheme === 'light' || dbTheme === 'dark') ? dbTheme : defaultTheme;
      setLocalTheme(validTheme);
    }
  }, [userPreferences, defaultTheme]);

  // Save theme to database
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Theme) => {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update theme');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    },
    onError: (error) => {
      console.warn('Failed to save theme to database:', error);
      // Theme will still be applied locally, just not persisted
    },
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setLocalTheme(newTheme);
    // Try to save to database, but apply theme immediately
    updateThemeMutation.mutate(newTheme);
  };

  const value = {
    theme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
