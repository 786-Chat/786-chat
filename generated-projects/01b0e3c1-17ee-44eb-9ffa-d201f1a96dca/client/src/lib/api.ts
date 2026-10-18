import type { Restaurant, InsertRestaurant, MenuItem, InsertMenuItem, MenuItemWithVariants, MenuItemVariant, InsertMenuItemVariant, Order, InsertOrder, OrderItem, Booking, InsertBooking, GalleryImage, InsertGalleryImage, Promotion, InsertPromotion, HeroImage, InsertHeroImage, DashboardSettings, InsertDashboardSettings, Driver, InsertDriver, BranchDriverAssignment, OrderDelivery, BookingWithHistory, ExtraTopping, InsertExtraTopping, BranchFeatures, PopularItem, InsertPopularItem } from "@shared/schema";

const API_BASE = "/api";

// Restaurant API
export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${API_BASE}/restaurants`);
  if (!res.ok) throw new Error("Failed to fetch restaurants");
  return res.json();
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant> {
  const res = await fetch(`${API_BASE}/restaurants/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch restaurant");
  return res.json();
}

export async function createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
  const res = await fetch(`${API_BASE}/restaurants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(restaurant),
  });
  if (!res.ok) throw new Error("Failed to create restaurant");
  return res.json();
}

export async function updateRestaurant(id: string, data: Partial<InsertRestaurant>): Promise<Restaurant> {
  const res = await fetch(`${API_BASE}/restaurants/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update restaurant");
  return res.json();
}

export async function deleteRestaurant(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/restaurants/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete restaurant");
}

export async function duplicateRestaurant(
  sourceId: string,
  overrides: {
    name: string;
    slug: string;
    address?: string;
    phone?: string;
    email?: string;
    loginUsername?: string;
    loginPassword?: string;
    stripeAccountId?: string;
    logoUrl?: string;
    tagline?: string;
    cuisineType?: string;
    rating?: string;
    themeKey?: string;
  }
): Promise<Restaurant> {
  const res = await fetch(`${API_BASE}/restaurants/${sourceId}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(overrides),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to duplicate restaurant");
  }
  return res.json();
}

// Menu API
export async function getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
  const url = restaurantId ? `${API_BASE}/menu?restaurantId=${restaurantId}` : `${API_BASE}/menu`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch menu items");
  return res.json();
}

export async function createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to create menu item");
  return res.json();
}

export async function updateMenuItem(id: string, data: Partial<InsertMenuItem>): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update menu item");
  return res.json();
}

export async function deleteMenuItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/menu/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete menu item");
}

export async function getMenuItemsWithVariants(restaurantId: string): Promise<MenuItemWithVariants[]> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/menu-with-variants`);
  if (!res.ok) throw new Error("Failed to fetch menu items with variants");
  return res.json();
}

// Menu Item Variant API
export async function getMenuItemVariants(menuItemId: string): Promise<MenuItemVariant[]> {
  const res = await fetch(`${API_BASE}/menu/${menuItemId}/variants`);
  if (!res.ok) throw new Error("Failed to fetch variants");
  return res.json();
}

export async function createMenuItemVariant(menuItemId: string, variant: Omit<InsertMenuItemVariant, "menuItemId">): Promise<MenuItemVariant> {
  const res = await fetch(`${API_BASE}/menu/${menuItemId}/variants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variant),
  });
  if (!res.ok) throw new Error("Failed to create variant");
  return res.json();
}

export async function updateMenuItemVariant(id: string, data: Partial<InsertMenuItemVariant>): Promise<MenuItemVariant> {
  const res = await fetch(`${API_BASE}/variants/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update variant");
  return res.json();
}

export async function deleteMenuItemVariant(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/variants/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete variant");
}

// Order API
export async function getOrders(restaurantId?: string): Promise<(Order & { items: OrderItem[] })[]> {
  const url = restaurantId ? `${API_BASE}/orders?restaurantId=${restaurantId}` : `${API_BASE}/orders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function createOrder(order: InsertOrder, items: Omit<OrderItem, "id" | "orderId">[]): Promise<Order & { items: OrderItem[] }> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order, items }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create order");
  }
  return res.json();
}

export async function updateOrderStatus(id: string, status: "new" | "preparing" | "ready" | "completed"): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update order status");
  return res.json();
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete order");
}

// Booking API
export async function getBookings(restaurantId?: string): Promise<BookingWithHistory[]> {
  const url = restaurantId ? `${API_BASE}/bookings?restaurantId=${restaurantId}` : `${API_BASE}/bookings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error("Failed to create booking");
  return res.json();
}

export async function updateBookingStatus(id: string, status: "pending" | "confirmed" | "cancelled"): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update booking status");
  return res.json();
}

