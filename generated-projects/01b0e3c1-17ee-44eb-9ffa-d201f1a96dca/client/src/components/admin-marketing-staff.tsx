import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Edit2, User, Phone, Mail, DollarSign, Clock,
  Target, Eye, EyeOff, Briefcase, Send, CheckCircle2, XCircle,
  MessageSquare, Building2, Store, Camera, CreditCard, Upload,
  Copy, Loader2, MapPin, Globe
} from "lucide-react";

const apiCall = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
};

interface Staff {
  id: string;
  name: string;
  username: string;
  email: string | null;
  whatsapp: string | null;
  pin: string | null;
  photo: string | null;
  referencePhone: string | null;
  emergencyContact: string | null;
  paymentType: string;
  salaryAmount: string | null;
  commissionAmount: string | null;
  currency: string | null;
  jobHours: number | null;
  dailyVisitTarget: number | null;
  status: string | null;
  createdAt: string;
}

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
  staffId: string;
  amount: string;
  type: string;
  status: string | null;
  paidMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

const emptyStaffForm = {
  name: "", username: "", password: "", email: "", whatsapp: "", pin: "",
  referencePhone: "", emergencyContact: "", paymentType: "fixed_salary",
  salaryAmount: "", commissionAmount: "", currency: "Rs", jobHours: 8,
  dailyVisitTarget: 10,
};

