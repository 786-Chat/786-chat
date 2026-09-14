import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ShoppingCart, ArrowLeft, Store, FolderTree, Layers, Grid3X3, Package, 
  ImagePlus, Plus, Trash2, Edit2, Save, X, ChevronRight, Upload, Clipboard,
  Search, BarChart3, Bell, Truck, MapPin, Phone, User, Clock, Eye,
  Check, CheckCircle, XCircle, Car, Bike, Copy, Palette, Settings, ExternalLink,
  Globe, LayoutDashboard, Mail, DollarSign, CreditCard, Building2, Landmark, Wallet,
  FileText, ChevronDown, AlertTriangle, Megaphone, ListChecks, Leaf, Apple, Calculator,
  Award, Thermometer, MapPin as MapPinIcon, Factory, Info, Loader2, ClipboardPaste, Film, Sparkles, Users, UserPlus, Shield, ToggleLeft, ToggleRight, Video, Briefcase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, RefreshCw } from "lucide-react";
import AdminMarketingStaff from "@/components/admin-marketing-staff";

type Branch = { id: string; name: string; slug: string; country: string; currency: string; branchNumber: number; status: string; themeColor: string; loginUsername: string | null; loginPassword: string | null; logo: string | null; address: string | null; phone: string | null; email: string | null; deliveryCharge: string; freeDeliveryThreshold: string; discountThreshold: string; discountPercent: string; welcomeTitle: string | null; welcomeSubtitle: string | null; welcomeCtaText: string | null; welcomePostcodeEnabled: boolean | null; welcomeBackgroundType: string | null; welcomeBackgroundImageUrl: string | null; welcomeBackgroundVideoUrl: string | null; welcomeSliderImages: string[] | null; heroAnimationStyle: string | null; heroSlideInterval: number | null; fontFamily: string | null; titleFontSize: string | null; subtitleFontSize: string | null; primaryColor: string | null; secondaryColor: string | null; accentColor: string | null; categoryCardStyle: string | null; menuCardStyle: string | null; headerBgColor: string | null; footerText: string | null; stripePublishableKey: string | null; stripeSecretKey: string | null; stripeAccountId: string | null; sumupApiKey: string | null; sumupMerchantCode: string | null; squareAccessToken: string | null; squareLocationId: string | null; zettleApiKey: string | null; zettleMerchantId: string | null; easypaisaAccountNumber: string | null; easypaisaAccountName: string | null; jazzcashAccountNumber: string | null; jazzcashAccountName: string | null; hblAccountNumber: string | null; hblAccountName: string | null; hblIban: string | null; ublAccountNumber: string | null; ublAccountName: string | null; ublIban: string | null; webAddressType: string | null; customSubdomain: string | null; customDomain: string | null; categoryBgType: string | null; categoryBgColor: string | null; categoryBgImages: string[] | null; categoryBgVideo: string | null; categoryBgAnimation: string | null; categoryBgAnimationSpeed: number | null; storeLanguage: string | null; serviceAreaType: string | null; serviceAreaValue: string | null; meezanAccountNumber: string | null; meezanAccountName: string | null; meezanIban: string | null; alfalahAccountNumber: string | null; alfalahAccountName: string | null; alfalahIban: string | null; mcbAccountNumber: string | null; mcbAccountName: string | null; mcbIban: string | null; alliedAccountNumber: string | null; alliedAccountName: string | null; alliedIban: string | null; sadapayAccountNumber: string | null; sadapayAccountName: string | null; nayapayAccountNumber: string | null; nayapayAccountName: string | null; };
type MainCategory = { id: string; branchId: string; name: string; image: string | null; gif: string | null; displayOrder: number; color: string; };
type SubCategory = { id: string; branchId: string; mainCategoryId: string; name: string; image: string | null; gif: string | null; video: string | null; displayOrder: number; };
type SubSubCategory = { id: string; branchId: string; subCategoryId: string; name: string; image: string | null; gif: string | null; video: string | null; displayOrder: number; };
type Product = { id: string; branchId: string; mainCategoryId: string; subCategoryId: string | null; subSubCategoryId: string | null; name: string; description: string | null; details: string | null; barcode: string | null; image1: string | null; image2: string | null; video: string | null; wasPrice: string | null; nowPrice: string; expiryDate: string | null; stockQuantity: number; unit: string; weight: string | null; calories: string | null; allergyAdvice: string | null; productMarketing: string | null; features: string | null; lifestyle: string | null; ingredients: string | null; calculatedNutrition: string | null; nutritionalClaims: string | null; storageUsage: string | null; storageType: string | null; country: string | null; companyName: string | null; companyAddress: string | null; manufacturer: string | null; moreInformation: string | null; nutrition: string | null; disclaimer: string | null; isAvailable: boolean; isFeatured: boolean; };

type GroceryOrder = { id: string; branchId: string; customerName: string; customerPhone: string | null; customerEmail: string | null; customerAddress: string | null; status: string; subtotal: string; deliveryCharge: string; discount: string; total: string; paymentMethod: string; stripePaymentStatus: string | null; notes: string | null; createdAt: string; };
type GroceryOrderItem = { id: string; orderId: string; productName: string; productImage: string | null; price: string; quantity: number; total: string; };
type GroceryDriver = { id: string; branchId: string; name: string; phone: string; vehicleType: string; vehiclePlate: string | null; isActive: boolean; isOnDuty: boolean; lastLocationLat: string | null; lastLocationLng: string | null; lastSeen: string | null; };