export async function getBookingsByPhone(phone: string, restaurantId: string): Promise<Booking[]> {
  const res = await fetch(`${API_BASE}/bookings/phone/${encodeURIComponent(phone)}?restaurantId=${restaurantId}`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

// Gallery API
export async function getGalleryImages(restaurantId: string): Promise<GalleryImage[]> {
  const res = await fetch(`${API_BASE}/gallery/${restaurantId}`);
  if (!res.ok) throw new Error("Failed to fetch gallery images");
  return res.json();
}

export async function createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
  const res = await fetch(`${API_BASE}/gallery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(image),
  });
  if (!res.ok) throw new Error("Failed to create gallery image");
  return res.json();
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/gallery/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete gallery image");
}

// Promotion API
export async function getPromotion(restaurantId: string): Promise<Promotion | null> {
  const res = await fetch(`${API_BASE}/promotions/${restaurantId}`);
  if (!res.ok) throw new Error("Failed to fetch promotion");
  return res.json();
}

export async function createPromotion(promotion: InsertPromotion): Promise<Promotion> {
  const res = await fetch(`${API_BASE}/promotions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(promotion),
  });
  if (!res.ok) throw new Error("Failed to create promotion");
  return res.json();
}

export async function updatePromotion(id: string, data: Partial<InsertPromotion>): Promise<Promotion> {
  const res = await fetch(`${API_BASE}/promotions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update promotion");
  return res.json();
}

export async function deletePromotion(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/promotions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete promotion");
}

// WebSocket connection for real-time order notifications
export function connectWebSocket(restaurantId: string, onMessage: (data: any) => void): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws?restaurantId=${restaurantId}`);
  
  ws.onopen = () => {
    console.log(`[WebSocket] Connected to restaurant ${restaurantId}`);
  };
  
  ws.onmessage = (event) => {
    console.log(`[WebSocket] Received message:`, event.data);
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  ws.onerror = (error) => {
    console.error(`[WebSocket] Error:`, error);
  };
  
  ws.onclose = () => {
    console.log(`[WebSocket] Disconnected from restaurant ${restaurantId}`);
  };

  return ws;
}

// Hero Images API
export async function getHeroImages(restaurantId: string): Promise<HeroImage[]> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/hero-images`);
  if (!res.ok) throw new Error("Failed to fetch hero images");
  return res.json();
}

export async function createHeroImage(restaurantId: string, data: Omit<InsertHeroImage, 'restaurantId'>): Promise<HeroImage> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/hero-images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create hero image");
  return res.json();
}

export async function updateHeroImage(id: string, data: Partial<InsertHeroImage>): Promise<HeroImage> {
  const res = await fetch(`${API_BASE}/hero-images/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update hero image");
  return res.json();
}

export async function deleteHeroImage(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/hero-images/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete hero image");
}

export async function reorderHeroImages(restaurantId: string, imageIds: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/hero-images/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder hero images");
}

