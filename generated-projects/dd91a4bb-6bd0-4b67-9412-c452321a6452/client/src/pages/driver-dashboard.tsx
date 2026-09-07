import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Car, LogOut, MapPin, Phone, Clock, Navigation, Package, CheckCircle, XCircle, Loader2, AlertTriangle, RefreshCw, Coins, UtensilsCrossed, RotateCcw, Bell, BellRing, Info, ChevronDown, ChevronUp, FileText, Check, Square, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import useSound from "use-sound";
import type { Order, OrderItem, Driver, Restaurant } from "@shared/schema";
import { getCurrencySymbol } from "@shared/schema";

const ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/1569/1569-preview.mp3";

interface DeliveryOrder {
  id: string;
  orderId: string;
  driverId: string;
  deliveryStatus: "unassigned" | "assigned" | "accepted" | "picked_up" | "delivering" | "completed" | "rejected" | "returned";
  offerAmount?: string | null;
  paymentInstruction?: "customer_paid_online" | "collect_cash" | "branch_pays_driver" | null;
  driverNotes?: string | null;
  assignedAt: string;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  order: Order & { items: OrderItem[] };
  restaurant: { name: string; address?: string | null };
}

interface DriverEarnings {
  paymentType: string;
  salaryPeriod: string;
  salaryAmount: string;
  agreedDeliveryCharge: string;
  mileageRates: {
    rate1: string;
    rate2: string;
    rate3: string;
    range1Max: string;
    range2Max: string;
    range3Max: string;
  };
  deliveries: {
    today: number;
    week: number;
    month: number;
    year: number;
    total: number;
    recentOrders: { orderNumber: number; deliveredAt: string }[];
  };
  earnings: {
    today: number;
    week: number;
    month: number;
    year: number;
    total: number;
  };
  payments: {
    received: number;
    due: number;
    recentPayments: { id: string; amount: string; paidAt: string; paymentType: string }[];
  };
}

