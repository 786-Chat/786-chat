import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import useSound from "use-sound";
import { Building2, Lock, User, Eye, EyeOff, Crown, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type UserRole = "super_admin" | "admin" | "staff";

const roleConfig = {
  super_admin: {
    icon: Crown,
    title: "Super Admin",
    description: "Full system control",
    gradient: "from-amber-500 to-yellow-600",
    password: "king123",
  },
  admin: {
    icon: Shield,
    title: "Administrator",
    description: "Property management",
    gradient: "from-blue-500 to-indigo-600",
    password: "admin123",
  },
  staff: {
    icon: Users,
    title: "Staff / Agent",
    description: "View assigned properties",
    gradient: "from-emerald-500 to-teal-600",
    password: "staff123",
  },
};

export default function PropertyAdminLogin() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("super_admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const config = roleConfig[selectedRole];
    if (password === config.password) {
      localStorage.setItem("propertyRole", selectedRole);
      localStorage.setItem("propertyLoggedIn", "true");
      localStorage.setItem("propertyUsername", username || config.title);
      
      toast({
        title: "Login Successful",
        description: `Welcome, ${username || config.title}!`,
      });

      setLocation("/property-super-admin");
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-yellow-900/10 via-transparent to-transparent" />
      </div>

      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-400/20 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, -50, null],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-3xl blur-xl" />

        <div className="relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/20 shadow-2xl">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Building2 className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              KING'S PROPERTY
            </h1>
            <p className="text-amber-400/70 text-sm mt-1">Admin Control System</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-sm text-gray-400 mb-3 text-center">Select your role</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                const config = roleConfig[role];
                const isSelected = selectedRole === role;
                return (
                  <motion.button
                    key={role}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole(role)}
                    className={`relative p-3 rounded-xl border transition-all duration-300 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="selectedRole"
                        className="absolute inset-0 border-2 border-amber-500 rounded-xl"
                      />
                    )}
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                      <config.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs font-medium text-white truncate">{config.title}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 h-12 bg-white/5 border-amber-500/20 text-white placeholder:text-gray-500 focus:border-amber-500/50 rounded-xl"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 bg-white/5 border-amber-500/20 text-white placeholder:text-gray-500 focus:border-amber-500/50 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold hover:from-amber-400 hover:to-yellow-500 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-300"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                  />
                ) : (
                  <>
                    Enter Control Room
                    <Crown className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-gray-500">
              Demo: super_admin / king123 | admin / admin123 | staff / staff123
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
