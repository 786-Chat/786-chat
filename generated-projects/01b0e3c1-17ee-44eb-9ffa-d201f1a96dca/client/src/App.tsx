import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRestaurantPwaBranding } from "@/hooks/use-pwa-branding";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import RestaurantDashboard from "@/pages/dashboard";
import KitchenDisplay from "@/pages/kitchen";
import KitchenSettings from "@/pages/kitchen-settings";
import EposPage from "@/pages/epos";
import WaiterPage from "@/pages/waiter";
import AdminDashboard from "@/pages/admin";
import PublicMenu from "@/pages/menu";
import TawaMenu from "@/pages/tawa-menu";
import TawaGrillWelcome from "@/pages/tawa-grill-welcome";
import KebabishWelcome from "@/pages/kebabish-welcome";
import HelloMumbaiWelcome from "@/pages/hello-mumbai-welcome";
import MujeebSweetsWelcome from "@/pages/mujeeb-sweets-welcome";
import MujeebAIAgent from "@/pages/mujeeb-ai-agent";
import MeatWholesaleWelcome from "@/pages/meat-wholesale-welcome";
import MeatWholesaleMenu from "@/pages/meat-wholesale-menu";
import MujeebCateringWelcome from "@/pages/mujeeb-catering-welcome";
import MujeebCateringMenu from "@/pages/mujeeb-catering-menu";
import ShirinMahalWelcome from "@/pages/shirin-mahal-welcome";
import DasiFoodHubWelcome from "@/pages/dasi-food-hub-welcome";
import PayInfoPage from "@/pages/pay-info";
import KebabbishMenu from "@/pages/kebabish-menu";
import HelloMumbaiMenu from "@/pages/hello-mumbai-menu";
import RestaurantLanding from "@/pages/restaurant-landing";
import LoginPage from "@/pages/login";
import ShopLogin from "@/pages/shop-login";
import DriverLogin from "@/pages/driver-login";
import DriverDashboard from "@/pages/driver-dashboard";
import EposLogin from "@/pages/epos-login";
import KitchenLogin from "@/pages/kitchen-login";
import WaiterLogin from "@/pages/waiter-login";
import TelephonePage from "@/pages/telephone";
import Link24Phone from "@/pages/link24-phone";
import SuppliersLogin from "@/pages/suppliers-login";
import FinancesLogin from "@/pages/finances-login";
import SuppliersPage from "@/pages/suppliers";
import FinancesPage from "@/pages/finances";
import AllergenMatrixPage from "@/pages/allergen-matrix";
import BranchSettingsPage from "@/pages/branch-settings";
import DriversPage from "@/pages/drivers";
import TrackOrderPage from "@/pages/track-order";
import TermsPolicy from "@/pages/terms";
import PropertyLanding from "@/pages/property-landing";
import PropertyAdminLogin from "@/pages/property-admin-login";
import PropertySuperAdmin from "@/pages/property-super-admin";
import PropertyBranchDashboard from "@/pages/property-branch-dashboard";
import PropertyWebsite from "@/pages/property-website";
import GroceryAdmin from "@/pages/admin-grocery";
import GroceryStore from "@/pages/grocery-store";
import GroceryDriverLogin from "@/pages/grocery-driver-login";
import GroceryDriverDashboard from "@/pages/grocery-driver-dashboard";
import GroceryTrackOrder from "@/pages/grocery-track-order";
import GroceryBranchLogin from "@/pages/grocery-branch-login";
import GroceryStaffLogin from "@/pages/grocery-staff-login";
import GroceryBranchDashboard from "@/pages/grocery-branch-dashboard";
import AIStudio from "@/pages/ai-studio";
import ShopDisplayMenus from "@/pages/shop-display-menus";
import TvAdmin from "@/pages/tv-admin";
import TvDisplay from "@/pages/tv-display";
import TvLiveDisplay from "@/pages/tv-live-display";
import TvCustomerLogin from "@/pages/tv-customer-login";
import TvCustomerDisplay from "@/pages/tv-customer-display";
import MarketingStaffLogin from "@/pages/marketing-staff-login";
import MarketingDashboard from "@/pages/marketing-dashboard";
import TaxiDriverLogin from "@/pages/taxi-login";
import TaxiDriverDashboard from "@/pages/taxi-dashboard";
import TaxiCustomerPage from "@/pages/taxi-customer";
import TaxiCustomerLogin from "@/pages/taxi-customer-login";
import TaxiAdminLogin from "@/pages/taxi-admin-login";
import TaxiAdminDashboard from "@/pages/taxi-admin";
import TaxiBrandLogin from "@/pages/taxi-brand-login";
import TaxiBrandAdminDashboard from "@/pages/taxi-brand-admin";
import ClothingAdmin from "@/pages/clothing-admin";
import ClothingBrandLogin from "@/pages/clothing-brand-login";
import ClothingBrandDashboard from "@/pages/clothing-brand-dashboard";
import ClothingStore from "@/pages/clothing-store";
import FurnitureAdmin from "@/pages/furniture-admin";
import FurnitureBrandLogin from "@/pages/furniture-brand-login";
import FurnitureBrandDashboard from "@/pages/furniture-brand-dashboard";
import FurnitureStore from "@/pages/furniture-store";
import QuranAdmin from "@/pages/quran-admin";
import QuranAcademyLogin from "@/pages/quran-academy-login";
import QuranAcademyDashboard from "@/pages/quran-academy-dashboard";
import QuranReader from "@/pages/quran-reader";
import QuranStudentLogin from "@/pages/quran-student-login";
import QuranStudentDashboard from "@/pages/quran-student-dashboard";
import DeviceAdmin from "@/pages/device-admin";
import DeviceBrandLogin from "@/pages/device-brand-login";
import DeviceBrandDashboard from "@/pages/device-brand-dashboard";
import DeviceCustomerLogin from "@/pages/device-customer-login";
import DeviceCustomerPortal from "@/pages/device-customer-portal";
import InventoryAdmin from "@/pages/inventory-admin";
import InventoryBrandLogin from "@/pages/inventory-brand-login";
import InventoryBrandDashboard from "@/pages/inventory-brand-dashboard";
import InventoryCustomerLogin from "@/pages/inventory-customer-login";
import InventoryCustomerPortal from "@/pages/inventory-customer-portal";
import StripeApplication from "@/pages/stripe-application";
import StripeApplicationPK from "@/pages/stripe-application-pk";
import AdminPayments from "@/pages/admin-payments";
import Link24PhoneLogin from "@/pages/link24-phone-login";
import Link24PhoneAdminPage from "@/pages/link24-phone-admin";
import Link24PhonePlansPage from "@/pages/link24-phone-plans";
import Link24PhoneWebphone from "@/pages/link24-phone-webphone";
import PhoneLandingPage from "@/pages/phone-landing";
import { useParams } from "wouter";
import { getRestaurantBySlug } from "@/lib/api";
import { useEffect, useState, createContext, useContext } from "react";
import { LanguageSelector } from "@/components/language-selector";

