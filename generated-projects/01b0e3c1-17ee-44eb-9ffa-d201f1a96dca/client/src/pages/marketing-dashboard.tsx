import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Briefcase, Plus, LogOut, Target, TrendingUp, Clock, DollarSign,
  MapPin, Phone, Mail, Globe, Store, Camera, Send, Edit2, MessageSquare,
  CheckCircle2, XCircle, Loader2, User, Building2, CreditCard, Upload
} from "lucide-react";

const apiCall = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  responded: "bg-blue-100 text-blue-800 border-blue-200",
};

const cardGradients = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
];

interface Lead {
  id: string;
  staffId: string;
  customerName: string;
  customerWhatsapp: string | null;
  customerEmail: string | null;
  businessName: string;
  businessPhone: string | null;
  shopName: string | null;
  websiteUrl: string | null;
  menuImage: string | null;
  menuLink: string | null;
  paymentMethod: string | null;
  frontShopImage: string | null;
  notes: string | null;
  openingTime: string | null;
  closingTime: string | null;
  businessType: string | null;
  agreedMonthlyPrice: string | null;
  agreedYearlyPrice: string | null;
  paymentMode: string | null;
  status: string | null;
  adminFeedback: string | null;
  branchId: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: string;
  type: string;
  status: string | null;
  paidMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

const emptyForm = {
  customerName: "", customerWhatsapp: "", customerEmail: "", businessName: "",
  businessPhone: "", shopName: "", websiteUrl: "", menuLink: "",
  paymentMethod: "", notes: "", openingTime: "", closingTime: "",
  businessType: "", agreedMonthlyPrice: "", agreedYearlyPrice: "", paymentMode: "",
};

export default function MarketingDashboard() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const staffId = localStorage.getItem("marketingStaffId");
  const staffName = localStorage.getItem("marketingStaffName") || "Staff";
  const staffPhoto = localStorage.getItem("marketingStaffPhoto") || "";
  const currency = localStorage.getItem("marketingStaffCurrency") || "Rs";
  const target = parseInt(localStorage.getItem("marketingStaffTarget") || "10");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuImageUrl, setMenuImageUrl] = useState("");
  const [frontShopImageUrl, setFrontShopImageUrl] = useState("");

  useEffect(() => {
    if (!staffId) setLocation("/marketing-login");
  }, [staffId]);

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/marketing-staff", staffId, "leads"],
    queryFn: () => apiCall(`/api/marketing-staff/${staffId}/leads`),
    enabled: !!staffId,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/marketing-staff", staffId, "stats"],
    queryFn: () => apiCall(`/api/marketing-staff/${staffId}/stats`),
    enabled: !!staffId,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/marketing-staff", staffId, "payments"],
    queryFn: () => apiCall(`/api/marketing-staff/${staffId}/payments`),
    enabled: !!staffId,
  });

  const handleImageUpload = async (file: File, type: "menu" | "shop") => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      if (type === "menu") setMenuImageUrl(url);
      else setFrontShopImageUrl(url);
      toast({ title: `${type === "menu" ? "Menu" : "Shop"} image uploaded!` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim() || !form.businessName.trim()) {
      toast({ title: "Required", description: "Customer name and business name are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        staffId,
        menuImage: menuImageUrl || null,
        frontShopImage: frontShopImageUrl || null,
        agreedMonthlyPrice: form.agreedMonthlyPrice || null,
        agreedYearlyPrice: form.agreedYearlyPrice || null,
      };
      if (editingId) {
        await apiCall(`/api/marketing-leads/${editingId}`, "PATCH", payload);
        toast({ title: "Visit updated!" });
      } else {
        await apiCall("/api/marketing-leads", "POST", payload);
        toast({ title: "Visit submitted!", description: "Admin will review and respond within 48 hours" });
      }
      setForm({ ...emptyForm });
      setMenuImageUrl("");
      setFrontShopImageUrl("");
      setEditingId(null);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["/api/marketing-staff", staffId] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const editLead = (lead: Lead) => {
    setForm({
      customerName: lead.customerName || "",
      customerWhatsapp: lead.customerWhatsapp || "",
      customerEmail: lead.customerEmail || "",
      businessName: lead.businessName || "",
      businessPhone: lead.businessPhone || "",
      shopName: lead.shopName || "",
      websiteUrl: lead.websiteUrl || "",
      menuLink: lead.menuLink || "",
      paymentMethod: lead.paymentMethod || "",
      notes: lead.notes || "",
      openingTime: lead.openingTime || "",
      closingTime: lead.closingTime || "",
      businessType: lead.businessType || "",
      agreedMonthlyPrice: lead.agreedMonthlyPrice || "",
      agreedYearlyPrice: lead.agreedYearlyPrice || "",
      paymentMode: lead.paymentMode || "",
    });
    setMenuImageUrl(lead.menuImage || "");
    setFrontShopImageUrl(lead.frontShopImage || "");
    setEditingId(lead.id);
    setShowForm(true);
  };

  const logout = () => {
    localStorage.removeItem("marketingStaffId");
    localStorage.removeItem("marketingStaffName");
    localStorage.removeItem("marketingStaffUsername");
    localStorage.removeItem("marketingStaffPhoto");
    localStorage.removeItem("marketingStaffCurrency");
    localStorage.removeItem("marketingStaffTarget");
    localStorage.removeItem("marketingStaffPaymentType");
    localStorage.removeItem("marketingStaffCommission");
    setLocation("/marketing-login");
  };

  if (!staffId) return null;

  const todayLeads = leads.filter(l => {
    const d = new Date(l.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const pendingPayments = payments.filter(p => p.status === "pending");
  const paidPayments = payments.filter(p => p.status === "paid");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {staffPhoto ? (
              <img src={staffPhoto} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg" data-testid="text-staff-name">{staffName}</h1>
              <p className="text-xs text-white/70">Marketing Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-2" onClick={logout} data-testid="button-logout">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-today-visits">{todayLeads.length}/{target}</p>
                <p className="text-xs text-muted-foreground">Today's Visits</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-leads">{stats?.totalLeads || 0}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-pending">{stats?.pendingLeads || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-pending-pay">{currency} {stats?.pendingAmount || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Payment</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">My Visits</h2>
          <Button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); setMenuImageUrl(""); setFrontShopImageUrl(""); }}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            data-testid="button-new-visit"
          >
            <Plus className="h-4 w-4" /> New Customer Visit
          </Button>
        </div>

        <Tabs defaultValue="visits" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visits" data-testid="tab-visits">Visits ({leads.length})</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments ({payments.length})</TabsTrigger>
            <TabsTrigger value="feedback" data-testid="tab-feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="mt-4">
            {leads.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Store className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No visits yet. Click "New Customer Visit" to start.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {leads.map((lead, i) => (
                  <Card key={lead.id} className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-lead-${lead.id}`}>
                    <div className={`h-2 bg-gradient-to-r ${cardGradients[i % cardGradients.length]}`} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{lead.businessName}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> {lead.customerName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusColors[lead.status || "pending"]} border`}>
                            {lead.status || "pending"}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editLead(lead)} data-testid={`button-edit-lead-${lead.id}`}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {lead.businessPhone && (
                          <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {lead.businessPhone}</span>
                        )}
                        {lead.businessType && (
                          <span className="flex items-center gap-1 text-muted-foreground"><Building2 className="h-3 w-3" /> {lead.businessType}</span>
                        )}
                        {lead.openingTime && lead.closingTime && (
                          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {lead.openingTime} - {lead.closingTime}</span>
                        )}
                        {lead.paymentMethod && (
                          <span className="flex items-center gap-1 text-muted-foreground"><CreditCard className="h-3 w-3" /> {lead.paymentMethod}</span>
                        )}
                      </div>
                      {(lead.agreedMonthlyPrice || lead.agreedYearlyPrice) && (
                        <div className="mt-2 flex gap-3">
                          {lead.agreedMonthlyPrice && <Badge variant="outline" className="text-emerald-700">{currency} {lead.agreedMonthlyPrice}/month</Badge>}
                          {lead.agreedYearlyPrice && <Badge variant="outline" className="text-blue-700">{currency} {lead.agreedYearlyPrice}/year</Badge>}
                        </div>
                      )}
                      {lead.frontShopImage && (
                        <img src={lead.frontShopImage} alt="Shop" className="mt-3 rounded-lg h-24 w-full object-cover" />
                      )}
                      {lead.adminFeedback && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Admin Feedback</p>
                          <p className="text-sm text-blue-800">{lead.adminFeedback}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-4 space-y-4">
            {pendingPayments.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 text-amber-700">Pending Payments</h3>
                <div className="space-y-2">
                  {pendingPayments.map(p => (
                    <Card key={p.id} className="border-amber-200 bg-amber-50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold">{currency} {p.amount}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.type} • {new Date(p.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {paidPayments.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 text-emerald-700">Received Payments</h3>
                <div className="space-y-2">
                  {paidPayments.map(p => (
                    <Card key={p.id} className="border-emerald-200 bg-emerald-50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold">{currency} {p.amount}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.type} • {p.paidMethod} • {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ""}</p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800">Paid</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {payments.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No payment records yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            {leads.filter(l => l.adminFeedback).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No feedback received yet. Admin will respond within 48 hours.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {leads.filter(l => l.adminFeedback).map(lead => (
                  <Card key={lead.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold">{lead.businessName}</h4>
                          <p className="text-xs text-muted-foreground">{lead.customerName}</p>
                        </div>
                        <Badge className={`${statusColors[lead.status || "pending"]} border`}>{lead.status}</Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-sm text-blue-800">{lead.adminFeedback}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Store className="h-5 w-5 text-emerald-600" />
              {editingId ? "Edit Customer Visit" : "New Customer Visit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Customer full name" data-testid="input-customer-name" />
              </div>
              <div className="space-y-2">
                <Label>Customer WhatsApp</Label>
                <Input value={form.customerWhatsapp} onChange={e => setForm({ ...form, customerWhatsapp: e.target.value })} placeholder="+92 300 1234567" data-testid="input-customer-whatsapp" />
              </div>
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} placeholder="customer@email.com" data-testid="input-customer-email" />
              </div>
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="Business/Shop name" data-testid="input-business-name" />
              </div>
              <div className="space-y-2">
                <Label>Business Phone</Label>
                <Input value={form.businessPhone} onChange={e => setForm({ ...form, businessPhone: e.target.value })} placeholder="Business phone number" data-testid="input-business-phone" />
              </div>
              <div className="space-y-2">
                <Label>Shop Name (if different)</Label>
                <Input value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} placeholder="Shop display name" data-testid="input-shop-name" />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://..." data-testid="input-website-url" />
              </div>
              <div className="space-y-2">
                <Label>Menu Link</Label>
                <Input value={form.menuLink} onChange={e => setForm({ ...form, menuLink: e.target.value })} placeholder="Link to existing menu" data-testid="input-menu-link" />
              </div>
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Input value={form.businessType} onChange={e => setForm({ ...form, businessType: e.target.value })} placeholder="Restaurant, Cafe, Takeaway..." data-testid="input-business-type" />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger data-testid="select-payment-method"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                    <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input type="time" value={form.openingTime} onChange={e => setForm({ ...form, openingTime: e.target.value })} data-testid="input-opening-time" />
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input type="time" value={form.closingTime} onChange={e => setForm({ ...form, closingTime: e.target.value })} data-testid="input-closing-time" />
              </div>
              <div className="space-y-2">
                <Label>Agreed Monthly Price ({currency})</Label>
                <Input type="number" value={form.agreedMonthlyPrice} onChange={e => setForm({ ...form, agreedMonthlyPrice: e.target.value })} placeholder="0" data-testid="input-monthly-price" />
              </div>
              <div className="space-y-2">
                <Label>Agreed Yearly Price ({currency})</Label>
                <Input type="number" value={form.agreedYearlyPrice} onChange={e => setForm({ ...form, agreedYearlyPrice: e.target.value })} placeholder="0" data-testid="input-yearly-price" />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={v => setForm({ ...form, paymentMode: v })}>
                  <SelectTrigger data-testid="select-payment-mode"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Menu Image</Label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 text-sm">
                      <Upload className="h-4 w-4" /> {menuImageUrl ? "Change Image" : "Upload Menu Photo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "menu");
                    }} data-testid="input-menu-image" />
                  </label>
                </div>
                {menuImageUrl && <img src={menuImageUrl} alt="Menu" className="h-20 rounded-lg object-cover" />}
              </div>
              <div className="space-y-2">
                <Label>Front Shop Image</Label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 text-sm">
                      <Camera className="h-4 w-4" /> {frontShopImageUrl ? "Change Image" : "Upload Shop Photo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0], "shop");
                    }} data-testid="input-shop-image" />
                  </label>
                </div>
                {frontShopImageUrl && <img src={frontShopImageUrl} alt="Shop" className="h-20 rounded-lg object-cover" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any specific customer requirements or notes..." rows={3} data-testid="input-notes" />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel">Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                data-testid="button-submit-visit"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {editingId ? "Update Visit" : "Submit to Admin"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
