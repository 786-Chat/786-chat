import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { LogOut, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLink24Phone } from "@/components/admin/admin-link24-phone";

export default function Link24PhoneAdminPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("link24PhoneAdmin");
    if (!stored) {
      setLocation("/link24-phone-login");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("link24PhoneAdmin");
      setLocation("/link24-phone-login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("link24PhoneAdmin");
    setLocation("/link24-phone-login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Link24 Phone</h1>
              <p className="text-xs text-muted-foreground">Hosted PBX Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-user-email">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => setLocation("/portal")} data-testid="button-portal">
              <ArrowLeft className="h-4 w-4 mr-1" /> Portal
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <AdminLink24Phone />
    </div>
  );
}
