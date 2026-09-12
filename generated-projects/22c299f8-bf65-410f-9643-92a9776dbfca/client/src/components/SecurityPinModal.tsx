import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export default function SecurityPinModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Security Verification Required",
  description = "Enter the security PIN to access code modification features"
}: SecurityPinModalProps) {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const { toast } = useToast();

  const SECURITY_PIN = "121212";
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_TIME = 300000; // 5 minutes

  const handlePinSubmit = () => {
    if (isLocked) {
      toast({
        title: "Security Lockout",
        description: "Too many failed attempts. Please wait 5 minutes.",
        variant: "destructive",
      });
      return;
    }

    if (pin === SECURITY_PIN) {
      setPin("");
      setAttempts(0);
      onSuccess();
      toast({
        title: "Access Granted",
        description: "Security verification successful",
      });
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin("");

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, LOCKOUT_TIME);

        toast({
          title: "Security Lockout",
          description: "Too many failed attempts. Access locked for 5 minutes.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Access Denied",
          description: `Invalid PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
          variant: "destructive",
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePinSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              {isLocked ? <AlertTriangle className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Security Warning */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-red-400" />
              <span className="text-red-300 font-medium">Protected Area</span>
            </div>
            <p className="text-red-200 text-sm">{description}</p>
          </div>

          {/* PIN Input */}
          <div className="space-y-3">
            <label className="text-white font-medium">Security PIN</label>
            <Input
              type="password"
              placeholder="Enter 6-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              disabled={isLocked}
              className="bg-slate-800 border-slate-600 text-white text-center text-xl tracking-widest"
              maxLength={6}
            />
            
            {attempts > 0 && !isLocked && (
              <p className="text-red-400 text-sm">
                {MAX_ATTEMPTS - attempts} attempts remaining
              </p>
            )}
            
            {isLocked && (
              <p className="text-red-400 text-sm">
                Access locked for 5 minutes due to failed attempts
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePinSubmit}
              disabled={pin.length !== 6 || isLocked}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Lock className="w-4 h-4 mr-2" />
              Verify PIN
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}