import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, X, Plus, Minus, Search, Phone, Mail, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function FurnitureStore() {
  const [, params] = useRoute("/furniture/:slug");
  const slug = params?.slug;
  const { toast } = useToast();

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [sliderIdx, setSliderIdx] = useState(0);
  const [checkoutForm, setCheckoutForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", customerAddress: "", customerCity: "" });
  const sliderRef = useRef<any>(null);

  const { data: brand } = useQuery({ queryKey: ["/api/furniture/brands/by-slug", slug], queryFn: () => fetch(`/api/furniture/brands/by-slug/${slug}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }), enabled: !!slug });
  const { data: categories = [] } = useQuery({ queryKey: ["/api/furniture/categories", brand?.id], queryFn: () => fetch(`/api/furniture/categories?brandId=${brand?.id}`).then(r => r.json()), enabled: !!brand?.id });
  const { data: products = [] } = useQuery({ queryKey: ["/api/furniture/products", brand?.id], queryFn: () => fetch(`/api/furniture/products?brandId=${brand?.id}`).then(r => r.json()), enabled: !!brand?.id });

  const placeOrder = useMutation({
    mutationFn: () => fetch("/api/furniture/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: brand?.id, ...checkoutForm, items: cart.map(c => ({ productId: c.id, name: c.name, quantity: c.quantity, price: c.price })), subtotal: cartTotal.toFixed(2), deliveryFee: (brand?.deliveryFee || "0"), total: (cartTotal + Number(brand?.deliveryFee || 0)).toFixed(2), paymentMethod }),
    }).then(r => r.json()),
    onSuccess: () => { setCart([]); setShowCheckout(false); setShowCart(false); toast({ title: "Order placed! We will contact you shortly." }); },
  });

  const banners: any[] = Array.isArray(brand?.bannerImages) ? brand.bannerImages : [];

  useEffect(() => {
    if (banners.length <= 1) return;
    sliderRef.current = setInterval(() => setSliderIdx(p => (p + 1) % banners.length), 4000);
    return () => clearInterval(sliderRef.current);
  }, [banners.length]);

  if (!brand) return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white"><p>Loading...</p></div>;

  const bgColor = brand.bgColor || "#0f0f1a";
  const primaryColor = brand.primaryColor || "#C9A96E";
  const accentColor = brand.accentColor || "#D4AF37";
  const cardBg = brand.cardBgColor || "rgba(255,255,255,0.05)";
  const currency = brand.currency || "£";

  const mainCats = categories.filter((c: any) => !c.parentId);
  const subCats = (parentId: string) => categories.filter((c: any) => c.parentId === parentId);

  const filteredProducts = products.filter((p: any) => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCat) {
      const subs = subCats(selectedCat).map((s: any) => s.id);
      if (p.categoryId !== selectedCat && !subs.includes(p.categoryId)) return false;
    }
    return p.isActive !== false;
  });

  const featuredProducts = products.filter((p: any) => p.isFeatured && !p.isSoldOut);
  const saleProducts = products.filter((p: any) => p.isOnSale && !p.isSoldOut);
  const newProducts = products.filter((p: any) => p.isNew && !p.isSoldOut);

  const addToCart = (product: any) => {
    if (product.isSoldOut) { toast({ title: "This item is sold out", variant: "destructive" }); return; }
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...product, quantity: 1 }];
    });
    toast({ title: `${product.name} added to cart` });
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const productImages = (p: any) => [p.image1, p.image2, p.image3, p.image4, p.image5, p.image6].filter(Boolean);
  const discount = (p: any) => p.wasPrice ? Math.round(((Number(p.wasPrice) - Number(p.price)) / Number(p.wasPrice)) * 100) : 0;

  const AnimatedText = ({ at }: { at: any }) => {
    if (!at?.text || !at?.enabled) return null;
    const sizeClass = at.headingSize === "h1" ? "text-3xl" : at.headingSize === "h2" ? "text-2xl" : at.headingSize === "h3" ? "text-xl" : at.headingSize === "h4" ? "text-lg" : "text-base";
    const style: any = { color: at.color || accentColor };
    if (at.animation === "bounce") style.animation = "bounce 1s infinite";
    if (at.animation === "pulse") style.animation = "pulse 2s infinite";
    if (at.animation === "glow") style.animation = "glow 2s infinite";
    if (at.animation === "fadeIn") style.animation = "fadeIn 2s";
    if (at.animation === "slideIn") style.animation = "slideIn 1s";
    if (at.animation === "spring") style.animation = "spring 0.8s";

    if (at.animation === "ticker") {
      return (
        <div className="overflow-hidden w-full">
          <div style={{ whiteSpace: "nowrap", animation: "ticker 12s linear infinite", color: at.color || accentColor }}>
            <span className={`${sizeClass} font-bold`}>{at.text} &nbsp;&nbsp;&nbsp; {at.text} &nbsp;&nbsp;&nbsp; {at.text}</span>
          </div>
        </div>
      );
    }
    return <p className={`${sizeClass} font-bold`} style={style}>{at.text}</p>;
  };

  const ProductCard = ({ p }: { p: any }) => (
    <div className="group cursor-pointer" onClick={() => { setSelectedProduct(p); setCurrentImgIdx(0); }} data-testid={`card-product-${p.id}`}>
      <div className="relative overflow-hidden rounded-2xl" style={{ background: cardBg, backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="relative overflow-hidden">
          {p.image1 ? <img src={p.image1} className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="w-full h-64 bg-white/5 flex items-center justify-center text-gray-600">No Image</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {p.isSoldOut && <div className="absolute top-3 left-3 bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">SOLD OUT</div>}
          {p.isNew && <div className="absolute top-3 right-3 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">NEW</div>}
          {discount(p) > 0 && <div className="absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm" style={{ background: `${accentColor}dd` }}>-{discount(p)}%</div>}
        </div>
        <div className="p-4">
          <AnimatedText at={p.animatedText} />
          <h3 className="font-semibold text-white text-sm mt-1 line-clamp-2">{p.name}</h3>
          {p.material && <p className="text-xs text-gray-400 mt-1">{p.material}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold" style={{ color: accentColor }}>{currency} {Number(p.price).toLocaleString()}</span>
            {p.wasPrice && <span className="text-sm text-gray-500 line-through">{currency} {Number(p.wasPrice).toLocaleString()}</span>}
          </div>
          {p.dimensions && <p className="text-xs text-gray-500 mt-1">{p.dimensions}</p>}
          {!p.isSoldOut && (
            <Button className="w-full mt-3 font-medium" style={{ background: `${primaryColor}cc`, backdropFilter: "blur(10px)" }}
              onClick={e => { e.stopPropagation(); addToCart(p); }} data-testid={`button-add-cart-${p.id}`}>
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}ee 50%, ${bgColor} 100%)` }}>
      <style>{`
        @keyframes ticker { from { transform: translateX(100%); } to { transform: translateX(-200%); } }
        @keyframes glow { 0%,100% { text-shadow: 0 0 10px currentColor; } 50% { text-shadow: 0 0 30px currentColor, 0 0 60px currentColor; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes spring { 0% { transform: scale(0.3); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        .glass-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); }
      `}</style>

      <header className="sticky top-0 z-50" style={{ background: `${bgColor}ee`, backdropFilter: "blur(30px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logo ? <img src={brand.logo} className="h-12 w-12 rounded-xl object-cover" /> : null}
            <h1 className="text-xl font-bold text-white">{brand.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search furniture..."
                className="pl-10 w-64 bg-white/5 border-white/10 text-white rounded-full" data-testid="input-search" />
            </div>
            <button onClick={() => setShowCart(true)} className="relative p-2 rounded-full transition-all hover:bg-white/10" data-testid="button-open-cart">
              <ShoppingCart className="h-6 w-6 text-white" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-bold" style={{ background: accentColor }}>{cart.reduce((s, c) => s + c.quantity, 0)}</span>}
            </button>
          </div>
        </div>
      </header>

      {banners.length > 0 && (
        <div className="relative overflow-hidden" style={{ height: "400px" }}>
          {banners.map((b: any, i: number) => (
            <div key={i} className={`absolute inset-0 transition-all duration-1000 ${i === sliderIdx ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}>
              {(typeof b === "string" ? b : b.imageUrl) && <img src={typeof b === "string" ? b : b.imageUrl} className="w-full h-full object-cover" />}
              <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${bgColor}33, ${bgColor}cc)` }} />
              {typeof b !== "string" && b.text && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="text-4xl md:text-6xl font-bold text-white text-center drop-shadow-2xl" style={{ textShadow: `0 0 30px ${accentColor}88` }}>{b.text}</h2>
                </div>
              )}
            </div>
          ))}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_: any, i: number) => (
                <button key={i} onClick={() => setSliderIdx(i)} className={`w-3 h-3 rounded-full transition-all ${i === sliderIdx ? "scale-125" : "bg-white/30"}`} style={i === sliderIdx ? { background: accentColor } : {}} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setSelectedCat(null)}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${!selectedCat ? "text-white shadow-lg" : "text-gray-400 glass-card hover:text-white"}`}
            style={!selectedCat ? { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` } : {}}>
            All
          </button>
          {mainCats.map((c: any) => (
            <button key={c.id} onClick={() => setSelectedCat(c.id)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedCat === c.id ? "text-white shadow-lg" : "text-gray-400 glass-card hover:text-white"}`}
              style={selectedCat === c.id ? { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` } : {}}>
              {c.name}
            </button>
          ))}
        </div>

        {selectedCat && subCats(selectedCat).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {subCats(selectedCat).map((sc: any) => (
              <button key={sc.id} onClick={() => setSelectedCat(sc.id)}
                className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-300 glass-card hover:text-white transition-all">
                {sc.name}
              </button>
            ))}
          </div>
        )}

        {!selectedCat && !searchQuery && featuredProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6" style={{ animation: "fadeIn 1s" }}>Featured</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featuredProducts.slice(0, 4).map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {!selectedCat && !searchQuery && saleProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: accentColor, animation: "glow 3s infinite" }}>Sale</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {saleProducts.slice(0, 4).map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {!selectedCat && !searchQuery && newProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">New Arrivals</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {newProducts.slice(0, 4).map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        <div className="mb-12">
          {(selectedCat || searchQuery) && <h2 className="text-2xl font-bold text-white mb-6">{searchQuery ? `Search: "${searchQuery}"` : categories.find((c: any) => c.id === selectedCat)?.name || "All Products"} ({filteredProducts.length})</h2>}
          {!selectedCat && !searchQuery && <h2 className="text-2xl font-bold text-white mb-6">All Products</h2>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((p: any) => <ProductCard key={p.id} p={p} />)}
          </div>
          {filteredProducts.length === 0 && <p className="text-center text-gray-500 py-12">No products found</p>}
        </div>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-white/10" style={{ background: bgColor, color: "white" }}>
          {selectedProduct && (() => {
            const imgs = productImages(selectedProduct);
            return (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  {imgs.length > 0 ? (
                    <div className="relative">
                      <img src={imgs[currentImgIdx]} className="w-full h-80 object-cover rounded-xl" />
                      {imgs.length > 1 && (
                        <>
                          <button onClick={() => setCurrentImgIdx(p => (p - 1 + imgs.length) % imgs.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"><ChevronLeft className="h-4 w-4" /></button>
                          <button onClick={() => setCurrentImgIdx(p => (p + 1) % imgs.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"><ChevronRight className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  ) : <div className="w-full h-80 bg-white/5 rounded-xl flex items-center justify-center text-gray-600">No Image</div>}
                  {imgs.length > 1 && (
                    <div className="flex gap-2 mt-3">
                      {imgs.map((img: string, i: number) => (
                        <img key={i} src={img} onClick={() => setCurrentImgIdx(i)} className={`w-16 h-16 object-cover rounded-lg cursor-pointer transition-all ${i === currentImgIdx ? "ring-2 opacity-100" : "opacity-50"}`} style={i === currentImgIdx ? { ["--tw-ring-color" as any]: accentColor } : {}} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <AnimatedText at={selectedProduct.animatedText} />
                  <h2 className="text-2xl font-bold mt-2">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-3xl font-bold" style={{ color: accentColor }}>{currency} {Number(selectedProduct.price).toLocaleString()}</span>
                    {selectedProduct.wasPrice && (
                      <span className="text-lg text-gray-500 line-through">{currency} {Number(selectedProduct.wasPrice).toLocaleString()}</span>
                    )}
                    {discount(selectedProduct) > 0 && <span className="px-2 py-1 rounded-full text-xs font-bold text-white" style={{ background: accentColor }}>-{discount(selectedProduct)}%</span>}
                  </div>
                  {selectedProduct.material && <p className="text-sm text-gray-400 mt-3"><span className="font-medium text-gray-300">Material:</span> {selectedProduct.material}</p>}
                  {selectedProduct.color && <p className="text-sm text-gray-400"><span className="font-medium text-gray-300">Color:</span> {selectedProduct.color}</p>}
                  {selectedProduct.dimensions && <p className="text-sm text-gray-400"><span className="font-medium text-gray-300">Dimensions:</span> {selectedProduct.dimensions}</p>}
                  {selectedProduct.weight && <p className="text-sm text-gray-400"><span className="font-medium text-gray-300">Weight:</span> {selectedProduct.weight}</p>}
                  {selectedProduct.description && <div className="mt-4"><h4 className="text-sm font-semibold text-gray-300 mb-1">Description</h4><p className="text-sm text-gray-400 leading-relaxed">{selectedProduct.description}</p></div>}
                  {selectedProduct.specifications && <div className="mt-3"><h4 className="text-sm font-semibold text-gray-300 mb-1">Specifications</h4><p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{selectedProduct.specifications}</p></div>}
                  {selectedProduct.isSoldOut ? (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center"><p className="text-red-400 font-bold">Currently Sold Out</p></div>
                  ) : (
                    <Button className="w-full mt-4 h-12 font-bold text-white rounded-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                      onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} data-testid="button-add-to-cart-detail">
                      Add to Cart — {currency} {Number(selectedProduct.price).toLocaleString()}
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-white/10" style={{ background: bgColor, color: "white" }}>
          <DialogHeader><DialogTitle className="text-white">Shopping Cart ({cart.reduce((s, c) => s + c.quantity, 0)})</DialogTitle></DialogHeader>
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-3 border-b border-white/10">
              {item.image1 && <img src={item.image1} className="w-16 h-16 object-cover rounded-lg" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-sm" style={{ color: accentColor }}>{currency} {Number(item.price).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"><Minus className="h-3 w-3" /></button>
                <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                <button onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"><Plus className="h-3 w-3" /></button>
                <button onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))} className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400"><X className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
          {cart.length > 0 && (
            <div className="pt-3">
              <div className="flex justify-between text-lg font-bold text-white"><span>Total</span><span style={{ color: accentColor }}>{currency} {cartTotal.toLocaleString()}</span></div>
              <Button className="w-full mt-4 h-12 font-bold rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                onClick={() => { setShowCart(false); setShowCheckout(true); }} data-testid="button-checkout">
                Checkout
              </Button>
            </div>
          )}
          {cart.length === 0 && <p className="text-center text-gray-500 py-8">Your cart is empty</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-white/10" style={{ background: bgColor, color: "white" }}>
          <DialogHeader><DialogTitle className="text-white">Checkout</DialogTitle></DialogHeader>
          {(() => {
            const pm: any = brand?.paymentMethods || {};
            const totalAmount = (cartTotal + Number(brand?.deliveryFee || 0)).toLocaleString();
            const qrUrl = (details: string) => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(details)}`;
            return (
              <div className="grid gap-3">
                {[
                  { label: "Full Name *", key: "customerName" }, { label: "Phone *", key: "customerPhone" },
                  { label: "Email", key: "customerEmail" }, { label: "Delivery Address *", key: "customerAddress" },
                  { label: "City *", key: "customerCity" },
                ].map(f => (
                  <div key={f.key}><Label className="text-gray-300">{f.label}</Label><Input value={(checkoutForm as any)[f.key]} onChange={e => setCheckoutForm({ ...checkoutForm, [f.key]: e.target.value })} className="bg-white/5 border-white/10 text-white" /></div>
                ))}
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between text-sm text-gray-300 mb-1"><span>Subtotal</span><span>{currency} {cartTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1"><span>Delivery</span><span>{currency} {brand?.deliveryFee || "0"}</span></div>
                  <div className="flex justify-between text-lg font-bold text-white border-t border-white/10 pt-2 mt-2"><span>Total</span><span style={{ color: accentColor }}>{currency} {totalAmount}</span></div>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <Label className="text-sm font-semibold text-gray-300 mb-3 block">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(pm.cashEnabled !== false) && (
                      <button onClick={() => setPaymentMethod("cod")} className={`p-3 rounded-xl text-left transition-all glass-card ${paymentMethod === "cod" ? "ring-2" : ""}`} style={paymentMethod === "cod" ? { ["--tw-ring-color" as any]: accentColor } : {}}>
                        <span className="text-lg">💵</span><p className="text-sm font-medium text-white mt-1">Cash</p>
                      </button>
                    )}
                    {pm.cardEnabled && (
                      <button onClick={() => setPaymentMethod("card")} className={`p-3 rounded-xl text-left transition-all glass-card ${paymentMethod === "card" ? "ring-2" : ""}`} style={paymentMethod === "card" ? { ["--tw-ring-color" as any]: accentColor } : {}}>
                        <span className="text-lg">💳</span><p className="text-sm font-medium text-white mt-1">Card</p>
                      </button>
                    )}
                    {pm.jazzCashEnabled && (
                      <button onClick={() => setPaymentMethod("jazzcash")} className={`p-3 rounded-xl text-left transition-all glass-card ${paymentMethod === "jazzcash" ? "ring-2" : ""}`} style={paymentMethod === "jazzcash" ? { ["--tw-ring-color" as any]: accentColor } : {}}>
                        <span className="text-lg">📱</span><p className="text-sm font-medium text-white mt-1">JazzCash</p>
                      </button>
                    )}
                    {pm.easyPaisaEnabled && (
                      <button onClick={() => setPaymentMethod("easypaisa")} className={`p-3 rounded-xl text-left transition-all glass-card ${paymentMethod === "easypaisa" ? "ring-2" : ""}`} style={paymentMethod === "easypaisa" ? { ["--tw-ring-color" as any]: accentColor } : {}}>
                        <span className="text-lg">📲</span><p className="text-sm font-medium text-white mt-1">EasyPaisa</p>
                      </button>
                    )}
                    {pm.bankEnabled && (
                      <button onClick={() => setPaymentMethod("bank")} className={`p-3 rounded-xl text-left transition-all glass-card ${paymentMethod === "bank" ? "ring-2" : ""}`} style={paymentMethod === "bank" ? { ["--tw-ring-color" as any]: accentColor } : {}}>
                        <span className="text-lg">🏦</span><p className="text-sm font-medium text-white mt-1">Bank</p>
                      </button>
                    )}
                  </div>
                </div>
                {paymentMethod === "jazzcash" && pm.jazzCashName && (
                  <div className="glass-card rounded-xl p-4"><h4 className="font-bold text-sm mb-2" style={{ color: accentColor }}>JazzCash Details</h4>
                    <div className="flex gap-4"><div className="flex-1 space-y-1 text-sm text-gray-300"><p>Name: {pm.jazzCashName}</p><p>Number: {pm.jazzCashNumber}</p><p className="font-bold text-white">Amount: {currency} {totalAmount}</p>
                      <button onClick={() => { navigator.clipboard.writeText(pm.jazzCashNumber); toast({ title: "Copied!" }); }} className="text-xs underline" style={{ color: accentColor }}>Copy Number</button>
                    </div><img src={qrUrl(`JazzCash: ${pm.jazzCashName} | ${pm.jazzCashNumber}`)} className="w-20 h-20 rounded" /></div>
                  </div>
                )}
                {paymentMethod === "easypaisa" && pm.easyPaisaName && (
                  <div className="glass-card rounded-xl p-4"><h4 className="font-bold text-sm mb-2" style={{ color: accentColor }}>EasyPaisa Details</h4>
                    <div className="flex gap-4"><div className="flex-1 space-y-1 text-sm text-gray-300"><p>Name: {pm.easyPaisaName}</p><p>Number: {pm.easyPaisaNumber}</p><p className="font-bold text-white">Amount: {currency} {totalAmount}</p>
                      <button onClick={() => { navigator.clipboard.writeText(pm.easyPaisaNumber); toast({ title: "Copied!" }); }} className="text-xs underline" style={{ color: accentColor }}>Copy Number</button>
                    </div><img src={qrUrl(`EasyPaisa: ${pm.easyPaisaName} | ${pm.easyPaisaNumber}`)} className="w-20 h-20 rounded" /></div>
                  </div>
                )}
                {paymentMethod === "bank" && pm.bankName && (
                  <div className="glass-card rounded-xl p-4"><h4 className="font-bold text-sm mb-2" style={{ color: accentColor }}>{pm.bankName}</h4>
                    <div className="flex gap-4"><div className="flex-1 space-y-1 text-sm text-gray-300"><p>Bank: {pm.bankName}</p><p>Name: {pm.bankAccountName}</p><p>Acc: {pm.bankAccountNumber}</p>{pm.bankIBAN && <p className="text-xs">IBAN: {pm.bankIBAN}</p>}<p className="font-bold text-white">Amount: {currency} {totalAmount}</p>
                      <button onClick={() => { navigator.clipboard.writeText(pm.bankAccountNumber); toast({ title: "Copied!" }); }} className="text-xs underline" style={{ color: accentColor }}>Copy Account</button>
                    </div><img src={qrUrl(`${pm.bankName} | ${pm.bankAccountName} | ${pm.bankAccountNumber}`)} className="w-20 h-20 rounded" /></div>
                  </div>
                )}
                <Button className="w-full h-12 font-bold rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  disabled={!checkoutForm.customerName || !checkoutForm.customerPhone || !checkoutForm.customerAddress || !checkoutForm.customerCity}
                  onClick={() => placeOrder.mutate()} data-testid="button-place-order">
                  PLACE ORDER
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <footer style={{ background: `${bgColor}`, borderTop: "1px solid rgba(255,255,255,0.06)" }} className="py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {brand.logo ? <img src={brand.logo} className="h-12 object-contain" /> : <span className="text-xl font-bold text-white">{brand.name}</span>}
              </div>
              {brand.description && <p className="text-sm text-gray-400">{brand.description}</p>}
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Contact</h3>
              {brand.phone && <p className="text-sm text-gray-400 flex items-center gap-2 mb-2"><Phone className="h-4 w-4" style={{ color: accentColor }} />{brand.phone}</p>}
              {brand.email && <p className="text-sm text-gray-400 flex items-center gap-2 mb-2"><Mail className="h-4 w-4" style={{ color: accentColor }} />{brand.email}</p>}
              {brand.address && <p className="text-sm text-gray-400 flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: accentColor }} />{brand.address}{brand.city && `, ${brand.city}`}</p>}
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Opening Hours</h3>
              {(() => {
                const hours: any = brand.openingHours || {};
                return ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
                  <div key={day} className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{day}</span>
                    <span>{hours[day]?.closed ? "Closed" : `${hours[day]?.open || "09:00"} - ${hours[day]?.close || "18:00"}`}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
          {(brand.address || brand.city) && (
            <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <iframe width="100%" height="250" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent([brand.address, brand.city, brand.country].filter(Boolean).join(", "))}&output=embed`} />
            </div>
          )}
          <p className="text-xs text-gray-600 text-center">Powered by Link24</p>
        </div>
      </footer>
    </div>
  );
}