export const SubdomainSlugContext = createContext<string | null>(null);
export const useSubdomainSlug = () => useContext(SubdomainSlugContext);

// Protected Admin Route - requires login to access
function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const isLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
  
  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/admin");
    }
  }, [isLoggedIn, setLocation]);
  
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return <Component />;
}

function useSubdomainRedirect() {
  const [location, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase().replace(/\.$/, '');
    const path = window.location.pathname;
    
    const internalPaths = [
      '/admin', '/login', '/portal', '/portal-admin', '/super-admin',
      '/dashboard', '/kitchen', '/epos', '/waiter', '/drivers', '/telephone',
      '/track', '/terms', '/shop-login', '/driver-login', '/epos-login',
      '/kitchen-login', '/waiter-login', '/suppliers-login', '/finances-login',
      '/driver', '/driver-dashboard', '/branch-settings', '/suppliers', '/finances',
      '/admin-grocery', '/grocery', '/grocery-driver', '/grocery-driver-dashboard', '/grocery-track',
      '/grocery-branch-login', '/grocery-staff-login', '/grocery-branch-dashboard', '/ai-studio',
      '/marketing-login', '/marketing-dashboard',
      '/taxi-login', '/taxi-dashboard', '/taxi-admin-login', '/taxi-admin',
      '/taxi-brand-login', '/taxi-brand-admin', '/taxi',
      '/clothing-admin', '/clothing-brand-login', '/clothing-brand-dashboard', '/clothing',
      '/admin-furniture', '/furniture-brand-login', '/furniture-brand-dashboard', '/furniture',
      '/admin-quran', '/quran-academy-login', '/quran-academy-dashboard', '/quran-reader',
      '/quran-student-login', '/quran-student-dashboard',
      '/admin-devices', '/device-brand-login', '/device-brand-dashboard',
      '/device-customer-login', '/device-customer-portal',
      '/admin-inventory', '/inventory-brand-login', '/inventory-brand-dashboard',
      '/inventory-customer-login', '/inventory-customer-portal',
      '/admin-payments'
    ];
    
    const isInternalPath = internalPaths.some(p => path.startsWith(p));
    
    if (isInternalPath) {
      setIsChecking(false);
      setShouldRender(true);
      return;
    }
    
    const isSubdomain = hostname.endsWith('.link24.online') && 
      hostname !== 'link24.online' && 
      hostname !== 'www.link24.online';
    
    const isCustomDomain = !hostname.includes('replit') && 
      !hostname.includes('localhost') && 
      !hostname.includes('127.0.0.1') &&
      hostname !== 'link24.online' &&
      hostname !== 'www.link24.online' &&
      !isSubdomain;
    
    if (isSubdomain || isCustomDomain) {
      const pathHasSlug = /^\/[a-z0-9-]+\/(welcome|menu)/.test(path) ||
        /^\/menu\/[a-z0-9-]+/.test(path) ||
        /^\/r\/[a-z0-9-]+/.test(path);
      
      if (pathHasSlug || path.startsWith('/pay-info')) {
        setIsChecking(false);
        setShouldRender(true);
        return;
      }
      
      fetch(`/api/restaurants/by-domain/${encodeURIComponent(hostname)}`)
        .then(res => res.json())
        .then(data => {
          if (data.slug) {
            if (path === '/' || path === '') {
              setLocation(`/${data.slug}/welcome`);
            } else if (path === '/menu') {
              setLocation(`/${data.slug}/menu`);
            } else if (path.startsWith(`/${data.slug}`)) {
              const subPath = path.slice(data.slug.length + 1);
              if (!subPath || subPath === '/') {
                setLocation(`/${data.slug}/welcome`);
              } else {
                setIsChecking(false);
                setShouldRender(true);
                return;
              }
            } else {
              setLocation(`/${data.slug}${path}`);
            }
          }
          setIsChecking(false);
          setShouldRender(true);
        })
        .catch(() => {
          setIsChecking(false);
          setShouldRender(true);
        });
    } else {
      setIsChecking(false);
      setShouldRender(true);
    }
  }, [location, setLocation]);

  return { isChecking, shouldRender };
}

