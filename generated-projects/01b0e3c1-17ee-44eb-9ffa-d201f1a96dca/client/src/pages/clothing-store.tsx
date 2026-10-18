import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, X, Plus, Minus, ChevronLeft, ChevronRight, Search, Menu, Heart, Shirt } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils";

interface CartItem {
  id: string; name: string; price: string; image: string; size: string; quantity: number; color?: string;
}

export default function ClothingStore() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [showProduct, setShowProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [activeGender, setActiveGender] = useState("Women");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [sliderIdx, setSliderIdx] = useState(0);
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "", customerAddress: "", customerCity: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const { data: brand } = useQuery({
    queryKey: ["/api/clothing/brands/by-slug", slug],
    queryFn: () => fetch(`/api/clothing/brands/by-slug/${slug}`).then(r => r.json()),
    enabled: !!slug,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/clothing/categories", brand?.id],
    queryFn: () => fetch(`/api/clothing/categories?brandId=${brand?.id}`).then(r => r.json()),
    enabled: !!brand?.id,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["/api/clothing/products", brand?.id],
    queryFn: () => fetch(`/api/clothing/products?brandId=${brand?.id}`).then(r => r.json()),
    enabled: !!brand?.id,
  });

  const bannerImages: string[] = Array.isArray(brand?.bannerImages) ? brand.bannerImages : [];

  useEffect(() => {
    if (bannerImages.length > 1) {
      const t = setInterval(() => setSliderIdx(prev => (prev + 1) % bannerImages.length), 4000);
      return () => clearInterval(t);
    }
  }, [bannerImages.length]);

  const genderCats = categories.filter((c: any) => c.gender === activeGender);
  const filteredProducts = allProducts.filter((p: any) => {
    if (searchQuery) return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeCatId) return p.categoryId === activeCatId;
    const genderCatIds = genderCats.map((c: any) => c.id);
    return genderCatIds.includes(p.categoryId);
  });

  function getProductImages(p: any) {
    return [p.image1, p.image2, p.image3, p.image4, p.image5].filter(Boolean);
  }

  function addToCart(product: any, size: string) {
    if (brand?.isOpen === false) {
      toast({ title: "Shop is closed", description: "Sorry, this shop is not accepting orders right now.", variant: "destructive" });
      return;
    }
    const existing = cart.find(c => c.id === product.id && c.size === size);
    if (existing) {
      setCart(cart.map(c => c.id === product.id && c.size === size ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, image: product.image1 || "", size, quantity: 1, color: product.color }]);
    }
    toast({ title: `${product.name} (${size}) added to bag` });
  }

  function removeFromCart(id: string, size: string) {
    setCart(cart.filter(c => !(c.id === id && c.size === size)));
  }

  function updateQty(id: string, size: string, delta: number) {
    setCart(cart.map(c => {
      if (c.id === id && c.size === size) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }));
  }

  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.price) * c.quantity, 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const currencyCode = brand?.currency || "PKR";
  const currency = getCurrencySymbol(currencyCode);

  const activePromos: any[] = Array.isArray(brand?.promoDeals) ? brand.promoDeals.filter((p: any) => p.isActive) : [];
  const qualifiedPromo = activePromos.find((promo: any) => {
    if (!promo.productIds || promo.productIds.length === 0) {
      return cartItemCount >= promo.minItems;
    }
    const promoCartCount = cart.filter(c => promo.productIds.includes(c.id)).reduce((s, c) => s + c.quantity, 0);
    return promoCartCount >= promo.minItems;
  });
  const isFreeDelivery = qualifiedPromo?.reward === "Free Delivery";
  const effectiveDeliveryFee = isFreeDelivery ? 0 : parseFloat(brand?.deliveryFee || "0");

  const placeOrder = useMutation({
    mutationFn: () => {
      const orderItems = cart.map(c => ({ productId: c.id, name: c.name, size: c.size, quantity: c.quantity, price: c.price }));
      const totalStr = (cartTotal + effectiveDeliveryFee).toFixed(2);
      const cleanName = (checkoutForm.customerName || "")
        .replace(/\[\s*\d{1,2}\/\d{1,2}[^\]]*\]/g, "")
        .replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?/g, "")
        .replace(/Mujeeb:|IBAN:|Bank code:|Account:|A\/c:/gi, "")
        .replace(/\s+/g, " ").trim();
      return fetch("/api/clothing/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand?.id, ...checkoutForm, customerName: cleanName || checkoutForm.customerName,
          items: orderItems,
          subtotal: cartTotal.toFixed(2), deliveryFee: effectiveDeliveryFee.toFixed(2),
          total: totalStr,
          paymentMethod: paymentMethod, promoApplied: qualifiedPromo?.title || null,
        }),
      }).then(r => r.json()).then(saved => ({ ...saved, _items: orderItems, _total: totalStr }));
    },
    onSuccess: (savedOrder: any) => {
      setPlacedOrder(savedOrder);
      setCart([]); setShowCheckout(false); setShowCart(false);
      toast({ title: "Order placed successfully! We will contact you shortly." });
    },
  });

  const buildWhatsAppOrderMessage = (order: any) => {
    const items = (order._items || order.items || []) as any[];
    const itemsText = items.map((it, i) => `${i + 1}. ${it.name}${it.size ? ` (Size: ${it.size})` : ""} x${it.quantity} - ${currency} ${(Number(it.price) * Number(it.quantity)).toLocaleString()}`).join("\n");
    const total = order._total || order.total;
    const customer = checkoutForm.customerName || order.customerName || "Customer";
    const phone = checkoutForm.customerPhone || order.customerPhone || "";
    const city = checkoutForm.customerCity || order.customerCity || "";
    const address = checkoutForm.customerAddress || order.customerAddress || "";
    const pay = (paymentMethod || order.paymentMethod || "cash").toUpperCase();
    return [
      `🛍️ NEW ORDER - ${brand.name}`,
      "",
      `Customer: ${customer}`,
      `Phone: ${phone}`,
      city ? `City: ${city}` : "",
      address ? `Address: ${address}` : "",
      "",
      `Items:`,
      itemsText,
      "",
      `Subtotal: ${currency} ${cartTotal.toLocaleString()}`,
      `Delivery: ${currency} ${effectiveDeliveryFee.toLocaleString()}`,
      `TOTAL: ${currency} ${Number(total).toLocaleString()}`,
      `Payment: ${pay}`,
    ].filter(Boolean).join("\n");
  };

  const sendOrderToWhatsApp = (order: any) => {
    if (!brand?.whatsappNumber) {
      toast({ title: "WhatsApp not available", description: "This brand has not set a WhatsApp number.", variant: "destructive" });
      return;
    }
    const num = String(brand.whatsappNumber).replace(/[^0-9]/g, "");
    const msg = buildWhatsAppOrderMessage(order);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!brand) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (brand.isActive === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {brand.logo && <img src={brand.logo} alt={brand.name} className="h-20 mx-auto mb-6 object-contain" />}
          <h1 className="text-2xl font-bold mb-3">{brand.name}</h1>
          <p className="text-gray-500 mb-6">This store is currently unavailable. Please check back later.</p>
          <p className="text-xs text-gray-400">Contact the store owner for more information.</p>
        </div>
      </div>
    );
  }

  const shopClosed = brand.isOpen === false;
  const primaryColor = brand.primaryColor || "#000000";

  return (
    <div className="min-h-screen bg-white" style={{ "--brand-primary": primaryColor } as any}>
      {shopClosed && (
        <div className="bg-red-600 text-white text-center py-2 px-4 font-semibold text-sm sticky top-0 z-[60]" data-testid="banner-shop-closed">
          🔒 Sorry, our shop is currently CLOSED. You can browse but cannot place orders right now.
        </div>
      )}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button className="md:hidden" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-10 object-contain" />
              ) : (
                <h1 className="text-xl font-bold tracking-tight" style={{ color: primaryColor }}>{brand.name}</h1>
              )}
            </div>
            <div className="hidden md:flex items-center gap-1">
              {["Women", "Men", "Kids", "Accessories"].map(g => (
                <button key={g} onClick={() => { setActiveGender(g); setActiveCatId(null); setSearchQuery(""); }}
                  className={`px-4 py-2 text-sm font-medium transition-all ${activeGender === g ? "border-b-2 font-bold" : "text-gray-500 hover:text-black"}`}
                  style={activeGender === g ? { borderColor: primaryColor, color: primaryColor } : {}}>
                  {g}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setActiveCatId(null); }}
                  className="pl-9 w-48 h-9 rounded-full bg-gray-100 border-0" data-testid="input-search" />
              </div>
              <button onClick={() => setShowCart(true)} className="relative" data-testid="button-open-cart">
                <ShoppingBag className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ background: primaryColor }}>
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
          {showMobileMenu && (
            <div className="md:hidden border-t py-3 flex flex-wrap gap-2">
              {["Women", "Men", "Kids", "Accessories"].map(g => (
                <button key={g} onClick={() => { setActiveGender(g); setActiveCatId(null); setShowMobileMenu(false); }}
                  className={`px-3 py-1.5 rounded-full text-sm ${activeGender === g ? "text-white" : "bg-gray-100"}`}
                  style={activeGender === g ? { background: primaryColor } : {}}>
                  {g}
                </button>
              ))}
              <div className="w-full mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search products..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setActiveCatId(null); }}
                    className="pl-9 bg-gray-100 border-0" />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {bannerImages.length > 0 && !searchQuery && !activeCatId && (
        <div className="relative h-64 md:h-96 overflow-hidden bg-gray-100">
          {bannerImages.map((img, idx) => (
            <img key={idx} src={img} alt={`Banner ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === sliderIdx ? "opacity-100" : "opacity-0"}`} />
          ))}
          {bannerImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {bannerImages.map((_, idx) => (
                <button key={idx} onClick={() => setSliderIdx(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === sliderIdx ? "bg-white w-6" : "bg-white/50"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            <button onClick={() => setActiveCatId(null)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-all ${!activeCatId ? "text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
              style={!activeCatId ? { background: primaryColor, borderColor: primaryColor } : {}}>
              All {activeGender}
            </button>
            {genderCats.map((c: any) => (
              <button key={c.id} onClick={() => setActiveCatId(c.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-all ${activeCatId === c.id ? "text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                style={activeCatId === c.id ? { background: primaryColor, borderColor: primaryColor } : {}}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.filter((p: any) => p.isActive).map((p: any) => {
            const images = getProductImages(p);
            const discount = p.wasPrice ? Math.round(((parseFloat(p.wasPrice) - parseFloat(p.price)) / parseFloat(p.wasPrice)) * 100) : 0;
            return (
              <div key={p.id} className="group cursor-pointer" onClick={() => { setShowProduct(p); setCurrentImageIdx(0); setSelectedSize(""); }}
                data-testid={`card-product-${p.id}`}>
                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {images[0] ? (
                    <img src={images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Shirt className="h-12 w-12 text-gray-300" /></div>
                  )}
                  {p.isSoldOut && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-white text-black px-4 py-2 text-sm font-bold">SOLD OUT</span></div>}
                  {discount > 0 && !p.isSoldOut && <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">{discount}% OFF</div>}
                  {p.isNew && !p.isSoldOut && <div className="absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full font-bold" style={{ background: primaryColor }}>NEW</div>}
                </div>
                <h3 className="text-sm font-medium mb-1 line-clamp-2">{p.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{currency} {parseInt(p.price).toLocaleString()}</span>
                  {p.wasPrice && <span className="text-xs text-gray-400 line-through">{currency} {parseInt(p.wasPrice).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Shirt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {showProduct && (
        <Dialog open={!!showProduct} onOpenChange={() => setShowProduct(null)}>
          <DialogContent className="max-w-4xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProduct(null)}
              className="fixed md:absolute top-3 right-3 z-50 w-11 h-11 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center shadow-2xl border-2 border-white"
              data-testid="button-close-product"
              aria-label="Close"
            >
              <X className="h-6 w-6" strokeWidth={3} />
            </button>
            <div className="grid md:grid-cols-2">
              <div className="relative bg-gray-100">
                {(() => {
                  const images = getProductImages(showProduct);
                  return (
                    <>
                      <div className="aspect-square">
                        {images[currentImageIdx] ? (
                          <img src={images[currentImageIdx]} alt={showProduct.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full"><Shirt className="h-20 w-20 text-gray-300" /></div>
                        )}
                      </div>
                      {images.length > 1 && (
                        <>
                          <button onClick={() => setCurrentImageIdx(prev => prev > 0 ? prev - 1 : images.length - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button onClick={() => setCurrentImageIdx(prev => (prev + 1) % images.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <div className="flex gap-2 p-3 justify-center">
                            {images.map((_: string, idx: number) => (
                              <button key={idx} onClick={() => setCurrentImageIdx(idx)}
                                className={`w-16 h-16 rounded border-2 overflow-hidden ${idx === currentImageIdx ? "border-black" : "border-transparent"}`}>
                                <img src={images[idx]} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl">{showProduct.name}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold">{currency} {parseInt(showProduct.price).toLocaleString()}</span>
                    {showProduct.wasPrice && <span className="text-lg text-gray-400 line-through">{currency} {parseInt(showProduct.wasPrice).toLocaleString()}</span>}
                    {showProduct.wasPrice && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">
                        {Math.round(((parseFloat(showProduct.wasPrice) - parseFloat(showProduct.price)) / parseFloat(showProduct.wasPrice)) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  {showProduct.description && <p className="text-sm text-gray-600 mb-4">{showProduct.description}</p>}
                  {showProduct.fabric && <p className="text-sm text-gray-500 mb-2">Fabric: {showProduct.fabric}</p>}
                  {showProduct.color && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-500">Color</span>
                      <div className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-inner" style={{ background: showProduct.color }} title={showProduct.color} />
                    </div>
                  )}
                  {showProduct.sizeGuide && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Size & Fit Guide</p>
                      <p className="text-xs text-gray-600 whitespace-pre-line">{showProduct.sizeGuide}</p>
                    </div>
                  )}
                  {Array.isArray(showProduct.sizes) && showProduct.sizes.length > 0 && (
                    <div className="mb-6">
                      <Label className="text-sm font-medium mb-2 block">Select Size</Label>
                      <div className="flex flex-wrap gap-2">
                        {showProduct.sizes.map((s: any) => {
                          const name = typeof s === "string" ? s : s.name;
                          const inStock = typeof s === "string" ? true : s.inStock !== false;
                          return (
                            <button key={name} onClick={() => { setSelectedSize(name); if (!inStock) {} }}
                              className={`w-12 h-12 rounded-lg border-2 text-sm font-medium transition-all relative ${
                                selectedSize === name ? "text-white" : inStock ? "border-gray-200 hover:border-gray-400" : "border-orange-300 bg-orange-50 text-orange-400"
                              }`}
                              style={selectedSize === name ? { background: inStock ? primaryColor : "#f97316", borderColor: inStock ? primaryColor : "#f97316" } : {}}>
                              {name}
                              {!inStock && <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white"></span>}
                            </button>
                          );
                        })}
                      </div>
                      {selectedSize && (() => {
                        const selSizeObj = showProduct.sizes.find((s: any) => (typeof s === "string" ? s : s.name) === selectedSize);
                        const isOutOfStock = selSizeObj && typeof selSizeObj !== "string" && selSizeObj.inStock === false;
                        if (isOutOfStock) return (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-700 font-semibold text-sm">Coming Soon - Advance Order</p>
                            <p className="text-orange-600 text-xs mt-1">This size is currently out of stock. Expected delivery: 10 working days.</p>
                          </div>
                        );
                        return null;
                      })()}
                    </div>
                  )}
                  {(() => {
                    const selSizeObj2 = selectedSize ? showProduct.sizes?.find((s: any) => (typeof s === "string" ? s : s.name) === selectedSize) : null;
                    const isSelOutOfStock = selSizeObj2 && typeof selSizeObj2 !== "string" && selSizeObj2.inStock === false;
                    return (
                      <Button className="w-full h-12 text-base font-bold rounded-lg" 
                        style={{ background: shopClosed ? "#9ca3af" : isSelOutOfStock ? "#f97316" : primaryColor }}
                        disabled={shopClosed || showProduct.isSoldOut || (Array.isArray(showProduct.sizes) && showProduct.sizes.length > 0 && !selectedSize)}
                        onClick={() => {
                          const size = selectedSize || (Array.isArray(showProduct.sizes) && showProduct.sizes.length > 0 ? "" : "One Size");
                          if (!size) { toast({ title: "Please select a size", variant: "destructive" }); return; }
                          addToCart(showProduct, size);
                          setShowProduct(null);
                          if (isSelOutOfStock) toast({ title: "Advance order placed! Expected delivery: 10 working days." });
                        }}
                        data-testid="button-add-to-cart">
                        {shopClosed ? "SHOP CLOSED" : showProduct.isSoldOut ? "SOLD OUT" : isSelOutOfStock ? "ADVANCE ORDER - 10 WORKING DAYS" : "ADD TO BAG"}
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Shopping Bag ({cart.reduce((s, c) => s + c.quantity, 0)} items)</DialogTitle></DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            {cart.map(c => (
              <div key={`${c.id}-${c.size}`} className="flex gap-3 py-3 border-b">
                {c.image && <img src={c.image} className="w-16 h-20 object-cover rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">Size: {c.size} {c.color && `| Color: ${c.color}`}</p>
                  <p className="text-sm font-bold mt-1">{currency} {parseInt(c.price).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQty(c.id, c.size, -1)} className="w-6 h-6 rounded border flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm">{c.quantity}</span>
                    <button onClick={() => updateQty(c.id, c.size, 1)} className="w-6 h-6 rounded border flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(c.id, c.size)}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
            ))}
          </div>
          {cart.length > 0 && activePromos.length > 0 && (
            <div className="mt-3">
              {activePromos.map((promo: any, i: number) => {
                const promoCartCount = (!promo.productIds || promo.productIds.length === 0)
                  ? cartItemCount
                  : cart.filter(c => promo.productIds.includes(c.id)).reduce((s, c) => s + c.quantity, 0);
                const remaining = promo.minItems - promoCartCount;
                const qualified = remaining <= 0;
                return (
                  <div key={i} className={`p-3 rounded-lg mb-2 ${qualified ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}>
                    <p className={`text-sm font-bold ${qualified ? "text-green-700" : "text-orange-700"}`}>
                      {qualified ? `${promo.reward} Applied!` : promo.title}
                    </p>
                    {!qualified && <p className="text-xs text-orange-600 mt-0.5">Add {remaining} more item{remaining > 1 ? "s" : ""} to unlock {promo.reward}!</p>}
                    {qualified && <p className="text-xs text-green-600 mt-0.5">{promo.title}</p>}
                  </div>
                );
              })}
            </div>
          )}
          {cart.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2 text-sm"><span>Subtotal</span><span>{currency} {cartTotal.toLocaleString()}</span></div>
              {parseFloat(brand?.deliveryFee || "0") > 0 && (
                <div className="flex justify-between mb-2 text-sm">
                  <span>Delivery</span>
                  <span className={isFreeDelivery ? "line-through text-gray-400" : ""}>{currency} {parseFloat(brand?.deliveryFee || "0").toLocaleString()}</span>
                  {isFreeDelivery && <span className="text-green-600 font-bold text-xs ml-1">FREE</span>}
                </div>
              )}
              <div className="flex justify-between mb-4 font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{currency} {(cartTotal + effectiveDeliveryFee).toLocaleString()}</span>
              </div>
              <Button className="w-full h-12 font-bold" style={{ background: primaryColor }}
                onClick={() => { setShowCart(false); setShowCheckout(true); }} data-testid="button-checkout">
                CHECKOUT
              </Button>
            </div>
          )}
          {cart.length === 0 && <p className="text-center py-8 text-gray-500">Your bag is empty</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Checkout</DialogTitle></DialogHeader>
          {(() => {
            const pm: any = brand?.paymentMethods || {};
            const totalAmount = (cartTotal + effectiveDeliveryFee).toLocaleString();
            const qrData = (method: string, details: string) => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(details)}`;
            return (
              <div className="grid gap-3">
                <div><Label>Full Name *</Label><Input value={checkoutForm.customerName} onChange={e => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })} /></div>
                <div><Label>Phone *</Label><Input value={checkoutForm.customerPhone} onChange={e => setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={checkoutForm.customerEmail} onChange={e => setCheckoutForm({ ...checkoutForm, customerEmail: e.target.value })} /></div>
                <div><Label>Delivery Address *</Label><Input value={checkoutForm.customerAddress} onChange={e => setCheckoutForm({ ...checkoutForm, customerAddress: e.target.value })} /></div>
                <div><Label>City *</Label><Input value={checkoutForm.customerCity} onChange={e => setCheckoutForm({ ...checkoutForm, customerCity: e.target.value })} /></div>

                <div className="border-t pt-3">
                  {qualifiedPromo && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg mb-3">
                      <p className="text-green-700 font-bold text-sm">{qualifiedPromo.reward} Applied!</p>
                      <p className="text-green-600 text-xs">{qualifiedPromo.title}</p>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>{currency} {cartTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Delivery</span>
                    {isFreeDelivery ? (
                      <span className="flex items-center gap-1"><span className="line-through text-gray-400">{currency} {brand.deliveryFee}</span><span className="text-green-600 font-bold">FREE</span></span>
                    ) : (
                      <span>{currency} {brand.deliveryFee || "0"}</span>
                    )}
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span><span>{currency} {totalAmount}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <Label className="text-sm font-semibold mb-3 block">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(pm.cashEnabled !== false) && (
                      <button onClick={() => setPaymentMethod("cod")}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${paymentMethod === "cod" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <span className="text-lg">💵</span>
                        <p className="text-sm font-medium mt-1">Cash</p>
                        <p className="text-xs text-gray-500">Pay on delivery</p>
                      </button>
                    )}
                    {pm.cardEnabled && (
                      <button onClick={() => setPaymentMethod("card")}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <span className="text-lg">💳</span>
                        <p className="text-sm font-medium mt-1">Card</p>
                        <p className="text-xs text-gray-500">Stripe payment</p>
                      </button>
                    )}
                    {pm.jazzCashEnabled && (
                      <button onClick={() => setPaymentMethod("jazzcash")}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${paymentMethod === "jazzcash" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <span className="text-lg">📱</span>
                        <p className="text-sm font-medium mt-1">JazzCash</p>
                        <p className="text-xs text-gray-500">Mobile transfer</p>
                      </button>
                    )}
                    {pm.easyPaisaEnabled && (
                      <button onClick={() => setPaymentMethod("easypaisa")}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${paymentMethod === "easypaisa" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <span className="text-lg">📲</span>
                        <p className="text-sm font-medium mt-1">EasyPaisa</p>
                        <p className="text-xs text-gray-500">Mobile transfer</p>
                      </button>
                    )}
                    {pm.bankEnabled && (
                      <button onClick={() => setPaymentMethod("bank")}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${paymentMethod === "bank" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <span className="text-lg">🏦</span>
                        <p className="text-sm font-medium mt-1">Bank</p>
                        <p className="text-xs text-gray-500">Bank transfer</p>
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  const cfg: any = paymentMethod === "jazzcash" && pm.jazzCashName ? {
                    title: "JazzCash Payment", color: "red",
                    rows: [["Account Name", pm.jazzCashName], ["Account Number", pm.jazzCashNumber]],
                    copyValue: pm.jazzCashNumber, copyLabel: "Copy Account Number",
                    qr: `JazzCash: ${pm.jazzCashName} | ${pm.jazzCashNumber} | Amount: ${currency} ${totalAmount}`,
                    testid: "jazzcash",
                  } : paymentMethod === "easypaisa" && pm.easyPaisaName ? {
                    title: "EasyPaisa Payment", color: "emerald",
                    rows: [["Account Name", pm.easyPaisaName], ["Account Number", pm.easyPaisaNumber]],
                    copyValue: pm.easyPaisaNumber, copyLabel: "Copy Account Number",
                    qr: `EasyPaisa: ${pm.easyPaisaName} | ${pm.easyPaisaNumber} | Amount: ${currency} ${totalAmount}`,
                    testid: "easypaisa",
                  } : paymentMethod === "bank" && pm.bankName ? {
                    title: `${pm.bankName} - Bank Transfer`, color: "purple",
                    rows: [["Bank", pm.bankName], ["Account Name", pm.bankAccountName], ["Account No", pm.bankAccountNumber], ...(pm.bankIBAN ? [["IBAN", pm.bankIBAN]] : [])],
                    copyValue: pm.bankAccountNumber, copyLabel: "Copy Account No", copyValue2: pm.bankIBAN, copyLabel2: "Copy IBAN",
                    qr: `${pm.bankName} | Acc: ${pm.bankAccountName} | ${pm.bankAccountNumber} | IBAN: ${pm.bankIBAN || "N/A"} | Amount: ${currency} ${totalAmount}`,
                    testid: "bank",
                  } : null;
                  if (!cfg) return null;
                  const colorMap: any = {
                    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", btn: "bg-red-600 hover:bg-red-700" },
                    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700" },
                    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", btn: "bg-purple-600 hover:bg-purple-700" },
                  };
                  const c = colorMap[cfg.color];
                  return (
                    <div className={`border-2 ${c.border} rounded-xl p-4 ${c.bg}`}>
                      <h4 className={`font-bold text-base mb-3 ${c.text}`}>{cfg.title}</h4>

                      <div className="bg-white rounded-lg p-3 mb-3 space-y-1.5">
                        {cfg.rows.map(([k, v]: any) => (
                          <div key={k} className="flex justify-between text-sm gap-3">
                            <span className="text-gray-600 shrink-0">{k}:</span>
                            <span className="font-mono font-semibold text-right break-all">{v}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-2 mt-2 border-t">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-bold text-lg">{currency} {totalAmount}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center bg-white rounded-lg p-3 mb-3">
                        <p className={`text-xs font-semibold mb-2 ${c.text}`}>Scan QR with your bank app</p>
                        <img src={qrData(cfg.testid, cfg.qr)} className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg object-contain bg-white border border-gray-200 p-2" data-testid={`img-${cfg.testid}-barcode`} />
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(cfg.copyValue); toast({ title: `${cfg.copyLabel.replace("Copy ", "")} copied! Paste in your bank app` }); }}
                          className={`w-full h-11 rounded-lg ${c.btn} text-white font-semibold text-sm flex items-center justify-center gap-2`} data-testid={`button-copy-${cfg.testid}`}>
                          📋 {cfg.copyLabel}
                        </button>
                        {cfg.copyValue2 && (
                          <button onClick={() => { navigator.clipboard.writeText(cfg.copyValue2); toast({ title: `${cfg.copyLabel2.replace("Copy ", "")} copied! Paste in your bank app` }); }}
                            className={`w-full h-11 rounded-lg ${c.btn} text-white font-semibold text-sm flex items-center justify-center gap-2`} data-testid={`button-copy-${cfg.testid}-2`}>
                            📋 {cfg.copyLabel2}
                          </button>
                        )}
                      </div>

                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <strong>How to pay:</strong> 1) Tap "Copy Account No" above. 2) Open your bank app. 3) Paste the number. 4) Send {currency} {totalAmount}. 5) Press Place Order below.
                      </div>
                    </div>
                  );
                })()}

                <Button className="w-full h-12 font-bold" style={{ background: primaryColor }}
                  disabled={!checkoutForm.customerName || !checkoutForm.customerPhone || !checkoutForm.customerAddress || !checkoutForm.customerCity}
                  onClick={() => placeOrder.mutate()} data-testid="button-place-order">
                  PLACE ORDER
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!placedOrder} onOpenChange={(o) => !o && setPlacedOrder(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="dialog-order-success">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center text-4xl">✓</div>
            <h2 className="text-2xl font-bold mb-1">Order Placed!</h2>
            <p className="text-sm opacity-90">Thank you{placedOrder?.customerName ? `, ${placedOrder.customerName}` : ""}!</p>
            {placedOrder?._total && <p className="text-3xl font-bold mt-3">{currency} {Number(placedOrder._total).toLocaleString()}</p>}
          </div>
          <div className="p-5 space-y-3">
            {brand?.whatsappNumber && (
              <Button
                onClick={() => placedOrder && sendOrderToWhatsApp(placedOrder)}
                className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-bold text-base shadow-lg"
                data-testid="button-send-whatsapp-order"
              >
                <svg viewBox="0 0 32 32" className="w-6 h-6 mr-2" fill="currentColor"><path d="M16.554 25.27a8.616 8.616 0 0 1-4.4-1.205l-3.156.802.844-3.04a8.658 8.658 0 1 1 6.71 3.444zm0-19.07a10.41 10.41 0 0 0-10.4 10.41c0 1.842.486 3.624 1.402 5.193L6 27.602l5.97-1.566a10.42 10.42 0 0 0 4.585 1.062 10.41 10.41 0 0 0 0-20.82z" /></svg>
                Send Order to {brand.name} on WhatsApp
              </Button>
            )}
            <p className="text-xs text-center text-gray-500">
              Your order details will be sent with your name <strong>{placedOrder?.customerName || ""}</strong> so the brand can confirm with you.
            </p>
            <Button onClick={() => setPlacedOrder(null)} variant="outline" className="w-full" data-testid="button-close-success">
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {brand.whatsappNumber && (
        <a
          href={`https://wa.me/${String(brand.whatsappNumber).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${brand.name}, I'd like to ask about your products.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with ${brand.name} on WhatsApp`}
          data-testid="button-whatsapp-float"
          className="fixed bottom-6 right-6 z-50 group"
        >
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
          <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-2xl transition-transform group-hover:scale-110">
            <svg viewBox="0 0 32 32" className="w-7 h-7" fill="currentColor" aria-hidden="true">
              <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.508-1.318.215-.487.215-.917.143-1.017-.058-.143-.288-.215-.602-.36zM16.554 25.27a8.616 8.616 0 0 1-4.4-1.205l-3.156.802.844-3.04a8.658 8.658 0 0 1 6.71-14.142A8.66 8.66 0 0 1 25.21 16.61a8.665 8.665 0 0 1-8.656 8.66zm0-19.07a10.41 10.41 0 0 0-10.4 10.41c0 1.842.486 3.624 1.402 5.193L6 27.602l5.97-1.566a10.42 10.42 0 0 0 4.585 1.062 10.41 10.41 0 0 0 10.41-10.41 10.34 10.34 0 0 0-3.05-7.36 10.34 10.34 0 0 0-7.36-3.05z" />
            </svg>
          </span>
        </a>
      )}

      <footer className="bg-gray-100 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {brand.logo ? <img src={brand.logo} className="h-8 object-contain" /> : <span className="font-bold text-lg">{brand.name}</span>}
          </div>
          <p className="text-sm text-gray-500 mb-2">{brand.address}{brand.city && `, ${brand.city}`}</p>
          <p className="text-sm text-gray-500">{brand.phone}{brand.email && ` | ${brand.email}`}</p>
          {(brand.address || brand.city) && (
            <div className="mt-4 rounded-lg overflow-hidden max-w-2xl mx-auto shadow-md">
              <iframe
                width="100%" height="250" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent([brand.address, brand.city, brand.country].filter(Boolean).join(", "))}&output=embed`}
              />
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">Powered by Link24</p>
        </div>
      </footer>
    </div>
  );
}
