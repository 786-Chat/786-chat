import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Shirt, Eye, Copy, CreditCard, Power, LayoutDashboard } from "lucide-react";

export default function ClothingAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editBrand, setEditBrand] = useState<any>(null);
  const [showPayment, setShowPayment] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", description: "", phone: "", whatsappNumber: "", email: "", address: "", city: "",
    country: "Pakistan", currency: "PKR", primaryColor: "#000000", secondaryColor: "#ffffff",
    adminUsername: "", adminPassword: "", logo: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    stripePublishableKey: "", stripeSecretKey: "",
    freeDeliveryThreshold: "", deliveryFee: "",
    cashEnabled: true,
    bankEnabled: false, bankName: "", bankAccountName: "", bankAccountNumber: "", bankIBAN: "",
    jazzCashEnabled: false, jazzCashName: "", jazzCashNumber: "",
    easyPaisaEnabled: false, easyPaisaName: "", easyPaisaNumber: "",
    cardEnabled: false,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["/api/clothing/brands"],
    queryFn: () => fetch("/api/clothing/brands").then(r => r.json()),
  });

  const createBrand = useMutation({
    mutationFn: (data: any) => fetch("/api/clothing/brands", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: async (brand) => {
      await fetch(`/api/clothing/seed-categories/${brand.id}`, { method: "POST" });
      await fetch(`/api/clothing/seed-products/${brand.id}`, { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/brands"] });
      setShowCreate(false);
      resetForm();
      toast({ title: "Brand created with demo categories & products!" });
    },
  });

  const updateBrand = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/clothing/brands/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/brands"] });
      setEditBrand(null);
      setShowPayment(null);
      resetForm();
      toast({ title: "Brand updated!" });
    },
  });

  const deleteBrand = useMutation({
    mutationFn: (id: string) => fetch(`/api/clothing/brands/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/brands"] });
      toast({ title: "Brand deleted" });
    },
  });

  const duplicateBrand = useMutation({
    mutationFn: async (brand: any) => {
      const res = await fetch(`/api/clothing/brands/${brand.id}/duplicate`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/brands"] });
      toast({ title: "Brand duplicated with all categories & products!" });
    },
  });

  function resetForm() {
    setForm({
      name: "", description: "", phone: "", whatsappNumber: "", email: "", address: "", city: "",
      country: "Pakistan", currency: "PKR", primaryColor: "#000000", secondaryColor: "#ffffff",
      adminUsername: "", adminPassword: "", logo: "",
    });
  }

  function openEdit(brand: any) {
    setEditBrand(brand);
    setForm({
      name: brand.name || "", description: brand.description || "", phone: brand.phone || "",
      whatsappNumber: brand.whatsappNumber || "",
      email: brand.email || "", address: brand.address || "", city: brand.city || "",
      country: brand.country || "Pakistan", currency: brand.currency || "PKR",
      primaryColor: brand.primaryColor || "#000000", secondaryColor: brand.secondaryColor || "#ffffff",
      adminUsername: brand.adminUsername || "", adminPassword: brand.adminPassword || "",
      logo: brand.logo || "",
    });
  }

  function openPayment(brand: any) {
    setShowPayment(brand);
    const pm = brand.paymentMethods || {};
    setPaymentForm({
      stripePublishableKey: brand.stripePublishableKey || "",
      stripeSecretKey: brand.stripeSecretKey || "",
      freeDeliveryThreshold: brand.freeDeliveryThreshold || "",
      deliveryFee: brand.deliveryFee || "",
      cashEnabled: pm.cashEnabled !== false,
      bankEnabled: !!pm.bankEnabled,
      bankName: pm.bankName || "",
      bankAccountName: pm.bankAccountName || "",
      bankAccountNumber: pm.bankAccountNumber || "",
      bankIBAN: pm.bankIBAN || "",
      jazzCashEnabled: !!pm.jazzCashEnabled,
      jazzCashName: pm.jazzCashName || "",
      jazzCashNumber: pm.jazzCashNumber || "",
      easyPaisaEnabled: !!pm.easyPaisaEnabled,
      easyPaisaName: pm.easyPaisaName || "",
      easyPaisaNumber: pm.easyPaisaNumber || "",
      cardEnabled: !!pm.cardEnabled,
    });
  }

  function savePaymentSettings(brandId: string) {
    const { stripePublishableKey, stripeSecretKey, freeDeliveryThreshold, deliveryFee, ...pmFields } = paymentForm;
    updateBrand.mutate({
      id: brandId,
      data: {
        stripePublishableKey,
        stripeSecretKey,
        freeDeliveryThreshold,
        deliveryFee,
        paymentMethods: pmFields,
      },
    });
  }

  const BrandForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Brand Name *</Label><Input data-testid="input-brand-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Logo URL</Label><Input data-testid="input-brand-logo" value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} placeholder="/logo.png or https://..." /></div>
      </div>
      <div><Label>Description</Label><Textarea data-testid="input-brand-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
      </div>
      <div>
        <Label className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold">W</span>
          WhatsApp Number
          <span className="text-xs text-gray-400 font-normal">(with country code, e.g. +923001234567)</span>
        </Label>
        <Input
          data-testid="input-brand-whatsapp"
          value={form.whatsappNumber}
          onChange={e => setForm({ ...form, whatsappNumber: e.target.value })}
          placeholder="+923001234567"
        />
        <p className="text-xs text-gray-500 mt-1">When set, a WhatsApp button will appear on this brand's public store. Leave empty to hide.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
        <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
        <div><Label>Currency</Label>
          <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PKR">PKR (₨)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="AED">AED (د.إ)</SelectItem>
              <SelectItem value="SAR">SAR (﷼)</SelectItem>
              <SelectItem value="TRY">TRY (₺)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Primary Color</Label><div className="flex gap-2"><Input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-14 h-10" /><Input value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} /></div></div>
        <div><Label>Secondary Color</Label><div className="flex gap-2"><Input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="w-14 h-10" /><Input value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} /></div></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Admin Username *</Label><Input data-testid="input-admin-username" value={form.adminUsername} onChange={e => setForm({ ...form, adminUsername: e.target.value })} /></div>
        <div><Label>Admin Password *</Label><Input data-testid="input-admin-password" type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} /></div>
      </div>
      <Button data-testid="button-submit-brand" onClick={onSubmit} className="w-full bg-pink-600 hover:bg-pink-700">{submitLabel}</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/portal")} data-testid="button-back-portal">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Shirt className="h-8 w-8 text-pink-400" />
            <div>
              <h1 className="text-xl font-bold">Clothing Super Admin</h1>
              <p className="text-sm text-gray-400">Manage all clothing brands & branches</p>
            </div>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-brand" className="bg-pink-600 hover:bg-pink-700" onClick={() => { resetForm(); setShowCreate(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-2xl">
              <DialogHeader><DialogTitle>Create New Clothing Brand</DialogTitle></DialogHeader>
              <BrandForm
                submitLabel="Create Brand"
                onSubmit={() => { if (!form.name) return; createBrand.mutate(form); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand: any) => (
            <Card key={brand.id} className={`bg-black/40 border-white/10 text-white transition-all ${brand.isActive ? "hover:border-pink-500/50" : "opacity-60 hover:opacity-80"}`} data-testid={`card-brand-${brand.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: brand.primaryColor || "#000" }}>
                        <Shirt className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      <p className="text-xs text-gray-400">{brand.slug}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateBrand.mutate({ id: brand.id, data: { isActive: !brand.isActive } })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${brand.isActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
                    data-testid={`button-toggle-active-${brand.id}`}
                  >
                    <Power className="h-3 w-3" />
                    {brand.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{brand.description || "No description"}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-white/10 px-2 py-1 rounded">{brand.currency}</span>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded">{brand.city || "No city"}</span>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded">{brand.country}</span>
                  <span className={`text-xs px-2 py-1 rounded ${brand.stripeSecretKey ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {brand.stripeSecretKey ? "Stripe Connected" : "No Stripe"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => window.open(`/clothing/${brand.slug}`, "_blank")} data-testid={`button-view-store-${brand.id}`}>
                    <Eye className="h-3 w-3 mr-1" /> Store
                  </Button>
                  <Button size="sm" variant="outline" className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10" onClick={() => {
                    localStorage.setItem("clothingBrand", JSON.stringify(brand));
                    window.open("/clothing-brand-dashboard", "_blank");
                  }} data-testid={`button-brand-dashboard-${brand.id}`}>
                    <LayoutDashboard className="h-3 w-3 mr-1" /> Dashboard
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Dialog open={showPayment?.id === brand.id} onOpenChange={open => { if (!open) setShowPayment(null); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white font-bold col-span-2" onClick={() => openPayment(brand)} data-testid={`button-payment-${brand.id}`}>
                        <CreditCard className="h-4 w-4 mr-2" /> Payment Settings & Barcode
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Payment Settings — {brand.name}</DialogTitle></DialogHeader>
                      <div className="grid gap-5">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-400">Configure which payment methods customers can choose at checkout. Only enabled methods will appear on the public store.</p>
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><span className="text-2xl">💵</span><Label className="font-bold">Cash on Delivery</Label></div>
                            <Switch checked={paymentForm.cashEnabled} onCheckedChange={v => setPaymentForm({ ...paymentForm, cashEnabled: v })} data-testid="switch-cash" />
                          </div>
                          <p className="text-xs text-gray-400">Customer pays cash when product is delivered. No setup needed.</p>
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2"><span className="text-2xl">🏦</span><Label className="font-bold">Bank Transfer</Label></div>
                            <Switch checked={paymentForm.bankEnabled} onCheckedChange={v => setPaymentForm({ ...paymentForm, bankEnabled: v })} data-testid="switch-bank" />
                          </div>
                          {paymentForm.bankEnabled && (
                            <div className="grid gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Bank Name</Label><Input placeholder="e.g. HBL, Meezan, UBL" value={paymentForm.bankName} onChange={e => setPaymentForm({ ...paymentForm, bankName: e.target.value })} className="bg-white/5 border-white/20 h-9" data-testid="input-bank-name" /></div>
                                <div><Label className="text-xs">Account Title</Label><Input placeholder="Account holder name" value={paymentForm.bankAccountName} onChange={e => setPaymentForm({ ...paymentForm, bankAccountName: e.target.value })} className="bg-white/5 border-white/20 h-9" /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Account Number</Label><Input placeholder="01234567890" value={paymentForm.bankAccountNumber} onChange={e => setPaymentForm({ ...paymentForm, bankAccountNumber: e.target.value })} className="bg-white/5 border-white/20 h-9 font-mono" /></div>
                                <div><Label className="text-xs">IBAN</Label><Input placeholder="PK00..." value={paymentForm.bankIBAN} onChange={e => setPaymentForm({ ...paymentForm, bankIBAN: e.target.value })} className="bg-white/5 border-white/20 h-9 font-mono" /></div>
                              </div>
                              {(paymentForm.bankAccountNumber || paymentForm.bankIBAN) && (
                                <div className="flex items-center gap-3 bg-white/5 rounded p-3 border border-white/10">
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${paymentForm.bankName} | ${paymentForm.bankAccountName} | ${paymentForm.bankAccountNumber} | IBAN: ${paymentForm.bankIBAN || "N/A"}`)}`} alt="Bank QR" className="w-24 h-24 bg-white p-1 rounded" data-testid="img-bank-qr-preview" />
                                  <div className="text-xs text-gray-300">
                                    <p className="font-bold text-emerald-400 mb-1">✓ Auto QR Generated</p>
                                    <p>Customer will see this QR at checkout to copy your bank details.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2"><span className="text-2xl">📱</span><Label className="font-bold">JazzCash</Label></div>
                            <Switch checked={paymentForm.jazzCashEnabled} onCheckedChange={v => setPaymentForm({ ...paymentForm, jazzCashEnabled: v })} data-testid="switch-jazzcash" />
                          </div>
                          {paymentForm.jazzCashEnabled && (
                            <div className="grid gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Account Title</Label><Input placeholder="Account holder name" value={paymentForm.jazzCashName} onChange={e => setPaymentForm({ ...paymentForm, jazzCashName: e.target.value })} className="bg-white/5 border-white/20 h-9" /></div>
                                <div><Label className="text-xs">JazzCash Number</Label><Input placeholder="03001234567" value={paymentForm.jazzCashNumber} onChange={e => setPaymentForm({ ...paymentForm, jazzCashNumber: e.target.value })} className="bg-white/5 border-white/20 h-9 font-mono" /></div>
                              </div>
                              {paymentForm.jazzCashNumber && (
                                <div className="flex items-center gap-3 bg-white/5 rounded p-3 border border-white/10">
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`JazzCash: ${paymentForm.jazzCashName} | ${paymentForm.jazzCashNumber}`)}`} alt="JazzCash QR" className="w-24 h-24 bg-white p-1 rounded" data-testid="img-jazzcash-qr-preview" />
                                  <div className="text-xs text-gray-300">
                                    <p className="font-bold text-emerald-400 mb-1">✓ Auto QR Generated</p>
                                    <p>Customer will see this QR at checkout to send JazzCash payment.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2"><span className="text-2xl">📲</span><Label className="font-bold">EasyPaisa</Label></div>
                            <Switch checked={paymentForm.easyPaisaEnabled} onCheckedChange={v => setPaymentForm({ ...paymentForm, easyPaisaEnabled: v })} data-testid="switch-easypaisa" />
                          </div>
                          {paymentForm.easyPaisaEnabled && (
                            <div className="grid gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Account Title</Label><Input placeholder="Account holder name" value={paymentForm.easyPaisaName} onChange={e => setPaymentForm({ ...paymentForm, easyPaisaName: e.target.value })} className="bg-white/5 border-white/20 h-9" /></div>
                                <div><Label className="text-xs">EasyPaisa Number</Label><Input placeholder="03451234567" value={paymentForm.easyPaisaNumber} onChange={e => setPaymentForm({ ...paymentForm, easyPaisaNumber: e.target.value })} className="bg-white/5 border-white/20 h-9 font-mono" /></div>
                              </div>
                              {paymentForm.easyPaisaNumber && (
                                <div className="flex items-center gap-3 bg-white/5 rounded p-3 border border-white/10">
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`EasyPaisa: ${paymentForm.easyPaisaName} | ${paymentForm.easyPaisaNumber}`)}`} alt="EasyPaisa QR" className="w-24 h-24 bg-white p-1 rounded" data-testid="img-easypaisa-qr-preview" />
                                  <div className="text-xs text-gray-300">
                                    <p className="font-bold text-emerald-400 mb-1">✓ Auto QR Generated</p>
                                    <p>Customer will see this QR at checkout to send EasyPaisa payment.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2"><span className="text-2xl">💳</span><Label className="font-bold">Card (Stripe)</Label></div>
                            <Switch checked={paymentForm.cardEnabled} onCheckedChange={v => setPaymentForm({ ...paymentForm, cardEnabled: v })} data-testid="switch-card" />
                          </div>
                          {paymentForm.cardEnabled && (
                            <div className="grid gap-3">
                              <div><Label className="text-xs">Stripe Publishable Key</Label><Input placeholder="pk_live_..." value={paymentForm.stripePublishableKey} onChange={e => setPaymentForm({ ...paymentForm, stripePublishableKey: e.target.value })} className="bg-white/5 border-white/20 font-mono text-xs h-9" /></div>
                              <div><Label className="text-xs">Stripe Secret Key</Label><Input placeholder="sk_live_..." type="password" value={paymentForm.stripeSecretKey} onChange={e => setPaymentForm({ ...paymentForm, stripeSecretKey: e.target.value })} className="bg-white/5 border-white/20 font-mono text-xs h-9" /></div>
                            </div>
                          )}
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                          <Label className="font-bold mb-3 block">🚚 Delivery</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label className="text-xs">Delivery Fee ({brand.currency})</Label><Input type="number" value={paymentForm.deliveryFee} onChange={e => setPaymentForm({ ...paymentForm, deliveryFee: e.target.value })} className="bg-white/5 border-white/20 h-9" /></div>
                            <div><Label className="text-xs">Free Delivery Over ({brand.currency})</Label><Input type="number" placeholder="e.g. 5000" value={paymentForm.freeDeliveryThreshold} onChange={e => setPaymentForm({ ...paymentForm, freeDeliveryThreshold: e.target.value })} className="bg-white/5 border-white/20 h-9" /></div>
                          </div>
                        </div>

                        <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={() => { savePaymentSettings(brand.id); toast({ title: "Payment settings saved!" }); setShowPayment(null); }} data-testid="button-save-payment">
                          Save Payment Settings
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Dialog open={editBrand?.id === brand.id} onOpenChange={(open) => { if (!open) { setEditBrand(null); resetForm(); } }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => openEdit(brand)} data-testid={`button-edit-brand-${brand.id}`}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-2xl">
                      <DialogHeader><DialogTitle>Edit {brand.name}</DialogTitle></DialogHeader>
                      <BrandForm
                        submitLabel="Save Changes"
                        onSubmit={() => updateBrand.mutate({ id: brand.id, data: form })}
                      />
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => duplicateBrand.mutate(brand)}
                    data-testid={`button-duplicate-brand-${brand.id}`}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>

                  <Button size="sm" variant="destructive" onClick={() => deleteBrand.mutate(brand.id)} data-testid={`button-delete-brand-${brand.id}`}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {brands.length === 0 && (
          <div className="text-center py-20">
            <Shirt className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Clothing Brands Yet</h2>
            <p className="text-gray-400 mb-6">Create your first clothing brand to get started</p>
            <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create First Brand
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