const sidebarItems = [
  { id: "branches", icon: Store, label: "Branches" },
  { id: "main-categories", icon: FolderTree, label: "Main Categories" },
  { id: "sub-categories", icon: Layers, label: "Sub Categories" },
  { id: "sub-sub-categories", icon: Grid3X3, label: "Sub+Sub Categories" },
  { id: "products", icon: Package, label: "Products" },
  { id: "paste-products", icon: ClipboardPaste, label: "Paste Products" },
  { id: "images", icon: ImagePlus, label: "Images Paste" },
  { id: "product-info", icon: FileText, label: "Information Product" },
  { id: "overview", icon: BarChart3, label: "Overview" },
  { id: "category-layout", icon: LayoutDashboard, label: "Main Category Layout" },
  { id: "welcome-branding", icon: Palette, label: "Welcome & Branding" },
  { id: "staff", icon: Users, label: "Staff Management" },
  { id: "marketing-staff", icon: Briefcase, label: "Marketing Staff" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function apiCall(url: string, method = "GET", body?: any) {
  return fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
}

export default function GroceryAdmin() {
  const [activeTab, setActiveTab] = useState("branches");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedMainCat, setSelectedMainCat] = useState<string>("");
  const [selectedSubCat, setSelectedSubCat] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: branches = [] } = useQuery<Branch[]>({ queryKey: ["/api/grocery/branches"], queryFn: () => apiCall("/api/grocery/branches") });
  const { data: mainCategories = [] } = useQuery<MainCategory[]>({ queryKey: ["/api/grocery/main-categories", selectedBranch], queryFn: () => apiCall(`/api/grocery/main-categories/${selectedBranch}`), enabled: !!selectedBranch });
  const { data: subCategories = [] } = useQuery<SubCategory[]>({ queryKey: ["/api/grocery/sub-categories", selectedMainCat], queryFn: () => apiCall(`/api/grocery/sub-categories/${selectedMainCat}`), enabled: !!selectedMainCat });
  const { data: subSubCategories = [] } = useQuery<SubSubCategory[]>({ queryKey: ["/api/grocery/sub-sub-categories", selectedSubCat], queryFn: () => apiCall(`/api/grocery/sub-sub-categories/${selectedSubCat}`), enabled: !!selectedSubCat });
  const { data: products = [] } = useQuery<Product[]>({ 
    queryKey: ["/api/grocery/products", selectedBranch, selectedMainCat, selectedSubCat], 
    queryFn: () => {
      let url = `/api/grocery/products/${selectedBranch}?`;
      if (selectedMainCat) url += `mainCategoryId=${selectedMainCat}&`;
      if (selectedSubCat) url += `subCategoryId=${selectedSubCat}`;
      return apiCall(url);
    },
    enabled: !!selectedBranch 
  });

  const renderSidebar = (isMobile = false) => (
    <>
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Grocery</h1>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map(item => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className="w-full justify-start gap-3"
            onClick={() => { setActiveTab(item.id); if (isMobile) setMobileMenuOpen(false); }}
            data-testid={`grocery-nav-${item.id}`}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Link href="/portal">
          <Button variant="outline" className="w-full gap-2" data-testid="button-back-grocery">
            <ArrowLeft className="h-4 w-4" /> Back to Portal
          </Button>
        </Link>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-background font-sans flex overflow-hidden">
      <aside className="w-64 border-r bg-card hidden md:flex flex-col h-screen sticky top-0">
        {renderSidebar()}
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b bg-card px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col h-full overflow-hidden">
                {renderSidebar(true)}
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-bold capitalize">{activeTab.replace(/-/g, " ")}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedBranch} onValueChange={(v) => { setSelectedBranch(v); setSelectedMainCat(""); setSelectedSubCat(""); }}>
              <SelectTrigger className="w-[200px]" data-testid="select-grocery-branch">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6">
          {activeTab === "branches" && <BranchesTab branches={branches} qc={qc} toast={toast} />}
          {activeTab === "main-categories" && <MainCategoriesTab selectedBranch={selectedBranch} mainCategories={mainCategories} qc={qc} toast={toast} />}
          {activeTab === "sub-categories" && <SubCategoriesTab selectedBranch={selectedBranch} selectedMainCat={selectedMainCat} setSelectedMainCat={setSelectedMainCat} mainCategories={mainCategories} subCategories={subCategories} qc={qc} toast={toast} />}
          {activeTab === "sub-sub-categories" && <SubSubCategoriesTab selectedBranch={selectedBranch} selectedMainCat={selectedMainCat} setSelectedMainCat={setSelectedMainCat} selectedSubCat={selectedSubCat} setSelectedSubCat={setSelectedSubCat} mainCategories={mainCategories} subCategories={subCategories} subSubCategories={subSubCategories} qc={qc} toast={toast} />}
          {activeTab === "products" && <ProductsTab selectedBranch={selectedBranch} selectedMainCat={selectedMainCat} setSelectedMainCat={setSelectedMainCat} selectedSubCat={selectedSubCat} setSelectedSubCat={setSelectedSubCat} mainCategories={mainCategories} subCategories={subCategories} subSubCategories={subSubCategories} products={products} qc={qc} toast={toast} />}
          {activeTab === "paste-products" && <PasteProductsTab selectedBranch={selectedBranch} qc={qc} toast={toast} />}
          {activeTab === "images" && <ImagesPasteTab selectedBranch={selectedBranch} qc={qc} toast={toast} />}
          {activeTab === "product-info" && <ProductInfoTab branches={branches} selectedBranch={selectedBranch} setSelectedBranch={(v: string) => { setSelectedBranch(v); setSelectedMainCat(""); setSelectedSubCat(""); }} qc={qc} toast={toast} />}
          {activeTab === "overview" && <OverviewTab branches={branches} selectedBranch={selectedBranch} mainCategories={mainCategories} subCategories={subCategories} products={products} />}
          {activeTab === "category-layout" && <CategoryLayoutTab selectedBranch={selectedBranch} branches={branches} qc={qc} toast={toast} />}
          {activeTab === "welcome-branding" && <WelcomeBrandingTab selectedBranch={selectedBranch} branches={branches} qc={qc} toast={toast} />}
          {activeTab === "staff" && <StaffManagementTab selectedBranch={selectedBranch} branches={branches} qc={qc} toast={toast} />}
          {activeTab === "marketing-staff" && <AdminMarketingStaff />}
          {activeTab === "settings" && <SettingsTab selectedBranch={selectedBranch} branches={branches} qc={qc} toast={toast} />}
        </div>
      </main>
    </div>
  );
}

function BranchPaymentConfigDialog({ branch, open, onClose, qc, toast }: { branch: Branch; open: boolean; onClose: () => void; qc: any; toast: any }) {
  const [tab, setTab] = useState<"stripe" | "readers" | "pakistan" | "banks" | "web" | "logo">("stripe");
  const [stripeAccountId, setStripeAccountId] = useState(branch.stripeAccountId || "");
  const [stripePublishableKey, setStripePublishableKey] = useState(branch.stripePublishableKey || "");
  const [stripeSecretKey, setStripeSecretKey] = useState(branch.stripeSecretKey || "");
  const [sumupApiKey, setSumupApiKey] = useState(branch.sumupApiKey || "");
  const [sumupMerchantCode, setSumupMerchantCode] = useState(branch.sumupMerchantCode || "");
  const [squareAccessToken, setSquareAccessToken] = useState(branch.squareAccessToken || "");
  const [squareLocationId, setSquareLocationId] = useState(branch.squareLocationId || "");
  const [zettleApiKey, setZettleApiKey] = useState(branch.zettleApiKey || "");
  const [zettleMerchantId, setZettleMerchantId] = useState(branch.zettleMerchantId || "");
  const [easypaisaAccountNumber, setEasypaisaAccountNumber] = useState(branch.easypaisaAccountNumber || "");
  const [easypaisaAccountName, setEasypaisaAccountName] = useState(branch.easypaisaAccountName || "");
  const [jazzcashAccountNumber, setJazzcashAccountNumber] = useState(branch.jazzcashAccountNumber || "");
  const [jazzcashAccountName, setJazzcashAccountName] = useState(branch.jazzcashAccountName || "");
  const [hblAccountNumber, setHblAccountNumber] = useState(branch.hblAccountNumber || "");
  const [hblAccountName, setHblAccountName] = useState(branch.hblAccountName || "");
  const [hblIban, setHblIban] = useState(branch.hblIban || "");
  const [ublAccountNumber, setUblAccountNumber] = useState(branch.ublAccountNumber || "");
  const [ublAccountName, setUblAccountName] = useState(branch.ublAccountName || "");
  const [ublIban, setUblIban] = useState(branch.ublIban || "");
  const [meezanAccountNumber, setMeezanAccountNumber] = useState(branch.meezanAccountNumber || "");
  const [meezanAccountName, setMeezanAccountName] = useState(branch.meezanAccountName || "");
  const [meezanIban, setMeezanIban] = useState(branch.meezanIban || "");
  const [alfalahAccountNumber, setAlfalahAccountNumber] = useState(branch.alfalahAccountNumber || "");
  const [alfalahAccountName, setAlfalahAccountName] = useState(branch.alfalahAccountName || "");
  const [alfalahIban, setAlfalahIban] = useState(branch.alfalahIban || "");
  const [mcbAccountNumber, setMcbAccountNumber] = useState(branch.mcbAccountNumber || "");
  const [mcbAccountName, setMcbAccountName] = useState(branch.mcbAccountName || "");
  const [mcbIban, setMcbIban] = useState(branch.mcbIban || "");
  const [alliedAccountNumber, setAlliedAccountNumber] = useState(branch.alliedAccountNumber || "");
  const [alliedAccountName, setAlliedAccountName] = useState(branch.alliedAccountName || "");
  const [alliedIban, setAlliedIban] = useState(branch.alliedIban || "");
  const [sadapayAccountNumber, setSadapayAccountNumber] = useState(branch.sadapayAccountNumber || "");
  const [sadapayAccountName, setSadapayAccountName] = useState(branch.sadapayAccountName || "");
  const [nayapayAccountNumber, setNayapayAccountNumber] = useState(branch.nayapayAccountNumber || "");
  const [nayapayAccountName, setNayapayAccountName] = useState(branch.nayapayAccountName || "");
  const [webAddressType, setWebAddressType] = useState(branch.webAddressType || "default");
  const [customSubdomain, setCustomSubdomain] = useState(branch.customSubdomain || "");
  const [customDomain, setCustomDomain] = useState(branch.customDomain || "");
  const [logo, setLogo] = useState(branch.logo || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStripeAccountId(branch.stripeAccountId || "");
    setStripePublishableKey(branch.stripePublishableKey || "");
    setStripeSecretKey(branch.stripeSecretKey || "");
    setSumupApiKey(branch.sumupApiKey || "");
    setSumupMerchantCode(branch.sumupMerchantCode || "");
    setSquareAccessToken(branch.squareAccessToken || "");
    setSquareLocationId(branch.squareLocationId || "");
    setZettleApiKey(branch.zettleApiKey || "");
    setZettleMerchantId(branch.zettleMerchantId || "");
    setEasypaisaAccountNumber(branch.easypaisaAccountNumber || "");
    setEasypaisaAccountName(branch.easypaisaAccountName || "");
    setJazzcashAccountNumber(branch.jazzcashAccountNumber || "");
    setJazzcashAccountName(branch.jazzcashAccountName || "");
    setHblAccountNumber(branch.hblAccountNumber || "");
    setHblAccountName(branch.hblAccountName || "");
    setHblIban(branch.hblIban || "");
    setUblAccountNumber(branch.ublAccountNumber || "");
    setUblAccountName(branch.ublAccountName || "");
    setUblIban(branch.ublIban || "");
    setMeezanAccountNumber(branch.meezanAccountNumber || "");
    setMeezanAccountName(branch.meezanAccountName || "");
    setMeezanIban(branch.meezanIban || "");
    setAlfalahAccountNumber(branch.alfalahAccountNumber || "");
    setAlfalahAccountName(branch.alfalahAccountName || "");
    setAlfalahIban(branch.alfalahIban || "");
    setMcbAccountNumber(branch.mcbAccountNumber || "");
    setMcbAccountName(branch.mcbAccountName || "");
    setMcbIban(branch.mcbIban || "");
    setAlliedAccountNumber(branch.alliedAccountNumber || "");
    setAlliedAccountName(branch.alliedAccountName || "");
    setAlliedIban(branch.alliedIban || "");
    setSadapayAccountNumber(branch.sadapayAccountNumber || "");
    setSadapayAccountName(branch.sadapayAccountName || "");
    setNayapayAccountNumber(branch.nayapayAccountNumber || "");
    setNayapayAccountName(branch.nayapayAccountName || "");
    setWebAddressType(branch.webAddressType || "default");
    setCustomSubdomain(branch.customSubdomain || "");
    setCustomDomain(branch.customDomain || "");
    setLogo(branch.logo || "");
  }, [branch]);

  const handleLogoUpload = async (file: File) => {
    if (!/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file.name)) {
      toast({ title: "Only PNG, JPG, GIF, SVG, WebP allowed", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = await apiCall("/api/upload-image", "POST", { image: reader.result, filename: file.name });
      if (result.url) setLogo(result.url);
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    await apiCall(`/api/grocery/branches/${branch.id}`, "PATCH", {
      stripeAccountId: stripeAccountId || null,
      stripePublishableKey: stripePublishableKey || null,
      stripeSecretKey: stripeSecretKey || null,
      sumupApiKey: sumupApiKey || null,
      sumupMerchantCode: sumupMerchantCode || null,
      squareAccessToken: squareAccessToken || null,
      squareLocationId: squareLocationId || null,
      zettleApiKey: zettleApiKey || null,
      zettleMerchantId: zettleMerchantId || null,
      easypaisaAccountNumber: easypaisaAccountNumber || null,
      easypaisaAccountName: easypaisaAccountName || null,
      jazzcashAccountNumber: jazzcashAccountNumber || null,
      jazzcashAccountName: jazzcashAccountName || null,
      hblAccountNumber: hblAccountNumber || null,
      hblAccountName: hblAccountName || null,
      hblIban: hblIban || null,
      ublAccountNumber: ublAccountNumber || null,
      ublAccountName: ublAccountName || null,
      ublIban: ublIban || null,
      meezanAccountNumber: meezanAccountNumber || null,
      meezanAccountName: meezanAccountName || null,
      meezanIban: meezanIban || null,
      alfalahAccountNumber: alfalahAccountNumber || null,
      alfalahAccountName: alfalahAccountName || null,
      alfalahIban: alfalahIban || null,
      mcbAccountNumber: mcbAccountNumber || null,
      mcbAccountName: mcbAccountName || null,
      mcbIban: mcbIban || null,
      alliedAccountNumber: alliedAccountNumber || null,
      alliedAccountName: alliedAccountName || null,
      alliedIban: alliedIban || null,
      sadapayAccountNumber: sadapayAccountNumber || null,
      sadapayAccountName: sadapayAccountName || null,
      nayapayAccountNumber: nayapayAccountNumber || null,
      nayapayAccountName: nayapayAccountName || null,
      webAddressType,
      customSubdomain: customSubdomain || null,
      customDomain: customDomain || null,
      logo: logo || null,
    });
    qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
    toast({ title: "Configuration saved!" });
    onClose();
  };

  const tabs = [
    { id: "stripe" as const, label: "Stripe", icon: CreditCard },
    { id: "readers" as const, label: "Card Readers", icon: Wallet },
    { id: "pakistan" as const, label: "Pakistan", icon: Building2 },
    { id: "banks" as const, label: "Banks", icon: Landmark },
    { id: "web" as const, label: "Web Address", icon: Globe },
    { id: "logo" as const, label: "Logo", icon: ImagePlus },
  ];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            {branch.name} — Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5 mb-4 border-b pb-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.id ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} data-testid={`tab-config-${t.id}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "stripe" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter API keys from the customer's Stripe dashboard.</p>
            <div><Label>Stripe Account ID</Label><Input value={stripeAccountId} onChange={e => setStripeAccountId(e.target.value)} placeholder="acct_..." data-testid="input-stripe-account-id" /></div>
            <div><Label>Stripe Publishable Key</Label><Input value={stripePublishableKey} onChange={e => setStripePublishableKey(e.target.value)} placeholder="pk_live_..." data-testid="input-stripe-pub-key" /></div>
            <div><Label>Stripe Secret Key</Label><Input type="password" value={stripeSecretKey} onChange={e => setStripeSecretKey(e.target.value)} placeholder="sk_live_..." data-testid="input-stripe-secret-key" /></div>
          </div>
        )}

        {tab === "readers" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">If the branch uses SumUp, Square, or Zettle, add their API keys here.</p>
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">S</div><h4 className="font-semibold text-sm">SumUp</h4></div>
              <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">API Key</Label><Input value={sumupApiKey} onChange={e => setSumupApiKey(e.target.value)} placeholder="sup_sk_..." data-testid="input-sumup-api-key" /></div><div><Label className="text-xs">Merchant Code</Label><Input value={sumupMerchantCode} onChange={e => setSumupMerchantCode(e.target.value)} placeholder="MXXXXXXXX" data-testid="input-sumup-merchant-code" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xs">▢</div><h4 className="font-semibold text-sm">Square</h4></div>
              <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">Access Token</Label><Input value={squareAccessToken} onChange={e => setSquareAccessToken(e.target.value)} placeholder="EAAAl..." data-testid="input-square-access-token" /></div><div><Label className="text-xs">Location ID</Label><Input value={squareLocationId} onChange={e => setSquareLocationId(e.target.value)} placeholder="LXXXXXXXX" data-testid="input-square-location-id" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">Z</div><h4 className="font-semibold text-sm">Zettle (PayPal)</h4></div>
              <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">API Key</Label><Input value={zettleApiKey} onChange={e => setZettleApiKey(e.target.value)} placeholder="zettle_..." data-testid="input-zettle-api-key" /></div><div><Label className="text-xs">Merchant ID</Label><Input value={zettleMerchantId} onChange={e => setZettleMerchantId(e.target.value)} placeholder="Merchant ID" data-testid="input-zettle-merchant-id" /></div></div>
            </div>
          </div>
        )}

        {tab === "pakistan" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add EasyPaisa and JazzCash account details for Pakistani customers.</p>
            <div className="border rounded-lg p-3 space-y-2 border-green-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-[10px]">EP</div><h4 className="font-semibold text-sm text-green-800">EasyPaisa</h4></div>
              <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={easypaisaAccountNumber} onChange={e => setEasypaisaAccountNumber(e.target.value)} placeholder="03XX-XXXXXXX" data-testid="input-easypaisa-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={easypaisaAccountName} onChange={e => setEasypaisaAccountName(e.target.value)} placeholder="Account holder name" data-testid="input-easypaisa-account-name" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2 border-red-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-[10px]">JC</div><h4 className="font-semibold text-sm text-red-800">JazzCash</h4></div>
              <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={jazzcashAccountNumber} onChange={e => setJazzcashAccountNumber(e.target.value)} placeholder="03XX-XXXXXXX" data-testid="input-jazzcash-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={jazzcashAccountName} onChange={e => setJazzcashAccountName(e.target.value)} placeholder="Account holder name" data-testid="input-jazzcash-account-name" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2 border-teal-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-[10px]">SP</div><h4 className="font-semibold text-sm text-teal-800">SadaPay</h4></div>
              <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={sadapayAccountNumber} onChange={e => setSadapayAccountNumber(e.target.value)} placeholder="Account number" data-testid="input-sadapay-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={sadapayAccountName} onChange={e => setSadapayAccountName(e.target.value)} placeholder="Account holder name" data-testid="input-sadapay-account-name" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2 border-purple-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-[10px]">NP</div><h4 className="font-semibold text-sm text-purple-800">NayaPay</h4></div>
              <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={nayapayAccountNumber} onChange={e => setNayapayAccountNumber(e.target.value)} placeholder="Account number" data-testid="input-nayapay-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={nayapayAccountName} onChange={e => setNayapayAccountName(e.target.value)} placeholder="Account holder name" data-testid="input-nayapay-account-name" /></div></div>
            </div>
          </div>
        )}

        {tab === "banks" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Add bank account details for direct bank transfer payments.</p>
            <div className="border rounded-lg p-3 space-y-2 border-blue-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-[10px]">HBL</div><h4 className="font-semibold text-sm">HBL Bank</h4></div>
              <div className="grid grid-cols-3 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={hblAccountNumber} onChange={e => setHblAccountNumber(e.target.value)} placeholder="Account number" data-testid="input-hbl-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={hblAccountName} onChange={e => setHblAccountName(e.target.value)} placeholder="Account holder" data-testid="input-hbl-account-name" /></div><div><Label className="text-xs">IBAN</Label><Input value={hblIban} onChange={e => setHblIban(e.target.value)} placeholder="PK..." data-testid="input-hbl-iban" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2 border-indigo-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold text-[10px]">UBL</div><h4 className="font-semibold text-sm">UBL Bank</h4></div>
              <div className="grid grid-cols-3 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={ublAccountNumber} onChange={e => setUblAccountNumber(e.target.value)} placeholder="Account number" data-testid="input-ubl-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={ublAccountName} onChange={e => setUblAccountName(e.target.value)} placeholder="Account holder" data-testid="input-ubl-account-name" /></div><div><Label className="text-xs">IBAN</Label><Input value={ublIban} onChange={e => setUblIban(e.target.value)} placeholder="PK..." data-testid="input-ubl-iban" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2 border-green-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-[10px]">MBL</div><h4 className="font-semibold text-sm">Meezan Bank</h4></div>
              <div className="grid grid-cols-3 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={meezanAccountNumber} onChange={e => setMeezanAccountNumber(e.target.value)} placeholder="Account number" data-testid="input-meezan-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={meezanAccountName} onChange={e => setMeezanAccountName(e.target.value)} placeholder="Account holder" data-testid="input-meezan-account-name" /></div><div><Label className="text-xs">IBAN</Label><Input value={meezanIban} onChange={e => setMeezanIban(e.target.value)} placeholder="PK..." data-testid="input-meezan-iban" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2 border-red-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-red-700 flex items-center justify-center text-white font-bold text-[10px]">BAF</div><h4 className="font-semibold text-sm">Bank Alfalah</h4></div>
              <div className="grid grid-cols-3 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={alfalahAccountNumber} onChange={e => setAlfalahAccountNumber(e.target.value)} placeholder="Account number" data-testid="input-alfalah-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={alfalahAccountName} onChange={e => setAlfalahAccountName(e.target.value)} placeholder="Account holder" data-testid="input-alfalah-account-name" /></div><div><Label className="text-xs">IBAN</Label><Input value={alfalahIban} onChange={e => setAlfalahIban(e.target.value)} placeholder="PK..." data-testid="input-alfalah-iban" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2 border-yellow-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold text-[10px]">MCB</div><h4 className="font-semibold text-sm">MCB Bank</h4></div>
              <div className="grid grid-cols-3 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={mcbAccountNumber} onChange={e => setMcbAccountNumber(e.target.value)} placeholder="Account number" data-testid="input-mcb-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={mcbAccountName} onChange={e => setMcbAccountName(e.target.value)} placeholder="Account holder" data-testid="input-mcb-account-name" /></div><div><Label className="text-xs">IBAN</Label><Input value={mcbIban} onChange={e => setMcbIban(e.target.value)} placeholder="PK..." data-testid="input-mcb-iban" /></div></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2 border-cyan-200">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center text-white font-bold text-[10px]">ABL</div><h4 className="font-semibold text-sm">Allied Bank</h4></div>
              <div className="grid grid-cols-3 gap-2"><div><Label className="text-xs">Account Number</Label><Input value={alliedAccountNumber} onChange={e => setAlliedAccountNumber(e.target.value)} placeholder="Account number" data-testid="input-allied-account-number" /></div><div><Label className="text-xs">Account Name</Label><Input value={alliedAccountName} onChange={e => setAlliedAccountName(e.target.value)} placeholder="Account holder" data-testid="input-allied-account-name" /></div><div><Label className="text-xs">IBAN</Label><Input value={alliedIban} onChange={e => setAlliedIban(e.target.value)} placeholder="PK..." data-testid="input-allied-iban" /></div></div>
            </div>
          </div>
        )}

        {tab === "web" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose how customers access this branch's store online.</p>
            <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${webAddressType === "default" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setWebAddressType("default")} data-testid="option-web-default">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${webAddressType === "default" ? "border-green-500" : "border-gray-300"}`}>{webAddressType === "default" && <div className="w-2 h-2 rounded-full bg-green-500" />}</div>
                <div><h4 className="font-semibold text-sm">Use Default App URL</h4><p className="text-xs text-muted-foreground">Customer accesses via your main app URL</p><p className="text-[10px] font-mono text-green-700 bg-green-100 inline-block px-1.5 py-0.5 rounded mt-1">{window.location.origin}/grocery/{branch.slug}</p></div>
              </div>
            </div>
            <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${webAddressType === "subdomain" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setWebAddressType("subdomain")} data-testid="option-web-subdomain">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${webAddressType === "subdomain" ? "border-blue-500" : "border-gray-300"}`}>{webAddressType === "subdomain" && <div className="w-2 h-2 rounded-full bg-blue-500" />}</div>
                <div className="flex-1"><h4 className="font-semibold text-sm">Use link24.online Subdomain</h4><p className="text-xs text-muted-foreground">Professional subdomain - no setup needed!</p>
                  {webAddressType === "subdomain" && <div className="mt-2 flex items-center gap-1"><Input value={customSubdomain} onChange={e => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="branchname" className="max-w-[160px] h-8 text-sm" data-testid="input-subdomain" /><span className="text-xs font-mono text-blue-600">.link24.online</span></div>}
                </div>
              </div>
            </div>
            <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${webAddressType === "custom" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setWebAddressType("custom")} data-testid="option-web-custom">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${webAddressType === "custom" ? "border-orange-500" : "border-gray-300"}`}>{webAddressType === "custom" && <div className="w-2 h-2 rounded-full bg-orange-500" />}</div>
                <div className="flex-1"><h4 className="font-semibold text-sm">Customer's Own Domain</h4><p className="text-xs text-muted-foreground">Customer uses their own domain (DNS config needed)</p>
                  {webAddressType === "custom" && <div className="mt-2"><Input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="www.customerstore.com" className="h-8 text-sm" data-testid="input-custom-domain" /><p className="text-[10px] text-orange-600 mt-1">Customer must point their DNS CNAME record to your server.</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "logo" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload or paste the branch logo (PNG, JPG, GIF, SVG, WebP).</p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-shrink-0">
                {logo ? (
                  <div className="relative group">
                    <img src={logo} alt="Logo" className="h-24 w-24 rounded-2xl object-cover border-2 border-gray-200 shadow-md" />
                    <button onClick={() => setLogo("")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-testid="button-remove-logo"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"><ImagePlus className="h-8 w-8 text-gray-400" /></div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all" onClick={() => logoFileRef.current?.click()} onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-green-400", "bg-green-50"); }} onDragLeave={e => { e.currentTarget.classList.remove("border-green-400", "bg-green-50"); }} onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-green-400", "bg-green-50"); if (e.dataTransfer.files[0]) handleLogoUpload(e.dataTransfer.files[0]); }} data-testid="dropzone-logo">
                  <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">{logoUploading ? "Uploading..." : "Click or drag & drop"}</p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF, SVG, WebP</p>
                </div>
                <input ref={logoFileRef} type="file" accept=".png,.jpg,.jpeg,.gif,.svg,.webp" className="hidden" onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }} />
                <div><Label className="text-xs text-gray-500">Or paste logo URL</Label><Input value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://..." className="text-sm" data-testid="input-logo-url" /></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-save-config"><Save className="h-4 w-4" /> Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BranchesTab({ branches, qc, toast }: any) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("UK");
  const [currency, setCurrency] = useState("£");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoginUser, setEditLoginUser] = useState("");
  const [editLoginPass, setEditLoginPass] = useState("");
  const [dupId, setDupId] = useState<string | null>(null);
  const [dupName, setDupName] = useState("");
  const [configBranch, setConfigBranch] = useState<Branch | null>(null);

  const addBranch = async () => {
    if (!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const num = branches.length + 1;
    await apiCall("/api/grocery/branches", "POST", { name: name.trim(), slug, country, currency, branchNumber: num, loginUsername: loginUser.trim() || null, loginPassword: loginPass.trim() || null });
    setName(""); setLoginUser(""); setLoginPass("");
    qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
    toast({ title: "Branch created!" });
  };

  const deleteBranch = async (id: string) => {
    if (!confirm("Delete this branch and all its data?")) return;
    await apiCall(`/api/grocery/branches/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
    toast({ title: "Branch deleted" });
  };

  const saveName = async (id: string) => {
    await apiCall(`/api/grocery/branches/${id}`, "PATCH", { name: editName, loginUsername: editLoginUser || null, loginPassword: editLoginPass || null });
    setEditId(null);
    qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
  };

  const duplicateBranch = async (id: string) => {
    if (!dupName.trim()) return;
    const newSlug = dupName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await apiCall(`/api/grocery/branches/${id}/duplicate`, "POST", { newName: dupName.trim(), newSlug });
    setDupId(null);
    setDupName("");
    qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
    toast({ title: "Branch duplicated!" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Add New Branch</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Branch Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. UK Store 1" data-testid="input-branch-name" />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger data-testid="select-country"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="PK">Pakistan</SelectItem>
                  <SelectItem value="US">USA</SelectItem>
                  <SelectItem value="EU">Europe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="£">£ GBP</SelectItem>
                  <SelectItem value="Rs">Rs PKR</SelectItem>
                  <SelectItem value="$">$ USD</SelectItem>
                  <SelectItem value="€">€ EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Login Username (for branch owner)</Label>
              <Input value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="e.g. ukstore1" data-testid="input-branch-login-user" />
            </div>
            <div>
              <Label>Login Password</Label>
              <Input value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Set password" data-testid="input-branch-login-pass" />
            </div>
          </div>
          <Button onClick={addBranch} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-add-branch">
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {branches.map((b: Branch, i: number) => {
          const themeColor = b.themeColor || b.primaryColor || "#22c55e";
          return (
          <div key={b.id} className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group" style={{ background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}08, #ffffff)`, border: `2px solid ${themeColor}30` }} data-testid={`branch-card-${b.id}`}>
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(90deg, ${themeColor}, ${b.accentColor || "#60a5fa"}, ${themeColor})` }} />

            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
                    {b.logo ? <img src={b.logo} alt="" className="h-10 w-10 rounded-lg object-cover" /> : b.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {editId === b.id ? (
                      <div className="space-y-1.5">
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm w-40" placeholder="Branch name" data-testid={`input-edit-name-${b.id}`} />
                        <Input value={editLoginUser} onChange={e => setEditLoginUser(e.target.value)} className="h-7 text-sm w-40" placeholder="Login username" data-testid={`input-edit-user-${b.id}`} />
                        <Input value={editLoginPass} onChange={e => setEditLoginPass(e.target.value)} className="h-7 text-sm w-40" placeholder="Login password" data-testid={`input-edit-pass-${b.id}`} />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 px-2" onClick={() => saveName(b.id)} data-testid={`button-save-edit-${b.id}`}><Save className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditId(null)} data-testid={`button-cancel-edit-${b.id}`}><X className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-lg leading-tight flex items-center gap-2" data-testid={`text-branch-name-${b.id}`}>
                          {b.name}
                          {b.branchNumber && (
                            <span className="branch-id-animate text-xs font-black px-1.5 py-0.5 rounded-md" style={{ border: "1px solid rgba(79,172,254,0.3)" }}>
                              B{b.branchNumber}
                            </span>
                          )}
                          {b.serviceAreaType === "postcode" && b.serviceAreaValue && (
                            <span className="flex items-center gap-1">
                              {b.serviceAreaValue.split(",").slice(0, 3).map((pc: string, i: number) => {
                                const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6"];
                                return (
                                  <span key={pc.trim()} className="postcode-badge-animate text-[9px] font-bold px-1 py-0.5 rounded-full" style={{ background: colors[i % colors.length] + "20", color: colors[i % colors.length], border: `1px solid ${colors[i % colors.length]}40`, animationDelay: `${i * 0.15}s` }}>
                                    {pc.trim()}
                                  </span>
                                );
                              })}
                              {b.serviceAreaValue.split(",").length > 3 && (
                                <span className="text-[9px] text-muted-foreground">+{b.serviceAreaValue.split(",").length - 3}</span>
                              )}
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{b.address || b.slug}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Dialog open={dupId === b.id} onOpenChange={(open) => { if (!open) setDupId(null); }}>
                    <DialogTrigger asChild>
                      <button className="h-8 w-8 rounded-lg bg-white/80 hover:bg-white shadow-sm flex items-center justify-center transition-colors" onClick={() => { setDupId(b.id); setDupName(b.name + " Copy"); }} data-testid={`button-duplicate-branch-${b.id}`}>
                        <Copy className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Duplicate Branch</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>New Branch Name</Label>
                          <Input value={dupName} onChange={e => setDupName(e.target.value)} placeholder="Enter new branch name" data-testid="input-duplicate-branch-name" />
                        </div>
                        <Button onClick={() => duplicateBranch(b.id)} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-confirm-duplicate"><Copy className="h-4 w-4" /> Duplicate</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button className="h-8 w-8 rounded-lg bg-white/80 hover:bg-white shadow-sm flex items-center justify-center transition-colors" onClick={() => { setEditId(b.id); setEditName(b.name); setEditLoginUser(b.loginUsername || ""); setEditLoginPass(b.loginPassword || ""); }} data-testid={`button-edit-branch-${b.id}`}>
                    <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                  <button className="h-8 w-8 rounded-lg bg-white/80 hover:bg-red-50 shadow-sm flex items-center justify-center transition-colors" onClick={() => deleteBranch(b.id)} data-testid={`button-delete-branch-${b.id}`}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  className="text-white text-xs font-semibold px-2.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: b.status === "open" ? themeColor : "#9ca3af" }}
                  onClick={async () => {
                    const newStatus = b.status === "open" ? "closed" : "open";
                    await apiCall(`/api/grocery/branches/${b.id}`, "PATCH", { status: newStatus });
                    qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
                    toast({ title: `Branch ${newStatus === "open" ? "opened" : "closed"}!` });
                  }}
                  data-testid={`badge-status-${b.id}`}
                >
                  {b.status === "open" ? "Open" : "Closed"}
                </Badge>
                <Badge variant="outline" className="text-xs gap-1 bg-white/60 font-mono">
                  #{b.branchNumber || i + 1} · {b.country} · {b.currency}
                </Badge>
              </div>

              {b.address && (
                <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground bg-white/40 rounded-lg px-3 py-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
                  <span>{b.address}</span>
                </div>
              )}

              {(b.phone || b.email) && (
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
                  {b.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.phone}</span>}
                  {b.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{b.email}</span>}
                </div>
              )}

              {b.loginUsername && editId !== b.id && (
                <div className="text-xs text-muted-foreground bg-white/40 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-2">
                  <User className="h-3 w-3" /> Login: <span className="font-mono font-medium">{b.loginUsername}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                <Button className="flex-1 gap-2 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }} onClick={() => { localStorage.setItem("groceryBranchOwnerId", b.id); localStorage.setItem("groceryBranchOwnerName", b.name); localStorage.setItem("groceryBranchOwnerSlug", b.slug); localStorage.setItem("groceryBranchOwnerCurrency", b.currency); window.open("/grocery-branch-dashboard", "_blank"); }} data-testid={`button-dashboard-${b.id}`}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>
                <a href={`/grocery/${b.slug}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 rounded-xl font-semibold border-2 hover:shadow-md transition-all" style={{ borderColor: `${themeColor}50`, color: themeColor }} data-testid={`button-view-store-${b.id}`}>
                    <Globe className="h-4 w-4" /> View Webapp
                  </Button>
                </a>
              </div>
              <Button variant="outline" className="w-full mt-2 gap-2 rounded-xl font-semibold border-2 hover:shadow-md transition-all text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100" onClick={() => setConfigBranch(b)} data-testid={`button-config-${b.id}`}>
                <CreditCard className="h-4 w-4" /> Payment Config & Settings
              </Button>
            </div>
          </div>
          );
        })}
      </div>

      {configBranch && (
        <BranchPaymentConfigDialog
          branch={configBranch}
          open={!!configBranch}
          onClose={() => setConfigBranch(null)}
          qc={qc}
          toast={toast}
        />
      )}
    </div>
  );
}