// Dashboard Settings API (Super Admin feature control)
export async function getDashboardSettings(restaurantId: string): Promise<DashboardSettings> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/dashboard-settings`);
  if (!res.ok) throw new Error("Failed to fetch dashboard settings");
  return res.json();
}

export async function updateDashboardSettings(restaurantId: string, data: Partial<InsertDashboardSettings>): Promise<DashboardSettings> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/dashboard-settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update dashboard settings");
  return res.json();
}

// Branch Features API (Super Admin feature toggles per branch)
export async function getBranchFeatures(restaurantId: string): Promise<BranchFeatures> {
  const res = await fetch(`${API_BASE}/branch-features/${restaurantId}`);
  if (!res.ok) throw new Error("Failed to fetch branch features");
  return res.json();
}

export async function updateBranchFeatures(restaurantId: string, data: Partial<BranchFeatures>): Promise<BranchFeatures> {
  const res = await fetch(`${API_BASE}/branch-features/${restaurantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update branch features");
  return res.json();
}

// Driver API
export async function getAllDrivers(): Promise<Driver[]> {
  const res = await fetch(`${API_BASE}/drivers`);
  if (!res.ok) throw new Error("Failed to fetch drivers");
  return res.json();
}

export async function getDriver(id: string): Promise<Driver> {
  const res = await fetch(`${API_BASE}/drivers/${id}`);
  if (!res.ok) throw new Error("Failed to fetch driver");
  return res.json();
}

export async function createDriver(driver: InsertDriver): Promise<Driver> {
  const res = await fetch(`${API_BASE}/drivers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(driver),
  });
  if (!res.ok) throw new Error("Failed to create driver");
  return res.json();
}

export async function updateDriver(id: string, data: Partial<InsertDriver>): Promise<Driver> {
  const res = await fetch(`${API_BASE}/drivers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update driver");
  return res.json();
}

export async function deleteDriver(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/drivers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete driver");
}

// Branch Driver API - drivers belong directly to a restaurant
export async function getBranchDrivers(restaurantId: string): Promise<Driver[]> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/drivers`);
  if (!res.ok) throw new Error("Failed to fetch branch drivers");
  return res.json();
}

export async function createBranchDriver(restaurantId: string, driver: { 
  name: string; 
  phone: string; 
  password: string; 
  vehicleType?: string; 
  vehiclePlate?: string;
  paymentType?: 'mileage' | 'salary' | 'salary_plus_commission';
  mileageRate1?: string;
  mileageRate2?: string;
  mileageRate3?: string;
  mileageRange1Max?: string;
  mileageRange2Max?: string;
  mileageRange3Max?: string;
  salaryAmount?: string;
  salaryPeriod?: 'weekly' | 'monthly';
  agreedDeliveryCharge?: string;
  licenseType?: 'uk_full' | 'international';
  licenseCopyUrl?: string;
  address?: string;
  city?: string;
  county?: string;
  postcode?: string;
  yearsAtAddress?: string;
  residencyStatus?: 'student_work_permit' | 'british_citizen' | 'permanent_resident' | 'other';
  residencyOther?: string;
}): Promise<Driver> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/drivers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(driver),
  });
  if (!res.ok) throw new Error("Failed to create driver");
  return res.json();
}

export async function uploadDriverLicense(restaurantId: string, file: File): Promise<{ url: string; filename: string; mimeType: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/drivers/upload-license`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload license document");
  return res.json();
}

export async function deleteBranchDriver(restaurantId: string, driverId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/drivers/${driverId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete driver");
}

export async function toggleDriverDuty(driverId: string, isOnDuty: boolean): Promise<Driver> {
  const res = await fetch(`${API_BASE}/drivers/${driverId}/duty`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isOnDuty }),
  });
  if (!res.ok) throw new Error("Failed to toggle driver duty status");
  return res.json();
}

