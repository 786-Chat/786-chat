import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Global 401 error handler - redirects to appropriate login page
function handle401Error(url: string) {
  console.log('🔒 Authentication expired, redirecting to login...', { url });
  
  // Check if user is already on a login page - don't redirect if so
  const currentPath = window.location.pathname;
  const isAlreadyOnLoginPage = currentPath === '/' || 
                              currentPath === '/admin' || 
                              currentPath === '/branch' ||
                              currentPath === '/admin-login' ||
                              currentPath === '/branch-login';
  
  if (isAlreadyOnLoginPage) {
    console.log('User already on login page, not redirecting');
    return; // Don't redirect if already on a login page
  }
  
  // Check if this is a branch dashboard context by looking at current path
  const isBranchContext = currentPath.startsWith('/branch') || 
                         currentPath.includes('dashboard') ||
                         window.location.search.includes('branch');
  
  // Clear any existing session data and redirect to appropriate login
  if (isBranchContext) {
    // For branch users, redirect to branch login
    window.location.href = '/';
  } else {
    // For admin users, redirect to admin login page (not backend endpoint)
    window.location.href = '/admin';
  }
}

async function throwIfResNotOk(res: Response, url?: string) {
  if (!res.ok) {
    // Handle 401 errors globally to prevent cards from disappearing
    if (res.status === 401) {
      handle401Error(url || '');
      return; // Don't throw, just redirect
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res, url);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const res = await fetch(url, {
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "redirect") {
        handle401Error(url);
        return null; // Return null while redirect happens
      }
      // If "throw", continue to throwIfResNotOk which will handle the redirect
    }

    await throwIfResNotOk(res, url);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default to redirect behavior to prevent cards from disappearing
      queryFn: getQueryFn({ on401: "redirect" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