function MenuRouter() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: restaurant, isLoading, isError } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  useRestaurantPwaBranding(slug, restaurant?.name, restaurant?.logoUrl || undefined, restaurant?.primaryColor || undefined, "menu");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Restaurant not found - show 404 page
  if (!restaurant || isError) {
    return <NotFound />;
  }

  // Debug log for theme routing
  console.log("MenuRouter - slug:", slug, "themeKey:", restaurant?.themeKey);

  if (restaurant?.themeKey === "tawa") {
    return <TawaMenu />;
  }

  if (restaurant?.themeKey === "kebabish") {
    return <KebabbishMenu />;
  }

  if (restaurant?.themeKey === "hello-mumbai") {
    return <HelloMumbaiMenu />;
  }

  if (restaurant?.themeKey === "meat-wholesale" || slug === "meat-wholesale") {
    return <MeatWholesaleMenu />;
  }

  if (restaurant?.themeKey === "mujeeb-catering" || slug === "mujeeb-catering") {
    return <MujeebCateringMenu />;
  }

  return <PublicMenu />;
}

function getThemedWelcomeComponent(restaurant: any, slug: string): React.ReactNode | null {
  if (restaurant?.themeKey === "kebabish") return <KebabishWelcome />;
  if (restaurant?.themeKey === "hello-mumbai") return <HelloMumbaiWelcome />;
  if (restaurant?.themeKey === "mujeeb-sweets" || slug === "mujeeb-sweets--bakers") return <MujeebSweetsWelcome />;
  if (restaurant?.themeKey === "meat-wholesale" || slug === "meat-wholesale") return <MeatWholesaleWelcome />;
  if (restaurant?.themeKey === "mujeeb-catering" || slug === "mujeeb-catering") return <MujeebCateringWelcome />;
  if (restaurant?.themeKey === "shirin-mahal" || slug === "shirin-mahal") return <ShirinMahalWelcome />;
  if (restaurant?.themeKey === "dasi-food-hub" || slug === "dasi-food-hub") return <DasiFoodHubWelcome />;
  if (restaurant?.themeKey === "tawa" || restaurant?.themeKey === "tawa-watford" || slug === "tawa-grill") return <TawaGrillWelcome />;
  return null;
}