export default function AdminMarketingStaff() {
  const qc = useQueryClient();
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ ...emptyStaffForm });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);
  const [paymentStaffId, setPaymentStaffId] = useState<string | null>(null);

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["/api/marketing-staff"],
    queryFn: () => apiCall("/api/marketing-staff"),
  });

  const { data: allLeads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/marketing-leads"],
    queryFn: () => apiCall("/api/marketing-leads"),
  });

  const { data: allPayments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/marketing-payments"],
    queryFn: () => apiCall("/api/marketing-payments"),
  });

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      setPhotoUrl(url);
      toast({ title: "Photo uploaded!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveStaff = async () => {
    if (!staffForm.name.trim() || !staffForm.username.trim()) {
      toast({ title: "Name and username are required", variant: "destructive" });
      return;
    }
    if (!editingStaffId && !staffForm.password.trim()) {
      toast({ title: "Password is required for new staff", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...staffForm, photo: photoUrl || null };
      if (editingStaffId) {
        await apiCall(`/api/marketing-staff/${editingStaffId}`, "PATCH", payload);
        toast({ title: "Staff updated!" });
      } else {
        await apiCall("/api/marketing-staff", "POST", payload);
        toast({ title: "Staff created!" });
      }
      setStaffForm({ ...emptyStaffForm });
      setPhotoUrl("");
      setEditingStaffId(null);
      setShowStaffForm(false);
      qc.invalidateQueries({ queryKey: ["/api/marketing-staff"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const editStaff = (s: Staff) => {
    setStaffForm({
      name: s.name, username: s.username, password: "", email: s.email || "",
      whatsapp: s.whatsapp || "", pin: s.pin || "", referencePhone: s.referencePhone || "",
      emergencyContact: s.emergencyContact || "", paymentType: s.paymentType || "fixed_salary",
      salaryAmount: s.salaryAmount || "", commissionAmount: s.commissionAmount || "",
      currency: s.currency || "Rs", jobHours: s.jobHours || 8, dailyVisitTarget: s.dailyVisitTarget || 10,
    });
    setPhotoUrl(s.photo || "");
    setEditingStaffId(s.id);
    setShowStaffForm(true);
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member? All their leads and payments will also be deleted.")) return;
    await apiCall(`/api/marketing-staff/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/marketing-staff"] });
    qc.invalidateQueries({ queryKey: ["/api/marketing-leads"] });
    toast({ title: "Staff deleted" });
  };

  const sendFeedback = async (leadId: string, status: string) => {
    await apiCall(`/api/marketing-leads/${leadId}`, "PATCH", { adminFeedback: feedbackText, status });
    setFeedbackText("");
    setFeedbackLeadId(null);
    qc.invalidateQueries({ queryKey: ["/api/marketing-leads"] });
    toast({ title: `Lead ${status}!` });
  };

  const markPaid = async (paymentId: string, method: string) => {
    await apiCall(`/api/marketing-payments/${paymentId}`, "PATCH", { status: "paid", paidMethod: method });
    qc.invalidateQueries({ queryKey: ["/api/marketing-payments"] });
    toast({ title: "Payment marked as paid!" });
  };

  const copyLoginDetails = (s: Staff) => {
    const text = `Marketing Staff Login\nURL: ${window.location.origin}/marketing-login\nUsername: ${s.username}\nName: ${s.name}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Login details copied!" });
  };

  const pendingLeads = allLeads.filter(l => l.status === "pending");
  const pendingPayments = allPayments.filter(p => p.status === "pending");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-600" /> Marketing Staff
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage marketing team, review leads, and track payments</p>
        </div>
        <Button
          onClick={() => { setShowStaffForm(true); setEditingStaffId(null); setStaffForm({ ...emptyStaffForm }); setPhotoUrl(""); }}
          className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
          data-testid="button-add-staff"
        >
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <Tabs defaultValue="staff">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="staff" data-testid="tab-admin-staff">Staff ({staffList.length})</TabsTrigger>
          <TabsTrigger value="leads" data-testid="tab-admin-leads">
            Leads {pendingLeads.length > 0 && <Badge className="ml-1 bg-amber-500 text-white text-xs h-5 px-1.5">{pendingLeads.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-admin-payments">
            Payments {pendingPayments.length > 0 && <Badge className="ml-1 bg-red-500 text-white text-xs h-5 px-1.5">{pendingPayments.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-4">
          {staffList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No marketing staff yet. Click "Add Staff" to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staffList.map(s => {
                const staffLeads = allLeads.filter(l => l.staffId === s.id);
                const staffPending = allPayments.filter(p => p.staffId === s.id && p.status === "pending");
                return (
                  <Card key={s.id} className="border-0 shadow-md overflow-hidden" data-testid={`card-staff-${s.id}`}>
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {s.photo ? (
                          <img src={s.photo} alt="" className="h-14 w-14 rounded-xl object-cover border" />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-emerald-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">{s.name}</h3>
                          <p className="text-sm text-muted-foreground">@{s.username}</p>
                          <Badge variant="outline" className={s.status === "active" ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-red-700 border-red-200 bg-red-50"}>
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        {s.email && <span className="flex items-center gap-1 text-muted-foreground truncate"><Mail className="h-3 w-3 flex-shrink-0" /> {s.email}</span>}
                        {s.whatsapp && <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3 flex-shrink-0" /> {s.whatsapp}</span>}
                        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {s.jobHours}h job</span>
                        <span className="flex items-center gap-1 text-muted-foreground"><Target className="h-3 w-3" /> {s.dailyVisitTarget} visits/day</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <Badge variant="outline">
                          {s.paymentType === "fixed_salary" ? `Salary: ${s.currency} ${s.salaryAmount}` :
                           s.paymentType === "commission_only" ? `Commission: ${s.currency} ${s.commissionAmount}` :
                           `Salary: ${s.currency} ${s.salaryAmount} + Commission: ${s.currency} ${s.commissionAmount}`}
                        </Badge>
                      </div>
                      <div className="flex gap-2 text-xs mb-3">
                        <Badge className="bg-blue-100 text-blue-800">{staffLeads.length} leads</Badge>
                        {staffPending.length > 0 && <Badge className="bg-amber-100 text-amber-800">{staffPending.length} pending payments</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => editStaff(s)} data-testid={`button-edit-staff-${s.id}`}>
                          <Edit2 className="h-3 w-3" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => copyLoginDetails(s)} data-testid={`button-copy-login-${s.id}`}>
                          <Copy className="h-3 w-3" /> Login
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-red-600 hover:text-red-700" onClick={() => deleteStaff(s.id)} data-testid={`button-delete-staff-${s.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          {allLeads.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Store className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No leads submitted yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingLeads.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-amber-700">
                    <Clock className="h-5 w-5" /> Pending Review ({pendingLeads.length})
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pendingLeads.map(lead => {
                      const staff = staffList.find(s => s.id === lead.staffId);
                      return (
                        <Card key={lead.id} className="border-amber-200 bg-amber-50/50 shadow-md" data-testid={`card-lead-pending-${lead.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-lg">{lead.businessName}</h4>
                                <p className="text-sm text-muted-foreground">{lead.customerName}</p>
                                {staff && <p className="text-xs text-emerald-600">Staff: {staff.name}</p>}
                              </div>
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Pending</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              {lead.customerWhatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.customerWhatsapp}</span>}
                              {lead.customerEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.customerEmail}</span>}
                              {lead.businessPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.businessPhone}</span>}
                              {lead.businessType && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {lead.businessType}</span>}
                              {lead.openingTime && lead.closingTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lead.openingTime} - {lead.closingTime}</span>}
                              {lead.paymentMethod && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {lead.paymentMethod}</span>}
                              {lead.websiteUrl && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {lead.websiteUrl}</span>}
                              {lead.paymentMode && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {lead.paymentMode}</span>}
                            </div>
                            {(lead.agreedMonthlyPrice || lead.agreedYearlyPrice) && (
                              <div className="flex gap-2 mb-3">
                                {lead.agreedMonthlyPrice && <Badge variant="outline" className="text-emerald-700">{staff?.currency || "Rs"} {lead.agreedMonthlyPrice}/mo</Badge>}
                                {lead.agreedYearlyPrice && <Badge variant="outline" className="text-blue-700">{staff?.currency || "Rs"} {lead.agreedYearlyPrice}/yr</Badge>}
                              </div>
                            )}
                            {lead.notes && <p className="text-sm bg-white p-2 rounded mb-3 border">{lead.notes}</p>}
                            <div className="flex gap-2 mb-3">
                              {lead.frontShopImage && <img src={lead.frontShopImage} alt="Shop" className="h-20 rounded-lg object-cover flex-1" />}
                              {lead.menuImage && <img src={lead.menuImage} alt="Menu" className="h-20 rounded-lg object-cover flex-1" />}
                            </div>
                            <div className="space-y-2">
                              <Textarea
                                value={feedbackLeadId === lead.id ? feedbackText : ""}
                                onChange={e => { setFeedbackLeadId(lead.id); setFeedbackText(e.target.value); }}
                                onFocus={() => setFeedbackLeadId(lead.id)}
                                placeholder="Write feedback for staff..."
                                rows={2}
                                className="text-sm"
                                data-testid={`textarea-feedback-${lead.id}`}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={() => sendFeedback(lead.id, "approved")} data-testid={`button-approve-${lead.id}`}>
                                  <CheckCircle2 className="h-3 w-3" /> Approve
                                </Button>
                                <Button size="sm" className="gap-1 flex-1" variant="outline" onClick={() => sendFeedback(lead.id, "responded")} data-testid={`button-respond-${lead.id}`}>
                                  <Send className="h-3 w-3" /> Respond
                                </Button>
                                <Button size="sm" className="gap-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => sendFeedback(lead.id, "rejected")} data-testid={`button-reject-${lead.id}`}>
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              {allLeads.filter(l => l.status !== "pending").length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3">Reviewed Leads ({allLeads.filter(l => l.status !== "pending").length})</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {allLeads.filter(l => l.status !== "pending").map(lead => {
                      const staff = staffList.find(s => s.id === lead.staffId);
                      const statusColors: Record<string, string> = {
                        approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
                        rejected: "bg-red-100 text-red-800 border-red-200",
                        responded: "bg-blue-100 text-blue-800 border-blue-200",
                      };
                      return (
                        <Card key={lead.id} className="border-0 shadow-sm" data-testid={`card-lead-reviewed-${lead.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold">{lead.businessName}</h4>
                                <p className="text-xs text-muted-foreground">{lead.customerName} • Staff: {staff?.name || "Unknown"}</p>
                              </div>
                              <Badge className={`${statusColors[lead.status || ""] || ""} border`}>{lead.status}</Badge>
                            </div>
                            {lead.adminFeedback && (
                              <div className="p-2 bg-blue-50 rounded text-sm border border-blue-100 mb-2">
                                <p className="text-xs font-semibold text-blue-700 mb-0.5">Your Feedback:</p>
                                <p className="text-blue-800">{lead.adminFeedback}</p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          {allPayments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No payment records yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPayments.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 text-amber-700">Pending Payments ({pendingPayments.length})</h3>
                  <div className="space-y-2">
                    {pendingPayments.map(p => {
                      const staff = staffList.find(s => s.id === p.staffId);
                      return (
                        <Card key={p.id} className="border-amber-200 bg-amber-50" data-testid={`card-payment-pending-${p.id}`}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-bold">{staff?.currency || "Rs"} {p.amount}</p>
                              <p className="text-sm text-muted-foreground">{staff?.name || "Unknown"} • {p.type} • {new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="gap-1 bg-emerald-600" onClick={() => markPaid(p.id, "cash")} data-testid={`button-pay-cash-${p.id}`}>
                                <DollarSign className="h-3 w-3" /> Cash
                              </Button>
                              <Button size="sm" className="gap-1" variant="outline" onClick={() => markPaid(p.id, "online")} data-testid={`button-pay-online-${p.id}`}>
                                <CreditCard className="h-3 w-3" /> Online
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              {allPayments.filter(p => p.status === "paid").length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 text-emerald-700">Paid ({allPayments.filter(p => p.status === "paid").length})</h3>
                  <div className="space-y-2">
                    {allPayments.filter(p => p.status === "paid").map(p => {
                      const staff = staffList.find(s => s.id === p.staffId);
                      return (
                        <Card key={p.id} className="border-emerald-200 bg-emerald-50">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-bold">{staff?.currency || "Rs"} {p.amount}</p>
                              <p className="text-sm text-muted-foreground">{staff?.name || "Unknown"} • {p.type} • {p.paidMethod} • {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ""}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showStaffForm} onOpenChange={setShowStaffForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              {editingStaffId ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-20 w-20 rounded-xl object-cover border" />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-emerald-400" />
                </div>
              )}
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                  <Camera className="h-4 w-4" /> {photoUrl ? "Change Photo" : "Upload Passport Photo"}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                }} data-testid="input-staff-photo" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Staff Name *</Label>
                <Input value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="Full name" data-testid="input-staff-name" />
              </div>
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input value={staffForm.username} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} placeholder="Login username" data-testid="input-staff-uname" />
              </div>
              <div className="space-y-2">
                <Label>Password {editingStaffId ? "(leave blank to keep)" : "*"}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={staffForm.password}
                    onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                    placeholder={editingStaffId ? "Leave blank to keep current" : "Set password"}
                    className="pr-10"
                    data-testid="input-staff-pass"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-9 w-9" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="staff@email.com" data-testid="input-staff-email" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input value={staffForm.whatsapp} onChange={e => setStaffForm({ ...staffForm, whatsapp: e.target.value })} placeholder="+92 300 1234567" data-testid="input-staff-whatsapp" />
              </div>
              <div className="space-y-2">
                <Label>PIN Number</Label>
                <Input value={staffForm.pin} onChange={e => setStaffForm({ ...staffForm, pin: e.target.value })} placeholder="4-digit PIN" maxLength={6} data-testid="input-staff-pin" />
              </div>
              <div className="space-y-2">
                <Label>Reference Phone</Label>
                <Input value={staffForm.referencePhone} onChange={e => setStaffForm({ ...staffForm, referencePhone: e.target.value })} placeholder="Reference contact" data-testid="input-staff-ref" />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input value={staffForm.emergencyContact} onChange={e => setStaffForm({ ...staffForm, emergencyContact: e.target.value })} placeholder="Emergency phone" data-testid="input-staff-emergency" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Payment & Job Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select value={staffForm.paymentType} onValueChange={v => setStaffForm({ ...staffForm, paymentType: v })}>
                    <SelectTrigger data-testid="select-payment-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_salary">Fixed Salary</SelectItem>
                      <SelectItem value="fixed_salary_commission">Fixed Salary + Commission</SelectItem>
                      <SelectItem value="commission_only">Commission Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={staffForm.currency} onValueChange={v => setStaffForm({ ...staffForm, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rs">Rs (Pakistani Rupee)</SelectItem>
                      <SelectItem value="£">£ (British Pound)</SelectItem>
                      <SelectItem value="$">$ (US Dollar)</SelectItem>
                      <SelectItem value="€">€ (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(staffForm.paymentType === "fixed_salary" || staffForm.paymentType === "fixed_salary_commission") && (
                  <div className="space-y-2">
                    <Label>Salary Amount ({staffForm.currency})</Label>
                    <Input type="number" value={staffForm.salaryAmount} onChange={e => setStaffForm({ ...staffForm, salaryAmount: e.target.value })} placeholder="0" data-testid="input-salary" />
                  </div>
                )}
                {(staffForm.paymentType === "commission_only" || staffForm.paymentType === "fixed_salary_commission") && (
                  <div className="space-y-2">
                    <Label>Commission per Lead ({staffForm.currency})</Label>
                    <Input type="number" value={staffForm.commissionAmount} onChange={e => setStaffForm({ ...staffForm, commissionAmount: e.target.value })} placeholder="0" data-testid="input-commission" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Job Hours</Label>
                  <Select value={String(staffForm.jobHours)} onValueChange={v => setStaffForm({ ...staffForm, jobHours: parseInt(v) })}>
                    <SelectTrigger data-testid="select-job-hours"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 Hours</SelectItem>
                      <SelectItem value="12">12 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Daily Visit Target</Label>
                  <Input type="number" value={staffForm.dailyVisitTarget} onChange={e => setStaffForm({ ...staffForm, dailyVisitTarget: parseInt(e.target.value) || 10 })} placeholder="10" data-testid="input-visit-target" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowStaffForm(false)}>Cancel</Button>
              <Button
                onClick={saveStaff}
                disabled={submitting || uploading}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                data-testid="button-save-staff"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {editingStaffId ? "Update Staff" : "Create Staff"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
