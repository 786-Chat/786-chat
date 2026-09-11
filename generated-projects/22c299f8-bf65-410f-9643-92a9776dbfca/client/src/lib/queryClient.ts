import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Redirect an expired authenticated screen to its canonical login route.
function handle401Error(url: string) {
  console.log('🔒 Authentication expired, redirecting to login...', { url });

  const currentPath = window.location.pathname;
  const isAlreadyOnLoginPage = currentPath === '/' ||
                              currentPath === '/admin' ||
                              currentPath === '/branch' ||
                              currentPath === '/admin-login' ||
                              currentPath === '/branch-login';

  if (isAlreadyOnLoginPage) {
    return;
  }

  // Admin context must be checked before branch context. The old logic used
  // `includes("dashboard")`, which incorrectly treated /admin-dashboard as a
  // branch page and sent an expired admin session to the branch login.
  const isAdminContext = currentPath === '/admin-dashboard' ||
                         currentPath.startsWith('/admin-') ||
                         currentPath === '/pdf-builder' ||
                         currentPath === '/file-manager' ||
                         url.startsWith('/api/admin/');

  const isBranchContext = currentPath === '/branch-dashboard' ||
                          currentPath.startsWith('/branch-') ||
                          currentPath === '/branch-charts' ||
                          currentPath === '/chart' ||
                          url.startsWith('/api/branch/');

  if (isAdminContext) {
    window.location.replace('/admin-login');
    return;
  }

  if (isBranchContext) {
    window.location.replace('/branch-login');
    return;
  }

  // For protected screens without a more specific context, keep admin and
  // branch authentication separated rather than falling back to /admin or /.
  window.location.replace('/admin-login');
}

async function throwIfResNotOk(res: Response, url?: string) {
  if (!res.ok) {
    if (res.status === 401) {
      handle401Error(url || '');
      return;
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
        return null;
      }
    }

    await throwIfResNotOk(res, url);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
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