function WelcomeRouter() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: restaurant, isLoading, isError } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  useRestaurantPwaBranding(slug, restaurant?.name, restaurant?.logoUrl || undefined, restaurant?.primaryColor || undefined, "welcome");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant || isError) {
    return <NotFound />;
  }

  const themed = getThemedWelcomeComponent(restaurant, slug || "");
  if (themed) return <>{themed}</>;

  return <RestaurantLanding />;
}

function SubdomainWelcome({ slug }: { slug: string }) {
  const { data: restaurant, isLoading, isError } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug),
    enabled: !!slug,
  });

  useRestaurantPwaBranding(slug, restaurant?.name, restaurant?.logoUrl || undefined, restaurant?.primaryColor || undefined, "welcome");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant || isError) {
    return <NotFound />;
  }

  const themed = getThemedWelcomeComponent(restaurant, slug);
  if (themed) return <>{themed}</>;

  return <RestaurantLanding />;
}

function SubdomainMenu({ slug }: { slug: string }) {
  const { data: restaurant, isLoading, isError } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug),
    enabled: !!slug,
  });

  useRestaurantPwaBranding(slug, restaurant?.name, restaurant?.logoUrl || undefined, restaurant?.primaryColor || undefined, "menu");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant || isError) {
    return <NotFound />;
  }

  if (restaurant?.themeKey === "tawa") {
    return <TawaMenu />;
  }

  if (restaurant?.themeKey === "kebabish") {
    return <KebabbishMenu />;
  }

  if (restaurant?.themeKey === "hello-mumbai") {
    return <HelloMumbaiMenu />;
  }

  if (restaurant?.themeKey === "meat-wholesale") {
    return <MeatWholesaleMenu />;
  }

  if (restaurant?.themeKey === "mujeeb-catering") {
    return <MujeebCateringMenu />;
  }

  return <PublicMenu />;
}

