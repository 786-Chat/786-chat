import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TawaLoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomer: any;
  onCustomerUpdate: (customer: any) => void;
}

export function TawaLoginPopup({ 
  isOpen, 
  onClose, 
  initialCustomer,
  onCustomerUpdate 
}: TawaLoginPopupProps) {
  const [activeTab, setActiveTab] = useState<"login" | "create">("create");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerWorkAddress, setCustomerWorkAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPostcode, setCustomerPostcode] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState<any>(initialCustomer);

  useEffect(() => {
    if (initialCustomer) {
      setCurrentCustomer(initialCustomer);
      setCustomerName(initialCustomer.name || "");
      setCustomerPhone(initialCustomer.phone?.replace("+44", "") || "");
      setCustomerAddress(initialCustomer.address || "");
      setCustomerWorkAddress(initialCustomer.workAddress || "");
      setCustomerCity(initialCustomer.city || "");
      setCustomerPostcode(initialCustomer.postcode || "");
    }
  }, [initialCustomer]);

  const handleClose = () => {
    onClose();
  };

  const handleLogin = async () => {
    if (!customerPhone) {
      toast({ title: "Error", description: "Please enter your phone number", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: "+44" + customerPhone.replace(/\s/g, "")
        }),
      });
      const data = await res.json();
      if (data.customer) {
        setCurrentCustomer(data.customer);
        setCustomerName(data.customer.name || "");
        setCustomerAddress(data.customer.address || "");
        setCustomerWorkAddress(data.customer.workAddress || "");
        setCustomerCity(data.customer.city || "");
        setCustomerPostcode(data.customer.postcode || "");
        onCustomerUpdate(data.customer);
        if (!data.isNewCustomer && data.customer.name) {
          toast({ title: "Welcome back!", description: `Logged in as ${data.customer.name}` });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to login", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!customerName) {
      toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
      return;
    }
    if (!currentCustomer) return;
    
    try {
      const res = await fetch(`/api/customers/${currentCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: customerName, 
          address: customerAddress,
          workAddress: customerWorkAddress,
          city: customerCity,
          postcode: customerPostcode 
        }),
      });
      const data = await res.json();
      setCurrentCustomer(data);
      onCustomerUpdate(data);
      toast({ title: "Success!", description: "Your details have been saved" });
      handleClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save details", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setCurrentCustomer(null);
    setCustomerPhone("");
    setCustomerName("");
    setCustomerAddress("");
    setCustomerWorkAddress("");
    setCustomerCity("");
    setCustomerPostcode("");
    onCustomerUpdate(null);
    toast({ title: "Logged out", description: "You have been logged out" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={handleClose} 
        data-testid="overlay-login" 
      />
      <div 
        className="relative w-full max-w-md h-full overflow-y-auto shadow-2xl"
        style={{ 
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%)'
        }}
      >
        {/* Header with tabs */}
        <div 
          className="p-6 border-b flex items-start justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <div className="flex-1">
            {/* Login / Create Account Tabs */}
            {!currentCustomer && (
              <div className="flex gap-6 mb-4">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === "login" 
                      ? "text-white border-amber-400" 
                      : "text-white/60 border-transparent hover:text-white/80"
                  }`}
                  data-testid="tab-login"
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab("create")}
                  className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${
                    activeTab === "create" 
                      ? "text-white border-amber-400" 
                      : "text-white/60 border-transparent hover:text-white/80"
                  }`}
                  data-testid="tab-create-account"
                >
                  Create Account
                </button>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-2 text-white">
              {currentCustomer ? "Welcome Back!" : activeTab === "login" ? "Log In" : "Create Account"}
            </h2>
            <p className="text-white/70">
              {currentCustomer 
                ? `Logged in as ${currentCustomer.name || customerPhone}` 
                : "Sign up to save your details for faster ordering"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-white/10 border border-white/30"
            data-testid="button-close-login"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Registration Form */}
        <div className="p-6 space-y-4">
          {/* Name - First field (only for Create Account tab) */}
          {!currentCustomer && activeTab === "create" && (
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Name *
              </label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-12"
                style={{ background: '#e5e7eb', borderColor: '#d1d5db', color: '#1f2937' }}
                data-testid="input-customer-name-first"
              />
            </div>
          )}
          
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Mobile Number *
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 h-12 rounded-lg" style={{ background: '#e5e7eb', border: '1px solid #d1d5db' }}>
                <span className="text-lg">🇬🇧</span>
                <span className="text-gray-800">+44</span>
              </div>
              <Input
                type="tel"
                placeholder="7123 456789"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-12 flex-1"
                style={{ background: '#e5e7eb', borderColor: '#d1d5db', color: '#1f2937' }}
                disabled={!!currentCustomer}
                data-testid="input-customer-phone"
              />
            </div>
          </div>

          {/* If not logged in, show "Continue" button first */}
          {!currentCustomer && (
            <Button
              className="w-full h-12 text-white rounded-lg font-semibold"
              style={{ background: 'linear-gradient(135deg, #1f6f4d 0%, #2d8a5e 100%)' }}
              onClick={handleLogin}
              data-testid="button-continue-phone"
            >
              Continue
            </Button>
          )}

          {/* Show full form after phone verification */}
          {currentCustomer && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Full Name *</label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-12"
                  style={{ background: '#e5e7eb', borderColor: '#d1d5db', color: '#1f2937' }}
                  data-testid="input-customer-name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Home Address</label>
                <Input
                  type="text"
                  placeholder="Enter your home address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="h-12"
                  style={{ background: '#e5e7eb', borderColor: '#d1d5db', color: '#1f2937' }}
                  data-testid="input-customer-address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">Work Address</label>
                <Input
                  type="text"
                  placeholder="Enter your work address (optional)"
                  value={customerWorkAddress}
                  onChange={(e) => setCustomerWorkAddress(e.target.value)}
                  className="h-12"
                  style={{ background: '#e5e7eb', borderColor: '#d1d5db', color: '#1f2937' }}
                  data-testid="input-customer-work-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">City</label>
                  <Input
                    type="text"
                    placeholder="e.g. Watford"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="h-12"
                    style={{ background: '#e5e7eb', borderColor: '#d1d5db', color: '#1f2937' }}
                    data-testid="input-customer-city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Postcode</label>
                  <Input
                    type="text"
                    placeholder="e.g. WD17 1AA"
                    value={customerPostcode}
                    onChange={(e) => setCustomerPostcode(e.target.value)}
                    className="h-12"
                    style={{ background: '#e5e7eb', borderColor: '#d1d5db', color: '#1f2937' }}
                    data-testid="input-customer-postcode"
                  />
                </div>
              </div>
              
              <Button
                className="w-full h-14 text-white rounded-lg font-semibold mt-4"
                style={{ background: 'linear-gradient(135deg, #1f6f4d 0%, #2d8a5e 100%)' }}
                onClick={handleSave}
                data-testid="button-save-details"
              >
                Save Details
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 rounded-lg border-white/30 text-white bg-transparent hover:bg-white/10"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                Log Out
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
