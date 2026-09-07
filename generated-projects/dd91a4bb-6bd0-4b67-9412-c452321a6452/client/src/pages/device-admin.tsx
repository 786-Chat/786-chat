import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { DeviceBrand } from "@shared/schema";
import { ArrowLeft, Plus, Pencil, Trash2, Wifi, Copy, ExternalLink, Settings, Cloud, CheckCircle2, XCircle, Loader2, Zap } from "lucide-react";

export default function DeviceAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<DeviceBrand | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", logo: "", description: "", phone: "", email: "",
    address: "", website: "", primaryColor: "#1a1a2e", secondaryColor: "#16213e",
    accentColor: "#0f3460", adminUsername: "", adminPassword: "",
  });

  const { data: brands = [], isLoading } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/device-brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/device-brands"] }); setShowForm(false); resetForm(); toast({ title: "Brand created" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/device-brands/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/device-brands"] }); setShowForm(false); setEditingBrand(null); resetForm(); toast({ title: "Brand updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/device-brands/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/device-brands"] }); toast({ title: "Brand deleted" }); },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (brand: DeviceBrand) => {
      const newBrand = {
        name: `${brand.name} (Copy)`,
        slug: `${brand.slug}-copy-${Date.now()}`,
        logo: brand.logo, description: brand.description, phone: brand.phone,
        email: brand.email, address: brand.address, website: brand.website,
        primaryColor: brand.primaryColor, secondaryColor: brand.secondaryColor,
        accentColor: brand.accentColor, adminUsername: `${brand.adminUsername || "admin"}-copy`,
        adminPassword: brand.adminPassword || "password123",
      };
      const res = await fetch("/api/device-brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBrand) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/device-brands"] }); toast({ title: "Brand duplicated" }); },
  });

  function resetForm() {
    setForm({ name: "", slug: "", logo: "", description: "", phone: "", email: "", address: "", website: "", primaryColor: "#1a1a2e", secondaryColor: "#16213e", accentColor: "#0f3460", adminUsername: "", adminPassword: "" });
  }

  function openEdit(brand: DeviceBrand) {
    setEditingBrand(brand);
    setForm({
      name: brand.name, slug: brand.slug, logo: brand.logo || "", description: brand.description || "",
      phone: brand.phone || "", email: brand.email || "", address: brand.address || "",
      website: brand.website || "", primaryColor: brand.primaryColor || "#1a1a2e",
      secondaryColor: brand.secondaryColor || "#16213e", accentColor: brand.accentColor || "#0f3460",
      adminUsername: brand.adminUsername || "", adminPassword: brand.adminPassword || "",
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const [activeTab, setActiveTab] = useState("brands");
  const [testingConnection, setTestingConnection] = useState(false);

  const { data: tuyaStatus } = useQuery<{ configured: boolean; accessId: string | null; dataCenter: string }>({
    queryKey: ["/api/tuya/status"],
  });

  const { data: tuyaDevices } = useQuery<any>({
    queryKey: ["/api/tuya/devices"],
    enabled: activeTab === "tuya",
  });

  const toggleTuyaMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/device-brands/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tuyaEnabled: enabled }) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/device-brands"] }); toast({ title: "Cloud setting updated" }); },
  });

  async function handleTestConnection() {
    setTestingConnection(true);
    try {
      const res = await fetch("/api/tuya/test-connection");
      const result = await res.json();
      toast({ title: result.success ? "Connected!" : "Connection failed", description: result.message, variant: result.success ? "default" : "destructive" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setTestingConnection(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/portal-admin")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <Wifi className="h-6 w-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Smart Device Management</h1>
          </div>
          {activeTab === "brands" && (
            <Button onClick={() => { resetForm(); setEditingBrand(null); setShowForm(true); }} className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-add-brand">
              <Plus className="h-4 w-4 mr-2" /> Add Brand
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border-0">
            <TabsTrigger value="brands" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white" data-testid="tab-brands">
              <Wifi className="h-4 w-4 mr-2" /> Device Brands
            </TabsTrigger>
            <TabsTrigger value="tuya" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-tuya">
              <Cloud className="h-4 w-4 mr-2" /> IoT Cloud Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tuya" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-purple-400" />
                  Link24 Cloud API Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {tuyaStatus?.configured ? (
                        <><CheckCircle2 className="h-5 w-5 text-green-400" /><span className="text-green-400 font-semibold">Configured</span></>
                      ) : (
                        <><XCircle className="h-5 w-5 text-red-400" /><span className="text-red-400 font-semibold">Not Configured</span></>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">API Key</p>
                    <p className="text-white font-mono">{tuyaStatus?.accessId ? "••••••••" : "—"}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Data Center</p>
                    <p className="text-white">{tuyaStatus?.dataCenter || "—"}</p>
                  </div>
                </div>
                <Button onClick={handleTestConnection} disabled={testingConnection || !tuyaStatus?.configured} className="bg-purple-600 hover:bg-purple-700" data-testid="button-test-tuya">
                  {testingConnection ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</> : <><Zap className="h-4 w-4 mr-2" /> Test Connection</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  Brand Cloud Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">Enable or disable cloud device control per brand</p>
                {brands.length === 0 ? (
                  <p className="text-gray-500 text-sm">No brands created yet</p>
                ) : (
                  <div className="space-y-3">
                    {brands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4" data-testid={`tuya-brand-${brand.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: brand.primaryColor || "#1a1a2e" }}>
                            <Wifi className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{brand.name}</p>
                            <p className="text-xs text-gray-400">/{brand.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs ${brand.tuyaEnabled ? "text-green-400" : "text-gray-500"}`}>
                            {brand.tuyaEnabled ? "Cloud Enabled" : "Cloud Disabled"}
                          </span>
                          <Switch
                            checked={brand.tuyaEnabled || false}
                            onCheckedChange={(checked) => toggleTuyaMutation.mutate({ id: brand.id, enabled: checked })}
                            data-testid={`switch-tuya-${brand.id}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {tuyaDevices?.success && tuyaDevices.result && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Cloud Devices ({Array.isArray(tuyaDevices.result) ? tuyaDevices.result.length : tuyaDevices.result?.total || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(Array.isArray(tuyaDevices.result) ? tuyaDevices.result : tuyaDevices.result?.devices || []).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3" data-testid={`tuya-device-${d.id}`}>
                        <div>
                          <p className="text-white text-sm font-medium">{d.name || d.id}</p>
                          <p className="text-xs text-gray-400">ID: {d.id} | Category: {d.category || "—"}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${d.online ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {d.online ? "Online" : "Offline"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="brands">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : brands.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-16 text-center">
              <Wifi className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Device Brands Yet</h3>
              <p className="text-gray-400 mb-6">Create your first device brand to start managing smart devices</p>
              <Button onClick={() => setShowForm(true)} className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-create-first-brand">
                <Plus className="h-4 w-4 mr-2" /> Create Brand
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Card key={brand.id} className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all" data-testid={`card-brand-${brand.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: brand.primaryColor || "#1a1a2e" }}>
                          <Wifi className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-lg">{brand.name}</h3>
                        <p className="text-sm text-gray-400">/{brand.slug}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${brand.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {brand.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {brand.description && <p className="text-gray-400 text-sm mb-4 line-clamp-2">{brand.description}</p>}
                  <div className="text-xs text-gray-500 mb-4">
                    {brand.email && <p>Email: {brand.email}</p>}
                    {brand.phone && <p>Phone: {brand.phone}</p>}
                    <p>Login: {brand.adminUsername || "Not set"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(brand)} className="border-white/20 text-white hover:bg-white/10" data-testid={`button-edit-${brand.id}`}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => duplicateMutation.mutate(brand)} className="border-white/20 text-white hover:bg-white/10" data-testid={`button-duplicate-${brand.id}`}>
                      <Copy className="h-3 w-3 mr-1" /> Duplicate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { localStorage.setItem("deviceBrandId", brand.id); localStorage.setItem("deviceBrandSlug", brand.slug); localStorage.setItem("deviceBrandName", brand.name); setLocation("/device-brand-dashboard"); }} className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" data-testid={`button-open-${brand.id}`}>
                      <ExternalLink className="h-3 w-3 mr-1" /> Open
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this brand and all its data?")) deleteMutation.mutate(brand.id); }} data-testid={`button-delete-${brand.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingBrand(null); resetForm(); } }}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Create Device Brand"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brand Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingBrand ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} required className="bg-white/10 border-white/20" data-testid="input-brand-name" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="bg-white/10 border-white/20" data-testid="input-brand-slug" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-brand-description" />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-brand-logo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-brand-phone" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-brand-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-brand-address" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-brand-website" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Primary Color</Label>
                <Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="bg-white/10 border-white/20 h-10" data-testid="input-primary-color" />
              </div>
              <div>
                <Label>Secondary Color</Label>
                <Input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="bg-white/10 border-white/20 h-10" data-testid="input-secondary-color" />
              </div>
              <div>
                <Label>Accent Color</Label>
                <Input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} className="bg-white/10 border-white/20 h-10" data-testid="input-accent-color" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Admin Username *</Label>
                <Input value={form.adminUsername} onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-admin-username" />
              </div>
              <div>
                <Label>Admin Password *</Label>
                <Input value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-admin-password" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingBrand(null); resetForm(); }} className="border-white/20 text-white">Cancel</Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-submit-brand">
                {editingBrand ? "Update" : "Create"} Brand
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