export default function DriverDashboard() {
  const [, setLocation] = useLocation();
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Item verification checklist per order: { orderId: Set<itemIndex> }
  // Persist to localStorage so it survives refreshes
  const [verifiedItems, setVerifiedItems] = useState<Record<string, Set<number>>>(() => {
    try {
      const saved = localStorage.getItem('driver_verified_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert arrays back to Sets
        const result: Record<string, Set<number>> = {};
        for (const [key, arr] of Object.entries(parsed)) {
          result[key] = new Set(arr as number[]);
        }
        return result;
      }
    } catch {}
    return {};
  });
  
  // Save to localStorage when verifiedItems changes
  useEffect(() => {
    try {
      const toSave: Record<string, number[]> = {};
      for (const [key, set] of Object.entries(verifiedItems)) {
        toSave[key] = Array.from(set);
      }
      localStorage.setItem('driver_verified_items', JSON.stringify(toSave));
    } catch {}
  }, [verifiedItems]);
  const [soundUnlocked, setSoundUnlocked] = useState(false);  // For mobile autoplay unlock
  const [isRinging, setIsRinging] = useState(false);
  const [alarmFlash, setAlarmFlash] = useState(false);
  const [acknowledgedDeliveries, setAcknowledgedDeliveries] = useState<Set<string>>(new Set());
  const [showPolicy, setShowPolicy] = useState(false);

  // iOS-compatible audio using Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);

  // Load audio buffer once
  useEffect(() => {
    const loadAudio = async () => {
      try {
        const response = await fetch(ALARM_URL);
        const arrayBuffer = await response.arrayBuffer();
        // Store for later use when AudioContext is created
        (window as any).__alarmAudioData = arrayBuffer;
      } catch (e) {
        console.log("Failed to preload alarm audio");
      }
    };
    loadAudio();
  }, []);

  // iOS-compatible play function
  const playAlarmIOS = async () => {
    if (isPlayingRef.current) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume if suspended (iOS suspends by default)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Decode audio buffer if not already done
      if (!audioBufferRef.current && (window as any).__alarmAudioData) {
        const buffer = await ctx.decodeAudioData((window as any).__alarmAudioData.slice(0));
        audioBufferRef.current = buffer;
      }
      
      if (!audioBufferRef.current) {
        console.log("No audio buffer available");
        return;
      }
      
      // Create and play source
      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.loop = true;
      source.connect(ctx.destination);
      source.start(0);
      
      audioSourceRef.current = source;
      isPlayingRef.current = true;
    } catch (e) {
      console.log("iOS audio play error:", e);
    }
  };

  const stopAlarmIOS = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    isPlayingRef.current = false;
  };

  // Fallback: also use useSound for non-iOS
  const [play, { stop }] = useSound(ALARM_URL, {
    loop: true,
    volume: 1,
    interrupt: true,
    onplayerror: () => {
      console.log("Sound blocked by browser - trying iOS method");
      playAlarmIOS();
    }
  });

  // Combined play/stop that tries both methods
  const playAlarm = () => {
    play();
    playAlarmIOS();
  };

  const stopAlarm = () => {
    stop();
    stopAlarmIOS();
  };

  // Unlock sound on mobile - user must tap once (critical for iOS)
  const unlockSound = async () => {
    // Create and resume AudioContext on user gesture (required for iOS)
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      await audioContextRef.current.resume();
      
      // Decode audio on user gesture
      if ((window as any).__alarmAudioData && !audioBufferRef.current) {
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(
          (window as any).__alarmAudioData.slice(0)
        );
      }
      
      // Play a brief sound to fully unlock
      if (audioBufferRef.current) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        setTimeout(() => {
          try { source.stop(); } catch(e) {}
        }, 100);
      }
    } catch (e) {
      console.log("iOS audio unlock error:", e);
    }
    
    // Also try useSound method
    play();
    setTimeout(() => stop(), 100);
    
    setSoundUnlocked(true);
    toast({ title: "Sound enabled", description: "You'll hear alarms for new deliveries" });
  };

  const wsRef = useRef<WebSocket | null>(null);
  const driverId = localStorage.getItem("driverId");
  const driverName = localStorage.getItem("driverName");

  useEffect(() => {
    if (!driverId) {
      setLocation("/driver-login");
    }
  }, [driverId, setLocation]);

  const { data: driver } = useQuery<Driver>({
    queryKey: ["/api/drivers", driverId],
    queryFn: async () => {
      const res = await fetch(`/api/drivers/${driverId}`);
      if (!res.ok) throw new Error("Failed to fetch driver");
      return res.json();
    },
    enabled: !!driverId,
  });

  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", driver?.restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${driver?.restaurantId}`);
      if (!res.ok) throw new Error("Failed to fetch restaurant");
      return res.json();
    },
    enabled: !!driver?.restaurantId,
  });

  const { data: branchFeatures } = useQuery({
    queryKey: ["/api/branch-features", driver?.restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/branch-features/${driver?.restaurantId}`);
      if (!res.ok) throw new Error("Failed to fetch branch features");
      return res.json();
    },
    enabled: !!driver?.restaurantId,
  });

  useEffect(() => {
    if (branchFeatures && !branchFeatures.driverApp) {
      toast({
        title: "Driver App Disabled",
        description: "The driver app is not available for your branch. Please contact your manager.",
        variant: "destructive",
      });
      localStorage.removeItem("driverId");
      localStorage.removeItem("driverName");
      localStorage.removeItem("driverPhone");
      setLocation("/driver-login");
    }
  }, [branchFeatures, setLocation]);

  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const { data: deliveries = [], isLoading, refetch } = useQuery<DeliveryOrder[]>({
    queryKey: ["/api/drivers", driverId, "deliveries"],
    queryFn: async () => {
      const res = await fetch(`/api/drivers/${driverId}/deliveries`);
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      return res.json();
    },
    enabled: !!driverId,
    refetchInterval: 10000,
  });

  const { data: earnings } = useQuery<DriverEarnings>({
    queryKey: ["/api/drivers", driverId, "earnings"],
    queryFn: async () => {
      const res = await fetch(`/api/drivers/${driverId}/earnings`);
      if (!res.ok) throw new Error("Failed to fetch earnings");
      return res.json();
    },
    enabled: !!driverId,
    refetchInterval: 60000, // Refresh every minute
  });

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!driverId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?driverId=${driverId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Driver WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_DELIVERY_ASSIGNED" || data.type === "NEW_DELIVERY_AVAILABLE") {
          refetch(); // Refresh deliveries - alarm will be handled by the effect below
          toast({
            title: data.type === "NEW_DELIVERY_AVAILABLE" ? "New Delivery Available!" : "New Delivery Assigned!",
            description: `Order #${data.orderNumber} - ${data.address || 'Ready for pickup'}`,
            duration: 10000,
          });
        } else if (data.type === "ORDER_TAKEN") {
          // Another driver accepted this order - stop ringing and refresh
          refetch();
          if (data.acceptedByDriverId !== driverId) {
            toast({
              title: "Order Taken",
              description: `Order #${data.orderNumber} was accepted by another driver`,
              duration: 5000,
            });
          }
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      console.log("Driver WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [driverId, refetch]);

  // Push Notification subscription for background/sleep mode notifications
  const [pushStatus, setPushStatus] = useState<'idle' | 'subscribed' | 'denied' | 'unsupported'>('idle');
  
  useEffect(() => {
    if (!driverId) return;
    
    async function subscribeToPush() {
      // Check if push notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushStatus('unsupported');
        return;
      }
      
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
        
        // Check for existing subscription first
        let subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          // Already subscribed - just update server with current subscription
          const res = await fetch(`/api/drivers/${driverId}/push-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription.toJSON()),
          });
          if (res.ok) {
            setPushStatus('subscribed');
            console.log('Push notifications already enabled');
          }
          return;
        }
        
        // Check notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setPushStatus('denied');
          return;
        }
        
        // Get VAPID public key
        const vapidRes = await fetch('/api/push/vapid-public-key');
        if (!vapidRes.ok) {
          console.warn('Push notifications not configured on server');
          return;
        }
        const { publicKey } = await vapidRes.json();
        
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        
        // Save subscription to server
        const res = await fetch(`/api/drivers/${driverId}/push-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
        
        if (res.ok) {
          setPushStatus('subscribed');
          console.log('Push notifications enabled');
        }
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
      }
    }
    
    subscribeToPush();
  }, [driverId]);

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Alarm effect - plays when there are unacknowledged assigned deliveries (same as branch dashboard)
  useEffect(() => {
    const assignedDeliveryIds = deliveries
      .filter(d => d.deliveryStatus === "assigned")
      .map(d => d.id);
    const unacknowledgedAssigned = assignedDeliveryIds.filter(id => !acknowledgedDeliveries.has(id));
    const hasUnacknowledgedDeliveries = unacknowledgedAssigned.length > 0;
    
    if (hasUnacknowledgedDeliveries && soundEnabled && !isRinging) {
      playAlarm();
      setIsRinging(true);
      setAlarmFlash(true);
    } else if ((!hasUnacknowledgedDeliveries || !soundEnabled) && isRinging) {
      stopAlarm();
      setIsRinging(false);
      setAlarmFlash(false);
    }
  }, [deliveries, soundEnabled, isRinging, acknowledgedDeliveries]);

  // Flash effect for alarm
  useEffect(() => {
    if (!alarmFlash) return;
    const interval = setInterval(() => {
      document.body.classList.toggle("alarm-flash-driver");
    }, 500);
    return () => {
      clearInterval(interval);
      document.body.classList.remove("alarm-flash-driver");
    };
  }, [alarmFlash]);

  // Stop alarm and acknowledge deliveries
  const handleStopAlarm = () => {
    stopAlarm();
    setIsRinging(false);
    setAlarmFlash(false);
    
    const currentAssignedIds = deliveries.filter(d => d.deliveryStatus === "assigned").map(d => d.id);
    setAcknowledgedDeliveries(prev => {
      const newSet = new Set(prev);
      currentAssignedIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const toggleDutyMutation = useMutation({
    mutationFn: async (onDuty: boolean) => {
      const res = await fetch(`/api/drivers/${driverId}/duty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnDuty: onDuty }),
      });
      if (!res.ok) throw new Error("Failed to update duty status");
      return res.json();
    },
    onSuccess: (data) => {
      setIsOnDuty(data.isOnDuty);
      queryClient.invalidateQueries({ queryKey: ["/api/drivers", driverId] });
      toast({
        title: data.isOnDuty ? "You're On Duty" : "You're Off Duty",
        description: data.isOnDuty ? "You can now receive delivery assignments" : "You won't receive new assignments",
      });
    },
  });

  const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, driverNotes, location }: { orderId: string; status: string; driverNotes?: string; location?: { lat: number; lng: number } | null }) => {
      const res = await fetch(`/api/orders/${orderId}/delivery-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, driverNotes, driverId, location }),
      });
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Order already accepted by another driver");
        }
        throw new Error("Failed to update delivery status");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers", driverId, "deliveries"] });
      
      // If driver accepted the order, send WebSocket message and stop alarm
      if (variables.status === "accepted") {
        handleStopAlarm();
        
        // Send message to branch dashboard
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "driver_accepted",
            orderId: variables.orderId,
            driverName: driverName,
          }));
        }
        
        toast({ 
          title: "Driver has accepted the order.",
          description: "Head to the restaurant for pickup"
        });
      } else {
        toast({ title: "Status updated" });
      }
    },
    onError: (error: Error) => {
      if (error.message.includes("already accepted")) {
        refetch(); // Refresh to remove the taken order
        toast({
          title: "Order Taken",
          description: "Another driver has already accepted this order.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update status. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const returnDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, reason, notes }: { orderId: string; reason: string; notes: string }) => {
      const res = await fetch(`/api/orders/${orderId}/delivery-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "returned", 
          driverNotes: `Return Reason: ${reason}${notes ? ` - ${notes}` : ''}` 
        }),
      });
      if (!res.ok) throw new Error("Failed to return delivery");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers", driverId, "deliveries"] });
      setShowReturnDialog(null);
      setReturnReason("");
      setReturnNotes("");
      toast({ title: "Delivery returned", description: "Manager has been notified" });
    },
  });

  const rejectDeliveryMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const res = await fetch(`/api/orders/${orderId}/delivery-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed to reject delivery");
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers", driverId, "deliveries"] });
      handleStopAlarm();
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "driver_rejected",
          orderId: variables.orderId,
          driverName: driverName,
        }));
      }
      
      toast({ 
        title: "Delivery declined", 
        description: "Manager has been notified",
        variant: "destructive"
      });
    },
  });


  const updateLocation = useCallback(async () => {
    if (!driverId) return;
    
    setIsUpdatingLocation(true);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsUpdatingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setLocationError(null);

        try {
          await fetch(`/api/drivers/${driverId}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              lat: latitude.toString(), 
              lng: longitude.toString() 
            }),
          });
        } catch (error) {
          console.error("Failed to update location:", error);
        }
        
        setIsUpdatingLocation(false);
      },
      (error) => {
        setLocationError(error.message);
        setIsUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [driverId]);

  useEffect(() => {
    updateLocation();
    const interval = setInterval(updateLocation, 60000);
    return () => clearInterval(interval);
  }, [updateLocation]);

  useEffect(() => {
    if (driver) {
      setIsOnDuty(driver.isOnDuty || false);
    }
  }, [driver]);

  const handleLogout = () => {
    localStorage.removeItem("driverId");
    localStorage.removeItem("driverName");
    localStorage.removeItem("driverPhone");
    setLocation("/driver-login");
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unassigned": return "bg-slate-500";
      case "assigned": return "bg-amber-500";
      case "accepted": return "bg-blue-500";
      case "picked_up": return "bg-purple-500";
      case "delivering": return "bg-orange-500";
      case "completed": return "bg-emerald-500";
      case "rejected": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case "assigned": return { label: "Accept Delivery", nextStatus: "accepted" };
      case "accepted": return { label: "Picked Up", nextStatus: "picked_up" };
      case "picked_up": return { label: "Start Delivery", nextStatus: "delivering" };
      case "delivering": return { label: "Mark Delivered", nextStatus: "completed" };
      default: return null;
    }
  };

  // Item verification helpers
  const toggleItemVerified = (orderId: string, itemIndex: number) => {
    setVerifiedItems(prev => {
      const orderItems = new Set(prev[orderId] || []);
      if (orderItems.has(itemIndex)) {
        orderItems.delete(itemIndex);
      } else {
        orderItems.add(itemIndex);
      }
      return { ...prev, [orderId]: orderItems };
    });
  };

  const areAllItemsVerified = (orderId: string, totalItems: number) => {
    const verified = verifiedItems[orderId];
    if (!verified) return false;
    return verified.size >= totalItems;
  };

  const verifyAllItems = (orderId: string, totalItems: number) => {
    const allIndexes = new Set(Array.from({ length: totalItems }, (_, i) => i));
    setVerifiedItems(prev => ({ ...prev, [orderId]: allIndexes }));
  };

  const activeDeliveries = deliveries.filter(d => d.deliveryStatus !== "completed" && d.deliveryStatus !== "rejected");
  const completedToday = deliveries.filter(d => {
    if (d.deliveryStatus !== "completed" || !d.deliveredAt) return false;
    const delivered = new Date(d.deliveredAt);
    const today = new Date();
    return delivered.toDateString() === today.toDateString();
  });

  if (!driverId) {
    return null;
  }

  if (driver?.restaurantId && branchFeatures === undefined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (branchFeatures && !branchFeatures.driverApp) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOnDuty ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{driverName}</p>
                <div className="flex items-center gap-2 text-sm">
                  {isOnDuty ? (
                    <>
                      <span className="text-emerald-400">On Duty</span>
                      {driver?.shiftStartTime && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(driver.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-500">Off Duty</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isRinging && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleStopAlarm}
                  className="relative text-red-500 hover:text-red-400 animate-pulse"
                  data-testid="button-header-alarm"
                >
                  <BellRing className="h-6 w-6 animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={soundEnabled ? "text-emerald-400 hover:text-emerald-300" : "text-slate-500 hover:text-slate-300"}
                data-testid="button-toggle-sound"
                title={soundEnabled ? "Sound On" : "Sound Off"}
              >
                {soundEnabled ? <Bell className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </Button>
              {/* Push notification status indicator */}
              <div 
                className={`w-2 h-2 rounded-full ${
                  pushStatus === 'subscribed' ? 'bg-emerald-400' : 
                  pushStatus === 'denied' ? 'bg-red-400' : 
                  pushStatus === 'unsupported' ? 'bg-slate-500' : 'bg-amber-400'
                }`}
                title={
                  pushStatus === 'subscribed' ? 'Push notifications enabled' :
                  pushStatus === 'denied' ? 'Push notifications blocked' :
                  pushStatus === 'unsupported' ? 'Push not supported' : 'Setting up...'
                }
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={isOnDuty}
                  onCheckedChange={(checked) => toggleDutyMutation.mutate(checked)}
                  disabled={toggleDutyMutation.isPending}
                  data-testid="switch-duty-status"
                />
                <Label className="text-sm text-slate-300">On Duty</Label>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Salary/Commission Info */}
          {driver && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-lg px-4 py-2">
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-amber-400" />
                  <div>
                    {driver.paymentType === "salary" ? (
                      <>
                        <p className="text-sm font-medium text-white">Salary Agreed</p>
                        <p className="text-xs text-amber-300/70">{driver.salaryPeriod === "weekly" ? "Weekly" : "Monthly"} payment</p>
                      </>
                    ) : driver.paymentType === "salary_plus_commission" ? (
                      <>
                        <p className="text-sm font-medium text-white">Salary + Commission</p>
                        <p className="text-xs text-amber-300/70">{completedToday.length} deliveries today</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-white">Commission (Today)</p>
                        <p className="text-xs text-amber-300/70">{completedToday.length} deliveries completed</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {driver.paymentType === "salary" ? (
                    <>
                      <p className="text-xl font-bold text-emerald-400">
                        {currencySymbol}{Number(driver.salaryAmount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">per {driver.salaryPeriod === "weekly" ? "week" : "month"}</p>
                    </>
                  ) : driver.paymentType === "salary_plus_commission" ? (
                    <>
                      <p className="text-xl font-bold text-emerald-400">
                        {currencySymbol}{Number(driver.salaryAmount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">+ {currencySymbol}{Number(driver.agreedDeliveryCharge || 0).toFixed(2)}/delivery</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-emerald-400">
                        {currencySymbol}{(completedToday.length * Number(driver.mileageRate1 || 0.50)).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">estimated today</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isRinging && (
          <Card className="bg-red-500/20 border-red-500/50 animate-pulse">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5 text-red-400 animate-bounce" />
                  <div>
                    <p className="text-sm font-medium text-red-200">New Delivery Assigned!</p>
                    <p className="text-xs text-red-300/70">Tap to acknowledge</p>
                  </div>
                </div>
                <Button 
                  onClick={handleStopAlarm}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  size="sm"
                  data-testid="button-acknowledge-alarm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Got it
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {locationError && (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-200">Location access required</p>
                  <p className="text-xs text-amber-300/70">{locationError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="space-y-4">
          {/* Delivery Statistics Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                Delivery Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-700/50 rounded-lg py-3">
                  <p className="text-2xl font-bold text-white">{earnings?.deliveries?.today ?? completedToday.length}</p>
                  <p className="text-xs text-slate-400">Today</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg py-3">
                  <p className="text-2xl font-bold text-white">{earnings?.deliveries?.week ?? 0}</p>
                  <p className="text-xs text-slate-400">This Week</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg py-3">
                  <p className="text-2xl font-bold text-white">{earnings?.deliveries?.month ?? 0}</p>
                  <p className="text-xs text-slate-400">This Month</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg py-3">
                  <p className="text-2xl font-bold text-blue-400">{earnings?.deliveries?.total ?? 0}</p>
                  <p className="text-xs text-slate-400">All Time</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                <span className="text-sm text-slate-400">Active Now</span>
                <span className="text-lg font-bold text-amber-400">{activeDeliveries.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-400" />
                Earnings
                <Badge variant="outline" className="ml-auto text-xs text-slate-400 border-slate-600">
                  {earnings?.paymentType === 'salary' ? 'Salary' : 
                   earnings?.paymentType === 'salary_plus_commission' ? 'Salary + Commission' : 'Per Delivery'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-500/10 rounded-lg py-3">
                  <p className="text-2xl font-bold text-emerald-400">{currencySymbol}{(earnings?.earnings?.today ?? 0).toFixed(0)}</p>
                  <p className="text-xs text-slate-400">Today</p>
                </div>
                <div className="bg-emerald-500/10 rounded-lg py-3">
                  <p className="text-2xl font-bold text-emerald-400">{currencySymbol}{(earnings?.earnings?.week ?? 0).toFixed(0)}</p>
                  <p className="text-xs text-slate-400">This Week</p>
                </div>
                <div className="bg-emerald-500/10 rounded-lg py-3">
                  <p className="text-2xl font-bold text-emerald-400">{currencySymbol}{(earnings?.earnings?.month ?? 0).toFixed(0)}</p>
                  <p className="text-xs text-slate-400">This Month</p>
                </div>
                <div className="bg-emerald-500/10 rounded-lg py-3">
                  <p className="text-2xl font-bold text-emerald-300">{currencySymbol}{(earnings?.earnings?.total ?? 0).toFixed(0)}</p>
                  <p className="text-xs text-slate-400">All Time</p>
                </div>
              </div>
              {earnings?.paymentType === 'salary' && (
                <div className="mt-3 pt-3 border-t border-slate-700 text-sm text-slate-400">
                  Fixed {earnings.salaryPeriod === 'weekly' ? 'weekly' : 'monthly'} salary: <span className="text-white font-medium">{currencySymbol}{Number(earnings.salaryAmount || 0).toFixed(2)}</span>
                </div>
              )}
              {earnings?.paymentType === 'salary_plus_commission' && (
                <div className="mt-3 pt-3 border-t border-slate-700 text-sm text-slate-400">
                  Base salary + <span className="text-white font-medium">{currencySymbol}{Number(earnings.agreedDeliveryCharge || 0).toFixed(2)}</span> per delivery
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments Received Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-400" />
                  Payments from Branch
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">Received</p>
                  <p className="text-2xl font-bold text-emerald-400">{currencySymbol}{(earnings?.payments?.received ?? 0).toFixed(2)}</p>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">Due</p>
                  <p className="text-2xl font-bold text-amber-400">{currencySymbol}{Math.max(0, (earnings?.payments?.due ?? 0)).toFixed(2)}</p>
                </div>
              </div>
              {earnings?.payments?.recentPayments && earnings.payments.recentPayments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Recent Payments</p>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {earnings.payments.recentPayments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          {new Date(payment.paidAt).toLocaleDateString()}
                        </span>
                        <span className="text-emerald-400 font-medium">+{currencySymbol}{Number(payment.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!earnings?.payments?.recentPayments || earnings.payments.recentPayments.length === 0) && (
                <div className="mt-3 pt-3 border-t border-slate-700 text-center">
                  <p className="text-xs text-slate-500">No payments recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Payment & Responsibility Policy */}
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardHeader className="pb-2">
              <button 
                onClick={() => setShowPolicy(!showPolicy)}
                className="w-full flex items-center justify-between"
                data-testid="button-toggle-policy"
              >
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Driver Payment & Responsibility Policy
                </CardTitle>
                {showPolicy ? (
                  <ChevronUp className="h-4 w-4 text-blue-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-blue-400" />
                )}
              </button>
            </CardHeader>
            {showPolicy && (
              <CardContent className="pt-0">
                <div className="space-y-4 text-sm">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Payment Options
                    </h4>
                    <p className="text-slate-400 mb-2">Your driving earnings may be based on one of the following payment models:</p>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        Fixed Salary
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        Mileage-Based Payment
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        Per-Order Payment
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        Hourly Payment
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                    <h4 className="font-medium text-amber-300 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Driver Responsibilities
                    </h4>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></span>
                        The driver is fully responsible for managing and paying all personal taxes, VAT, wage-related costs, and any legal obligations connected to their income.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></span>
                        The company is not responsible for paying or deducting taxes, salaries, or personal expenses on behalf of the driver.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></span>
                        All earnings received through the platform belong to the driver, and the driver must report and handle them according to local laws.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></span>
                        The driver is responsible for maintaining compliance, accurate tax reporting, and any other financial duties related to their work.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <h4 className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4 text-slate-400" />
                      Management Disclaimer
                    </h4>
                    <ul className="space-y-2 text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        The platform provides only management and operational support.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        The company does not handle employment contracts, wage processing, or tax submissions for drivers.
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Deliveries</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()}
            className="text-slate-400"
            data-testid="button-refresh-deliveries"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            <p className="text-slate-400 mt-2">Loading deliveries...</p>
          </div>
        ) : activeDeliveries.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No active deliveries</p>
              <p className="text-sm text-slate-500 mt-1">
                {isOnDuty ? "New deliveries will appear here when assigned" : "Go on duty to receive deliveries"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map((delivery) => {
              const nextAction = getNextAction(delivery.deliveryStatus);
              const orderTotal = delivery.order.items?.reduce((sum, item) => 
                sum + (Number(item.price) * item.quantity), 0
              ) || 0;

              return (
                <Card key={delivery.id} className="bg-slate-800 border-slate-700 overflow-hidden" data-testid={`delivery-card-${delivery.id}`}>
                  <div className={`h-1 ${getStatusColor(delivery.deliveryStatus)}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">
                          Order #{String(delivery.order.orderNumber).padStart(3, '0')}
                        </CardTitle>
                        <p className="text-sm text-slate-400">{delivery.restaurant.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`${getStatusColor(delivery.deliveryStatus)} text-white capitalize`}>
                          {delivery.deliveryStatus.replace('_', ' ')}
                        </Badge>
                        {/* Offer Amount */}
                        {delivery.offerAmount && (
                          <div className="bg-emerald-500/20 border border-emerald-500/50 px-2 py-1 rounded text-emerald-300 font-bold text-sm">
                            Offer: {currencySymbol}{parseFloat(delivery.offerAmount).toFixed(2)}
                          </div>
                        )}
                        {/* Payment Instruction */}
                        {delivery.paymentInstruction && (
                          <Badge variant="outline" className={`text-xs ${
                            delivery.paymentInstruction === 'collect_cash' 
                              ? 'border-amber-500 text-amber-300 bg-amber-500/10' 
                              : delivery.paymentInstruction === 'customer_paid_online'
                              ? 'border-green-500 text-green-300 bg-green-500/10'
                              : 'border-blue-500 text-blue-300 bg-blue-500/10'
                          }`}>
                            {delivery.paymentInstruction === 'collect_cash' && '💵 Collect Cash'}
                            {delivery.paymentInstruction === 'customer_paid_online' && '✓ Paid Online'}
                            {delivery.paymentInstruction === 'branch_pays_driver' && '🏪 Branch Will Pay'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Manager Instructions */}
                    {delivery.driverNotes && (
                      <div className="mt-2 p-2 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                        <p className="text-xs text-amber-300 font-medium flex items-center gap-1">
                          <Info className="h-3 w-3" /> Manager Instructions:
                        </p>
                        <p className="text-sm text-amber-200">{delivery.driverNotes}</p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {delivery.order.status === "ready" && (delivery.deliveryStatus === "accepted" || delivery.deliveryStatus === "assigned") && (
                      <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg animate-pulse">
                        <UtensilsCrossed className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-300">Order prepared. Ready for driver pickup.</p>
                        </div>
                      </div>
                    )}
                    {delivery.order.address && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
                          <MapPin className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-white text-sm">{delivery.order.address}</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-emerald-400 hover:text-emerald-300"
                              onClick={() => openGoogleMaps(delivery.order.address!)}
                              data-testid={`button-navigate-${delivery.id}`}
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              Open in Google Maps
                            </Button>
                          </div>
                        </div>
                        {/* Embedded Map for delivery location */}
                        <div className="rounded-lg overflow-hidden h-32 border border-slate-600">
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps?q=${encodeURIComponent(delivery.order.address + ', UK')}&output=embed`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Item Checklist - show when accepted/picked_up */}
                    {(delivery.deliveryStatus === "accepted" || delivery.deliveryStatus === "picked_up") && delivery.order.items && delivery.order.items.length > 0 && (
                      <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-slate-300 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Verify Items ({verifiedItems[delivery.orderId]?.size || 0}/{delivery.order.items.length})
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-emerald-400 hover:text-emerald-300"
                            onClick={() => verifyAllItems(delivery.orderId, delivery.order.items.length)}
                          >
                            <CheckSquare className="h-3 w-3 mr-1" />
                            Check All
                          </Button>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {delivery.order.items.map((item, idx) => {
                            const isChecked = verifiedItems[delivery.orderId]?.has(idx) || false;
                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                  isChecked ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-800/50 hover:bg-slate-800'
                                }`}
                                onClick={() => toggleItemVerified(delivery.orderId, idx)}
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                  isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
                                }`}>
                                  {isChecked && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className={`text-sm ${isChecked ? 'text-emerald-300' : 'text-white'}`}>
                                    {item.quantity}x {item.name}
                                  </span>
                                  {item.notes && (
                                    <div className="mt-1 space-y-0.5">
                                      {(() => {
                                        const notes = item.notes;
                                        const parts = notes.split(' | ');
                                        const elements: React.ReactNode[] = [];
                                        
                                        parts.forEach((part, partIdx) => {
                                          if (part.includes('EXTRAS:') || part.includes('EXTRA:')) {
                                            const extrasMatch = part.match(/EXTRAS?:\s*(.+)/i);
                                            if (extrasMatch) {
                                              const toppings = extrasMatch[1].split(',').map(t => t.trim()).filter(t => t);
                                              toppings.forEach((topping, tIdx) => {
                                                elements.push(
                                                  <div
                                                    key={`extra-${partIdx}-${tIdx}`}
                                                    className="text-xs text-emerald-400 flex items-center gap-1"
                                                  >
                                                    <span>🍽️</span>
                                                    <span>{topping}</span>
                                                  </div>
                                                );
                                              });
                                            }
                                          } else if (part.trim()) {
                                            elements.push(
                                              <p key={`desc-${partIdx}`} className="text-xs text-amber-400">
                                                {part.trim()}
                                              </p>
                                            );
                                          }
                                        });
                                        
                                        return elements;
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!areAllItemsVerified(delivery.orderId, delivery.order.items.length) && delivery.deliveryStatus === "accepted" && (
                          <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Check all items before marking as picked up
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>
                          {delivery.order.createdAt ? new Date(delivery.order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Package className="h-4 w-4" />
                        <span>{delivery.order.items?.length || 0} items</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <span className="font-medium text-white">
                        Total: {currencySymbol}{orderTotal.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        {delivery.deliveryStatus !== "assigned" && (
                          <Dialog open={showReturnDialog === delivery.id} onOpenChange={(open) => {
                            if (!open) {
                              setShowReturnDialog(null);
                              setReturnReason("");
                              setReturnNotes("");
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                onClick={() => setShowReturnDialog(delivery.id)}
                                data-testid={`button-return-${delivery.id}`}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Return
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-700 text-white">
                              <DialogHeader>
                                <DialogTitle>Select return delivery reason:</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Select value={returnReason} onValueChange={setReturnReason}>
                                    <SelectTrigger className="bg-slate-700 border-slate-600">
                                      <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600">
                                      <SelectItem value="customer_unavailable">Customer unavailable</SelectItem>
                                      <SelectItem value="order_refused">Order refused</SelectItem>
                                      <SelectItem value="incorrect_address">Incorrect address</SelectItem>
                                      <SelectItem value="food_damaged">Food damaged</SelectItem>
                                      <SelectItem value="other">Other (specify)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {returnReason === "other" && (
                                  <div className="space-y-2">
                                    <Label className="text-slate-200">Please specify</Label>
                                    <Textarea
                                      value={returnNotes}
                                      onChange={(e) => setReturnNotes(e.target.value)}
                                      className="bg-slate-700 border-slate-600"
                                      placeholder="Enter reason..."
                                    />
                                  </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowReturnDialog(null)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => returnDeliveryMutation.mutate({
                                      orderId: delivery.orderId,
                                      reason: returnReason,
                                      notes: returnNotes,
                                    })}
                                    disabled={!returnReason || returnDeliveryMutation.isPending}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                  >
                                    {returnDeliveryMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Confirm Return"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {delivery.deliveryStatus === "assigned" ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => rejectDeliveryMutation.mutate({ orderId: delivery.orderId })}
                              disabled={rejectDeliveryMutation.isPending || updateDeliveryStatusMutation.isPending}
                              variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-500/20"
                              data-testid={`button-reject-${delivery.id}`}
                            >
                              {rejectDeliveryMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={async () => {
                                const location = await getCurrentLocation();
                                updateDeliveryStatusMutation.mutate({
                                  orderId: delivery.orderId,
                                  status: "accepted",
                                  location,
                                });
                              }}
                              disabled={updateDeliveryStatusMutation.isPending || rejectDeliveryMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              data-testid={`button-accept-${delivery.id}`}
                            >
                              {updateDeliveryStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </>
                              )}
                            </Button>
                          </div>
                        ) : nextAction && (
                          <Button
                            onClick={async () => {
                              const location = nextAction.nextStatus === 'delivering' ? await getCurrentLocation() : null;
                              updateDeliveryStatusMutation.mutate({
                                orderId: delivery.orderId,
                                status: nextAction.nextStatus,
                                location,
                              });
                            }}
                            disabled={
                              updateDeliveryStatusMutation.isPending || 
                              (nextAction.nextStatus === "picked_up" && !areAllItemsVerified(delivery.orderId, delivery.order.items?.length || 0))
                            }
                            className={`${
                              nextAction.nextStatus === "picked_up" && !areAllItemsVerified(delivery.orderId, delivery.order.items?.length || 0)
                                ? "bg-slate-600 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                            data-testid={`button-action-${delivery.id}`}
                          >
                            {updateDeliveryStatusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {nextAction.nextStatus === "picked_up" && !areAllItemsVerified(delivery.orderId, delivery.order.items?.length || 0)
                                  ? "Verify All Items First"
                                  : nextAction.label
                                }
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {completedToday.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Completed Today</h3>
            <div className="space-y-2">
              {completedToday.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Order #{String(delivery.order.orderNumber).padStart(3, '0')}
                    </p>
                    <p className="text-xs text-slate-500">{delivery.restaurant.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                      Completed
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {delivery.deliveredAt && new Date(delivery.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