// Order Delivery API
export async function getOrderDelivery(orderId: string): Promise<OrderDelivery> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/delivery`);
  if (!res.ok) throw new Error("Failed to fetch delivery info");
  return res.json();
}

export async function assignDriverToOrder(
  orderId: string, 
  driverId?: string, 
  broadcastToAll?: boolean,
  offerAmount?: string,
  paymentInstruction?: string,
  driverNotes?: string
): Promise<OrderDelivery> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/assign-driver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId, broadcastToAll, offerAmount, paymentInstruction, driverNotes }),
  });
  if (!res.ok) throw new Error("Failed to assign driver");
  return res.json();
}

export async function updateDeliveryStatus(orderId: string, status: string, driverNotes?: string): Promise<OrderDelivery> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/delivery-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, driverNotes }),
  });
  if (!res.ok) throw new Error("Failed to update delivery status");
  return res.json();
}

export async function getDriverActiveDeliveries(driverId: string): Promise<(OrderDelivery & { order: Order & { items: OrderItem[] } })[]> {
  const res = await fetch(`${API_BASE}/drivers/${driverId}/deliveries`);
  if (!res.ok) throw new Error("Failed to fetch deliveries");
  return res.json();
}

export async function getDriverDeliveryHistory(driverId: string): Promise<(OrderDelivery & { order: Order })[]> {
  const res = await fetch(`${API_BASE}/drivers/${driverId}/history`);
  if (!res.ok) throw new Error("Failed to fetch delivery history");
  return res.json();
}

// Extra Toppings API
export async function getExtraToppings(restaurantId: string): Promise<ExtraTopping[]> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/extra-toppings`);
  if (!res.ok) throw new Error("Failed to fetch extra toppings");
  return res.json();
}

export async function createExtraTopping(restaurantId: string, data: { name: string; price: string; menuItemId?: string }): Promise<ExtraTopping> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/extra-toppings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create extra topping");
  return res.json();
}

export async function updateExtraTopping(id: string, data: Partial<{ name: string; price: string; isActive: boolean }>): Promise<ExtraTopping> {
  const res = await fetch(`${API_BASE}/extra-toppings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update extra topping");
  return res.json();
}

export async function deleteExtraTopping(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/extra-toppings/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete extra topping");
}

// Topping Groups API (Option Groups for deals)
import type { ToppingGroupWithOptions } from "@shared/schema";

export async function getToppingGroups(restaurantId: string): Promise<ToppingGroupWithOptions[]> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/topping-groups`);
  if (!res.ok) throw new Error("Failed to fetch topping groups");
  return res.json();
}

// Stripe Payment API
export async function getStripeConfig(restaurantId?: string): Promise<{ publishableKey: string }> {
  const url = restaurantId 
    ? `${API_BASE}/stripe-config?restaurantId=${restaurantId}`
    : `${API_BASE}/stripe-config`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to get Stripe config");
  return res.json();
}

export async function createPaymentIntent(amount: number, restaurantId: string, orderId?: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const res = await fetch(`${API_BASE}/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, restaurantId, orderId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create payment intent");
  }
  return res.json();
}

export async function capturePayment(paymentIntentId: string, orderId: string, restaurantId?: string): Promise<{ success: boolean; amount: number }> {
  const res = await fetch(`${API_BASE}/capture-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentIntentId, orderId, restaurantId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to capture payment");
  }
  return res.json();
}

export async function cancelPayment(paymentIntentId: string, orderId: string, restaurantId?: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/cancel-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentIntentId, orderId, restaurantId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to cancel payment");
  }
  return res.json();
}

// Popular Items API (Featured items on welcome page)
export async function getPopularItems(restaurantId: string): Promise<PopularItem[]> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/popular-items`);
  if (!res.ok) throw new Error("Failed to fetch popular items");
  return res.json();
}

export async function createPopularItem(restaurantId: string, item: Omit<InsertPopularItem, "restaurantId">): Promise<PopularItem> {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/popular-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to create popular item");
  return res.json();
}

export async function updatePopularItem(id: string, data: Partial<InsertPopularItem>): Promise<PopularItem> {
  const res = await fetch(`${API_BASE}/popular-items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update popular item");
  return res.json();
}

export async function deletePopularItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/popular-items/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete popular item");
}
