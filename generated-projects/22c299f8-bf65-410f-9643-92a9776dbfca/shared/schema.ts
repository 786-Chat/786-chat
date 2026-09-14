// @ts-nocheck
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomUUID } from "crypto";
import { nanoid } from "nanoid";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("branch"), // 'admin' or 'branch'
  branchId: varchar("branch_id"),
  // User preferences - replace localStorage usage
  theme: varchar("theme").default("dark"), // 'light' or 'dark'
  fontSize: varchar("font_size").default("medium"), // 'small', 'medium', 'large'
  preferences: jsonb("preferences").default("{}"), // Additional user preferences as JSON
  // Security session management - replace localStorage security sessions
  securitySessionId: varchar("security_session_id"),
  securitySessionExpiry: timestamp("security_session_expiry"),
  lastSecurityAuth: timestamp("last_security_auth"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  managerId: varchar("manager_id"),
  status: varchar("status").notNull().default("active"), // 'active', 'inactive'
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  address: text("address"),
  phone: varchar("phone"),
  username: varchar("username").unique(),
  password: varchar("password"),
  email: varchar("email"),
  contactNumber: varchar("contact_number"),
  postCode: varchar("post_code"),
  contractNumber: varchar("contract_number"),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  membershipCertificateUrl: varchar("membership_certificate_url"),
  logoUrl: varchar("logo_url"),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  paymentStatus: varchar("payment_status"),
  paymentMethod: varchar("payment_method"),
  paymentFrequency: varchar("payment_frequency"),
  visitFrequency: varchar("visit_frequency"),
  starRating: integer("star_rating").default(5),
  // Automatic inspection date tracking for Monthly Reports
  lastInspection: timestamp("last_inspection"),
  nextDue: timestamp("next_due"),
  // Hygiene Training tracking
  lastTraining: timestamp("last_training"),
  trainingNextDue: timestamp("training_next_due"),
  // Branch preferences - replace localStorage usage
  branchTheme: varchar("branch_theme").default("blue"), // Color theme for branch dashboard
  branchFontSize: varchar("branch_font_size").default("medium"), // Font size for branch dashboard
  branchPreferences: jsonb("branch_preferences").default("{}"), // Additional branch-specific preferences
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  title: varchar("title").notNull(),
  filename: varchar("filename").notNull(),
  filepath: varchar("filepath").notNull(),
  type: varchar("type").notNull(), // 'document', 'certificate', etc.
  category: varchar("category").notNull().default("general"),
  branchId: varchar("branch_id").references(() => branches.id),
  uploadedBy: varchar("uploaded_by").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  downloadedAt: timestamp("downloaded_at"),
  isDeleted: boolean("is_deleted").default(false),
  adminDeleted: boolean("admin_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  filename: varchar("filename").notNull(),
  filepath: varchar("filepath").notNull(),
  type: varchar("type").notNull(), // 'before', 'after'
  category: varchar("category").notNull().default("general"),
  branchId: varchar("branch_id").references(() => branches.id),
  uploadedBy: varchar("uploaded_by").notNull(),
  description: text("description"),
  notes: text("notes"),
  treatment: text("treatment"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  isDeleted: boolean("is_deleted").default(false), // Track if branch deleted from their view
  adminDeleted: boolean("admin_deleted").default(false), // Track if admin deleted from their view
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const links = pgTable("links", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  title: varchar("title").notNull(),
  url: text("url").notNull(),
  category: varchar("category").notNull().default("general"),
  branchId: varchar("branch_id").references(() => branches.id),
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  branchId: varchar("branch_id").references(() => branches.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("GBP"),
  status: varchar("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  method: varchar("method").notNull(), // 'card', 'bank_transfer', 'cash'
  description: text("description"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  branchId: varchar("branch_id").notNull().references(() => branches.id),
  message: text("message").notNull(),
  visitDate: varchar("visit_date").notNull(),
  visitTime: varchar("visit_time"),
  purposeOfVisit: text("purpose_of_visit").notNull(),
  visitTypes: text("visit_types").array(),
  sentAt: timestamp("sent_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pestControlRecords = pgTable("pest_control_records", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  branchId: varchar("branch_id").references(() => branches.id),
  visitDate: timestamp("visit_date"),
  inspector: varchar("inspector").notNull(),
  findings: text("findings"),
  recommendations: text("recommendations"),
  nextVisitDate: timestamp("next_visit_date"),
  severity: varchar("severity").notNull().default("low"), // 'low', 'medium', 'high', 'critical'
  status: varchar("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shopLayouts = pgTable("shop_layouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  elements: jsonb("elements").notNull(),
  dimensions: jsonb("dimensions").notNull(),
  branchId: varchar("branch_id").references(() => branches.id),
  createdBy: varchar("created_by").notNull(),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  layoutData: jsonb("layout_data"),
  isActive: boolean("is_active").default(false),
});

export const monthlyReports = pgTable("monthly_reports", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  title: varchar("title").notNull(),
  filename: varchar("filename").notNull(),
  filepath: varchar("filepath").notNull(),
  reportType: varchar("report_type").notNull().default("general"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  viewSize: varchar("view_size").default("A4"),
  branchId: varchar("branch_id").references(() => branches.id),
  uploadedBy: varchar("uploaded_by").notNull(),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at"),
  viewedAt: timestamp("viewed_at"),
  downloadedAt: timestamp("downloaded_at"),
  isDeleted: boolean("is_deleted").default(false),
  adminDeleted: boolean("admin_deleted").default(false),
  isInMyDocs: boolean("is_in_my_docs").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const yearlyDocs = pgTable("yearly_docs", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  title: varchar("title").notNull(),
  filename: varchar("filename").notNull(),
  filepath: varchar("filepath").notNull(),
  docType: varchar("doc_type").notNull().default("general"),
  description: text("description"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  viewSize: varchar("view_size").default("A4"),
  branchId: varchar("branch_id").references(() => branches.id),
  uploadedBy: varchar("uploaded_by").notNull(),
  issueDate: timestamp("issue_date"),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at"),
  viewedAt: timestamp("viewed_at"),
  downloadedAt: timestamp("downloaded_at"),
  isDeleted: boolean("is_deleted").default(false),
  adminDeleted: boolean("admin_deleted").default(false),
  isInMyDocs: boolean("is_in_my_docs").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pestControlDocs = pgTable("pest_control_docs", {
  id: varchar("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  title: varchar("title").notNull(),
  filename: varchar("filename").notNull(),
  filepath: varchar("filepath").notNull(),
  docType: varchar("doc_type").notNull().default("general"), // 'treatment-plan', 'inspection-report', 'certificate', 'guidelines'
  description: text("description"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  viewSize: varchar("view_size").default("A4"),
  branchId: varchar("branch_id").references(() => branches.id),
  uploadedBy: varchar("uploaded_by").notNull(),
  issueDate: timestamp("issue_date"),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at"),
  viewedAt: timestamp("viewed_at"),
  downloadedAt: timestamp("downloaded_at"),
  isDeleted: boolean("is_deleted").default(false),
  isInMyDocs: boolean("is_in_my_docs").default(false),
  adminDeleted: boolean("admin_deleted").default(false), // Track if admin deleted from their view
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comprehensive files table to index ALL uploaded files
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  filepath: varchar("filepath").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileType: varchar("file_type").notNull(), // 'image', 'document', 'pdf', 'excel', 'word'
  category: varchar("category").notNull().default("general"), // 'document', 'photo', 'logo', 'report', 'pest-control', 'yearly'
  title: varchar("title"),
  description: text("description"),
  branchId: varchar("branch_id").references(() => branches.id),
  uploadedBy: varchar("uploaded_by").notNull(),
  uploadSource: varchar("upload_source").notNull(), // 'admin', 'branch', 'system'
  isActive: boolean("is_active").default(true),
  isPermanent: boolean("is_permanent").default(true), // All files are permanent by default
  tags: text("tags").array(),
  metadata: jsonb("metadata"), // Additional file metadata
  checksum: varchar("checksum"), // File integrity verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas
export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertPestControlRecordSchema = createInsertSchema(pestControlRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopLayoutSchema = createInsertSchema(shopLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyReportSchema = createInsertSchema(monthlyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertYearlyDocSchema = createInsertSchema(yearlyDocs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPestControlDocSchema = createInsertSchema(pestControlDocs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  documents: many(documents, { relationName: "userDocuments" }),
  photos: many(photos, { relationName: "userPhotos" }),
  links: many(links, { relationName: "userLinks" }),
  notifications: many(notifications, { relationName: "userNotifications" }),
  pestControlRecords: many(pestControlRecords, { relationName: "userPestControl" }),
  shopLayouts: many(shopLayouts, { relationName: "userShopLayouts" }),
  monthlyReports: many(monthlyReports, { relationName: "userMonthlyReports" }),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  manager: one(users, {
    fields: [branches.managerId],
    references: [users.id],
  }),
  users: many(users),
  documents: many(documents),
  photos: many(photos),
  links: many(links),
  payments: many(payments),
  notifications: many(notifications),
  pestControlRecords: many(pestControlRecords),
  shopLayouts: many(shopLayouts),
  monthlyReports: many(monthlyReports),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  branch: one(branches, {
    fields: [documents.branchId],
    references: [branches.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  branch: one(branches, {
    fields: [photos.branchId],
    references: [branches.id],
  }),
  uploadedByUser: one(users, {
    fields: [photos.uploadedBy],
    references: [users.id],
  }),
}));

export const linksRelations = relations(links, ({ one }) => ({
  branch: one(branches, {
    fields: [links.branchId],
    references: [branches.id],
  }),
  uploadedByUser: one(users, {
    fields: [links.uploadedBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  branch: one(branches, {
    fields: [payments.branchId],
    references: [branches.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  branch: one(branches, {
    fields: [notifications.branchId],
    references: [branches.id],
  }),
}));

export const pestControlRecordsRelations = relations(pestControlRecords, ({ one }) => ({
  branch: one(branches, {
    fields: [pestControlRecords.branchId],
    references: [branches.id],
  }),
}));

export const shopLayoutsRelations = relations(shopLayouts, ({ one }) => ({
  branch: one(branches, {
    fields: [shopLayouts.branchId],
    references: [branches.id],
  }),
  createdByUser: one(users, {
    fields: [shopLayouts.createdBy],
    references: [users.id],
  }),
}));

export const monthlyReportsRelations = relations(monthlyReports, ({ one }) => ({
  branch: one(branches, {
    fields: [monthlyReports.branchId],
    references: [branches.id],
  }),
  uploadedByUser: one(users, {
    fields: [monthlyReports.uploadedBy],
    references: [users.id],
  }),
}));

export const yearlyDocsRelations = relations(yearlyDocs, ({ one }) => ({
  branch: one(branches, {
    fields: [yearlyDocs.branchId],
    references: [branches.id],
  }),
  uploadedByUser: one(users, {
    fields: [yearlyDocs.uploadedBy],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;



// Payment Tracker Tables
export const paymentRecords = pgTable("payment_records", {
  id: varchar("id").primaryKey().notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  paymentMethod: varchar("payment_method").notNull(),
  visitFrequency: varchar("visit_frequency").notNull(),
  paymentAgreement: varchar("payment_agreement").notNull(),
  createdBy: varchar("created_by").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentMessages = pgTable("payment_messages", {
  id: varchar("id").primaryKey().notNull(),
  paymentRecordId: varchar("payment_record_id").notNull().references(() => paymentRecords.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  messageType: varchar("message_type").notNull(), // price-agreed, payment-due, visit-reminder, overdue-warning
  messageContent: text("message_content").notNull(),
  isAutomatic: boolean("is_automatic").default(true),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = typeof paymentRecords.$inferInsert;
export type PaymentMessage = typeof paymentMessages.$inferSelect;
export type InsertPaymentMessage = typeof paymentMessages.$inferInsert;

// Useful Links table
export const usefulLinks = pgTable("useful_links", {
  id: varchar("id").primaryKey().notNull(),
  title: varchar("title").notNull(),
  url: varchar("url").notNull(),
  description: text("description"),
  branchId: uuid("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull(),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  clickedAt: timestamp("clicked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUsefulLinkSchema = createInsertSchema(usefulLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUsefulLink = typeof usefulLinks.$inferInsert;
export type UsefulLink = typeof usefulLinks.$inferSelect;
export type SelectUsefulLink = typeof usefulLinks.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Link = typeof links.$inferSelect;
export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type PestControlRecord = typeof pestControlRecords.$inferSelect;
export type InsertPestControlRecord = z.infer<typeof insertPestControlRecordSchema>;
export type ShopLayout = typeof shopLayouts.$inferSelect;
export type InsertShopLayout = z.infer<typeof insertShopLayoutSchema>;
export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
export type YearlyDoc = typeof yearlyDocs.$inferSelect;
export type InsertYearlyDoc = z.infer<typeof insertYearlyDocSchema>;
export type PestControlDoc = typeof pestControlDocs.$inferSelect;
export type InsertPestControlDoc = z.infer<typeof insertPestControlDocSchema>;

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type File = typeof files.$inferSelect;

// IoT Devices - assigned to branches
export const iotDevices = pgTable("iot_devices", {
  id: varchar("id").primaryKey().$defaultFn(() => randomUUID()),
  deviceId: varchar("device_id").notNull(),
  deviceName: varchar("device_name").notNull(),
  branchId: varchar("branch_id").notNull(),
  isOnline: boolean("is_online").default(false),
  alarmActive: boolean("alarm_active").default(false),
  lastStatus: jsonb("last_status").default("[]"),
  lastAlarmAt: timestamp("last_alarm_at"),
  lastCheckedAt: timestamp("last_checked_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIotDeviceSchema = createInsertSchema(iotDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type IotDevice = typeof iotDevices.$inferSelect;
export type InsertIotDevice = z.infer<typeof insertIotDeviceSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;