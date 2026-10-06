import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Order, OrderItem } from "@shared/schema";
import { Bell, Check, ChefHat, Clock, CreditCard, Banknote, Phone, Printer, ShoppingBag, Trash2, MapPin, AlertTriangle, Timer, ExternalLink, Navigation, X, Edit2, Send, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatDistance } from "date-fns";

interface OrderCardProps {
  order: Order & { items: OrderItem[] };
  onAccept: (id: string) => void;
  onReject?: (id: string) => void;
  onStatusChange: (id: string, status: "new" | "preparing" | "ready" | "completed") => void;
  onDelete?: (id: string) => void;
  onUpdateDeliveryTime?: (id: string, minutes: number, message?: string) => void;
  restaurantAddress?: string;
  restaurantName?: string;
  currencySymbol?: string;
}

export function OrderCard({ order, onAccept, onReject, onStatusChange, onDelete, onUpdateDeliveryTime, restaurantAddress, restaurantName, currencySymbol = "£" }: OrderCardProps) {
  const isNew = order.status === "new" || order.status === "pending_approval";
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [editDeliveryTime, setEditDeliveryTime] = useState((order as any).estimatedDeliveryMinutes || 45);
  const [editStatusMessage, setEditStatusMessage] = useState((order as any).statusMessage || "");

  useEffect(() => {
    if (!order.createdAt || order.status === "completed") return;

    const calculateElapsed = () => {
      const created = new Date(order.createdAt!);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      setElapsedMinutes(diffMins);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 30000);
    return () => clearInterval(interval);
  }, [order.createdAt, order.status]);

  const isOverdue = elapsedMinutes >= 35;
  const formatElapsedTime = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const openGoogleMapsDirections = () => {
    if (!order.address) return;
    const origin = encodeURIComponent(restaurantAddress || "");
    const destination = encodeURIComponent(order.address);
    const url = restaurantAddress 
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${destination}`;
    window.open(url, '_blank');
  };

  const getGoogleMapsEmbedUrl = (address: string) => {
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderNumber = String(order.orderNumber || 0).padStart(3, '0');
    const timeDisplay = order.type === "delivery" ? formatElapsedTime(elapsedMinutes) : '';
    
    const formatNotesForPrint = (notes: string | null) => {
      if (!notes) return '';
      let html = '';
      let remaining = notes;
      let extraContent = '';
      let noContent = '';
      let description = '';
      
      // Handle EXTRA: first
      if (remaining.includes('EXTRA:')) {
        const extraMatch = remaining.match(/EXTRA:\s*([^|]+)/);
        if (extraMatch) {
          extraContent = extraMatch[1].trim();
          remaining = remaining.replace(/\s*\|\s*EXTRA:[^|]+/, '').replace(/EXTRA:[^|]+\s*\|?\s*/, '');
        }
      }
      
      // Handle NO:
      if (remaining.includes('NO:')) {
        const parts = remaining.split(' | NO:');
        noContent = parts.length > 1 ? parts[1].trim() : remaining.replace('NO:', '').trim();
        description = parts.length > 1 ? parts[0].trim() : '';
      } else {
        description = remaining.trim();
      }
      
      // Build HTML in order: description, extras, no
      if (description) {
        html += `<div style="margin-left: 24px; font-size: 12px; color: #666;">${description}</div>`;
      }
      if (extraContent) {
        html += `<div style="margin-left: 24px; font-size: 12px; color: #090; font-weight: bold;">✚ EXTRA: ${extraContent}</div>`;
      }
      if (noContent) {
        html += `<div style="margin-left: 24px; font-size: 12px; color: #c00; font-weight: bold;">⚠️ NO: ${noContent}</div>`;
      }
      
      return html;
    };

    const itemsHtml = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <div><strong>${item.quantity}x</strong> ${item.name}</div>
        <div>${currencySymbol}${(Number(item.price) * item.quantity).toFixed(2)}</div>
      </div>
      ${formatNotesForPrint(item.notes)}
    `).join('');

    const orderTypeText = order.type === 'collection' ? 'COLLECTION' : order.type === 'takeaway' ? 'TAKEAWAY' : 'DELIVERY';
    const paymentText = order.paymentMethod === 'card' ? 'CARD PAID' : order.paymentMethod === 'bank_transfer' ? 'BANK TRANSFER' : 'CASH';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order #${orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; font-size: 14px; }
            .shop-header { text-align: center; margin-bottom: 20px; }
            .shop-name { font-size: 20px; font-weight: bold; margin: 0 0 5px 0; }
            .shop-address { font-size: 12px; margin: 0; }
            .order-info { margin: 15px 0; }
            .order-row { margin-bottom: 5px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .items { margin: 10px 0; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-section { margin: 10px 0; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
            .customer-section { margin-top: 15px; }
            .customer-label { font-weight: bold; margin-bottom: 5px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="shop-header">
            <div class="shop-name">${restaurantName || 'Restaurant'}</div>
            ${restaurantAddress ? `<div class="shop-address">${restaurantAddress}</div>` : ''}
          </div>
          
          <div class="order-info">
            <div class="order-row">Order #: ${orderNumber}</div>
            ${timeDisplay ? `<div class="order-row">Order Time: ${timeDisplay}</div>` : ''}
            <div class="order-row">${orderTypeText} (${paymentText})</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="items">
            ${order.items.map(item => {
              let notesHtml = '';
              if (item.notes) {
                let remaining = item.notes;
                let extraContent = '';
                let noContent = '';
                let description = '';
                
                // Handle EXTRA: first
                if (remaining.includes('EXTRA:')) {
                  const extraMatch = remaining.match(/EXTRA:\s*([^|]+)/);
                  if (extraMatch) {
                    extraContent = extraMatch[1].trim();
                    remaining = remaining.replace(/\s*\|\s*EXTRA:[^|]+/, '').replace(/EXTRA:[^|]+\s*\|?\s*/, '');
                  }
                }
                // Handle NO:
                if (remaining.includes('NO:')) {
                  const parts = remaining.split(' | NO:');
                  noContent = parts.length > 1 ? parts[1].trim() : remaining.replace('NO:', '').trim();
                  description = parts.length > 1 ? parts[0].trim() : '';
                } else {
                  description = remaining.trim();
                }
                
                // Build HTML in order: description, extras, no
                if (description) {
                  notesHtml += `<div style="font-size: 12px; margin-left: 15px;">${description}</div>`;
                }
                if (extraContent) {
                  notesHtml += `<div style="font-size: 12px; margin-left: 15px; font-weight: bold; color: #090;">✚ EXTRA: ${extraContent}</div>`;
                }
                if (noContent) {
                  notesHtml += `<div style="font-size: 12px; margin-left: 15px; font-weight: bold;">⚠️ NO: ${noContent}</div>`;
                }
              }
              return `
              <div class="item-row">
                <span>${item.quantity} × ${item.name}</span>
                <span>${currencySymbol}${(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
              ${notesHtml}
            `;}).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="total-section">
            <div class="total-row">
              <span>TOTAL ${order.paymentMethod === 'card' ? 'PAID' : order.paymentMethod === 'bank_transfer' ? '(BANK TRANSFER)' : ''}</span>
              <span>${currencySymbol}${Number(order.total).toFixed(2)}</span>
            </div>
            <div class="order-row">Payment Method: ${order.paymentMethod === 'card' ? 'CARD' : order.paymentMethod === 'bank_transfer' ? 'BANK TRANSFER' : 'CASH'}</div>
          </div>
          
          <div class="divider"></div>
          
          ${order.type === "delivery" && order.address ? `
          <div class="customer-section">
            <div class="customer-label">Customer Address:</div>
            <div>${order.address}</div>
          </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("h-full", isNew && "animate-pulse-soft")}
    >
      <style>{`
        @property --card-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotate-card-border {
          to { --card-angle: 360deg; }
        }
        .order-card-animated-border {
          position: relative;
          border-radius: 18px;
          padding: 2px;
          background: conic-gradient(from var(--card-angle), #06b6d4, #3b82f6, #8b5cf6, #f59e0b, #10b981, #06b6d4);
          animation: rotate-card-border 4s linear infinite;
        }
        .order-card-animated-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 18px;
          padding: 2px;
          background: inherit;
          filter: blur(8px);
          opacity: 0.6;
          z-index: -1;
        }
      `}</style>
      <div className="order-card-animated-border h-full">
        <Card 
          className={cn(
            "h-full flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1",
            isNew 
              ? "border-l-4 border-l-blue-500 shadow-xl" 
              : ""
          )}
          style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            boxShadow: isNew 
              ? '0 10px 40px rgba(0,0,0,0.4), 0 0 30px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)' 
              : '0 8px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: 'none',
          }}
        >
        {isNew && (
          <div className="text-center py-2 font-bold text-lg flex items-center justify-center gap-2 animate-pulse text-white" style={{background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)'}}>
            <Bell className="h-5 w-5" />
            NEW ORDER
          </div>
        )}
        
        <CardHeader className="pb-2 space-y-1">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-bold font-mono" style={{color: '#3b82f6', textShadow: '0 0 10px rgba(59, 130, 246, 0.5)'}} data-testid={`text-order-number-${order.id}`}>
                #{String(order.orderNumber || 0).padStart(3, '0')}
              </h3>
              {order.type === "delivery" && order.status !== "completed" && (
                <div className={cn(
                  "font-bold flex items-center gap-1.5 px-2 py-1 rounded-md text-sm",
                  isOverdue 
                    ? "bg-red-500/20 text-red-500 animate-pulse" 
                    : "bg-orange-500/10 text-orange-400"
                )}>
                  {isOverdue ? <AlertTriangle className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
                  <span>{formatElapsedTime(elapsedMinutes)}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge variant={isNew ? "destructive" : "secondary"} className="uppercase text-xs font-bold tracking-wider">
                {order.type === 'collection' ? 'Collection' : order.type}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-bold flex items-center gap-1",
                  order.paymentMethod === 'card' 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30" 
                    : order.paymentMethod === 'bank_transfer'
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse"
                    : "bg-green-500/10 text-green-400 border-green-500/30"
                )}
                data-testid={`badge-payment-${order.id}`}
              >
                {order.paymentMethod === 'card' ? (
                  <><CreditCard className="h-3 w-3" /> Card</>
                ) : order.paymentMethod === 'bank_transfer' ? (
                  <><Building className="h-3 w-3" /> Bank Transfer</>
                ) : (
                  <><Banknote className="h-3 w-3" /> Cash</>
                )}
              </Badge>
            </div>
          </div>
          </CardHeader>

        <CardContent className="flex-1 space-y-4">
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-1" data-testid={`order-item-${idx}`}>
                <div className="flex justify-between items-start text-sm md:text-base">
                  <div className="flex gap-2">
                    <span className="font-bold text-primary w-6">{item.quantity}x</span>
                    <span className={cn("font-medium", isNew ? "text-foreground" : "text-muted-foreground")}>
                      {item.name}
                    </span>
                  </div>
                  <div className="text-muted-foreground font-mono">
                    {currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
                {item.notes && (
                  <div className="ml-8 text-xs space-y-0.5" data-testid={`order-item-notes-${idx}`}>
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
                                  className="text-emerald-400 font-semibold flex items-center gap-1"
                                >
                                  <span>🍽️</span>
                                  <span>{topping}</span>
                                </div>
                              );
                            });
                          }
                        } else if (part.includes('NO:')) {
                          const noMatch = part.match(/NO:\s*(.+)/i);
                          if (noMatch) {
                            elements.push(
                              <div key={`no-${partIdx}`} className="text-red-400 font-semibold">
                                ⚠️ NO: {noMatch[1].trim()}
                              </div>
                            );
                          }
                        } else if (part.trim()) {
                          elements.push(
                            <div key={`desc-${partIdx}`} className="text-amber-400">
                              {part.trim()}
                            </div>
                          );
                        }
                      });
                      
                      return elements;
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-muted-foreground uppercase text-sm">Total</span>
            <span className="font-bold text-2xl">{currencySymbol}{Number(order.total).toFixed(2)}</span>
          </div>

          <Separator />

          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-semibold">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{order.phone}</span>
            </div>
            {order.type === "delivery" && order.address && (
              <>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium">{order.address}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 mt-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30"
                  onClick={openGoogleMapsDirections}
                  data-testid={`button-get-directions-${order.id}`}
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </Button>
                
                {/* Delivery Time Update */}
                {onUpdateDeliveryTime && order.status !== "completed" && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Estimated Delivery: {(order as any).estimatedDeliveryMinutes || 45} mins
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowTimeEditor(!showTimeEditor)}
                        data-testid={`button-edit-time-${order.id}`}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                    </div>
                    
                    {showTimeEditor && (
                      <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
                        <div className="flex gap-1">
                          {[15, 30, 45, 60, 90].map(mins => (
                            <Button
                              key={mins}
                              variant={editDeliveryTime === mins ? "default" : "outline"}
                              size="sm"
                              className="flex-1 h-7 text-xs px-1"
                              onClick={() => setEditDeliveryTime(mins)}
                            >
                              {mins}m
                            </Button>
                          ))}
                        </div>
                        <Input
                          type="text"
                          placeholder="Message to customer (optional)"
                          value={editStatusMessage}
                          onChange={(e) => setEditStatusMessage(e.target.value)}
                          className="h-8 text-xs"
                          data-testid={`input-status-message-${order.id}`}
                        />
                        <Button
                          size="sm"
                          className="w-full h-8 gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            onUpdateDeliveryTime(order.id, editDeliveryTime, editStatusMessage || undefined);
                            setShowTimeEditor(false);
                          }}
                          data-testid={`button-save-time-${order.id}`}
                        >
                          <Send className="h-3 w-3" />
                          Update & Notify Customer
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {order.type === "delivery" && order.address && (
            <div 
              className="relative rounded-lg overflow-hidden border border-border cursor-pointer"
              onClick={openGoogleMapsDirections}
              data-testid={`map-preview-${order.id}`}
            >
              <iframe
                src={getGoogleMapsEmbedUrl(order.address)}
                className="w-full h-24 pointer-events-none"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Delivery Location Map"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2 pb-6 flex gap-2">
          {isNew ? (
            <>
               <Button variant="outline" size="sm" className="gap-1 px-3" onClick={handlePrint} data-testid="button-print-order">
                <Printer className="h-4 w-4" />
              </Button>
              {onReject && (order.paymentMethod === 'card' || order.paymentMethod === 'bank_transfer') && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="gap-1 h-10"
                  onClick={() => onReject(order.id)}
                  data-testid="button-reject-order"
                >
                  <X className="h-4 w-4 flex-shrink-0" />
                  REJECT
                </Button>
              )}
              <Button 
                size="sm" 
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs h-10 gap-1 shadow-lg shadow-accent/20"
                onClick={() => onAccept(order.id)}
                data-testid="button-accept-order"
              >
                <Check className="h-4 w-4 flex-shrink-0" />
                ACCEPT
              </Button>
            </>
          ) : (
             <>
               <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2" onClick={handlePrint} data-testid="button-print-order-small">
                <Printer className="h-4 w-4" />
              </Button>
              {order.status === 'preparing' && (
                <Button 
                  variant="secondary"
                  className="flex-1 gap-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-600/30"
                  onClick={() => onStatusChange(order.id, 'ready')}
                  data-testid="button-mark-ready"
                >
                  <ChefHat className="h-4 w-4" />
                  Mark Ready
                </Button>
              )}
              {order.status === 'ready' && (
                <Button 
                  variant="secondary"
                  className="flex-1 gap-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border-emerald-600/30"
                  onClick={() => onStatusChange(order.id, 'completed')}
                  data-testid="button-complete-order"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Complete
                </Button>
              )}
               {order.status === 'completed' && (
                <>
                  <div className="flex-1 text-center text-muted-foreground font-medium text-sm flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" /> Completed
                  </div>
                  {onDelete && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-900/30"
                      onClick={() => onDelete(order.id)}
                      data-testid="button-delete-order"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
             </>
          )}
        </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
}
