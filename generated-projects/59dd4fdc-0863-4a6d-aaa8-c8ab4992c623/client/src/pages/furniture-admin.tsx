import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Eye, Edit, Trash2, Copy, Sofa, LayoutDashboard, Upload, KeyRound } from "lucide-react";

export default function FurnitureAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState<any>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", phone: "", email: "", address: "41 Hamilton Road, IG1 2EU",
    city: "London", country: "UK", currency: "£", primaryColor: "#C9A96E", secondaryColor: "#1a1a2e",
    accentColor: "#D4AF37", bgColor: "#0f0f1a", adminUsername: "", adminPassword: "",
    stripePublishableKey: "", stripeSecretKey: "", deliveryFee: "0",
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["/api/furniture/brands"],
    queryFn: () => fetch("/api/furniture/brands").then(r => r.json()),
  });

  const createBrand = useMutation({
    mutationFn: (data: any) => fetch("/api/furniture/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/brands"] }); setShowForm(false); toast({ title: "Brand created!" }); },
  });

  const updateBrand = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/furniture/brands/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/brands"] }); setEditBrand(null); setShowForm(false); toast({ title: "Brand updated!" }); },
  });

  const deleteBrand = useMutation({
    mutationFn: (id: string) => fetch(`/api/furniture/brands/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/brands"] }); toast({ title: "Brand deleted!" }); },
  });

  const duplicateBrand = useMutation({
    mutationFn: (id: string) => fetch(`/api/furniture/brands/${id}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/brands"] }); toast({ title: "Brand duplicated!" }); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/furniture/brands/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/brands"] }); toast({ title: "Status updated!" }); },
  });

  const handleSaveCredentials = async () => {
    if (!showCredentials || !newUsername || !newPassword) return;
    await fetch(`/api/furniture/brands/${showCredentials.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUsername: newUsername, adminPassword: newPassword }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/furniture/brands"] });
    toast({ title: "Login credentials updated!" });
    setShowCredentials(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-stone-950 to-amber-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/portal")} className="text-white hover:bg-white/10" data-testid="button-back-portal">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Super Admin Furniture</h1>
              <p className="text-sm text-gray-400">Manage furniture brands & stores</p>
            </div>
          </div>
          <Button onClick={() => { setEditBrand(null); setForm({ name: "", description: "", phone: "", email: "", address: "41 Hamilton Road, IG1 2EU", city: "London", country: "UK", currency: "£", primaryColor: "#C9A96E", secondaryColor: "#1a1a2e", accentColor: "#D4AF37", bgColor: "#0f0f1a", adminUsername: "", adminPassword: "", stripePublishableKey: "", stripeSecretKey: "", deliveryFee: "0" }); setShowForm(true); }}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" data-testid="button-add-brand">
            <Plus className="h-4 w-4 mr-2" /> Add Brand
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((b: any) => (
            <Card key={b.id} className={`border-white/10 text-white transition-all hover:scale-[1.02] ${b.isActive ? "bg-white/5" : "bg-red-950/30 border-red-500/30"}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative group/logo">
                    {b.logo ? <img src={b.logo} className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><Sofa className="h-7 w-7 text-white" /></div>}
                    <label className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                      <Upload className="h-4 w-4 text-white" />
                      <input type="file" className="hidden" accept="image/png,image/gif,image/jpeg,image/webp" onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const res = await fetch("/api/upload-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result, filename: `furn-logo-${b.id}.${file.name.split('.').pop()}` }) });
                          const data = await res.json();
                          if (data.url) {
                            await fetch(`/api/furniture/brands/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo: data.url }) });
                            queryClient.invalidateQueries({ queryKey: ["/api/furniture/brands"] });
                            toast({ title: "Logo uploaded!" });
                          }
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{b.name}</h3>
                    <p className="text-xs text-gray-400">/furniture/{b.slug}</p>
                    <p className="text-xs text-gray-500">{b.city}, {b.country} • {b.currency}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">Active</span>
                  <Switch checked={b.isActive} onCheckedChange={v => toggleActive.mutate({ id: b.id, isActive: v })} />
                </div>
                {!b.isActive && <p className="text-xs text-red-400 mb-3">Inactive - Dashboard & public store hidden</p>}
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" onClick={() => {
                    localStorage.setItem("furnitureBrand", JSON.stringify(b));
                    window.open("/furniture-brand-dashboard", "_blank");
                  }} data-testid={`button-dashboard-${b.id}`}>
                    <LayoutDashboard className="h-3 w-3 mr-1" /> Dashboard
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => window.open(`/furniture/${b.slug}`, "_blank")} data-testid={`button-view-${b.id}`}>
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => {
                    setEditBrand(b);
                    setForm({ name: b.name, description: b.description || "", phone: b.phone || "", email: b.email || "", address: b.address || "", city: b.city || "", country: b.country || "", currency: b.currency || "£", primaryColor: b.primaryColor || "#C9A96E", secondaryColor: b.secondaryColor || "#1a1a2e", accentColor: b.accentColor || "#D4AF37", bgColor: b.bgColor || "#0f0f1a", adminUsername: b.adminUsername || "", adminPassword: b.adminPassword || "", stripePublishableKey: b.stripePublishableKey || "", stripeSecretKey: b.stripeSecretKey || "", deliveryFee: b.deliveryFee || "0" });
                    setShowForm(true);
                  }}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={() => { setShowCredentials(b); setNewUsername(b.adminUsername || ""); setNewPassword(b.adminPassword || ""); }}>
                    <KeyRound className="h-3 w-3 mr-1" /> Login
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => duplicateBrand.mutate(b.id)}>
                    <Copy className="h-3 w-3 mr-1" /> Duplicate
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => deleteBrand.mutate(b.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-3">Login: {b.adminUsername}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-white/10">
            <DialogHeader><DialogTitle>{editBrand ? "Edit" : "Add"} Furniture Brand</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Brand Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
              <div><Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="£">£ GBP</SelectItem>
                    <SelectItem value="PKR">PKR</SelectItem>
                    <SelectItem value="$">$ USD</SelectItem>
                    <SelectItem value="€">€ EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Delivery Fee</Label><Input value={form.deliveryFee} onChange={e => setForm({ ...form, deliveryFee: e.target.value })} /></div>
              <div><Label>Primary Color</Label><Input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} /></div>
              <div><Label>Accent Color</Label><Input type="color" value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} /></div>
              <div><Label>Background Color</Label><Input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} /></div>
              <div><Label>Card BG Color</Label><Input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} /></div>
              <div><Label>Dashboard Username *</Label><Input value={form.adminUsername} onChange={e => setForm({ ...form, adminUsername: e.target.value })} /></div>
              <div><Label>Dashboard Password *</Label><Input value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} /></div>
              <div><Label>Stripe Publishable Key</Label><Input value={form.stripePublishableKey} onChange={e => setForm({ ...form, stripePublishableKey: e.target.value })} /></div>
              <div><Label>Stripe Secret Key</Label><Input value={form.stripeSecretKey} onChange={e => setForm({ ...form, stripeSecretKey: e.target.value })} /></div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600" disabled={!form.name || !form.adminUsername || !form.adminPassword}
              onClick={() => { editBrand ? updateBrand.mutate({ id: editBrand.id, ...form }) : createBrand.mutate(form); }}>
              {editBrand ? "Update" : "Create"} Brand
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
          <DialogContent className="max-w-md bg-slate-900 text-white border-white/10">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-400" /> Change Login Credentials</DialogTitle></DialogHeader>
            {showCredentials && (
              <div className="grid gap-4">
                <p className="text-sm text-gray-400">Update login for <span className="font-bold text-white">{showCredentials.name}</span></p>
                <div>
                  <Label>Username</Label>
                  <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" data-testid="input-new-username" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" data-testid="input-new-password" />
                </div>
                <Button onClick={handleSaveCredentials} disabled={!newUsername || !newPassword}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" data-testid="button-save-credentials">
                  Save Credentials
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
