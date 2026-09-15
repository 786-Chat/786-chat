import { useState, useEffect } from "react";

interface SecuritySession {
  isAuthenticated: boolean;
  expiresAt: string | null;
}

export function useSecurityPin() {
  const [securitySession, setSecuritySession] = useState<SecuritySession>({
    isAuthenticated: false,
    expiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch security session status from server on mount
  useEffect(() => {
    const fetchSecurityStatus = async () => {
      try {
        const response = await fetch('/api/security/status', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setSecuritySession({
            isAuthenticated: data.isAuthenticated,
            expiresAt: data.expiresAt,
          });
        } else {
          setSecuritySession({
            isAuthenticated: false,
            expiresAt: null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch security status:', error);
        setSecuritySession({
          isAuthenticated: false,
          expiresAt: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecurityStatus();
  }, []);

  const isSecurityAuthenticated = () => {
    return securitySession.isAuthenticated;
  };

  const authenticateWithPin = async (pin: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/security/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        const data = await response.json();
        setSecuritySession({
          isAuthenticated: true,
          expiresAt: data.expiresAt,
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Failed to authenticate with PIN:', error);
      return false;
    }
  };

  const clearSecuritySession = async () => {
    try {
      await fetch('/api/security/clear', {
        method: 'POST',
        credentials: 'include',
      });
      
      setSecuritySession({
        isAuthenticated: false,
        expiresAt: null,
      });
    } catch (error) {
      console.error('Failed to clear security session:', error);
      // Still update local state even if server request fails
      setSecuritySession({
        isAuthenticated: false,
        expiresAt: null,
      });
    }
  };

  const requireSecurityPin = (action: () => void) => {
    if (isSecurityAuthenticated()) {
      action();
      return true;
    } else {
      // This will be handled by the component that uses this hook
      return false;
    }
  };

  return {
    isSecurityAuthenticated: isSecurityAuthenticated(),
    authenticateWithPin,
    clearSecuritySession,
    requireSecurityPin,
    isLoading,
  };
}