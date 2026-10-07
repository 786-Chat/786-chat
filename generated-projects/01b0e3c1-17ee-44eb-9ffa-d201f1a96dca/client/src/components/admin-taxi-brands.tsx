import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Car, Plus, Edit2, Trash2, Users, Check, X, AlertTriangle,
  Phone, Mail, MapPin, CreditCard, Eye, EyeOff, Shield,
  ExternalLink, PoundSterling, Copy, FileText, Camera,
  ChevronDown, ChevronUp, Navigation, Star, Clock, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type TabView = "brands" | "drivers" | "customers" | "complaints";

export default function AdminTaxiBrands() {
  const { toast } = useToast();
  const [tabView, setTabView] = useState<TabView>("brands");
  const [showCreateBrand, setShowCreateBrand] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [selectedBrandForDriver, setSelectedBrandForDriver] = useState("");
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  const [brandForm, setBrandForm] = useState({
    name: "", slug: "", logo: "", address: "", phone: "", email: "", whatsapp: "",
    primaryColor: "#1a1a2e", secondaryColor: "#e94560", description: "",
    monthlyFee: "0", platformCommissionPercent: "10",
  });

  const [driverForm, setDriverForm] = useState({
    brandId: "", name: "", phone: "", whatsapp: "", email: "", address: "", country: "",
    photo: "", drivingLicenceNumber: "", drivingLicenceImage: "", visaType: "citizen",
    visaImage: "", insuranceImage: "", carImage: "", carColor: "", carModel: "",
    numberPlate: "", vehicleType: "sedan_5", serviceRadiusMiles: "5",
    password: "", weeklyHoursAllowed: 48, timingPreference: "",
  });

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["/api/taxi-brands"],
    queryFn: () => fetch("/api/taxi-brands").then(r => r.json()),
  });

  const { data: allDrivers = [] } = useQuery({
    queryKey: ["/api/taxi-drivers"],
    queryFn: () => fetch("/api/taxi-drivers").then(r => r.json()),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/taxi-customers"],
    queryFn: () => fetch("/api/taxi-customers").then(r => r.json()),
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["/api/taxi-complaints"],
    queryFn: () => fetch("/api/taxi-complaints").then(r => r.json()),
  });

  const createBrandMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/taxi-brands", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxi-brands"] });
      setShowCreateBrand(false);
      setBrandForm({ name: "", slug: "", logo: "", address: "", phone: "", email: "", whatsapp: "", primaryColor: "#1a1a2e", secondaryColor: "#e94560", description: "", monthlyFee: "0", platformCommissionPercent: "10" });
      toast({ title: "Brand Created", description: "Taxi brand created successfully" });
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-brands/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxi-brands"] });
      setEditingBrand(null);
      toast({ title: "Brand Updated" });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/taxi-brands/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxi-brands"] });
      toast({ title: "Brand Deleted" });
    },
  });

  const createDriverMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/taxi-drivers", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] });
      setShowCreateDriver(false);
      setDriverForm({ brandId: "", name: "", phone: "", whatsapp: "", email: "", address: "", country: "", photo: "", drivingLicenceNumber: "", drivingLicenceImage: "", visaType: "citizen", visaImage: "", insuranceImage: "", carImage: "", carColor: "", carModel: "", numberPlate: "", vehicleType: "sedan_5", serviceRadiusMiles: "5", password: "", weeklyHoursAllowed: 48, timingPreference: "" });
      toast({ title: "Driver Created", description: "Driver account created. Share the password with the driver." });
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-drivers/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] });
      toast({ title: "Driver Updated" });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/taxi-drivers/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] });
      toast({ title: "Driver Deleted" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-customers/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxi-customers"] });
      toast({ title: "Customer Updated" });
    },
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-complaints/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/taxi-complaints"] });
      toast({ title: "Complaint Updated" });
    },
  });

  const getDriversForBrand = (brandId: string) => allDrivers.filter((d: any) => d.brandId === brandId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6" /> Taxi System
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage taxi brands, drivers, customers, and complaints</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: "brands" as TabView, label: "Brands", count: brands.length },
          { id: "drivers" as TabView, label: "Drivers", count: allDrivers.length },
          { id: "customers" as TabView, label: "Customers", count: customers.length },
          { id: "complaints" as TabView, label: "Complaints", count: complaints.filter((c: any) => c.status === "open").length },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={tabView === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTabView(tab.id)}
            data-testid={`tab-taxi-${tab.id}`}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {tabView === "brands" && (
        <div className="space-y-4">
          <Button onClick={() => setShowCreateBrand(true)} className="gap-2" data-testid="button-create-brand">
            <Plus className="h-4 w-4" /> Create Taxi Brand
          </Button>

          {brands.map((brand: any) => {
            const brandDrivers = getDriversForBrand(brand.id);
            const isExpanded = expandedBrand === brand.id;
            const monthsSincePayment = brand.lastPaymentDate
              ? Math.floor((Date.now() - new Date(brand.lastPaymentDate).getTime()) / (30 * 24 * 60 * 60 * 1000))
              : null;
            const overdue = monthsSincePayment !== null && monthsSincePayment >= 2;

            return (
              <div key={brand.id} className={`border rounded-xl overflow-hidden ${overdue ? "border-red-500" : "border-gray-200"}`} data-testid={`card-brand-${brand.id}`}>
                <div className="p-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4">
                    {brand.logo ? (
                      <img src={brand.logo} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: brand.primaryColor }}>
                        {brand.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{brand.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${brand.status === "active" ? "bg-green-100 text-green-700" : brand.status === "suspended" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                          {brand.status}
                        </span>
                        {overdue && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {monthsSincePayment}m overdue
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{brandDrivers.length} driver(s) • /taxi/{brand.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/taxi/${brand.slug}`, "_blank")} data-testid={`button-view-brand-${brand.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingBrand(brand); setBrandForm(brand); }} data-testid={`button-edit-brand-${brand.id}`}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedBrand(isExpanded ? null : brand.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (confirm(`Delete "${brand.name}"? This will delete all drivers too.`)) deleteBrandMutation.mutate(brand.id);
                    }} className="text-red-500" data-testid={`button-delete-brand-${brand.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 bg-gray-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold">Drivers in {brand.name}</h4>
                      <Button size="sm" onClick={() => { setSelectedBrandForDriver(brand.id); setDriverForm(prev => ({ ...prev, brandId: brand.id })); setShowCreateDriver(true); }} data-testid={`button-add-driver-${brand.id}`}>
                        <Plus className="h-3 w-3 mr-1" /> Add Driver
                      </Button>
                    </div>
                    {brandDrivers.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No drivers yet</p>
                    ) : (
                      <div className="space-y-3">
                        {brandDrivers.map((driver: any) => (
                          <div key={driver.id} className="bg-white rounded-lg p-4 border" data-testid={`card-driver-${driver.id}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                  {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <Users className="h-5 w-5 text-blue-500" />}
                                </div>
                                <div>
                                  <p className="font-medium">{driver.name}</p>
                                  <p className="text-xs text-gray-500">{driver.phone} • {driver.vehicleType === "sedan_5" ? "Sedan" : driver.vehicleType === "mpv_7" ? "MPV" : "Motorbike"} • {driver.numberPlate || "No plate"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${driver.status === "active" ? "bg-green-100 text-green-700" : driver.status === "pending" ? "bg-yellow-100 text-yellow-700" : driver.status === "blocked" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                                  {driver.status}
                                </span>
                                {driver.status === "pending" && (
                                  <Button size="sm" variant="default" onClick={() => updateDriverMutation.mutate({ id: driver.id, data: { status: "active" } })} data-testid={`button-approve-driver-${driver.id}`}>
                                    <Check className="h-3 w-3 mr-1" /> Approve
                                  </Button>
                                )}
                                {driver.status === "active" && (
                                  <Button size="sm" variant="outline" onClick={() => updateDriverMutation.mutate({ id: driver.id, data: { status: "blocked" } })} className="text-red-500" data-testid={`button-block-driver-${driver.id}`}>
                                    Block
                                  </Button>
                                )}
                                {driver.status === "blocked" && (
                                  <Button size="sm" variant="outline" onClick={() => updateDriverMutation.mutate({ id: driver.id, data: { status: "active" } })}>
                                    Unblock
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => {
                                  if (confirm(`Delete driver "${driver.name}"?`)) deleteDriverMutation.mutate(driver.id);
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="bg-gray-50 rounded p-2"><span className="text-gray-400">Visa:</span> {driver.visaType?.replace(/_/g, " ") || "N/A"}</div>
                              <div className="bg-gray-50 rounded p-2"><span className="text-gray-400">Licence:</span> {driver.drivingLicenceNumber || "N/A"}</div>
                              <div className="bg-gray-50 rounded p-2"><span className="text-gray-400">Car:</span> {driver.carModel} {driver.carColor}</div>
                              <div className="bg-gray-50 rounded p-2"><span className="text-gray-400">Area:</span> {driver.serviceRadiusMiles}mi</div>
                            </div>
                            {(driver.drivingLicenceImage || driver.visaImage || driver.insuranceImage || driver.carImage) && (
                              <div className="mt-3 flex gap-2 flex-wrap">
                                {driver.drivingLicenceImage && <a href={driver.drivingLicenceImage} target="_blank" className="text-xs text-blue-500 underline flex items-center gap-1"><FileText className="h-3 w-3" /> Licence</a>}
                                {driver.visaImage && <a href={driver.visaImage} target="_blank" className="text-xs text-blue-500 underline flex items-center gap-1"><FileText className="h-3 w-3" /> Visa</a>}
                                {driver.insuranceImage && <a href={driver.insuranceImage} target="_blank" className="text-xs text-blue-500 underline flex items-center gap-1"><Shield className="h-3 w-3" /> Insurance</a>}
                                {driver.carImage && <a href={driver.carImage} target="_blank" className="text-xs text-blue-500 underline flex items-center gap-1"><Car className="h-3 w-3" /> Car Photo</a>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {brands.length === 0 && !isLoading && (
            <div className="text-center py-12 border border-dashed rounded-xl">
              <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No taxi brands yet. Create your first one!</p>
            </div>
          )}
        </div>
      )}

      {tabView === "drivers" && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">All Drivers ({allDrivers.length})</h3>
          {allDrivers.map((driver: any) => {
            const brand = brands.find((b: any) => b.id === driver.brandId);
            return (
              <div key={driver.id} className="border rounded-lg p-4 bg-white" data-testid={`card-all-driver-${driver.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                      {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <Users className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-xs text-gray-500">{brand?.name || "Unknown"} • {driver.phone}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${driver.status === "active" ? "bg-green-100 text-green-700" : driver.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {driver.status} {driver.onDuty ? "• ON DUTY" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tabView === "customers" && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">All Customers ({customers.length})</h3>
          {customers.map((customer: any) => (
            <div key={customer.id} className="border rounded-lg p-4 bg-white flex items-center justify-between" data-testid={`card-customer-${customer.id}`}>
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.phone} • {customer.email || "No email"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${customer.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {customer.status}
                </span>
                {customer.status === "active" ? (
                  <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateCustomerMutation.mutate({ id: customer.id, data: { status: "blocked" } })}>
                    Block
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => updateCustomerMutation.mutate({ id: customer.id, data: { status: "active" } })}>
                    Unblock
                  </Button>
                )}
              </div>
            </div>
          ))}
          {customers.length === 0 && <p className="text-center text-gray-400 py-8">No customers yet</p>}
        </div>
      )}

      {tabView === "complaints" && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Complaints ({complaints.length})</h3>
          {complaints.map((complaint: any) => (
            <div key={complaint.id} className="border rounded-lg p-4 bg-white" data-testid={`card-complaint-${complaint.id}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${complaint.status === "open" ? "bg-red-100 text-red-700" : complaint.status === "investigating" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                  {complaint.status}
                </span>
                <span className="text-xs text-gray-400">{new Date(complaint.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm mb-2">{complaint.description}</p>
              <p className="text-xs text-gray-400">Filed by: {complaint.filedBy}</p>
              {complaint.resolution && <p className="text-xs text-green-600 mt-1">Resolution: {complaint.resolution}</p>}
              {complaint.status !== "resolved" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resolveComplaintMutation.mutate({ id: complaint.id, data: { status: "investigating" } })}>
                    Investigating
                  </Button>
                  <Button size="sm" onClick={() => {
                    const resolution = prompt("Enter resolution:");
                    if (resolution) resolveComplaintMutation.mutate({ id: complaint.id, data: { status: "resolved", resolution, resolvedBy: "super_admin" } });
                  }}>
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          ))}
          {complaints.length === 0 && <p className="text-center text-gray-400 py-8">No complaints</p>}
        </div>
      )}

      <Dialog open={showCreateBrand || !!editingBrand} onOpenChange={(open) => { if (!open) { setShowCreateBrand(false); setEditingBrand(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Taxi Brand" : "Create Taxi Brand"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Brand Name *</label>
                <Input value={brandForm.name} onChange={(e) => setBrandForm(p => ({ ...p, name: e.target.value }))} placeholder="My Taxi Co" data-testid="input-brand-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Slug *</label>
                <Input value={brandForm.slug} onChange={(e) => setBrandForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} placeholder="my-taxi-co" data-testid="input-brand-slug" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Logo URL</label>
              <Input value={brandForm.logo || ""} onChange={(e) => setBrandForm(p => ({ ...p, logo: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input value={brandForm.address || ""} onChange={(e) => setBrandForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={brandForm.phone || ""} onChange={(e) => setBrandForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={brandForm.email || ""} onChange={(e) => setBrandForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={brandForm.primaryColor} onChange={(e) => setBrandForm(p => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={brandForm.primaryColor} onChange={(e) => setBrandForm(p => ({ ...p, primaryColor: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Secondary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={brandForm.secondaryColor} onChange={(e) => setBrandForm(p => ({ ...p, secondaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={brandForm.secondaryColor} onChange={(e) => setBrandForm(p => ({ ...p, secondaryColor: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Monthly Fee (£)</label>
                <Input type="number" value={brandForm.monthlyFee} onChange={(e) => setBrandForm(p => ({ ...p, monthlyFee: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Commission (%)</label>
                <Input type="number" value={brandForm.platformCommissionPercent} onChange={(e) => setBrandForm(p => ({ ...p, platformCommissionPercent: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={brandForm.description || ""} onChange={(e) => setBrandForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateBrand(false); setEditingBrand(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (editingBrand) {
                updateBrandMutation.mutate({ id: editingBrand.id, data: brandForm });
              } else {
                createBrandMutation.mutate(brandForm);
              }
            }} data-testid="button-save-brand">
              {editingBrand ? "Save Changes" : "Create Brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDriver} onOpenChange={(open) => { if (!open) setShowCreateDriver(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input value={driverForm.name} onChange={(e) => setDriverForm(p => ({ ...p, name: e.target.value }))} data-testid="input-driver-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone *</label>
                <Input value={driverForm.phone} onChange={(e) => setDriverForm(p => ({ ...p, phone: e.target.value }))} data-testid="input-driver-phone" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={driverForm.email} onChange={(e) => setDriverForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">WhatsApp</label>
                <Input value={driverForm.whatsapp} onChange={(e) => setDriverForm(p => ({ ...p, whatsapp: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input value={driverForm.address} onChange={(e) => setDriverForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input value={driverForm.country} onChange={(e) => setDriverForm(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Visa Type</label>
                <select value={driverForm.visaType} onChange={(e) => setDriverForm(p => ({ ...p, visaType: e.target.value }))} className="w-full border rounded-md px-3 py-2">
                  <option value="citizen">Citizen</option>
                  <option value="resident">Resident</option>
                  <option value="work_permit">Work Permit</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Car Model</label>
                <Input value={driverForm.carModel} onChange={(e) => setDriverForm(p => ({ ...p, carModel: e.target.value }))} placeholder="Toyota Prius" />
              </div>
              <div>
                <label className="text-sm font-medium">Car Color</label>
                <Input value={driverForm.carColor} onChange={(e) => setDriverForm(p => ({ ...p, carColor: e.target.value }))} placeholder="Black" />
              </div>
              <div>
                <label className="text-sm font-medium">Number Plate</label>
                <Input value={driverForm.numberPlate} onChange={(e) => setDriverForm(p => ({ ...p, numberPlate: e.target.value }))} placeholder="AB12 CDE" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Vehicle Type</label>
                <select value={driverForm.vehicleType} onChange={(e) => setDriverForm(p => ({ ...p, vehicleType: e.target.value }))} className="w-full border rounded-md px-3 py-2">
                  <option value="sedan_5">Sedan (5 Seats)</option>
                  <option value="mpv_7">MPV (7 Seats)</option>
                  <option value="motorbike">Motorbike</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Service Area (miles)</label>
                <Input type="number" value={driverForm.serviceRadiusMiles} onChange={(e) => setDriverForm(p => ({ ...p, serviceRadiusMiles: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Weekly Hours</label>
                <Input type="number" value={driverForm.weeklyHoursAllowed} onChange={(e) => setDriverForm(p => ({ ...p, weeklyHoursAllowed: parseInt(e.target.value) || 48 }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Driving Licence Number</label>
              <Input value={driverForm.drivingLicenceNumber} onChange={(e) => setDriverForm(p => ({ ...p, drivingLicenceNumber: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Photo URL</label>
                <Input value={driverForm.photo} onChange={(e) => setDriverForm(p => ({ ...p, photo: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium">Car Image URL</label>
                <Input value={driverForm.carImage} onChange={(e) => setDriverForm(p => ({ ...p, carImage: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Licence Image URL</label>
                <Input value={driverForm.drivingLicenceImage} onChange={(e) => setDriverForm(p => ({ ...p, drivingLicenceImage: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Insurance Image URL</label>
                <Input value={driverForm.insuranceImage} onChange={(e) => setDriverForm(p => ({ ...p, insuranceImage: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Password * (share this with the driver)</label>
              <Input type="text" value={driverForm.password} onChange={(e) => setDriverForm(p => ({ ...p, password: e.target.value }))} placeholder="Create a strong password" data-testid="input-driver-password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDriver(false)}>Cancel</Button>
            <Button onClick={() => createDriverMutation.mutate(driverForm)} disabled={!driverForm.name || !driverForm.phone || !driverForm.password} data-testid="button-save-driver">
              Create Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
