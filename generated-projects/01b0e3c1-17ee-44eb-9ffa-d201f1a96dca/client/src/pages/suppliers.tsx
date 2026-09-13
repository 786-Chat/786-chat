import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { getRestaurantBySlug } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Minus, Trash2, Edit2, Package, Send, Check, X, Loader2, Phone, Mail, User, MessageCircle, CheckSquare, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Supplier, SupplierProduct, SupplierOrder, SupplierOrderItem } from "@shared/schema";
import { getCurrencySymbol } from "@shared/schema";
import { InstallPrompt } from "@/components/install-prompt";

type SupplierWithProducts = Supplier & { products: SupplierProduct[] };
type SupplierOrderWithItems = SupplierOrder & { items: SupplierOrderItem[]; supplier?: Supplier };

const UNIT_TYPES = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "packet", label: "Packet" },
  { value: "piece", label: "Piece" },
  { value: "box", label: "Box" },
  { value: "bottle", label: "Bottle" },
  { value: "bag", label: "Bag" },
  { value: "case", label: "Case" },
  { value: "other", label: "Other" },
];

function generateWhatsAppLink(order: SupplierOrderWithItems, restaurantName: string, currencySymbol: string, restaurantAddress?: string, restaurantPhone?: string, vatEnabled?: boolean, vatPercent?: number): string | null {
  const supplierWhatsapp = order.supplier?.whatsapp;
  if (!supplierWhatsapp) return null;
  
  const cleanNumber = supplierWhatsapp.replace(/[^0-9]/g, "");
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  
  const subtotal = parseFloat(order.total || "0");
  const vatRate = vatEnabled ? (vatPercent || 0) : 0;
  const vatAmount = vatRate > 0 ? (subtotal * vatRate / 100) : 0;
  const grandTotal = subtotal + vatAmount;
  
  const line = "─────────────────────────────";
  const doubleLine = "═══════════════════════════";
  
  const itemsList = order.items?.map((item, idx) => 
    `${String(idx + 1).padStart(2, ' ')}. ${item.productName}\n     ${item.quantity} ${item.unitType || 'units'} ............... ${currencySymbol}${parseFloat(item.subtotal || "0").toFixed(2)}`
  ).join('\n\n') || '';
  
  const message = `┌${doubleLine}┐
│     📋 *PURCHASE ORDER*      │
└${doubleLine}┘

🏪 *${restaurantName.toUpperCase()}*
${line}
${restaurantAddress ? `📍 ${restaurantAddress}` : ''}
${restaurantPhone ? `📞 ${restaurantPhone}` : ''}

${line}
*SUPPLIER:*
🏭 ${order.supplier?.name || 'Supplier'}
${order.supplier?.contactName ? `👤 Attn: ${order.supplier.contactName}` : ''}
${order.supplier?.phone ? `📞 ${order.supplier.phone}` : ''}

*Date:* ${dateStr}  |  *Time:* ${timeStr}

${line}
*ITEMS ORDERED*
${line}

${itemsList}

${line}
*SUMMARY*
${line}
Subtotal: ............... ${currencySymbol}${subtotal.toFixed(2)}
${vatRate > 0 ? `VAT (${vatRate}%): ............. ${currencySymbol}${vatAmount.toFixed(2)}\n` : ''}${line}
*TOTAL: ${currencySymbol}${grandTotal.toFixed(2)}*
${doubleLine}

${order.notes ? `*Notes:* ${order.notes}\n\n` : ''}Thank you for your service!

_${restaurantName}_`;

  return `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
}

export default function SuppliersPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    const originalManifest = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = originalManifest?.getAttribute('href');
    
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]:not([sizes])');
    const originalIconHref = appleTouchIcon?.getAttribute('href');
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute('content');
    
    const appleAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleAppTitle?.getAttribute('content');

    if (originalManifest) {
      originalManifest.setAttribute('href', '/manifest-suppliers.json');
    }
    if (appleTouchIcon) {
      appleTouchIcon.setAttribute('href', '/icon-suppliers-512.png');
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#8b5cf6');
    }
    if (appleAppTitle) {
      appleAppTitle.setAttribute('content', 'Link24-Suppliers');
    }
    
    return () => {
      if (originalManifest && originalManifestHref) {
        originalManifest.setAttribute('href', originalManifestHref);
      }
      if (appleTouchIcon && originalIconHref) {
        appleTouchIcon.setAttribute('href', originalIconHref);
      }
      if (metaThemeColor && originalThemeColor) {
        metaThemeColor.setAttribute('content', originalThemeColor);
      }
      if (appleAppTitle && originalAppleTitle) {
        appleAppTitle.setAttribute('content', originalAppleTitle);
      }
    };
  }, []);

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id || null;
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery<SupplierWithProducts[]>({
    queryKey: ["/api/suppliers", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/suppliers`);
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery<SupplierOrderWithItems[]>({
    queryKey: ["/api/supplier-orders", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/supplier-orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const [activeTab, setActiveTab] = useState("suppliers");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithProducts | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);

  const [newSupplier, setNewSupplier] = useState({ name: "", email: "", phone: "", whatsapp: "", contactName: "", notes: "" });
  const [newProduct, setNewProduct] = useState({ name: "", unitType: "piece", unitLabel: "", pricePerUnit: "" });
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedOrdersBySupplier, setSelectedOrdersBySupplier] = useState<Map<string, Set<string>>>(new Map());
  const openWhatsApp = (link: string) => {
    window.open(link, "whatsapp_supplier_window");
  };

  const getSelectedOrderIds = (supplierId: string): Set<string> => {
    return selectedOrdersBySupplier.get(supplierId) || new Set();
  };

  const toggleOrderSelection = (supplierId: string, orderId: string) => {
    setSelectedOrdersBySupplier(prev => {
      const newMap = new Map(prev);
      const supplierSet = new Set(prev.get(supplierId) || []);
      if (supplierSet.has(orderId)) {
        supplierSet.delete(orderId);
      } else {
        supplierSet.add(orderId);
      }
      newMap.set(supplierId, supplierSet);
      return newMap;
    });
  };

  const selectAllOrders = (supplierId: string, orderIds: string[]) => {
    setSelectedOrdersBySupplier(prev => {
      const newMap = new Map(prev);
      newMap.set(supplierId, new Set(orderIds));
      return newMap;
    });
  };

  const clearSelection = (supplierId: string) => {
    setSelectedOrdersBySupplier(prev => {
      const newMap = new Map(prev);
      newMap.set(supplierId, new Set());
      return newMap;
    });
  };

  const generateCombinedWhatsAppLink = (selectedOrders: SupplierOrderWithItems[], supplier: SupplierWithProducts): string | null => {
    if (!supplier.whatsapp) return null;
    
    const cleanNumber = supplier.whatsapp.replace(/[^0-9]/g, "");
    
    const allItems: { productName: string; quantity: number; unitType: string; subtotal: string }[] = [];
    let subtotal = 0;
    const orderNotes: string[] = [];
    
    selectedOrders.forEach(order => {
      if (order.notes) {
        orderNotes.push(order.notes);
      }
      order.items?.forEach(item => {
        allItems.push({
          productName: item.productName || "",
          quantity: Number(item.quantity) || 0,
          unitType: item.unitType || "units",
          subtotal: item.subtotal || "0"
        });
        subtotal += parseFloat(item.subtotal || "0");
      });
    });
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    const vatRate = restaurant?.vatEnabled ? Number(restaurant.vatPercent || 0) : 0;
    const vatAmount = vatRate > 0 ? (subtotal * vatRate / 100) : 0;
    const grandTotal = subtotal + vatAmount;
    
    const line = "─────────────────────────────";
    const doubleLine = "═══════════════════════════";
    
    const itemsList = allItems.map((item, idx) => 
      `${String(idx + 1).padStart(2, ' ')}. ${item.productName}\n     ${item.quantity} ${item.unitType} ............... ${currencySymbol}${parseFloat(item.subtotal).toFixed(2)}`
    ).join('\n\n');
    
    const message = `┌${doubleLine}┐
│     📋 *PURCHASE ORDER*      │
└${doubleLine}┘

🏪 *${restaurant?.name?.toUpperCase() || 'RESTAURANT'}*
${line}
${restaurant?.address ? `📍 ${restaurant.address}` : ''}
${restaurant?.phone ? `📞 ${restaurant.phone}` : ''}
${restaurant?.email ? `✉️ ${restaurant.email}` : ''}

${line}
*SUPPLIER:*
🏭 ${supplier.name}
${supplier.contactName ? `👤 Attn: ${supplier.contactName}` : ''}
${supplier.phone ? `📞 ${supplier.phone}` : ''}

*Date:* ${dateStr}  |  *Time:* ${timeStr}

${line}
*ITEMS ORDERED*
${line}

${itemsList}

${line}
*SUMMARY*
${line}
Subtotal: ............... ${currencySymbol}${subtotal.toFixed(2)}
${vatRate > 0 ? `VAT (${vatRate}%): ............. ${currencySymbol}${vatAmount.toFixed(2)}\n` : ''}${line}
*TOTAL: ${currencySymbol}${grandTotal.toFixed(2)}*
${doubleLine}

${orderNotes.length > 0 ? `*Notes:* ${orderNotes.join(', ')}\n\n` : ''}Thank you for your service!

_${restaurant?.name || 'Restaurant'}_`;

    return `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
  };

  const createSupplierMutation = useMutation({
    mutationFn: async (data: typeof newSupplier) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create supplier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      setShowAddSupplier(false);
      setNewSupplier({ name: "", email: "", phone: "", whatsapp: "", contactName: "", notes: "" });
      toast({ title: "Supplier Added", description: "New supplier has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create supplier.", variant: "destructive" });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Supplier> }) => {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update supplier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      setEditingSupplier(null);
      toast({ title: "Supplier Updated", description: "Supplier details have been saved." });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete supplier");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      if (selectedSupplier) setSelectedSupplier(null);
      toast({ title: "Supplier Deleted", description: "Supplier has been removed." });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof newProduct & { supplierId: string }) => {
      const res = await fetch(`/api/suppliers/${data.supplierId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      setShowAddProduct(false);
      setNewProduct({ name: "", unitType: "piece", unitLabel: "", pricePerUnit: "" });
      toast({ title: "Product Added", description: "New product has been added to supplier." });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierProduct> }) => {
      const res = await fetch(`/api/supplier-products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      setEditingProduct(null);
      toast({ title: "Product Updated", description: "Product details have been saved." });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/supplier-products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", restaurantId] });
      toast({ title: "Product Deleted", description: "Product has been removed." });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { supplierId: string; items: { productId: string; quantity: number }[]; notes: string }) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/supplier-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders", restaurantId] });
      setOrderQuantities({});
      setOrderNotes("");
      setActiveTab("orders");
      toast({ title: "Order Created", description: "Supplier order has been created as draft." });
    },
  });

  const sendOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/supplier-orders/${orderId}/send`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to send order");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders", restaurantId] });
      toast({ 
        title: "Order Sent", 
        description: data.emailPreview ? "Order marked as sent. Email preview generated." : "Order has been marked as sent." 
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/supplier-orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders", restaurantId] });
      toast({ title: "Order Deleted", description: "Order has been removed." });
    },
  });

  const updateItemQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity, unitPrice }: { itemId: string; quantity: number; unitPrice: number }) => {
      const res = await fetch(`/api/supplier-order-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, unitPrice }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders", restaurantId] });
    },
  });

  const handleCreateOrder = () => {
    if (!selectedSupplier) return;
    const items = Object.entries(orderQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) {
      toast({ title: "No Items", description: "Please add quantities to at least one product.", variant: "destructive" });
      return;
    }
    createOrderMutation.mutate({ supplierId: selectedSupplier.id, items, notes: orderNotes });
  };

  const getOrderTotal = () => {
    if (!selectedSupplier) return 0;
    return Object.entries(orderQuantities).reduce((total, [productId, qty]) => {
      const product = selectedSupplier.products.find(p => p.id === productId);
      if (product && qty > 0) {
        return total + (parseFloat(product.pricePerUnit || "0") * qty);
      }
      return total;
    }, 0);
  };

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-4 flex items-center gap-4 sticky top-0 z-40">
        <Link href={`/dashboard/${slug}`}>
          <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">{restaurant?.name} - Suppliers</h1>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Supplier Ordering System</span>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">Suppliers</TabsTrigger>
            {suppliers.map((supplier, index) => {
              const supplierOrderCount = orders.filter(o => o.supplierId === supplier.id).length;
              return (
                <TabsTrigger 
                  key={supplier.id} 
                  value={`orders-${supplier.id}`}
                  data-testid={`tab-orders-${index + 1}`}
                >
                  Order History {index + 1} ({supplierOrderCount})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="suppliers">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Suppliers</CardTitle>
                    <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid="button-add-supplier">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Supplier</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Supplier Name *</Label>
                            <Input 
                              value={newSupplier.name} 
                              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                              placeholder="e.g., Fresh Meats Ltd"
                              data-testid="input-supplier-name"
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input 
                              type="email"
                              value={newSupplier.email} 
                              onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                              placeholder="orders@supplier.com"
                              data-testid="input-supplier-email"
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input 
                              value={newSupplier.phone} 
                              onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                              placeholder="+44 7xxx xxx xxx"
                              data-testid="input-supplier-phone"
                            />
                          </div>
                          <div>
                            <Label>WhatsApp Number</Label>
                            <Input 
                              value={newSupplier.whatsapp} 
                              onChange={(e) => setNewSupplier({ ...newSupplier, whatsapp: e.target.value })}
                              placeholder="+44 7xxx xxx xxx"
                              data-testid="input-supplier-whatsapp"
                            />
                            <p className="text-xs text-muted-foreground mt-1">For sending orders via WhatsApp</p>
                          </div>
                          <div>
                            <Label>Contact Name</Label>
                            <Input 
                              value={newSupplier.contactName} 
                              onChange={(e) => setNewSupplier({ ...newSupplier, contactName: e.target.value })}
                              placeholder="John Smith"
                              data-testid="input-supplier-contact"
                            />
                          </div>
                          <div>
                            <Label>Notes</Label>
                            <Textarea 
                              value={newSupplier.notes} 
                              onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                              placeholder="Delivery days, minimum order, etc."
                              data-testid="input-supplier-notes"
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => createSupplierMutation.mutate(newSupplier)}
                            disabled={!newSupplier.name || createSupplierMutation.isPending}
                            data-testid="button-save-supplier"
                          >
                            {createSupplierMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Supplier
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {loadingSuppliers ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : suppliers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No suppliers yet. Add your first supplier above.</p>
                    ) : (
                      <div className="space-y-2">
                        {suppliers.map((supplier) => {
                          const supplierOrderCount = orders.filter(o => o.supplierId === supplier.id).length;
                          return (
                            <button
                              key={supplier.id}
                              onClick={() => setSelectedSupplier(supplier)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                selectedSupplier?.id === supplier.id 
                                  ? "border-primary bg-primary/10" 
                                  : "border-border hover:bg-accent"
                              }`}
                              data-testid={`supplier-card-${supplier.id}`}
                            >
                              <div className="font-medium">{supplier.name}</div>
                              <div className="text-sm text-muted-foreground flex justify-between">
                                <span>{supplier.products?.length || 0} products</span>
                                {supplierOrderCount > 0 && (
                                  <span className="text-primary">Orders ({supplierOrderCount})</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {selectedSupplier ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{selectedSupplier.name}</CardTitle>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            {selectedSupplier.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" /> {selectedSupplier.email}
                              </span>
                            )}
                            {selectedSupplier.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" /> {selectedSupplier.phone}
                              </span>
                            )}
                            {selectedSupplier.contactName && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" /> {selectedSupplier.contactName}
                              </span>
                            )}
                          </div>
                          {selectedSupplier.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{selectedSupplier.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingSupplier(selectedSupplier)}
                            data-testid="button-edit-supplier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this supplier and all their products?")) {
                                deleteSupplierMutation.mutate(selectedSupplier.id);
                              }
                            }}
                            data-testid="button-delete-supplier"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Products</CardTitle>
                        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid="button-add-product">
                              <Plus className="h-4 w-4 mr-1" /> Add Product
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Product to {selectedSupplier.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label>Product Name *</Label>
                                <Input 
                                  value={newProduct.name} 
                                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                  placeholder="e.g., Chicken Breast"
                                  data-testid="input-product-name"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Unit Type</Label>
                                  <Select 
                                    value={newProduct.unitType} 
                                    onValueChange={(v) => setNewProduct({ ...newProduct, unitType: v })}
                                  >
                                    <SelectTrigger data-testid="select-unit-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {UNIT_TYPES.map((ut) => (
                                        <SelectItem key={ut.value} value={ut.value}>{ut.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Custom Unit Label</Label>
                                  <Input 
                                    value={newProduct.unitLabel} 
                                    onChange={(e) => setNewProduct({ ...newProduct, unitLabel: e.target.value })}
                                    placeholder="e.g., 5kg bag"
                                    data-testid="input-unit-label"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Price per Unit ({currencySymbol})</Label>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  value={newProduct.pricePerUnit} 
                                  onChange={(e) => setNewProduct({ ...newProduct, pricePerUnit: e.target.value })}
                                  placeholder="0.00"
                                  data-testid="input-product-price"
                                />
                              </div>
                              <Button 
                                className="w-full" 
                                onClick={() => createProductMutation.mutate({ ...newProduct, supplierId: selectedSupplier.id })}
                                disabled={!newProduct.name || createProductMutation.isPending}
                                data-testid="button-save-product"
                              >
                                {createProductMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Product
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        {selectedSupplier.products?.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">No products yet. Add products to start ordering.</p>
                        ) : (
                          <div className="space-y-3">
                            {selectedSupplier.products?.map((product) => (
                              <div 
                                key={product.id} 
                                className="flex items-center justify-between p-3 border rounded-lg"
                                data-testid={`product-row-${product.id}`}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {currencySymbol}{parseFloat(product.pricePerUnit || "0").toFixed(2)} per {product.unitLabel || product.unitType}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setOrderQuantities({
                                        ...orderQuantities,
                                        [product.id]: Math.max(0, (orderQuantities[product.id] || 0) - 1)
                                      })}
                                      data-testid={`button-qty-minus-${product.id}`}
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      min="0"
                                      className="w-16 text-center"
                                      value={orderQuantities[product.id] || 0}
                                      onChange={(e) => setOrderQuantities({
                                        ...orderQuantities,
                                        [product.id]: parseInt(e.target.value) || 0
                                      })}
                                      data-testid={`input-qty-${product.id}`}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setOrderQuantities({
                                        ...orderQuantities,
                                        [product.id]: (orderQuantities[product.id] || 0) + 1
                                      })}
                                      data-testid={`button-qty-plus-${product.id}`}
                                    >
                                      +
                                    </Button>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Delete this product?")) {
                                        deleteProductMutation.mutate(product.id);
                                      }
                                    }}
                                    data-testid={`button-delete-product-${product.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {Object.values(orderQuantities).some(q => q > 0) && (
                      <Card className="border-primary">
                        <CardHeader>
                          <CardTitle className="text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {Object.entries(orderQuantities)
                              .filter(([_, qty]) => qty > 0)
                              .map(([productId, qty]) => {
                                const product = selectedSupplier.products.find(p => p.id === productId);
                                if (!product) return null;
                                const lineTotal = qty * parseFloat(product.pricePerUnit || "0");
                                return (
                                  <div key={productId} className="flex justify-between text-sm">
                                    <span>{product.name} x {qty}</span>
                                    <span>{currencySymbol}{lineTotal.toFixed(2)}</span>
                                  </div>
                                );
                              })}
                          </div>
                          <div className="border-t pt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span>{currencySymbol}{getOrderTotal().toFixed(2)}</span>
                          </div>
                          <div>
                            <Label>Order Notes</Label>
                            <Textarea
                              value={orderNotes}
                              onChange={(e) => setOrderNotes(e.target.value)}
                              placeholder="Any special instructions..."
                              data-testid="input-order-notes"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1" 
                              size="lg"
                              onClick={handleCreateOrder}
                              disabled={createOrderMutation.isPending}
                              data-testid="button-create-order"
                            >
                              {createOrderMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Package className="h-4 w-4 mr-2" />
                              )}
                              Create Order
                            </Button>
                            {selectedSupplier.whatsapp && (
                              <Button
                                size="lg"
                                variant="outline"
                                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                                onClick={() => {
                                  const itemsList = Object.entries(orderQuantities)
                                    .filter(([_, qty]) => qty > 0)
                                    .map(([productId, qty]) => {
                                      const product = selectedSupplier.products.find(p => p.id === productId);
                                      if (!product) return null;
                                      const lineTotal = qty * parseFloat(product.pricePerUnit || "0");
                                      return `• ${product.name}: ${qty} ${product.unitType || 'units'} @ ${currencySymbol}${product.pricePerUnit} = ${currencySymbol}${lineTotal.toFixed(2)}`;
                                    })
                                    .filter(Boolean)
                                    .join('\n');
                                  
                                  const message = `Hi ${selectedSupplier.contactName || selectedSupplier.name},

Here is our order from ${restaurant?.name}:

${itemsList}

*Total: ${currencySymbol}${getOrderTotal().toFixed(2)}*

${orderNotes ? `Notes: ${orderNotes}` : ''}

Thank you!`;
                                  
                                  const cleanNumber = (selectedSupplier.whatsapp || "").replace(/[^0-9]/g, "");
                                  const link = `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
                                  openWhatsApp(link);
                                  toast({ title: "WhatsApp Opened", description: "Complete sending the order in WhatsApp." });
                                }}
                                data-testid="button-whatsapp-cart"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a supplier to view products and create orders</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {suppliers.map((supplier, index) => {
            const supplierOrders = orders.filter(o => o.supplierId === supplier.id);
            const supplierOrderIds = supplierOrders.map(o => o.id);
            const supplierSelectedIds = getSelectedOrderIds(supplier.id);
            const selectedForThisSupplier = supplierOrders.filter(o => supplierSelectedIds.has(o.id));
            const allSelected = supplierOrders.length > 0 && selectedForThisSupplier.length === supplierOrders.length;
            const someSelected = selectedForThisSupplier.length > 0;
            
            return (
              <TabsContent key={supplier.id} value={`orders-${supplier.id}`}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle>Order History {index + 1} - {supplier.name}</CardTitle>
                      {supplier.whatsapp && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                          onClick={() => {
                            const cleanNumber = supplier.whatsapp!.replace(/[^0-9]/g, "");
                            openWhatsApp(`https://web.whatsapp.com/send?phone=${cleanNumber}`);
                          }}
                          data-testid={`button-whatsapp-login-${supplier.id}`}
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    {supplierOrders.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`select-all-${supplier.id}`}
                            checked={allSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                selectAllOrders(supplier.id, supplierOrderIds);
                              } else {
                                clearSelection(supplier.id);
                              }
                            }}
                            data-testid={`checkbox-select-all-${supplier.id}`}
                          />
                          <Label htmlFor={`select-all-${supplier.id}`} className="text-sm cursor-pointer">
                            Select All
                          </Label>
                        </div>
                        {someSelected && supplier.whatsapp && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              const link = generateCombinedWhatsAppLink(selectedForThisSupplier, supplier);
                              if (link) {
                                openWhatsApp(link);
                                clearSelection(supplier.id);
                                toast({ title: "WhatsApp Opened", description: `Sending ${selectedForThisSupplier.length} orders combined.` });
                              }
                            }}
                            data-testid={`button-send-selected-${supplier.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Send {selectedForThisSupplier.length} Selected
                          </Button>
                        )}
                        {someSelected && !supplier.whatsapp && (
                          <span className="text-xs text-muted-foreground">Add WhatsApp to supplier to send</span>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {loadingOrders ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : supplierOrders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No orders yet for this supplier.</p>
                    ) : (
                      <div className="space-y-4">
                        {supplierOrders.map((order) => (
                          <div 
                            key={order.id} 
                            className={`border rounded-lg p-4 ${supplierSelectedIds.has(order.id) ? 'border-primary bg-primary/5' : ''}`}
                            data-testid={`order-card-${order.id}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={supplierSelectedIds.has(order.id)}
                                  onCheckedChange={() => toggleOrderSelection(supplier.id, order.id)}
                                  data-testid={`checkbox-order-${order.id}`}
                                />
                                <div className="text-sm text-muted-foreground">
                                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-GB", {
                                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                  }) : "No date"}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  order.status === "sent" ? "default" :
                                  order.status === "received" ? "secondary" :
                                  order.status === "cancelled" ? "destructive" : "outline"
                                }>
                                  {order.status}
                                </Badge>
                                <span className="font-bold">{currencySymbol}{parseFloat(order.total || "0").toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="text-sm space-y-2 mb-3">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2">
                                  <span className="flex-1">{item.productName}</span>
                                  {order.status === "draft" ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                          const newQty = Math.max(0, Number(item.quantity) - 1);
                                          if (newQty > 0) {
                                            updateItemQuantityMutation.mutate({
                                              itemId: item.id,
                                              quantity: newQty,
                                              unitPrice: parseFloat(item.unitPrice || "0")
                                            });
                                          }
                                        }}
                                        disabled={updateItemQuantityMutation.isPending}
                                        data-testid={`button-decrease-${item.id}`}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700 text-white border-green-600"
                                        onClick={() => {
                                          const newQty = Number(item.quantity) + 1;
                                          updateItemQuantityMutation.mutate({
                                            itemId: item.id,
                                            quantity: newQty,
                                            unitPrice: parseFloat(item.unitPrice || "0")
                                          });
                                        }}
                                        disabled={updateItemQuantityMutation.isPending}
                                        data-testid={`button-increase-${item.id}`}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span>x {item.quantity}</span>
                                  )}
                                  <span className="w-16 text-right">{currencySymbol}{parseFloat(item.subtotal || "0").toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {order.notes && (
                              <p className="text-sm text-muted-foreground italic mb-3">Notes: {order.notes}</p>
                            )}

                            <div className="flex gap-2 flex-wrap">
                              {order.status === "draft" && (
                                <Button
                                  size="sm"
                                  onClick={() => sendOrderMutation.mutate(order.id)}
                                  disabled={sendOrderMutation.isPending || !supplier.email}
                                  data-testid={`button-send-order-${order.id}`}
                                >
                                  <Mail className="h-4 w-4 mr-1" /> Email
                                </Button>
                              )}
                              {supplier.whatsapp && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                                  onClick={() => {
                                    const orderWithSupplier = { ...order, supplier };
                                    const link = generateWhatsAppLink(orderWithSupplier, restaurant?.name || "Restaurant", currencySymbol, restaurant?.address || "", restaurant?.phone || "", restaurant?.vatEnabled || false, Number(restaurant?.vatPercent || 0));
                                    if (link) openWhatsApp(link);
                                  }}
                                  data-testid={`button-whatsapp-order-${order.id}`}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Delete this order?")) {
                                    deleteOrderMutation.mutate(order.id);
                                  }
                                }}
                                data-testid={`button-delete-order-${order.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>

      {editingSupplier && (
        <Dialog open={!!editingSupplier} onOpenChange={() => setEditingSupplier(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Supplier Name *</Label>
                <Input 
                  value={editingSupplier.name} 
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  data-testid="input-edit-supplier-name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={editingSupplier.email || ""} 
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                  data-testid="input-edit-supplier-email"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={editingSupplier.phone || ""} 
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                  data-testid="input-edit-supplier-phone"
                />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input 
                  value={editingSupplier.whatsapp || ""} 
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, whatsapp: e.target.value })}
                  data-testid="input-edit-supplier-whatsapp"
                />
                <p className="text-xs text-muted-foreground mt-1">For sending orders via WhatsApp</p>
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input 
                  value={editingSupplier.contactName || ""} 
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, contactName: e.target.value })}
                  data-testid="input-edit-supplier-contact"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={editingSupplier.notes || ""} 
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                  data-testid="input-edit-supplier-notes"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => updateSupplierMutation.mutate({ 
                  id: editingSupplier.id, 
                  data: {
                    name: editingSupplier.name,
                    email: editingSupplier.email,
                    phone: editingSupplier.phone,
                    whatsapp: editingSupplier.whatsapp,
                    contactName: editingSupplier.contactName,
                    notes: editingSupplier.notes,
                  }
                })}
                disabled={!editingSupplier.name || updateSupplierMutation.isPending}
                data-testid="button-update-supplier"
              >
                {updateSupplierMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      <InstallPrompt restaurantName="Suppliers Orders" themeColor="#8b5cf6" />
    </div>
  );
}