function MainCategoriesTab({ selectedBranch, mainCategories, qc, toast }: any) {
  const [pasteText, setPasteText] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", color: "#22c55e", image: "", gif: "" });
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const gifRef = useRef<HTMLInputElement>(null);
  const editImgRef = useRef<HTMLInputElement>(null);
  const editVidRef = useRef<HTMLInputElement>(null);
  const editGifRef = useRef<HTMLInputElement>(null);

  if (!selectedBranch) return <EmptyState message="Select a branch from the top bar first" />;

  const presetColors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981",
    "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
    "#d946ef", "#ec4899", "#f43f5e", "#64748b", "#78716c", "#b91c1c",
  ];

  const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await apiCall("/api/upload-image", "POST", { image: base64, filename: file.name });
      if (result.error) { toast({ title: result.error, variant: "destructive" }); return null; }
      return result.url;
    } catch { toast({ title: "Upload failed", variant: "destructive" }); return null; }
    finally { setUploading(false); }
  };

  const addBulk = async () => {
    const names = pasteText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    await apiCall("/api/grocery/main-categories/bulk", "POST", { branchId: selectedBranch, names });
    setPasteText("");
    qc.invalidateQueries({ queryKey: ["/api/grocery/main-categories", selectedBranch] });
    toast({ title: `${names.length} categories added!` });
  };

  const handleAdd = async () => {
    if (!newCat.name.trim()) { toast({ title: "Enter a category name", variant: "destructive" }); return; }
    await apiCall("/api/grocery/main-categories", "POST", {
      branchId: selectedBranch, name: newCat.name, color: newCat.color,
      image: newCat.image || null, gif: newCat.gif || null, displayOrder: mainCategories.length,
    });
    toast({ title: "Category added!" });
    setNewCat({ name: "", color: "#22c55e", image: "", gif: "" });
    setShowAddDialog(false);
    qc.invalidateQueries({ queryKey: ["/api/grocery/main-categories", selectedBranch] });
  };

  const handleUpdate = async () => {
    if (!editingCat) return;
    await apiCall(`/api/grocery/main-categories/${editingCat.id}`, "PATCH", {
      name: editingCat.name, color: editingCat.color,
      image: editingCat.image || null, gif: editingCat.gif || null, displayOrder: editingCat.displayOrder,
    });
    toast({ title: "Category updated!" });
    setEditingCat(null);
    qc.invalidateQueries({ queryKey: ["/api/grocery/main-categories", selectedBranch] });
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes all sub-categories and products in this category.`)) return;
    await apiCall(`/api/grocery/main-categories/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/grocery/main-categories", selectedBranch] });
    toast({ title: "Category deleted" });
  };

  const handleFileUpload = async (file: File, maxMb: number, setter: (url: string) => void) => {
    if (file.size > maxMb * 1024 * 1024) {
      toast({ title: `File too large (max ${maxMb}MB)`, variant: "destructive" }); return;
    }
    const url = await uploadFile(file);
    if (url) setter(url);
  };

  const MediaPreview = ({ url }: { url: string }) => {
    if (!url) return null;
    if (isVideoUrl(url)) return <video src={url} className="w-full h-full object-cover" muted autoPlay loop playsInline />;
    return <img src={url} alt="" className="w-full h-full object-cover" />;
  };

  const ColorPickerInline = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Background Color</Label>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border p-0" />
        <Input value={value} onChange={e => onChange(e.target.value)} className="w-28 text-xs font-mono" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presetColors.map(c => (
          <button key={c} onClick={() => onChange(c)}
            className={`w-5 h-5 rounded transition-all hover:scale-110 ${value === c ? "ring-2 ring-green-500 ring-offset-1 scale-110" : "border border-gray-200"}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );

  const MediaUploadInline = ({ value, onChange, imgInputRef, vidInputRef }: { value: string; onChange: (v: string) => void; imgInputRef: any; vidInputRef: any }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Category Media (Image / GIF / Video)</Label>
      <div className="flex gap-3 items-start">
        <div className="w-16 h-16 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center cursor-pointer hover:border-green-500 transition-colors flex-shrink-0" onClick={() => imgInputRef.current?.click()}>
          {value ? <MediaPreview url={value} /> : (
            <div className="text-center">
              <Upload className="h-4 w-4 text-gray-300 mx-auto" />
              <span className="text-[9px] text-gray-400">Upload</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={e => onChange(e.target.value)} placeholder="URL or upload..." className="text-xs" />
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1" onClick={() => imgInputRef.current?.click()} disabled={uploading}>
              <ImagePlus className="h-3 w-3" /> Image/GIF
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1" onClick={() => vidInputRef.current?.click()} disabled={uploading}>
              <Eye className="h-3 w-3" /> Video
            </Button>
            {value && <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1 text-red-500" onClick={() => onChange("")}><X className="h-3 w-3" /> Remove</Button>}
          </div>
        </div>
      </div>
      <input ref={imgInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 10, onChange); }} />
      <input ref={vidInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 50, onChange); }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Main Categories</h2>
          <p className="text-muted-foreground text-sm">{mainCategories.length} categories in this branch</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-add-category">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clipboard className="h-5 w-5 text-green-600" />
            Quick Add — Paste from Word / PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
            placeholder={"Paste categories (one per line):\nBakery\nFrozen Food\nDrinks"} rows={4} data-testid="textarea-paste-main-cat" />
          <Button onClick={addBulk} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-paste-main-cat">
            <Clipboard className="h-4 w-4" /> Add All
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {mainCategories.map((cat: MainCategory, i: number) => (
          <Card key={cat.id} className="group hover:shadow-md transition-all hover:border-green-300" data-testid={`card-admin-category-${cat.id}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center"
                style={{ background: cat.image ? "transparent" : `linear-gradient(145deg, ${cat.color}30, ${cat.color}10)` }}>
                {cat.image ? <MediaPreview url={cat.image} /> : (
                  <FolderTree className="h-5 w-5" style={{ color: cat.color || "#22c55e" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{cat.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-3 h-3 rounded-full border" style={{ background: cat.color }} />
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  {cat.gif && <span className="text-[9px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">GIF</span>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCat({ ...cat })} data-testid={`button-edit-admin-category-${cat.id}`}>
                  <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteItem(cat.id, cat.name)} data-testid={`button-delete-admin-category-${cat.id}`}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {mainCategories.length === 0 && <EmptyState message="No main categories yet. Add one above!" />}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" /> Add New Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">Category Name</Label>
              <Input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Dairy & Eggs" data-testid="input-new-admin-category-name" />
            </div>
            <ColorPickerInline value={newCat.color} onChange={c => setNewCat(p => ({ ...p, color: c }))} />
            <MediaUploadInline value={newCat.image} onChange={v => setNewCat(p => ({ ...p, image: v }))} imgInputRef={imgRef} vidInputRef={vidRef} />
            <div className="space-y-2">
              <Label className="text-sm font-medium">GIF / Animated Image (optional)</Label>
              <div className="flex gap-3 items-start">
                <div className="w-16 h-16 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center cursor-pointer hover:border-green-500 transition-colors flex-shrink-0" onClick={() => gifRef.current?.click()}>
                  {newCat.gif ? <img src={newCat.gif} alt="gif" className="w-full h-full object-cover" /> : (
                    <div className="text-center"><Upload className="h-4 w-4 text-gray-300 mx-auto" /><span className="text-[9px] text-gray-400">GIF</span></div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <Input value={newCat.gif} onChange={e => setNewCat(p => ({ ...p, gif: e.target.value }))} placeholder="Paste GIF URL or upload" className="text-xs h-8" data-testid="input-new-cat-gif-url" />
                  <input ref={gifRef} type="file" accept="image/gif,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 10, url => setNewCat(p => ({ ...p, gif: url }))); }} data-testid="input-new-cat-gif-file" />
                  {newCat.gif && <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 px-2" onClick={() => setNewCat(p => ({ ...p, gif: "" }))}>Remove</Button>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAdd} className="flex-1 bg-green-600 hover:bg-green-700 gap-2" data-testid="button-save-new-admin-category">
                <Save className="h-4 w-4" /> Add Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCat} onOpenChange={open => !open && setEditingCat(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-500" /> Edit Category
            </DialogTitle>
          </DialogHeader>
          {editingCat && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-sm font-medium">Category Name</Label>
                <Input value={editingCat.name} onChange={e => setEditingCat((p: any) => ({ ...p, name: e.target.value }))}
                  data-testid="input-edit-admin-category-name" />
              </div>
              <div>
                <Label className="text-sm font-medium">Display Order</Label>
                <Input type="number" value={editingCat.displayOrder} onChange={e => setEditingCat((p: any) => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="w-24" data-testid="input-edit-admin-category-order" />
              </div>
              <ColorPickerInline value={editingCat.color || "#22c55e"} onChange={c => setEditingCat((p: any) => ({ ...p, color: c }))} />
              <MediaUploadInline value={editingCat.image || ""} onChange={v => setEditingCat((p: any) => ({ ...p, image: v }))} imgInputRef={editImgRef} vidInputRef={editVidRef} />
              <div className="space-y-2">
                <Label className="text-sm font-medium">GIF / Animated Image (optional)</Label>
                <div className="flex gap-3 items-start">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors flex-shrink-0" onClick={() => editGifRef.current?.click()}>
                    {editingCat.gif ? <img src={editingCat.gif} alt="gif" className="w-full h-full object-cover" /> : (
                      <div className="text-center"><Upload className="h-4 w-4 text-gray-300 mx-auto" /><span className="text-[9px] text-gray-400">GIF</span></div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input value={editingCat.gif || ""} onChange={e => setEditingCat((p: any) => ({ ...p, gif: e.target.value }))} placeholder="Paste GIF URL or upload" className="text-xs h-8" data-testid="input-edit-cat-gif-url" />
                    <input ref={editGifRef} type="file" accept="image/gif,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 10, url => setEditingCat((p: any) => ({ ...p, gif: url }))); }} data-testid="input-edit-cat-gif-file" />
                    {editingCat.gif && <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 px-2" onClick={() => setEditingCat((p: any) => ({ ...p, gif: null }))}>Remove</Button>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingCat(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdate} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-save-edit-admin-category">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubCategoriesTab({ selectedBranch, selectedMainCat, setSelectedMainCat, mainCategories, subCategories, qc, toast }: any) {
  const [pasteText, setPasteText] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", image: "" });
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const editImgRef = useRef<HTMLInputElement>(null);
  const editVidRef = useRef<HTMLInputElement>(null);

  if (!selectedBranch) return <EmptyState message="Select a branch from the top bar first" />;

  const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await apiCall("/api/upload-image", "POST", { image: base64, filename: file.name });
      if (result.error) { toast({ title: result.error, variant: "destructive" }); return null; }
      return result.url;
    } catch { toast({ title: "Upload failed", variant: "destructive" }); return null; }
    finally { setUploading(false); }
  };

  const handleFileUpload = async (file: File, maxMb: number, setter: (url: string) => void) => {
    if (file.size > maxMb * 1024 * 1024) {
      toast({ title: `File too large (max ${maxMb}MB)`, variant: "destructive" }); return;
    }
    const url = await uploadFile(file);
    if (url) setter(url);
  };

  const addBulk = async () => {
    const names = pasteText.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
    if (names.length === 0 || !selectedMainCat) return;
    await apiCall("/api/grocery/sub-categories/bulk", "POST", { branchId: selectedBranch, mainCategoryId: selectedMainCat, names });
    setPasteText("");
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-categories", selectedMainCat] });
    toast({ title: `${names.length} sub-categories added!` });
  };

  const handleAdd = async () => {
    if (!newSub.name.trim()) { toast({ title: "Enter a name", variant: "destructive" }); return; }
    if (!selectedMainCat) { toast({ title: "Select a main category first", variant: "destructive" }); return; }
    await apiCall("/api/grocery/sub-categories", "POST", {
      branchId: selectedBranch, mainCategoryId: selectedMainCat,
      name: newSub.name, image: newSub.image || null, displayOrder: subCategories.length,
    });
    toast({ title: "Sub-category added!" });
    setNewSub({ name: "", image: "" });
    setShowAddDialog(false);
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-categories", selectedMainCat] });
  };

  const handleUpdate = async () => {
    if (!editingSub) return;
    await apiCall(`/api/grocery/sub-categories/${editingSub.id}`, "PATCH", {
      name: editingSub.name, image: editingSub.image || null, gif: editingSub.gif || null, video: editingSub.video || null, displayOrder: editingSub.displayOrder,
    });
    toast({ title: "Sub-category updated!" });
    setEditingSub(null);
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-categories", selectedMainCat] });
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await apiCall(`/api/grocery/sub-categories/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-categories", selectedMainCat] });
    toast({ title: "Deleted" });
  };

  const MediaPreview = ({ url }: { url: string }) => {
    if (!url) return null;
    if (isVideoUrl(url)) return <video src={url} className="w-full h-full object-cover" muted autoPlay loop playsInline />;
    return <img src={url} alt="" className="w-full h-full object-cover" />;
  };

  const MediaUploadField = ({ value, onChange, iRef, vRef }: { value: string; onChange: (v: string) => void; iRef: any; vRef: any }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Image / GIF / Video</Label>
      <div className="flex gap-3 items-start">
        <div className="w-16 h-16 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors flex-shrink-0" onClick={() => iRef.current?.click()}>
          {value ? <MediaPreview url={value} /> : (
            <div className="text-center">
              <Upload className="h-4 w-4 text-gray-300 mx-auto" />
              <span className="text-[9px] text-gray-400">Upload</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={e => onChange(e.target.value)} placeholder="URL or upload..." className="text-xs" />
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1" onClick={() => iRef.current?.click()} disabled={uploading}>
              <ImagePlus className="h-3 w-3" /> Image/GIF
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1" onClick={() => vRef.current?.click()} disabled={uploading}>
              <Eye className="h-3 w-3" /> Video
            </Button>
            {value && <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1 text-red-500" onClick={() => onChange("")}><X className="h-3 w-3" /> Remove</Button>}
          </div>
        </div>
      </div>
      <input ref={iRef} type="file" accept="image/*,.gif" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 10, onChange); }} />
      <input ref={vRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 50, onChange); }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Select Main Category</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedMainCat} onValueChange={setSelectedMainCat}>
            <SelectTrigger data-testid="select-main-cat-for-sub"><SelectValue placeholder="Choose main category..." /></SelectTrigger>
            <SelectContent>
              {mainCategories.map((c: MainCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMainCat && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Sub Categories</h2>
              <p className="text-muted-foreground text-sm">{subCategories.length} sub-categories</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700" data-testid="button-add-sub-category">
              <Plus className="h-4 w-4" /> Add Sub Category
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clipboard className="h-5 w-5 text-blue-600" />
                Quick Add — Paste from Word / PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                placeholder={"Paste sub-categories (one per line):\nBread\nRolls & More\nBreakfast"} rows={4} data-testid="textarea-paste-sub-cat" />
              <Button onClick={addBulk} className="gap-2 bg-blue-600 hover:bg-blue-700" data-testid="button-paste-sub-cat">
                <Clipboard className="h-4 w-4" /> Add All
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subCategories.map((cat: SubCategory, i: number) => (
              <Card key={cat.id} className="group hover:shadow-md transition-all hover:border-blue-300" data-testid={`card-admin-subcategory-${cat.id}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm bg-blue-50 flex items-center justify-center">
                    {cat.gif ? <img src={cat.gif} alt="" className="w-full h-full object-cover" /> :
                     cat.video ? <video src={cat.video} className="w-full h-full object-cover" muted autoPlay loop playsInline /> :
                     cat.image ? <MediaPreview url={cat.image} /> : (
                      <Layers className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{cat.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                      {cat.gif && <span className="text-[9px] px-1.5 py-0 rounded bg-yellow-100 text-yellow-700 font-medium">GIF</span>}
                      {cat.video && <span className="text-[9px] px-1.5 py-0 rounded bg-purple-100 text-purple-700 font-medium">Video</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingSub({ ...cat })} data-testid={`button-edit-subcategory-${cat.id}`}>
                      <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteItem(cat.id, cat.name)} data-testid={`button-delete-subcategory-${cat.id}`}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {subCategories.length === 0 && <EmptyState message="No sub-categories yet. Add one above!" />}

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" /> Add Sub Category
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm font-medium">Sub Category Name</Label>
                  <Input value={newSub.name} onChange={e => setNewSub(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Bread" data-testid="input-new-subcategory-name" />
                </div>
                <MediaUploadField value={newSub.image} onChange={v => setNewSub(p => ({ ...p, image: v }))} iRef={imgRef} vRef={vidRef} />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-save-new-subcategory">
                    <Save className="h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingSub} onOpenChange={open => !open && setEditingSub(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-blue-500" /> Edit Sub Category
                </DialogTitle>
              </DialogHeader>
              {editingSub && (
                <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <Input value={editingSub.name} onChange={e => setEditingSub((p: any) => ({ ...p, name: e.target.value }))}
                      data-testid="input-edit-subcategory-name" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Display Order</Label>
                    <Input type="number" value={editingSub.displayOrder} onChange={e => setEditingSub((p: any) => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                      className="w-24" data-testid="input-edit-subcategory-order" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image</Label>
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors flex-shrink-0" onClick={() => editImgRef.current?.click()}>
                        {editingSub.image ? <img src={editingSub.image} alt="" className="w-full h-full object-cover" /> : <div className="text-center"><Upload className="h-4 w-4 text-gray-300 mx-auto" /><span className="text-[9px] text-gray-400">Upload</span></div>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input value={editingSub.image || ""} onChange={e => setEditingSub((p: any) => ({ ...p, image: e.target.value }))} placeholder="Image URL..." className="text-xs" />
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1" onClick={() => editImgRef.current?.click()} disabled={uploading}><ImagePlus className="h-3 w-3" /> Upload</Button>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1 text-purple-600 border-purple-300" onClick={async () => {
                            try {
                              const items = await navigator.clipboard.read();
                              for (const item of items) {
                                const imgType = item.types.find(t => t.startsWith("image/"));
                                if (imgType) {
                                  const blob = await item.getType(imgType);
                                  const ext = imgType.split("/")[1] || "png";
                                  const file = new File([blob], `pasted-image.${ext}`, { type: imgType });
                                  handleFileUpload(file, 10, v => setEditingSub((p: any) => ({ ...p, image: v })));
                                  return;
                                }
                              }
                              toast({ title: "No image in clipboard", variant: "destructive" });
                            } catch { toast({ title: "Paste failed - copy an image first", variant: "destructive" }); }
                          }} disabled={uploading} data-testid="btn-paste-subcat-image"><Clipboard className="h-3 w-3" /> Paste</Button>
                          {editingSub.image && <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1 text-red-500" onClick={() => setEditingSub((p: any) => ({ ...p, image: "" }))}><X className="h-3 w-3" /> Remove</Button>}
                        </div>
                      </div>
                    </div>
                    <input ref={editImgRef} type="file" accept="image/*,.png,.jpg,.jpeg,.webp" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 10, v => setEditingSub((p: any) => ({ ...p, image: v }))); }} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">GIF <span className="text-muted-foreground font-normal">(animated)</span></Label>
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border bg-yellow-50 flex items-center justify-center cursor-pointer hover:border-yellow-500 transition-colors flex-shrink-0" onClick={() => { const el = document.getElementById('edit-gif-input') as HTMLInputElement; el?.click(); }}>
                        {editingSub.gif ? <img src={editingSub.gif} alt="" className="w-full h-full object-cover" /> : <div className="text-center"><Sparkles className="h-4 w-4 text-yellow-300 mx-auto" /><span className="text-[9px] text-yellow-500">GIF</span></div>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input value={editingSub.gif || ""} onChange={e => setEditingSub((p: any) => ({ ...p, gif: e.target.value }))} placeholder="GIF URL..." className="text-xs" />
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1 text-yellow-600" onClick={() => { const el = document.getElementById('edit-gif-input') as HTMLInputElement; el?.click(); }} disabled={uploading}><Sparkles className="h-3 w-3" /> Upload GIF</Button>
                          {editingSub.gif && <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1 text-red-500" onClick={() => setEditingSub((p: any) => ({ ...p, gif: "" }))}><X className="h-3 w-3" /> Remove</Button>}
                        </div>
                      </div>
                    </div>
                    <input id="edit-gif-input" type="file" accept="image/gif,.gif" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 10, v => setEditingSub((p: any) => ({ ...p, gif: v }))); }} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Video <span className="text-muted-foreground font-normal">(MP4/WebM)</span></Label>
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border bg-purple-50 flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors flex-shrink-0" onClick={() => editVidRef.current?.click()}>
                        {editingSub.video ? <video src={editingSub.video} className="w-full h-full object-cover" muted /> : <div className="text-center"><Film className="h-4 w-4 text-purple-300 mx-auto" /><span className="text-[9px] text-purple-500">Video</span></div>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input value={editingSub.video || ""} onChange={e => setEditingSub((p: any) => ({ ...p, video: e.target.value }))} placeholder="Video URL..." className="text-xs" />
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1 text-purple-600" onClick={() => editVidRef.current?.click()} disabled={uploading}><Film className="h-3 w-3" /> Upload Video</Button>
                          {editingSub.video && <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1 text-red-500" onClick={() => setEditingSub((p: any) => ({ ...p, video: "" }))}><X className="h-3 w-3" /> Remove</Button>}
                        </div>
                      </div>
                    </div>
                    <input ref={editVidRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 50, v => setEditingSub((p: any) => ({ ...p, video: v }))); }} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setEditingSub(null)} className="flex-1">Cancel</Button>
                    <Button onClick={handleUpdate} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-save-edit-subcategory">
                      <Save className="h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function SubSubCategoriesTab({ selectedBranch, selectedMainCat, setSelectedMainCat, selectedSubCat, setSelectedSubCat, mainCategories, subCategories, subSubCategories, qc, toast }: any) {
  const [pasteText, setPasteText] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  if (!selectedBranch) return <EmptyState message="Select a branch from the top bar first" />;

  const addBulk = async () => {
    const names = pasteText.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
    if (names.length === 0 || !selectedSubCat) return;
    await apiCall("/api/grocery/sub-sub-categories/bulk", "POST", { branchId: selectedBranch, subCategoryId: selectedSubCat, names });
    setPasteText("");
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-sub-categories", selectedSubCat] });
    toast({ title: `${names.length} sub-sub-categories added!` });
  };

  const deleteItem = async (id: string) => {
    await apiCall(`/api/grocery/sub-sub-categories/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-sub-categories", selectedSubCat] });
    toast({ title: "Deleted" });
  };

  const handleImageUpload = async (catId: string, file: File, mediaType?: "image" | "gif" | "video") => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large (max 10MB)", variant: "destructive" }); return;
    }
    setUploadingId(catId);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await apiCall("/api/upload-image", "POST", { image: base64, filename: file.name });
      if (result.error) { toast({ title: result.error, variant: "destructive" }); return; }
      const isGif = mediaType === "gif" || file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
      const isVideo = mediaType === "video" || file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
      const field = isVideo ? "video" : isGif ? "gif" : "image";
      await apiCall(`/api/grocery/sub-sub-categories/${catId}`, "PATCH", { [field]: result.url });
      qc.invalidateQueries({ queryKey: ["/api/grocery/sub-sub-categories", selectedSubCat] });
      toast({ title: `${field.charAt(0).toUpperCase() + field.slice(1)} uploaded!` });
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    finally { setUploadingId(null); }
  };

  const removeMedia = async (catId: string, field: "image" | "gif" | "video") => {
    await apiCall(`/api/grocery/sub-sub-categories/${catId}`, "PATCH", { [field]: null });
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-sub-categories", selectedSubCat] });
    toast({ title: `${field.charAt(0).toUpperCase() + field.slice(1)} removed` });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>1. Select Main Category</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedMainCat} onValueChange={(v) => { setSelectedMainCat(v); setSelectedSubCat(""); }}>
              <SelectTrigger data-testid="select-main-for-subsub"><SelectValue placeholder="Choose main category..." /></SelectTrigger>
              <SelectContent>
                {mainCategories.map((c: MainCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>2. Select Sub Category</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedSubCat} onValueChange={setSelectedSubCat} disabled={!selectedMainCat}>
              <SelectTrigger data-testid="select-sub-for-subsub"><SelectValue placeholder={selectedMainCat ? "Choose sub category..." : "Select main first"} /></SelectTrigger>
              <SelectContent>
                {subCategories.map((c: SubCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedSubCat && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-purple-600" />
                Paste Sub+Sub Categories from Word / PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={pasteText} 
                onChange={e => setPasteText(e.target.value)} 
                placeholder={"Paste sub+sub categories here (one per line):\nKingsmill\nHovis\nWarburtons\nThick White\nThin Brown"} 
                rows={6}
                data-testid="textarea-paste-subsub"
              />
              <Button onClick={addBulk} className="gap-2 bg-purple-600 hover:bg-purple-700" data-testid="button-paste-subsub">
                <Clipboard className="h-4 w-4" /> Add All Sub+Sub Categories
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subSubCategories.map((cat: SubSubCategory, i: number) => {
              const isVideo = cat.image && /\.(mp4|webm|mov)(\?|$)/i.test(cat.image);
              const displayMedia = cat.video || cat.gif || cat.image;
              const mediaType = cat.video ? "video" : cat.gif ? "gif" : "image";
              return (
              <Card key={cat.id} className="group hover:border-purple-500 transition-colors overflow-hidden">
                <div className="relative w-full" style={{ aspectRatio: "700/400" }}>
                  {displayMedia ? (
                    <>
                      {mediaType === "video" ? (
                        <video src={cat.video!} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                      ) : mediaType === "gif" ? (
                        <img src={cat.gif!} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src={cat.image!} alt={cat.name} className="w-full h-full object-cover" />
                      )}
                      {mediaType === "gif" && (
                        <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">GIF</span>
                      )}
                      {mediaType === "video" && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">VIDEO</span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(cat.id, mediaType as "image" | "gif" | "video")}
                        data-testid={`button-remove-subsub-image-${cat.id}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-dashed border-purple-200">
                      {uploadingId === cat.id ? (
                        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                      ) : (
                        <div className="flex gap-3">
                          <label className="cursor-pointer flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors">
                            <ImagePlus className="h-6 w-6 text-purple-400" />
                            <span className="text-[10px] text-purple-500 font-medium">Image</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(cat.id, f, "image"); }} data-testid={`input-subsub-image-${cat.id}`} />
                          </label>
                          <label className="cursor-pointer flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors">
                            <ImagePlus className="h-6 w-6 text-green-500" />
                            <span className="text-[10px] text-green-600 font-medium">GIF</span>
                            <input type="file" accept="image/gif,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(cat.id, f, "gif"); }} data-testid={`input-subsub-gif-${cat.id}`} />
                          </label>
                          <label className="cursor-pointer flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors">
                            <Film className="h-6 w-6 text-blue-500" />
                            <span className="text-[10px] text-blue-600 font-medium">Video</span>
                            <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(cat.id, f, "video"); }} data-testid={`input-subsub-video-${cat.id}`} />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <label className="cursor-pointer">
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" asChild data-testid={`button-replace-subsub-image-${cat.id}`}>
                        <span><ImagePlus className="h-3.5 w-3.5 text-purple-500" /></span>
                      </Button>
                      <input type="file" accept="image/*,.gif,video/mp4,video/webm,.mp4,.webm,.mov" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(cat.id, f); }} data-testid={`input-replace-subsub-image-${cat.id}`} />
                    </label>
                    <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteItem(cat.id)} data-testid={`button-delete-subsub-${cat.id}`}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
          {subSubCategories.length === 0 && <EmptyState message="No sub+sub categories yet" />}
        </>
      )}
    </div>
  );
}

function ProductsTab({ selectedBranch, selectedMainCat, setSelectedMainCat, selectedSubCat, setSelectedSubCat, mainCategories, subCategories, subSubCategories, products, qc, toast }: any) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ name: "", description: "", nowPrice: "", wasPrice: "", expiryDate: "", barcode: "", unit: "each", weight: "", stockQuantity: 0, calories: "", allergyAdvice: "", productMarketing: "", features: "", image1: "" });
  const [imageResults, setImageResults] = useState<{ name: string; image: string }[]>([]);
  const [searchingImage, setSearchingImage] = useState(false);

  const applyProductData = (product: any) => {
    setForm((prev: any) => ({
      ...prev,
      image1: product.image || prev.image1,
      description: product.description || prev.description,
      allergyAdvice: product.allergyAdvice || prev.allergyAdvice,
      ingredients: product.ingredients || prev.ingredients,
      calculatedNutrition: product.calculatedNutrition || prev.calculatedNutrition,
      nutrition: product.nutrition || prev.nutrition,
      nutritionalClaims: product.nutritionalClaims || prev.nutritionalClaims,
      lifestyle: product.lifestyle || prev.lifestyle,
      features: product.features || prev.features,
      productMarketing: product.productMarketing || prev.productMarketing,
      storageUsage: product.storageUsage || prev.storageUsage,
      storageType: product.storageType || prev.storageType,
      country: product.country || prev.country,
      companyName: product.companyName || prev.companyName,
      companyAddress: product.companyAddress || prev.companyAddress,
      manufacturer: product.manufacturer || prev.manufacturer,
      moreInformation: product.moreInformation || prev.moreInformation,
      disclaimer: product.disclaimer || prev.disclaimer,
      weight: product.weight || prev.weight,
    }));
  };

  const searchProductImage = async (productName: string) => {
    if (!productName.trim()) return;
    setSearchingImage(true);
    try {
      const data = await apiCall(`/api/grocery/search-image?q=${encodeURIComponent(productName)}`);
      setImageResults(data || []);
      if (data && data.length > 0) {
        applyProductData(data[0]);
      }
    } catch (e) {
      setImageResults([]);
    }
    setSearchingImage(false);
  };

  if (!selectedBranch) return <EmptyState message="Select a branch from the top bar first" />;

  const addProduct = async () => {
    if (!form.name || !form.nowPrice || !selectedMainCat) {
      toast({ title: "Product name, price, and main category are required", variant: "destructive" });
      return;
    }
    await apiCall("/api/grocery/products", "POST", {
      branchId: selectedBranch,
      mainCategoryId: selectedMainCat,
      subCategoryId: selectedSubCat || null,
      subSubCategoryId: null,
      ...form,
      nowPrice: form.nowPrice,
      wasPrice: form.wasPrice || null,
      image1: form.image1 || null,
      stockQuantity: parseInt(form.stockQuantity) || 0,
    });
    setForm({ name: "", description: "", nowPrice: "", wasPrice: "", expiryDate: "", barcode: "", unit: "each", weight: "", stockQuantity: 0, calories: "", allergyAdvice: "", productMarketing: "", features: "", image1: "" });
    setImageResults([]);
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
    toast({ title: "Product added!" });
  };

  const deleteProduct = async (id: string) => {
    await apiCall(`/api/grocery/products/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
    toast({ title: "Product deleted" });
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const clearCategoryProducts = async () => {
    if (!selectedMainCat) return;
    setIsClearing(true);
    try {
      await apiCall("/api/grocery/products/bulk-clear", "POST", {
        branchId: selectedBranch,
        mainCategoryId: selectedMainCat,
        subCategoryId: selectedSubCat || null,
      });
      qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
      const catName = mainCategories.find((c: MainCategory) => c.id === selectedMainCat)?.name || "category";
      const subName = selectedSubCat ? ` > ${subCategories.find((c: SubCategory) => c.id === selectedSubCat)?.name}` : "";
      toast({ title: `All products cleared from ${catName}${subName}` });
    } catch {
      toast({ title: "Failed to clear products", variant: "destructive" });
    }
    setIsClearing(false);
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>1. Select Main Category</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedMainCat} onValueChange={(v) => { setSelectedMainCat(v); setSelectedSubCat(""); }}>
              <SelectTrigger><SelectValue placeholder="Choose main category..." /></SelectTrigger>
              <SelectContent>
                {mainCategories.map((c: MainCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>2. Select Sub Category (optional)</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedSubCat} onValueChange={setSelectedSubCat} disabled={!selectedMainCat}>
              <SelectTrigger><SelectValue placeholder={selectedMainCat ? "Choose sub category..." : "Select main first"} /></SelectTrigger>
              <SelectContent>
                {subCategories.map((c: SubCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-bold">Products ({products.length})</h3>
        <div className="flex gap-2">
          {selectedMainCat && products.length > 0 && !showClearConfirm && (
            <Button variant="outline" onClick={() => setShowClearConfirm(true)} className="gap-2 text-red-600 border-red-200 hover:bg-red-50" data-testid="button-clear-products">
              <Trash2 className="h-4 w-4" /> Clear Products
            </Button>
          )}
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-orange-600 hover:bg-orange-700" data-testid="button-add-product">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {showClearConfirm && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-red-700">Clear all {products.length} products from this category?</p>
                <p className="text-sm text-red-600">
                  {mainCategories.find((c: MainCategory) => c.id === selectedMainCat)?.name}
                  {selectedSubCat && ` > ${subCategories.find((c: SubCategory) => c.id === selectedSubCat)?.name}`}
                  {" "}- This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
                <Button onClick={clearCategoryProducts} disabled={isClearing} className="gap-2 bg-red-600 hover:bg-red-700" data-testid="button-confirm-clear">
                  {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Yes, Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="col-span-full md:col-span-2 lg:col-span-3">
                <Label>Product Name *</Label>
                <div className="flex gap-2">
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kingsmill Medium White 800g" className="flex-1" data-testid="input-product-name" />
                  <Button type="button" onClick={() => searchProductImage(form.name)} disabled={searchingImage || !form.name.trim()} className="gap-2 bg-blue-600 hover:bg-blue-700 shrink-0" data-testid="button-find-image">
                    {searchingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Find Image
                  </Button>
                </div>
              </div>
              {(form.image1 || imageResults.length > 0) && (
                <div className="col-span-full">
                  <Label>Product Image</Label>
                  <div className="flex gap-3 items-start flex-wrap">
                    {form.image1 && (
                      <div className="relative">
                        <img src={form.image1} alt="Selected" className="h-24 w-24 object-contain rounded-lg border-2 border-green-500 bg-white p-1" />
                        <button onClick={() => setForm({ ...form, image1: "" })} className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                    {imageResults.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {imageResults.map((img: any, idx: number) => (
                          <button key={idx} onClick={() => applyProductData(img)} className={`h-24 w-24 rounded-lg border-2 p-1 bg-white transition-all hover:shadow-md ${form.image1 === img.image ? "border-green-500" : "border-gray-200"}`} title={img.name} data-testid={`button-select-image-${idx}`}>
                            <img src={img.image} alt={img.name} className="w-full h-full object-contain" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <Input value={form.image1} onChange={e => setForm({ ...form, image1: e.target.value })} placeholder="Or paste image URL manually..." className="text-xs" data-testid="input-image-url" />
                  </div>
                </div>
              )}
              <div>
                <Label>Now Price *</Label>
                <Input type="number" step="0.01" value={form.nowPrice} onChange={e => setForm({ ...form, nowPrice: e.target.value })} placeholder="1.29" data-testid="input-now-price" />
              </div>
              <div>
                <Label>Was Price (old price, red line)</Label>
                <Input type="number" step="0.01" value={form.wasPrice} onChange={e => setForm({ ...form, wasPrice: e.target.value })} placeholder="1.79" data-testid="input-was-price" />
              </div>
              <div>
                <Label>Barcode</Label>
                <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="Scan or type barcode" data-testid="input-barcode" />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} data-testid="input-expiry" />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} data-testid="input-stock" />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="each">Each</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="litre">Litre</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pint">Pint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Weight/Size</Label>
                <Input value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 800g, 2L, 6 pack" />
              </div>
            </div>
            <div>
              <Label>Calories</Label>
              <Input value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} placeholder="e.g. 56 Kcal per 100ml" data-testid="input-calories" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Paste product description here..." rows={3} data-testid="textarea-product-desc" />
            </div>
            <div>
              <Label>Allergy Advice</Label>
              <Textarea value={form.allergyAdvice} onChange={e => setForm({ ...form, allergyAdvice: e.target.value })} placeholder="e.g. Contains Milk" rows={2} data-testid="textarea-allergy-advice" />
            </div>
            <div>
              <Label>Product Marketing</Label>
              <Textarea value={form.productMarketing} onChange={e => setForm({ ...form, productMarketing: e.target.value })} placeholder="Paste product marketing text here..." rows={3} data-testid="textarea-product-marketing" />
            </div>
            <div>
              <Label>Features</Label>
              <Textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="e.g. Rich in protein, Source of calcium..." rows={2} data-testid="textarea-features" />
            </div>
            {(form.lifestyle || form.ingredients || form.calculatedNutrition || form.nutritionalClaims || form.storageUsage || form.storageType || form.country || form.companyName || form.manufacturer || form.nutrition || form.disclaimer) && (
              <div className="border rounded-lg p-4 bg-blue-50/30 border-blue-200 space-y-3">
                <h4 className="font-semibold text-sm text-blue-700 flex items-center gap-2"><Info className="h-4 w-4" /> Auto-filled Product Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Lifestyle</Label><Textarea value={form.lifestyle || ""} onChange={e => setForm({ ...form, lifestyle: e.target.value })} rows={1} className="text-xs" /></div>
                  <div><Label className="text-xs">Ingredients</Label><Textarea value={form.ingredients || ""} onChange={e => setForm({ ...form, ingredients: e.target.value })} rows={2} className="text-xs" /></div>
                  <div><Label className="text-xs">Calculated Nutrition</Label><Textarea value={form.calculatedNutrition || ""} onChange={e => setForm({ ...form, calculatedNutrition: e.target.value })} rows={3} className="text-xs" /></div>
                  <div><Label className="text-xs">Nutritional Claims</Label><Textarea value={form.nutritionalClaims || ""} onChange={e => setForm({ ...form, nutritionalClaims: e.target.value })} rows={1} className="text-xs" /></div>
                  <div><Label className="text-xs">Storage & Usage</Label><Textarea value={form.storageUsage || ""} onChange={e => setForm({ ...form, storageUsage: e.target.value })} rows={1} className="text-xs" /></div>
                  <div><Label className="text-xs">Storage Type</Label><Textarea value={form.storageType || ""} onChange={e => setForm({ ...form, storageType: e.target.value })} rows={1} className="text-xs" /></div>
                  <div><Label className="text-xs">Country</Label><Textarea value={form.country || ""} onChange={e => setForm({ ...form, country: e.target.value })} rows={1} className="text-xs" /></div>
                  <div><Label className="text-xs">Company Name</Label><Textarea value={form.companyName || ""} onChange={e => setForm({ ...form, companyName: e.target.value })} rows={1} className="text-xs" /></div>
                  <div><Label className="text-xs">Company Address</Label><Textarea value={form.companyAddress || ""} onChange={e => setForm({ ...form, companyAddress: e.target.value })} rows={1} className="text-xs" /></div>
                  <div><Label className="text-xs">Manufacturer</Label><Textarea value={form.manufacturer || ""} onChange={e => setForm({ ...form, manufacturer: e.target.value })} rows={1} className="text-xs" /></div>
                  <div><Label className="text-xs">Nutrition</Label><Textarea value={form.nutrition || ""} onChange={e => setForm({ ...form, nutrition: e.target.value })} rows={3} className="text-xs" /></div>
                  <div><Label className="text-xs">More Information</Label><Textarea value={form.moreInformation || ""} onChange={e => setForm({ ...form, moreInformation: e.target.value })} rows={1} className="text-xs" /></div>
                  <div className="md:col-span-2"><Label className="text-xs">Disclaimer</Label><Textarea value={form.disclaimer || ""} onChange={e => setForm({ ...form, disclaimer: e.target.value })} rows={1} className="text-xs" /></div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={addProduct} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-save-product">
                <Save className="h-4 w-4" /> Save Product
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p: Product) => (
          <Card key={p.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-base">{p.name}</h4>
                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 shrink-0" onClick={() => deleteProduct(p.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              {p.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-2 mb-2">
                {p.wasPrice && (
                  <span className="text-red-500 line-through text-sm">£{p.wasPrice}</span>
                )}
                <span className="text-green-600 font-bold text-lg">£{p.nowPrice}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {p.barcode && <span className="bg-gray-100 px-2 py-0.5 rounded">Barcode: {p.barcode}</span>}
                {p.expiryDate && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Exp: {p.expiryDate}</span>}
                {p.weight && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{p.weight}</span>}
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Stock: {p.stockQuantity}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {products.length === 0 && selectedMainCat && <EmptyState message="No products yet. Click Add Product above!" />}
      {!selectedMainCat && <EmptyState message="Select a main category first to add products" />}
    </div>
  );
}

function PasteProductsTab({ selectedBranch, qc, toast }: any) {
  const [pasteBranch, setPasteBranch] = useState(selectedBranch || "");
  const [pasteMainCat, setPasteMainCat] = useState("");
  const [pasteSubCat, setPasteSubCat] = useState("");
  const [pasteSubSubCat, setPasteSubSubCat] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [parsedItems, setParsedItems] = useState<{ name: string; description: string; price: string; wasPrice: string; removed: boolean }[]>([]);
  const [replaceMode, setReplaceMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: pasteBranches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/grocery/branches", "paste"],
    queryFn: () => apiCall("/api/grocery/branches"),
  });

  const { data: pMainCats = [] } = useQuery<MainCategory[]>({
    queryKey: ["/api/grocery/main-categories", pasteBranch, "paste"],
    queryFn: () => apiCall(`/api/grocery/main-categories/${pasteBranch}`),
    enabled: !!pasteBranch,
  });

  const { data: pSubCats = [] } = useQuery<SubCategory[]>({
    queryKey: ["/api/grocery/sub-categories", pasteMainCat, "paste"],
    queryFn: () => apiCall(`/api/grocery/sub-categories/${pasteMainCat}`),
    enabled: !!pasteMainCat,
  });

  const { data: pSubSubCats = [] } = useQuery<SubSubCategory[]>({
    queryKey: ["/api/grocery/sub-sub-categories", pasteSubCat, "paste"],
    queryFn: () => apiCall(`/api/grocery/sub-sub-categories/${pasteSubCat}`),
    enabled: !!pasteSubCat,
  });

  useEffect(() => {
    if (selectedBranch && !pasteBranch) setPasteBranch(selectedBranch);
  }, [selectedBranch]);

  const parseText = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const items: { name: string; description: string; price: string; wasPrice: string; removed: boolean }[] = [];
    const priceLineRegex = /^[£$€]\s*(\d+(?:\.\d{1,2})?)$/;
    const numPriceRegex = /^(\d+\.\d{1,2})$/;
    const infoLineRegex = /^[\*•·\-]\s+/;
    const kcalLineRegex = /^\d+\s*(?:Kcal|kcal|kCal|KCAL|cal|Cal|calories?)\s*(?:per|\/)\s*/i;
    const nutritionLineRegex = /^(?:per\s+\d|energy|fat|carb|protein|sugar|salt|fibre|fiber|saturate|\d+\s*kj)/i;
    const wasPriceRegex = /(?:was|rrp|before|old|last)\s*[£$€]?\s*(\d+(?:\.\d{1,2})?)/i;
    const sameLinePriceRegex = /^(.+?)\s+[£$€](\d+(?:\.\d{1,2})?)$/;
    const tabPriceRegex = /^(.+?)\t+[£$€]?(\d+(?:\.\d{1,2})?)$/;
    const twoPriceRegex = /^(.+?)\s+[£$€](\d+(?:\.\d{1,2})?)\s+[£$€](\d+(?:\.\d{1,2})?)$/;

    const isInfoLine = (l: string) => infoLineRegex.test(l) || kcalLineRegex.test(l) || nutritionLineRegex.test(l);

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (priceLineRegex.test(line) || numPriceRegex.test(line)) { i++; continue; }
      if (isInfoLine(line)) { i++; continue; }
      if (line.length < 2) { i++; continue; }

      const twoPriceMatch = line.match(twoPriceRegex);
      if (twoPriceMatch) {
        items.push({ name: twoPriceMatch[1].trim(), description: "", wasPrice: twoPriceMatch[2], price: twoPriceMatch[3], removed: false });
        i++;
        continue;
      }

      const sameLineMatch = line.match(sameLinePriceRegex);
      if (sameLineMatch) {
        items.push({ name: sameLineMatch[1].trim(), description: "", price: sameLineMatch[2], wasPrice: "", removed: false });
        i++;
        continue;
      }

      const tabMatch = line.match(tabPriceRegex);
      if (tabMatch) {
        items.push({ name: tabMatch[1].trim(), description: "", price: tabMatch[2], wasPrice: "", removed: false });
        i++;
        continue;
      }

      let desc = "";
      let price = "0.00";
      let wasPrice = "";
      let j = i + 1;

      while (j < lines.length) {
        const next = lines[j];
        const priceMatch = next.match(priceLineRegex) || next.match(numPriceRegex);
        if (priceMatch) {
          if (!price || price === "0.00") {
            price = priceMatch[1];
          } else {
            wasPrice = price;
            price = priceMatch[1];
          }
          j++;
          continue;
        }
        if (isInfoLine(next)) {
          const cleaned = next.replace(infoLineRegex, "").trim();
          if (cleaned) desc = desc ? `${desc}, ${cleaned}` : cleaned;
          j++;
          continue;
        }
        const wasPriceMatch = next.match(wasPriceRegex);
        if (wasPriceMatch) {
          wasPrice = wasPriceMatch[1];
          j++;
          continue;
        }
        break;
      }

      items.push({ name: line, description: desc, price, wasPrice, removed: false });
      i = j;
    }
    return items;
  };

  const handleTextChange = (text: string) => {
    setPasteText(text);
    if (text.trim()) {
      setParsedItems(parseText(text));
    } else {
      setParsedItems([]);
    }
  };

  const toggleItem = (idx: number) => {
    setParsedItems(prev => prev.map((item, i) => i === idx ? { ...item, removed: !item.removed } : item));
  };

  const updateItemName = (idx: number, name: string) => {
    setParsedItems(prev => prev.map((item, i) => i === idx ? { ...item, name } : item));
  };

  const updateItemPrice = (idx: number, price: string) => {
    setParsedItems(prev => prev.map((item, i) => i === idx ? { ...item, price } : item));
  };

  const updateItemDesc = (idx: number, description: string) => {
    setParsedItems(prev => prev.map((item, i) => i === idx ? { ...item, description } : item));
  };

  const updateItemWasPrice = (idx: number, wasPrice: string) => {
    setParsedItems(prev => prev.map((item, i) => i === idx ? { ...item, wasPrice } : item));
  };

  const activeItems = parsedItems.filter(i => !i.removed);

  const saveAllProducts = async () => {
    if (!pasteBranch) {
      toast({ title: "Please select a supermarket first", variant: "destructive" });
      return;
    }
    if (!pasteMainCat) {
      toast({ title: "Please select a main category first", variant: "destructive" });
      return;
    }
    if (!activeItems.length) {
      toast({ title: "No products to save", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    if (replaceMode) {
      try {
        const result = await apiCall("/api/grocery/products/bulk-update", "POST", {
          branchId: pasteBranch,
          mainCategoryId: pasteMainCat,
          subCategoryId: pasteSubCat || null,
          subSubCategoryId: pasteSubSubCat || null,
          products: activeItems.map(item => ({
            name: item.name,
            description: item.description || null,
            nowPrice: item.price || "0.00",
            wasPrice: item.wasPrice || null,
          })),
        });
        setIsSaving(false);
        setPasteText("");
        setParsedItems([]);
        qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
        toast({ title: `${result.updated} updated, ${result.added} new products added. Images preserved!` });
        return;
      } catch {}
    }
    let count = 0;
    for (const item of activeItems) {
      try {
        await apiCall("/api/grocery/products", "POST", {
          branchId: pasteBranch,
          mainCategoryId: pasteMainCat,
          subCategoryId: pasteSubCat || null,
          subSubCategoryId: pasteSubSubCat || null,
          name: item.name,
          description: item.description || null,
          nowPrice: item.price || "0.00",
          wasPrice: item.wasPrice || null,
          stockQuantity: 0,
          unit: "each",
        });
        count++;
      } catch {}
    }
    setIsSaving(false);
    setPasteText("");
    setParsedItems([]);
    qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
    toast({ title: `${count} product${count !== 1 ? "s" : ""} added in ${pMainCats.find(c => c.id === pasteMainCat)?.name || "category"}!` });
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <ClipboardPaste className="h-6 w-6" />
            Paste Products
          </CardTitle>
          <p className="text-purple-100 text-sm">
            Paste product lists from supermarket websites, Word, PDF, or any source. Automatically detects product names, descriptions, and prices.
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Select Supermarket</CardTitle></CardHeader>
        <CardContent>
          <Select value={pasteBranch} onValueChange={(v) => { setPasteBranch(v); setPasteMainCat(""); setPasteSubCat(""); setPasteSubSubCat(""); }}>
            <SelectTrigger data-testid="select-paste-branch"><SelectValue placeholder="Choose supermarket..." /></SelectTrigger>
            <SelectContent>
              {pasteBranches.map((b: Branch) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Select Main Category *</CardTitle></CardHeader>
          <CardContent>
            <Select value={pasteMainCat} onValueChange={(v) => { setPasteMainCat(v); setPasteSubCat(""); setPasteSubSubCat(""); }} disabled={!pasteBranch}>
              <SelectTrigger data-testid="select-paste-main-cat"><SelectValue placeholder={pasteBranch ? "Choose main category..." : "Select supermarket first"} /></SelectTrigger>
              <SelectContent>
                {pMainCats.map((c: MainCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Select Sub Category (optional)</CardTitle></CardHeader>
          <CardContent>
            <Select value={pasteSubCat} onValueChange={(v) => { setPasteSubCat(v); setPasteSubSubCat(""); }} disabled={!pasteMainCat}>
              <SelectTrigger data-testid="select-paste-sub-cat"><SelectValue placeholder={pasteMainCat ? "Choose sub category..." : "Select main first"} /></SelectTrigger>
              <SelectContent>
                {pSubCats.map((c: SubCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {pasteSubCat && pSubSubCats.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Select Sub+Sub Category (optional)</CardTitle></CardHeader>
          <CardContent>
            <Select value={pasteSubSubCat} onValueChange={setPasteSubSubCat}>
              <SelectTrigger data-testid="select-paste-subsub-cat"><SelectValue placeholder="Choose sub+sub category..." /></SelectTrigger>
              <SelectContent>
                {pSubSubCats.map((c: SubSubCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5 text-purple-600" />
              Paste Product List
            </CardTitle>
            {(pasteText.trim() || pasteMainCat || pasteSubCat) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setPasteText(""); setParsedItems([]); setPasteMainCat(""); setPasteSubCat(""); setPasteSubSubCat(""); setReplaceMode(false); }}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                data-testid="button-clear-paste"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Paste from supermarket websites, Word, PDF, or any source. Automatically detects names, calorie info, and prices.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={pasteText}
            onChange={e => handleTextChange(e.target.value)}
            placeholder={"Paste your product list here...\n\nSupported formats:\n\nArla Lacto Free Whole Milk Drink 1 Litre\n* 56 Kcal per 100ml\n£2.15\nArla Long Life Milk Semi-Skimmed 1 Litre\n* 49 Kcal per 100ml\n£1.09\n\nOr simple format:\nWhole Milk 2L £1.89\nSemi Skimmed Milk 1L £1.29"}
            rows={12}
            className="font-mono text-sm"
            data-testid="textarea-paste-products"
          />
          {pasteText.trim() && (
            <p className="text-sm text-muted-foreground mt-2">
              {parsedItems.length} product{parsedItems.length !== 1 ? "s" : ""} detected ({activeItems.length} to add)
            </p>
          )}
        </CardContent>
      </Card>

      {parsedItems.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Parsed Products ({activeItems.length})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <input type="checkbox" checked={replaceMode} onChange={e => setReplaceMode(e.target.checked)} className="rounded" data-testid="toggle-replace-mode" />
                <span className="font-medium text-amber-800">Update existing (keep images)</span>
              </label>
              <Button variant="outline" onClick={() => { setPasteText(""); setParsedItems([]); }} className="gap-2">
                <X className="h-4 w-4" /> Clear All
              </Button>
              <Button
                onClick={saveAllProducts}
                disabled={isSaving || !pasteMainCat || !pasteBranch || activeItems.length === 0}
                className={`gap-2 ${replaceMode ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"}`}
                data-testid="button-save-pasted-products"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {replaceMode ? "Update" : "Save"} {activeItems.length} Product{activeItems.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {parsedItems.map((item, idx) => (
              <Card key={idx} className={`transition-all ${item.removed ? "opacity-40 bg-gray-50" : "hover:shadow-md"}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleItem(idx)}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${item.removed ? "border-gray-300 bg-gray-100" : "border-purple-500 bg-purple-500"}`}
                      data-testid={`toggle-item-${idx}`}
                    >
                      {!item.removed && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Input
                        value={item.name}
                        onChange={e => updateItemName(idx, e.target.value)}
                        className={`text-sm font-medium h-8 ${item.removed ? "line-through text-gray-400" : ""}`}
                        disabled={item.removed}
                        data-testid={`input-item-name-${idx}`}
                      />
                      {item.description && (
                        <Input
                          value={item.description}
                          onChange={e => updateItemDesc(idx, e.target.value)}
                          className="text-xs h-7 text-muted-foreground"
                          disabled={item.removed}
                          placeholder="Description / calorie info"
                          data-testid={`input-item-desc-${idx}`}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 font-bold">£</span>
                          <Input
                            value={item.price}
                            onChange={e => updateItemPrice(idx, e.target.value)}
                            className="text-sm h-7 w-20 font-semibold"
                            disabled={item.removed}
                            placeholder="0.00"
                            data-testid={`input-item-price-${idx}`}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400">Was £</span>
                          <Input
                            value={item.wasPrice}
                            onChange={e => updateItemWasPrice(idx, e.target.value)}
                            className="text-xs h-7 w-16 text-gray-400"
                            disabled={item.removed}
                            placeholder="—"
                            data-testid={`input-item-was-price-${idx}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveAllProducts}
              disabled={isSaving || !pasteMainCat || !pasteBranch || activeItems.length === 0}
              className="gap-2 bg-purple-600 hover:bg-purple-700 h-12 px-8 text-lg"
              data-testid="button-save-pasted-products-bottom"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {replaceMode ? "Update" : "Save"} All {activeItems.length} Products
            </Button>
          </div>
        </>
      )}

      {parsedItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardPaste className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Paste your product list above</h3>
          <p className="text-sm max-w-md mx-auto">Copy product lists from supermarket websites, Word, PDF, or any document. The system automatically detects product names, calorie/nutritional info, and prices.</p>
        </div>
      )}
    </div>
  );
}

const PRESET_COLORS = [
  "#ffffff", "#f8f9fa", "#e9ecef", "#dee2e6", "#ced4da",
  "#ff6b6b", "#ee5a24", "#f0932b", "#f9ca24", "#6ab04c",
  "#22a6b3", "#30336b", "#be2edd", "#e84393", "#fd79a8",
  "#0984e3", "#00cec9", "#55efc4", "#74b9ff", "#a29bfe",
  "#2d3436", "#636e72", "#b2bec3", "#dfe6e9", "#ffeaa7",
];

const PRESET_GRADIENTS = [
  { name: "Sunset", colors: ["#ff6b6b", "#f0932b"] },
  { name: "Ocean", colors: ["#0984e3", "#00cec9"] },
  { name: "Purple", colors: ["#6c5ce7", "#a29bfe"] },
  { name: "Forest", colors: ["#00b894", "#55efc4"] },
  { name: "Rose", colors: ["#e84393", "#fd79a8"] },
  { name: "Night", colors: ["#2d3436", "#636e72"] },
  { name: "Gold", colors: ["#f9ca24", "#f0932b"] },
  { name: "Mint", colors: ["#00cec9", "#55efc4"] },
  { name: "Berry", colors: ["#6c5ce7", "#e84393"] },
  { name: "Sky", colors: ["#74b9ff", "#a29bfe"] },
  { name: "Fire", colors: ["#ff6b6b", "#f9ca24"] },
  { name: "Lime", colors: ["#6ab04c", "#f9ca24"] },
];

function ImageBgToolsSection({ products, qc, toast }: { products: Product[]; qc: any; toast: any }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bgMode, setBgMode] = useState<"none" | "color" | "gradient">("none");
  const [solidColor, setSolidColor] = useState("#ffffff");
  const [gradientColor1, setGradientColor1] = useState("#ff6b6b");
  const [gradientColor2, setGradientColor2] = useState("#f0932b");
  const [gradientDirection, setGradientDirection] = useState("to bottom");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [originalImages, setOriginalImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("grocery_original_images");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try {
      const saved = localStorage.getItem("grocery_original_images");
      const parsed = saved ? JSON.parse(saved) : {};
      setOriginalImages(parsed);
    } catch {}
  }, [products]);
  const [enable3D, setEnable3D] = useState(true);
  const [shadowIntensity, setShadowIntensity] = useState<"light" | "medium" | "strong">("medium");
  const [bgRemoveSensitivity, setBgRemoveSensitivity] = useState<"low" | "medium" | "high">("medium");

  const targetProducts = selectAll ? products : products.filter(p => selectedProducts.has(p.id));

  const persistOriginals = (originals: Record<string, string>) => {
    setOriginalImages(originals);
    try { localStorage.setItem("grocery_original_images", JSON.stringify(originals)); } catch {}
  };

  const storeOriginals = () => {
    const originals: Record<string, string> = { ...originalImages };
    for (const p of targetProducts) {
      if (p.image1 && !originals[p.id]) {
        originals[p.id] = p.image1;
      }
    }
    persistOriginals(originals);
  };

  const removeWhiteBg = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const sens = bgRemoveSensitivity;
    const tolerance = sens === "high" ? 65 : sens === "medium" ? 50 : 35;
    const featherRange = sens === "high" ? 20 : sens === "medium" ? 15 : 10;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    const edgeSamples: number[][] = [];
    for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 20))) {
      edgeSamples.push([x, 0], [x, h - 1]);
    }
    for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 20))) {
      edgeSamples.push([0, y], [w - 1, y]);
    }
    let bgR = 0, bgG = 0, bgB = 0, cnt = 0;
    for (const [cx, cy] of edgeSamples) {
      const idx = (cy * w + cx) * 4;
      bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
      cnt++;
    }
    bgR = Math.round(bgR / cnt);
    bgG = Math.round(bgG / cnt);
    bgB = Math.round(bgB / cnt);

    const colorDist = (idx: number): number => {
      return Math.sqrt((data[idx] - bgR) ** 2 + (data[idx + 1] - bgG) ** 2 + (data[idx + 2] - bgB) ** 2);
    };

    const totalPixels = w * h;
    const bgMask = new Uint8Array(totalPixels);
    const visited = new Uint8Array(totalPixels);
    const queue = new Int32Array(totalPixels);
    let head = 0, tail = 0;

    for (let x = 0; x < w; x++) {
      const topPos = x, botPos = (h - 1) * w + x;
      if (colorDist(topPos * 4) < tolerance) { queue[tail++] = topPos; visited[topPos] = 1; }
      if (colorDist(botPos * 4) < tolerance) { queue[tail++] = botPos; visited[botPos] = 1; }
    }
    for (let y = 1; y < h - 1; y++) {
      const leftPos = y * w, rightPos = y * w + w - 1;
      if (colorDist(leftPos * 4) < tolerance) { queue[tail++] = leftPos; visited[leftPos] = 1; }
      if (colorDist(rightPos * 4) < tolerance) { queue[tail++] = rightPos; visited[rightPos] = 1; }
    }

    while (head < tail) {
      const pos = queue[head++];
      bgMask[pos] = 1;
      const x = pos % w, y = (pos - x) / w;
      if (y > 0 && !visited[pos - w] && colorDist((pos - w) * 4) < tolerance) { visited[pos - w] = 1; queue[tail++] = pos - w; }
      if (y < h - 1 && !visited[pos + w] && colorDist((pos + w) * 4) < tolerance) { visited[pos + w] = 1; queue[tail++] = pos + w; }
      if (x > 0 && !visited[pos - 1] && colorDist((pos - 1) * 4) < tolerance) { visited[pos - 1] = 1; queue[tail++] = pos - 1; }
      if (x < w - 1 && !visited[pos + 1] && colorDist((pos + 1) * 4) < tolerance) { visited[pos + 1] = 1; queue[tail++] = pos + 1; }
    }

    for (let i = 0; i < totalPixels; i++) {
      if (!bgMask[i]) continue;
      const px = i * 4;
      const dist = colorDist(px);
      if (dist < tolerance - featherRange) {
        data[px + 3] = 0;
      } else {
        const alpha = Math.round(255 * ((dist - (tolerance - featherRange)) / featherRange));
        data[px + 3] = Math.min(data[px + 3], Math.max(0, alpha));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const add3DEffect = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const intensity = shadowIntensity;
    const shadowBlur = intensity === "strong" ? 30 : intensity === "medium" ? 18 : 10;
    const shadowAlpha = intensity === "strong" ? 0.45 : intensity === "medium" ? 0.3 : 0.18;
    const offsetY = intensity === "strong" ? 10 : intensity === "medium" ? 6 : 3;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.drawImage(ctx.canvas, 0, 0);

    const alphaCanvas = document.createElement("canvas");
    alphaCanvas.width = w;
    alphaCanvas.height = h;
    const alphaCtx = alphaCanvas.getContext("2d")!;
    alphaCtx.drawImage(tempCanvas, 0, 0);
    const aData = alphaCtx.getImageData(0, 0, w, h);
    const ad = aData.data;
    for (let i = 0; i < ad.length; i += 4) {
      const a = ad[i + 3];
      ad[i] = 0; ad[i + 1] = 0; ad[i + 2] = 0;
      ad[i + 3] = a > 30 ? 255 : 0;
    }
    alphaCtx.putImageData(aData, 0, 0);

    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = w;
    shadowCanvas.height = h;
    const shadowCtx = shadowCanvas.getContext("2d")!;
    shadowCtx.filter = `blur(${shadowBlur}px)`;
    shadowCtx.globalAlpha = shadowAlpha;
    shadowCtx.drawImage(alphaCanvas, 0, offsetY);

    ctx.drawImage(shadowCanvas, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
  };

  const addBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, mode: "color" | "gradient", color1: string, color2?: string, dir?: string) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.drawImage(ctx.canvas, 0, 0);

    if (mode === "gradient" && color2) {
      let x0 = 0, y0 = 0, x1 = 0, y1 = h;
      if (dir === "to right") { x1 = w; y1 = 0; }
      else if (dir === "to bottom right") { x1 = w; y1 = h; }
      else if (dir === "to top") { y0 = h; y1 = 0; }
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = color1;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.fillRect(0, 0, w, h);

    if (enable3D) {
      add3DEffect(tempCtx, w, h);
      ctx.drawImage(tempCanvas, 0, 0);
    } else {
      ctx.drawImage(tempCanvas, 0, 0);
    }
  };

  const processImages = async (mode: "remove" | "color" | "gradient" | "reset") => {
    if (mode === "reset") {
      const hasOriginals = targetProducts.some(p => originalImages[p.id]);
      if (!hasOriginals) {
        toast({ title: "No original images stored", description: "Original images are saved when you first use BG Remove or BG Color.", variant: "destructive" });
        return;
      }
      setProcessing(true);
      setProgress(0);
      let done = 0;
      for (const product of targetProducts) {
        const origUrl = originalImages[product.id];
        if (origUrl) {
          try {
            await fetch(`/api/grocery/products/${product.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image1: origUrl }),
            });
          } catch {}
        }
        done++;
        setProgress(Math.round((done / targetProducts.length) * 100));
      }
      const newOriginals = { ...originalImages };
      for (const p of targetProducts) delete newOriginals[p.id];
      persistOriginals(newOriginals);
      qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
      setProcessing(false);
      toast({ title: "Images reset!", description: `${done} image${done !== 1 ? "s" : ""} restored to original.` });
      return;
    }

    if (targetProducts.length === 0) {
      toast({ title: "No products selected", variant: "destructive" });
      return;
    }
    storeOriginals();
    setProcessing(true);
    setProgress(0);
    let done = 0;

    for (const product of targetProducts) {
      if (!product.image1) continue;
      try {
        const srcUrl = originalImages[product.id] || product.image1;
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = srcUrl + "?t=" + Date.now();
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;

        if (mode === "remove") {
          ctx.drawImage(img, 0, 0);
          removeWhiteBg(ctx, canvas.width, canvas.height);
        } else {
          ctx.drawImage(img, 0, 0);
          removeWhiteBg(ctx, canvas.width, canvas.height);
          addBackground(ctx, canvas.width, canvas.height,
            mode === "gradient" ? "gradient" : "color",
            mode === "gradient" ? gradientColor1 : solidColor,
            mode === "gradient" ? gradientColor2 : undefined,
            mode === "gradient" ? gradientDirection : undefined
          );
        }

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
        if (blob) {
          const formData = new FormData();
          formData.append("file", blob, "processed.png");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          const { url } = await uploadRes.json();
          await fetch(`/api/grocery/products/${product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image1: url }),
          });
        }
      } catch (e) {
        console.error("Error processing image:", e);
      }
      done++;
      setProgress(Math.round((done / targetProducts.length) * 100));
    }

    qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
    setProcessing(false);
    toast({
      title: mode === "remove" ? "Background removed!" : "Background applied!",
      description: `${done} image${done !== 1 ? "s" : ""} processed.`,
    });
  };

  return (
    <Card className="border-2 border-dashed border-purple-300 dark:border-purple-800">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            <h3 className="font-bold text-base">Image Background Tools</h3>
          </div>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">{targetProducts.length} images</Badge>
        </div>

        {processing && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Processing images... {progress}%</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selectAll} onChange={(e) => { setSelectAll(e.target.checked); setSelectedProducts(new Set()); }} className="rounded" />
            <span className="font-medium">All Products</span>
          </label>
          {!selectAll && (
            <span className="text-xs text-muted-foreground">Click products below to select specific ones ({selectedProducts.size} selected)</span>
          )}
        </div>

        {!selectAll && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {products.map((p, idx) => {
              const sel = selectedProducts.has(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProducts(prev => {
                      const next = new Set(prev);
                      if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                      return next;
                    });
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs ${sel ? "border-purple-500 bg-purple-50 ring-1 ring-purple-400" : "border-gray-200 hover:border-purple-300"}`}
                  data-testid={`bg-select-product-${p.id}`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${sel ? "bg-purple-500 border-purple-500" : "border-gray-300"}`}>
                    {sel && <Check className="h-3 w-3 text-white" />}
                  </div>
                  {p.image1 && <img src={p.image1} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />}
                  <span className="truncate">{p.name}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
          <Label className="text-xs font-semibold block">BG Remove Sensitivity</Label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map(s => (
              <Button
                key={s}
                size="sm"
                variant={bgRemoveSensitivity === s ? "default" : "outline"}
                onClick={() => setBgRemoveSensitivity(s)}
                className={`text-xs capitalize ${bgRemoveSensitivity === s ? "bg-blue-600 text-white" : ""}`}
                data-testid={`sensitivity-${s}`}
              >
                {s === "low" ? "Low (white only)" : s === "medium" ? "Medium (recommended)" : "High (aggressive)"}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Low = only pure white removed. High = removes more background but may affect product edges. Medium is best for most images.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={() => processImages("remove")}
            disabled={processing}
            className="gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-5 rounded-xl shadow-md"
            data-testid="button-bg-remove"
          >
            <Trash2 className="h-4 w-4" /> BG Remove
          </Button>

          <Button
            onClick={() => setBgMode(bgMode !== "none" ? "none" : "color")}
            disabled={processing}
            variant={bgMode !== "none" ? "default" : "outline"}
            className={`gap-2 py-5 rounded-xl ${bgMode !== "none" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "border-purple-300 text-purple-600 hover:bg-purple-50"}`}
            data-testid="button-bg-color"
          >
            <Palette className="h-4 w-4" /> BG Color
          </Button>

          <Button
            onClick={() => processImages("reset")}
            disabled={processing}
            variant="outline"
            className="gap-2 border-gray-300 text-gray-600 hover:bg-gray-50 py-5 rounded-xl"
            data-testid="button-bg-reset"
          >
            <RefreshCw className="h-4 w-4" /> Reset to White
          </Button>
        </div>

        {bgMode !== "none" && (
          <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-200">
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={bgMode === "color" ? "default" : "outline"}
                onClick={() => setBgMode("color")}
                className="gap-1.5 text-xs"
              >
                Solid Color
              </Button>
              <Button
                size="sm"
                variant={bgMode === "gradient" ? "default" : "outline"}
                onClick={() => setBgMode("gradient")}
                className="gap-1.5 text-xs"
              >
                Gradient
              </Button>
            </div>

            <div className="p-3 bg-white rounded-lg border border-purple-100 space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={enable3D} onChange={(e) => setEnable3D(e.target.checked)} className="rounded" data-testid="toggle-3d-effect" />
                <Label className="text-xs font-semibold">3D Shadow Effect</Label>
                <Badge variant="outline" className="text-[10px]">Makes products pop!</Badge>
              </div>
              {enable3D && (
                <div className="flex gap-2 mt-1">
                  {(["light", "medium", "strong"] as const).map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={shadowIntensity === s ? "default" : "outline"}
                      onClick={() => setShadowIntensity(s)}
                      className={`text-xs capitalize ${shadowIntensity === s ? "bg-purple-600 text-white" : ""}`}
                      data-testid={`shadow-${s}`}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {bgMode === "color" && (
            <div>
              <Label className="text-xs font-semibold mb-2 block">Pick a Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setSolidColor(c); }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${solidColor === c ? "border-purple-500 ring-2 ring-purple-300 scale-110" : "border-gray-200"}`}
                    style={{ backgroundColor: c }}
                    data-testid={`color-${c}`}
                  />
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={solidColor}
                    onChange={(e) => setSolidColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-2 border-gray-200 cursor-pointer"
                    data-testid="input-custom-color"
                  />
                  <span className="text-xs text-muted-foreground">Custom</span>
                </div>
              </div>
              <Button
                onClick={() => processImages("color")}
                disabled={processing}
                className="w-full mt-3 gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-xl"
                data-testid="button-apply-solid-color"
              >
                <Palette className="h-4 w-4" /> Apply Solid Color to {targetProducts.length} Images
              </Button>
            </div>
            )}

            {bgMode === "gradient" && (
            <div>
              <Label className="text-xs font-semibold mb-2 block">Gradient Colors</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_GRADIENTS.map(g => (
                  <button
                    key={g.name}
                    onClick={() => { setGradientColor1(g.colors[0]); setGradientColor2(g.colors[1]); }}
                    className={`h-8 px-3 rounded-lg border-2 text-white text-xs font-medium transition-all hover:scale-105 ${gradientColor1 === g.colors[0] && gradientColor2 === g.colors[1] ? "border-purple-500 ring-2 ring-purple-300 scale-105" : "border-transparent"}`}
                    style={{ background: `linear-gradient(to right, ${g.colors[0]}, ${g.colors[1]})` }}
                    data-testid={`gradient-${g.name}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Color 1</Label>
                  <input type="color" value={gradientColor1} onChange={(e) => setGradientColor1(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Color 2</Label>
                  <input type="color" value={gradientColor2} onChange={(e) => setGradientColor2(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                </div>
                <div className="h-8 flex-1 rounded-lg border" style={{ background: `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})` }} />
              </div>
              <div className="flex gap-2 mb-3">
                {[
                  { label: "↓", value: "to bottom" },
                  { label: "→", value: "to right" },
                  { label: "↘", value: "to bottom right" },
                  { label: "↑", value: "to top" },
                ].map(d => (
                  <Button
                    key={d.value}
                    size="sm"
                    variant={gradientDirection === d.value ? "default" : "outline"}
                    onClick={() => setGradientDirection(d.value)}
                    className="text-xs px-3"
                  >
                    {d.label} {d.value.replace("to ", "")}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => processImages("gradient")}
                disabled={processing}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-xl"
                data-testid="button-apply-gradient"
              >
                <Palette className="h-4 w-4" /> Apply Gradient to {targetProducts.length} Images
              </Button>
            </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImagesPasteTab({ selectedBranch, qc, toast }: any) {
  const [imgMainCat, setImgMainCat] = useState("");
  const [imgSubCat, setImgSubCat] = useState("");
  const [imgSubSubCat, setImgSubSubCat] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [nextProductIndex, setNextProductIndex] = useState(0);

  const { data: imgMainCats = [] } = useQuery<MainCategory[]>({
    queryKey: ["/api/grocery/main-categories", selectedBranch, "img"],
    queryFn: () => apiCall(`/api/grocery/main-categories/${selectedBranch}`),
    enabled: !!selectedBranch,
  });

  const { data: imgSubCats = [] } = useQuery<SubCategory[]>({
    queryKey: ["/api/grocery/sub-categories", imgMainCat, "img"],
    queryFn: () => apiCall(`/api/grocery/sub-categories/${imgMainCat}`),
    enabled: !!imgMainCat,
  });

  const { data: imgSubSubCats = [] } = useQuery<SubSubCategory[]>({
    queryKey: ["/api/grocery/sub-sub-categories", imgSubCat, "img"],
    queryFn: () => apiCall(`/api/grocery/sub-sub-categories/${imgSubCat}`),
    enabled: !!imgSubCat,
  });

  const { data: imgProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/grocery/products", selectedBranch, imgMainCat, imgSubCat, imgSubSubCat, "img"],
    queryFn: () => {
      let url = `/api/grocery/products/${selectedBranch}?`;
      if (imgMainCat) url += `mainCategoryId=${imgMainCat}&`;
      if (imgSubCat) url += `subCategoryId=${imgSubCat}&`;
      if (imgSubSubCat) url += `subSubCategoryId=${imgSubSubCat}`;
      return apiCall(url);
    },
    enabled: !!selectedBranch,
  });

  if (!selectedBranch) return <EmptyState message="Select a branch from the top bar first" />;

  const filteredProducts = imgProducts;

  const productsWithoutImages = filteredProducts.filter((p: Product) => !p.image1);
  const productsWithImages = filteredProducts.filter((p: Product) => !!p.image1);

  const handleBulkImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !filteredProducts.length) return;

    const imageItems: DataTransferItem[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        imageItems.push(items[i]);
      }
    }
    if (!imageItems.length) return;

    setIsUploading(true);
    setUploadProgress(0);
    setAssignedCount(0);
    let assigned = 0;

    const unassigned = filteredProducts
      .map((p: Product, idx: number) => ({ product: p, idx }))
      .filter(({ product }: { product: Product }) => !product.image1);

    for (let i = 0; i < imageItems.length && i < unassigned.length; i++) {
      const blob = imageItems[i].getAsFile();
      if (!blob) continue;

      try {
        const formData = new FormData();
        formData.append("file", blob, `img${unassigned[i].idx + 1}.png`);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const { url } = await uploadRes.json();

        await apiCall(`/api/grocery/products/${unassigned[i].product.id}`, "PATCH", { image1: url });
        try {
          const saved = localStorage.getItem("grocery_original_images");
          if (saved) {
            const originals = JSON.parse(saved);
            delete originals[unassigned[i].product.id];
            localStorage.setItem("grocery_original_images", JSON.stringify(originals));
          }
        } catch {}
        assigned++;
        setAssignedCount(assigned);
        setUploadProgress(Math.round(((i + 1) / imageItems.length) * 100));
      } catch {}
    }

    await qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
    setIsUploading(false);
    toast({ title: `${assigned} image${assigned !== 1 ? "s" : ""} assigned to products!` });
  };

  const removeImage = async (productId: string, field: "image1" | "image2") => {
    await apiCall(`/api/grocery/products/${productId}`, "PATCH", { [field]: null });
    qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
    toast({ title: "Image removed" });
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <ImagePlus className="h-6 w-6" />
              Bulk Images Paste
            </CardTitle>
            {(imgMainCat || imgSubCat) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setImgMainCat(""); setImgSubCat(""); setImgSubSubCat(""); }}
                className="gap-1.5 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                data-testid="button-clear-images-paste"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </Button>
            )}
          </div>
          <p className="text-pink-100 text-sm">
            Paste multiple images and auto-assign to products in order
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Select Main Category</CardTitle></CardHeader>
          <CardContent>
            <Select value={imgMainCat} onValueChange={(v) => { setImgMainCat(v); setImgSubCat(""); setImgSubSubCat(""); }}>
              <SelectTrigger data-testid="select-img-main-cat"><SelectValue placeholder="Choose main category..." /></SelectTrigger>
              <SelectContent>
                {imgMainCats.map((c: MainCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Select Sub Category</CardTitle></CardHeader>
          <CardContent>
            <Select value={imgSubCat} onValueChange={(v) => { setImgSubCat(v); setImgSubSubCat(""); }} disabled={!imgMainCat}>
              <SelectTrigger data-testid="select-img-sub-cat"><SelectValue placeholder={imgMainCat ? "Choose sub category..." : "Select main first"} /></SelectTrigger>
              <SelectContent>
                {imgSubCats.map((c: SubCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {imgSubCat && imgSubSubCats.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Select Sub+Sub Category</CardTitle></CardHeader>
          <CardContent>
            <Select value={imgSubSubCat} onValueChange={setImgSubSubCat}>
              <SelectTrigger data-testid="select-img-subsub-cat"><SelectValue placeholder="Choose sub+sub category..." /></SelectTrigger>
              <SelectContent>
                {imgSubSubCats.map((c: SubSubCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {imgMainCat && filteredProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-pink-600" />
              Step 2: Products in Category ({filteredProducts.length} items)
              {productsWithoutImages.length > 0 && (
                <Badge variant="outline" className="text-pink-600 border-pink-300 ml-2">{productsWithoutImages.length} need images</Badge>
              )}
              {productsWithImages.length > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-300 ml-1">{productsWithImages.length} have images</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Products shown in the exact order they were added. Paste images to assign them from #1 downwards.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredProducts.map((p: Product, idx: number) => (
                <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${p.image1 ? "border border-green-200 bg-green-50/30 hover:bg-green-50" : "border-2 border-dashed border-pink-200 bg-pink-50/30 hover:bg-pink-50"}`} data-testid={`img-item-${idx}`}>
                  <span className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center shrink-0 ${p.image1 ? "bg-green-600 text-white" : "bg-pink-600 text-white"}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className={`text-[11px] ${p.image1 ? "text-green-500" : "text-pink-500"}`}>
                      {p.image1 ? "✓ image assigned" : `img${idx + 1}`}
                    </p>
                  </div>
                  {p.image1 ? (
                    <div className="relative group shrink-0">
                      <img src={p.image1} alt="" className="w-10 h-10 object-cover rounded-lg border" />
                      <button
                        onClick={() => removeImage(p.id, "image1")}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >×</button>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg border-2 border-dashed border-pink-300 bg-white shrink-0 flex items-center justify-center">
                      <ImagePlus className="h-4 w-4 text-pink-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {imgMainCat && productsWithImages.length > 0 && (
        <ImageBgToolsSection products={filteredProducts.filter((p: Product) => !!p.image1)} qc={qc} toast={toast} />
      )}

      {imgMainCat && filteredProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5 text-pink-600" />
              Step 3: Paste Images
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Copy images from Canva/Word and paste here. Images will be named img1, img2, img3... and assigned to products in order.
            </p>
          </CardHeader>
          <CardContent>
            {isUploading && (
              <div className="mb-4 p-3 bg-pink-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-pink-600" />
                  <span className="text-sm font-medium text-pink-700">Uploading and assigning images... ({assignedCount} done)</span>
                </div>
                <div className="w-full bg-pink-200 rounded-full h-2">
                  <div className="bg-pink-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            <div
              className="border-2 border-dashed border-pink-300 rounded-xl p-12 text-center cursor-pointer hover:bg-pink-50/50 transition-colors"
              onPaste={handleBulkImagePaste}
              tabIndex={0}
              data-testid="bulk-images-paste-area"
            >
              <ImagePlus className="h-12 w-12 mx-auto text-pink-400 mb-4" />
              <p className="text-lg font-medium text-pink-600">Click here and paste images (Ctrl+V / Cmd+V)</p>
              <p className="text-sm text-muted-foreground mt-2">
                {productsWithoutImages.length > 0
                  ? `${productsWithoutImages.length} product${productsWithoutImages.length !== 1 ? "s" : ""} waiting for images. Paste one image at a time — each paste assigns to the next product without an image.`
                  : "All products have images! Remove an image above to reassign."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}


      {imgMainCat && filteredProducts.length === 0 && (
        <EmptyState message="No products in this category. Add products first in the Products tab." />
      )}

      {!imgMainCat && (
        <div className="text-center py-12 text-muted-foreground">
          <ImagePlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Select a category to start</h3>
          <p className="text-sm max-w-md mx-auto">Choose a main category and optionally a sub category above. Products will be listed and you can bulk-paste images to assign them automatically.</p>
        </div>
      )}
    </div>
  );
}

function OrdersTab({ selectedBranch, qc, toast }: any) {
  const [viewOrder, setViewOrder] = useState<GroceryOrder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrderCount = useRef(0);

  const { data: orders = [] } = useQuery<GroceryOrder[]>({
    queryKey: ["/api/grocery/orders", selectedBranch],
    queryFn: () => apiCall(`/api/grocery/orders/${selectedBranch}`),
    enabled: !!selectedBranch,
    refetchInterval: 5000,
  });

  const { data: drivers = [] } = useQuery<GroceryDriver[]>({
    queryKey: ["/api/grocery/drivers", selectedBranch],
    queryFn: () => apiCall(`/api/grocery/drivers/${selectedBranch}`),
    enabled: !!selectedBranch,
  });

  const { data: orderItems = [] } = useQuery<GroceryOrderItem[]>({
    queryKey: ["/api/grocery/order-items", viewOrder?.id],
    queryFn: () => apiCall(`/api/grocery/orders/${selectedBranch}/items/${viewOrder!.id}`),
    enabled: !!viewOrder,
  });

  useEffect(() => {
    if (!selectedBranch) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/grocery-ws?groceryBranchId=${selectedBranch}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "new_order") {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          }
          audioRef.current.play().catch(() => {});
        } catch (e) {}
        toast({ title: "New Order!", description: `${data.order.customerName} - ${data.order.total}` });
        qc.invalidateQueries({ queryKey: ["/api/grocery/orders"] });
      }
      if (data.type === "order_updated" || data.type === "delivery_status" || data.type === "driver_location") {
        qc.invalidateQueries({ queryKey: ["/api/grocery/orders"] });
      }
    };
    return () => ws.close();
  }, [selectedBranch, qc, toast]);

  useEffect(() => {
    if (orders.length > prevOrderCount.current && prevOrderCount.current > 0) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        }
        audioRef.current.play().catch(() => {});
      } catch (e) {}
    }
    prevOrderCount.current = orders.length;
  }, [orders.length]);

  const updateStatus = async (orderId: string, status: string) => {
    await apiCall(`/api/grocery/orders/${orderId}/status`, "PATCH", { status });
    qc.invalidateQueries({ queryKey: ["/api/grocery/orders"] });
    toast({ title: `Order ${status}` });
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    await apiCall(`/api/grocery/orders/${orderId}/assign-driver`, "POST", { driverId });
    qc.invalidateQueries({ queryKey: ["/api/grocery/orders"] });
    toast({ title: "Driver assigned" });
  };

  if (!selectedBranch) return <EmptyState message="Select a branch to view orders" />;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800", ready: "bg-purple-100 text-purple-800",
    delivering: "bg-indigo-100 text-indigo-800", completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  if (viewOrder) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setViewOrder(null)} data-testid="button-back-orders">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>Order #{viewOrder.id.slice(0, 8)}</span>
              <Badge className={statusColors[viewOrder.status] || ""}>{viewOrder.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="flex items-center gap-2"><User className="h-4 w-4" /> {viewOrder.customerName}</p>
                {viewOrder.customerPhone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {viewOrder.customerPhone}</p>}
                {viewOrder.customerAddress && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {viewOrder.customerAddress}</p>}
                {viewOrder.notes && <p className="text-sm text-muted-foreground">Notes: {viewOrder.notes}</p>}
                <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {new Date(viewOrder.createdAt).toLocaleString()}</p>
              </div>
              <div className="space-y-2 text-right">
                <p>Subtotal: {viewOrder.subtotal}</p>
                <p>Delivery: {viewOrder.deliveryCharge}</p>
                {parseFloat(viewOrder.discount) > 0 && <p className="text-green-600">Discount: -{viewOrder.discount}</p>}
                <p className="text-xl font-bold">Total: {viewOrder.total}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="space-y-2">
                {orderItems.map((item: GroceryOrderItem) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 border rounded" data-testid={`order-item-${item.id}`}>
                    {item.productImage && <img src={item.productImage} alt="" className="w-10 h-10 object-cover rounded" />}
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">x{item.quantity} @ {item.price}</p>
                    </div>
                    <p className="font-semibold">{item.total}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <h4 className="w-full font-semibold">Update Status</h4>
              {["confirmed", "preparing", "ready", "delivering", "completed", "cancelled"].map(s => (
                <Button key={s} size="sm" variant={viewOrder.status === s ? "default" : "outline"} onClick={() => updateStatus(viewOrder.id, s)} data-testid={`button-status-${s}`}>
                  {s}
                </Button>
              ))}
            </div>
            {viewOrder.status !== "completed" && viewOrder.status !== "cancelled" && (
              <div>
                <h4 className="font-semibold mb-2">Assign Driver</h4>
                <div className="flex flex-wrap gap-2">
                  {drivers.filter((d: GroceryDriver) => d.isActive).map((d: GroceryDriver) => (
                    <Button key={d.id} size="sm" variant="outline" onClick={() => assignDriver(viewOrder.id, d.id)} data-testid={`assign-driver-${d.id}`}>
                      <Truck className="h-3 w-3 mr-1" /> {d.name} {d.isOnDuty ? "(On Duty)" : "(Off)"}
                    </Button>
                  ))}
                  {drivers.filter((d: GroceryDriver) => d.isActive).length === 0 && <p className="text-sm text-muted-foreground">No drivers added yet</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{orders.filter((o: GroceryOrder) => o.status === "pending").length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{orders.filter((o: GroceryOrder) => o.status === "confirmed").length}</p><p className="text-xs text-muted-foreground">Confirmed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-indigo-600">{orders.filter((o: GroceryOrder) => o.status === "delivering").length}</p><p className="text-xs text-muted-foreground">Delivering</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{orders.filter((o: GroceryOrder) => o.status === "completed").length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </div>
      {orders.length === 0 ? (
        <EmptyState message="No orders yet" />
      ) : (
        <div className="space-y-3">
          {orders.map((order: GroceryOrder) => (
            <Card key={order.id} className={`cursor-pointer hover:shadow-md transition ${order.status === "pending" ? "border-yellow-400 border-2 animate-pulse" : ""}`} onClick={() => setViewOrder(order)} data-testid={`order-card-${order.id}`}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {order.status === "pending" && <Bell className="h-5 w-5 text-yellow-500 animate-bounce" />}
                  <div>
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                  <span className="font-bold">{order.total}</span>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DriversTab({ selectedBranch, qc, toast }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("car");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const { data: drivers = [] } = useQuery<GroceryDriver[]>({
    queryKey: ["/api/grocery/drivers", selectedBranch],
    queryFn: () => apiCall(`/api/grocery/drivers/${selectedBranch}`),
    enabled: !!selectedBranch,
  });

  if (!selectedBranch) return <EmptyState message="Select a branch to manage drivers" />;

  const addDriver = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      toast({ title: "Name, phone and password are required", variant: "destructive" });
      return;
    }
    await apiCall("/api/grocery/drivers", "POST", { branchId: selectedBranch, name: name.trim(), phone: phone.trim(), password, vehicleType, vehiclePlate: vehiclePlate || null });
    qc.invalidateQueries({ queryKey: ["/api/grocery/drivers"] });
    toast({ title: "Driver added" });
    setName(""); setPhone(""); setPassword(""); setVehiclePlate(""); setShowAdd(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await apiCall(`/api/grocery/drivers/${id}`, "PATCH", { isActive: !current });
    qc.invalidateQueries({ queryKey: ["/api/grocery/drivers"] });
  };

  const deleteDriver = async (id: string) => {
    if (!confirm("Delete this driver?")) return;
    await apiCall(`/api/grocery/drivers/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/grocery/drivers"] });
    toast({ title: "Driver deleted" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Drivers ({drivers.length})</h3>
        <Button onClick={() => setShowAdd(!showAdd)} data-testid="button-add-driver">
          <Plus className="h-4 w-4 mr-2" /> Add Driver
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Driver name" data-testid="input-driver-name" />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" data-testid="input-driver-phone" />
              </div>
              <div>
                <Label>Password *</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Login password" data-testid="input-driver-password" />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger data-testid="select-vehicle-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle Plate</Label>
                <Input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="Optional" data-testid="input-driver-plate" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addDriver} data-testid="button-save-driver"><Save className="h-4 w-4 mr-2" /> Save Driver</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {drivers.length === 0 ? (
        <EmptyState message="No drivers added yet" />
      ) : (
        <div className="space-y-3">
          {drivers.map((d: GroceryDriver) => (
            <Card key={d.id} data-testid={`driver-card-${d.id}`}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${d.isOnDuty ? "bg-green-100" : "bg-gray-100"}`}>
                    {d.vehicleType === "bike" ? <Bike className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-sm text-muted-foreground">{d.phone} {d.vehiclePlate && `· ${d.vehiclePlate}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={d.isOnDuty ? "default" : "secondary"}>{d.isOnDuty ? "On Duty" : "Off Duty"}</Badge>
                  <Badge variant={d.isActive ? "default" : "destructive"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                  {d.lastLocationLat && d.lastLocationLng && (
                    <a href={`https://www.google.com/maps?q=${d.lastLocationLat},${d.lastLocationLng}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><MapPin className="h-3 w-3 mr-1" /> Track</Button>
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={() => toggleActive(d.id, d.isActive)} data-testid={`toggle-active-${d.id}`}>
                    {d.isActive ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteDriver(d.id)} data-testid={`delete-driver-${d.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewTab({ branches, selectedBranch, mainCategories: _mc, subCategories: _sc, products: _pr }: any) {
  const branchId = selectedBranch || (branches.length > 0 ? branches[0].id : "");

  const { data: allMainCats = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/main-categories", branchId],
    queryFn: () => apiCall(`/api/grocery/main-categories/${branchId}`),
    enabled: !!branchId,
  });

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/products", branchId, "overview-all"],
    queryFn: () => apiCall(`/api/grocery/products/${branchId}`),
    enabled: !!branchId,
  });

  const allSubCounts = useQuery<number>({
    queryKey: ["/api/grocery/sub-categories-count", branchId, allMainCats.map((c: any) => c.id).join(",")],
    queryFn: async () => {
      if (!allMainCats.length) return 0;
      const results = await Promise.all(
        allMainCats.map((cat: any) => apiCall(`/api/grocery/sub-categories/${cat.id}`))
      );
      return results.reduce((sum: number, arr: any[]) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    },
    enabled: !!branchId && allMainCats.length > 0,
  });
  const totalSubCats = allSubCounts.data ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Store className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-3xl font-bold">{branches.length}</p>
            <p className="text-sm text-muted-foreground">Branches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <FolderTree className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-3xl font-bold">{allMainCats.length}</p>
            <p className="text-sm text-muted-foreground">Main Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Layers className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-3xl font-bold">{totalSubCats}</p>
            <p className="text-sm text-muted-foreground">Sub Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-3xl font-bold">{allProducts.length}</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CategoryLayoutTab({ selectedBranch, branches, qc, toast }: any) {
  const DEFAULT_NAVY = "#1e293b";
  const [bgType, setBgType] = useState("color");
  const [bgColor, setBgColor] = useState(DEFAULT_NAVY);
  const [bgImages, setBgImages] = useState<string[]>([]);
  const [bgVideo, setBgVideo] = useState("");
  const [bgAnimation, setBgAnimation] = useState("slide-left");
  const [bgAnimationSpeed, setBgAnimationSpeed] = useState(5000);
  const [saving, setSaving] = useState(false);
  const [previewAnim, setPreviewAnim] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!selectedBranch) return;
    const br = branches.find((b: any) => b.id === selectedBranch);
    if (br) {
      setBgType(br.categoryBgType || "color");
      setBgColor(br.categoryBgColor || DEFAULT_NAVY);
      setBgImages(Array.isArray(br.categoryBgImages) ? br.categoryBgImages : []);
      setBgVideo(br.categoryBgVideo || "");
      setBgAnimation(br.categoryBgAnimation || "slide-left");
      setBgAnimationSpeed(br.categoryBgAnimationSpeed || 5000);
    }
  }, [selectedBranch, branches]);

  useEffect(() => {
    if (!previewAnim || bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bgImages.length);
    }, bgAnimationSpeed);
    return () => clearInterval(interval);
  }, [previewAnim, bgImages.length, bgAnimationSpeed]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setBgImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setBgImages(prev => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!selectedBranch) return toast({ title: "Select a branch first", variant: "destructive" });
    setSaving(true);
    try {
      await apiCall(`/api/grocery/branches/${selectedBranch}`, "PATCH", {
        categoryBgType: bgType,
        categoryBgColor: bgColor,
        categoryBgImages: bgImages,
        categoryBgVideo: bgVideo || null,
        categoryBgAnimation: bgAnimation,
        categoryBgAnimationSpeed: bgAnimationSpeed,
      });
      qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
      toast({ title: "Category layout saved!" });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const animationOptions = [
    { value: "slide-left", label: "Slide from Right" },
    { value: "slide-right", label: "Slide from Left" },
    { value: "slide-down", label: "Slide from Top" },
    { value: "slide-up", label: "Slide from Bottom" },
    { value: "fade", label: "Fade In / Out" },
    { value: "zoom", label: "Zoom In / Out" },
    { value: "flip", label: "Flip Card" },
    { value: "rotate-corner", label: "Corner Rotate Mix" },
    { value: "blinds", label: "Window Blinds Open" },
    { value: "swirl", label: "Swirl Effect" },
  ];

  const getAnimationClass = () => {
    switch (bgAnimation) {
      case "slide-left": return "animate-slideLeft";
      case "slide-right": return "animate-slideRight";
      case "slide-down": return "animate-slideDown";
      case "slide-up": return "animate-slideUp";
      case "fade": return "animate-fadeIn";
      case "zoom": return "animate-zoomIn";
      case "flip": return "animate-flipIn";
      case "rotate-corner": return "animate-rotateCorner";
      case "blinds": return "animate-blinds";
      case "swirl": return "animate-swirl";
      default: return "animate-fadeIn";
    }
  };

  if (!selectedBranch) return (
    <div className="p-8 text-center">
      <LayoutDashboard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-xl font-bold mb-2">Main Category Layout</h2>
      <p className="text-muted-foreground">Select a branch from Branches tab first</p>
    </div>
  );

  const currentBranch = branches.find((b: any) => b.id === selectedBranch);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" /> Main Category Layout
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Customize category section background for: <span className="font-semibold text-primary">{currentBranch?.name}</span></p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-save-category-layout">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Layout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Background Type</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setBgType("color")}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${bgType === "color" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                data-testid="button-bg-type-color"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500" />
                <span className="font-medium text-sm">Solid Color</span>
              </button>
              <button
                onClick={() => setBgType("image")}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${bgType === "image" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                data-testid="button-bg-type-image"
              >
                <ImagePlus className="w-10 h-10 text-blue-500" />
                <span className="font-medium text-sm">Image / Slider</span>
              </button>
              <button
                onClick={() => setBgType("video")}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${bgType === "video" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                data-testid="button-bg-type-video"
              >
                <Video className="w-10 h-10 text-purple-500" />
                <span className="font-medium text-sm">Video</span>
              </button>
            </div>

            {bgType === "color" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Background Color</Label>
                  <Button variant="outline" size="sm" onClick={() => setBgColor(DEFAULT_NAVY)} className="gap-1.5 text-xs" data-testid="button-reset-bg-color">
                    <RefreshCw className="h-3 w-3" /> Reset to Default
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-14 h-14 rounded-xl border cursor-pointer"
                    data-testid="input-bg-color"
                  />
                  <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1" placeholder={DEFAULT_NAVY} data-testid="input-bg-color-text" />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[DEFAULT_NAVY,"#1e293b","#1a2744","#162040","#0c1e3a","#0a1628","#1b2a4a","#fef3c7","#ecfdf5","#eff6ff","#fdf2f8","#f5f3ff"].map(c => (
                    <button key={c} onClick={() => setBgColor(c)} className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110" style={{ backgroundColor: c, borderColor: bgColor === c ? "#007AFF" : "transparent" }} data-testid={`button-preset-color-${c}`} />
                  ))}
                </div>
              </div>
            )}

            {bgType === "image" && (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Upload Images (PNG, JPG, GIF)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Upload multiple images to create a slider</p>
                  <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" data-testid="label-upload-bg-images">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload images</span>
                    <input type="file" accept="image/*,.gif" multiple onChange={handleImageUpload} className="hidden" data-testid="input-upload-bg-images" />
                  </label>
                </div>

                {bgImages.length > 0 && (
                  <div className="space-y-3">
                    <Label className="font-medium">Uploaded Images ({bgImages.length})</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {bgImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden aspect-video border">
                          <img src={img} alt={`bg-${idx}`} className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-remove-bg-image-${idx}`}>
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bgImages.length > 1 && (
                  <div className="space-y-3">
                    <Label className="font-medium">Slider Animation</Label>
                    <Select value={bgAnimation} onValueChange={setBgAnimation}>
                      <SelectTrigger data-testid="select-bg-animation"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {animationOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="space-y-2">
                      <Label className="font-medium">Speed: {(bgAnimationSpeed / 1000).toFixed(1)}s</Label>
                      <input
                        type="range"
                        min={1000}
                        max={15000}
                        step={500}
                        value={bgAnimationSpeed}
                        onChange={(e) => setBgAnimationSpeed(Number(e.target.value))}
                        className="w-full accent-primary"
                        data-testid="input-bg-animation-speed"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1s (Fast)</span><span>15s (Slow)</span>
                      </div>
                    </div>

                    <Button variant="outline" onClick={() => setPreviewAnim(!previewAnim)} className="gap-2 w-full" data-testid="button-toggle-preview">
                      <Eye className="h-4 w-4" /> {previewAnim ? "Stop Preview" : "Preview Animation"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {bgType === "video" && (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Video URL (MP4, WebM)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Enter a direct link to a video file for the category background</p>
                  <Input
                    value={bgVideo}
                    onChange={e => setBgVideo(e.target.value)}
                    placeholder="https://example.com/background.mp4"
                    data-testid="input-bg-video-url"
                  />
                </div>
                {bgVideo && (
                  <div className="rounded-xl overflow-hidden border aspect-video">
                    <video src={bgVideo} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="relative rounded-2xl overflow-hidden border aspect-[3/4] max-h-[500px]" style={{
              backgroundColor: bgType === "color" ? bgColor : "#1e293b"
            }}>
              {bgType === "image" && bgImages.length > 0 && (
                <>
                  {bgImages.map((img, idx) => (
                    <div
                      key={`${idx}-${currentSlide}`}
                      className={`absolute inset-0 transition-all duration-700 ${previewAnim && bgImages.length > 1 ? getAnimationClass() : ""}`}
                      style={{
                        opacity: idx === currentSlide ? 1 : 0,
                        zIndex: idx === currentSlide ? 1 : 0,
                      }}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="absolute inset-0 bg-black/20 z-[2]" />
                </>
              )}
              {bgType === "video" && bgVideo && (
                <>
                  <video src={bgVideo} className="absolute inset-0 w-full h-full object-cover z-[1]" autoPlay muted loop playsInline />
                  <div className="absolute inset-0 bg-black/30 z-[2]" />
                </>
              )}
              <div className="relative z-[3] p-4 pt-8 space-y-3">
                <h3 className="text-lg font-bold" style={{ color: (bgType === "image" || bgType === "video") ? "white" : "#1e293b" }}>Shop by Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="rounded-xl aspect-square flex items-center justify-center" style={{
                      background: `linear-gradient(135deg, hsl(${i * 50}, 70%, 55%), hsl(${i * 50 + 30}, 70%, 65%))`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}>
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-lg bg-white/20" />
                        <span className="text-[10px] font-bold text-white">Category {i}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes slideLeftAnim { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideRightAnim { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideDownAnim { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideUpAnim { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeInAnim { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomInAnim { from { transform: scale(1.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes flipInAnim { from { transform: perspective(600px) rotateY(90deg); opacity: 0; } to { transform: perspective(600px) rotateY(0); opacity: 1; } }
        @keyframes rotateCornerAnim { from { transform: rotate(15deg) scale(1.2); opacity: 0; transform-origin: bottom left; } to { transform: rotate(0) scale(1); opacity: 1; } }
        @keyframes blindsAnim { from { clip-path: inset(0 0 100% 0); opacity: 0; } to { clip-path: inset(0 0 0 0); opacity: 1; } }
        @keyframes swirlAnim { from { transform: rotate(180deg) scale(0); opacity: 0; } to { transform: rotate(0) scale(1); opacity: 1; } }
        .animate-slideLeft { animation: slideLeftAnim 0.7s ease-out forwards; }
        .animate-slideRight { animation: slideRightAnim 0.7s ease-out forwards; }
        .animate-slideDown { animation: slideDownAnim 0.7s ease-out forwards; }
        .animate-slideUp { animation: slideUpAnim 0.7s ease-out forwards; }
        .animate-fadeIn { animation: fadeInAnim 0.7s ease-out forwards; }
        .animate-zoomIn { animation: zoomInAnim 0.7s ease-out forwards; }
        .animate-flipIn { animation: flipInAnim 0.7s ease-out forwards; }
        .animate-rotateCorner { animation: rotateCornerAnim 0.7s ease-out forwards; }
        .animate-blinds { animation: blindsAnim 0.7s ease-out forwards; }
        .animate-swirl { animation: swirlAnim 0.7s ease-out forwards; }
      `}</style>
    </div>
  );
}

function WelcomeBrandingTab({ selectedBranch, branches, qc, toast }: any) {
  const [welcomeTitle, setWelcomeTitle] = useState("");
  const [welcomeSubtitle, setWelcomeSubtitle] = useState("");
  const [welcomeCtaText, setWelcomeCtaText] = useState("");
  const [welcomePostcodeEnabled, setWelcomePostcodeEnabled] = useState(false);
  const [welcomeBackgroundType, setWelcomeBackgroundType] = useState("gradient");
  const [welcomeBackgroundImageUrl, setWelcomeBackgroundImageUrl] = useState("");
  const [welcomeBackgroundVideoUrl, setWelcomeBackgroundVideoUrl] = useState("");
  const [welcomeSliderImages, setWelcomeSliderImages] = useState("");
  const [heroAnimationStyle, setHeroAnimationStyle] = useState("slide");
  const [heroSlideInterval, setHeroSlideInterval] = useState(5000);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [titleFontSize, setTitleFontSize] = useState("");
  const [subtitleFontSize, setSubtitleFontSize] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#22c55e");
  const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [logo, setLogo] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [categoryCardStyle, setCategoryCardStyle] = useState("rounded");
  const [menuCardStyle, setMenuCardStyle] = useState("grid");

  useEffect(() => {
    if (!selectedBranch) return;
    const branch = branches.find((b: Branch) => b.id === selectedBranch);
    if (branch) {
      setWelcomeTitle(branch.welcomeTitle || "");
      setWelcomeSubtitle(branch.welcomeSubtitle || "");
      setWelcomeCtaText(branch.welcomeCtaText || "");
      setWelcomePostcodeEnabled(branch.welcomePostcodeEnabled || false);
      setWelcomeBackgroundType(branch.welcomeBackgroundType || "gradient");
      setWelcomeBackgroundImageUrl(branch.welcomeBackgroundImageUrl || "");
      setWelcomeBackgroundVideoUrl(branch.welcomeBackgroundVideoUrl || "");
      setWelcomeSliderImages(branch.welcomeSliderImages ? branch.welcomeSliderImages.join("\n") : "");
      setHeroAnimationStyle(branch.heroAnimationStyle || "slide");
      setHeroSlideInterval(branch.heroSlideInterval || 5000);
      setFontFamily(branch.fontFamily || "Inter");
      setTitleFontSize(branch.titleFontSize || "");
      setSubtitleFontSize(branch.subtitleFontSize || "");
      setPrimaryColor(branch.primaryColor || "#22c55e");
      setSecondaryColor(branch.secondaryColor || "#3b82f6");
      setAccentColor(branch.accentColor || "#f59e0b");
      setLogo(branch.logo || "");
      setCategoryCardStyle(branch.categoryCardStyle || "rounded");
      setMenuCardStyle(branch.menuCardStyle || "grid");
    }
  }, [selectedBranch, branches]);

  if (!selectedBranch) return <EmptyState message="Select a branch from the top bar first" />;

  const handleLogoUpload = async (file: File) => {
    const allowed = /\.(png|jpg|jpeg|gif|svg|webp)$/i;
    if (!allowed.test(file.name)) {
      toast({ title: "Only PNG, JPG, GIF, SVG, WebP allowed", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await apiCall("/api/upload-image", "POST", { image: base64, filename: file.name });
        if (result.url) setLogo(result.url);
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setLogoUploading(false);
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const save = async () => {
    const sliderArr = welcomeSliderImages.split("\n").map((s: string) => s.trim()).filter(Boolean);
    const result = await apiCall(`/api/grocery/branches/${selectedBranch}`, "PATCH", {
      welcomeTitle: welcomeTitle || null,
      welcomeSubtitle: welcomeSubtitle || null,
      welcomeCtaText: welcomeCtaText || null,
      welcomePostcodeEnabled,
      welcomeBackgroundType,
      welcomeBackgroundImageUrl: welcomeBackgroundImageUrl || null,
      welcomeBackgroundVideoUrl: welcomeBackgroundVideoUrl || null,
      welcomeSliderImages: sliderArr,
      heroAnimationStyle,
      heroSlideInterval,
      fontFamily,
      titleFontSize: titleFontSize || null,
      subtitleFontSize: subtitleFontSize || null,
      primaryColor,
      secondaryColor,
      accentColor,
      logo: logo || null,
      categoryCardStyle,
      menuCardStyle,
    });
    if (result.error) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
    toast({ title: "Welcome & Branding saved!" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-purple-600" /> Welcome Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Welcome Title</Label>
            <Textarea value={welcomeTitle} onChange={e => setWelcomeTitle(e.target.value)} placeholder="Welcome to our store" data-testid="textarea-welcome-title" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Welcome Subtitle</Label>
              <Input value={welcomeSubtitle} onChange={e => setWelcomeSubtitle(e.target.value)} placeholder="Fresh groceries delivered" data-testid="input-welcome-subtitle" />
            </div>
            <div>
              <Label>Welcome CTA Text</Label>
              <Input value={welcomeCtaText} onChange={e => setWelcomeCtaText(e.target.value)} placeholder="Shop Now" data-testid="input-welcome-cta" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={welcomePostcodeEnabled} onChange={e => setWelcomePostcodeEnabled(e.target.checked)} id="postcode-enabled" data-testid="checkbox-postcode-enabled" />
            <Label htmlFor="postcode-enabled">Welcome Postcode Enabled</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Background & Animation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Welcome Background Type</Label>
              <Select value={welcomeBackgroundType} onValueChange={setWelcomeBackgroundType}>
                <SelectTrigger data-testid="select-bg-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hero Animation Style</Label>
              <Select value={heroAnimationStyle} onValueChange={setHeroAnimationStyle}>
                <SelectTrigger data-testid="select-hero-animation"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {welcomeBackgroundType === "image" && (
            <div>
              <Label>Welcome Background Image URL</Label>
              <Input value={welcomeBackgroundImageUrl} onChange={e => setWelcomeBackgroundImageUrl(e.target.value)} placeholder="https://example.com/bg.jpg" data-testid="input-bg-image-url" />
            </div>
          )}
          {welcomeBackgroundType === "video" && (
            <div>
              <Label>Welcome Background Video URL</Label>
              <Input value={welcomeBackgroundVideoUrl} onChange={e => setWelcomeBackgroundVideoUrl(e.target.value)} placeholder="https://example.com/bg.mp4" data-testid="input-bg-video-url" />
            </div>
          )}
          {welcomeBackgroundType === "slider" && (
            <div>
              <Label>Welcome Slider Images (one URL per line)</Label>
              <Textarea value={welcomeSliderImages} onChange={e => setWelcomeSliderImages(e.target.value)} placeholder={"https://example.com/slide1.jpg\nhttps://example.com/slide2.jpg"} rows={4} data-testid="textarea-slider-images" />
            </div>
          )}
          <div>
            <Label>Hero Slide Interval (ms)</Label>
            <Input type="number" value={heroSlideInterval} onChange={e => setHeroSlideInterval(Number(e.target.value))} placeholder="5000" data-testid="input-hero-interval" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Typography & Colors</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger data-testid="select-font-family"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title Font Size</Label>
              <Input value={titleFontSize} onChange={e => setTitleFontSize(e.target.value)} placeholder="e.g. 3rem" data-testid="input-title-font-size" />
            </div>
            <div>
              <Label>Subtitle Font Size</Label>
              <Input value={subtitleFontSize} onChange={e => setSubtitleFontSize(e.target.value)} placeholder="e.g. 1.5rem" data-testid="input-subtitle-font-size" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Primary Color</Label>
              <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} data-testid="input-primary-color" />
            </div>
            <div>
              <Label>Secondary Color</Label>
              <Input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} data-testid="input-secondary-color" />
            </div>
            <div>
              <Label>Accent Color</Label>
              <Input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} data-testid="input-accent-color" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-purple-600" /> Branch Logo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-shrink-0">
              {logo ? (
                <div className="relative group">
                  <img src={logo} alt="Branch logo" className="h-24 w-24 rounded-2xl object-cover border-2 border-gray-200 shadow-md" />
                  <button
                    onClick={() => setLogo("")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid="button-remove-logo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <ImagePlus className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all"
                onClick={() => logoFileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-green-400", "bg-green-50"); }}
                onDragLeave={e => { e.currentTarget.classList.remove("border-green-400", "bg-green-50"); }}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-green-400", "bg-green-50"); if (e.dataTransfer.files[0]) handleLogoUpload(e.dataTransfer.files[0]); }}
                data-testid="dropzone-logo"
              >
                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">{logoUploading ? "Uploading..." : "Click or drag & drop logo here"}</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, GIF, SVG, WebP</p>
              </div>
              <input
                ref={logoFileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.svg,.webp"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }}
              />
              <div>
                <Label className="text-xs text-gray-500">Or paste logo URL</Label>
                <Input value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://example.com/logo.png" className="text-sm" data-testid="input-logo-url" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Layout & Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Category Card Style</Label>
              <Select value={categoryCardStyle} onValueChange={setCategoryCardStyle}>
                <SelectTrigger data-testid="select-category-card-style"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Menu Card Style</Label>
              <Select value={menuCardStyle} onValueChange={setMenuCardStyle}>
                <SelectTrigger data-testid="select-menu-card-style"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-save-welcome-branding">
        <Save className="h-4 w-4" /> Save Welcome & Branding
      </Button>
    </div>
  );
}

function SettingsTab({ selectedBranch, branches, qc, toast }: any) {
  const [themeColor, setThemeColor] = useState("#22c55e");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("");
  const [discountThreshold, setDiscountThreshold] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [headerBgColor, setHeaderBgColor] = useState("#ffffff");
  const [footerText, setFooterText] = useState("");
  const [webAddressType, setWebAddressType] = useState("default");
  const [customSubdomain, setCustomSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [storeLanguage, setStoreLanguage] = useState("en");

  useEffect(() => {
    if (!selectedBranch) return;
    const branch = branches.find((b: Branch) => b.id === selectedBranch);
    if (branch) {
      setThemeColor(branch.themeColor || "#22c55e");
      setAddress(branch.address || "");
      setPhone(branch.phone || "");
      setEmail(branch.email || "");
      setDeliveryCharge(branch.deliveryCharge || "");
      setFreeDeliveryThreshold(branch.freeDeliveryThreshold || "");
      setDiscountThreshold(branch.discountThreshold || "");
      setDiscountPercent(branch.discountPercent || "");
      setHeaderBgColor(branch.headerBgColor || "#ffffff");
      setFooterText(branch.footerText || "");
      setWebAddressType(branch.webAddressType || "default");
      setCustomSubdomain(branch.customSubdomain || "");
      setCustomDomain(branch.customDomain || "");
      setWhatsappNumber(branch.whatsappNumber || "");
      setStoreLanguage(branch.storeLanguage || "en");
    }
  }, [selectedBranch, branches]);

  if (!selectedBranch) return <EmptyState message="Select a branch from the top bar first" />;

  const currentBranch = branches.find((b: Branch) => b.id === selectedBranch);
  const branchSlug = currentBranch?.slug || "";

  const save = async () => {
    await apiCall(`/api/grocery/branches/${selectedBranch}`, "PATCH", {
      themeColor,
      address: address || null,
      phone: phone || null,
      email: email || null,
      deliveryCharge,
      freeDeliveryThreshold,
      discountThreshold,
      discountPercent,
      headerBgColor,
      footerText: footerText || null,
      webAddressType,
      customSubdomain: customSubdomain || null,
      customDomain: customDomain || null,
      whatsappNumber: whatsappNumber || null,
      storeLanguage,
    });
    qc.invalidateQueries({ queryKey: ["/api/grocery/branches"] });
    toast({ title: "Settings saved!" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-gray-600" /> General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Theme Color</Label>
              <Input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} data-testid="input-theme-color" />
            </div>
            <div>
              <Label>Header Background Color</Label>
              <Input type="color" value={headerBgColor} onChange={e => setHeaderBgColor(e.target.value)} data-testid="input-header-bg-color" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Store address" data-testid="input-settings-address" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" data-testid="input-settings-phone" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" data-testid="input-settings-email" />
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="e.g. +923122892477" data-testid="input-settings-whatsapp" />
              <p className="text-xs text-muted-foreground mt-1">Customers can message you on WhatsApp after placing an order</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Store Language</Label>
              <Select value={storeLanguage} onValueChange={setStoreLanguage}>
                <SelectTrigger data-testid="select-store-language"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">اردو (Urdu)</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="tr">Türkçe (Turkish)</SelectItem>
                  <SelectItem value="fr">Français (French)</SelectItem>
                  <SelectItem value="es">Español (Spanish)</SelectItem>
                  <SelectItem value="de">Deutsch (German)</SelectItem>
                  <SelectItem value="zh">中文 (Chinese)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Public store UI labels will show in this language</p>
            </div>
            <div>
              <Label>Footer Text</Label>
              <Input value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="© 2025 Your Store" data-testid="input-footer-text" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Delivery & Discounts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Delivery Charge</Label>
              <Input value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} placeholder="e.g. 2.99" data-testid="input-delivery-charge" />
            </div>
            <div>
              <Label>Free Delivery Threshold</Label>
              <Input value={freeDeliveryThreshold} onChange={e => setFreeDeliveryThreshold(e.target.value)} placeholder="e.g. 30.00" data-testid="input-free-delivery-threshold" />
            </div>
            <div>
              <Label>Discount Threshold</Label>
              <Input value={discountThreshold} onChange={e => setDiscountThreshold(e.target.value)} placeholder="e.g. 50.00" data-testid="input-discount-threshold" />
            </div>
            <div>
              <Label>Discount Percent</Label>
              <Input value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="e.g. 10" data-testid="input-discount-percent" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Globe className="h-5 w-5" /> Branch Web Address
          </CardTitle>
          <p className="text-sm text-muted-foreground">Choose how customers will access this branch's menu online.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${webAddressType === "default" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
            onClick={() => setWebAddressType("default")}
            data-testid="option-web-address-default"
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${webAddressType === "default" ? "border-green-500" : "border-gray-300"}`}>
                {webAddressType === "default" && <div className="w-3 h-3 rounded-full bg-green-500" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Use Default App URL</h4>
                <p className="text-sm text-muted-foreground">Customer accesses via your main app URL with branch name</p>
                <p className="text-xs text-green-700 mt-1 font-mono bg-green-100 inline-block px-2 py-0.5 rounded">
                  {window.location.origin}/grocery/{branchSlug}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${webAddressType === "subdomain" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
            onClick={() => setWebAddressType("subdomain")}
            data-testid="option-web-address-subdomain"
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${webAddressType === "subdomain" ? "border-blue-500" : "border-gray-300"}`}>
                {webAddressType === "subdomain" && <div className="w-3 h-3 rounded-full bg-blue-500" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Use Your link24.online Subdomain</h4>
                <p className="text-sm text-muted-foreground">Give them a professional subdomain - no setup needed by customer!</p>
                {webAddressType === "subdomain" && (
                  <div className="mt-3 flex items-center gap-1">
                    <Input
                      value={customSubdomain}
                      onChange={e => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="branchname"
                      className="max-w-[200px]"
                      data-testid="input-custom-subdomain"
                    />
                    <span className="text-sm font-mono text-blue-600">.link24.online</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${webAddressType === "custom" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}
            onClick={() => setWebAddressType("custom")}
            data-testid="option-web-address-custom"
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${webAddressType === "custom" ? "border-orange-500" : "border-gray-300"}`}>
                {webAddressType === "custom" && <div className="w-3 h-3 rounded-full bg-orange-500" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Customer's Own Domain</h4>
                <p className="text-sm text-muted-foreground">Customer uses their own domain (they must configure their DNS)</p>
                {webAddressType === "custom" && (
                  <div className="mt-3">
                    <Input
                      value={customDomain}
                      onChange={e => setCustomDomain(e.target.value)}
                      placeholder="www.customerstore.com"
                      data-testid="input-custom-domain"
                    />
                    <p className="text-xs text-orange-600 mt-1">Customer must point their DNS CNAME record to your server.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-save-settings">
        <Save className="h-4 w-4" /> Save Settings
      </Button>
    </div>
  );
}



function ProductInfoTab({ branches, selectedBranch, setSelectedBranch, qc, toast }: { branches: Branch[]; selectedBranch: string; setSelectedBranch: (v: string) => void; qc: any; toast: any }) {
  const [infoBranch, setInfoBranch] = useState(selectedBranch || "");
  const [infoMainCat, setInfoMainCat] = useState("");
  const [infoSubCat, setInfoSubCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [customSections, setCustomSections] = useState<{ key: string; label: string }[]>([]);
  const [newSectionName, setNewSectionName] = useState("");

  const [formData, setFormData] = useState<Record<string, string>>({
    allergyAdvice: "", productMarketing: "", description: "", features: "", lifestyle: "",
    ingredients: "", calculatedNutrition: "", nutritionalClaims: "", storageUsage: "",
    storageConditions: "", storageType: "", country: "", companyName: "", companyAddress: "",
    manufacturer: "", moreInformation: "", nutrition: "", disclaimer: "",
  });

  const { data: infoMainCats = [] } = useQuery<MainCategory[]>({
    queryKey: ["/api/grocery/main-categories", infoBranch],
    queryFn: () => apiCall(`/api/grocery/main-categories/${infoBranch}`),
    enabled: !!infoBranch,
  });
  const { data: infoSubCats = [] } = useQuery<SubCategory[]>({
    queryKey: ["/api/grocery/sub-categories", infoMainCat],
    queryFn: () => apiCall(`/api/grocery/sub-categories/${infoMainCat}`),
    enabled: !!infoMainCat,
  });
  const { data: infoProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/grocery/products-info", infoBranch, infoMainCat, infoSubCat],
    queryFn: () => {
      let url = `/api/grocery/products/${infoBranch}?`;
      if (infoMainCat) url += `mainCategoryId=${infoMainCat}&`;
      if (infoSubCat) url += `subCategoryId=${infoSubCat}`;
      return apiCall(url);
    },
    enabled: !!infoBranch && !!infoSubCat,
  });

  const infoFields = [
    { key: "allergyAdvice", label: "Allergy Advice", icon: AlertTriangle, color: "#ef4444" },
    { key: "productMarketing", label: "Product Marketing", icon: Megaphone, color: "#8b5cf6" },
    { key: "description", label: "Description", icon: FileText, color: "#3b82f6" },
    { key: "features", label: "Features", icon: ListChecks, color: "#10b981" },
    { key: "lifestyle", label: "Life Style", icon: Leaf, color: "#22c55e" },
    { key: "ingredients", label: "Ingredients", icon: Apple, color: "#f97316" },
    { key: "calculatedNutrition", label: "Calculated Nutrition", icon: Calculator, color: "#6366f1" },
    { key: "nutritionalClaims", label: "Nutritional Claims", icon: Award, color: "#eab308" },
    { key: "storageUsage", label: "Storage And Usage Statements", icon: Thermometer, color: "#14b8a6" },
    { key: "storageConditions", label: "Storage Conditions", icon: Thermometer, color: "#0d9488" },
    { key: "storageType", label: "Storage Type", icon: Package, color: "#64748b" },
    { key: "country", label: "Country", icon: MapPinIcon, color: "#06b6d4" },
    { key: "companyName", label: "Company Name", icon: Building2, color: "#7c3aed" },
    { key: "companyAddress", label: "Company Address", icon: MapPinIcon, color: "#d946ef" },
    { key: "manufacturer", label: "Manufacturer", icon: Factory, color: "#78716c" },
    { key: "moreInformation", label: "More Information", icon: Info, color: "#0ea5e9" },
    { key: "nutrition", label: "Nutrition", icon: Apple, color: "#16a34a" },
    { key: "disclaimer", label: "Disclaimer", icon: AlertTriangle, color: "#f43f5e" },
  ];

  const allFields = [
    ...infoFields,
    ...customSections.map(c => ({ key: c.key, label: c.label, icon: FileText, color: "#9333ea" })),
  ];
  const visibleFields = allFields.filter(f => !hiddenSections.has(f.key));
  const filledCount = visibleFields.filter(f => formData[f.key]?.trim()).length;

  const targetProducts = selectMode && selectedProductIds.size > 0
    ? infoProducts.filter((p: Product) => selectedProductIds.has(p.id))
    : infoProducts;
  const targetCount = targetProducts.length;

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addCustomSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    const key = "custom_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (customSections.some(c => c.key === key) || infoFields.some(f => f.key === key)) {
      toast({ title: "Already exists", description: `A section named "${name}" already exists.`, variant: "destructive" });
      return;
    }
    setCustomSections(prev => [...prev, { key, label: name }]);
    setFormData(prev => ({ ...prev, [key]: "" }));
    setNewSectionName("");
  };

  const removeCustomSection = (key: string) => {
    setCustomSections(prev => prev.filter(c => c.key !== key));
    setFormData(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const saveToProducts = async () => {
    if (targetProducts.length === 0) return;
    const dataToSave: Record<string, string | null> = {};
    for (const f of visibleFields) {
      if (f.key.startsWith("custom_")) continue;
      dataToSave[f.key] = formData[f.key]?.trim() || null;
    }
    const customData = customSections
      .filter(c => formData[c.key]?.trim())
      .map(c => `${c.label}:\n${formData[c.key].trim()}`)
      .join("\n\n");
    if (customData) {
      dataToSave.moreInformation = [dataToSave.moreInformation, customData].filter(Boolean).join("\n\n");
    }
    const hasContent = Object.values(dataToSave).some(v => v !== null);
    if (!hasContent) {
      toast({ title: "Nothing to save", description: "Please paste information into at least one field.", variant: "destructive" });
      return;
    }
    setSaving(true);
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < targetProducts.length; i++) {
      try {
        const res = await fetch(`/api/grocery/products/${targetProducts[i].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });
        if (res.ok) successCount++; else failCount++;
      } catch { failCount++; }
    }
    qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
    qc.invalidateQueries({ queryKey: ["/api/grocery/products-info"] });
    toast({
      title: "Done!",
      description: `Information saved to ${successCount} product${successCount !== 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}.`,
    });
    setSelectedProductIds(new Set());
    setSelectMode(false);
    setSaving(false);
  };

  const showProducts = infoSubCat && infoProducts.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold" data-testid="text-product-info-title">Information Product</h2>
          <p className="text-sm text-muted-foreground">Paste product information into all fields, then save to all products at once</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Branch</Label>
              <Select value={infoBranch} onValueChange={(v) => { setInfoBranch(v); setInfoMainCat(""); setInfoSubCat(""); }}>
                <SelectTrigger data-testid="select-info-branch"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Main Category</Label>
              <Select value={infoMainCat} onValueChange={(v) => { setInfoMainCat(v); setInfoSubCat(""); }} disabled={!infoBranch}>
                <SelectTrigger data-testid="select-info-main-cat"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>{infoMainCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Sub Category</Label>
              <Select value={infoSubCat} onValueChange={(v) => { setInfoSubCat(v); }} disabled={!infoMainCat}>
                <SelectTrigger data-testid="select-info-sub-cat"><SelectValue placeholder="Select Sub Category" /></SelectTrigger>
                <SelectContent>{infoSubCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {showProducts && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-pink-500" />
                  <h3 className="font-bold text-base">Products in Category ({infoProducts.length} items)</h3>
                </div>
                <Button
                  size="sm"
                  variant={selectMode ? "default" : "outline"}
                  className={selectMode ? "gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" : "gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50"}
                  onClick={() => { setSelectMode(!selectMode); setSelectedProductIds(new Set()); }}
                  data-testid="button-toggle-select-mode"
                >
                  <Check className="h-3.5 w-3.5" />
                  {selectMode ? `${selectedProductIds.size} Selected` : "Select Specific"}
                </Button>
              </div>
              {selectMode && (
                <p className="text-xs text-blue-600 mb-2">Click products to select them. Only selected products will be updated.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {infoProducts.map((p: Product, idx: number) => {
                  const isSelected = selectedProductIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${selectMode ? "cursor-pointer hover:shadow-md" : ""} ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-400" : "bg-white dark:bg-gray-900"}`}
                      onClick={() => selectMode && toggleProduct(p.id)}
                      data-testid={`info-product-${p.id}`}
                    >
                      {selectMode && (
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${isSelected ? "from-blue-500 to-blue-600" : "from-pink-500 to-rose-500"} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {idx + 1}
                      </div>
                      {p.image1 && (
                        <img src={p.image1} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-pink-300 dark:border-pink-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardPaste className="h-5 w-5 text-pink-500" />
                  <h3 className="font-bold text-base">Paste Information</h3>
                </div>
                <Badge className="bg-pink-100 text-pink-700 border-pink-200">{filledCount}/{infoFields.length} fields filled</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectMode && selectedProductIds.size > 0
                  ? `Fill in the fields below, then click Save to apply to ${selectedProductIds.size} selected product${selectedProductIds.size !== 1 ? 's' : ''}.`
                  : `Fill in the fields below, then click Save to apply to all ${infoProducts.length} products.`}
              </p>

              <Button
                onClick={saveToProducts}
                disabled={saving || filledCount === 0 || (selectMode && selectedProductIds.size === 0)}
                className="w-full gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-5 text-base rounded-xl shadow-lg"
                data-testid="button-save-all-info-top"
              >
                {saving ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Saving to {targetCount} products...</>
                ) : (
                  <><Save className="h-5 w-5" /> Save to {selectMode && selectedProductIds.size > 0 ? `${selectedProductIds.size} Selected` : `All ${infoProducts.length}`} Products</>
                )}
              </Button>

              {filledCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-blue-300 text-blue-600 hover:bg-blue-50 py-4 text-base rounded-xl"
                  onClick={() => {
                    const allText = visibleFields
                      .filter(f => formData[f.key]?.trim())
                      .map(f => `${f.label}:\n${formData[f.key].trim()}`)
                      .join("\n\n");
                    navigator.clipboard.writeText(allText);
                    toast({ title: "Copied!", description: `All ${filledCount} filled fields copied to clipboard.` });
                  }}
                  data-testid="button-copy-all-info"
                >
                  <Copy className="h-5 w-5" /> Copy All {filledCount} Fields
                </Button>
              )}

              {visibleFields.map(field => (
                <div key={field.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: field.color + "20" }}>
                        <field.icon className="h-3.5 w-3.5" style={{ color: field.color }} />
                      </div>
                      <Label className="text-sm font-semibold" style={{ color: field.color }}>{field.label}</Label>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (field.key.startsWith("custom_")) {
                          removeCustomSection(field.key);
                        } else {
                          setFormData(prev => ({ ...prev, [field.key]: "" }));
                          setHiddenSections(prev => new Set(prev).add(field.key));
                        }
                      }}
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      data-testid={`button-delete-section-${field.key}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={formData[field.key]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={`Paste ${field.label} here...`}
                    rows={2}
                    className="resize-y text-sm"
                    data-testid={`textarea-info-${field.key}`}
                  />
                </div>
              ))}

              <div className="rounded-xl border border-dashed border-purple-300 dark:border-purple-700 p-4">
                <p className="text-xs text-muted-foreground mb-3 font-medium">Add Custom Section:</p>
                <div className="flex gap-2">
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Enter section name..."
                    className="text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") addCustomSection(); }}
                    data-testid="input-custom-section-name"
                  />
                  <Button
                    size="sm"
                    onClick={addCustomSection}
                    disabled={!newSectionName.trim()}
                    className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4"
                    data-testid="button-add-custom-section"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>

              {hiddenSections.size > 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">Add sections back:</p>
                  <div className="flex flex-wrap gap-2">
                    {allFields.filter(f => hiddenSections.has(f.key)).map(field => (
                      <Button
                        key={field.key}
                        size="sm"
                        variant="outline"
                        onClick={() => setHiddenSections(prev => { const n = new Set(prev); n.delete(field.key); return n; })}
                        className="h-8 text-xs gap-1.5 rounded-lg"
                        style={{ borderColor: field.color + "40", color: field.color }}
                        data-testid={`button-add-section-${field.key}`}
                      >
                        <Plus className="h-3 w-3" />
                        <field.icon className="h-3 w-3" />
                        {field.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={saveToProducts}
                disabled={saving || filledCount === 0 || (selectMode && selectedProductIds.size === 0)}
                className="w-full gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-6 text-lg rounded-xl shadow-lg"
                data-testid="button-save-all-info"
              >
                {saving ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Saving to {targetCount} products...</>
                ) : (
                  <><Save className="h-5 w-5" /> Save to {selectMode && selectedProductIds.size > 0 ? `${selectedProductIds.size} Selected` : `All ${infoProducts.length}`} Products</>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {infoSubCat && infoProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No Products Found</h3>
          <p className="text-muted-foreground">This sub category has no products yet.</p>
        </div>
      )}

      {!showProducts && !infoSubCat && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Select a Sub Category</h3>
          <p className="text-muted-foreground max-w-md">Choose a branch, main category, and sub category to see all products and paste information.</p>
        </div>
      )}
    </div>
  );
}

function StaffManagementTab({ selectedBranch, branches, qc, toast }: { selectedBranch: string; branches: Branch[]; qc: any; toast: any }) {
  type Staff = { id: string; branchId: string; name: string; username: string; role: string; isActive: boolean; expiresAt: string | null; createdAt: string };
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("info-product");
  const [expiryDays, setExpiryDays] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  const roleOptions = [
    { value: "info-product", label: "Info Product Only" },
    { value: "categories", label: "Categories" },
    { value: "orders", label: "Orders" },
    { value: "settings", label: "Store Settings" },
    { value: "all", label: "All Tabs" },
  ];

  const { data: staffList = [], refetch } = useQuery<Staff[]>({
    queryKey: ["/api/grocery/staff", selectedBranch],
    queryFn: () => apiCall(`/api/grocery/staff/${selectedBranch}`),
    enabled: !!selectedBranch,
  });

  if (!selectedBranch) return <EmptyState message="Select a branch to manage staff" />;

  const branchName = branches.find(b => b.id === selectedBranch)?.name || "";

  const resetForm = () => { setName(""); setUsername(""); setPassword(""); setRole("info-product"); setExpiryDays("none"); setEditingStaff(null); setShowForm(false); };

  const handleSave = async () => {
    if (!name || !username || (!editingStaff && !password)) {
      toast({ title: "Name, username and password are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingStaff) {
        const body: any = { name, username, role, expiryDays: expiryDays === "none" ? "none" : Number(expiryDays) };
        if (password) body.password = password;
        await apiCall(`/api/grocery/staff/${editingStaff.id}`, "PATCH", body);
        toast({ title: "Staff updated" });
      } else {
        await apiCall("/api/grocery/staff", "POST", { branchId: selectedBranch, name, username, password, role, expiryDays: expiryDays === "none" ? undefined : Number(expiryDays) });
        toast({ title: "Staff created" });
      }
      resetForm();
      refetch();
    } catch (err: any) {
      toast({ title: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (staff: Staff) => {
    await apiCall(`/api/grocery/staff/${staff.id}`, "PATCH", { isActive: !staff.isActive });
    toast({ title: staff.isActive ? "Staff disabled" : "Staff enabled" });
    refetch();
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    await apiCall(`/api/grocery/staff/${id}`, "DELETE");
    toast({ title: "Staff deleted" });
    refetch();
  };

  const startEdit = (s: Staff) => {
    setEditingStaff(s);
    setName(s.name);
    setUsername(s.username);
    setPassword("");
    setRole(s.role);
    setExpiryDays("none");
    setShowForm(true);
  };

  const getRoleLabel = (r: string) => roleOptions.find(o => o.value === r)?.label || r;

  const getExpiryInfo = (s: Staff) => {
    if (!s.expiresAt) return null;
    const exp = new Date(s.expiresAt);
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { text: "Expired", color: "text-red-500" };
    if (diffDays <= 1) return { text: "Expires today", color: "text-orange-500" };
    return { text: `${diffDays} days left`, color: "text-amber-500" };
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" data-testid="text-staff-title">Staff Management</h2>
          <p className="text-sm text-muted-foreground">Manage staff for {branchName}. Staff can only access the Info Product tab and can only add data (no delete).</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-add-staff">
          <UserPlus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingStaff ? "Edit Staff" : "Add New Staff"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Staff name" data-testid="input-staff-name" />
              </div>
              <div>
                <Label>Username</Label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Login username" data-testid="input-staff-username" />
              </div>
              <div>
                <Label>Password {editingStaff && "(leave blank to keep)"}</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editingStaff ? "New password" : "Password"} data-testid="input-staff-password" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Role (Which area can they access?)</Label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="select-staff-role">
                  {roleOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Access Duration (auto-delete after)</Label>
                <select value={expiryDays} onChange={e => setExpiryDays(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="select-staff-expiry">
                  <option value="none">No Expiry (Permanent)</option>
                  <option value="3">3 Days</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {role === "all" ? "Full access to all tabs. Delete is disabled for staff." :
                 role === "info-product" ? "Can only view Info Product tab and add data. Delete is disabled." :
                 `Can access ${getRoleLabel(role)} tab. Delete is disabled.`}
                {expiryDays !== "none" && ` Account will be auto-deleted after ${expiryDays} days.`}
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-save-staff">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : editingStaff ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-staff">
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {staffList.length === 0 ? (
        <EmptyState message="No staff members yet. Click 'Add Staff' to create one." />
      ) : (
        <div className="grid gap-4">
          {staffList.map(s => (
            <Card key={s.id} className={`${!s.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${s.isActive ? "bg-emerald-600" : "bg-gray-400"}`}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {s.name}
                      <Badge variant={s.isActive ? "default" : "secondary"} className="text-xs">{s.isActive ? "Active" : "Disabled"}</Badge>
                      {(() => { const exp = getExpiryInfo(s); return exp ? <Badge variant="outline" className={`text-xs ${exp.color}`}>{exp.text}</Badge> : null; })()}
                    </div>
                    <div className="text-sm text-muted-foreground">@{s.username} · Role: {getRoleLabel(s.role)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(s)} data-testid={`button-toggle-staff-${s.id}`} title={s.isActive ? "Disable" : "Enable"}>
                    {s.isActive ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(s)} data-testid={`button-edit-staff-${s.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteStaff(s.id)} className="text-red-500 hover:text-red-600" data-testid={`button-delete-staff-${s.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}