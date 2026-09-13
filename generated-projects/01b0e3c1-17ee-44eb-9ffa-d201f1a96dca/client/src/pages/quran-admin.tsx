import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Eye, Edit, Trash2, Copy, BookOpen, KeyRound, Users, GraduationCap } from "lucide-react";

export default function QuranAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editAcademy, setEditAcademy] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState<any>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", phone: "", email: "", address: "",
    city: "London", country: "UK", primaryColor: "#0D7C3D", secondaryColor: "#D4AF37",
    adminUsername: "", adminPassword: "",
  });

  const { data: academies = [] } = useQuery({
    queryKey: ["/api/quran/academies"],
    queryFn: () => fetch("/api/quran/academies").then(r => r.json()),
  });

  const createAcademy = useMutation({
    mutationFn: (data: any) => fetch("/api/quran/academies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quran/academies"] }); setShowForm(false); toast({ title: "Academy created!" }); },
  });

  const updateAcademy = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/quran/academies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quran/academies"] }); setEditAcademy(null); setShowForm(false); toast({ title: "Academy updated!" }); },
  });

  const deleteAcademy = useMutation({
    mutationFn: (id: string) => fetch(`/api/quran/academies/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quran/academies"] }); toast({ title: "Academy deleted!" }); },
  });

  const duplicateAcademy = useMutation({
    mutationFn: (id: string) => fetch(`/api/quran/academies/${id}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quran/academies"] }); toast({ title: "Academy duplicated!" }); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/quran/academies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quran/academies"] }); toast({ title: "Status updated!" }); },
  });

  const handleSaveCredentials = async () => {
    if (!showCredentials || !newUsername || !newPassword) return;
    await fetch(`/api/quran/academies/${showCredentials.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUsername: newUsername, adminPassword: newPassword }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/quran/academies"] });
    toast({ title: "Login credentials updated!" });
    setShowCredentials(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-950 to-emerald-950 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/portal")} className="text-white hover:bg-white/10" data-testid="button-back-portal">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
                <BookOpen className="h-7 w-7 text-emerald-400" /> Quran Academy Admin
              </h1>
              <p className="text-emerald-300/60 text-sm">Manage all Quran academies</p>
            </div>
          </div>
          <Button onClick={() => { setEditAcademy(null); setForm({ name: "", description: "", phone: "", email: "", address: "", city: "London", country: "UK", primaryColor: "#0D7C3D", secondaryColor: "#D4AF37", adminUsername: "", adminPassword: "" }); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-add-academy">
            <Plus className="h-4 w-4 mr-2" /> Add Academy
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {academies.map((a: any) => (
            <Card key={a.id} className="bg-white/5 border-emerald-500/20 backdrop-blur-sm overflow-hidden group hover:border-emerald-400/40 transition-all" data-testid={`card-academy-${a.id}`}>
              <div className="h-2" style={{ background: `linear-gradient(to right, ${a.primaryColor}, ${a.secondaryColor})` }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{a.name}</h3>
                      <p className="text-emerald-300/60 text-xs">/{a.slug}</p>
                    </div>
                  </div>
                  <Switch checked={a.isActive} onCheckedChange={(v) => toggleActive.mutate({ id: a.id, isActive: v })} />
                </div>
                {a.description && <p className="text-emerald-200/50 text-sm mb-3 line-clamp-2">{a.description}</p>}
                <div className="flex items-center gap-2 text-emerald-300/50 text-xs mb-4">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>{a.city}, {a.country}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-emerald-600/80 hover:bg-emerald-600 text-xs" onClick={() => { localStorage.setItem("quranAcademyId", a.id); localStorage.setItem("quranAcademyName", a.name); localStorage.setItem("quranAcademySlug", a.slug); setLocation("/quran-academy-dashboard"); }} data-testid={`button-dashboard-${a.id}`}>
                    <Eye className="h-3 w-3 mr-1" /> Dashboard
                  </Button>
                  <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs" onClick={() => { setEditAcademy(a); setForm({ name: a.name, description: a.description || "", phone: a.phone || "", email: a.email || "", address: a.address || "", city: a.city || "", country: a.country || "", primaryColor: a.primaryColor || "#0D7C3D", secondaryColor: a.secondaryColor || "#D4AF37", adminUsername: a.adminUsername || "", adminPassword: a.adminPassword || "" }); setShowForm(true); }} data-testid={`button-edit-${a.id}`}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs" onClick={() => { setShowCredentials(a); setNewUsername(a.adminUsername || ""); setNewPassword(a.adminPassword || ""); }} data-testid={`button-credentials-${a.id}`}>
                    <KeyRound className="h-3 w-3 mr-1" /> Credentials
                  </Button>
                  <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs" onClick={() => duplicateAcademy.mutate(a.id)} data-testid={`button-duplicate-${a.id}`}>
                    <Copy className="h-3 w-3 mr-1" /> Duplicate
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs" onClick={() => { if (confirm("Delete this academy?")) deleteAcademy.mutate(a.id); }} data-testid={`button-delete-${a.id}`}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {academies.length === 0 && (
          <div className="text-center py-20 text-emerald-300/40">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No academies yet. Create your first Quran academy!</p>
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg bg-emerald-950 text-white border-emerald-500/20">
            <DialogHeader><DialogTitle className="text-emerald-300">{editAcademy ? "Edit" : "Add"} Academy</DialogTitle></DialogHeader>
            <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-2">
              <div><Label className="text-emerald-300/70">Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" data-testid="input-academy-name" /></div>
              <div><Label className="text-emerald-300/70">Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" data-testid="input-academy-description" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-emerald-300/70">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
                <div><Label className="text-emerald-300/70">Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
              </div>
              <div><Label className="text-emerald-300/70">Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-emerald-300/70">City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
                <div><Label className="text-emerald-300/70">Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" /></div>
              </div>
              {!editAcademy && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-emerald-300/70">Username</Label><Input value={form.adminUsername} onChange={e => setForm(f => ({ ...f, adminUsername: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" data-testid="input-academy-username" /></div>
                  <div><Label className="text-emerald-300/70">Password</Label><Input value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} className="bg-white/5 border-emerald-500/20 text-white" data-testid="input-academy-password" /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-emerald-300/70">Primary Color</Label><Input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="bg-white/5 border-emerald-500/20 h-10" /></div>
                <div><Label className="text-emerald-300/70">Secondary Color</Label><Input type="color" value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="bg-white/5 border-emerald-500/20 h-10" /></div>
              </div>
              <Button onClick={() => { if (!form.name) return; editAcademy ? updateAcademy.mutate({ id: editAcademy.id, ...form }) : createAcademy.mutate(form); }} className="bg-emerald-600 hover:bg-emerald-700 w-full" data-testid="button-save-academy">
                {editAcademy ? "Update" : "Create"} Academy
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
          <DialogContent className="max-w-sm bg-emerald-950 text-white border-emerald-500/20">
            <DialogHeader><DialogTitle className="text-emerald-300">Login Credentials</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-emerald-300/70">Username</Label><Input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="bg-white/5 border-emerald-500/20 text-white" /></div>
              <div><Label className="text-emerald-300/70">Password</Label><Input value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-white/5 border-emerald-500/20 text-white" /></div>
              <Button onClick={handleSaveCredentials} className="bg-emerald-600 hover:bg-emerald-700 w-full">Save Credentials</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
