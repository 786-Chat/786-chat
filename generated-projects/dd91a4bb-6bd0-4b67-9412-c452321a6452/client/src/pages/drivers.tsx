import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getRestaurantBySlug, getOrders, getBranchDrivers, createBranchDriver, deleteBranchDriver, assignDriverToOrder, toggleDriverDuty } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Car, Phone, Clock, UserPlus, Trash2, AlertTriangle, RotateCcw, Loader2, DollarSign, Calendar, Wallet, TrendingUp, CreditCard, CheckCircle, Truck, MapPin, Bell } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddDriverForm, type DriverFormData } from "@/components/add-driver-form";
import { getCurrencySymbol } from "@shared/schema";

type OrderWithItems = any;
type BranchDriver = any;

type DriverEarnings = {
  paymentType: string;
  agreedDeliveryCharge: string | null;
  deliveries: {
    today: number;
    week: number;
    lastWeek: number;
    month: number;
    lastMonth: number;
    total: number;
  };
  earnings: {
    today: number;
    week: number;
    lastWeek: number;
    month: number;
    lastMonth: number;
    total: number;
  };
  payments: {
    received: number;
    due: number;
    recentPayments: any[];
  };
};

export default function DriversPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [assigningDriverToOrder, setAssigningDriverToOrder] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  
  const [notifiedOrders, setNotifiedOrders] = useState<Set<number>>(new Set());
  const [deliveryOfferAmount, setDeliveryOfferAmount] = useState("");
  const [deliveryPaymentInstruction, setDeliveryPaymentInstruction] = useState("");
  const [deliveryDriverNotes, setDeliveryDriverNotes] = useState("");

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id;

  const { data: orders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", restaurantId],
    queryFn: () => getOrders(restaurantId!) as Promise<OrderWithItems[]>,
    enabled: !!restaurantId,
    refetchInterval: 10000,
  });

  const { data: branchDrivers = [] } = useQuery<BranchDriver[]>({
    queryKey: ["/api/restaurants", restaurantId, "drivers"],
    queryFn: () => getBranchDrivers(restaurantId!) as Promise<BranchDriver[]>,
    enabled: !!restaurantId,
  });

  const onDutyDrivers = branchDrivers.filter((d: BranchDriver) => d.isOnDuty);

  const createDriverMutation = useMutation({
    mutationFn: (driver: DriverFormData) => createBranchDriver(restaurantId!, driver as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "drivers"] });
      toast({ title: "Driver Added", description: "New driver has been added to this branch." });
      setShowAddDriver(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add driver", variant: "destructive" });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (driverId: number) => deleteBranchDriver(restaurantId!, driverId as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "drivers"] });
      toast({ title: "Driver Removed", description: "Driver has been removed from this branch." });
    },
  });

  const toggleDutyMutation = useMutation({
    mutationFn: ({ driverId, isOnDuty }: { driverId: number; isOnDuty: boolean }) =>
      toggleDriverDuty(driverId as any, isOnDuty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "drivers"] });
    },
  });

  const { data: driverEarnings, isLoading: loadingEarnings } = useQuery<DriverEarnings>({
    queryKey: ["/api/drivers", selectedDriverId, "earnings"],
    queryFn: async () => {
      const res = await fetch(`/api/drivers/${selectedDriverId}/earnings`);
      if (!res.ok) throw new Error("Failed to fetch earnings");
      return res.json();
    },
    enabled: !!selectedDriverId,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ driverId, amount, notes }: { driverId: string; amount: number; notes: string }) => {
      const res = await fetch(`/api/drivers/${driverId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.toString(),
          paymentType: "commission",
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers", selectedDriverId, "earnings"] });
      toast({ title: "Payment Recorded", description: "Driver payment has been recorded successfully." });
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
    },
  });

  const selectedDriver = branchDrivers.find((d: BranchDriver) => d.id === selectedDriverId);
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const assignDriverMutation = useMutation({
    mutationFn: async ({ orderId, driverId, broadcastToAll, offerAmount, paymentInstruction, notes }: { 
      orderId: number; 
      driverId?: number; 
      broadcastToAll?: boolean;
      offerAmount?: string;
      paymentInstruction?: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/assign-driver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          driverId: broadcastToAll ? null : driverId, 
          broadcastToAll,
          offerAmount,
          paymentInstruction,
          notes 
        }),
      });
      if (!res.ok) throw new Error("Failed to assign driver");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
      if (variables.broadcastToAll) {
        setNotifiedOrders(prev => new Set(Array.from(prev).concat(variables.orderId)));
        toast({ title: "Drivers Notified", description: "All on-duty drivers have been notified." });
      } else {
        toast({ title: "Driver Assigned", description: "Order has been assigned to driver." });
      }
      setAssigningDriverToOrder(null);
      setDeliveryOfferAmount("");
      setDeliveryPaymentInstruction("");
      setDeliveryDriverNotes("");
    },
  });

  const rejectedDeliveries = orders.filter(o => {
    if (o.type !== 'delivery' || o.isArchived) return false;
    const delivery = (o as any).delivery;
    return delivery?.deliveryStatus === 'rejected';
  });

  const returnedDeliveries = orders.filter(o => {
    if (o.type !== 'delivery' || o.isArchived) return false;
    const delivery = (o as any).delivery;
    return delivery?.deliveryStatus === 'returned';
  });

  const getReturnReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'customer_unavailable': 'Customer unavailable',
      'order_refused': 'Order refused by customer',
      'incorrect_address': 'Incorrect address',
      'food_damaged': 'Food damaged',
      'other': 'Other reason'
    };
    return labels[reason] || reason;
  };

  const parseReturnReason = (notes: string | null) => {
    if (!notes) return { reason: 'Unknown', details: '' };
    const match = notes.match(/^Return Reason: (\w+)(?:\s*-\s*(.*))?$/);
    if (match) {
      return { reason: getReturnReasonLabel(match[1]), details: match[2] || '' };
    }
    return { reason: notes, details: '' };
  };

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-400">Branch not found</p>
            <Link href="/shop-login">
              <Button variant="link" className="text-cyan-400 mt-2">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${slug}`}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Car className="h-6 w-6 text-cyan-400" />
                Drivers Management
              </h1>
              <p className="text-sm text-slate-400">{restaurant.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
              {onDutyDrivers.length}/{branchDrivers.length} On Duty
            </Badge>
            <Button
              onClick={() => setShowAddDriver(true)}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="button-add-driver"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {rejectedDeliveries.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Rejected Deliveries
            </h2>
            {rejectedDeliveries.map(order => {
              const delivery = (order as any).delivery;
              return (
                <div
                  key={order.id}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
                  data-testid={`rejected-alert-${order.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-400">
                        Order #{String(order.orderNumber).padStart(3, '0')} - DECLINED
                      </p>
                      <p className="text-sm text-red-300">
                        Driver {delivery?.driverName} rejected this delivery
                        {delivery?.driverNotes && ` - "${delivery.driverNotes}"`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Customer: {order.customerName} • {order.address}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500 text-amber-500 hover:bg-amber-500/20"
                      onClick={() => setAssigningDriverToOrder(order.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Reassign
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {returnedDeliveries.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Returned Deliveries
            </h2>
            {returnedDeliveries.map(order => {
              const delivery = (order as any).delivery;
              const { reason, details } = parseReturnReason(delivery?.driverNotes);
              return (
                <div
                  key={order.id}
                  className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4"
                  data-testid={`returned-alert-${order.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-orange-400">
                        Order #{String(order.orderNumber).padStart(3, '0')} - RETURNED
                      </p>
                      <p className="text-sm text-orange-300">
                        Driver {delivery?.driverName} returned this delivery
                      </p>
                      <p className="text-sm text-orange-200">Reason: {reason}{details && ` - "${details}"`}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Customer: {order.customerName} • {order.address}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500 text-amber-500 hover:bg-amber-500/20"
                      onClick={() => setAssigningDriverToOrder(order.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Active Deliveries Card - Orders ready for driver assignment */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Truck className="h-5 w-5 text-amber-400" />
              Active Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const deliveryOrders = orders.filter(o => {
                if (o.type !== 'delivery' || o.isArchived) return false;
                const delivery = (o as any).delivery;
                
                if (!delivery) {
                  return o.status === 'ready' || o.status === 'completed';
                }
                
                if (delivery.deliveryStatus === 'completed') return false;
                if (delivery.deliveryStatus === 'rejected') return false;
                if (delivery.deliveryStatus === 'returned') return false;
                return true;
              });
              
              if (deliveryOrders.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-400">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No ready delivery orders</p>
                    <p className="text-sm">Orders marked "Ready" will appear here for driver assignment</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-3">
                  {deliveryOrders.map(order => {
                    const delivery = (order as any).delivery;
                    // hasDriver means a specific driver is assigned and has accepted
                    const hasDriver = delivery && 
                      delivery.driverId && 
                      delivery.deliveryStatus !== 'rejected' && 
                      delivery.deliveryStatus !== 'returned' &&
                      delivery.deliveryStatus !== 'unassigned';
                    const isNotified = notifiedOrders.has(order.id) || delivery?.deliveryStatus === 'unassigned';
                    
                    return (
                      <div 
                        key={order.id}
                        className={`p-4 rounded-lg border ${
                          delivery?.deliveryStatus === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30' :
                          delivery?.deliveryStatus === 'picked_up' ? 'bg-blue-500/10 border-blue-500/30' :
                          delivery?.deliveryStatus === 'delivering' ? 'bg-purple-500/10 border-purple-500/30' :
                          delivery?.deliveryStatus === 'unassigned' ? 'bg-yellow-500/10 border-yellow-500/30' :
                          hasDriver ? 'bg-cyan-500/10 border-cyan-500/30' :
                          'bg-amber-500/10 border-amber-500/30'
                        }`}
                        data-testid={`delivery-order-${order.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-white">
                              Order #{String(order.orderNumber).padStart(3, '0')}
                              {delivery?.deliveryStatus === 'unassigned' && (
                                <Badge className="ml-2 bg-yellow-500">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Waiting for Driver
                                </Badge>
                              )}
                              {hasDriver && (
                                <Badge className={`ml-2 ${
                                  delivery.deliveryStatus === 'accepted' ? 'bg-emerald-500' :
                                  delivery.deliveryStatus === 'picked_up' ? 'bg-blue-500' :
                                  delivery.deliveryStatus === 'delivering' ? 'bg-purple-500' :
                                  'bg-cyan-500'
                                }`}>
                                  {delivery.deliveryStatus === 'accepted' ? 'Accepted' :
                                   delivery.deliveryStatus === 'picked_up' ? 'Picked Up' :
                                   delivery.deliveryStatus === 'delivering' ? 'On The Way' :
                                   'Assigned'}
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-slate-400">{order.customerName}</p>
                            {order.address && (
                              <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span>{order.address}</span>
                              </div>
                            )}
                            {hasDriver && delivery.driverName && (
                              <p className="text-sm text-emerald-400 mt-1">
                                <Car className="h-3 w-3 inline mr-1" />
                                Driver: {delivery.driverName}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{currencySymbol}{Number(order.total).toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Driver Assignment UI - show if no driver or broadcasted but waiting */}
                        {(!hasDriver || delivery?.deliveryStatus === 'unassigned') && (
                          <>
                            {assigningDriverToOrder === order.id ? (
                              <div className="space-y-3 p-3 bg-slate-700/50 border border-slate-600 rounded-lg mt-3">
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-400">Delivery Offer ({currencySymbol})</label>
                                  <Input
                                    type="number"
                                    step="0.50"
                                    min="0"
                                    placeholder="e.g. 5.00"
                                    value={deliveryOfferAmount}
                                    onChange={(e) => setDeliveryOfferAmount(e.target.value)}
                                    className="h-9 bg-slate-800 border-slate-600"
                                    data-testid={`input-offer-${order.id}`}
                                  />
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-400">Payment</label>
                                  <Select value={deliveryPaymentInstruction} onValueChange={setDeliveryPaymentInstruction}>
                                    <SelectTrigger className="h-9 bg-slate-800 border-slate-600" data-testid={`select-payment-${order.id}`}>
                                      <SelectValue placeholder="Select payment type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="customer_paid_online">Paid Online</SelectItem>
                                      <SelectItem value="collect_cash">Collect Cash</SelectItem>
                                      <SelectItem value="branch_pays_driver">Branch Will Pay</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-xs text-slate-400">Notes (optional)</label>
                                  <Textarea
                                    placeholder="Special instructions..."
                                    value={deliveryDriverNotes}
                                    onChange={(e) => setDeliveryDriverNotes(e.target.value)}
                                    className="bg-slate-800 border-slate-600"
                                    data-testid={`input-notes-${order.id}`}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-slate-400">Assign to Driver</label>
                                  <Select onValueChange={(driverId) => {
                                    assignDriverMutation.mutate({
                                      orderId: order.id,
                                      driverId: parseInt(driverId),
                                      offerAmount: deliveryOfferAmount,
                                      paymentInstruction: deliveryPaymentInstruction,
                                      notes: deliveryDriverNotes,
                                    });
                                  }}>
                                    <SelectTrigger className="h-9 bg-slate-800 border-slate-600" data-testid={`select-driver-${order.id}`}>
                                      <SelectValue placeholder="Select driver..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {onDutyDrivers.map((driver: BranchDriver) => (
                                        <SelectItem key={driver.id} value={String(driver.id)}>
                                          {driver.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-slate-600"
                                    onClick={() => setAssigningDriverToOrder(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                                    onClick={() => {
                                      assignDriverMutation.mutate({
                                        orderId: order.id,
                                        broadcastToAll: true,
                                        offerAmount: deliveryOfferAmount,
                                        paymentInstruction: deliveryPaymentInstruction,
                                        notes: deliveryDriverNotes,
                                      });
                                    }}
                                    disabled={assignDriverMutation.isPending || onDutyDrivers.length === 0}
                                    data-testid={`btn-notify-all-${order.id}`}
                                  >
                                    <Bell className="h-4 w-4 mr-1" />
                                    Notify All Drivers
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-amber-500 text-amber-500 hover:bg-amber-500/20"
                                  onClick={() => setAssigningDriverToOrder(order.id)}
                                  data-testid={`btn-assign-${order.id}`}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Assign Driver
                                </Button>
                                {isNotified && (
                                  <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                                    <Bell className="h-3 w-3 mr-1" />
                                    Notified
                                  </Badge>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Car className="h-5 w-5 text-cyan-400" />
              Branch Drivers ({onDutyDrivers.length}/{branchDrivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {branchDrivers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Car className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No drivers for this branch</p>
                <p className="text-sm">Add drivers to enable delivery assignments</p>
                <Button
                  onClick={() => setShowAddDriver(true)}
                  className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Driver
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branchDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={`p-4 rounded-xl border transition-all ${
                      driver.isOnDuty
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-700/30 border-slate-600'
                    }`}
                    data-testid={`driver-card-${driver.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          driver.isOnDuty ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}>
                          <Car className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{driver.name}</p>
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Phone className="h-3 w-3" />
                            {driver.phone}
                          </div>
                          {driver.vehicleType && (
                            <p className="text-xs text-slate-500 capitalize">
                              {driver.vehicleType} {driver.vehiclePlate && `• ${driver.vehiclePlate}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={driver.isOnDuty ? 'bg-emerald-500' : 'bg-slate-600'}>
                        {driver.isOnDuty ? 'On Duty' : 'Off Duty'}
                      </Badge>
                    </div>
                    {driver.shiftStartTime && driver.isOnDuty && (
                      <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Started: {new Date(driver.shiftStartTime).toLocaleTimeString()}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex-1 ${driver.isOnDuty ? 'border-red-500 text-red-400' : 'border-emerald-500 text-emerald-400'}`}
                          onClick={() => toggleDutyMutation.mutate({ driverId: driver.id, isOnDuty: !driver.isOnDuty })}
                        >
                          {driver.isOnDuty ? 'End Shift' : 'Start Shift'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={() => {
                            if (confirm(`Remove ${driver.name} from this branch?`)) {
                              deleteDriverMutation.mutate(driver.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium"
                          onClick={() => setSelectedDriverId(driver.id)}
                          data-testid={`button-view-earnings-${driver.id}`}
                        >
                          <Wallet className="h-4 w-4 mr-1" />
                          Earnings
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium"
                          onClick={() => {
                            setSelectedDriverId(driver.id);
                            setShowPaymentForm(true);
                          }}
                          data-testid={`button-pay-driver-${driver.id}`}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Driver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver Earnings & Payments Section */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-amber-400" />
              Driver Earnings & Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {branchDrivers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Add drivers to view earnings</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Driver Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {branchDrivers.map((driver: BranchDriver) => (
                    <Button
                      key={driver.id}
                      variant={selectedDriverId === driver.id ? "default" : "outline"}
                      className={`justify-start ${
                        selectedDriverId === driver.id
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      }`}
                      onClick={() => setSelectedDriverId(driver.id)}
                      data-testid={`select-driver-earnings-${driver.id}`}
                    >
                      <Car className="h-4 w-4 mr-2" />
                      {driver.name}
                    </Button>
                  ))}
                </div>

                {selectedDriverId && selectedDriver && (
                  <>
                    {loadingEarnings ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                      </div>
                    ) : driverEarnings ? (
                      <div className="space-y-6">
                        {/* Driver Info Header */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Car className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{selectedDriver.name}</h3>
                            <p className="text-sm text-amber-300">
                              {driverEarnings.paymentType === 'salary_plus_commission' 
                                ? `${currencySymbol}${driverEarnings.agreedDeliveryCharge || '3'} per delivery`
                                : driverEarnings.paymentType}
                            </p>
                            <p className="text-xs text-slate-400">{selectedDriver.phone}</p>
                          </div>
                        </div>

                        {/* Earnings Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                          <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl border border-cyan-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-cyan-400" />
                              <span className="text-xs text-cyan-300 font-medium">TODAY</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{currencySymbol}{driverEarnings.earnings.today.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">{driverEarnings.deliveries.today} deliveries</p>
                          </div>

                          <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs text-emerald-300 font-medium">THIS WEEK</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{currencySymbol}{driverEarnings.earnings.week.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">{driverEarnings.deliveries.week} deliveries</p>
                          </div>

                          <div className="p-4 bg-gradient-to-br from-slate-500/20 to-slate-600/10 rounded-xl border border-slate-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span className="text-xs text-slate-300 font-medium">LAST WEEK</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{currencySymbol}{driverEarnings.earnings.lastWeek.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">{driverEarnings.deliveries.lastWeek} deliveries</p>
                          </div>

                          <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-purple-400" />
                              <span className="text-xs text-purple-300 font-medium">THIS MONTH</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{currencySymbol}{driverEarnings.earnings.month.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">{driverEarnings.deliveries.month} deliveries</p>
                          </div>

                          <div className="p-4 bg-gradient-to-br from-pink-500/20 to-pink-600/10 rounded-xl border border-pink-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-pink-400" />
                              <span className="text-xs text-pink-300 font-medium">LAST MONTH</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{currencySymbol}{driverEarnings.earnings.lastMonth.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">{driverEarnings.deliveries.lastMonth} deliveries</p>
                          </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-5 bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-xl border border-amber-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-5 w-5 text-amber-400" />
                              <span className="text-sm text-amber-300 font-medium">TOTAL EARNED</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{currencySymbol}{driverEarnings.earnings.total.toFixed(2)}</p>
                            <p className="text-sm text-slate-400">{driverEarnings.deliveries.total} total deliveries</p>
                          </div>

                          <div className="p-5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-5 w-5 text-emerald-400" />
                              <span className="text-sm text-emerald-300 font-medium">PAID</span>
                            </div>
                            <p className="text-3xl font-bold text-emerald-400">{currencySymbol}{driverEarnings.payments.received.toFixed(2)}</p>
                            <p className="text-sm text-slate-400">{driverEarnings.payments.recentPayments.length} payments made</p>
                          </div>

                          <div className="p-5 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl border border-red-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="h-5 w-5 text-red-400" />
                              <span className="text-sm text-red-300 font-medium">UNPAID BALANCE</span>
                            </div>
                            <p className="text-3xl font-bold text-red-400">{currencySymbol}{Math.max(0, driverEarnings.payments.due).toFixed(2)}</p>
                            <Button
                              size="sm"
                              className="mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                              onClick={() => {
                                setPaymentAmount(Math.max(0, driverEarnings.payments.due).toFixed(2));
                                setShowPaymentForm(true);
                              }}
                              disabled={driverEarnings.payments.due <= 0}
                              data-testid="button-record-payment"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Record Payment
                            </Button>
                          </div>
                        </div>

                        {/* Recent Payments */}
                        {driverEarnings.payments.recentPayments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-slate-300 mb-3">Payment History for {selectedDriver.name}</h4>
                            <div className="space-y-2">
                              {driverEarnings.payments.recentPayments.map((payment: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                                  <div>
                                    <p className="text-emerald-400 font-bold text-lg">{currencySymbol}{Number(payment.amount).toFixed(2)}</p>
                                    <p className="text-sm text-white font-medium">{selectedDriver.name}</p>
                                    <p className="text-xs text-slate-400">
                                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-GB', { 
                                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                      }) : 'N/A'}
                                      {payment.notes && ` • ${payment.notes}`}
                                    </p>
                                  </div>
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p>No earnings data available</p>
                      </div>
                    )}
                  </>
                )}

                {!selectedDriverId && (
                  <div className="text-center py-8 text-slate-400">
                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Select a driver to view their earnings</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Record Payment Modal */}
        {showPaymentForm && selectedDriverId && selectedDriver && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-slate-700 bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  Record Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Driver Info */}
                <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedDriver.name}</h3>
                      <p className="text-xs text-slate-400">{selectedDriver.phone}</p>
                    </div>
                  </div>
                </div>

                {loadingEarnings ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
                    <span className="ml-2 text-slate-400">Loading earnings...</span>
                  </div>
                ) : driverEarnings ? (
                  <>
                    {/* Balance Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <p className="text-xs text-amber-300">Total Earned</p>
                        <p className="text-lg font-bold text-white">{currencySymbol}{driverEarnings.earnings.total.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-xs text-red-300">Unpaid Balance</p>
                        <p className="text-lg font-bold text-red-400">{currencySymbol}{Math.max(0, driverEarnings.payments.due).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Show remaining after payment */}
                    {paymentAmount && parseFloat(paymentAmount) > 0 && (
                      <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400">After this payment:</p>
                        <p className="text-sm">
                          <span className="text-emerald-400 font-bold">Paid:</span>{' '}
                          <span className="text-white">{currencySymbol}{(driverEarnings.payments.received + parseFloat(paymentAmount)).toFixed(2)}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-red-400 font-bold">Remaining:</span>{' '}
                          <span className="text-white">{currencySymbol}{Math.max(0, driverEarnings.payments.due - parseFloat(paymentAmount)).toFixed(2)}</span>
                        </p>
                      </div>
                    )}
                  </>
                ) : null}

                <div>
                  <Label className="text-cyan-300 font-medium">Payment Amount ({currencySymbol})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount to pay..."
                    className="bg-slate-700 border-slate-600 text-white text-xl font-bold mt-1 h-12"
                    data-testid="input-payment-amount"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Enter how much you're paying {selectedDriver.name}
                  </p>
                </div>

                <div>
                  <Label className="text-amber-300">Notes (optional)</Label>
                  <Textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g., Cash payment, Bank transfer..."
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    data-testid="input-payment-notes"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-12 text-lg"
                    onClick={() => {
                      const amount = parseFloat(paymentAmount);
                      if (amount > 0) {
                        recordPaymentMutation.mutate({
                          driverId: selectedDriverId,
                          amount,
                          notes: paymentNotes,
                        });
                      }
                    }}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || recordPaymentMutation.isPending}
                    data-testid="button-confirm-payment"
                  >
                    {recordPaymentMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    Pay {currencySymbol}{paymentAmount || '0.00'}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 h-12"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentAmount("");
                      setPaymentNotes("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {assigningDriverToOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Assign Driver</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {onDutyDrivers.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No drivers currently on duty</p>
                ) : (
                  onDutyDrivers.map(driver => (
                    <Button
                      key={driver.id}
                      variant="outline"
                      className="w-full justify-start border-slate-600 text-white hover:bg-slate-700"
                      onClick={() => assignDriverMutation.mutate({
                        orderId: assigningDriverToOrder,
                        driverId: driver.id
                      })}
                    >
                      <Car className="h-4 w-4 mr-2 text-emerald-400" />
                      {driver.name}
                    </Button>
                  ))
                )}
                <Button
                  variant="ghost"
                  className="w-full text-slate-400"
                  onClick={() => setAssigningDriverToOrder(null)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showAddDriver && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-md border-slate-700 bg-slate-800 my-4 max-h-[90vh] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-white">Add New Driver</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1">
                <AddDriverForm
                  onSubmit={(data) => createDriverMutation.mutate(data)}
                  onCancel={() => setShowAddDriver(false)}
                  isPending={createDriverMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
