import { eq, desc, max, and, sql, inArray, or, isNull } from "drizzle-orm";
import * as schema from "@shared/schema";
import { db } from "./db";
import type { 
  User, InsertUser, 
  Restaurant, InsertRestaurant,
  MenuItem, InsertMenuItem,
  MenuItemWithVariants,
  MenuItemVariant, InsertMenuItemVariant,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  Booking, InsertBooking,
  BookingWithHistory,
  GalleryImage, InsertGalleryImage,
  MenuModifier, InsertMenuModifier,
  Customer, InsertCustomer,
  Promotion, InsertPromotion,
  HeroImage, InsertHeroImage,
  DashboardSettings, InsertDashboardSettings,
  Driver, InsertDriver,
  BranchDriverAssignment, InsertBranchDriverAssignment,
  OrderDelivery, InsertOrderDelivery,
  ExtraTopping, InsertExtraTopping,
  ToppingGroup, InsertToppingGroup,
  ToppingGroupOption, InsertToppingGroupOption,
  ToppingGroupWithOptions,
  KitchenStation, InsertKitchenStation,
  OrderItemCompletion, InsertOrderItemCompletion,
  EposOrder, InsertEposOrder,
  MenuCategory, InsertMenuCategory,
  Waiter, InsertWaiter,
  WaiterTablet, InsertWaiterTablet,
  TableSession, InsertTableSession,
  TableSessionItem, InsertTableSessionItem,
  Supplier, InsertSupplier,
  SupplierProduct, InsertSupplierProduct,
  SupplierOrder, InsertSupplierOrder,
  SupplierOrderItem, InsertSupplierOrderItem,
  SupplierWithProducts, SupplierOrderWithItems,
  FinancialTransaction, InsertFinancialTransaction,
  RecurringExpense, InsertRecurringExpense,
  StaffMember, InsertStaffMember,
  StaffWagePayment, InsertStaffWagePayment,
  CashDeposit, InsertCashDeposit,
  FinancialSummary,
  PlatformSettings, InsertPlatformSettings,
  BranchSnapshot, InsertBranchSnapshot,
  DriverLocation, InsertDriverLocation
} from "@shared/schema";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Restaurant methods
  getAllRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantBySlug(slug: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: string): Promise<void>;

  // Menu methods
  getMenuItems(restaurantId: string): Promise<MenuItem[]>;
  getAllMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string): Promise<void>;

  // Order methods
  getAllOrders(restaurantId: string): Promise<(Order & { items: OrderItem[] })[]>;
  getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order & { items: OrderItem[] }>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: "new" | "preparing" | "ready" | "completed"): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<void>;

  // Booking methods
  getAllBookings(restaurantId: string): Promise<Booking[]>;
  getAllBookingsWithHistory(restaurantId: string): Promise<BookingWithHistory[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByPhone(phone: string, restaurantId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  createBookingWithCustomer(booking: InsertBooking): Promise<BookingWithHistory>;
  updateBookingStatus(id: string, status: "pending" | "confirmed" | "cancelled"): Promise<Booking | undefined>;
  getCustomerVisitHistory(phone: string, restaurantId: string): Promise<BookingWithHistory["visitHistory"]>;
  getPendingBookingCounts(): Promise<Record<string, number>>;

  // Gallery methods
  getGalleryImages(restaurantId: string): Promise<GalleryImage[]>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  deleteGalleryImage(id: string): Promise<void>;

  // Menu Modifier methods
  getMenuModifiers(menuItemId: string): Promise<MenuModifier[]>;
  createMenuModifier(modifier: InsertMenuModifier): Promise<MenuModifier>;
  updateMenuModifier(id: string, modifier: Partial<InsertMenuModifier>): Promise<MenuModifier | undefined>;
  deleteMenuModifier(id: string): Promise<void>;
  deleteMenuModifiersByMenuItem(menuItemId: string): Promise<void>;

  // Menu Item Variant methods
  getMenuItemVariants(menuItemId: string): Promise<MenuItemVariant[]>;
  createMenuItemVariant(variant: InsertMenuItemVariant): Promise<MenuItemVariant>;
  updateMenuItemVariant(id: string, variant: Partial<InsertMenuItemVariant>): Promise<MenuItemVariant | undefined>;
  deleteMenuItemVariant(id: string): Promise<void>;
  deleteMenuItemVariantsByMenuItem(menuItemId: string): Promise<void>;
  getMenuItemsWithVariants(restaurantId: string): Promise<MenuItemWithVariants[]>;

  // Customer methods
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomerByPhoneAndRestaurant(phone: string, restaurantId: string): Promise<Customer | undefined>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  getCustomersWithOrderCount(): Promise<(Customer & { orderCount: number })[]>;
  getCustomersByRestaurant(restaurantId: string): Promise<(Customer & { orderCount: number })[]>;
  deleteCustomer(id: string): Promise<void>;
  getCustomerOrders(customerId: string): Promise<(Order & { items: OrderItem[] })[]>;

  // Promotion methods
  getPromotion(restaurantId: string): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined>;
  deletePromotion(id: string): Promise<void>;

  // Hero Image methods
  getHeroImages(restaurantId: string): Promise<HeroImage[]>;
  createHeroImage(image: InsertHeroImage): Promise<HeroImage>;
  updateHeroImage(id: string, image: Partial<InsertHeroImage>): Promise<HeroImage | undefined>;
  deleteHeroImage(id: string): Promise<void>;
  reorderHeroImages(restaurantId: string, imageIds: string[]): Promise<void>;

  // Dashboard Settings methods
  getDashboardSettings(restaurantId: string): Promise<DashboardSettings | undefined>;
  createDashboardSettings(settings: InsertDashboardSettings): Promise<DashboardSettings>;
  updateDashboardSettings(restaurantId: string, settings: Partial<InsertDashboardSettings>): Promise<DashboardSettings | undefined>;

  // Driver methods - drivers belong directly to a restaurant
  getAllDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByPhone(phone: string): Promise<Driver | undefined>;
  getDriversByRestaurant(restaurantId: string): Promise<Driver[]>;
  verifyDriverPassword(driver: Driver, password: string): Promise<boolean>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<void>;
  updateDriverLocation(id: string, lat: string, lng: string): Promise<Driver | undefined>;
  updateDriverOnDuty(id: string, isOnDuty: boolean): Promise<Driver | undefined>;
  getDriverRestaurant(driverId: string): Promise<Restaurant | undefined>;
  
  // Driver Location Tracking methods
  saveDriverLocationHistory(driverId: string, orderId: string | null, lat: string, lng: string, speed?: string, heading?: string, accuracy?: string): Promise<DriverLocation>;
  getLatestDriverLocation(driverId: string): Promise<DriverLocation | undefined>;
  getDriverLocationForOrder(orderId: string): Promise<DriverLocation | undefined>;

  // Order Delivery methods
  getOrderDelivery(orderId: string): Promise<OrderDelivery | undefined>;
  createOrderDelivery(delivery: InsertOrderDelivery): Promise<OrderDelivery>;
  updateOrderDelivery(orderId: string, delivery: Partial<InsertOrderDelivery>): Promise<OrderDelivery | undefined>;
  assignDriverToOrder(orderId: string, driverId: string | null): Promise<OrderDelivery | undefined>;
  getDriverActiveDeliveries(driverId: string): Promise<(OrderDelivery & { order: Order & { items: OrderItem[] }; restaurant: { name: string; address?: string | null } })[]>;
  getDriverDeliveryHistory(driverId: string): Promise<(OrderDelivery & { order: Order })[]>;

  // Extra Toppings methods
  getExtraToppings(restaurantId: string): Promise<ExtraTopping[]>;
  createExtraTopping(topping: InsertExtraTopping): Promise<ExtraTopping>;
  updateExtraTopping(id: string, topping: Partial<InsertExtraTopping>): Promise<ExtraTopping | undefined>;
  deleteExtraTopping(id: string): Promise<void>;

  // Topping Groups methods (drink selections, etc.)
  getToppingGroups(menuItemId: string): Promise<ToppingGroupWithOptions[]>;
  getToppingGroupsByRestaurant(restaurantId: string): Promise<ToppingGroupWithOptions[]>;
  createToppingGroup(group: InsertToppingGroup): Promise<ToppingGroup>;
  updateToppingGroup(id: string, group: Partial<InsertToppingGroup>): Promise<ToppingGroup | undefined>;
  deleteToppingGroup(id: string): Promise<void>;
  
  // Topping Group Options methods
  createToppingGroupOption(option: InsertToppingGroupOption): Promise<ToppingGroupOption>;
  updateToppingGroupOption(id: string, option: Partial<InsertToppingGroupOption>): Promise<ToppingGroupOption | undefined>;
  deleteToppingGroupOption(id: string): Promise<void>;
  syncToppingOptionAvailabilityByName(restaurantId: string, optionName: string, isAvailable: boolean): Promise<number>;

  // Driver earnings and payment methods
  getDriverById(id: string): Promise<Driver | undefined>;
  getDriverCompletedDeliveries(driverId: string): Promise<{ orderNumber: number; deliveredAt: Date | null }[]>;
  getDriverPayments(driverId: string): Promise<schema.DriverPayment[]>;
  createDriverPayment(payment: schema.InsertDriverPayment): Promise<schema.DriverPayment>;

  // Kitchen Station methods
  getKitchenStations(restaurantId: string): Promise<KitchenStation[]>;
  getKitchenStation(id: string): Promise<KitchenStation | undefined>;
  createKitchenStation(station: InsertKitchenStation): Promise<KitchenStation>;
  updateKitchenStation(id: string, station: Partial<InsertKitchenStation>): Promise<KitchenStation | undefined>;
  deleteKitchenStation(id: string): Promise<void>;

  // Order Item Completion methods
  getOrderItemCompletions(orderId: string): Promise<OrderItemCompletion[]>;
  createOrderItemCompletion(completion: InsertOrderItemCompletion): Promise<OrderItemCompletion>;
  updateOrderItemCompletion(id: string, completion: Partial<InsertOrderItemCompletion>): Promise<OrderItemCompletion | undefined>;
  markItemReady(orderItemId: string, quantity: number, stationId?: string, completedBy?: string): Promise<OrderItemCompletion>;
  getOrderItemCompletion(orderItemId: string): Promise<OrderItemCompletion | undefined>;

  // EPOS Order methods
  getEposOrders(restaurantId: string): Promise<EposOrder[]>;
  getEposOrder(id: string): Promise<EposOrder | undefined>;
  createEposOrder(order: InsertEposOrder): Promise<EposOrder>;
  deleteEposOrder(id: string): Promise<void>;
  getNextEposReceiptNumber(restaurantId: string): Promise<number>;

  // Menu Category methods
  getMenuCategories(restaurantId: string): Promise<MenuCategory[]>;
  getAllMenuCategories(): Promise<MenuCategory[]>;
  getMenuCategory(id: string): Promise<MenuCategory | undefined>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;
  updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined>;
  deleteMenuCategory(id: string): Promise<void>;

  // Waiter methods
  getWaiters(restaurantId: string): Promise<Waiter[]>;
  getWaiter(id: string): Promise<Waiter | undefined>;
  getWaiterByNameAndPin(restaurantId: string, name: string, pin: string): Promise<Waiter | undefined>;
  createWaiter(waiter: InsertWaiter): Promise<Waiter>;
  updateWaiter(id: string, waiter: Partial<InsertWaiter>): Promise<Waiter | undefined>;
  deleteWaiter(id: string): Promise<void>;

  // Waiter Tablet methods
  getWaiterTablets(restaurantId: string): Promise<WaiterTablet[]>;
  getWaiterTablet(id: string): Promise<WaiterTablet | undefined>;
  getWaiterTabletByNumber(restaurantId: string, tabletNumber: number): Promise<WaiterTablet | undefined>;
  createWaiterTablet(tablet: InsertWaiterTablet): Promise<WaiterTablet>;
  updateWaiterTablet(id: string, tablet: Partial<InsertWaiterTablet>): Promise<WaiterTablet | undefined>;
  claimWaiterTablet(tabletId: string, waiterName: string): Promise<WaiterTablet | undefined>;
  releaseWaiterTablet(tabletId: string): Promise<WaiterTablet | undefined>;
  releaseAllWaiterTablets(restaurantId: string): Promise<WaiterTablet[]>;
  incrementTabletOrderCount(tabletId: string): Promise<WaiterTablet | undefined>;
  seedWaiterTablets(restaurantId: string, count: number): Promise<WaiterTablet[]>;

  // Table Session methods
  getTableSessions(restaurantId: string): Promise<(TableSession & { items: TableSessionItem[]; waiter?: Waiter })[]>;
  getTableSession(id: string): Promise<(TableSession & { items: TableSessionItem[] }) | undefined>;
  createTableSession(session: InsertTableSession): Promise<TableSession>;
  updateTableSession(id: string, session: Partial<InsertTableSession>): Promise<TableSession | undefined>;
  addTableSessionItem(item: InsertTableSessionItem): Promise<TableSessionItem>;
  updateTableSessionItem(id: string, item: Partial<InsertTableSessionItem>): Promise<TableSessionItem | undefined>;
  deleteTableSessionItem(id: string): Promise<void>;
  getTableSessionItems(sessionId: string): Promise<TableSessionItem[]>;

  // Supplier methods
  getSuppliers(restaurantId: string): Promise<Supplier[]>;
  getSuppliersWithProducts(restaurantId: string): Promise<SupplierWithProducts[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;

  // Supplier Product methods
  getSupplierProducts(supplierId: string): Promise<SupplierProduct[]>;
  getSupplierProduct(id: string): Promise<SupplierProduct | undefined>;
  createSupplierProduct(product: InsertSupplierProduct): Promise<SupplierProduct>;
  updateSupplierProduct(id: string, product: Partial<InsertSupplierProduct>): Promise<SupplierProduct | undefined>;
  deleteSupplierProduct(id: string): Promise<void>;

  // Supplier Order methods
  getSupplierOrders(restaurantId: string): Promise<SupplierOrderWithItems[]>;
  getSupplierOrder(id: string): Promise<SupplierOrderWithItems | undefined>;
  createSupplierOrder(order: InsertSupplierOrder, items: Omit<InsertSupplierOrderItem, "orderId">[]): Promise<SupplierOrderWithItems>;
  updateSupplierOrder(id: string, order: Partial<InsertSupplierOrder>): Promise<SupplierOrder | undefined>;
  deleteSupplierOrder(id: string): Promise<void>;
  markSupplierOrderSent(id: string): Promise<SupplierOrder | undefined>;
  updateSupplierOrderItemQuantity(itemId: string, quantity: number, unitPrice: number): Promise<SupplierOrderItem | undefined>;

  // Financial Transaction methods
  getFinancialTransactions(restaurantId: string, startDate?: Date, endDate?: Date): Promise<FinancialTransaction[]>;
  getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined>;
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  deleteFinancialTransaction(id: string): Promise<void>;
  getFinancialSummary(restaurantId: string, startDate?: Date, endDate?: Date): Promise<FinancialSummary>;

  // Recurring Expense methods
  getRecurringExpenses(restaurantId: string): Promise<RecurringExpense[]>;
  getRecurringExpense(id: string): Promise<RecurringExpense | undefined>;
  createRecurringExpense(expense: InsertRecurringExpense): Promise<RecurringExpense>;
  updateRecurringExpense(id: string, expense: Partial<InsertRecurringExpense>): Promise<RecurringExpense | undefined>;
  deleteRecurringExpense(id: string): Promise<void>;

  // Staff Member methods
  getStaffMembers(restaurantId: string): Promise<StaffMember[]>;
  getStaffMember(id: string): Promise<StaffMember | undefined>;
  createStaffMember(staff: InsertStaffMember): Promise<StaffMember>;
  updateStaffMember(id: string, staff: Partial<InsertStaffMember>): Promise<StaffMember | undefined>;
  deleteStaffMember(id: string): Promise<void>;

  // Staff Wage Payment methods
  getStaffWagePayments(restaurantId: string): Promise<StaffWagePayment[]>;
  getStaffWagePaymentsByStaff(staffId: string): Promise<StaffWagePayment[]>;
  createStaffWagePayment(payment: InsertStaffWagePayment): Promise<StaffWagePayment>;
  updateStaffWagePayment(id: string, payment: Partial<InsertStaffWagePayment>): Promise<StaffWagePayment | undefined>;
  deleteStaffWagePayment(id: string): Promise<void>;

  // Cash Deposit methods
  getCashDeposits(restaurantId: string): Promise<CashDeposit[]>;
  createCashDeposit(deposit: InsertCashDeposit): Promise<CashDeposit>;
  deleteCashDeposit(id: string): Promise<void>;

  // Branch Snapshot methods (for data backup/recovery)
  getBranchSnapshots(restaurantId: string): Promise<schema.BranchSnapshot[]>;
  getBranchSnapshot(id: string): Promise<schema.BranchSnapshot | undefined>;
  createBranchSnapshot(restaurantId: string, label?: string, snapshotType?: string): Promise<schema.BranchSnapshot>;
  restoreBranchSnapshot(snapshotId: string): Promise<boolean>;
  deleteBranchSnapshot(id: string): Promise<void>;

  // Customer Push Subscription methods (for order tracking notifications)
  saveCustomerPushSubscription(orderId: string, endpoint: string, p256dh: string, auth: string): Promise<schema.CustomerPushSubscription>;
  getCustomerPushSubscriptions(orderId: string): Promise<schema.CustomerPushSubscription[]>;
  deleteCustomerPushSubscriptions(orderId: string): Promise<void>;

  // Twilio Settings methods (per-branch caller ID configuration)
  getTwilioSettings(restaurantId: string): Promise<schema.TwilioSettings | undefined>;
  getAllTwilioSettings(): Promise<schema.TwilioSettings[]>;
  createTwilioSettings(settings: schema.InsertTwilioSettings): Promise<schema.TwilioSettings>;
  updateTwilioSettings(restaurantId: string, settings: Partial<schema.InsertTwilioSettings>): Promise<schema.TwilioSettings | undefined>;
  toggleTwilioEnabled(restaurantId: string, enabled: boolean): Promise<schema.TwilioSettings | undefined>;
  deleteTwilioSettings(restaurantId: string): Promise<void>;

  // Call Recording methods (store and manage Twilio call recordings)
  getCallRecordings(restaurantId: string): Promise<schema.CallRecording[]>;
  getCallRecording(id: string): Promise<schema.CallRecording | undefined>;
  createCallRecording(recording: schema.InsertCallRecording): Promise<schema.CallRecording>;
  updateCallRecording(id: string, recording: Partial<schema.InsertCallRecording>): Promise<schema.CallRecording | undefined>;
  deleteCallRecording(id: string): Promise<void>;

  // Branch Features methods (per-branch feature toggles for super admin control)
  getBranchFeatures(restaurantId: string): Promise<schema.BranchFeatures | undefined>;
  getAllBranchFeatures(): Promise<schema.BranchFeatures[]>;
  createBranchFeatures(restaurantId: string): Promise<schema.BranchFeatures>;
  updateBranchFeatures(restaurantId: string, features: Partial<schema.InsertBranchFeatures>): Promise<schema.BranchFeatures | undefined>;

  // Device Brand methods
  getAllDeviceBrands(): Promise<schema.DeviceBrand[]>;
  getDeviceBrand(id: string): Promise<schema.DeviceBrand | undefined>;
  getDeviceBrandBySlug(slug: string): Promise<schema.DeviceBrand | undefined>;
  createDeviceBrand(brand: schema.InsertDeviceBrand): Promise<schema.DeviceBrand>;
  updateDeviceBrand(id: string, brand: Partial<schema.InsertDeviceBrand>): Promise<schema.DeviceBrand | undefined>;
  deleteDeviceBrand(id: string): Promise<void>;

  // Device Customer methods
  getDeviceCustomersByBrand(brandId: string): Promise<schema.DeviceCustomer[]>;
  getDeviceCustomer(id: string): Promise<schema.DeviceCustomer | undefined>;
  getDeviceCustomerByLogin(username: string, brandId: string): Promise<schema.DeviceCustomer | undefined>;
  createDeviceCustomer(customer: schema.InsertDeviceCustomer): Promise<schema.DeviceCustomer>;
  updateDeviceCustomer(id: string, customer: Partial<schema.InsertDeviceCustomer>): Promise<schema.DeviceCustomer | undefined>;
  deleteDeviceCustomer(id: string): Promise<void>;

  // Device methods
  getDevicesByBrand(brandId: string): Promise<schema.Device[]>;
  getDevicesByCustomer(customerId: string): Promise<schema.Device[]>;
  getDevice(id: string): Promise<schema.Device | undefined>;
  getDeviceBySerial(serialNumber: string, brandId: string): Promise<schema.Device | undefined>;
  createDevice(device: schema.InsertDevice): Promise<schema.Device>;
  updateDevice(id: string, device: Partial<schema.InsertDevice>): Promise<schema.Device | undefined>;
  deleteDevice(id: string): Promise<void>;

  // Device Group methods
  getDeviceGroups(brandId: string): Promise<schema.DeviceGroup[]>;
  getDeviceGroupsByCustomer(customerId: string): Promise<schema.DeviceGroup[]>;
  createDeviceGroup(group: schema.InsertDeviceGroup): Promise<schema.DeviceGroup>;
  updateDeviceGroup(id: string, group: Partial<schema.InsertDeviceGroup>): Promise<schema.DeviceGroup | undefined>;
  deleteDeviceGroup(id: string): Promise<void>;

  // Device Schedule methods
  getDeviceSchedules(deviceId: string): Promise<schema.DeviceSchedule[]>;
  createDeviceSchedule(schedule: schema.InsertDeviceSchedule): Promise<schema.DeviceSchedule>;
  updateDeviceSchedule(id: string, schedule: Partial<schema.InsertDeviceSchedule>): Promise<schema.DeviceSchedule | undefined>;
  deleteDeviceSchedule(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  // Restaurant methods
  async getAllRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(schema.restaurants).orderBy(desc(schema.restaurants.createdAt));
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(schema.restaurants).where(eq(schema.restaurants.id, id));
    return restaurant;
  }

  async getRestaurantBySlug(slug: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(schema.restaurants).where(eq(schema.restaurants.slug, slug));
    return restaurant;
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db.insert(schema.restaurants).values(restaurant).returning();
    return newRestaurant;
  }

  async updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updated] = await db.update(schema.restaurants)
      .set(restaurant)
      .where(eq(schema.restaurants.id, id))
      .returning();
    return updated;
  }

  async deleteRestaurant(id: string): Promise<void> {
    // Delete all related data first (cascade delete)
    try {
      // Delete order items first (they reference orders)
      const orders = await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.restaurantId, id));
      for (const order of orders) {
        await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
        await db.delete(schema.orderItemCompletions).where(eq(schema.orderItemCompletions.orderId, order.id));
      }
      
      // Delete orders
      await db.delete(schema.orders).where(eq(schema.orders.restaurantId, id));
      
      // Delete bookings
      await db.delete(schema.bookings).where(eq(schema.bookings.restaurantId, id));
      
      // Delete menu items and their related data
      const menuItems = await db.select({ id: schema.menuItems.id }).from(schema.menuItems).where(eq(schema.menuItems.restaurantId, id));
      for (const item of menuItems) {
        await db.delete(schema.extraToppings).where(eq(schema.extraToppings.menuItemId, item.id));
        await db.delete(schema.menuItemVariants).where(eq(schema.menuItemVariants.menuItemId, item.id));
      }
      await db.delete(schema.menuItems).where(eq(schema.menuItems.restaurantId, id));
      
      // Delete menu categories
      await db.delete(schema.menuCategories).where(eq(schema.menuCategories.restaurantId, id));
      
      // Delete kitchen stations
      await db.delete(schema.kitchenStations).where(eq(schema.kitchenStations.restaurantId, id));
      
      // Delete drivers
      await db.delete(schema.drivers).where(eq(schema.drivers.restaurantId, id));
      
      // Delete waiter tablets and waiters
      await db.delete(schema.waiterTablets).where(eq(schema.waiterTablets.restaurantId, id));
      await db.delete(schema.waiters).where(eq(schema.waiters.restaurantId, id));
      
      // Delete promotions
      await db.delete(schema.promotions).where(eq(schema.promotions.restaurantId, id));
      
      // Delete popular items
      await db.delete(schema.popularItems).where(eq(schema.popularItems.restaurantId, id));
      
      // Delete topping groups and their options
      const toppingGroups = await db.select({ id: schema.toppingGroups.id }).from(schema.toppingGroups).where(eq(schema.toppingGroups.restaurantId, id));
      for (const group of toppingGroups) {
        await db.delete(schema.toppingGroupOptions).where(eq(schema.toppingGroupOptions.groupId, group.id));
      }
      await db.delete(schema.toppingGroups).where(eq(schema.toppingGroups.restaurantId, id));
      
      // Delete suppliers and their data
      const suppliers = await db.select({ id: schema.suppliers.id }).from(schema.suppliers).where(eq(schema.suppliers.restaurantId, id));
      for (const supplier of suppliers) {
        await db.delete(schema.supplierProducts).where(eq(schema.supplierProducts.supplierId, supplier.id));
        const supplierOrders = await db.select({ id: schema.supplierOrders.id }).from(schema.supplierOrders).where(eq(schema.supplierOrders.supplierId, supplier.id));
        for (const order of supplierOrders) {
          await db.delete(schema.supplierOrderItems).where(eq(schema.supplierOrderItems.orderId, order.id));
        }
        await db.delete(schema.supplierOrders).where(eq(schema.supplierOrders.supplierId, supplier.id));
      }
      await db.delete(schema.suppliers).where(eq(schema.suppliers.restaurantId, id));
      
      // Delete branch features
      await db.delete(schema.branchFeatures).where(eq(schema.branchFeatures.restaurantId, id));
      
      // Delete branch snapshots
      await db.delete(schema.branchSnapshots).where(eq(schema.branchSnapshots.restaurantId, id));
      
      // Delete customers (doesn't have cascade delete)
      await db.delete(schema.customers).where(eq(schema.customers.restaurantId, id));
      
      // Delete twilio settings
      try {
        await db.delete(schema.twilioSettings).where(eq(schema.twilioSettings.restaurantId, id));
      } catch (e) { /* Table might not exist */ }
      
      // Finally delete the restaurant
      await db.delete(schema.restaurants).where(eq(schema.restaurants.id, id));
      
      console.log(`Successfully deleted restaurant ${id} and all related data`);
    } catch (error) {
      console.error(`Failed to delete restaurant ${id}:`, error);
      throw error;
    }
  }

  // Menu methods
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    // Branch isolation: restaurantId is MANDATORY to prevent cross-tenant data leaks
    return await db.select().from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, restaurantId))
      .orderBy(desc(schema.menuItems.createdAt));
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    // Admin panel: return all menu items across all branches
    return await db.select().from(schema.menuItems)
      .orderBy(desc(schema.menuItems.createdAt));
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(schema.menuItems).where(eq(schema.menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db.insert(schema.menuItems).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(schema.menuItems)
      .set(item)
      .where(eq(schema.menuItems.id, id))
      .returning();
    return updated;
  }

  async deleteMenuItem(id: string): Promise<void> {
    // CASCADE DELETE: Delete all related data first
    
    // Delete extra toppings for this menu item
    await db.delete(schema.extraToppings).where(eq(schema.extraToppings.menuItemId, id));
    
    // Delete topping group options for this menu item's topping groups
    const toppingGroups = await db.select().from(schema.toppingGroups)
      .where(eq(schema.toppingGroups.menuItemId, id));
    for (const group of toppingGroups) {
      await db.delete(schema.toppingGroupOptions).where(eq(schema.toppingGroupOptions.groupId, group.id));
    }
    
    // Delete topping groups for this menu item
    await db.delete(schema.toppingGroups).where(eq(schema.toppingGroups.menuItemId, id));
    
    // Delete menu item variants
    await db.delete(schema.menuItemVariants).where(eq(schema.menuItemVariants.menuItemId, id));
    
    // Finally delete the menu item itself
    await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));
  }

  // Order methods
  async getAllOrders(restaurantId: string): Promise<(Order & { items: OrderItem[]; delivery?: { driverId: string | null; driverName: string; deliveryStatus: string; driverNotes: string | null } })[]> {
    // Branch isolation: restaurantId is MANDATORY to prevent cross-tenant data leaks
    const orders = await db.select().from(schema.orders)
      .where(eq(schema.orders.restaurantId, restaurantId))
      .orderBy(desc(schema.orders.createdAt));

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
        
        // Get delivery info if exists
        const [deliveryInfo] = await db.select().from(schema.orderDeliveries)
          .where(eq(schema.orderDeliveries.orderId, order.id));
        
        let delivery: { driverId: string | null; driverName: string; deliveryStatus: string; driverNotes: string | null } | undefined = undefined;
        if (deliveryInfo) {
          // Get driver name if driverId exists
          let driverName = 'Unassigned';
          if (deliveryInfo.driverId) {
            const [driver] = await db.select({ name: schema.drivers.name })
              .from(schema.drivers)
              .where(eq(schema.drivers.id, deliveryInfo.driverId));
            driverName = driver?.name || 'Unknown Driver';
          }
          
          delivery = {
            driverId: deliveryInfo.driverId,
            driverName: driverName,
            deliveryStatus: deliveryInfo.deliveryStatus,
            driverNotes: deliveryInfo.driverNotes,
          };
        }
        
        return { ...order, items, delivery };
      })
    );

    return ordersWithItems;
  }

  async getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (!order) return undefined;

    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
    return { ...order, items };
  }

  async createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order & { items: OrderItem[] }> {
    // Get the next order number for this restaurant
    const [result] = await db
      .select({ maxNum: max(schema.orders.orderNumber) })
      .from(schema.orders)
      .where(eq(schema.orders.restaurantId, order.restaurantId));
    
    const nextOrderNumber = (result?.maxNum || 0) + 1;
    
    const [newOrder] = await db.insert(schema.orders).values({
      ...order,
      orderNumber: nextOrderNumber,
    }).returning();
    
    const orderItems = await db.insert(schema.orderItems)
      .values(items.map(item => ({ ...item, orderId: newOrder.id })))
      .returning();

    return { ...newOrder, items: orderItems };
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(schema.orders)
      .set(updates)
      .where(eq(schema.orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderStatus(id: string, status: "new" | "preparing" | "ready" | "completed"): Promise<Order | undefined> {
    // Get the current order to check previous status and get total
    const [currentOrder] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (!currentOrder) return undefined;

    const [updated] = await db.update(schema.orders)
      .set({ status })
      .where(eq(schema.orders.id, id))
      .returning();

    // When order becomes completed, update restaurant's daily totals
    if (status === "completed" && currentOrder.status !== "completed") {
      const [restaurant] = await db.select().from(schema.restaurants)
        .where(eq(schema.restaurants.id, currentOrder.restaurantId));
      
      if (restaurant) {
        const currentRevenue = parseFloat(restaurant.revenueToday || "0");
        const orderTotal = parseFloat(currentOrder.total);
        const newRevenue = (currentRevenue + orderTotal).toFixed(2);
        const newOrdersCount = (restaurant.ordersToday || 0) + 1;

        await db.update(schema.restaurants)
          .set({ 
            revenueToday: newRevenue,
            ordersToday: newOrdersCount
          })
          .where(eq(schema.restaurants.id, currentOrder.restaurantId));
      }
    }

    return updated;
  }

  async deleteOrder(id: string): Promise<void> {
    // Archive the order instead of deleting (keeps accounting totals accurate)
    await db.update(schema.orders)
      .set({ isArchived: true })
      .where(eq(schema.orders.id, id));
  }

  // Booking methods
  async getAllBookings(restaurantId: string): Promise<Booking[]> {
    // Branch isolation: restaurantId is MANDATORY to prevent cross-tenant data leaks
    return await db.select().from(schema.bookings)
      .where(eq(schema.bookings.restaurantId, restaurantId))
      .orderBy(desc(schema.bookings.createdAt));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
    return booking;
  }

  async getBookingsByPhone(phone: string, restaurantId: string): Promise<Booking[]> {
    const bookings = await db.select().from(schema.bookings)
      .where(eq(schema.bookings.restaurantId, restaurantId))
      .orderBy(desc(schema.bookings.createdAt));
    
    return bookings.filter(b => b.phone === phone);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(schema.bookings).values(booking).returning();
    return newBooking;
  }

  async updateBookingStatus(id: string, status: "pending" | "confirmed" | "cancelled"): Promise<Booking | undefined> {
    const [updated] = await db.update(schema.bookings)
      .set({ status })
      .where(eq(schema.bookings.id, id))
      .returning();
    return updated;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await db.delete(schema.bookings)
      .where(eq(schema.bookings.id, id));
    return true;
  }

  async getCustomerVisitHistory(phone: string, restaurantId: string): Promise<BookingWithHistory["visitHistory"]> {
    const bookings = await db.select().from(schema.bookings)
      .where(eq(schema.bookings.restaurantId, restaurantId))
      .orderBy(desc(schema.bookings.createdAt));
    
    return bookings
      .filter(b => b.phone === phone && b.status === 'confirmed')
      .map(b => ({
        date: b.date,
        time: b.time,
        guests: b.guests,
        status: b.status
      }));
  }

  async getAllBookingsWithHistory(restaurantId: string): Promise<BookingWithHistory[]> {
    const bookings = await db.select().from(schema.bookings)
      .where(eq(schema.bookings.restaurantId, restaurantId))
      .orderBy(desc(schema.bookings.createdAt));

    const bookingsWithHistory = await Promise.all(
      bookings.map(async (booking) => {
        const customer = await this.getCustomerByPhone(booking.phone);
        
        const allBookingsForPhone = await db.select().from(schema.bookings)
          .where(eq(schema.bookings.restaurantId, restaurantId))
          .orderBy(desc(schema.bookings.createdAt));
        
        const confirmedVisits = allBookingsForPhone
          .filter(b => b.phone === booking.phone && b.status === 'confirmed' && b.id !== booking.id);
        
        const visitHistory = confirmedVisits.map(b => ({
          date: b.date,
          time: b.time,
          guests: b.guests,
          status: b.status
        }));

        return {
          ...booking,
          customer: customer || null,
          visitHistory,
          totalVisits: confirmedVisits.length
        };
      })
    );

    return bookingsWithHistory;
  }

  async createBookingWithCustomer(booking: InsertBooking): Promise<BookingWithHistory> {
    let customer = await this.getCustomerByPhone(booking.phone);
    
    if (!customer) {
      customer = await this.createCustomer({
        phone: booking.phone,
        name: booking.customerName,
        email: booking.email,
        address: booking.address || undefined,
      });
    } else {
      if (booking.customerName && !customer.name) {
        customer = await this.updateCustomer(customer.id, { name: booking.customerName }) || customer;
      }
      if (booking.email && !customer.email) {
        customer = await this.updateCustomer(customer.id, { email: booking.email }) || customer;
      }
      if (booking.address && !customer.address) {
        customer = await this.updateCustomer(customer.id, { address: booking.address }) || customer;
      }
    }

    const bookingWithCustomerId = {
      ...booking,
      customerId: customer.id
    };

    const [newBooking] = await db.insert(schema.bookings).values(bookingWithCustomerId).returning();
    
    const visitHistory = await this.getCustomerVisitHistory(booking.phone, booking.restaurantId);

    return {
      ...newBooking,
      customer,
      visitHistory,
      totalVisits: visitHistory.length
    };
  }

  async getPendingBookingCounts(): Promise<Record<string, number>> {
    const pendingBookings = await db.select({
      restaurantId: schema.bookings.restaurantId,
    }).from(schema.bookings)
      .where(eq(schema.bookings.status, 'pending'));
    
    const counts: Record<string, number> = {};
    for (const booking of pendingBookings) {
      counts[booking.restaurantId] = (counts[booking.restaurantId] || 0) + 1;
    }
    return counts;
  }

  // Gallery methods
  async getGalleryImages(restaurantId: string): Promise<GalleryImage[]> {
    return await db.select().from(schema.galleryImages)
      .where(eq(schema.galleryImages.restaurantId, restaurantId))
      .orderBy(schema.galleryImages.sortOrder);
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const [newImage] = await db.insert(schema.galleryImages).values(image).returning();
    return newImage;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    await db.delete(schema.galleryImages).where(eq(schema.galleryImages.id, id));
  }

  // Menu Modifier methods
  async getMenuModifiers(menuItemId: string): Promise<MenuModifier[]> {
    return await db.select().from(schema.menuModifiers)
      .where(eq(schema.menuModifiers.menuItemId, menuItemId))
      .orderBy(schema.menuModifiers.name);
  }

  async createMenuModifier(modifier: InsertMenuModifier): Promise<MenuModifier> {
    const [newModifier] = await db.insert(schema.menuModifiers).values(modifier).returning();
    return newModifier;
  }

  async updateMenuModifier(id: string, modifier: Partial<InsertMenuModifier>): Promise<MenuModifier | undefined> {
    const [updated] = await db.update(schema.menuModifiers)
      .set(modifier)
      .where(eq(schema.menuModifiers.id, id))
      .returning();
    return updated;
  }

  async deleteMenuModifier(id: string): Promise<void> {
    await db.delete(schema.menuModifiers).where(eq(schema.menuModifiers.id, id));
  }

  async deleteMenuModifiersByMenuItem(menuItemId: string): Promise<void> {
    await db.delete(schema.menuModifiers).where(eq(schema.menuModifiers.menuItemId, menuItemId));
  }

  // Menu Item Variant methods
  async getMenuItemVariants(menuItemId: string): Promise<MenuItemVariant[]> {
    return await db.select().from(schema.menuItemVariants)
      .where(eq(schema.menuItemVariants.menuItemId, menuItemId))
      .orderBy(schema.menuItemVariants.sortOrder);
  }

  async createMenuItemVariant(variant: InsertMenuItemVariant): Promise<MenuItemVariant> {
    const [newVariant] = await db.insert(schema.menuItemVariants).values(variant).returning();
    return newVariant;
  }

  async updateMenuItemVariant(id: string, variant: Partial<InsertMenuItemVariant>): Promise<MenuItemVariant | undefined> {
    const [updated] = await db.update(schema.menuItemVariants)
      .set(variant)
      .where(eq(schema.menuItemVariants.id, id))
      .returning();
    return updated;
  }

  async deleteMenuItemVariant(id: string): Promise<void> {
    await db.delete(schema.menuItemVariants).where(eq(schema.menuItemVariants.id, id));
  }

  async deleteMenuItemVariantsByMenuItem(menuItemId: string): Promise<void> {
    await db.delete(schema.menuItemVariants).where(eq(schema.menuItemVariants.menuItemId, menuItemId));
  }

  async getMenuItemsWithVariants(restaurantId: string): Promise<MenuItemWithVariants[]> {
    const items = await db.select().from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, restaurantId))
      .orderBy(desc(schema.menuItems.createdAt));
    
    const itemsWithVariants = await Promise.all(
      items.map(async (item) => {
        const variants = await db.select().from(schema.menuItemVariants)
          .where(eq(schema.menuItemVariants.menuItemId, item.id))
          .orderBy(schema.menuItemVariants.sortOrder);
        return { ...item, variants };
      })
    );
    
    return itemsWithVariants;
  }

  // Customer methods
  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.phone, phone));
    return customer;
  }

  async getCustomerByPhoneAndRestaurant(phone: string, restaurantId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(schema.customers)
      .where(and(eq(schema.customers.phone, phone), eq(schema.customers.restaurantId, restaurantId)));
    return customer;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(schema.customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(schema.customers)
      .set(customer)
      .where(eq(schema.customers.id, id))
      .returning();
    return updated;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
  }

  async getCustomersWithOrderCount(): Promise<(Customer & { orderCount: number })[]> {
    const customers = await db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
    
    const customerMap = new Map<string, Customer & { orderCount: number }>();
    
    for (const customer of customers) {
      const normalizedPhone = customer.phone.replace(/\D/g, '').slice(-10);
      
      if (!customerMap.has(normalizedPhone)) {
        const orderCount = await db.select({ count: sql<number>`count(*)::int` })
          .from(schema.orders)
          .where(eq(schema.orders.customerId, customer.id));
        
        customerMap.set(normalizedPhone, {
          ...customer,
          orderCount: orderCount[0]?.count || 0
        });
      }
    }
    
    return Array.from(customerMap.values());
  }

  async getCustomersByRestaurant(restaurantId: string): Promise<(Customer & { orderCount: number })[]> {
    const customers = await db.select().from(schema.customers)
      .where(eq(schema.customers.restaurantId, restaurantId))
      .orderBy(desc(schema.customers.createdAt));
    
    const customerMap = new Map<string, Customer & { orderCount: number }>();
    
    for (const customer of customers) {
      const normalizedPhone = customer.phone.replace(/\D/g, '').slice(-10);
      
      if (!customerMap.has(normalizedPhone)) {
        const orderCount = await db.select({ count: sql<number>`count(*)::int` })
          .from(schema.orders)
          .where(eq(schema.orders.customerId, customer.id));
        
        customerMap.set(normalizedPhone, {
          ...customer,
          orderCount: orderCount[0]?.count || 0
        });
      }
    }
    
    return Array.from(customerMap.values());
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(schema.customers).where(eq(schema.customers.id, id));
  }

  async getCustomerOrders(customerId: string): Promise<(Order & { items: OrderItem[] })[]> {
    const orders = await db.select().from(schema.orders)
      .where(eq(schema.orders.customerId, customerId))
      .orderBy(desc(schema.orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, order.id));
        return { ...order, items };
      })
    );
    
    return ordersWithItems;
  }

  // Promotion methods
  async getPromotion(restaurantId: string): Promise<Promotion | undefined> {
    const [promotion] = await db.select().from(schema.promotions)
      .where(eq(schema.promotions.restaurantId, restaurantId));
    return promotion;
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const [newPromotion] = await db.insert(schema.promotions).values(promotion).returning();
    return newPromotion;
  }

  async updatePromotion(id: string, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const [updated] = await db.update(schema.promotions)
      .set(promotion)
      .where(eq(schema.promotions.id, id))
      .returning();
    return updated;
  }

  async deletePromotion(id: string): Promise<void> {
    await db.delete(schema.promotions).where(eq(schema.promotions.id, id));
  }

  // Hero Image methods
  async getHeroImages(restaurantId: string): Promise<HeroImage[]> {
    return await db.select().from(schema.restaurantHeroImages)
      .where(eq(schema.restaurantHeroImages.restaurantId, restaurantId))
      .orderBy(schema.restaurantHeroImages.sortOrder);
  }

  async createHeroImage(image: InsertHeroImage): Promise<HeroImage> {
    const [newImage] = await db.insert(schema.restaurantHeroImages).values(image).returning();
    return newImage;
  }

  async updateHeroImage(id: string, image: Partial<InsertHeroImage>): Promise<HeroImage | undefined> {
    const [updated] = await db.update(schema.restaurantHeroImages)
      .set(image)
      .where(eq(schema.restaurantHeroImages.id, id))
      .returning();
    return updated;
  }

  async deleteHeroImage(id: string): Promise<void> {
    await db.delete(schema.restaurantHeroImages).where(eq(schema.restaurantHeroImages.id, id));
  }

  async reorderHeroImages(restaurantId: string, imageIds: string[]): Promise<void> {
    await Promise.all(
      imageIds.map((id, index) => 
        db.update(schema.restaurantHeroImages)
          .set({ sortOrder: index })
          .where(eq(schema.restaurantHeroImages.id, id))
      )
    );
  }

  // Dashboard Settings methods
  async getDashboardSettings(restaurantId: string): Promise<DashboardSettings | undefined> {
    const [settings] = await db.select().from(schema.restaurantDashboardSettings)
      .where(eq(schema.restaurantDashboardSettings.restaurantId, restaurantId));
    return settings;
  }

  async createDashboardSettings(settings: InsertDashboardSettings): Promise<DashboardSettings> {
    const [newSettings] = await db.insert(schema.restaurantDashboardSettings).values(settings).returning();
    return newSettings;
  }

  async updateDashboardSettings(restaurantId: string, settings: Partial<InsertDashboardSettings>): Promise<DashboardSettings | undefined> {
    const [updated] = await db.update(schema.restaurantDashboardSettings)
      .set(settings)
      .where(eq(schema.restaurantDashboardSettings.restaurantId, restaurantId))
      .returning();
    return updated;
  }

  // Driver methods
  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(schema.drivers).orderBy(desc(schema.drivers.createdAt));
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(schema.drivers).where(eq(schema.drivers.id, id));
    return driver;
  }

  async getDriverByPhone(phone: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(schema.drivers).where(eq(schema.drivers.phone, phone));
    return driver;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(driver.password, SALT_ROUNDS);
    const [newDriver] = await db.insert(schema.drivers).values({
      ...driver,
      password: hashedPassword
    }).returning();
    return newDriver;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined> {
    // Hash password if it's being updated
    const updateData = { ...driver };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    }
    const [updated] = await db.update(schema.drivers)
      .set(updateData)
      .where(eq(schema.drivers.id, id))
      .returning();
    return updated;
  }

  async verifyDriverPassword(driver: Driver, password: string): Promise<boolean> {
    return bcrypt.compare(password, driver.password);
  }

  async deleteDriver(id: string): Promise<void> {
    await db.delete(schema.drivers).where(eq(schema.drivers.id, id));
  }

  async updateDriverLocation(id: string, lat: string, lng: string): Promise<Driver | undefined> {
    const [updated] = await db.update(schema.drivers)
      .set({ 
        lastLocationLat: lat, 
        lastLocationLng: lng, 
        lastSeen: new Date() 
      })
      .where(eq(schema.drivers.id, id))
      .returning();
    return updated;
  }

  async updateDriverOnDuty(id: string, isOnDuty: boolean): Promise<Driver | undefined> {
    const now = new Date();
    const updateData: any = { 
      isOnDuty, 
      lastSeen: now 
    };
    
    if (isOnDuty) {
      updateData.shiftStartTime = now;
      updateData.shiftEndTime = null;
    } else {
      updateData.shiftEndTime = now;
    }
    
    const [updated] = await db.update(schema.drivers)
      .set(updateData)
      .where(eq(schema.drivers.id, id))
      .returning();
    return updated;
  }

  // Get drivers belonging to a specific restaurant
  async getDriversByRestaurant(restaurantId: string): Promise<Driver[]> {
    return await db.select().from(schema.drivers)
      .where(eq(schema.drivers.restaurantId, restaurantId))
      .orderBy(desc(schema.drivers.createdAt));
  }

  // Get the restaurant a driver belongs to
  async getDriverRestaurant(driverId: string): Promise<Restaurant | undefined> {
    const driver = await this.getDriver(driverId);
    if (!driver || !driver.restaurantId) return undefined;
    return await this.getRestaurant(driver.restaurantId);
  }

  // Driver Location Tracking methods
  async saveDriverLocationHistory(
    driverId: string, 
    orderId: string | null, 
    lat: string, 
    lng: string, 
    speed?: string, 
    heading?: string, 
    accuracy?: string
  ): Promise<DriverLocation> {
    const [location] = await db.insert(schema.driverLocationUpdates).values({
      driverId,
      orderId,
      latitude: lat,
      longitude: lng,
      speed: speed || null,
      heading: heading || null,
      accuracy: accuracy || null,
    }).returning();
    return location;
  }

  async getLatestDriverLocation(driverId: string): Promise<DriverLocation | undefined> {
    const [location] = await db.select()
      .from(schema.driverLocationUpdates)
      .where(eq(schema.driverLocationUpdates.driverId, driverId))
      .orderBy(desc(schema.driverLocationUpdates.recordedAt))
      .limit(1);
    return location;
  }

  async getDriverLocationForOrder(orderId: string): Promise<DriverLocation | undefined> {
    const [location] = await db.select()
      .from(schema.driverLocationUpdates)
      .where(eq(schema.driverLocationUpdates.orderId, orderId))
      .orderBy(desc(schema.driverLocationUpdates.recordedAt))
      .limit(1);
    return location;
  }

  // Order Delivery methods
  async getOrderDelivery(orderId: string): Promise<OrderDelivery | undefined> {
    const [delivery] = await db.select().from(schema.orderDeliveries)
      .where(eq(schema.orderDeliveries.orderId, orderId));
    return delivery;
  }

  async createOrderDelivery(delivery: InsertOrderDelivery): Promise<OrderDelivery> {
    const [newDelivery] = await db.insert(schema.orderDeliveries).values(delivery).returning();
    return newDelivery;
  }

  async updateOrderDelivery(orderId: string, delivery: Partial<InsertOrderDelivery>): Promise<OrderDelivery | undefined> {
    const [updated] = await db.update(schema.orderDeliveries)
      .set(delivery)
      .where(eq(schema.orderDeliveries.orderId, orderId))
      .returning();
    return updated;
  }

  async assignDriverToOrder(orderId: string, driverId: string | null): Promise<OrderDelivery | undefined> {
    let delivery = await this.getOrderDelivery(orderId);
    
    // Handle broadcast case (no specific driver yet)
    const isBroadcast = driverId === null || driverId === 'pending';
    
    if (!delivery) {
      delivery = await this.createOrderDelivery({
        orderId,
        driverId: isBroadcast ? null : driverId,
        deliveryStatus: isBroadcast ? 'unassigned' : 'assigned',
        assignedAt: isBroadcast ? null : new Date(),
      });
      return delivery;
    }
    
    const [updated] = await db.update(schema.orderDeliveries)
      .set({ 
        driverId: isBroadcast ? null : driverId, 
        deliveryStatus: isBroadcast ? 'unassigned' : 'assigned', 
        assignedAt: isBroadcast ? null : new Date() 
      })
      .where(eq(schema.orderDeliveries.orderId, orderId))
      .returning();
    return updated;
  }

  async getDriverActiveDeliveries(driverId: string): Promise<(OrderDelivery & { order: Order & { items: OrderItem[] }; restaurant: { name: string; address?: string | null } })[]> {
    const deliveries = await db.select().from(schema.orderDeliveries)
      .where(eq(schema.orderDeliveries.driverId, driverId));
    
    const activeDeliveries = deliveries.filter(d => 
      ['assigned', 'accepted', 'picked_up', 'delivering'].includes(d.deliveryStatus)
    );
    
    const result = await Promise.all(
      activeDeliveries.map(async (delivery) => {
        const order = await this.getOrder(delivery.orderId);
        if (!order) return null;
        
        const [restaurant] = await db.select({
          name: schema.restaurants.name,
          address: schema.restaurants.address,
        }).from(schema.restaurants)
          .where(eq(schema.restaurants.id, order.restaurantId));
        
        return { 
          ...delivery, 
          order, 
          restaurant: restaurant || { name: 'Unknown Restaurant' }
        };
      })
    );
    
    return result.filter((d): d is NonNullable<typeof d> => d !== null);
  }

  async getDriverDeliveryHistory(driverId: string): Promise<(OrderDelivery & { order: Order })[]> {
    const deliveries = await db.select().from(schema.orderDeliveries)
      .where(eq(schema.orderDeliveries.driverId, driverId));
    
    const completedDeliveries = deliveries.filter(d => 
      ['completed', 'rejected'].includes(d.deliveryStatus)
    );
    
    const result = await Promise.all(
      completedDeliveries.map(async (delivery) => {
        const [order] = await db.select().from(schema.orders)
          .where(eq(schema.orders.id, delivery.orderId));
        return { ...delivery, order: order! };
      })
    );
    
    return result.filter(d => d.order);
  }

  async duplicateRestaurant(
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
    // Get source restaurant
    const [sourceRestaurant] = await db.select().from(schema.restaurants)
      .where(eq(schema.restaurants.id, sourceId));
    
    if (!sourceRestaurant) {
      throw new Error("Source restaurant not found");
    }

    // Check if slug already exists
    const [existingSlug] = await db.select().from(schema.restaurants)
      .where(eq(schema.restaurants.slug, overrides.slug));
    
    if (existingSlug) {
      throw new Error("Slug already exists. Please choose a different URL slug.");
    }

    // Create new restaurant with source data + overrides
    const [newRestaurant] = await db.insert(schema.restaurants).values({
      name: overrides.name,
      slug: overrides.slug,
      address: overrides.address || sourceRestaurant.address,
      phone: overrides.phone || sourceRestaurant.phone,
      email: overrides.email || (sourceRestaurant as any).email,
      status: "open",
      rating: overrides.rating || sourceRestaurant.rating,
      ordersToday: 0,
      revenueToday: "0.00",
      lastOrderTime: "Never",
      googleMapsUrl: sourceRestaurant.googleMapsUrl,
      stripeAccountId: overrides.stripeAccountId || null,
      loginUsername: overrides.loginUsername || null,
      loginPassword: overrides.loginPassword || null,
      logoUrl: overrides.logoUrl || sourceRestaurant.logoUrl,
      welcomeImageUrl: sourceRestaurant.welcomeImageUrl,
      themeKey: overrides.themeKey || sourceRestaurant.themeKey,
      heroAnimationStyle: sourceRestaurant.heroAnimationStyle,
      heroSlideInterval: sourceRestaurant.heroSlideInterval,
      heroGradientStart: sourceRestaurant.heroGradientStart,
      heroGradientMiddle: sourceRestaurant.heroGradientMiddle,
      heroGradientEnd: sourceRestaurant.heroGradientEnd,
      deliveryHoursMonThu: sourceRestaurant.deliveryHoursMonThu || "11AM - 10:30PM",
      deliveryHoursFriSat: sourceRestaurant.deliveryHoursFriSat || "11AM - 11PM",
      deliveryHoursSun: sourceRestaurant.deliveryHoursSun || "12PM - 10PM",
      collectionHoursMonThu: sourceRestaurant.collectionHoursMonThu || "11AM - 10:30PM",
      collectionHoursFriSat: sourceRestaurant.collectionHoursFriSat || "11AM - 11PM",
      collectionHoursSun: sourceRestaurant.collectionHoursSun || "12PM - 10PM",
      acceptingOrders: false,
      tawaHeroImage: sourceRestaurant.tawaHeroImage,
      tawaHeroVideo: sourceRestaurant.tawaHeroVideo,
      // Copy currency and regional settings
      currency: sourceRestaurant.currency,
      // Copy Pakistani payment methods
      easypaisaAccountNumber: sourceRestaurant.easypaisaAccountNumber,
      easypaisaAccountName: sourceRestaurant.easypaisaAccountName,
      jazzcashAccountNumber: sourceRestaurant.jazzcashAccountNumber,
      jazzcashAccountName: sourceRestaurant.jazzcashAccountName,
      hblAccountNumber: sourceRestaurant.hblAccountNumber,
      hblAccountName: sourceRestaurant.hblAccountName,
      hblIban: sourceRestaurant.hblIban,
      ublAccountNumber: sourceRestaurant.ublAccountNumber,
      ublAccountName: sourceRestaurant.ublAccountName,
      ublIban: sourceRestaurant.ublIban,
      // Copy fee settings
      vatPercent: sourceRestaurant.vatPercent,
      vatEnabled: sourceRestaurant.vatEnabled,
      serviceFeePercent: sourceRestaurant.serviceFeePercent,
      serviceFeeEnabled: sourceRestaurant.serviceFeeEnabled,
      deliveryFee: sourceRestaurant.deliveryFee,
      deliveryFeeEnabled: sourceRestaurant.deliveryFeeEnabled,
      freeDeliveryMinimum: sourceRestaurant.freeDeliveryMinimum,
      freeDeliveryEnabled: sourceRestaurant.freeDeliveryEnabled,
      cutleryOptionEnabled: sourceRestaurant.cutleryOptionEnabled,
      // Copy collection discount settings
      collectionDiscountPercent: sourceRestaurant.collectionDiscountPercent,
      collectionDiscountMinimum: sourceRestaurant.collectionDiscountMinimum,
      // Copy branding settings (NOTE: use 'as any' since these are new fields)
      tagline: overrides.tagline || (sourceRestaurant as any).tagline,
      cuisineType: overrides.cuisineType || (sourceRestaurant as any).cuisineType,
    }).returning();

    // STEP 1: Duplicate menu categories FIRST and track old->new ID mapping
    const sourceCategories = await db.select().from(schema.menuCategories)
      .where(eq(schema.menuCategories.restaurantId, sourceId));
    
    const categoryIdMap = new Map<string, string>();
    
    for (const cat of sourceCategories) {
      const [newCat] = await db.insert(schema.menuCategories).values({
        restaurantId: newRestaurant.id,
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        imageUrl: cat.imageUrl,
        videoUrl: cat.videoUrl,
        gifUrl: cat.gifUrl,
        description: cat.description,
        sortOrder: cat.sortOrder,
      }).returning();
      
      categoryIdMap.set(cat.id, newCat.id);
    }

    // STEP 2: Duplicate menu items and track old->new ID mapping (using remapped category IDs)
    const sourceMenuItems = await db.select().from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, sourceId));
    
    const menuItemIdMap = new Map<string, string>();
    
    for (const item of sourceMenuItems) {
      // Map old category ID to new category ID
      const newCategoryId = item.category ? categoryIdMap.get(item.category) || item.category : item.category;
      
      const [newItem] = await db.insert(schema.menuItems).values({
        restaurantId: newRestaurant.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: newCategoryId,
        image: item.image,
        videoUrl: item.videoUrl,
        gifUrl: item.gifUrl,
        available: item.available,
        allergenProfile: item.allergenProfile,
      }).returning();
      
      menuItemIdMap.set(item.id, newItem.id);
    }

    // Duplicate menu modifiers with remapped menuItemId
    for (const [oldMenuItemId, newMenuItemId] of Array.from(menuItemIdMap.entries())) {
      const modifiers = await db.select().from(schema.menuModifiers)
        .where(eq(schema.menuModifiers.menuItemId, oldMenuItemId));
      
      for (const modifier of modifiers) {
        await db.insert(schema.menuModifiers).values({
          menuItemId: newMenuItemId,
          name: modifier.name,
          price: modifier.price,
          available: modifier.available,
        });
      }
    }

    // Duplicate hero images
    const heroImages = await db.select().from(schema.restaurantHeroImages)
      .where(eq(schema.restaurantHeroImages.restaurantId, sourceId));
    
    for (const image of heroImages) {
      await db.insert(schema.restaurantHeroImages).values({
        restaurantId: newRestaurant.id,
        imageUrl: image.imageUrl,
        label: image.label,
        sortOrder: image.sortOrder,
        isActive: image.isActive,
      });
    }

    // Duplicate gallery images
    const galleryImages = await db.select().from(schema.galleryImages)
      .where(eq(schema.galleryImages.restaurantId, sourceId));
    
    for (const image of galleryImages) {
      await db.insert(schema.galleryImages).values({
        restaurantId: newRestaurant.id,
        imageUrl: image.imageUrl,
        title: image.title,
        sortOrder: image.sortOrder,
      });
    }

    // Duplicate promotions
    const promotions = await db.select().from(schema.promotions)
      .where(eq(schema.promotions.restaurantId, sourceId));
    
    for (const promo of promotions) {
      await db.insert(schema.promotions).values({
        restaurantId: newRestaurant.id,
        headline: promo.headline,
        subtext: promo.subtext,
        isActive: promo.isActive,
        backgroundColor: promo.backgroundColor,
        textColor: promo.textColor,
      });
    }

    // Duplicate dashboard settings (always create, with defaults if source has none)
    const [dashboardSettings] = await db.select().from(schema.restaurantDashboardSettings)
      .where(eq(schema.restaurantDashboardSettings.restaurantId, sourceId));
    
    await db.insert(schema.restaurantDashboardSettings).values({
      restaurantId: newRestaurant.id,
      promotionsEnabled: dashboardSettings?.promotionsEnabled ?? true,
      brandingEnabled: dashboardSettings?.brandingEnabled ?? true,
      hoursEnabled: dashboardSettings?.hoursEnabled ?? true,
      heroGalleryEnabled: dashboardSettings?.heroGalleryEnabled ?? true,
    });

    // NOTE: Drivers are NOT copied - each branch must set up their own drivers
    // This ensures complete branch isolation for staff management

    // Duplicate extra toppings
    const sourceToppings = await db.select().from(schema.extraToppings)
      .where(eq(schema.extraToppings.restaurantId, sourceId));
    
    for (const topping of sourceToppings) {
      // Remap menuItemId if it exists
      const newMenuItemId = topping.menuItemId ? menuItemIdMap.get(topping.menuItemId) : null;
      await db.insert(schema.extraToppings).values({
        restaurantId: newRestaurant.id,
        menuItemId: newMenuItemId,
        name: topping.name,
        price: topping.price,
        image: topping.image,
        isActive: topping.isActive,
        sortOrder: topping.sortOrder,
      });
    }

    // Duplicate popular items
    const popularItems = await db.select().from(schema.popularItems)
      .where(eq(schema.popularItems.restaurantId, sourceId));
    
    for (const item of popularItems) {
      await db.insert(schema.popularItems).values({
        restaurantId: newRestaurant.id,
        name: item.name,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        linkUrl: item.linkUrl,
      });
    }

    // Categories already duplicated at the start (before menu items) to enable proper ID mapping

    // Duplicate topping groups and their options (for each menu item)
    for (const [oldMenuItemId, newMenuItemId] of Array.from(menuItemIdMap.entries())) {
      const toppingGroups = await db.select().from(schema.toppingGroups)
        .where(eq(schema.toppingGroups.menuItemId, oldMenuItemId));
      
      for (const group of toppingGroups) {
        const [newGroup] = await db.insert(schema.toppingGroups).values({
          restaurantId: newRestaurant.id,
          menuItemId: newMenuItemId,
          headline: group.headline,
          isRequired: group.isRequired,
          maxSelections: group.maxSelections,
          allowQuantity: group.allowQuantity,
          maxQuantityPerOption: group.maxQuantityPerOption,
          sortOrder: group.sortOrder,
        }).returning();
        
        // Duplicate options for this group
        const options = await db.select().from(schema.toppingGroupOptions)
          .where(eq(schema.toppingGroupOptions.groupId, group.id));
        
        for (const option of options) {
          await db.insert(schema.toppingGroupOptions).values({
            groupId: newGroup.id,
            name: option.name,
            price: option.price,
            image: option.image,
            isDefault: option.isDefault,
            isAvailable: option.isAvailable,
            sortOrder: option.sortOrder,
          });
        }
      }
    }

    // Duplicate menu item variants (size options)
    for (const [oldMenuItemId, newMenuItemId] of Array.from(menuItemIdMap.entries())) {
      const variants = await db.select().from(schema.menuItemVariants)
        .where(eq(schema.menuItemVariants.menuItemId, oldMenuItemId));
      
      for (const variant of variants) {
        await db.insert(schema.menuItemVariants).values({
          menuItemId: newMenuItemId,
          name: variant.name,
          price: variant.price,
          sortOrder: variant.sortOrder,
          available: variant.available,
        });
      }
    }

    // Copy branch features from source (or create with defaults if source has none)
    const [sourceBranchFeatures] = await db.select().from(schema.branchFeatures)
      .where(eq(schema.branchFeatures.restaurantId, sourceId));
    
    await db.insert(schema.branchFeatures).values({
      restaurantId: newRestaurant.id,
      // Core Features
      onlineOrdering: sourceBranchFeatures?.onlineOrdering ?? true,
      tableBooking: sourceBranchFeatures?.tableBooking ?? true,
      deliveryTracking: sourceBranchFeatures?.deliveryTracking ?? true,
      dineInOrdering: sourceBranchFeatures?.dineInOrdering ?? true,
      // Staff Systems
      kitchenDisplay: sourceBranchFeatures?.kitchenDisplay ?? true,
      eposSystem: sourceBranchFeatures?.eposSystem ?? true,
      waiterApp: sourceBranchFeatures?.waiterApp ?? false,
      driverApp: sourceBranchFeatures?.driverApp ?? true,
      // Advanced Features
      supplierOrdering: sourceBranchFeatures?.supplierOrdering ?? false,
      telephoneOrdering: sourceBranchFeatures?.telephoneOrdering ?? false,
      loyaltyProgram: sourceBranchFeatures?.loyaltyProgram ?? false,
      promotions: sourceBranchFeatures?.promotions ?? true,
      allergenManagement: sourceBranchFeatures?.allergenManagement ?? true,
      // Extras
      liveChat: sourceBranchFeatures?.liveChat ?? false,
      reviewsWidget: sourceBranchFeatures?.reviewsWidget ?? false,
      multiLanguage: sourceBranchFeatures?.multiLanguage ?? false,
    });

    // Copy kitchen stations if any exist
    const sourceStations = await db.select().from(schema.kitchenStations)
      .where(eq(schema.kitchenStations.restaurantId, sourceId));
    
    for (const station of sourceStations) {
      // Remap category IDs if they exist
      const newCategories = station.categories?.map((oldCatId: string) => 
        categoryIdMap.get(oldCatId) || oldCatId
      );
      
      await db.insert(schema.kitchenStations).values({
        restaurantId: newRestaurant.id,
        name: station.name,
        slug: station.slug,
        color: station.color,
        categories: newCategories,
        displayOrder: station.displayOrder,
        isActive: station.isActive,
      });
    }

    return newRestaurant;
  }

  // Popular Items methods
  async getPopularItems(restaurantId: string): Promise<any[]> {
    return db.select().from(schema.popularItems)
      .where(eq(schema.popularItems.restaurantId, restaurantId))
      .orderBy(schema.popularItems.sortOrder);
  }

  async createPopularItem(data: { restaurantId: string; name: string; imageUrl: string; sortOrder?: number; linkUrl?: string | null }): Promise<any> {
    const [item] = await db.insert(schema.popularItems).values({
      restaurantId: data.restaurantId,
      name: data.name,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
      linkUrl: data.linkUrl || null,
    }).returning();
    return item;
  }

  async updatePopularItem(id: string, data: { name?: string; imageUrl?: string; sortOrder?: number; isActive?: boolean; linkUrl?: string | null }): Promise<any | null> {
    const [item] = await db.update(schema.popularItems)
      .set(data)
      .where(eq(schema.popularItems.id, id))
      .returning();
    return item || null;
  }

  async deletePopularItem(id: string): Promise<void> {
    await db.delete(schema.popularItems).where(eq(schema.popularItems.id, id));
  }

  // Extra Toppings methods
  async getExtraToppings(restaurantId: string): Promise<ExtraTopping[]> {
    return db.select().from(schema.extraToppings)
      .where(and(
        eq(schema.extraToppings.restaurantId, restaurantId),
        eq(schema.extraToppings.isActive, true)
      ))
      .orderBy(schema.extraToppings.sortOrder);
  }

  async createExtraTopping(topping: InsertExtraTopping): Promise<ExtraTopping> {
    const [newTopping] = await db.insert(schema.extraToppings).values(topping).returning();
    return newTopping;
  }

  async updateExtraTopping(id: string, topping: Partial<InsertExtraTopping>): Promise<ExtraTopping | undefined> {
    const [updated] = await db.update(schema.extraToppings)
      .set(topping)
      .where(eq(schema.extraToppings.id, id))
      .returning();
    return updated;
  }

  async deleteExtraTopping(id: string): Promise<void> {
    await db.delete(schema.extraToppings).where(eq(schema.extraToppings.id, id));
  }

  // Topping Groups methods
  async getToppingGroups(menuItemId: string): Promise<ToppingGroupWithOptions[]> {
    const groups = await db.select().from(schema.toppingGroups)
      .where(eq(schema.toppingGroups.menuItemId, menuItemId))
      .orderBy(schema.toppingGroups.sortOrder);
    
    const result: ToppingGroupWithOptions[] = [];
    for (const group of groups) {
      const options = await db.select().from(schema.toppingGroupOptions)
        .where(eq(schema.toppingGroupOptions.groupId, group.id))
        .orderBy(schema.toppingGroupOptions.sortOrder);
      result.push({ ...group, options });
    }
    return result;
  }

  async getToppingGroupsByRestaurant(restaurantId: string): Promise<ToppingGroupWithOptions[]> {
    const groups = await db.select().from(schema.toppingGroups)
      .where(eq(schema.toppingGroups.restaurantId, restaurantId))
      .orderBy(schema.toppingGroups.sortOrder);
    
    const result: ToppingGroupWithOptions[] = [];
    for (const group of groups) {
      const options = await db.select().from(schema.toppingGroupOptions)
        .where(eq(schema.toppingGroupOptions.groupId, group.id))
        .orderBy(schema.toppingGroupOptions.sortOrder);
      result.push({ ...group, options });
    }
    return result;
  }

  async createToppingGroup(group: InsertToppingGroup): Promise<ToppingGroup> {
    const [newGroup] = await db.insert(schema.toppingGroups).values(group).returning();
    return newGroup;
  }

  async updateToppingGroup(id: string, group: Partial<InsertToppingGroup>): Promise<ToppingGroup | undefined> {
    const [updated] = await db.update(schema.toppingGroups)
      .set(group)
      .where(eq(schema.toppingGroups.id, id))
      .returning();
    return updated;
  }

  async deleteToppingGroup(id: string): Promise<void> {
    await db.delete(schema.toppingGroups).where(eq(schema.toppingGroups.id, id));
  }

  async createToppingGroupOption(option: InsertToppingGroupOption): Promise<ToppingGroupOption> {
    const [newOption] = await db.insert(schema.toppingGroupOptions).values(option).returning();
    return newOption;
  }

  async updateToppingGroupOption(id: string, option: Partial<InsertToppingGroupOption>): Promise<ToppingGroupOption | undefined> {
    const [updated] = await db.update(schema.toppingGroupOptions)
      .set(option)
      .where(eq(schema.toppingGroupOptions.id, id))
      .returning();
    return updated;
  }

  async deleteToppingGroupOption(id: string): Promise<void> {
    await db.delete(schema.toppingGroupOptions).where(eq(schema.toppingGroupOptions.id, id));
  }

  async syncToppingOptionAvailabilityByName(restaurantId: string, optionName: string, isAvailable: boolean): Promise<number> {
    const groups = await db.select({ id: schema.toppingGroups.id })
      .from(schema.toppingGroups)
      .where(eq(schema.toppingGroups.restaurantId, restaurantId));
    
    const groupIds = groups.map(g => g.id);
    if (groupIds.length === 0) return 0;
    
    const result = await db.update(schema.toppingGroupOptions)
      .set({ isAvailable })
      .where(and(
        inArray(schema.toppingGroupOptions.groupId, groupIds),
        eq(schema.toppingGroupOptions.name, optionName)
      ))
      .returning();
    
    return result.length;
  }

  // Driver earnings and payment methods
  async getDriverById(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(schema.drivers).where(eq(schema.drivers.id, id));
    return driver;
  }

  async getDriverCompletedDeliveries(driverId: string): Promise<{ orderNumber: number; deliveredAt: Date | null }[]> {
    const deliveries = await db.select({
      orderNumber: schema.orders.orderNumber,
      deliveredAt: schema.orderDeliveries.deliveredAt,
    })
      .from(schema.orderDeliveries)
      .innerJoin(schema.orders, eq(schema.orderDeliveries.orderId, schema.orders.id))
      .where(and(
        eq(schema.orderDeliveries.driverId, driverId),
        eq(schema.orderDeliveries.deliveryStatus, 'completed')
      ))
      .orderBy(desc(schema.orderDeliveries.deliveredAt));
    
    return deliveries.filter((d): d is { orderNumber: number; deliveredAt: Date | null } => d.orderNumber !== null);
  }

  async getDriverPayments(driverId: string): Promise<schema.DriverPayment[]> {
    return db.select().from(schema.driverPayments)
      .where(eq(schema.driverPayments.driverId, driverId))
      .orderBy(desc(schema.driverPayments.paidAt));
  }

  async createDriverPayment(payment: schema.InsertDriverPayment): Promise<schema.DriverPayment> {
    const [newPayment] = await db.insert(schema.driverPayments).values(payment).returning();
    return newPayment;
  }

  // Push Subscription methods
  async savePushSubscription(driverId: string, endpoint: string, p256dh: string, auth: string): Promise<schema.PushSubscription> {
    // First delete any existing subscription for this driver
    await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.driverId, driverId));
    
    // Insert new subscription
    const [subscription] = await db.insert(schema.pushSubscriptions).values({
      driverId,
      endpoint,
      p256dh,
      auth,
    }).returning();
    
    return subscription;
  }

  async getDriverPushSubscriptions(driverId: string): Promise<schema.PushSubscription[]> {
    return db.select().from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.driverId, driverId));
  }

  async getAllDriverSubscriptionsForRestaurant(restaurantId: string): Promise<(schema.PushSubscription & { driverName: string })[]> {
    const drivers = await this.getDriversByRestaurant(restaurantId);
    const onDutyDriverIds = drivers.filter(d => d.isOnDuty).map(d => d.id);
    
    if (onDutyDriverIds.length === 0) return [];
    
    const subscriptions = await db.select({
      id: schema.pushSubscriptions.id,
      driverId: schema.pushSubscriptions.driverId,
      endpoint: schema.pushSubscriptions.endpoint,
      p256dh: schema.pushSubscriptions.p256dh,
      auth: schema.pushSubscriptions.auth,
      createdAt: schema.pushSubscriptions.createdAt,
      updatedAt: schema.pushSubscriptions.updatedAt,
      driverName: schema.drivers.name,
    })
      .from(schema.pushSubscriptions)
      .innerJoin(schema.drivers, eq(schema.pushSubscriptions.driverId, schema.drivers.id))
      .where(inArray(schema.pushSubscriptions.driverId, onDutyDriverIds));
    
    return subscriptions;
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, endpoint));
  }

  // Customer Push Subscription methods (for order tracking notifications)
  async saveCustomerPushSubscription(orderId: string, endpoint: string, p256dh: string, auth: string): Promise<schema.CustomerPushSubscription> {
    // First delete any existing subscription for this order with same endpoint
    await db.delete(schema.customerPushSubscriptions).where(
      and(
        eq(schema.customerPushSubscriptions.orderId, orderId),
        eq(schema.customerPushSubscriptions.endpoint, endpoint)
      )
    );
    
    // Insert new subscription
    const [subscription] = await db.insert(schema.customerPushSubscriptions).values({
      orderId,
      endpoint,
      p256dh,
      auth,
    }).returning();
    
    return subscription;
  }

  async getCustomerPushSubscriptions(orderId: string): Promise<schema.CustomerPushSubscription[]> {
    return db.select().from(schema.customerPushSubscriptions)
      .where(eq(schema.customerPushSubscriptions.orderId, orderId));
  }

  async deleteCustomerPushSubscriptions(orderId: string): Promise<void> {
    await db.delete(schema.customerPushSubscriptions).where(eq(schema.customerPushSubscriptions.orderId, orderId));
  }

  // Kitchen Station methods
  async getKitchenStations(restaurantId: string): Promise<KitchenStation[]> {
    return db.select().from(schema.kitchenStations)
      .where(eq(schema.kitchenStations.restaurantId, restaurantId))
      .orderBy(schema.kitchenStations.displayOrder);
  }

  async getKitchenStation(id: string): Promise<KitchenStation | undefined> {
    const [station] = await db.select().from(schema.kitchenStations)
      .where(eq(schema.kitchenStations.id, id));
    return station;
  }

  async createKitchenStation(station: InsertKitchenStation): Promise<KitchenStation> {
    const [newStation] = await db.insert(schema.kitchenStations).values(station).returning();
    return newStation;
  }

  async updateKitchenStation(id: string, station: Partial<InsertKitchenStation>): Promise<KitchenStation | undefined> {
    const [updated] = await db.update(schema.kitchenStations)
      .set(station)
      .where(eq(schema.kitchenStations.id, id))
      .returning();
    return updated;
  }

  async deleteKitchenStation(id: string): Promise<void> {
    await db.delete(schema.kitchenStations).where(eq(schema.kitchenStations.id, id));
  }

  // Order Item Completion methods
  async getOrderItemCompletions(orderId: string): Promise<OrderItemCompletion[]> {
    return db.select().from(schema.orderItemCompletions)
      .where(eq(schema.orderItemCompletions.orderId, orderId));
  }

  async createOrderItemCompletion(completion: InsertOrderItemCompletion): Promise<OrderItemCompletion> {
    const [newCompletion] = await db.insert(schema.orderItemCompletions).values(completion).returning();
    return newCompletion;
  }

  async updateOrderItemCompletion(id: string, completion: Partial<InsertOrderItemCompletion>): Promise<OrderItemCompletion | undefined> {
    const [updated] = await db.update(schema.orderItemCompletions)
      .set(completion)
      .where(eq(schema.orderItemCompletions.id, id))
      .returning();
    return updated;
  }

  async getOrderItemCompletion(orderItemId: string): Promise<OrderItemCompletion | undefined> {
    const [completion] = await db.select().from(schema.orderItemCompletions)
      .where(eq(schema.orderItemCompletions.orderItemId, orderItemId));
    return completion;
  }

  async markItemReady(orderItemId: string, quantity: number, stationId?: string, completedBy?: string): Promise<OrderItemCompletion> {
    const existing = await this.getOrderItemCompletion(orderItemId);
    
    if (existing) {
      const newCompletedQty = (existing.completedQuantity || 0) + quantity;
      const [updated] = await db.update(schema.orderItemCompletions)
        .set({
          completedQuantity: newCompletedQty,
          status: 'ready',
          stationId: stationId || existing.stationId,
          completedBy: completedBy || existing.completedBy,
          completedAt: new Date()
        })
        .where(eq(schema.orderItemCompletions.id, existing.id))
        .returning();
      return updated;
    } else {
      const [orderItem] = await db.select().from(schema.orderItems)
        .where(eq(schema.orderItems.id, orderItemId));
      
      const [newCompletion] = await db.insert(schema.orderItemCompletions).values({
        orderItemId,
        orderId: orderItem.orderId,
        stationId: stationId || null,
        status: 'ready',
        completedQuantity: quantity,
        completedBy: completedBy || null,
        completedAt: new Date()
      }).returning();
      return newCompletion;
    }
  }

  // EPOS Order methods
  async getEposOrders(restaurantId: string): Promise<EposOrder[]> {
    return db.select().from(schema.eposOrders)
      .where(eq(schema.eposOrders.restaurantId, restaurantId))
      .orderBy(desc(schema.eposOrders.createdAt));
  }

  async getEposOrder(id: string): Promise<EposOrder | undefined> {
    const [order] = await db.select().from(schema.eposOrders)
      .where(eq(schema.eposOrders.id, id));
    return order;
  }

  async getNextEposReceiptNumber(restaurantId: string): Promise<number> {
    const result = await db.select({ maxNum: max(schema.eposOrders.receiptNumber) })
      .from(schema.eposOrders)
      .where(eq(schema.eposOrders.restaurantId, restaurantId));
    return (result[0]?.maxNum || 0) + 1;
  }

  async createEposOrder(order: InsertEposOrder): Promise<EposOrder> {
    const receiptNumber = await this.getNextEposReceiptNumber(order.restaurantId);
    const [newOrder] = await db.insert(schema.eposOrders)
      .values(order as any)
      .returning();
    
    // Update with receipt number
    const [updated] = await db.update(schema.eposOrders)
      .set({ receiptNumber })
      .where(eq(schema.eposOrders.id, newOrder.id))
      .returning();
    return updated;
  }

  async deleteEposOrder(id: string): Promise<void> {
    await db.delete(schema.eposOrders).where(eq(schema.eposOrders.id, id));
  }

  // Menu Category methods
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    // Branch isolation: restaurantId is MANDATORY to prevent cross-tenant data leaks
    // Only return categories for this specific restaurant (no global categories)
    return db.select().from(schema.menuCategories)
      .where(eq(schema.menuCategories.restaurantId, restaurantId))
      .orderBy(schema.menuCategories.sortOrder);
  }

  async getAllMenuCategories(): Promise<MenuCategory[]> {
    // Admin panel: return all categories across all branches
    return db.select().from(schema.menuCategories)
      .orderBy(schema.menuCategories.sortOrder);
  }

  async getMenuCategory(id: string): Promise<MenuCategory | undefined> {
    const [category] = await db.select().from(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));
    return category;
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [newCategory] = await db.insert(schema.menuCategories).values(category).returning();
    return newCategory;
  }

  async updateMenuCategory(id: string, category: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined> {
    // Filter out undefined properties to prevent overwriting with undefined
    const cleanedCategory: Record<string, any> = {};
    for (const [key, value] of Object.entries(category)) {
      if (value !== undefined) {
        cleanedCategory[key] = value;
      }
    }
    
    // Only update if there are actual changes
    if (Object.keys(cleanedCategory).length === 0) {
      const existing = await this.getMenuCategory(id);
      return existing;
    }
    
    const [updated] = await db.update(schema.menuCategories)
      .set(cleanedCategory)
      .where(eq(schema.menuCategories.id, id))
      .returning();
    return updated;
  }

  async deleteMenuCategory(id: string): Promise<void> {
    // First get the category to find its name and restaurantId
    const [category] = await db.select().from(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));
    
    if (category) {
      // CASCADE DELETE: Delete all menu items in this category first
      await db.delete(schema.menuItems)
        .where(and(
          eq(schema.menuItems.restaurantId, category.restaurantId!),
          eq(schema.menuItems.category, category.name)
        ));
      
      // Then delete the category itself (only this specific category, not across branches)
      await db.delete(schema.menuCategories)
        .where(eq(schema.menuCategories.id, id));
    } else {
      // Fallback: just delete by ID if category not found
      await db.delete(schema.menuCategories).where(eq(schema.menuCategories.id, id));
    }
  }

  // Waiter methods
  async getWaiters(restaurantId: string): Promise<Waiter[]> {
    return db.select().from(schema.waiters)
      .where(eq(schema.waiters.restaurantId, restaurantId))
      .orderBy(schema.waiters.name);
  }

  async getWaiter(id: string): Promise<Waiter | undefined> {
    const [waiter] = await db.select().from(schema.waiters)
      .where(eq(schema.waiters.id, id));
    return waiter;
  }

  async getWaiterByNameAndPin(restaurantId: string, name: string, pin: string): Promise<Waiter | undefined> {
    const [waiter] = await db.select().from(schema.waiters)
      .where(and(
        eq(schema.waiters.restaurantId, restaurantId),
        sql`LOWER(${schema.waiters.name}) = LOWER(${name})`,
        eq(schema.waiters.pin, pin)
      ));
    return waiter;
  }

  async createWaiter(waiter: InsertWaiter): Promise<Waiter> {
    const [newWaiter] = await db.insert(schema.waiters).values(waiter).returning();
    return newWaiter;
  }

  async updateWaiter(id: string, waiter: Partial<InsertWaiter>): Promise<Waiter | undefined> {
    const [updated] = await db.update(schema.waiters)
      .set(waiter)
      .where(eq(schema.waiters.id, id))
      .returning();
    return updated;
  }

  async deleteWaiter(id: string): Promise<void> {
    await db.delete(schema.waiters).where(eq(schema.waiters.id, id));
  }

  // Waiter Tablet methods
  async getWaiterTablets(restaurantId: string): Promise<WaiterTablet[]> {
    return db.select().from(schema.waiterTablets)
      .where(eq(schema.waiterTablets.restaurantId, restaurantId))
      .orderBy(schema.waiterTablets.tabletNumber);
  }

  async getWaiterTablet(id: string): Promise<WaiterTablet | undefined> {
    const [tablet] = await db.select().from(schema.waiterTablets)
      .where(eq(schema.waiterTablets.id, id));
    return tablet;
  }

  async createWaiterTablet(tablet: InsertWaiterTablet): Promise<WaiterTablet> {
    const [newTablet] = await db.insert(schema.waiterTablets).values(tablet).returning();
    return newTablet;
  }

  async updateWaiterTablet(id: string, tablet: Partial<InsertWaiterTablet>): Promise<WaiterTablet | undefined> {
    const [updated] = await db.update(schema.waiterTablets)
      .set(tablet)
      .where(eq(schema.waiterTablets.id, id))
      .returning();
    return updated;
  }

  async getWaiterTabletByNumber(restaurantId: string, tabletNumber: number): Promise<WaiterTablet | undefined> {
    const [tablet] = await db.select().from(schema.waiterTablets)
      .where(and(
        eq(schema.waiterTablets.restaurantId, restaurantId),
        eq(schema.waiterTablets.tabletNumber, tabletNumber)
      ));
    return tablet;
  }

  async claimWaiterTablet(tabletId: string, waiterName: string): Promise<WaiterTablet | undefined> {
    const [updated] = await db.update(schema.waiterTablets)
      .set({
        assignedWaiterName: waiterName,
        isActive: true,
        sessionStartedAt: new Date(),
        orderCount: 0,
        lastActiveAt: new Date()
      })
      .where(eq(schema.waiterTablets.id, tabletId))
      .returning();
    return updated;
  }

  async releaseWaiterTablet(tabletId: string): Promise<WaiterTablet | undefined> {
    const [updated] = await db.update(schema.waiterTablets)
      .set({
        assignedWaiterName: null,
        assignedWaiterId: null,
        isActive: false,
        sessionStartedAt: null,
        orderCount: 0,
        lastActiveAt: new Date()
      })
      .where(eq(schema.waiterTablets.id, tabletId))
      .returning();
    return updated;
  }

  async releaseAllWaiterTablets(restaurantId: string): Promise<WaiterTablet[]> {
    const updated = await db.update(schema.waiterTablets)
      .set({
        assignedWaiterName: null,
        assignedWaiterId: null,
        isActive: false,
        sessionStartedAt: null,
        orderCount: 0,
        lastActiveAt: new Date()
      })
      .where(
        and(
          eq(schema.waiterTablets.restaurantId, restaurantId),
          eq(schema.waiterTablets.isActive, true)
        )
      )
      .returning();
    return updated;
  }

  async incrementTabletOrderCount(tabletId: string): Promise<WaiterTablet | undefined> {
    const tablet = await this.getWaiterTablet(tabletId);
    if (!tablet) return undefined;
    
    const [updated] = await db.update(schema.waiterTablets)
      .set({
        orderCount: (tablet.orderCount || 0) + 1,
        lastActiveAt: new Date()
      })
      .where(eq(schema.waiterTablets.id, tabletId))
      .returning();
    return updated;
  }

  async seedWaiterTablets(restaurantId: string, count: number): Promise<WaiterTablet[]> {
    const existing = await this.getWaiterTablets(restaurantId);
    const existingNumbers = new Set(existing.map(t => t.tabletNumber));
    const toCreate: InsertWaiterTablet[] = [];
    
    for (let i = 1; i <= count; i++) {
      if (!existingNumbers.has(i)) {
        toCreate.push({ restaurantId, tabletNumber: i });
      }
    }
    
    if (toCreate.length === 0) return existing;
    
    const newTablets = await db.insert(schema.waiterTablets).values(toCreate).returning();
    return [...existing, ...newTablets].sort((a, b) => a.tabletNumber - b.tabletNumber);
  }

  // Table Session methods
  async getTableSessions(restaurantId: string): Promise<(TableSession & { items: TableSessionItem[]; waiter?: Waiter })[]> {
    const sessions = await db.select().from(schema.tableSessions)
      .where(eq(schema.tableSessions.restaurantId, restaurantId))
      .orderBy(desc(schema.tableSessions.createdAt));
    
    const result = await Promise.all(sessions.map(async (session) => {
      const items = await db.select().from(schema.tableSessionItems)
        .where(eq(schema.tableSessionItems.sessionId, session.id));
      
      let waiter: Waiter | undefined;
      if (session.waiterId) {
        waiter = await this.getWaiter(session.waiterId);
      }
      
      return { ...session, items, waiter };
    }));
    
    return result;
  }

  async getTableSession(id: string): Promise<(TableSession & { items: TableSessionItem[] }) | undefined> {
    const [session] = await db.select().from(schema.tableSessions)
      .where(eq(schema.tableSessions.id, id));
    
    if (!session) return undefined;
    
    const items = await db.select().from(schema.tableSessionItems)
      .where(eq(schema.tableSessionItems.sessionId, id));
    
    return { ...session, items };
  }

  async createTableSession(session: InsertTableSession): Promise<TableSession> {
    const [newSession] = await db.insert(schema.tableSessions).values(session).returning();
    return newSession;
  }

  async updateTableSession(id: string, session: Partial<InsertTableSession>): Promise<TableSession | undefined> {
    const [updated] = await db.update(schema.tableSessions)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(schema.tableSessions.id, id))
      .returning();
    return updated;
  }

  async addTableSessionItem(item: InsertTableSessionItem): Promise<TableSessionItem> {
    const [newItem] = await db.insert(schema.tableSessionItems).values(item as any).returning();
    return newItem;
  }

  async updateTableSessionItem(id: string, item: Partial<InsertTableSessionItem>): Promise<TableSessionItem | undefined> {
    const [updated] = await db.update(schema.tableSessionItems)
      .set(item as any)
      .where(eq(schema.tableSessionItems.id, id))
      .returning();
    return updated;
  }

  async deleteTableSessionItem(id: string): Promise<void> {
    await db.delete(schema.tableSessionItems).where(eq(schema.tableSessionItems.id, id));
  }

  async getTableSessionItems(sessionId: string): Promise<TableSessionItem[]> {
    return db.select().from(schema.tableSessionItems)
      .where(eq(schema.tableSessionItems.sessionId, sessionId));
  }

  // Supplier methods
  async getSuppliers(restaurantId: string): Promise<Supplier[]> {
    return db.select().from(schema.suppliers)
      .where(eq(schema.suppliers.restaurantId, restaurantId))
      .orderBy(schema.suppliers.name);
  }

  async getSuppliersWithProducts(restaurantId: string): Promise<SupplierWithProducts[]> {
    const suppliers = await this.getSuppliers(restaurantId);
    const result = await Promise.all(suppliers.map(async (supplier) => {
      const products = await db.select().from(schema.supplierProducts)
        .where(eq(schema.supplierProducts.supplierId, supplier.id))
        .orderBy(schema.supplierProducts.name);
      return { ...supplier, products };
    }));
    return result;
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(schema.suppliers)
      .where(eq(schema.suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(schema.suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(schema.suppliers)
      .set(supplier)
      .where(eq(schema.suppliers.id, id))
      .returning();
    return updated;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(schema.suppliers).where(eq(schema.suppliers.id, id));
  }

  // Supplier Product methods
  async getSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
    return db.select().from(schema.supplierProducts)
      .where(eq(schema.supplierProducts.supplierId, supplierId))
      .orderBy(schema.supplierProducts.name);
  }

  async getSupplierProduct(id: string): Promise<SupplierProduct | undefined> {
    const [product] = await db.select().from(schema.supplierProducts)
      .where(eq(schema.supplierProducts.id, id));
    return product;
  }

  async createSupplierProduct(product: InsertSupplierProduct): Promise<SupplierProduct> {
    const [newProduct] = await db.insert(schema.supplierProducts).values(product).returning();
    return newProduct;
  }

  async updateSupplierProduct(id: string, product: Partial<InsertSupplierProduct>): Promise<SupplierProduct | undefined> {
    const [updated] = await db.update(schema.supplierProducts)
      .set(product)
      .where(eq(schema.supplierProducts.id, id))
      .returning();
    return updated;
  }

  async deleteSupplierProduct(id: string): Promise<void> {
    await db.delete(schema.supplierProducts).where(eq(schema.supplierProducts.id, id));
  }

  // Supplier Order methods
  async getSupplierOrders(restaurantId: string): Promise<SupplierOrderWithItems[]> {
    const orders = await db.select().from(schema.supplierOrders)
      .where(eq(schema.supplierOrders.restaurantId, restaurantId))
      .orderBy(desc(schema.supplierOrders.createdAt));
    
    const result = await Promise.all(orders.map(async (order) => {
      const items = await db.select().from(schema.supplierOrderItems)
        .where(eq(schema.supplierOrderItems.orderId, order.id));
      const supplier = await this.getSupplier(order.supplierId);
      return { ...order, items, supplier };
    }));
    return result;
  }

  async getSupplierOrder(id: string): Promise<SupplierOrderWithItems | undefined> {
    const [order] = await db.select().from(schema.supplierOrders)
      .where(eq(schema.supplierOrders.id, id));
    
    if (!order) return undefined;
    
    const items = await db.select().from(schema.supplierOrderItems)
      .where(eq(schema.supplierOrderItems.orderId, id));
    const supplier = await this.getSupplier(order.supplierId);
    
    return { ...order, items, supplier };
  }

  async createSupplierOrder(order: InsertSupplierOrder, items: Omit<InsertSupplierOrderItem, "orderId">[]): Promise<SupplierOrderWithItems> {
    const [newOrder] = await db.insert(schema.supplierOrders).values(order).returning();
    
    const orderItems: SupplierOrderItem[] = [];
    for (const item of items) {
      const [newItem] = await db.insert(schema.supplierOrderItems)
        .values({ ...item, orderId: newOrder.id })
        .returning();
      orderItems.push(newItem);
    }
    
    const supplier = await this.getSupplier(newOrder.supplierId);
    return { ...newOrder, items: orderItems, supplier };
  }

  async updateSupplierOrder(id: string, order: Partial<InsertSupplierOrder>): Promise<SupplierOrder | undefined> {
    const [updated] = await db.update(schema.supplierOrders)
      .set(order)
      .where(eq(schema.supplierOrders.id, id))
      .returning();
    return updated;
  }

  async deleteSupplierOrder(id: string): Promise<void> {
    await db.delete(schema.supplierOrders).where(eq(schema.supplierOrders.id, id));
  }

  async markSupplierOrderSent(id: string): Promise<SupplierOrder | undefined> {
    const [updated] = await db.update(schema.supplierOrders)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(schema.supplierOrders.id, id))
      .returning();
    return updated;
  }

  async updateSupplierOrderItemQuantity(itemId: string, quantity: number, unitPrice: number): Promise<SupplierOrderItem | undefined> {
    const subtotal = (quantity * unitPrice).toFixed(2);
    const [updated] = await db.update(schema.supplierOrderItems)
      .set({ quantity: quantity.toString(), subtotal })
      .where(eq(schema.supplierOrderItems.id, itemId))
      .returning();
    
    if (updated) {
      // Update the order total
      const orderItems = await db.select().from(schema.supplierOrderItems)
        .where(eq(schema.supplierOrderItems.orderId, updated.orderId));
      const newTotal = orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal || "0"), 0);
      await db.update(schema.supplierOrders)
        .set({ total: newTotal.toFixed(2) })
        .where(eq(schema.supplierOrders.id, updated.orderId));
    }
    
    return updated;
  }

  // Financial Transaction methods
  async getFinancialTransactions(restaurantId: string, startDate?: Date, endDate?: Date): Promise<FinancialTransaction[]> {
    let query = db.select().from(schema.financialTransactions)
      .where(eq(schema.financialTransactions.restaurantId, restaurantId))
      .orderBy(desc(schema.financialTransactions.transactionDate));
    
    return await query;
  }

  async getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined> {
    const [transaction] = await db.select().from(schema.financialTransactions)
      .where(eq(schema.financialTransactions.id, id));
    return transaction;
  }

  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [newTransaction] = await db.insert(schema.financialTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async deleteFinancialTransaction(id: string): Promise<void> {
    await db.delete(schema.financialTransactions)
      .where(eq(schema.financialTransactions.id, id));
  }

  async getFinancialSummary(restaurantId: string, startDate?: Date, endDate?: Date): Promise<FinancialSummary> {
    const transactions = await this.getFinancialTransactions(restaurantId, startDate, endDate);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeBySource: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    
    for (const t of transactions) {
      const amount = parseFloat(t.amount);
      if (t.type === "income") {
        totalIncome += amount;
        const source = t.incomeSource || "other_income";
        incomeBySource[source] = (incomeBySource[source] || 0) + amount;
      } else {
        totalExpenses += amount;
        const category = t.expenseCategory || "other";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
      }
    }
    
    const netProfit = totalIncome - totalExpenses;
    const profitPercentage = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitPercentage,
      incomeBySource,
      expensesByCategory,
    };
  }

  // Recurring Expense methods
  async getRecurringExpenses(restaurantId: string): Promise<RecurringExpense[]> {
    return await db.select().from(schema.recurringExpenses)
      .where(eq(schema.recurringExpenses.restaurantId, restaurantId))
      .orderBy(desc(schema.recurringExpenses.createdAt));
  }

  async getRecurringExpense(id: string): Promise<RecurringExpense | undefined> {
    const [expense] = await db.select().from(schema.recurringExpenses)
      .where(eq(schema.recurringExpenses.id, id));
    return expense;
  }

  async createRecurringExpense(expense: InsertRecurringExpense): Promise<RecurringExpense> {
    const [newExpense] = await db.insert(schema.recurringExpenses)
      .values(expense)
      .returning();
    return newExpense;
  }

  async updateRecurringExpense(id: string, expense: Partial<InsertRecurringExpense>): Promise<RecurringExpense | undefined> {
    const [updated] = await db.update(schema.recurringExpenses)
      .set(expense)
      .where(eq(schema.recurringExpenses.id, id))
      .returning();
    return updated;
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    await db.delete(schema.recurringExpenses)
      .where(eq(schema.recurringExpenses.id, id));
  }

  // Staff Member methods
  async getStaffMembers(restaurantId: string): Promise<StaffMember[]> {
    return await db.select().from(schema.staffMembers)
      .where(eq(schema.staffMembers.restaurantId, restaurantId))
      .orderBy(schema.staffMembers.name);
  }

  async getStaffMember(id: string): Promise<StaffMember | undefined> {
    const [staff] = await db.select().from(schema.staffMembers)
      .where(eq(schema.staffMembers.id, id));
    return staff;
  }

  async createStaffMember(staff: InsertStaffMember): Promise<StaffMember> {
    const [newStaff] = await db.insert(schema.staffMembers)
      .values(staff)
      .returning();
    return newStaff;
  }

  async updateStaffMember(id: string, staff: Partial<InsertStaffMember>): Promise<StaffMember | undefined> {
    const [updated] = await db.update(schema.staffMembers)
      .set(staff)
      .where(eq(schema.staffMembers.id, id))
      .returning();
    return updated;
  }

  async deleteStaffMember(id: string): Promise<void> {
    await db.delete(schema.staffMembers)
      .where(eq(schema.staffMembers.id, id));
  }

  // Staff Wage Payment methods
  async getStaffWagePayments(restaurantId: string): Promise<StaffWagePayment[]> {
    return await db.select().from(schema.staffWagePayments)
      .where(eq(schema.staffWagePayments.restaurantId, restaurantId))
      .orderBy(desc(schema.staffWagePayments.periodEnd));
  }

  async getStaffWagePaymentsByStaff(staffId: string): Promise<StaffWagePayment[]> {
    return await db.select().from(schema.staffWagePayments)
      .where(eq(schema.staffWagePayments.staffId, staffId))
      .orderBy(desc(schema.staffWagePayments.periodEnd));
  }

  async createStaffWagePayment(payment: InsertStaffWagePayment): Promise<StaffWagePayment> {
    const [newPayment] = await db.insert(schema.staffWagePayments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updateStaffWagePayment(id: string, payment: Partial<InsertStaffWagePayment>): Promise<StaffWagePayment | undefined> {
    const [updated] = await db.update(schema.staffWagePayments)
      .set(payment)
      .where(eq(schema.staffWagePayments.id, id))
      .returning();
    return updated;
  }

  async deleteStaffWagePayment(id: string): Promise<void> {
    await db.delete(schema.staffWagePayments)
      .where(eq(schema.staffWagePayments.id, id));
  }

  // Cash Deposit methods
  async getCashDeposits(restaurantId: string): Promise<CashDeposit[]> {
    return await db.select().from(schema.cashDeposits)
      .where(eq(schema.cashDeposits.restaurantId, restaurantId))
      .orderBy(desc(schema.cashDeposits.depositDate));
  }

  async createCashDeposit(deposit: InsertCashDeposit): Promise<CashDeposit> {
    const [newDeposit] = await db.insert(schema.cashDeposits)
      .values(deposit)
      .returning();
    return newDeposit;
  }

  async deleteCashDeposit(id: string): Promise<void> {
    await db.delete(schema.cashDeposits)
      .where(eq(schema.cashDeposits.id, id));
  }

  // Platform Settings methods
  async getPlatformSettings(): Promise<PlatformSettings | undefined> {
    const [settings] = await db.select().from(schema.platformSettings).limit(1);
    return settings;
  }

  async getOrCreatePlatformSettings(): Promise<PlatformSettings> {
    const existing = await this.getPlatformSettings();
    if (existing) {
      return existing;
    }
    const defaultSettings: InsertPlatformSettings = {
      platformCommission: "2.5",
      smsNotificationsEnabled: true,
      emailDigestsEnabled: true,
      defaultOpenTime: "11:00",
      defaultCloseTime: "23:00",
      mondayEnabled: true,
      tuesdayEnabled: true,
      wednesdayEnabled: true,
      thursdayEnabled: true,
      fridayEnabled: true,
      saturdayEnabled: true,
      sundayEnabled: false,
      mondayOpen: "11:00",
      mondayClose: "23:00",
      tuesdayOpen: "11:00",
      tuesdayClose: "23:00",
      wednesdayOpen: "11:00",
      wednesdayClose: "23:00",
      thursdayOpen: "11:00",
      thursdayClose: "23:00",
      fridayOpen: "11:00",
      fridayClose: "23:00",
      saturdayOpen: "11:00",
      saturdayClose: "23:00",
      sundayOpen: "11:00",
      sundayClose: "23:00",
    };
    const [created] = await db.insert(schema.platformSettings)
      .values(defaultSettings)
      .returning();
    return created;
  }

  async updatePlatformSettings(settings: Partial<InsertPlatformSettings>): Promise<PlatformSettings> {
    const existing = await this.getOrCreatePlatformSettings();
    const [updated] = await db.update(schema.platformSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(schema.platformSettings.id, existing.id))
      .returning();
    return updated;
  }

  // Branch Snapshot methods (for data backup/recovery)
  async getBranchSnapshots(restaurantId: string): Promise<BranchSnapshot[]> {
    return await db.select()
      .from(schema.branchSnapshots)
      .where(eq(schema.branchSnapshots.restaurantId, restaurantId))
      .orderBy(desc(schema.branchSnapshots.createdAt));
  }

  async getBranchSnapshot(id: string): Promise<BranchSnapshot | undefined> {
    const [snapshot] = await db.select()
      .from(schema.branchSnapshots)
      .where(eq(schema.branchSnapshots.id, id));
    return snapshot;
  }

  async createBranchSnapshot(restaurantId: string, label?: string, snapshotType: string = 'manual'): Promise<BranchSnapshot> {
    const restaurant = await this.getRestaurant(restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const menuItems = await db.select().from(schema.menuItems).where(eq(schema.menuItems.restaurantId, restaurantId));
    const menuCategories = await db.select().from(schema.menuCategories).where(eq(schema.menuCategories.restaurantId, restaurantId));
    const toppingGroups = await db.select().from(schema.toppingGroups).where(eq(schema.toppingGroups.restaurantId, restaurantId));
    const toppingGroupIds = toppingGroups.map(g => g.id);
    const toppingGroupOptions = toppingGroupIds.length > 0 
      ? await db.select().from(schema.toppingGroupOptions).where(inArray(schema.toppingGroupOptions.groupId, toppingGroupIds))
      : [];
    const extraToppings = await db.select().from(schema.extraToppings).where(eq(schema.extraToppings.restaurantId, restaurantId));
    const heroImages = await db.select().from(schema.restaurantHeroImages).where(eq(schema.restaurantHeroImages.restaurantId, restaurantId));
    const promotions = await db.select().from(schema.promotions).where(eq(schema.promotions.restaurantId, restaurantId));

    const payload = {
      restaurant,
      menuItems,
      menuCategories,
      toppingGroups,
      toppingGroupOptions,
      extraToppings,
      heroImages,
      promotions,
      snapshotDate: new Date().toISOString(),
    };

    const [snapshot] = await db.insert(schema.branchSnapshots)
      .values({
        restaurantId,
        label: label || `Backup ${new Date().toLocaleString()}`,
        snapshotType,
        payload,
      })
      .returning();
    
    return snapshot;
  }

  async restoreBranchSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = await this.getBranchSnapshot(snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');

    const payload = snapshot.payload as any;
    const restaurantId = snapshot.restaurantId;

    // Delete existing data for this restaurant
    await db.delete(schema.toppingGroupOptions)
      .where(inArray(schema.toppingGroupOptions.groupId, 
        db.select({ id: schema.toppingGroups.id }).from(schema.toppingGroups).where(eq(schema.toppingGroups.restaurantId, restaurantId))
      ));
    await db.delete(schema.toppingGroups).where(eq(schema.toppingGroups.restaurantId, restaurantId));
    await db.delete(schema.extraToppings).where(eq(schema.extraToppings.restaurantId, restaurantId));
    await db.delete(schema.menuItems).where(eq(schema.menuItems.restaurantId, restaurantId));
    await db.delete(schema.menuCategories).where(eq(schema.menuCategories.restaurantId, restaurantId));
    await db.delete(schema.restaurantHeroImages).where(eq(schema.restaurantHeroImages.restaurantId, restaurantId));
    await db.delete(schema.promotions).where(eq(schema.promotions.restaurantId, restaurantId));

    // Restore menu categories
    if (payload.menuCategories?.length > 0) {
      await db.insert(schema.menuCategories).values(payload.menuCategories);
    }

    // Restore menu items
    if (payload.menuItems?.length > 0) {
      await db.insert(schema.menuItems).values(payload.menuItems);
    }

    // Restore topping groups
    if (payload.toppingGroups?.length > 0) {
      await db.insert(schema.toppingGroups).values(payload.toppingGroups);
    }

    // Restore topping group options
    if (payload.toppingGroupOptions?.length > 0) {
      await db.insert(schema.toppingGroupOptions).values(payload.toppingGroupOptions);
    }

    // Restore extra toppings
    if (payload.extraToppings?.length > 0) {
      await db.insert(schema.extraToppings).values(payload.extraToppings);
    }

    // Restore hero images
    if (payload.heroImages?.length > 0) {
      await db.insert(schema.restaurantHeroImages).values(payload.heroImages);
    }

    // Restore promotions
    if (payload.promotions?.length > 0) {
      await db.insert(schema.promotions).values(payload.promotions);
    }

    return true;
  }

  async deleteBranchSnapshot(id: string): Promise<void> {
    await db.delete(schema.branchSnapshots).where(eq(schema.branchSnapshots.id, id));
  }

  // Twilio Settings methods
  async getTwilioSettings(restaurantId: string): Promise<schema.TwilioSettings | undefined> {
    const [settings] = await db.select()
      .from(schema.twilioSettings)
      .where(eq(schema.twilioSettings.restaurantId, restaurantId));
    return settings;
  }

  async getAllTwilioSettings(): Promise<schema.TwilioSettings[]> {
    return await db.select().from(schema.twilioSettings);
  }

  async createTwilioSettings(settings: schema.InsertTwilioSettings): Promise<schema.TwilioSettings> {
    const [newSettings] = await db.insert(schema.twilioSettings).values(settings).returning();
    return newSettings;
  }

  async updateTwilioSettings(restaurantId: string, settings: Partial<schema.InsertTwilioSettings>): Promise<schema.TwilioSettings | undefined> {
    const [updated] = await db.update(schema.twilioSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(schema.twilioSettings.restaurantId, restaurantId))
      .returning();
    return updated;
  }

  async toggleTwilioEnabled(restaurantId: string, enabled: boolean): Promise<schema.TwilioSettings | undefined> {
    const [updated] = await db.update(schema.twilioSettings)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(schema.twilioSettings.restaurantId, restaurantId))
      .returning();
    return updated;
  }

  async deleteTwilioSettings(restaurantId: string): Promise<void> {
    await db.delete(schema.twilioSettings).where(eq(schema.twilioSettings.restaurantId, restaurantId));
  }

  // Call Recording methods
  async getCallRecordings(restaurantId: string): Promise<schema.CallRecording[]> {
    return await db.select()
      .from(schema.callRecordings)
      .where(eq(schema.callRecordings.restaurantId, restaurantId))
      .orderBy(desc(schema.callRecordings.createdAt));
  }

  async getCallRecording(id: string): Promise<schema.CallRecording | undefined> {
    const [recording] = await db.select()
      .from(schema.callRecordings)
      .where(eq(schema.callRecordings.id, id));
    return recording;
  }

  async createCallRecording(recording: schema.InsertCallRecording): Promise<schema.CallRecording> {
    const [newRecording] = await db.insert(schema.callRecordings).values(recording).returning();
    return newRecording;
  }

  async updateCallRecording(id: string, recording: Partial<schema.InsertCallRecording>): Promise<schema.CallRecording | undefined> {
    const [updated] = await db.update(schema.callRecordings)
      .set(recording)
      .where(eq(schema.callRecordings.id, id))
      .returning();
    return updated;
  }

  async deleteCallRecording(id: string): Promise<void> {
    await db.delete(schema.callRecordings).where(eq(schema.callRecordings.id, id));
  }

  // Branch Features methods
  async getBranchFeatures(restaurantId: string): Promise<schema.BranchFeatures | undefined> {
    const [features] = await db.select()
      .from(schema.branchFeatures)
      .where(eq(schema.branchFeatures.restaurantId, restaurantId));
    return features;
  }

  async getAllBranchFeatures(): Promise<schema.BranchFeatures[]> {
    return await db.select().from(schema.branchFeatures);
  }

  async createBranchFeatures(restaurantId: string): Promise<schema.BranchFeatures> {
    const [features] = await db.insert(schema.branchFeatures)
      .values({ restaurantId })
      .returning();
    return features;
  }

  async updateBranchFeatures(restaurantId: string, features: Partial<schema.InsertBranchFeatures>): Promise<schema.BranchFeatures | undefined> {
    const [updated] = await db.update(schema.branchFeatures)
      .set({ ...features, updatedAt: new Date() })
      .where(eq(schema.branchFeatures.restaurantId, restaurantId))
      .returning();
    return updated;
  }
  // Device Brand methods
  async getAllDeviceBrands(): Promise<schema.DeviceBrand[]> {
    return await db.select().from(schema.deviceBrands).orderBy(desc(schema.deviceBrands.createdAt));
  }

  async getDeviceBrand(id: string): Promise<schema.DeviceBrand | undefined> {
    const [brand] = await db.select().from(schema.deviceBrands).where(eq(schema.deviceBrands.id, id));
    return brand;
  }

  async getDeviceBrandBySlug(slug: string): Promise<schema.DeviceBrand | undefined> {
    const [brand] = await db.select().from(schema.deviceBrands).where(eq(schema.deviceBrands.slug, slug));
    return brand;
  }

  async createDeviceBrand(brand: schema.InsertDeviceBrand): Promise<schema.DeviceBrand> {
    const [newBrand] = await db.insert(schema.deviceBrands).values(brand).returning();
    return newBrand;
  }

  async updateDeviceBrand(id: string, brand: Partial<schema.InsertDeviceBrand>): Promise<schema.DeviceBrand | undefined> {
    const [updated] = await db.update(schema.deviceBrands).set(brand).where(eq(schema.deviceBrands.id, id)).returning();
    return updated;
  }

  async deleteDeviceBrand(id: string): Promise<void> {
    await db.delete(schema.deviceBrands).where(eq(schema.deviceBrands.id, id));
  }

  // Device Customer methods
  async getDeviceCustomersByBrand(brandId: string): Promise<schema.DeviceCustomer[]> {
    return await db.select().from(schema.deviceCustomers).where(eq(schema.deviceCustomers.brandId, brandId)).orderBy(desc(schema.deviceCustomers.createdAt));
  }

  async getDeviceCustomer(id: string): Promise<schema.DeviceCustomer | undefined> {
    const [customer] = await db.select().from(schema.deviceCustomers).where(eq(schema.deviceCustomers.id, id));
    return customer;
  }

  async getDeviceCustomerByLogin(username: string, brandId: string): Promise<schema.DeviceCustomer | undefined> {
    const [customer] = await db.select().from(schema.deviceCustomers)
      .where(and(eq(schema.deviceCustomers.loginUsername, username), eq(schema.deviceCustomers.brandId, brandId)));
    return customer;
  }

  async createDeviceCustomer(customer: schema.InsertDeviceCustomer): Promise<schema.DeviceCustomer> {
    const [newCustomer] = await db.insert(schema.deviceCustomers).values(customer).returning();
    return newCustomer;
  }

  async updateDeviceCustomer(id: string, customer: Partial<schema.InsertDeviceCustomer>): Promise<schema.DeviceCustomer | undefined> {
    const [updated] = await db.update(schema.deviceCustomers).set(customer).where(eq(schema.deviceCustomers.id, id)).returning();
    return updated;
  }

  async deleteDeviceCustomer(id: string): Promise<void> {
    await db.delete(schema.deviceCustomers).where(eq(schema.deviceCustomers.id, id));
  }

  // Device methods
  async getDevicesByBrand(brandId: string): Promise<schema.Device[]> {
    return await db.select().from(schema.devices).where(eq(schema.devices.brandId, brandId)).orderBy(desc(schema.devices.createdAt));
  }

  async getDevicesByCustomer(customerId: string): Promise<schema.Device[]> {
    return await db.select().from(schema.devices).where(eq(schema.devices.customerId, customerId)).orderBy(desc(schema.devices.createdAt));
  }

  async getDevice(id: string): Promise<schema.Device | undefined> {
    const [device] = await db.select().from(schema.devices).where(eq(schema.devices.id, id));
    return device;
  }

  async getDeviceBySerial(serialNumber: string, brandId: string): Promise<schema.Device | undefined> {
    const [device] = await db.select().from(schema.devices)
      .where(and(eq(schema.devices.serialNumber, serialNumber), eq(schema.devices.brandId, brandId)));
    return device;
  }

  async createDevice(device: schema.InsertDevice): Promise<schema.Device> {
    const [newDevice] = await db.insert(schema.devices).values(device).returning();
    return newDevice;
  }

  async updateDevice(id: string, device: Partial<schema.InsertDevice>): Promise<schema.Device | undefined> {
    const [updated] = await db.update(schema.devices).set(device).where(eq(schema.devices.id, id)).returning();
    return updated;
  }

  async deleteDevice(id: string): Promise<void> {
    await db.delete(schema.devices).where(eq(schema.devices.id, id));
  }

  // Device Group methods
  async getDeviceGroups(brandId: string): Promise<schema.DeviceGroup[]> {
    return await db.select().from(schema.deviceGroups).where(eq(schema.deviceGroups.brandId, brandId)).orderBy(desc(schema.deviceGroups.createdAt));
  }

  async getDeviceGroupsByCustomer(customerId: string): Promise<schema.DeviceGroup[]> {
    return await db.select().from(schema.deviceGroups).where(eq(schema.deviceGroups.customerId, customerId)).orderBy(desc(schema.deviceGroups.createdAt));
  }

  async createDeviceGroup(group: schema.InsertDeviceGroup): Promise<schema.DeviceGroup> {
    const [newGroup] = await db.insert(schema.deviceGroups).values(group).returning();
    return newGroup;
  }

  async updateDeviceGroup(id: string, group: Partial<schema.InsertDeviceGroup>): Promise<schema.DeviceGroup | undefined> {
    const [updated] = await db.update(schema.deviceGroups).set(group).where(eq(schema.deviceGroups.id, id)).returning();
    return updated;
  }

  async deleteDeviceGroup(id: string): Promise<void> {
    await db.delete(schema.deviceGroups).where(eq(schema.deviceGroups.id, id));
  }

  // Device Schedule methods
  async getDeviceSchedules(deviceId: string): Promise<schema.DeviceSchedule[]> {
    return await db.select().from(schema.deviceSchedules).where(eq(schema.deviceSchedules.deviceId, deviceId)).orderBy(desc(schema.deviceSchedules.createdAt));
  }

  async createDeviceSchedule(schedule: schema.InsertDeviceSchedule): Promise<schema.DeviceSchedule> {
    const [newSchedule] = await db.insert(schema.deviceSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateDeviceSchedule(id: string, schedule: Partial<schema.InsertDeviceSchedule>): Promise<schema.DeviceSchedule | undefined> {
    const [updated] = await db.update(schema.deviceSchedules).set(schedule).where(eq(schema.deviceSchedules.id, id)).returning();
    return updated;
  }

  async deleteDeviceSchedule(id: string): Promise<void> {
    await db.delete(schema.deviceSchedules).where(eq(schema.deviceSchedules.id, id));
  }

  // ========================================================================
  // LINK24 PHONE - PBX module storage methods
  // ========================================================================

  async getPbxServer(): Promise<schema.PbxServer | undefined> {
    const [server] = await db.select().from(schema.pbxServers).limit(1);
    return server;
  }
  async upsertPbxServer(s: schema.InsertPbxServer): Promise<schema.PbxServer> {
    const existing = await this.getPbxServer();
    if (existing) {
      const [updated] = await db.update(schema.pbxServers).set({ ...s, updatedAt: new Date() }).where(eq(schema.pbxServers.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(schema.pbxServers).values(s).returning();
    return created;
  }

  async getPbxSubscription(restaurantId: string): Promise<schema.PbxSubscription | undefined> {
    const [sub] = await db.select().from(schema.pbxSubscriptions).where(eq(schema.pbxSubscriptions.restaurantId, restaurantId));
    return sub;
  }
  async listPbxSubscriptions(): Promise<schema.PbxSubscription[]> {
    return await db.select().from(schema.pbxSubscriptions).orderBy(desc(schema.pbxSubscriptions.createdAt));
  }
  async upsertPbxSubscription(restaurantId: string, data: Partial<schema.InsertPbxSubscription>): Promise<schema.PbxSubscription> {
    const existing = await this.getPbxSubscription(restaurantId);
    if (existing) {
      const [updated] = await db.update(schema.pbxSubscriptions).set({ ...data, updatedAt: new Date() }).where(eq(schema.pbxSubscriptions.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(schema.pbxSubscriptions).values({ restaurantId, ...data } as any).returning();
    return created;
  }

  // ===== Phone Landing — Offers =====
  async listPhoneOffers(opts?: { onlyEnabled?: boolean }): Promise<schema.PhoneOffer[]> {
    const rows = await db.select().from(schema.phoneOffers).orderBy(schema.phoneOffers.sortOrder);
    return opts?.onlyEnabled ? rows.filter(r => r.enabled) : rows;
  }
  async getPhoneOfferBySlug(slug: string): Promise<schema.PhoneOffer | undefined> {
    const [o] = await db.select().from(schema.phoneOffers).where(eq(schema.phoneOffers.slug, slug));
    return o;
  }
  async upsertPhoneOffer(slug: string, data: Partial<schema.InsertPhoneOffer>): Promise<schema.PhoneOffer> {
    const existing = await this.getPhoneOfferBySlug(slug);
    if (existing) {
      const [u] = await db.update(schema.phoneOffers).set({ ...data, updatedAt: new Date() } as any).where(eq(schema.phoneOffers.id, existing.id)).returning();
      return u;
    }
    const [c] = await db.insert(schema.phoneOffers).values({ slug, ...data } as any).returning();
    return c;
  }
  async deletePhoneOffer(id: string): Promise<void> {
    await db.delete(schema.phoneOffers).where(eq(schema.phoneOffers.id, id));
  }

  // ===== Phone Landing — Inquiries =====
  async listPhoneInquiries(): Promise<schema.PhoneInquiry[]> {
    return await db.select().from(schema.phoneInquiries).orderBy(desc(schema.phoneInquiries.createdAt));
  }
  async createPhoneInquiry(data: schema.InsertPhoneInquiry): Promise<schema.PhoneInquiry> {
    const [c] = await db.insert(schema.phoneInquiries).values(data as any).returning();
    return c;
  }
  async updatePhoneInquiry(id: string, data: Partial<schema.PhoneInquiry>): Promise<schema.PhoneInquiry | undefined> {
    const [u] = await db.update(schema.phoneInquiries).set({ ...data, updatedAt: new Date() } as any).where(eq(schema.phoneInquiries.id, id)).returning();
    return u;
  }
  async deletePhoneInquiry(id: string): Promise<void> {
    await db.delete(schema.phoneInquiries).where(eq(schema.phoneInquiries.id, id));
  }

  // Phone landing site settings (key/value)
  async getPhoneSiteSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(schema.phoneSiteSettings);
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value || "";
    return out;
  }
  async setPhoneSiteSettings(updates: Record<string, string>): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(updates)) {
      await db.insert(schema.phoneSiteSettings)
        .values({ key, value, updatedAt: new Date() } as any)
        .onConflictDoUpdate({ target: schema.phoneSiteSettings.key, set: { value, updatedAt: new Date() } });
    }
    return this.getPhoneSiteSettings();
  }

  // PBX Contacts
  async listPbxContacts(restaurantId: string): Promise<schema.PbxContact[]> {
    return await db.select().from(schema.pbxContacts).where(eq(schema.pbxContacts.restaurantId, restaurantId)).orderBy(desc(schema.pbxContacts.favorite), schema.pbxContacts.name);
  }
  async createPbxContact(data: schema.InsertPbxContact): Promise<schema.PbxContact> {
    const [c] = await db.insert(schema.pbxContacts).values(data as any).returning();
    return c;
  }
  async updatePbxContact(id: string, data: Partial<schema.InsertPbxContact>): Promise<schema.PbxContact> {
    const [c] = await db.update(schema.pbxContacts).set({ ...data, updatedAt: new Date() }).where(eq(schema.pbxContacts.id, id)).returning();
    return c;
  }
  async deletePbxContact(id: string): Promise<void> {
    await db.delete(schema.pbxContacts).where(eq(schema.pbxContacts.id, id));
  }

  // PBX SMS
  async listPbxSmsMessages(restaurantId: string, peerNumber?: string): Promise<schema.PbxSmsMessage[]> {
    if (peerNumber) {
      return await db.select().from(schema.pbxSmsMessages).where(and(
        eq(schema.pbxSmsMessages.restaurantId, restaurantId),
        sql`(${schema.pbxSmsMessages.fromNumber} = ${peerNumber} OR ${schema.pbxSmsMessages.toNumber} = ${peerNumber})`
      )).orderBy(schema.pbxSmsMessages.createdAt);
    }
    return await db.select().from(schema.pbxSmsMessages).where(eq(schema.pbxSmsMessages.restaurantId, restaurantId)).orderBy(desc(schema.pbxSmsMessages.createdAt)).limit(500);
  }
  async createPbxSmsMessage(data: schema.InsertPbxSmsMessage): Promise<schema.PbxSmsMessage> {
    const [m] = await db.insert(schema.pbxSmsMessages).values(data as any).returning();
    return m;
  }
  async markPbxSmsRead(id: string): Promise<void> {
    await db.update(schema.pbxSmsMessages).set({ read: true }).where(eq(schema.pbxSmsMessages.id, id));
  }
  async deletePbxSmsMessage(id: string): Promise<void> {
    await db.delete(schema.pbxSmsMessages).where(eq(schema.pbxSmsMessages.id, id));
  }

  // PBX Caller ID Profiles
  async listPbxCallerIds(restaurantId: string): Promise<schema.PbxCallerIdProfile[]> {
    return await db.select().from(schema.pbxCallerIdProfiles).where(eq(schema.pbxCallerIdProfiles.restaurantId, restaurantId)).orderBy(desc(schema.pbxCallerIdProfiles.isDefault), schema.pbxCallerIdProfiles.displayName);
  }
  async createPbxCallerId(data: schema.InsertPbxCallerIdProfile): Promise<schema.PbxCallerIdProfile> {
    const [c] = await db.insert(schema.pbxCallerIdProfiles).values(data as any).returning();
    return c;
  }
  async updatePbxCallerId(id: string, data: Partial<schema.PbxCallerIdProfile>): Promise<schema.PbxCallerIdProfile> {
    const [c] = await db.update(schema.pbxCallerIdProfiles).set(data as any).where(eq(schema.pbxCallerIdProfiles.id, id)).returning();
    return c;
  }
  async deletePbxCallerId(id: string): Promise<void> {
    await db.delete(schema.pbxCallerIdProfiles).where(eq(schema.pbxCallerIdProfiles.id, id));
  }
  async approvePbxCallerId(id: string, approvedBy: string): Promise<schema.PbxCallerIdProfile> {
    const [c] = await db.update(schema.pbxCallerIdProfiles).set({ approved: true, approvedBy, approvedAt: new Date() }).where(eq(schema.pbxCallerIdProfiles.id, id)).returning();
    return c;
  }

  async listPbxNumbers(restaurantId: string): Promise<schema.PbxPhoneNumber[]> {
    return await db.select().from(schema.pbxPhoneNumbers).where(eq(schema.pbxPhoneNumbers.restaurantId, restaurantId)).orderBy(desc(schema.pbxPhoneNumbers.createdAt));
  }
  async findPbxNumberOwner(canonicalE164: string, suffix9: string): Promise<{ number: schema.PbxPhoneNumber; primaryExtension: schema.PbxExtension | null; ambiguous: boolean } | null> {
    // Strategy: prefer exact E.164 match; fallback to deterministic last-9 suffix match (rejects multi-match ambiguity).
    let matches = await db.select().from(schema.pbxPhoneNumbers).where(eq(schema.pbxPhoneNumbers.number, canonicalE164));
    if (matches.length === 0 && suffix9.length === 9) {
      matches = await db.select().from(schema.pbxPhoneNumbers).where(sql`regexp_replace(${schema.pbxPhoneNumbers.number}, '\\D', '', 'g') LIKE ${'%' + suffix9}`);
    }
    if (matches.length === 0) return null;
    if (matches.length > 1) return { number: matches[0], primaryExtension: null, ambiguous: true };
    const match = matches[0];
    const exts = await db.select().from(schema.pbxExtensions).where(eq(schema.pbxExtensions.restaurantId, match.restaurantId)).orderBy(schema.pbxExtensions.extensionNumber);
    return { number: match, primaryExtension: exts[0] || null, ambiguous: false };
  }
  async createPbxNumber(n: schema.InsertPbxPhoneNumber): Promise<schema.PbxPhoneNumber> {
    const [created] = await db.insert(schema.pbxPhoneNumbers).values(n).returning();
    return created;
  }
  async deletePbxNumber(id: string): Promise<void> {
    await db.delete(schema.pbxPhoneNumbers).where(eq(schema.pbxPhoneNumbers.id, id));
  }

  // SIP Trunks (channel pool management)
  async listSipTrunks(): Promise<schema.SipTrunk[]> {
    return await db.select().from(schema.sipTrunks).orderBy(desc(schema.sipTrunks.createdAt));
  }
  async getSipTrunk(id: string): Promise<schema.SipTrunk | undefined> {
    const [t] = await db.select().from(schema.sipTrunks).where(eq(schema.sipTrunks.id, id));
    return t;
  }
  async createSipTrunk(t: schema.InsertSipTrunk): Promise<schema.SipTrunk> {
    const [created] = await db.insert(schema.sipTrunks).values(t).returning();
    return created;
  }
  async updateSipTrunk(id: string, t: Partial<schema.InsertSipTrunk>): Promise<schema.SipTrunk | undefined> {
    const [updated] = await db.update(schema.sipTrunks).set({ ...t, updatedAt: new Date() }).where(eq(schema.sipTrunks.id, id)).returning();
    return updated;
  }
  async deleteSipTrunk(id: string): Promise<void> {
    await db.delete(schema.sipTrunks).where(eq(schema.sipTrunks.id, id));
  }
  async listAllPbxNumbers(): Promise<schema.PbxPhoneNumber[]> {
    return await db.select().from(schema.pbxPhoneNumbers).orderBy(desc(schema.pbxPhoneNumbers.createdAt));
  }
  async updatePbxNumber(id: string, n: Partial<schema.InsertPbxPhoneNumber>): Promise<schema.PbxPhoneNumber | undefined> {
    const [updated] = await db.update(schema.pbxPhoneNumbers).set(n).where(eq(schema.pbxPhoneNumbers.id, id)).returning();
    return updated;
  }

  // Ring Groups
  async listPbxRingGroups(restaurantId: string): Promise<schema.PbxRingGroup[]> {
    return await db.select().from(schema.pbxRingGroups).where(eq(schema.pbxRingGroups.restaurantId, restaurantId)).orderBy(schema.pbxRingGroups.groupNumber);
  }
  async listAllPbxRingGroups(): Promise<schema.PbxRingGroup[]> {
    return await db.select().from(schema.pbxRingGroups).orderBy(desc(schema.pbxRingGroups.createdAt));
  }
  async createPbxRingGroup(g: schema.InsertPbxRingGroup): Promise<schema.PbxRingGroup> {
    const [created] = await db.insert(schema.pbxRingGroups).values(g).returning();
    return created;
  }
  async updatePbxRingGroup(id: string, g: Partial<schema.InsertPbxRingGroup>): Promise<schema.PbxRingGroup | undefined> {
    const [updated] = await db.update(schema.pbxRingGroups).set(g).where(eq(schema.pbxRingGroups.id, id)).returning();
    return updated;
  }
  async deletePbxRingGroup(id: string): Promise<void> {
    await db.delete(schema.pbxRingGroups).where(eq(schema.pbxRingGroups.id, id));
  }
  async listAllPbxExtensionsWithShop(): Promise<any[]> {
    return await db
      .select({
        id: schema.pbxExtensions.id,
        restaurantId: schema.pbxExtensions.restaurantId,
        extensionNumber: schema.pbxExtensions.extensionNumber,
        displayName: schema.pbxExtensions.displayName,
        email: schema.pbxExtensions.email,
        voicemailEnabled: schema.pbxExtensions.voicemailEnabled,
        registered: schema.pbxExtensions.registered,
        lastRegisteredAt: schema.pbxExtensions.lastRegisteredAt,
        createdAt: schema.pbxExtensions.createdAt,
        restaurantName: schema.restaurants.name,
      })
      .from(schema.pbxExtensions)
      .leftJoin(schema.restaurants, eq(schema.pbxExtensions.restaurantId, schema.restaurants.id))
      .orderBy(schema.pbxExtensions.extensionNumber);
  }

  async listPbxExtensions(restaurantId: string): Promise<schema.PbxExtension[]> {
    return await db.select().from(schema.pbxExtensions).where(eq(schema.pbxExtensions.restaurantId, restaurantId)).orderBy(schema.pbxExtensions.extensionNumber);
  }
  async createPbxExtension(e: schema.InsertPbxExtension): Promise<schema.PbxExtension> {
    const [created] = await db.insert(schema.pbxExtensions).values(e).returning();
    return created;
  }
  async updatePbxExtension(id: string, e: Partial<schema.InsertPbxExtension>): Promise<schema.PbxExtension | undefined> {
    const [updated] = await db.update(schema.pbxExtensions).set(e).where(eq(schema.pbxExtensions.id, id)).returning();
    return updated;
  }
  async deletePbxExtension(id: string): Promise<void> {
    await db.delete(schema.pbxExtensions).where(eq(schema.pbxExtensions.id, id));
  }

  async getPbxIvrMenu(restaurantId: string): Promise<schema.PbxIvrMenu | undefined> {
    const [menu] = await db.select().from(schema.pbxIvrMenus).where(eq(schema.pbxIvrMenus.restaurantId, restaurantId));
    return menu;
  }
  async upsertPbxIvrMenu(restaurantId: string, data: Partial<schema.InsertPbxIvrMenu>): Promise<schema.PbxIvrMenu> {
    const existing = await this.getPbxIvrMenu(restaurantId);
    if (existing) {
      const [updated] = await db.update(schema.pbxIvrMenus).set({ ...data, updatedAt: new Date() }).where(eq(schema.pbxIvrMenus.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(schema.pbxIvrMenus).values({ restaurantId, ...data } as any).returning();
    return created;
  }

  async listPbxAudioFiles(restaurantId: string): Promise<schema.PbxAudioFile[]> {
    return await db.select().from(schema.pbxAudioFiles).where(eq(schema.pbxAudioFiles.restaurantId, restaurantId)).orderBy(desc(schema.pbxAudioFiles.createdAt));
  }
  async createPbxAudioFile(a: schema.InsertPbxAudioFile): Promise<schema.PbxAudioFile> {
    const [created] = await db.insert(schema.pbxAudioFiles).values(a).returning();
    return created;
  }
  async deletePbxAudioFile(id: string): Promise<void> {
    await db.delete(schema.pbxAudioFiles).where(eq(schema.pbxAudioFiles.id, id));
  }

  async getPbxCallSettings(restaurantId: string): Promise<schema.PbxCallSettings | undefined> {
    const [s] = await db.select().from(schema.pbxCallSettings).where(eq(schema.pbxCallSettings.restaurantId, restaurantId));
    return s;
  }
  async upsertPbxCallSettings(restaurantId: string, data: Partial<schema.InsertPbxCallSettings>): Promise<schema.PbxCallSettings> {
    const existing = await this.getPbxCallSettings(restaurantId);
    if (existing) {
      const [updated] = await db.update(schema.pbxCallSettings).set({ ...data, updatedAt: new Date() }).where(eq(schema.pbxCallSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(schema.pbxCallSettings).values({ restaurantId, ...data } as any).returning();
    return created;
  }

  async listPbxCustomers(restaurantId: string, search?: string): Promise<schema.PbxCustomer[]> {
    if (search) {
      return await db.select().from(schema.pbxCustomers)
        .where(and(eq(schema.pbxCustomers.restaurantId, restaurantId), sql`(${schema.pbxCustomers.phoneNumber} ILIKE ${'%' + search + '%'} OR ${schema.pbxCustomers.name} ILIKE ${'%' + search + '%'})`))
        .orderBy(desc(schema.pbxCustomers.lastCallAt)).limit(200);
    }
    return await db.select().from(schema.pbxCustomers).where(eq(schema.pbxCustomers.restaurantId, restaurantId)).orderBy(desc(schema.pbxCustomers.lastCallAt)).limit(200);
  }
  async getPbxCustomerByPhone(restaurantId: string, phone: string): Promise<schema.PbxCustomer | undefined> {
    const [c] = await db.select().from(schema.pbxCustomers).where(and(eq(schema.pbxCustomers.restaurantId, restaurantId), eq(schema.pbxCustomers.phoneNumber, phone)));
    return c;
  }
  async upsertPbxCustomer(restaurantId: string, phone: string, data: Partial<schema.InsertPbxCustomer>): Promise<schema.PbxCustomer> {
    const existing = await this.getPbxCustomerByPhone(restaurantId, phone);
    if (existing) {
      const [updated] = await db.update(schema.pbxCustomers).set({ ...data, updatedAt: new Date() }).where(eq(schema.pbxCustomers.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(schema.pbxCustomers).values({ restaurantId, phoneNumber: phone, ...data } as any).returning();
    return created;
  }
  async updatePbxCustomer(id: string, data: Partial<schema.InsertPbxCustomer>): Promise<schema.PbxCustomer | undefined> {
    const [updated] = await db.update(schema.pbxCustomers).set({ ...data, updatedAt: new Date() }).where(eq(schema.pbxCustomers.id, id)).returning();
    return updated;
  }
  async deletePbxCustomer(id: string): Promise<void> {
    await db.delete(schema.pbxCustomers).where(eq(schema.pbxCustomers.id, id));
  }

  async listPbxCallLogs(restaurantId: string, limit: number = 100): Promise<schema.PbxCallLog[]> {
    return await db.select().from(schema.pbxCallLogs).where(eq(schema.pbxCallLogs.restaurantId, restaurantId)).orderBy(desc(schema.pbxCallLogs.startedAt)).limit(limit);
  }
  async createPbxCallLog(c: schema.InsertPbxCallLog): Promise<schema.PbxCallLog> {
    const [created] = await db.insert(schema.pbxCallLogs).values(c).returning();
    return created;
  }
  async updatePbxCallLog(id: string, c: Partial<schema.InsertPbxCallLog>): Promise<schema.PbxCallLog | undefined> {
    const [updated] = await db.update(schema.pbxCallLogs).set(c).where(eq(schema.pbxCallLogs.id, id)).returning();
    return updated;
  }
  async getPbxStats(restaurantId: string): Promise<{ today: number; week: number; month: number; missed: number; avgDuration: number }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [today] = await db.select({ c: sql<number>`count(*)::int` }).from(schema.pbxCallLogs).where(and(eq(schema.pbxCallLogs.restaurantId, restaurantId), sql`${schema.pbxCallLogs.startedAt} >= ${todayStart}`));
    const [week] = await db.select({ c: sql<number>`count(*)::int` }).from(schema.pbxCallLogs).where(and(eq(schema.pbxCallLogs.restaurantId, restaurantId), sql`${schema.pbxCallLogs.startedAt} >= ${weekStart}`));
    const [month] = await db.select({ c: sql<number>`count(*)::int` }).from(schema.pbxCallLogs).where(and(eq(schema.pbxCallLogs.restaurantId, restaurantId), sql`${schema.pbxCallLogs.startedAt} >= ${monthStart}`));
    const [missed] = await db.select({ c: sql<number>`count(*)::int` }).from(schema.pbxCallLogs).where(and(eq(schema.pbxCallLogs.restaurantId, restaurantId), eq(schema.pbxCallLogs.status, "missed"), sql`${schema.pbxCallLogs.startedAt} >= ${weekStart}`));
    const [avg] = await db.select({ c: sql<number>`COALESCE(AVG(${schema.pbxCallLogs.durationSeconds}), 0)::int` }).from(schema.pbxCallLogs).where(and(eq(schema.pbxCallLogs.restaurantId, restaurantId), sql`${schema.pbxCallLogs.startedAt} >= ${weekStart}`));
    return { today: today?.c || 0, week: week?.c || 0, month: month?.c || 0, missed: missed?.c || 0, avgDuration: avg?.c || 0 };
  }
}

export const storage = new DatabaseStorage();