function Router() {
  const { isChecking, shouldRender } = useSubdomainRedirect();

  if (isChecking && !shouldRender) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={PhoneLandingPage} />
      <Route path="/branch-login" component={ShopLogin} />
      <Route path="/pay-info" component={PayInfoPage} />
      <Route path="/portal" component={LandingPage} />
      <Route path="/phone" component={Link24PhoneLogin} />
      <Route path="/link24-phone-login" component={Link24PhoneLogin} />
      <Route path="/admin/phone" component={Link24PhoneAdminPage} />
      <Route path="/link24-phone-admin" component={Link24PhoneAdminPage} />
      <Route path="/phone/app" component={Link24PhoneWebphone} />
      <Route path="/link24-phone-webphone" component={Link24PhoneWebphone} />
      <Route path="/webphone" component={Link24PhoneWebphone} />
      <Route path="/link24-phone/plans" component={Link24PhonePlansPage} />
      <Route path="/phone-landing" component={PhoneLandingPage} />
      <Route path="/link24-phone/landing" component={PhoneLandingPage} />
      <Route path="/admin" component={LoginPage} />
      <Route path="/admin-login" component={PropertySuperAdmin} />
      <Route path="/login" component={LoginPage} />
      <Route path="/shop-login" component={ShopLogin} />
      <Route path="/driver-login" component={DriverLogin} />
      <Route path="/driver" component={DriverLogin} />
      <Route path="/driver-dashboard" component={DriverDashboard} />
      <Route path="/epos-login/:slug" component={EposLogin} />
      <Route path="/epos-login" component={EposLogin} />
      <Route path="/epos" component={EposLogin} />
      <Route path="/kitchen-login/:slug" component={KitchenLogin} />
      <Route path="/kitchen-login" component={KitchenLogin} />
      <Route path="/kitchen" component={KitchenLogin} />
      <Route path="/waiter-login/:slug" component={WaiterLogin} />
      <Route path="/waiter-login" component={WaiterLogin} />
      <Route path="/waiter" component={WaiterLogin} />
      <Route path="/suppliers-login/:slug" component={SuppliersLogin} />
      <Route path="/suppliers-login" component={SuppliersLogin} />
      <Route path="/suppliers" component={SuppliersLogin} />
      <Route path="/finances-login/:slug" component={FinancesLogin} />
      <Route path="/finances-login" component={FinancesLogin} />
      <Route path="/dashboard">
        <Redirect to="/shop-login" />
      </Route>
      <Route path="/dashboard/:slug" component={RestaurantDashboard} />
      <Route path="/dashboard/:slug/allergens" component={AllergenMatrixPage} />
      <Route path="/dashboard/:slug/finances" component={FinancesPage} />
      <Route path="/dashboard/:slug/suppliers" component={SuppliersPage} />
      <Route path="/suppliers/:slug" component={SuppliersPage} />
      <Route path="/finances/:slug" component={FinancesPage} />
      <Route path="/branch-settings/:slug" component={BranchSettingsPage} />
      <Route path="/kitchen/:slug" component={KitchenDisplay} />
      <Route path="/kitchen/:slug/settings" component={KitchenSettings} />
      <Route path="/epos/:slug" component={EposPage} />
      <Route path="/waiter/:slug" component={WaiterPage} />
      <Route path="/telephone/:slug" component={TelephonePage} />
      <Route path="/phone/:slug" component={Link24Phone} />
      <Route path="/drivers/:slug" component={DriversPage} />
      <Route path="/track/:orderId" component={TrackOrderPage} />
      <Route path="/portal-admin">
        <ProtectedAdminRoute component={AdminDashboard} />
      </Route>
      <Route path="/super-admin">
        <Redirect to="/portal-admin" />
      </Route>
      <Route path="/terms" component={TermsPolicy} />
      <Route path="/property" component={PropertyLanding} />
      <Route path="/admin-property" component={PropertyLanding} />
      <Route path="/property-admin-login" component={PropertySuperAdmin} />
      <Route path="/property-super-admin" component={PropertySuperAdmin} />
      <Route path="/admin-grocery">
        <ProtectedAdminRoute component={GroceryAdmin} />
      </Route>
      <Route path="/ai-studio">
        <ProtectedAdminRoute component={AIStudio} />
      </Route>
      <Route path="/shop-display-menus">
        <ProtectedAdminRoute component={ShopDisplayMenus} />
      </Route>
      <Route path="/tv-admin">
        <ProtectedAdminRoute component={TvAdmin} />
      </Route>
      <Route path="/tv/:token" component={TvDisplay} />
      <Route path="/tv-live/:token" component={TvLiveDisplay} />
      <Route path="/tv-login" component={TvCustomerLogin} />
      <Route path="/tv-customer/:customerId/:tvNum" component={TvCustomerDisplay} />
      <Route path="/grocery/:slug" component={GroceryStore} />
      <Route path="/grocery-driver" component={GroceryDriverLogin} />
      <Route path="/grocery-driver-dashboard" component={GroceryDriverDashboard} />
      <Route path="/grocery-track/:orderId" component={GroceryTrackOrder} />
      <Route path="/grocery-branch-login" component={GroceryBranchLogin} />
      <Route path="/grocery-staff-login" component={GroceryStaffLogin} />
      <Route path="/grocery-branch-dashboard" component={GroceryBranchDashboard} />
      <Route path="/marketing-login" component={MarketingStaffLogin} />
      <Route path="/marketing-dashboard" component={MarketingDashboard} />
      <Route path="/taxi-admin-login" component={TaxiAdminLogin} />
      <Route path="/taxi-admin" component={TaxiAdminDashboard} />
      <Route path="/taxi-brand-login" component={TaxiBrandLogin} />
      <Route path="/taxi-brand-admin" component={TaxiBrandAdminDashboard} />
      <Route path="/taxi-customer-login" component={TaxiCustomerLogin} />
      <Route path="/taxi-login" component={TaxiDriverLogin} />
      <Route path="/taxi-dashboard" component={TaxiDriverDashboard} />
      <Route path="/taxi/:brandSlug" component={TaxiCustomerPage} />
      <Route path="/clothing-admin">
        <ProtectedAdminRoute component={ClothingAdmin} />
      </Route>
      <Route path="/clothing-brand-login" component={ClothingBrandLogin} />
      <Route path="/clothing-brand-dashboard" component={ClothingBrandDashboard} />
      <Route path="/clothing/:slug" component={ClothingStore} />
      <Route path="/admin-furniture">
        <ProtectedAdminRoute component={FurnitureAdmin} />
      </Route>
      <Route path="/furniture-brand-login" component={FurnitureBrandLogin} />
      <Route path="/furniture-brand-dashboard" component={FurnitureBrandDashboard} />
      <Route path="/furniture/:slug" component={FurnitureStore} />
      <Route path="/admin-quran">
        <ProtectedAdminRoute component={QuranAdmin} />
      </Route>
      <Route path="/quran-academy-login" component={QuranAcademyLogin} />
      <Route path="/quran-academy-dashboard" component={QuranAcademyDashboard} />
      <Route path="/quran-reader" component={QuranReader} />
      <Route path="/quran-student-login" component={QuranStudentLogin} />
      <Route path="/quran-student-dashboard" component={QuranStudentDashboard} />
      <Route path="/admin-devices">
        <ProtectedAdminRoute component={DeviceAdmin} />
      </Route>
      <Route path="/device-brand-login" component={DeviceBrandLogin} />
      <Route path="/device-brand-dashboard" component={DeviceBrandDashboard} />
      <Route path="/device-customer-login" component={DeviceCustomerLogin} />
      <Route path="/device-customer-portal" component={DeviceCustomerPortal} />
      <Route path="/admin-inventory">
        <ProtectedAdminRoute component={InventoryAdmin} />
      </Route>
      <Route path="/admin-payments">
        <ProtectedAdminRoute component={AdminPayments} />
      </Route>
      <Route path="/inventory-brand-login" component={InventoryBrandLogin} />
      <Route path="/inventory-brand-dashboard" component={InventoryBrandDashboard} />
      <Route path="/inventory-customer-login" component={InventoryCustomerLogin} />
      <Route path="/inventory-customer-portal" component={InventoryCustomerPortal} />
      <Route path="/payment-setup" component={StripeApplication} />
      <Route path="/payment-setup-pk" component={StripeApplicationPK} />
      <Route path="/mujeeb-ai" component={MujeebAIAgent} />
      <Route path="/property-branch/:slug" component={PropertyBranchDashboard} />
      <Route path="/property/:slug" component={PropertyWebsite} />
      <Route path="/tawa-grill" component={TawaGrillWelcome} />
      <Route path="/tawa-grill/menu" component={TawaMenu} />
      <Route path="/shirin-mahal" component={ShirinMahalWelcome} />
      <Route path="/dasi-food-hub" component={DasiFoodHubWelcome} />
      <Route path="/:slug/welcome" component={WelcomeRouter} />
      <Route path="/r/:slug/menu" component={MenuRouter} />
      <Route path="/r/:slug" component={WelcomeRouter} />
      <Route path="/restaurant/:slug" component={WelcomeRouter} />
      <Route path="/menu/:slug" component={MenuRouter} />
      <Route path="/:slug/menu" component={MenuRouter} />
      <Route path="/:slug" component={MenuRouter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <LanguageSelector />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
