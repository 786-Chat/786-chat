import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, LogIn, Star } from "lucide-react";

export default function QuranAcademyLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () => fetch("/api/quran/academy-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then(r => { if (!r.ok) throw new Error("Invalid credentials"); return r.json(); }),
    onSuccess: (academy: any) => {
      localStorage.setItem("quranAcademyId", academy.id);
      localStorage.setItem("quranAcademyName", academy.name);
      localStorage.setItem("quranAcademySlug", academy.slug);
      setLocation("/quran-academy-dashboard");
    },
    onError: () => toast({ title: "Login failed", description: "Invalid username or password", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a2e1a 0%, #0d3d23 25%, #0a2e1a 50%, #071e12 100%)" }}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute animate-pulse" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s`,
          }}>
            <Star className="text-amber-400/10" style={{ width: 8 + Math.random() * 16, height: 8 + Math.random() * 16 }} />
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Mujeeb Quran Academy</h1>
          <p className="text-emerald-300/60">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-4">
            <div>
              <Label className="text-emerald-300/70 text-sm">Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username"
                className="bg-white/5 border-emerald-500/20 text-white placeholder:text-emerald-300/30 mt-1" data-testid="input-login-username"
                onKeyDown={e => e.key === "Enter" && login.mutate()} />
            </div>
            <div>
              <Label className="text-emerald-300/70 text-sm">Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                className="bg-white/5 border-emerald-500/20 text-white placeholder:text-emerald-300/30 mt-1" data-testid="input-login-password"
                onKeyDown={e => e.key === "Enter" && login.mutate()} />
            </div>
            <Button onClick={() => login.mutate()} disabled={login.isPending} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white h-12 text-lg shadow-lg shadow-emerald-500/20" data-testid="button-login">
              <LogIn className="h-5 w-5 mr-2" /> {login.isPending ? "Logging in..." : "Login"}
            </Button>
          </div>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => setLocation("/quran-student-login")} className="text-emerald-400/60 text-sm hover:text-emerald-400 transition-colors underline underline-offset-4" data-testid="link-student-login">
            Student? Login here
          </button>
        </div>

        <div className="mt-6 bg-white/5 backdrop-blur-sm border border-emerald-500/10 rounded-xl p-5 text-center">
          <p className="text-amber-400/70 text-xs mb-3 font-medium">Before logging in, kindly remember me in your prayers:</p>
          <div className="space-y-2 text-emerald-300/50 text-xs leading-relaxed" dir="auto">
            <p>May Allah grant me success in this world and the Hereafter, bless my parents with the highest مقام in Jannah, and grant me and my family success in both worlds.</p>
            <p>May Allah grant us death with Imaan and دخول into Jannah without حساب.</p>
            <p>May Allah forgive our sins. Ameen.</p>
          </div>
          <p className="text-amber-400/40 text-lg mt-3" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>آمین یا رب العالمین</p>
        </div>

        <p className="text-center text-emerald-400/30 text-xs mt-6">Powered by Link24</p>
      </div>
    </div>
  );
}
