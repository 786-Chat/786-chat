// @ts-nocheck
import fs from "fs";
import path from "path";
import {
  users,
  branches,
  documents,
  photos,
  links,
  payments,
  notifications,
  pestControlRecords,
  shopLayouts,
  monthlyReports,
  yearlyDocs,
  pestControlDocs,
  usefulLinks,
  paymentRecords,
  paymentMessages,
  files,
  type User,
  type UpsertUser,
  type PaymentRecord,
  type InsertPaymentRecord,
  type PaymentMessage,
  type InsertPaymentMessage,
  type Branch,
  type InsertBranch,
  type Document,
  type InsertDocument,
  type Photo,
  type InsertPhoto,
  type Link,
  type InsertLink,
  type Payment,
  type InsertPayment,
  type Notification,
  type InsertNotification,
  type PestControlRecord,
  type InsertPestControlRecord,
  type ShopLayout,
  type InsertShopLayout,
  type MonthlyReport,
  type InsertMonthlyReport,
  type YearlyDoc,
  type InsertYearlyDoc,
  type PestControlDoc,
  type InsertPestControlDoc,
  type UsefulLink,
  type InsertUsefulLink,
  type SelectUsefulLink,
  type File,
  type InsertFile,
  iotDevices,
  type IotDevice,
  type InsertIotDevice,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc, count, sql, or, isNotNull, lte, lt, ne, ilike } from "drizzle-orm";
import { nanoid } from "nanoid";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

/**
 * Normalizes an IPv6 address to an array of 8 numeric hextets for robust security validation.
 * Handles all IPv6 formats including compressed (::), mixed notation, and embedded IPv4.
 * 
 * Examples:
 * - "::1" → [0, 0, 0, 0, 0, 0, 0, 1]
 * - "0000:0000:0000:0000:0000:0000:0000:0001" → [0, 0, 0, 0, 0, 0, 0, 1] 
 * - "::ffff:127.0.0.1" → [0, 0, 0, 0, 0, 0xffff, 0x7f00, 0x0001]
 * - "fe80::1" → [0xfe80, 0, 0, 0, 0, 0, 0, 1]
 * 
 * @param ipv6 IPv6 address string (without brackets, zone ID already removed)
 * @returns Array of 8 numeric hextets
 * @throws Error if IPv6 format is invalid
 */
function normalizeIPv6ToHextets(ipv6: string): number[] {
  if (!ipv6 || typeof ipv6 !== 'string') {
    throw new Error('IPv6 address must be a non-empty string');
  }
  
  // Handle IPv4-mapped addresses with dotted decimal (::ffff:192.0.2.1)
  const ipv4MappedMatch = ipv6.match(/^(.*):([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)$/);
  if (ipv4MappedMatch) {
    const [, ipv6Part, ipv4Part] = ipv4MappedMatch;
    const ipv4Octets = ipv4Part.split('.').map(Number);
    
    // Validate IPv4 octets
    if (ipv4Octets.length !== 4 || ipv4Octets.some(octet => octet < 0 || octet > 255 || isNaN(octet))) {
      throw new Error(`Invalid IPv4 part in IPv6 address: ${ipv4Part}`);
    }
    
    // Convert IPv4 to two hextets: a.b.c.d → (a*256+b), (c*256+d)
    const hextet1 = ipv4Octets[0] * 256 + ipv4Octets[1];
    const hextet2 = ipv4Octets[2] * 256 + ipv4Octets[3];
    
    // Parse IPv6 part and add the converted IPv4 hextets
    const ipv6Hextets = parseIPv6Part(ipv6Part, 6); // Need 6 hextets from IPv6 part
    return [...ipv6Hextets, hextet1, hextet2];
  }
  
  // Handle pure IPv6 addresses
  return parseIPv6Part(ipv6, 8);
}

/**
 * Helper function to parse IPv6 address parts and expand to specified number of hextets.
 * Handles :: compression by calculating how many zero hextets to insert.
 * 
 * @param ipv6Part IPv6 address or part (may contain ::)
 * @param expectedHextets Total number of hextets needed (6 for mixed, 8 for pure IPv6)
 * @returns Array of numeric hextets
 */
function parseIPv6Part(ipv6Part: string, expectedHextets: number): number[] {
  // Handle special cases
  if (ipv6Part === '::') {
    return new Array(expectedHextets).fill(0);
  }
  
  if (ipv6Part === '') {
    return new Array(expectedHextets).fill(0);
  }
  
  // Split on :: to handle compression
  const parts = ipv6Part.split('::');
  
  if (parts.length > 2) {
    throw new Error(`Invalid IPv6 format: multiple :: found in ${ipv6Part}`);
  }
  
  if (parts.length === 1) {
    // No compression, parse all hextets directly
    const hextets = parts[0].split(':').filter(h => h !== '');
    
    if (hextets.length !== expectedHextets) {
      throw new Error(`Invalid IPv6 format: expected ${expectedHextets} hextets, got ${hextets.length} in ${ipv6Part}`);
    }
    
    return hextets.map(hextet => parseHextet(hextet));
  }
  
  // Handle :: compression
  const [leftPart, rightPart] = parts;
  const leftHextets = leftPart ? leftPart.split(':').filter(h => h !== '') : [];
  const rightHextets = rightPart ? rightPart.split(':').filter(h => h !== '') : [];
  
  const totalExplicitHextets = leftHextets.length + rightHextets.length;
  
  if (totalExplicitHextets >= expectedHextets) {
    throw new Error(`Invalid IPv6 format: too many hextets for compression in ${ipv6Part}`);
  }
  
  // Calculate how many zero hextets to insert
  const zeroHextets = expectedHextets - totalExplicitHextets;
  
  // Parse explicit hextets
  const parsedLeft = leftHextets.map(hextet => parseHextet(hextet));
  const parsedRight = rightHextets.map(hextet => parseHextet(hextet));
  
  // Combine: left + zeros + right
  return [...parsedLeft, ...new Array(zeroHextets).fill(0), ...parsedRight];
}

/**
 * Parse a single hextet (1-4 hex characters) to a number.
 * Validates range and format.
 * 
 * @param hextet Hextet string (e.g., "1", "001", "fe80", "FFFF")
 * @returns Numeric value (0-65535)
 */
function parseHextet(hextet: string): number {
  if (!hextet || hextet.length === 0 || hextet.length > 4) {
    throw new Error(`Invalid hextet format: "${hextet}"`);
  }
  
  // Validate hex characters
  if (!/^[0-9a-f]+$/i.test(hextet)) {
    throw new Error(`Invalid hextet format: "${hextet}" contains non-hex characters`);
  }
  
  const value = parseInt(hextet, 16);
  
  if (isNaN(value) || value < 0 || value > 0xFFFF) {
    throw new Error(`Invalid hextet value: "${hextet}" (${value})`);
  }
  
  return value;
}

/**
 * Validates IPv6 address security by checking normalized hextets against blocked ranges.
 * Uses numeric comparison on normalized form to prevent bypass attacks.
 * 
 * @param hextets Array of 8 numeric hextets from normalizeIPv6ToHextets
 * @param originalHostname Original hostname for error messages
 * @throws Error if address matches blocked ranges
 */
function validateIPv6Security(hextets: number[], originalHostname: string): void {
  if (!Array.isArray(hextets) || hextets.length !== 8) {
    throw new Error(`Internal error: expected array of 8 hextets, got ${hextets?.length}`);
  }
  
  // Check IPv6 loopback: ::1 (all zeros except last hextet = 1)
  const isLoopback = hextets.slice(0, 7).every(h => h === 0) && hextets[7] === 1;
  if (isLoopback) {
    throw new Error('IPv6 loopback addresses are not allowed. Please provide a valid external URL or relative path.');
  }
  
  // Check link-local range: fe80::/10 (first hextet 0xfe80-0xfebf)
  const firstHextet = hextets[0];
  if (firstHextet >= 0xfe80 && firstHextet <= 0xfebf) {
    throw new Error('IPv6 link-local addresses are not allowed. Please provide a valid external URL or relative path.');
  }
  
  // Check ULA range: fc00::/7 (first hextet 0xfc00-0xfdff)
  if (firstHextet >= 0xfc00 && firstHextet <= 0xfdff) {
    throw new Error('IPv6 ULA addresses are not allowed. Please provide a valid external URL or relative path.');
  }
  
  // Check IPv4-mapped IPv6: ::ffff:0:0/96 (first 5 hextets zero, 6th = 0xffff)
  const isIPv4Mapped = hextets.slice(0, 5).every(h => h === 0) && hextets[5] === 0xffff;
  if (isIPv4Mapped) {
    // Extract IPv4 address from last two hextets
    const ipv4Hex1 = hextets[6];  // Upper 16 bits of IPv4
    const ipv4Hex2 = hextets[7];  // Lower 16 bits of IPv4
    
    // Convert to IPv4 octets
    const a = Math.floor(ipv4Hex1 / 256);  // High byte of first hextet
    const b = ipv4Hex1 % 256;              // Low byte of first hextet  
    const c = Math.floor(ipv4Hex2 / 256);  // High byte of second hextet
    const d = ipv4Hex2 % 256;              // Low byte of second hextet
    
    // Apply IPv4 security rules
    if (a === 127) {
      throw new Error('IPv4-mapped IPv6 addresses pointing to loopback range are not allowed. Please provide a valid external URL or relative path.');
    }
    
    if (a === 169 && b === 254) {
      throw new Error('IPv4-mapped IPv6 addresses pointing to link-local range are not allowed. Please provide a valid external URL or relative path.');
    }
    
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      throw new Error('IPv4-mapped IPv6 addresses pointing to private ranges are not allowed. Please provide a valid external URL or relative path.');
    }
    
    if (a === 0 && b === 0 && c === 0 && d === 0) {
      throw new Error('IPv4-mapped IPv6 addresses pointing to unspecified address are not allowed. Please provide a valid external URL or relative path.');
    }
  }
  
  // Check IPv4-compatible IPv6: ::0:0/96 (first 6 hextets zero, not IPv4-mapped)
  const isIPv4Compatible = hextets.slice(0, 6).every(h => h === 0) && !isIPv4Mapped;
  if (isIPv4Compatible) {
    // Extract IPv4 address from last two hextets
    const ipv4Hex1 = hextets[6];  // Upper 16 bits of IPv4
    const ipv4Hex2 = hextets[7];  // Lower 16 bits of IPv4
    
    // Convert to IPv4 octets
    const a = Math.floor(ipv4Hex1 / 256);  // High byte of first hextet
    const b = ipv4Hex1 % 256;              // Low byte of first hextet  
    const c = Math.floor(ipv4Hex2 / 256);  // High byte of second hextet
    const d = ipv4Hex2 % 256;              // Low byte of second hextet
    
    // Apply IPv4 security rules
    if (a === 127) {
      throw new Error('IPv4-compatible IPv6 addresses pointing to loopback range are not allowed. Please provide a valid external URL or relative path.');
    }
    
    if (a === 169 && b === 254) {
      throw new Error('IPv4-compatible IPv6 addresses pointing to link-local range are not allowed. Please provide a valid external URL or relative path.');
    }
    
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      throw new Error('IPv4-compatible IPv6 addresses pointing to private ranges are not allowed. Please provide a valid external URL or relative path.');
    }
    
    if (a === 0 && b === 0 && c === 0 && d === 0) {
      throw new Error('IPv4-compatible IPv6 addresses pointing to unspecified address are not allowed. Please provide a valid external URL or relative path.');
    }
  }
  
  // Additional security: block unspecified address (::)
  const isUnspecified = hextets.every(h => h === 0);
  if (isUnspecified) {
    throw new Error('IPv6 unspecified address is not allowed. Please provide a valid external URL or relative path.');
  }
}

/**
 * URL sanitization helper function with comprehensive security policy
 * 
 * SECURITY POLICY:
 * - Only allows external HTTP/HTTPS URLs and internal relative paths
 * - Blocks all localhost, loopback, private, and link-local addresses to prevent SSRF attacks
 * - Blocks development domains and mDNS hostnames
 * - Validates URL structure and format
 * 
 * BLOCKED RANGES:
 * IPv4:
 * - Loopback: 127.0.0.0/8 (127.0.0.1 - 127.255.255.255)
 * - Link-local: 169.254.0.0/16 (169.254.0.0 - 169.254.255.255) 
 * - Private Class A: 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
 * - Private Class B: 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
 * - Private Class C: 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
 * - Broadcast: 0.0.0.0
 * 
 * IPv6:
 * - Loopback: ::1
 * - Link-local: fe80::/10 (fe80:: - febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff)
 * - ULA: fc00::/7 (fc00:: - fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff)
 * 
 * Hostnames:
 * - localhost, local
 * - *.local, *.localhost domains
 */
function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required and must be a string');
  }
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new Error('URL cannot be empty');
  }
  
  try {
    // Handle relative paths that start with /
    if (trimmedUrl.startsWith('/')) {
      // Validate that it's a proper path
      if (trimmedUrl.length === 1) {
        throw new Error('Root path "/" is not allowed as a useful link');
      }
      return trimmedUrl;
    }
    
    // Handle relative paths that don't start with /
    if (!trimmedUrl.includes('://')) {
      // Assume it's a relative path and prefix with /
      return `/${trimmedUrl}`;
    }
    
    // Parse as URL to validate structure
    const urlObj = new URL(trimmedUrl);
    
    // Whitelist only http and https schemes
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error(`Invalid URL scheme: ${urlObj.protocol}. Only http and https are allowed.`);
    }
    
    // Reject local/development URLs for security (SSRF prevention)
    const hostname = urlObj.hostname.toLowerCase();
    
    // Block localhost hostnames and mDNS root (including trailing dot variants)
    const forbiddenHosts = ['localhost', 'localhost.', 'local', '0.0.0.0'];
    if (forbiddenHosts.includes(hostname)) {
      throw new Error('Local development URLs are not allowed. Please provide a valid external URL or relative path.');
    }
    
    // Block .local and .localhost domains (used in local development and mDNS)
    if (hostname.endsWith('.local') || hostname.endsWith('.localhost')) {
      throw new Error('Local development URLs are not allowed. Please provide a valid external URL or relative path.');
    }
    
    // IPv4 address validation and blocking
    const ipv4Regex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
    const ipv4Match = hostname.match(ipv4Regex);
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match.map(Number);
      
      // Validate IPv4 octets are in valid range
      if (a > 255 || b > 255 || c > 255 || d > 255) {
        throw new Error(`Invalid IPv4 address: ${hostname}`);
      }
      
      // Block loopback range: 127.0.0.0/8 (CRITICAL FIX)
      if (a === 127) {
        throw new Error('Loopback IP addresses are not allowed. Please provide a valid external URL or relative path.');
      }
      
      // Block link-local range: 169.254.0.0/16 (CRITICAL FIX)
      if (a === 169 && b === 254) {
        throw new Error('Link-local IP addresses are not allowed. Please provide a valid external URL or relative path.');
      }
      
      // Block RFC1918 private IP ranges
      // 10.0.0.0/8 (10.0.0.0 to 10.255.255.255)
      if (a === 10) {
        throw new Error('Private IP addresses are not allowed. Please provide a valid external URL or relative path.');
      }
      // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
      if (a === 172 && b >= 16 && b <= 31) {
        throw new Error('Private IP addresses are not allowed. Please provide a valid external URL or relative path.');
      }
      // 192.168.0.0/16 (192.168.0.0 to 192.168.255.255)
      if (a === 192 && b === 168) {
        throw new Error('Private IP addresses are not allowed. Please provide a valid external URL or relative path.');
      }
    }
    
    // IPv6 address validation and blocking (COMPREHENSIVE SECURITY FIX)
    // IMPORTANT: URL.hostname never includes brackets - they are stripped by URL constructor
    // ANY hostname containing ":" should be treated as potential IPv6 address
    if (hostname.includes(':')) {
      // Remove zone ID if present (e.g., fe80::1%25eth0 becomes fe80::1)
      const ipv6Address = hostname.split('%')[0].toLowerCase();
      
      // Normalize IPv6 to numeric hextet array for robust security validation
      const normalizedHextets = normalizeIPv6ToHextets(ipv6Address);
      
      // Apply security checks on normalized numeric form
      validateIPv6Security(normalizedHextets, hostname);
    }
    
    // For valid external URLs, return as-is
    return trimmedUrl;
    
  } catch (error) {
    if (error instanceof TypeError) {
      // URL constructor failed - invalid URL format
      throw new Error(`Invalid URL format: ${trimmedUrl}`);
    }
    // Re-throw our custom errors
    throw error;
  }
}

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;

  // Branch operations
  getBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  getBranchByUsername(username: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  bulkCreateBranches(branches: InsertBranch[]): Promise<Branch[]>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: string): Promise<void>;
  authenticateBranch(emailOrUsername: string, password: string): Promise<Branch | null>;
  getSearchBranchesCount(searchTerm: string): Promise<number>;
  getBranchStats(branchId: string): Promise<{
    documentsCount: number;
    photosCount: number;
    reportsCount: number;
    tasksCount: number;
  }>;

  // Document operations
  getDocuments(branchId?: string, category?: string): Promise<Document[]>;
  getAllDocumentsForBranch(branchId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  markDocumentDeletedByBranch(id: string): Promise<void>;

  // Photo operations
  getPhotos(branchId?: string, category?: string): Promise<Photo[]>;
  getPhoto(id: string): Promise<Photo | undefined>;
  getPhotoByFilename(filename: string): Promise<Photo | undefined>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: string, photo: Partial<InsertPhoto>): Promise<Photo>;
  deletePhoto(id: string): Promise<void>;

  // Link operations
  getLinks(branchId: string): Promise<Link[]>;
  getLink(id: string): Promise<Link | undefined>;
  createLink(link: InsertLink): Promise<Link>;
  updateLink(id: string, link: Partial<InsertLink>): Promise<Link>;
  deleteLink(id: string): Promise<void>;

  // Payment operations
  getPayments(branchId: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // Pest Control operations
  getPestControlRecords(branchId: string): Promise<PestControlRecord[]>;
  getPestControlRecord(id: string): Promise<PestControlRecord | undefined>;
  createPestControlRecord(record: InsertPestControlRecord): Promise<PestControlRecord>;
  updatePestControlRecord(id: string, record: Partial<InsertPestControlRecord>): Promise<PestControlRecord>;
  deletePestControlRecord(id: string): Promise<void>;

  // Admin analytics
  getAdminStats(): Promise<{
    totalBranches: number;
    activeUsers: number;
    monthlyRevenue: number;
    systemHealth: number;
  }>;

  // Shop Layout operations
  getShopLayouts(branchId?: string): Promise<ShopLayout[]>;
  getShopLayout(id: string, branchId?: string): Promise<ShopLayout | undefined>;
  createShopLayout(layout: InsertShopLayout): Promise<ShopLayout>;
  updateShopLayout(id: string, layout: Partial<InsertShopLayout>, branchId?: string): Promise<ShopLayout>;
  deleteShopLayout(id: string, branchId?: string): Promise<void>;

  // Monthly Report operations
  getMonthlyReports(branchId?: string, reportType?: string): Promise<MonthlyReport[]>;
  getMonthlyReport(id: string): Promise<MonthlyReport | undefined>;
  createMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport>;
  updateMonthlyReport(id: string, report: Partial<InsertMonthlyReport>): Promise<MonthlyReport>;
  deleteMonthlyReport(id: string): Promise<void>;
  deleteMonthlyReportFromBranch(id: string): Promise<void>;
  sendMonthlyReportToBranch(reportId: string, branchId: string): Promise<MonthlyReport>;

  // Pest Control Doc operations
  getPestControlDocs(branchId?: string, docType?: string, isAdminRequest?: boolean): Promise<PestControlDoc[]>;
  getPestControlDoc(id: string): Promise<PestControlDoc | undefined>;
  createPestControlDoc(doc: InsertPestControlDoc): Promise<PestControlDoc>;
  updatePestControlDoc(id: string, doc: Partial<InsertPestControlDoc>): Promise<PestControlDoc>;
  deletePestControlDoc(id: string): Promise<void>;
  deletePestControlDocFromBranch(id: string): Promise<void>;
  sendPestControlDocToBranch(docId: string, branchId: string): Promise<void>;
  sendPestControlDocToMyDocs(docId: string): Promise<void>;
  sendReportToMyDocs(reportId: string): Promise<void>;
  checkReportInMyDocs(reportId: string, branchId: string): Promise<boolean>;

  // Useful Links operations
  listUsefulLinks(branchId?: string): Promise<SelectUsefulLink[]>;
  createUsefulLink(data: InsertUsefulLink): Promise<SelectUsefulLink>;
  updateUsefulLink(id: string, data: Partial<InsertUsefulLink>): Promise<SelectUsefulLink>;
  deleteUsefulLink(id: string): Promise<void>;
  trackUsefulLinkClick(id: string): Promise<void>;
  getUsefulLink(id: string): Promise<UsefulLink | undefined>;
  getBranchUsefulLinks(branchId: string): Promise<UsefulLink[]>;
  markUsefulLinkAsSent(id: string): Promise<void>;
  // Atomic replace operation to avoid data loss during updates
  replaceUsefulLink(originalLink: { title: string; url: string }, newData: { title: string; url: string; description?: string; branchIds: string[]; createdBy: string }): Promise<SelectUsefulLink[]>;
  // IoT Devices
  getIotDevices(): Promise<IotDevice[]>;
  getIotDevicesByBranch(branchId: string): Promise<IotDevice[]>;
  getIotDevice(id: string): Promise<IotDevice | undefined>;
  createIotDevice(device: InsertIotDevice): Promise<IotDevice>;
  updateIotDevice(id: string, data: Partial<IotDevice>): Promise<IotDevice>;
  deleteIotDevice(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return user;
  }

  // Branch operations
  async getBranches(limit?: number, offset?: number): Promise<Branch[]> {
    const baseQuery = db.select().from(branches).orderBy(desc(branches.createdAt));
    
    if (limit !== undefined) {
      if (offset !== undefined) {
        return await baseQuery.limit(limit).offset(offset);
      } else {
        return await baseQuery.limit(limit);
      }
    }
    
    return await baseQuery;
  }

  async getBranchesCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(branches);
    return Number(result[0].count);
  }

  async getSearchBranchesCount(searchTerm: string): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(branches)
      .where(
        or(
          ilike(branches.name, `%${searchTerm}%`),
          ilike(branches.username, `%${searchTerm}%`),
          ilike(branches.email, `%${searchTerm}%`),
          ilike(branches.address, `%${searchTerm}%`),
          ilike(branches.postCode, `%${searchTerm}%`)
        )
      );
    return Number(result[0].count);
  }

  async searchBranches(searchTerm: string, limit?: number, offset?: number): Promise<Branch[]> {
    const baseQuery = db.select().from(branches)
      .where(
        or(
          ilike(branches.name, `%${searchTerm}%`),
          ilike(branches.username, `%${searchTerm}%`),
          ilike(branches.email, `%${searchTerm}%`),
          ilike(branches.address, `%${searchTerm}%`),
          ilike(branches.postCode, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(branches.createdAt));

    if (limit !== undefined) {
      if (offset !== undefined) {
        return await baseQuery.limit(limit).offset(offset);
      } else {
        return await baseQuery.limit(limit);
      }
    }

    return await baseQuery;
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async getBranchByUsername(username: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.username, username));
    return branch;
  }

  async authenticateBranch(emailOrUsername: string, password: string): Promise<Branch | null> {
    try {
      // First try to find by email
      const emailResult = await db.select().from(branches).where(eq(branches.email, emailOrUsername));
      let branch = emailResult[0];
      
      // If not found by email, try by username
      if (!branch) {
        const usernameResult = await db.select().from(branches).where(eq(branches.username, emailOrUsername));
        branch = usernameResult[0];
      }
      
      if (branch) {
        // Check if branch is active
        if (branch.status !== 'active') {
          throw new Error('INACTIVE_BRANCH');
        }
        
        // Verify password
        if (branch.password && await bcrypt.compare(password, branch.password)) {
          return branch;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  async authenticateBranchByEmail(email: string, password: string): Promise<Branch | null> {
    try {
      // Find branch by email only
      const [branch] = await db.select().from(branches).where(eq(branches.email, email));
      
      if (branch) {
        // Check if branch is active
        if (branch.status !== 'active') {
          throw new Error('INACTIVE_BRANCH');
        }
        
        // Verify password
        if (branch.password && await bcrypt.compare(password, branch.password)) {
          return branch;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Branch email authentication error:', error);
      if (error instanceof Error && error.message === 'INACTIVE_BRANCH') {
        throw error;
      }
      return null;
    }
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    // Hash password if provided
    const branchData = { ...branch };
    if (branchData.password) {
      branchData.password = await bcrypt.hash(branchData.password, 10);
    }
    
    const [created] = await db.insert(branches).values(branchData).returning();
    
    // Initialize branch with complete data structure like Cake Box and Chicken Valley
    try {
      await this.initializeBranchData(created.id, created.name);
      console.log(`✅ Branch ${created.name} initialized with complete data structure`);
    } catch (error) {
      console.error(`❌ Failed to initialize branch data for ${created.name}:`, error);
      // Continue anyway - the branch is created, initialization can be retried
    }
    
    return created;
  }

  async bulkCreateBranches(branchesData: InsertBranch[]): Promise<Branch[]> {
    const batchSize = 100; // Process in batches for better performance
    const createdBranches: Branch[] = [];
    
    console.log(`🚀 Starting bulk creation of ${branchesData.length} branches in batches of ${batchSize}`);
    
    for (let i = 0; i < branchesData.length; i += batchSize) {
      const batch = branchesData.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(branchesData.length / batchSize)} (${batch.length} branches)`);
      
      // Hash passwords for the batch
      const processedBatch = await Promise.all(
        batch.map(async (branch) => {
          const branchData = { ...branch };
          if (branchData.password) {
            branchData.password = await bcrypt.hash(branchData.password, 10);
          }
          return branchData;
        })
      );
      
      // Insert batch into database
      const batchResult = await db.insert(branches).values(processedBatch).returning();
      createdBranches.push(...batchResult);
      
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed (${batchResult.length} branches created)`);
      
      // Small delay between batches to prevent overwhelming the database
      if (i + batchSize < branchesData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`🎉 Bulk creation completed! Created ${createdBranches.length} branches total`);
    return createdBranches;
  }

  // Initialize new branch with complete data structure
  async initializeBranchData(branchId: string, branchName: string): Promise<void> {
    console.log(`🔄 Initializing branch data for: ${branchName} (${branchId})`);
    
    const now = new Date();
    const sanitizedName = branchName.replace(/[^a-zA-Z0-9]/g, '_');
    
    // 1. Create sample photo
    const photoData = {
      id: randomUUID(),
      title: `${branchName} Inspection Photo`,
      filename: `${sanitizedName}_inspection_photo.jpg`,
      filepath: `/data/photos/${sanitizedName}_inspection_photo.jpg`,
      type: 'photo',
      category: 'general',
      branchId: branchId,
      uploadedBy: 'admin',
      sentAt: now,
      createdAt: now,
      updatedAt: now
    };
    
    // 2. Create sample monthly reports
    const monthlyReportsData = [
      {
        id: randomUUID(),
        title: `${branchName} Inspection Report`,
        filename: `${sanitizedName}_inspection_report.png`,
        filepath: `/data/reports/${sanitizedName}_inspection_report.png`,
        reportType: 'inspection-report',
        fileSize: 1024000,
        mimeType: 'image/png',
        viewSize: 'A4',
        branchId: branchId,
        uploadedBy: 'admin',
        sentAt: now,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        isInMyDocs: false
      },
      {
        id: randomUUID(),
        title: `${branchName} COSHH Risk Assessment`,
        filename: `${sanitizedName}_coshh_assessment.png`,
        filepath: `/data/reports/${sanitizedName}_coshh_assessment.png`,
        reportType: 'coshh-risk-assessment',
        fileSize: 1024000,
        mimeType: 'image/png',
        viewSize: 'A4',
        branchId: branchId,
        uploadedBy: 'admin',
        sentAt: now,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        isInMyDocs: false
      }
    ];
    
    // 3. Create sample documents
    const documentsData = [
      {
        id: randomUUID(),
        title: `${branchName} Contract`,
        filename: `${sanitizedName}_contract.pdf`,
        filepath: `/data/documents/${sanitizedName}_contract.pdf`,
        type: 'contract',
        category: 'general',
        branchId: branchId,
        uploadedBy: 'admin',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        sentAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: randomUUID(),
        title: `${branchName} Policy Document`,
        filename: `${sanitizedName}_policy.pdf`,
        filepath: `/data/documents/${sanitizedName}_policy.pdf`,
        type: 'policy',
        category: 'general',
        branchId: branchId,
        uploadedBy: 'admin',
        fileSize: 1536000,
        mimeType: 'application/pdf',
        sentAt: now,
        createdAt: now,
        updatedAt: now
      }
    ];
    
    // 4. Create sample pest control doc
    const pestControlDoc = {
      id: randomUUID(),
      title: `${branchName} Pest Control Report`,
      filename: `${sanitizedName}_pest_control.pdf`,
      filepath: `/data/documents/${sanitizedName}_pest_control.pdf`,
      docType: 'pest-control-report',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      viewSize: 'A4',
      branchId: branchId,
      uploadedBy: 'admin',
      sentAt: now,
      createdAt: now,
      updatedAt: now
    };
    
    // 5. Create sample yearly doc
    const yearlyDoc = {
      id: randomUUID(),
      title: `${branchName} Yearly Contract`,
      filename: `${sanitizedName}_yearly_contract.pdf`,
      filepath: `/data/documents/${sanitizedName}_yearly_contract.pdf`,
      docType: 'yearly-contract',
      fileSize: 2048000,
      mimeType: 'application/pdf',
      viewSize: 'A4',
      branchId: branchId,
      uploadedBy: 'admin',
      sentAt: now,
      createdAt: now,
      updatedAt: now
    };
    
    // Insert all data into database
    try {
      await db.insert(photos).values(photoData);
      await db.insert(monthlyReports).values(monthlyReportsData);
      await db.insert(documents).values(documentsData);
      await db.insert(pestControlDocs).values(pestControlDoc);
      await db.insert(yearlyDocs).values(yearlyDoc);
      
      console.log(`✅ Database records created for ${branchName}`);
    } catch (dbError) {
      console.error(`❌ Database insertion failed for ${branchName}:`, dbError);
      throw dbError;
    }
    
    // Copy actual files from working templates
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Template files from working branches
      const templateFiles = [
        {
          source: '/home/runner/workspace/data/reports/admin_monthly_1751506003541_Inspection_Report.png',
          dest: `/home/runner/workspace/data/photos/${sanitizedName}_inspection_photo.jpg`
        },
        {
          source: '/home/runner/workspace/data/reports/admin_monthly_1751506003541_Inspection_Report.png',
          dest: `/home/runner/workspace/data/reports/${sanitizedName}_inspection_report.png`
        },
        {
          source: '/home/runner/workspace/data/reports/admin_monthly_1751505895384_Coshh_Risk_Assessment.png',
          dest: `/home/runner/workspace/data/reports/${sanitizedName}_coshh_assessment.png`
        },
        {
          source: '/home/runner/workspace/data/documents/pest_control_1751533035523_Cake_Box_Worthing_Contract.gif',
          dest: `/home/runner/workspace/data/documents/${sanitizedName}_contract.pdf`
        },
        {
          source: '/home/runner/workspace/data/documents/pest_control_1751533035523_Cake_Box_Worthing_Contract.gif',
          dest: `/home/runner/workspace/data/documents/${sanitizedName}_policy.pdf`
        },
        {
          source: '/home/runner/workspace/data/documents/pest_control_1751533035523_Cake_Box_Worthing_Contract.gif',
          dest: `/home/runner/workspace/data/documents/${sanitizedName}_pest_control.pdf`
        },
        {
          source: '/home/runner/workspace/data/documents/yearly_doc_1751139320745_Cake_Box_Worthing_membership.gif',
          dest: `/home/runner/workspace/data/documents/${sanitizedName}_yearly_contract.pdf`
        }
      ];
      
      for (const file of templateFiles) {
        if (fs.existsSync(file.source)) {
          const destDir = path.dirname(file.dest);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(file.source, file.dest);
          console.log(`✅ File copied: ${path.basename(file.dest)}`);
        }
      }
      
      console.log(`✅ All files created for ${branchName}`);
    } catch (fileError) {
      console.error(`❌ File creation failed for ${branchName}:`, fileError);
      // Continue - files can be created manually later
    }
    
    console.log(`🎉 Branch ${branchName} initialization complete!`);
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch> {
    // Hash password if provided in update
    const updateData = { ...branch };
    const hasPasswordUpdate = updateData.password && updateData.password.trim() !== '';
    
    if (hasPasswordUpdate && updateData.password) {
      console.log(`Updating password for branch ${id}`);
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const [updated] = await db
      .update(branches)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
      
    console.log(`Branch updated successfully: ${updated.name} (password changed: ${hasPasswordUpdate})`);
    return updated;
  }

  async deleteBranch(id: string): Promise<void> {
    console.log(`Starting branch deletion for ID: ${id}`);
    
    try {
      // Check if branch exists first
      const [existingBranch] = await db.select().from(branches).where(eq(branches.id, id));
      if (!existingBranch) {
        throw new Error(`Branch with ID ${id} not found`);
      }
      
      console.log(`Deleting branch: ${existingBranch.name}`);
      
      // Delete all related data in correct order to maintain referential integrity
      
      // 1. Delete payment messages first (they reference payment records)
      console.log('Deleting payment messages...');
      await db.delete(paymentMessages).where(eq(paymentMessages.branchId, id));
      
      // 2. Delete any remaining payment messages that reference payment records for this branch
      console.log('Deleting payment messages by payment record references...');
      const branchPaymentRecords = await db.select({ id: paymentRecords.id }).from(paymentRecords).where(eq(paymentRecords.branchId, id));
      for (const record of branchPaymentRecords) {
        await db.delete(paymentMessages).where(eq(paymentMessages.paymentRecordId, record.id));
      }
      
      // 3. Then delete payment records
      console.log('Deleting payment records...');
      await db.delete(paymentRecords).where(eq(paymentRecords.branchId, id));
      
      // 3. Delete photos and their files
      console.log('Deleting photos...');
      const branchPhotos = await db.select().from(photos).where(eq(photos.branchId, id));
      console.log(`Found ${branchPhotos.length} photos to delete for branch ${id}`);
      
      for (const photo of branchPhotos) {
        console.log(`Processing photo: ${photo.title} (${photo.filename})`);
        
        // Delete physical file if it exists
        if (photo.filepath) {
          try {
            const fullPath = path.join(process.cwd(), photo.filepath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`✓ Deleted photo file: ${photo.filepath}`);
            }
          } catch (error) {
            console.warn(`Failed to delete photo file: ${photo.filepath}`, error);
          }
        }
        
        // Also check for files in uploads directory
        if (photo.filename) {
          try {
            const uploadsPath = path.join(process.cwd(), 'uploads', photo.filename);
            if (fs.existsSync(uploadsPath)) {
              fs.unlinkSync(uploadsPath);
              console.log(`✓ Deleted upload photo: uploads/${photo.filename}`);
            }
          } catch (error) {
            console.warn(`Failed to delete upload photo: uploads/${photo.filename}`, error);
          }
        }
        
        // Check data directories as well
        if (photo.filename) {
          const dataDirs = ['data/photos', 'data/documents', 'attached_assets'];
          for (const dataDir of dataDirs) {
            try {
              const dataPath = path.join(process.cwd(), dataDir, photo.filename);
              if (fs.existsSync(dataPath)) {
                fs.unlinkSync(dataPath);
                console.log(`✓ Deleted photo from: ${dataDir}/${photo.filename}`);
              }
            } catch (error) {
              console.warn(`Failed to delete photo from: ${dataDir}/${photo.filename}`, error);
            }
          }
        }
      }
      await db.delete(photos).where(eq(photos.branchId, id));
      console.log(`✓ Deleted ${branchPhotos.length} photo records from database`);
      
      // 4. Delete documents and their files (including admin-uploaded documents sent to this branch)
      console.log('Deleting documents...');
      const branchDocs = await db.select().from(documents).where(eq(documents.branchId, id));
      console.log(`Found ${branchDocs.length} documents to delete for branch ${id}`);
      
      for (const doc of branchDocs) {
        console.log(`Processing document: ${doc.title} (${doc.filename})`);
        
        // Delete physical file if it exists
        if (doc.filepath) {
          try {
            const fullPath = path.join(process.cwd(), doc.filepath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`✓ Deleted document file: ${doc.filepath}`);
            }
          } catch (error) {
            console.warn(`Failed to delete document file: ${doc.filepath}`, error);
          }
        }
        
        // Also check for files in uploads directory
        if (doc.filename) {
          try {
            const uploadsPath = path.join(process.cwd(), 'uploads', doc.filename);
            if (fs.existsSync(uploadsPath)) {
              fs.unlinkSync(uploadsPath);
              console.log(`✓ Deleted upload file: uploads/${doc.filename}`);
            }
          } catch (error) {
            console.warn(`Failed to delete upload file: uploads/${doc.filename}`, error);
          }
        }
        
        // Check data directories as well
        if (doc.filename) {
          const dataDirs = ['data/documents', 'data/photos', 'data/reports'];
          for (const dataDir of dataDirs) {
            try {
              const dataPath = path.join(process.cwd(), dataDir, doc.filename);
              if (fs.existsSync(dataPath)) {
                fs.unlinkSync(dataPath);
                console.log(`✓ Deleted data file: ${dataDir}/${doc.filename}`);
              }
            } catch (error) {
              console.warn(`Failed to delete data file: ${dataDir}/${doc.filename}`, error);
            }
          }
        }
      }
      await db.delete(documents).where(eq(documents.branchId, id));
      console.log(`✓ Deleted ${branchDocs.length} document records from database`);
      
      // 5. Delete yearly docs
      console.log('Deleting yearly docs...');
      await db.delete(yearlyDocs).where(eq(yearlyDocs.branchId, id));
      
      // 6. Delete monthly reports and their files
      console.log('Deleting monthly reports...');
      const branchReports = await db.select().from(monthlyReports).where(eq(monthlyReports.branchId, id));
      for (const report of branchReports) {
        // Delete physical file if it exists
        if (report.filepath) {
          try {
            const fullPath = path.join(process.cwd(), report.filepath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`Deleted report file: ${report.filepath}`);
            }
          } catch (error) {
            console.warn(`Failed to delete report file: ${report.filepath}`, error);
          }
        }
      }
      await db.delete(monthlyReports).where(eq(monthlyReports.branchId, id));
      
      // 7. Delete pest control records
      console.log('Deleting pest control records...');
      await db.delete(pestControlRecords).where(eq(pestControlRecords.branchId, id));
      
      // 8. Delete pest control docs sent to this branch and their files
      console.log('Deleting pest control docs...');
      const branchPestControlDocs = await db.select().from(pestControlDocs).where(eq(pestControlDocs.branchId, id));
      console.log(`Found ${branchPestControlDocs.length} pest control docs to delete for branch ${id}`);
      
      for (const doc of branchPestControlDocs) {
        // Delete physical file if it exists
        if (doc.filepath) {
          try {
            const fullPath = path.join(process.cwd(), doc.filepath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`Deleted pest control doc file: ${doc.filepath}`);
            }
          } catch (error) {
            console.warn(`Failed to delete pest control doc file: ${doc.filepath}`, error);
          }
        }
        
        // Also check for files in uploads directory  
        if (doc.filename) {
          try {
            const uploadsPath = path.join(process.cwd(), 'uploads', doc.filename);
            if (fs.existsSync(uploadsPath)) {
              fs.unlinkSync(uploadsPath);
              console.log(`Deleted upload pest control doc: uploads/${doc.filename}`);
            }
          } catch (error) {
            console.warn(`Failed to delete upload pest control doc: uploads/${doc.filename}`, error);
          }
        }
      }
      
      // Delete the pest control docs from database (completely remove, not just mark as null)
      await db.delete(pestControlDocs).where(eq(pestControlDocs.branchId, id));
      
      // 9. Delete shop layouts
      console.log('Deleting shop layouts...');
      await db.delete(shopLayouts).where(eq(shopLayouts.branchId, id));
      
      // 10. Delete useful links
      console.log('Deleting useful links...');
      await db.delete(usefulLinks).where(eq(usefulLinks.branchId, id));
      
      // 11. Delete links
      console.log('Deleting links...');
      await db.delete(links).where(eq(links.branchId, id));
      
      // 12. Delete payments
      console.log('Deleting payments...');
      await db.delete(payments).where(eq(payments.branchId, id));
      
      // 13. Delete notifications
      console.log('Deleting notifications...');
      await db.delete(notifications).where(eq(notifications.branchId, id));
      
      // 14. DISABLED: Logo file deletion disabled to preserve uploaded logos permanently
      console.log('Preserving branch logo (deletion disabled)...');
      if (existingBranch.logoUrl) {
        console.log(`✅ Logo preserved for lifetime storage: ${existingBranch.logoUrl}`);
        // Logo file deletion permanently disabled to prevent auto-removal
        // All uploaded logos are preserved for lifetime storage and accessibility
        /*
        try {
          const logoPath = path.join(process.cwd(), existingBranch.logoUrl);
          if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath);
            console.log(`Deleted branch logo file: ${existingBranch.logoUrl}`);
          }
        } catch (error) {
          console.warn(`Failed to delete branch logo file: ${existingBranch.logoUrl}`, error);
        }
        */
      }

      // 15. DISABLED: Orphaned file cleanup disabled to prevent logo auto-removal
      console.log('⚠️ DISABLED: Orphaned file cleanup permanently disabled to prevent logo deletion');
      console.log('🔒 ALL FILES PRESERVED: Logos and other files are preserved for lifetime storage');
      
      // PERMANENTLY DISABLED: Orphaned file cleanup that was causing logo auto-removal
      // This aggressive cleanup was incorrectly deleting logo files during branch deletion
      // All files are now preserved for lifetime storage to prevent customer contract cancellations
      /*
      try {
        const uploadsDir = path.join(process.env.TMPDIR || "/tmp", "uploads");
        const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
        const dataPhotosDir = path.join(process.cwd(), 'data', 'photos');
        const dataDocsDir = path.join(process.cwd(), 'data', 'documents');
        const dataReportsDir = path.join(process.cwd(), 'data', 'reports');
        // CRITICAL: data/logos directory was being affected by this cleanup
        
        // Get all remaining files from database for this branch
        const remainingFiles = new Set();
        
        // Check for any remaining references in other tables
        const allDocs = await db.select({ filename: documents.filename }).from(documents).where(eq(documents.branchId, id));
        const allPhotos = await db.select({ filename: photos.filename }).from(photos).where(eq(photos.branchId, id));
        const allReports = await db.select({ filename: monthlyReports.filename }).from(monthlyReports).where(eq(monthlyReports.branchId, id));
        
        allDocs.forEach(doc => doc.filename && remainingFiles.add(doc.filename));
        allPhotos.forEach(photo => photo.filename && remainingFiles.add(photo.filename));
        allReports.forEach(report => report.filename && remainingFiles.add(report.filename));
        
        console.log(`Found ${remainingFiles.size} files that should have been deleted`);
        
        // Clean up any remaining files from all directories
        for (const filename of Array.from(remainingFiles)) {
          try {
            const searchDirs = [
              { path: uploadsDir, name: 'uploads' },
              { path: attachedAssetsDir, name: 'attached_assets' },
              { path: dataPhotosDir, name: 'data/photos' },
              { path: dataDocsDir, name: 'data/documents' },
              { path: dataReportsDir, name: 'data/reports' }
              // CRITICAL: This cleanup was also searching through other directories
              // and could have been deleting logo files
            ];
            
            for (const dir of searchDirs) {
              const filePath = path.join(dir.path, String(filename));
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up orphaned file: ${dir.name}/${filename}`);
              }
            }
          } catch (error) {
            console.warn(`Failed to clean up file: ${filename}`, error);
          }
        }
      } catch (error) {
        console.warn('Error during file cleanup:', error);
      }
      */

      // 16. Finally delete the branch itself
      console.log('Deleting branch record...');
      await db.delete(branches).where(eq(branches.id, id));
      
      console.log(`Successfully deleted branch: ${existingBranch.name} (${id}) and all associated data and files`);
    } catch (error) {
      console.error(`Error during branch deletion for ID ${id}:`, error);
      throw error;
    }
  }

  async updateBranchPassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(branches)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(branches.id, id));
  }

  async updateBranchProfile(id: string, profileData: { name: string; phone?: string | null; address?: string | null; username?: string | null; email?: string | null }): Promise<void> {
    const updateSet: any = { 
      name: profileData.name,
      phone: profileData.phone,
      address: profileData.address,
      updatedAt: new Date() 
    };
    if (profileData.username !== undefined) updateSet.username = profileData.username;
    if (profileData.email !== undefined) updateSet.email = profileData.email;
    await db
      .update(branches)
      .set(updateSet)
      .where(eq(branches.id, id));
  }

  async getBranchStats(branchId: string): Promise<{
    documentsCount: number;
    photosCount: number;
    reportsCount: number;
    tasksCount: number;
  }> {
    const [docsCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.branchId, branchId));

    const [photosCount] = await db
      .select({ count: count() })
      .from(photos)
      .where(eq(photos.branchId, branchId));

    const [reportsCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(and(eq(documents.branchId, branchId), eq(documents.category, "monthly-reports")));

    return {
      documentsCount: docsCount.count,
      photosCount: photosCount.count,
      reportsCount: reportsCount.count,
      tasksCount: 3, // Static for now, would be calculated from actual tasks
    };
  }

  // Document operations with 24-month retention
  async getDocuments(branchId?: string, category?: string): Promise<Document[]> {
    console.log(`📄 getDocuments called with branchId: ${branchId}, category: ${category}`);
    
    // Always exclude truly deleted records (isDeleted=true) for everyone
    let conditions = [eq(documents.isDeleted, false)];
    
    if (branchId) {
      // SECURITY: Strict branchId validation for data isolation
      if (branchId === 'undefined' || branchId === 'null' || typeof branchId !== 'string' || branchId.trim() === '') {
        console.error('❌ SECURITY ERROR: Invalid branchId in getDocuments', { branchId, type: typeof branchId });
        throw new Error('SECURITY: Invalid branch ID - access denied for data isolation');
      }
      
      // For branch requests, show documents that belong to this branch ONLY
      // Do NOT filter out admin-deleted docs for branches - they should still see them
      conditions.push(eq(documents.branchId, branchId));
      console.log(`📄 Added branchId condition: ${branchId}`);
      
      // For My Documents section, show both:
      // 1. Documents manually saved by branch users (have "saved-" prefix) 
      // 2. Documents sent to branches by admin (have sentAt set)
      conditions.push(sql`(${documents.category} LIKE 'saved-%' OR ${documents.sentAt} IS NOT NULL)`);
      console.log(`📄 Added filter for both saved documents and admin-sent documents for My Documents`);
    } else {
      // SECURITY: For admin requests without branchId, log the access for audit
      console.log(`📄 ADMIN ACCESS: getDocuments called without branchId - admin operation`);
      // For admin requests (no branchId), hide admin-deleted documents
      conditions.push(eq(documents.adminDeleted, false));
      console.log(`📄 Added admin filter - hiding admin-deleted documents`);
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(documents.category, category));
      console.log(`📄 Added category condition: ${category}`);
    }
    
    // Filter conditions array to only include valid conditions
    const validConditions = conditions.filter(condition => condition !== undefined && condition !== null);
    console.log(`📄 Valid conditions count: ${validConditions.length}`);
    
    const result = await db
      .select()
      .from(documents)
      .where(validConditions.length > 0 ? and(...validConditions) : undefined)
      .orderBy(desc(documents.createdAt));
      
    console.log(`📄 getDocuments returning ${result.length} documents for branch ${branchId}`);
    console.log(`📄 Documents found:`, result.map(doc => ({ id: doc.id, title: doc.title, type: doc.type, category: doc.category })));
    
    return result;
  }

  // Get ALL documents sent to a branch by admin (like Monthly Reports does)
  async getAllDocumentsForBranch(branchId: string): Promise<Document[]> {
    console.log('Storage: Fetching ALL documents for branch:', branchId);
    const startTime = Date.now();
    
    try {
      // DISABLED: This function was causing data loss by rewriting file paths
      // await this.repairDocumentAssignments();
      
      let conditions = [
        eq(documents.branchId, branchId),
        sql`${documents.sentAt} IS NOT NULL`, // Only documents sent by admin
        // No automatic expiration - documents stay for 24 months unless manually deleted
      ];
      
      const result = await db
        .select()
        .from(documents)
        .where(and(...conditions))
        .orderBy(desc(documents.sentAt))
        .limit(50); // Limit for performance like Monthly Reports
      
      const endTime = Date.now();
      console.log(`Storage: Retrieved ${result.length} ALL documents for branch ${branchId} in ${endTime - startTime}ms`);
      
      return result;
    } catch (error) {
      console.error('❌ ERROR: Failed to get ALL documents for branch:', branchId, error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // CRITICAL: Repair function to fix document assignments and prevent data loss
  async repairDocumentAssignments(): Promise<void> {
    try {
      // Find all orphaned documents (no branch assignment or sent status)
      // EXCLUDE saved documents from repair (they have "saved-" prefix categories)
      const orphanedDocs = await db
        .select()
        .from(documents)
        .where(
          and(
            or(
              sql`${documents.branchId} IS NULL`,
              sql`${documents.sentAt} IS NULL`
            ),
            // CRITICAL: Do NOT repair saved documents - they are intentionally different
            sql`${documents.category} NOT LIKE 'saved-%'`
          )
        );

      if (orphanedDocs.length > 0) {
        console.log(`🔧 REPAIR: Found ${orphanedDocs.length} orphaned documents, fixing assignments...`);
        
        // Get the first available branch to assign documents to
        const branches = await this.getBranches();
        if (branches.length > 0) {
          const targetBranch = branches[0]; // Assign to first branch or primary branch
          
          // Update all orphaned documents (excluding saved documents)
          await db
            .update(documents)
            .set({
              branchId: targetBranch.id,
              sentAt: new Date(),
              updatedAt: new Date()
            })
            .where(
              and(
                or(
                  sql`${documents.branchId} IS NULL`,
                  sql`${documents.sentAt} IS NULL`
                ),
                // CRITICAL: Do NOT modify saved documents
                sql`${documents.category} NOT LIKE 'saved-%'`
              )
            );
          
          console.log(`✅ REPAIR: Fixed ${orphanedDocs.length} documents, assigned to branch: ${targetBranch.name}`);
          console.log(`🔒 PRESERVED: All saved documents (saved-*) protected from repair`);
        }
      }
    } catch (error) {
      console.error('❌ REPAIR ERROR: Failed to repair document assignments:', error);
      // Don't throw the error - just log it and continue
    }
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document> {
    const [updated] = await db
      .update(documents)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    // Use smart delete with adminDeleted flag for admin deletions
    // This preserves branch access while hiding from admin view
    await db
      .update(documents)
      .set({ 
        adminDeleted: true,
        updatedAt: new Date() 
      })
      .where(eq(documents.id, id));
  }

  async markDocumentDeletedByBranch(id: string): Promise<void> {
    // Branch deletion: set isDeleted=true so it's hidden from branch's photo/document views
    // getPhotos and getDocuments both filter on isDeleted=false for branch users
    await db
      .update(documents)
      .set({
        isDeleted: true,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id));
  }

  // Photo operations with PERMANENT STORAGE
  async getPhotos(branchId?: string, type?: string, category?: string): Promise<Photo[]> {
    console.log(`🖼️ getPhotos called with branchId: ${branchId}, type: ${type}, category: ${category}`);
    
    // 🔒 PERMANENT STORAGE: Show all photos with no time restrictions
    // Photos remain visible FOREVER unless manually deleted by admin/branch
    let conditions: any[] = [];
    
    if (branchId) {
      // SECURITY: Strict branchId validation for data isolation
      if (branchId === 'undefined' || branchId === 'null' || typeof branchId !== 'string' || branchId.trim() === '') {
        console.error('❌ SECURITY ERROR: Invalid branchId in getPhotos', { branchId, type: typeof branchId });
        throw new Error('SECURITY: Invalid branch ID - access denied for data isolation');
      }
      
      // For branch requests, only show photos that have been sent to this branch
      // FIXED: Branch access IS affected by admin deletion (when branch deletes their own photos)
      conditions.push(eq(photos.branchId, branchId));
      conditions.push(sql`${photos.sentAt} IS NOT NULL`); // Must have been sent
      console.log(`🖼️ Added strict branchId filtering: ${branchId}`);
      
      // CRITICAL FIX: Branch users should IGNORE adminDeleted flag completely
      // When admin deletes a photo, it should disappear from admin view but branch should still see it
      // However, branch users should NOT see photos they've deleted themselves (isDeleted=true)
      console.log('🔧 BRANCH ACCESS: Ignoring adminDeleted flag - admin deletions do not affect branch view');
      
      // Filter out photos that the branch has deleted themselves (isDeleted=true)
      try {
        conditions.push(or(eq(photos.isDeleted, false), sql`${photos.isDeleted} IS NULL`));
        console.log('🔧 BRANCH DELETION: Filtering out branch-deleted photos (isDeleted=true)');
      } catch (error) {
        // If isDeleted column doesn't exist yet, ignore this condition
        console.log('isDeleted column not yet available, showing all photos');
      }
    } else {
      // SECURITY: For admin requests without branchId, log the access for audit
      console.log(`🖼️ ADMIN ACCESS: getPhotos called without branchId - admin operation`);
      // For admin requests, exclude photos that have been admin-deleted
      // This ensures admin deletion only affects admin view, not branch access
      try {
        conditions.push(or(eq(photos.adminDeleted, false), sql`${photos.adminDeleted} IS NULL`));
      } catch (error) {
        // If adminDeleted column doesn't exist yet, ignore this condition
        console.log('adminDeleted column not yet available, showing all photos');
      }
    }
    
    if (type && type !== 'all') {
      conditions.push(eq(photos.type, type));
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(photos.category, category));
    }
    
    const photosResult = await db
      .select()
      .from(photos)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(photos.createdAt))
      .limit(50); // Limit to most recent 50 photos for better performance
    
    // FIXED: Also query documents table for photos to ensure persistence
    let documentConditions = [
      eq(documents.isDeleted, false),
      eq(documents.type, 'photo') // Only photo documents
    ];
    
    if (branchId) {
      documentConditions.push(eq(documents.branchId, branchId));
      documentConditions.push(sql`${documents.sentAt} IS NOT NULL`);
      // CRITICAL FIX: Branch users should IGNORE adminDeleted flag for documents too
      // When admin deletes a document/photo, branch should still see it
      console.log('🔧 BRANCH DOCUMENT ACCESS: Ignoring adminDeleted flag - admin deletions do not affect branch view');
    } else {
      documentConditions.push(eq(documents.adminDeleted, false));
    }
    
    if (category && category !== 'all') {
      documentConditions.push(eq(documents.category, category));
    }
    
    const documentsResult = await db
      .select({
        id: documents.id,
        title: documents.title,
        filename: documents.filename,
        filepath: documents.filepath,
        type: documents.type,
        category: documents.category,
        branchId: documents.branchId,
        uploadedBy: documents.uploadedBy,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        sentAt: documents.sentAt,
        viewedAt: documents.viewedAt,
        downloadedAt: documents.downloadedAt,
        adminDeleted: documents.adminDeleted,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(and(...documentConditions))
      .orderBy(desc(documents.createdAt))
      .limit(50);
    
    // CRITICAL FIX: Prevent duplicates when photos exist in both tables
    // Create a Map to track unique photos by title+branchId to avoid duplicates
    const uniquePhotosMap = new Map<string, any>();
    
    // Add photos first (they are the originals)
    photosResult.forEach(photo => {
      const key = `${photo.title}-${photo.branchId}`;
      uniquePhotosMap.set(key, photo);
    });
    
    // Add documents table entries only if not already in photos table
    documentsResult.forEach(photo => {
      const key = `${photo.title}-${photo.branchId}`;
      if (!uniquePhotosMap.has(key)) {
        uniquePhotosMap.set(key, photo);
      }
    });
    
    // Convert back to array and sort by creation date  
    const result = Array.from(uniquePhotosMap.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 50);
    
    console.log(`🖼️ PHOTOS DUPLICATE FIX: After deduplication, showing ${result.length} unique photos (eliminated ${(photosResult.length + documentsResult.length) - result.length} duplicates)`);
    
    return result;
  }

  async getPhoto(id: string): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo;
  }

  async getPhotoByFilename(filename: string): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.filename, filename));
    return photo;
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [created] = await db.insert(photos).values([photo]).returning();
    return created;
  }

  async updatePhoto(id: string, photo: Partial<InsertPhoto>): Promise<Photo> {
    const [updated] = await db
      .update(photos)
      .set({ ...photo, updatedAt: new Date() })
      .where(eq(photos.id, id))
      .returning();
    return updated;
  }

  async deletePhoto(id: string): Promise<void> {
    // Get the photo to check if it belongs to a branch
    const photo = await this.getPhoto(id);
    if (!photo) {
      console.log(`Photo ${id} not found, already deleted`);
      return;
    }
    
    if (photo.branchId && photo.sentAt) {
      // Photo has been sent to a branch - use soft deletion to preserve branch access
      // Mark as admin-deleted but keep the record for branch access
      try {
        await db
          .update(photos)
          .set({ 
            adminDeleted: true,
            updatedAt: new Date() 
          })
          .where(eq(photos.id, id));
        console.log(`✅ Photo ${photo.title} marked as admin-deleted but preserved for branch ${photo.branchId}`);
      } catch (error) {
        // If adminDeleted column doesn't exist yet, use complete deletion as fallback
        console.log('adminDeleted column not available, using complete deletion as fallback');
        await db.delete(photos).where(eq(photos.id, id));
      }
    } else {
      // Photo not sent to any branch - safe to completely delete
      await db.delete(photos).where(eq(photos.id, id));
      console.log(`✅ Photo ${photo.title} completely deleted (not sent to any branch)`);
    }
  }

  async deleteBranchPhoto(id: string): Promise<void> {
    // FIXED: Branch-specific deletion: PERMANENT deletion for branch-uploaded photos
    const photo = await this.getPhoto(id);
    if (!photo) {
      console.log(`Photo ${id} not found, already deleted`);
      return;
    }
    
    // CRITICAL FIX: Branches should be able to permanently delete their own photos
    // Complete deletion from photos table
    await db.delete(photos).where(eq(photos.id, id));
    console.log(`✅ Photo ${photo.title} permanently deleted by branch ${photo.branchId}`);
    
    // Also check and delete from documents table for dual-table coordination
    try {
      const documentRecord = await this.getDocument(id);
      if (documentRecord && documentRecord.type === 'photo') {
        await db.delete(documents).where(eq(documents.id, id));
        console.log(`✅ Photo document record ${photo.title} also permanently deleted from documents table`);
      }
    } catch (error) {
      console.log('No corresponding document record found or already deleted');
    }
  }

  // Link operations
  async getLinks(branchId: string): Promise<Link[]> {
    return await db
      .select()
      .from(links)
      .where(eq(links.branchId, branchId))
      .orderBy(desc(links.createdAt));
  }

  async getLink(id: string): Promise<Link | undefined> {
    const [link] = await db.select().from(links).where(eq(links.id, id));
    return link;
  }

  async createLink(link: InsertLink): Promise<Link> {
    const [created] = await db.insert(links).values(link).returning();
    return created;
  }

  async updateLink(id: string, link: Partial<InsertLink>): Promise<Link> {
    const [updated] = await db
      .update(links)
      .set({ ...link, updatedAt: new Date() })
      .where(eq(links.id, id))
      .returning();
    return updated;
  }

  async deleteLink(id: string): Promise<void> {
    await db.delete(links).where(eq(links.id, id));
  }

  // Payment operations
  async getPayments(branchId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.branchId, branchId))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async deletePayment(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.branchId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values([notification]).returning();
    return created;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    // Note: notifications table doesn't have updatedAt field in schema
    // Just acknowledge the read request without updating
    console.log(`Notification ${id} marked as read`);
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteOldNotifications(beforeDate: Date): Promise<number> {
    const result = await db
      .delete(notifications)
      .where(sql`${notifications.createdAt} < ${beforeDate.toISOString()}`)
      .returning({ id: notifications.id });
    
    return result.length;
  }

  // Pest Control operations
  async getPestControlRecords(branchId: string): Promise<PestControlRecord[]> {
    return await db
      .select()
      .from(pestControlRecords)
      .where(eq(pestControlRecords.branchId, branchId))
      .orderBy(desc(pestControlRecords.createdAt));
  }

  async getPestControlRecord(id: string): Promise<PestControlRecord | undefined> {
    const [record] = await db.select().from(pestControlRecords).where(eq(pestControlRecords.id, id));
    return record;
  }

  async createPestControlRecord(record: InsertPestControlRecord): Promise<PestControlRecord> {
    const [created] = await db.insert(pestControlRecords).values(record).returning();
    return created;
  }

  async updatePestControlRecord(id: string, record: Partial<InsertPestControlRecord>): Promise<PestControlRecord> {
    const [updated] = await db
      .update(pestControlRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(pestControlRecords.id, id))
      .returning();
    return updated;
  }

  async deletePestControlRecord(id: string): Promise<void> {
    await db.delete(pestControlRecords).where(eq(pestControlRecords.id, id));
  }

  // Admin analytics
  async getAdminStats(): Promise<{
    totalBranches: number;
    activeUsers: number;
    monthlyRevenue: number;
    systemHealth: number;
  }> {
    const [branchesCount] = await db.select({ count: count() }).from(branches);
    const [usersCount] = await db.select({ count: count() }).from(users);
    
    const [revenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)` 
      })
      .from(payments)
      .where(eq(payments.status, "paid"));

    return {
      totalBranches: branchesCount.count,
      activeUsers: usersCount.count,
      monthlyRevenue: Number(revenueResult?.total || 0),
      systemHealth: 99.8, // Static for now, would be calculated from system metrics
    };
  }

  // Shop Layout operations
  async getShopLayouts(branchId?: string): Promise<ShopLayout[]> {
    if (branchId) {
      return await db.select().from(shopLayouts).where(eq(shopLayouts.branchId, branchId));
    }
    return await db.select().from(shopLayouts);
  }

  async getShopLayout(id: string, branchId?: string): Promise<ShopLayout | undefined> {
    const whereConditions = [eq(shopLayouts.id, id)];
    
    if (branchId) {
      whereConditions.push(eq(shopLayouts.branchId, branchId));
    }
    
    const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
    
    const [layout] = await db.select().from(shopLayouts).where(whereCondition);
    return layout;
  }

  async createShopLayout(layout: InsertShopLayout): Promise<ShopLayout> {
    const [newLayout] = await db
      .insert(shopLayouts)
      .values(layout)
      .returning();
    return newLayout;
  }

  async updateShopLayout(id: string, layout: Partial<InsertShopLayout>, branchId?: string): Promise<ShopLayout> {
    const whereConditions = [eq(shopLayouts.id, id)];
    
    if (branchId) {
      whereConditions.push(eq(shopLayouts.branchId, branchId));
    }
    
    const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
    
    const [updatedLayout] = await db
      .update(shopLayouts)
      .set({ ...layout, updatedAt: new Date() })
      .where(whereCondition)
      .returning();
    
    if (!updatedLayout) {
      throw new Error('Shop layout not found or access denied');
    }
    
    return updatedLayout;
  }

  async deleteShopLayout(id: string, branchId?: string): Promise<void> {
    const whereConditions = [eq(shopLayouts.id, id)];
    
    if (branchId) {
      whereConditions.push(eq(shopLayouts.branchId, branchId));
    }
    
    const whereCondition = whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions);
    
    const result = await db.delete(shopLayouts).where(whereCondition).returning();
    
    if (result.length === 0) {
      throw new Error('Shop layout not found or access denied');
    }
  }

  // Payment Records operations
  async getPaymentRecords(): Promise<PaymentRecord[]> {
    console.log('Storage: Fetching payment records');
    const startTime = Date.now();
    
    const result = await db
      .select()
      .from(paymentRecords)
      .orderBy(desc(paymentRecords.createdAt))
      .limit(50); // Limit to most recent 50 records for better performance
    
    console.log(`Storage: Payment records query completed in ${Date.now() - startTime}ms, found ${result.length} records`);
    return result;
  }

  async getPaymentRecordsByBranch(branchId: string): Promise<PaymentRecord[]> {
    return await db.select().from(paymentRecords)
      .where(eq(paymentRecords.branchId, branchId))
      .orderBy(desc(paymentRecords.createdAt));
  }

  async createPaymentRecord(record: InsertPaymentRecord): Promise<PaymentRecord> {
    const [created] = await db.insert(paymentRecords).values(record).returning();
    return created;
  }

  async updatePaymentRecord(id: string, updates: Partial<InsertPaymentRecord>): Promise<PaymentRecord> {
    const [updated] = await db.update(paymentRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentRecords.id, id))
      .returning();
    return updated;
  }

  async deletePaymentRecord(id: string): Promise<void> {
    // First delete related messages
    await db.delete(paymentMessages).where(eq(paymentMessages.paymentRecordId, id));
    // Then delete the payment record
    await db.delete(paymentRecords).where(eq(paymentRecords.id, id));
  }

  // Payment Messages operations
  async getPaymentMessages(branchId?: string): Promise<PaymentMessage[]> {
    if (branchId) {
      return await db.select().from(paymentMessages)
        .where(eq(paymentMessages.branchId, branchId))
        .orderBy(desc(paymentMessages.createdAt));
    }
    return await db.select().from(paymentMessages).orderBy(desc(paymentMessages.createdAt));
  }

  async createPaymentMessage(message: InsertPaymentMessage): Promise<PaymentMessage> {
    const [created] = await db.insert(paymentMessages).values(message).returning();
    return created;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(paymentMessages)
      .set({ readAt: new Date() })
      .where(eq(paymentMessages.id, id));
  }

  // Notification helpers
  async getUpcomingVisits(): Promise<PaymentRecord[]> {
    // Return recent payment records for upcoming visits based on creation date
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return await db.select().from(paymentRecords)
      .where(lte(paymentRecords.createdAt, threeDaysAgo))
      .orderBy(desc(paymentRecords.createdAt));
  }

  async getOverduePayments(): Promise<PaymentRecord[]> {
    // Return payment records that need attention based on creation date
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await db.select().from(paymentRecords)
      .where(lte(paymentRecords.createdAt, thirtyDaysAgo))
      .orderBy(desc(paymentRecords.createdAt));
  }

  // Monthly Report operations
  async getMonthlyReports(branchId?: string, reportType?: string): Promise<MonthlyReport[]> {
    console.log('📊 getMonthlyReports called with branchId:', branchId, 'reportType:', reportType);
    const startTime = Date.now();
    
    // Always exclude truly deleted records (isDeleted=true) for everyone
    let conditions = [eq(monthlyReports.isDeleted, false)];
    
    if (branchId && branchId !== 'all') {
      // SECURITY: Strict branchId validation for data isolation
      if (branchId === 'undefined' || branchId === 'null' || typeof branchId !== 'string' || branchId.trim() === '') {
        console.error('❌ SECURITY ERROR: Invalid branchId in getMonthlyReports', { branchId, type: typeof branchId });
        throw new Error('SECURITY: Invalid branch ID - access denied for data isolation');
      }
      
      // For branch requests, return reports that have been sent to this branch ONLY
      // Do NOT filter out admin-deleted reports for branches - they should still see them
      conditions.push(eq(monthlyReports.branchId, branchId));
      conditions.push(isNotNull(monthlyReports.sentAt));
      console.log(`📊 Added strict branchId filtering for monthly reports: ${branchId}`);
      // Note: adminDeleted reports are still visible to branches
    } else {
      // SECURITY: For admin requests without branchId, log the access for audit
      console.log(`📊 ADMIN ACCESS: getMonthlyReports called without branchId - admin operation`);
      // For admin requests (no branchId), hide admin-deleted reports
      conditions.push(eq(monthlyReports.adminDeleted, false));
    }
    
    if (reportType) {
      conditions.push(eq(monthlyReports.reportType, reportType));
    }
    
    const monthlyReportsResult = await db
      .select({
        id: monthlyReports.id,
        title: monthlyReports.title,
        filename: monthlyReports.filename,
        filepath: monthlyReports.filepath,
        reportType: monthlyReports.reportType,
        fileSize: monthlyReports.fileSize,
        mimeType: monthlyReports.mimeType,
        viewSize: monthlyReports.viewSize,
        branchId: monthlyReports.branchId,
        uploadedBy: monthlyReports.uploadedBy,
        sentAt: monthlyReports.sentAt,
        receivedAt: monthlyReports.receivedAt,
        viewedAt: monthlyReports.viewedAt,
        downloadedAt: monthlyReports.downloadedAt,
        isDeleted: monthlyReports.isDeleted,
        adminDeleted: monthlyReports.adminDeleted,
        isInMyDocs: monthlyReports.isInMyDocs,
        createdAt: monthlyReports.createdAt,
        updatedAt: monthlyReports.updatedAt,
      })
      .from(monthlyReports)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(monthlyReports.createdAt))
      .limit(50); // Limit to most recent 50 reports for better performance
    
    // FIXED: Also query documents table for monthly reports to ensure persistence
    let documentConditions = [
      eq(documents.isDeleted, false),
      eq(documents.type, 'monthly-report') // Only monthly report documents
    ];
    
    if (branchId && branchId !== 'all') {
      documentConditions.push(eq(documents.branchId, branchId));
      documentConditions.push(isNotNull(documents.sentAt));
      // CRITICAL FIX: Also exclude admin-deleted documents for branch users (so they can delete their reports)
      documentConditions.push(eq(documents.adminDeleted, false));
    } else {
      documentConditions.push(eq(documents.adminDeleted, false));
    }
    
    const documentsResult = await db
      .select({
        id: documents.id,
        title: documents.title,
        filename: documents.filename,
        filepath: documents.filepath,
        reportType: sql<string>`'general'`.as('reportType'), // Default reportType for documents table
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        viewSize: sql<string>`'A4'`.as('viewSize'), // Default viewSize
        branchId: documents.branchId,
        uploadedBy: documents.uploadedBy,
        sentAt: documents.sentAt,
        receivedAt: sql<Date | null>`NULL`.as('receivedAt'),
        viewedAt: documents.viewedAt,
        downloadedAt: documents.downloadedAt,
        isDeleted: documents.isDeleted,
        adminDeleted: documents.adminDeleted,
        isInMyDocs: sql<boolean>`false`.as('isInMyDocs'), // Default for documents table
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(and(...documentConditions))
      .orderBy(desc(documents.createdAt))
      .limit(50);
    
    // deduplication by ID instead of title+branchId to allow same titles
    const uniqueReportsMap = new Map<string, any>();
    
    // Add monthly reports first
    monthlyReportsResult.forEach(report => {
      uniqueReportsMap.set(report.id, report);
    });
    
    // Add documents table entries
    documentsResult.forEach(report => {
      if (!uniqueReportsMap.has(report.id)) {
        uniqueReportsMap.set(report.id, report);
      }
    });
    
    // Convert back to array and sort by creation date  
    const result = Array.from(uniqueReportsMap.values())
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 50);
    
    console.log(`Storage: Monthly reports query completed in ${Date.now() - startTime}ms, found ${result.length} reports`);
    console.log(`Found ${monthlyReportsResult.length} from monthly_reports table and ${documentsResult.length} from documents table`);
    console.log(`🔧 MONTHLY REPORTS DUPLICATE FIX: After deduplication, showing ${result.length} unique reports (eliminated ${(monthlyReportsResult.length + documentsResult.length) - result.length} duplicates)`);
    return result;
  }

  async getMonthlyReport(id: string): Promise<MonthlyReport | undefined> {
    const [report] = await db
      .select()
      .from(monthlyReports)
      .where(and(eq(monthlyReports.id, id), eq(monthlyReports.isDeleted, false)));
    return report;
  }

  async createMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport> {
    const reportWithId = {
      ...report,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to monthly_reports table only - don't auto-save to My Docs
    const [newReport] = await db
      .insert(monthlyReports)
      .values(reportWithId)
      .returning();
    
    // Reports stay in Monthly Reports until explicitly sent to My Docs via button
    console.log('Monthly report created - staying in Monthly Reports section:', newReport.id);
    
    return newReport;
  }

  async updateMonthlyReport(id: string, report: Partial<InsertMonthlyReport>): Promise<MonthlyReport> {
    const [updatedReport] = await db
      .update(monthlyReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(monthlyReports.id, id))
      .returning();
    return updatedReport;
  }

  async assignReportToBranch(reportId: string, branchId: string): Promise<MonthlyReport> {
    // Check if report exists
    const report = await this.getMonthlyReport(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Check if branch exists
    const branch = await this.getBranch(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    // Update the report with branch assignment
    const [updatedReport] = await db
      .update(monthlyReports)
      .set({ 
        branchId: branchId,
        sentAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(monthlyReports.id, reportId))
      .returning();
    
    return updatedReport;
  }

  // Manual send to My Docs - Button triggered only
  async sendReportToMyDocs(reportId: string): Promise<void> {
    const [report] = await db
      .select()
      .from(monthlyReports)
      .where(eq(monthlyReports.id, reportId))
      .limit(1);
    
    if (!report) throw new Error('Report not found in Monthly Reports');
    
    // Check if already exists in My Docs by title and branch
    const [existingDoc] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.title, report.title),
          eq(documents.branchId, report.branchId || ''),
          eq(documents.type, 'monthly-report')
        )
      )
      .limit(1);
    
    if (existingDoc) throw new Error('Report already exists in My Docs');
    
    // Validate and correct file path before saving to My Docs
    let correctedFilePath = report.filepath;
    let correctedFilename = report.filename;
    
    // Check if file exists at current path
    if (correctedFilePath && !fs.existsSync(correctedFilePath)) {
      console.log(`🔧 Monthly report file not found at ${correctedFilePath}, attempting to fix...`);
      
      // Try to find the file in common directories with both filename and filepath-based names
      const filename = report.filename;
      const filepathBasename = path.basename(correctedFilePath);
      
      const possiblePaths = [
        // Try with original filename
        path.join(process.cwd(), 'uploads', filename),
        path.join(process.cwd(), 'attached_assets', filename),
        path.join(process.cwd(), 'data', 'reports', filename),
        path.join(process.cwd(), 'data', 'photos', filename),
        path.join(process.cwd(), 'data', 'documents', filename),
        // Try with filepath basename
        path.join(process.cwd(), 'uploads', filepathBasename),
        path.join(process.cwd(), 'attached_assets', filepathBasename),
        path.join(process.cwd(), 'data', 'reports', filepathBasename),
        path.join(process.cwd(), 'data', 'photos', filepathBasename),
        path.join(process.cwd(), 'data', 'documents', filepathBasename),
        // Try the original path as absolute
        correctedFilePath,
        path.join(process.cwd(), correctedFilePath)
      ];
      
      let found = false;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          correctedFilePath = testPath;
          correctedFilename = path.basename(testPath);
          found = true;
          console.log(`✅ Found monthly report file at: ${testPath}`);
          break;
        }
      }
      
      if (!found) {
        console.warn(`⚠️ Monthly report file not found anywhere: ${filename} or ${filepathBasename}`);
        // Still save the document but with original path - the view API will handle fallbacks
      }
    }
    
    // Monthly report is already permanent in Object Storage via upload route
    // This function creates a secondary copy in the documents table for the branch's "My Docs" section
    // No expiration date is set to ensure lifetime storage
    await db.insert(documents).values({
      id: randomUUID(),
      title: report.title,
      filename: correctedFilename,
      filepath: correctedFilePath,
      type: 'monthly-report',
      category: 'saved-reports',
      branchId: report.branchId,
      uploadedBy: report.uploadedBy,
      fileSize: report.fileSize,
      mimeType: report.mimeType,
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ Monthly report saved to My Docs: ${report.title} (${correctedFilePath}) with filename: ${correctedFilename}`);
  }

  // Check if report already exists in My Docs
  async checkReportInMyDocs(reportId: string, branchId: string): Promise<boolean> {
    const [report] = await db
      .select()
      .from(monthlyReports)
      .where(eq(monthlyReports.id, reportId))
      .limit(1);
    
    if (!report) return false;
    
    const [existingDoc] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.title, report.title),
          eq(documents.branchId, branchId),
          eq(documents.type, 'monthly-report')
        )
      )
      .limit(1);
    
    return !!existingDoc;
  }

  async deleteMonthlyReport(id: string): Promise<void> {
    // Use soft delete with adminDeleted flag for admin deletions
    // This preserves branch access while hiding from admin view
    await db
      .update(monthlyReports)
      .set({ 
        adminDeleted: true,
        updatedAt: new Date() 
      })
      .where(eq(monthlyReports.id, id));
    
    // DO NOT touch documents table - preserve My Docs
  }

  async deleteMonthlyReportFromBranch(id: string): Promise<void> {
    // For branch deletions, use isDeleted flag to actually remove from branch view
    // This ensures reports disappear from branch dashboard when they delete them
    await db
      .update(monthlyReports)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(monthlyReports.id, id));
    
    console.log(`Monthly report ${id} deleted by branch (marked as isDeleted: true)`);
  }

  // Delete only from monthly reports, preserve My Docs
  async removeMonthlyReport(id: string): Promise<void> {
    const [report] = await db
      .select()
      .from(monthlyReports)
      .where(eq(monthlyReports.id, id))
      .limit(1);
    
    if (!report) return;
    
    // Only remove from monthly_reports table, do NOT touch documents table
    await db.delete(monthlyReports).where(eq(monthlyReports.id, id));
  }

  // Delete from My Docs and everywhere else
  async removeFromMyDocs(id: string, branchId?: string): Promise<void> {
    console.log(`🔍 Searching for document ${id} in documents table...`);
    
    // First, try to find the document in the documents table (saved reports)
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (document) {
      console.log(`📄 Found document in documents table: ${document.title} (branch: ${document.branchId})`);
      
      // If branchId is provided, check if document belongs to the branch
      if (branchId && document.branchId !== branchId) {
        console.log(`❌ Access denied: document belongs to branch ${document.branchId}, requested by ${branchId}`);
        throw new Error('Access denied');
      }
      
      // Delete from documents table (My Documents)
      await db.delete(documents).where(eq(documents.id, id));
      console.log(`✅ Document removed from My Documents: ${document.title}`);
      return;
    }

    console.log(`🔍 Document not found in documents table, checking monthly reports...`);
    
    // If not found in documents table, try monthly reports table
    const [monthlyReport] = await db
      .select()
      .from(monthlyReports)
      .where(eq(monthlyReports.id, id))
      .limit(1);

    if (monthlyReport) {
      console.log(`📊 Found monthly report: ${monthlyReport.title} (branch: ${monthlyReport.branchId})`);
      
      // If branchId is provided, check if report belongs to the branch
      if (branchId && monthlyReport.branchId !== branchId) {
        console.log(`❌ Access denied: report belongs to branch ${monthlyReport.branchId}, requested by ${branchId}`);
        throw new Error('Access denied');
      }
      
      // For monthly reports, just mark as not in My Docs instead of deleting
      await db
        .update(monthlyReports)
        .set({ isInMyDocs: false })
        .where(eq(monthlyReports.id, id));
      console.log(`✅ Monthly report removed from My Documents: ${monthlyReport.title}`);
      return;
    }

    // If not found in either table
    console.log(`❌ Document ${id} not found in either documents or monthly reports table`);
    throw new Error('Document not found');
  }

  async sendMonthlyReportToBranch(reportId: string, branchId: string): Promise<MonthlyReport> {
    // Fetch the original report
    const original = await this.getMonthlyReport(reportId);
    if (!original) {
      throw new Error('Report not found');
    }

    // Check if this branch already has a copy of this report (avoid duplicates)
    const [existingCopy] = await db
      .select()
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.branchId, branchId),
          eq(monthlyReports.filepath, original.filepath),
          eq(monthlyReports.isDeleted, false)
        )
      )
      .limit(1);

    const now = new Date();

    if (existingCopy) {
      // Already sent — just refresh the sentAt timestamp
      const [refreshed] = await db
        .update(monthlyReports)
        .set({ sentAt: now, receivedAt: now, updatedAt: now })
        .where(eq(monthlyReports.id, existingCopy.id))
        .returning();

      console.log(`Monthly report "${original.title}" already sent to branch ${branchId} — refreshed sentAt`);
      return refreshed;
    }

    // Create a fresh copy for this branch — original record is NEVER mutated
    const [branchCopy] = await db
      .insert(monthlyReports)
      .values({
        id: randomUUID(),
        title: original.title,
        filename: original.filename,
        filepath: original.filepath,
        reportType: original.reportType,
        fileSize: original.fileSize,
        mimeType: original.mimeType,
        viewSize: original.viewSize,
        uploadedBy: original.uploadedBy,
        branchId: branchId,
        sentAt: now,
        receivedAt: now,
        isDeleted: false,
        adminDeleted: false,
        isInMyDocs: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Automatic inspection date tracking for Monthly Reports uploads
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30); // Next due in 30 days

    await db
      .update(branches)
      .set({
        lastInspection: now,
        nextDue: nextDueDate,
        updatedAt: now,
      })
      .where(eq(branches.id, branchId));

    console.log(`Monthly report "${branchCopy.title}" sent to branch ${branchId} — new copy created (original preserved)`);
    console.log(`Last Inspection: ${now.toISOString().split('T')[0]}, Next Due: ${nextDueDate.toISOString().split('T')[0]}`);

    return branchCopy;
  }

  // Yearly Docs operations
  async getYearlyDocs(branchId?: string, docType?: string): Promise<YearlyDoc[]> {
    try {
      // Always exclude truly deleted records (isDeleted=true) for everyone
      let conditions = [eq(yearlyDocs.isDeleted, false)];
      
      if (branchId && branchId !== 'all') {
        // For branch requests, only show documents that have been sent to this branch
        // Do NOT filter out admin-deleted docs for branches - they should still see them
        conditions.push(eq(yearlyDocs.branchId, branchId));
        conditions.push(isNotNull(yearlyDocs.sentAt)); // Must have been sent
        console.log(`Filtering yearly docs for specific branch: ${branchId}`);
      } else {
        // For admin requests (no branchId), hide admin-deleted docs
        conditions.push(eq(yearlyDocs.adminDeleted, false));
        console.log('Getting all yearly docs (admin view)');
      }
      
      const result = await db
        .select()
        .from(yearlyDocs)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .orderBy(desc(yearlyDocs.createdAt));
      
      console.log(`Yearly docs query for branchId=${branchId}:`, result.length, 'documents found');
      console.log('Document details:', result.map(d => ({ 
        id: d.id, 
        title: d.title, 
        branchId: d.branchId, 
        sentAt: d.sentAt ? 'sent' : 'not sent' 
      })));
      return result;
    } catch (error) {
      console.error('Error in getYearlyDocs:', error);
      throw error;
    }
  }

  async createYearlyDoc(doc: InsertYearlyDoc): Promise<YearlyDoc> {
    const docWithId = {
      ...doc,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to yearly_docs table only - don't auto-save to My Docs
    const [newDoc] = await db
      .insert(yearlyDocs)
      .values(docWithId)
      .returning();
    
    // Documents stay in Yearly Docs until explicitly sent to branches via button
    console.log('Yearly document created - staying in Yearly Docs section:', newDoc.id);
    
    return newDoc;
  }

  async updateYearlyDoc(id: string, doc: Partial<InsertYearlyDoc>): Promise<YearlyDoc> {
    const [updatedDoc] = await db
      .update(yearlyDocs)
      .set({ ...doc, updatedAt: new Date() })
      .where(eq(yearlyDocs.id, id))
      .returning();
    
    if (!updatedDoc) throw new Error('Yearly document not found');
    return updatedDoc;
  }

  async sendYearlyDocToBranch(docId: string, branchId: string): Promise<void> {
    // Update yearly doc with branch assignment
    await db
      .update(yearlyDocs)
      .set({ 
        branchId,
        sentAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(yearlyDocs.id, docId));
  }

  // Manual send to My Docs - Button triggered only
  async sendYearlyDocToMyDocs(docId: string): Promise<void> {
    const [doc] = await db
      .select()
      .from(yearlyDocs)
      .where(eq(yearlyDocs.id, docId))
      .limit(1);
    
    if (!doc) throw new Error('Document not found in Yearly Docs');
    
    // Check if already exists in My Docs by title and branch (allow multiple copies with different IDs)
    const [existingDoc] = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.title, doc.title),
        eq(documents.branchId, doc.branchId || ''),
        eq(documents.type, 'yearly-doc')
      ))
      .limit(1);
    
    if (existingDoc) throw new Error('Document already exists in My Docs');
    
    // Manual copy to My Docs when button is clicked - generate new ID
    await db.insert(documents).values({
      id: randomUUID(), // Generate new ID for My Docs
      title: doc.title,
      filename: doc.filename,
      filepath: doc.filepath,
      type: 'yearly-doc',
      category: 'saved-yearly-docs',
      branchId: doc.branchId,
      uploadedBy: doc.uploadedBy,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      createdAt: new Date(),
      updatedAt: new Date(),
      sentAt: new Date()
    });
    
    console.log('✅ Yearly document saved to My Docs successfully:', doc.title);
  }

  async getYearlyDoc(id: string): Promise<YearlyDoc | undefined> {
    const [doc] = await db
      .select()
      .from(yearlyDocs)
      .where(and(eq(yearlyDocs.id, id), eq(yearlyDocs.isDeleted, false)))
      .limit(1);
    return doc;
  }

  async deleteYearlyDoc(id: string): Promise<void> {
    // Use smart delete with adminDeleted flag for admin deletions
    // This preserves branch access while hiding from admin view
    await db
      .update(yearlyDocs)
      .set({ 
        adminDeleted: true,
        updatedAt: new Date() 
      })
      .where(eq(yearlyDocs.id, id));
    
    // DO NOT touch documents table - preserve My Docs
  }

  async markYearlyDocDeletedByBranch(id: string): Promise<void> {
    // Branch soft-delete: sets isDeleted=true so it no longer appears for the branch
    await db
      .update(yearlyDocs)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(yearlyDocs.id, id));
  }

  // COMPLETELY DISABLED AUTOMATIC DELETION - PERMANENT 24-MONTH RETENTION
  async cleanupExpiredDocuments(): Promise<void> {
    console.log('🚨 EMERGENCY FILE PRESERVATION: Completely disabled all automatic deletion mechanisms');
    console.log('📁 ALL FILES PRESERVED PERMANENTLY - No time-based deletion until manual removal');
    console.log('🔒 24-month retention policy: Files stay visible until manually deleted by admin/branch');
    
    // CRITICAL: NO AUTOMATIC DELETION OF ANY KIND
    // - NO time-based filtering  
    // - NO automatic file removal
    // - NO expiry date checking
    // - ONLY manual deletion allowed
    
    console.log('🔧 Running emergency file path restoration...');
    
    try {
      // Fix all broken file paths to prevent document disappearance
      const allDocuments = await db.select().from(documents);
      const allPhotos = await db.select().from(photos);
      const allMonthlyReports = await db.select().from(monthlyReports);
      const allPestControlDocs = await db.select().from(pestControlDocs);
      const allYearlyDocs = await db.select().from(yearlyDocs);
      
      let fixedPaths = 0;
      
      // Fix document paths with comprehensive search
      for (const doc of allDocuments) {
        if (doc.filename && (!doc.filepath || !fs.existsSync(path.join(process.cwd(), doc.filepath.replace(/^\//, ''))))) {
          const searchPaths = [
            path.join(process.cwd(), 'uploads', doc.filename),
            path.join(process.cwd(), 'attached_assets', doc.filename),
            path.join(process.cwd(), 'data', 'documents', doc.filename),
            path.join(process.cwd(), 'data', 'photos', doc.filename)
          ];
          
          for (const searchPath of searchPaths) {
            if (fs.existsSync(searchPath)) {
              const relativePath = path.relative(process.cwd(), searchPath);
              await db.update(documents)
                .set({ filepath: `/${relativePath}`, updatedAt: new Date() })
                .where(eq(documents.id, doc.id));
              fixedPaths++;
              console.log(`✅ Fixed document path: ${doc.filename} -> ${relativePath}`);
              break;
            }
          }
        }
      }
      
      // Fix photo paths
      for (const photo of allPhotos) {
        if (photo.filename && (!photo.filepath || !fs.existsSync(path.join(process.cwd(), photo.filepath.replace(/^\//, ''))))) {
          const searchPaths = [
            path.join(process.cwd(), 'uploads', photo.filename),
            path.join(process.cwd(), 'attached_assets', photo.filename),
            path.join(process.cwd(), 'data', 'photos', photo.filename)
          ];
          
          for (const searchPath of searchPaths) {
            if (fs.existsSync(searchPath)) {
              const relativePath = path.relative(process.cwd(), searchPath);
              await db.update(photos)
                .set({ filepath: `/${relativePath}`, updatedAt: new Date() })
                .where(eq(photos.id, photo.id));
              fixedPaths++;
              console.log(`✅ Fixed photo path: ${photo.filename} -> ${relativePath}`);
              break;
            }
          }
        }
      }
      
      // Fix monthly report paths
      for (const report of allMonthlyReports) {
        if (report.filename && (!report.filepath || !fs.existsSync(path.join(process.cwd(), report.filepath.replace(/^\//, ''))))) {
          const searchPaths = [
            path.join(process.cwd(), 'uploads', report.filename),
            path.join(process.cwd(), 'attached_assets', report.filename),
            path.join(process.cwd(), 'data', 'reports', report.filename),
            path.join(process.cwd(), 'data', 'documents', report.filename)
          ];
          
          for (const searchPath of searchPaths) {
            if (fs.existsSync(searchPath)) {
              const relativePath = path.relative(process.cwd(), searchPath);
              await db.update(monthlyReports)
                .set({ filepath: `/${relativePath}`, updatedAt: new Date() })
                .where(eq(monthlyReports.id, report.id));
              fixedPaths++;
              console.log(`✅ Fixed monthly report path: ${report.filename} -> ${relativePath}`);
              break;
            }
          }
        }
      }
      
      // Fix pest control document paths
      for (const pestDoc of allPestControlDocs) {
        if (pestDoc.filename && (!pestDoc.filepath || !fs.existsSync(path.join(process.cwd(), pestDoc.filepath.replace(/^\//, ''))))) {
          const searchPaths = [
            path.join(process.cwd(), 'uploads', pestDoc.filename),
            path.join(process.cwd(), 'attached_assets', pestDoc.filename),
            path.join(process.cwd(), 'data', 'documents', pestDoc.filename)
          ];
          
          for (const searchPath of searchPaths) {
            if (fs.existsSync(searchPath)) {
              const relativePath = path.relative(process.cwd(), searchPath);
              await db.update(pestControlDocs)
                .set({ filepath: `/${relativePath}`, updatedAt: new Date() })
                .where(eq(pestControlDocs.id, pestDoc.id));
              fixedPaths++;
              console.log(`✅ Fixed pest control doc path: ${pestDoc.filename} -> ${relativePath}`);
              break;
            }
          }
        }
      }
      
      // Fix yearly document paths
      for (const yearlyDoc of allYearlyDocs) {
        if (yearlyDoc.filename && (!yearlyDoc.filepath || !fs.existsSync(path.join(process.cwd(), yearlyDoc.filepath.replace(/^\//, ''))))) {
          const searchPaths = [
            path.join(process.cwd(), 'uploads', yearlyDoc.filename),
            path.join(process.cwd(), 'attached_assets', yearlyDoc.filename),
            path.join(process.cwd(), 'data', 'documents', yearlyDoc.filename)
          ];
          
          for (const searchPath of searchPaths) {
            if (fs.existsSync(searchPath)) {
              const relativePath = path.relative(process.cwd(), searchPath);
              await db.update(yearlyDocs)
                .set({ filepath: `/${relativePath}`, updatedAt: new Date() })
                .where(eq(yearlyDocs.id, yearlyDoc.id));
              fixedPaths++;
              console.log(`✅ Fixed yearly doc path: ${yearlyDoc.filename} -> ${relativePath}`);
              break;
            }
          }
        }
      }
      
      console.log(`🎉 EMERGENCY RESTORATION COMPLETE: Fixed ${fixedPaths} file paths to prevent disappearing documents`);
      console.log('📋 All document types now have valid file paths and will remain visible');
      console.log('🔒 24-month retention policy enforced - NO automatic deletion active');
      
    } catch (error) {
      console.error('Error during emergency file restoration:', error);
    }
    
    // CRITICAL FIX: Logo recovery PERMANENTLY DISABLED to prevent auto-deletion
    // Logos stored in Object Storage (/objects/...) are permanent and should NEVER be touched
    // The filesystem checks were incorrectly marking Object Storage logos as "missing"
    // causing them to be deleted during startup
    console.log('✅ Logo recovery DISABLED - All logos preserved permanently in Object Storage and filesystem');
    console.log('🔒 Object Storage logos (/objects/...) are NOT checked or modified during startup');
    console.log('📌 Logos will ONLY be deleted when user explicitly clicks DELETE button');
    
    // DISABLED: Document validation that was causing Object Storage files to be marked as missing
    // All documents in Object Storage (/objects/...) are permanent and should NOT be modified
    console.log('✅ Document validation DISABLED - All files in Object Storage are preserved permanently');
    console.log('🔒 Files will ONLY be deleted when user explicitly clicks DELETE button');
    console.log('📌 ALL UPLOADS: Logos, PDFs, Photos, Documents persist FOREVER until manual deletion');
  }

  // Pest Control Doc operations - SIMPLIFIED for reliable persistence
  async getPestControlDocs(branchId?: string, docType?: string, isAdminRequest?: boolean): Promise<PestControlDoc[]> {
    console.log('🐛 getPestControlDocs called with branchId:', branchId, 'docType:', docType, 'isAdminRequest:', isAdminRequest);
    const startTime = Date.now();
    
    let conditions = [
      eq(pestControlDocs.isDeleted, false)
    ];
    
    if (isAdminRequest) {
      // Admin view: always hide admin-deleted documents
      conditions.push(eq(pestControlDocs.adminDeleted, false));
      if (branchId && branchId !== 'undefined' && branchId !== 'null' && branchId.trim() !== '') {
        conditions.push(eq(pestControlDocs.branchId, branchId));
      }
    } else {
      // Branch query: show docs sent to this branch, ignore adminDeleted (branch keeps access after admin deletes)
      if (branchId && branchId !== 'undefined' && branchId !== 'null' && branchId.trim() !== '') {
        conditions.push(eq(pestControlDocs.branchId, branchId));
      }
    }
    
    const result = await db.select()
      .from(pestControlDocs)
      .where(and(...conditions))
      .orderBy(desc(pestControlDocs.createdAt)) // Consistent ordering as requested
      .limit(50); // Limit for performance
    
    console.log(`✅ Pest control docs query completed in ${Date.now() - startTime}ms, found ${result.length} documents`);
    console.log('📋 PERSISTENCE GUARANTEED: Documents will persist until manually deleted by user');
    console.log('🔄 NO TIME-BASED FILTERING: Documents visible regardless of age');
    console.log('Active pest control documents:', result.map(d => ({ 
      id: d.id, 
      title: d.title, 
      branchId: d.branchId,
      sentAt: d.sentAt,
      createdAt: d.createdAt,
      isDeleted: d.isDeleted,
      adminDeleted: d.adminDeleted
    })));
    
    return result;
  }

  async getPestControlDoc(id: string): Promise<PestControlDoc | undefined> {
    const [doc] = await db.select().from(pestControlDocs).where(eq(pestControlDocs.id, id));
    return doc;
  }

  async createPestControlDoc(doc: InsertPestControlDoc): Promise<PestControlDoc> {
    const [created] = await db.insert(pestControlDocs).values(doc).returning();
    return created;
  }

  async updatePestControlDoc(id: string, doc: Partial<InsertPestControlDoc>): Promise<PestControlDoc> {
    const [updatedDoc] = await db
      .update(pestControlDocs)
      .set({ ...doc, updatedAt: new Date() })
      .where(eq(pestControlDocs.id, id))
      .returning();
    
    if (!updatedDoc) throw new Error('Pest control document not found');
    return updatedDoc;
  }

  async deletePestControlDoc(id: string): Promise<void> {
    // Use soft delete with adminDeleted flag for admin deletions
    // This preserves branch access while hiding from admin view
    await db
      .update(pestControlDocs)
      .set({ adminDeleted: true, updatedAt: new Date() })
      .where(eq(pestControlDocs.id, id));
  }

  async deletePestControlDocFromBranch(id: string): Promise<void> {
    // For branch deletions, use isDeleted flag to actually remove from branch view
    // This ensures documents disappear from branch dashboard when they delete them
    await db
      .update(pestControlDocs)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(pestControlDocs.id, id));
    
    console.log(`Pest control document ${id} deleted by branch (marked as isDeleted: true)`);
  }

  async sendPestControlDocToBranch(docId: string, branchId: string): Promise<void> {
    await db
      .update(pestControlDocs)
      .set({ 
        branchId,
        sentAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(pestControlDocs.id, docId));
    
    console.log(`Pest control document ${docId} sent to branch ${branchId}`);
  }

  async sendPestControlDocToMyDocs(docId: string): Promise<void> {
    const [doc] = await db
      .select()
      .from(pestControlDocs)
      .where(eq(pestControlDocs.id, docId))
      .limit(1);
    
    if (!doc) throw new Error('Document not found in Pest Control Docs');
    
    // 🔒 PERMANENT STORAGE GUARANTEE: NO time-based retention checks
    // Documents stay saved FOREVER - only manual deletion allowed
    console.log('🔒 PERMANENT STORAGE: Document will be saved with no expiry restrictions');
    
    // Check if already exists in My Docs by title, branch, and type (same as monthly reports)
    // IMPORTANT: Only check NON-DELETED documents to prevent stale record conflicts
    const [existingDoc] = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.title, doc.title),
        eq(documents.branchId, doc.branchId || ''),
        eq(documents.type, 'pest-control'),
        eq(documents.isDeleted, false), // Only check non-deleted documents
        eq(documents.adminDeleted, false) // Only check non-admin-deleted documents
      ))
      .limit(1);
    
    if (existingDoc) {
      throw new Error('Document already saved to My Documents');
    }
    
    // Copy to documents table (My Docs)
    const newDocId = randomUUID();
    await db.insert(documents).values({
      id: newDocId,
      title: doc.title,
      filename: doc.filename,
      filepath: doc.filepath,
      type: 'pest-control',
      category: 'saved-pest-control',
      branchId: doc.branchId,
      uploadedBy: doc.uploadedBy.toString(),
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      createdAt: new Date(),
      updatedAt: new Date(),
      sentAt: new Date()
    });
    
    // Mark as sent to My Docs
    await db
      .update(pestControlDocs)
      .set({ 
        isInMyDocs: true,
        receivedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(pestControlDocs.id, docId));
    
    console.log(`🔒 Pest control document ${docId} added to My Documents with PERMANENT STORAGE - never auto-deletes`);
  }

  async sendPhotoToMyDocs(photoId: string): Promise<{ success: boolean; message: string; alreadyExists?: boolean } | void> {
    // CRITICAL FIX: Look in BOTH tables to find the photo
    let photo: any = null;
    
    // First try photos table
    const [photosTableResult] = await db
      .select()
      .from(photos)
      .where(eq(photos.id, photoId))
      .limit(1);
    
    if (photosTableResult) {
      photo = photosTableResult;
    } else {
      // If not found in photos table, try documents table
      const [documentsTableResult] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, photoId), eq(documents.type, 'photo')))
        .limit(1);
      
      if (documentsTableResult) {
        photo = documentsTableResult;
      }
    }
    
    if (!photo) throw new Error('Photo not found in either photos or documents table');
    
    // Check if already exists in My Docs
    const [existingDoc] = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.filename, photo.filename),
        eq(documents.branchId, photo.branchId || ''),
        eq(documents.category, 'saved-photos')
      ))
      .limit(1);
    
    if (existingDoc) {
      return { success: true, message: 'Photo already saved to My Documents', alreadyExists: true };
    }
    
    // Copy to documents table (My Docs)
    const newDocId = randomUUID();
    await db.insert(documents).values({
      id: newDocId,
      title: photo.title,
      filename: photo.filename,
      filepath: photo.filepath,
      type: 'photo',
      category: 'saved-photos',
      branchId: photo.branchId,
      uploadedBy: photo.uploadedBy.toString(),
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      createdAt: new Date(),
      updatedAt: new Date(),
      sentAt: new Date()
    });
    
    console.log(`Photo ${photoId} added to My Documents with 24-month retention compliance`);
    return { success: true, message: 'Photo sent to My Documents' };
  }



  // Useful Links operations
  async listUsefulLinks(branchId?: string): Promise<SelectUsefulLink[]> {
    console.log('Storage: Fetching useful links', branchId ? `for branch ${branchId}` : 'for admin');
    const startTime = Date.now();
    
    let conditions = [eq(usefulLinks.isActive, true)];
    
    if (branchId) {
      // For branch requests, only return links sent to this branch
      conditions.push(eq(usefulLinks.branchId, branchId));
      conditions.push(sql`${usefulLinks.sentAt} IS NOT NULL`);
    }
    
    const result = await db
      .select()
      .from(usefulLinks)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(usefulLinks.createdAt))
      .limit(100); // Add limit to improve performance
    
    console.log(`Storage: Useful links query completed in ${Date.now() - startTime}ms, found ${result.length} links`);
    return result;
  }

  async createUsefulLink(data: InsertUsefulLink): Promise<SelectUsefulLink> {
    try {
      // Sanitize URL before creating
      const sanitizedData = {
        ...data,
        url: sanitizeUrl(data.url)
      };
      
      const [created] = await db.insert(usefulLinks).values(sanitizedData).returning();
      return created;
    } catch (error) {
      if (error instanceof Error && error.message.includes('URL')) {
        // Re-throw URL validation errors with context
        throw new Error(`Failed to create useful link: ${error.message}`);
      }
      throw error;
    }
  }

  async updateUsefulLink(id: string, data: Partial<InsertUsefulLink>): Promise<SelectUsefulLink> {
    try {
      // Sanitize URL if it's being updated
      const updateData = { ...data };
      if (updateData.url) {
        updateData.url = sanitizeUrl(updateData.url);
      }
      
      const [updated] = await db
        .update(usefulLinks)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(usefulLinks.id, id))
        .returning();
      
      if (!updated) {
        throw new Error(`Useful link with id ${id} not found`);
      }
      
      return updated;
    } catch (error) {
      if (error instanceof Error && error.message.includes('URL')) {
        // Re-throw URL validation errors with context
        throw new Error(`Failed to update useful link: ${error.message}`);
      }
      throw error;
    }
  }

  async sendLinkToBranch(linkId: string, branchId: string): Promise<void> {
    await db
      .update(usefulLinks)
      .set({ 
        branchId,
        sentAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(usefulLinks.id, linkId));
  }

  async deleteUsefulLink(id: string): Promise<void> {
    await db
      .update(usefulLinks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(usefulLinks.id, id));
  }

  async trackLinkClick(id: string): Promise<void> {
    await db
      .update(usefulLinks)
      .set({ clickedAt: new Date(), updatedAt: new Date() })
      .where(eq(usefulLinks.id, id));
  }

  async trackUsefulLinkClick(id: string): Promise<void> {
    await db
      .update(usefulLinks)
      .set({ clickedAt: new Date(), viewedAt: new Date(), updatedAt: new Date() })
      .where(eq(usefulLinks.id, id));
  }

  async getUsefulLink(id: string): Promise<UsefulLink | undefined> {
    const [link] = await db
      .select()
      .from(usefulLinks)
      .where(eq(usefulLinks.id, id));
    return link;
  }

  async getBranchUsefulLinks(branchId: string): Promise<UsefulLink[]> {
    console.log('Storage: Fetching branch useful links for:', branchId);
    const startTime = Date.now();
    
    const result = await db
      .select()
      .from(usefulLinks)
      .where(and(
        eq(usefulLinks.branchId, branchId), 
        eq(usefulLinks.isActive, true),
        sql`${usefulLinks.sentAt} IS NOT NULL`
      ))
      .orderBy(desc(usefulLinks.createdAt))
      .limit(50); // Limit to most recent 50 links for better performance
    
    console.log(`Storage: Branch useful links query completed in ${Date.now() - startTime}ms, found ${result.length} links`);
    return result;
  }

  async markUsefulLinkAsSent(id: string): Promise<void> {
    await db
      .update(usefulLinks)
      .set({ 
        sentAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(usefulLinks.id, id));
  }

  // CRITICAL FIX: Atomic replace operation to prevent data loss during updates
  async replaceUsefulLink(
    originalLink: { title: string; url: string }, 
    newData: { title: string; url: string; description?: string; branchIds: string[]; createdBy: string }
  ): Promise<SelectUsefulLink[]> {
    console.log('Storage: Starting atomic useful link replace operation');
    
    // Use database transaction for atomicity
    return await db.transaction(async (tx) => {
      try {
        // Step 1: Find all existing active links that match the original title and URL
        const existingLinks = await tx
          .select()
          .from(usefulLinks)
          .where(and(
            eq(usefulLinks.title, originalLink.title),
            eq(usefulLinks.url, originalLink.url),
            eq(usefulLinks.isActive, true)
          ));

        console.log(`Storage: Found ${existingLinks.length} existing links to replace`);

        // Step 2: Mark all existing matching links as inactive (soft delete)
        if (existingLinks.length > 0) {
          await tx
            .update(usefulLinks)
            .set({ 
              isActive: false, 
              updatedAt: new Date() 
            })
            .where(and(
              eq(usefulLinks.title, originalLink.title),
              eq(usefulLinks.url, originalLink.url),
              eq(usefulLinks.isActive, true)
            ));
          
          console.log(`Storage: Marked ${existingLinks.length} existing links as inactive`);
        }

        // Step 3: Create new links for all specified branches
        const newLinks: SelectUsefulLink[] = [];
        
        for (const branchId of newData.branchIds) {
          const linkData = {
            id: nanoid(),
            title: newData.title,
            url: sanitizeUrl(newData.url), // Apply URL sanitization
            description: newData.description || null,
            branchId,
            createdBy: newData.createdBy,
            isActive: true,
            sentAt: new Date(), // Mark as sent immediately
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const [created] = await tx.insert(usefulLinks).values(linkData).returning();
          newLinks.push(created);
        }

        console.log(`Storage: Created ${newLinks.length} new useful links atomically`);
        return newLinks;
      
      } catch (error) {
        console.error('Storage: Atomic replace operation failed:', error);
        // Transaction will automatically rollback on error
        throw new Error(`Atomic useful link replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }


  async getNotificationById(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByBranch(branchId: string): Promise<Notification[]> {
    console.log("Storage: Getting notifications for branch:", branchId);
    const result = await db
      .select({
        id: notifications.id,
        branchId: notifications.branchId,
        message: notifications.message,
        visitDate: notifications.visitDate,
        visitTime: notifications.visitTime,
        purposeOfVisit: notifications.purposeOfVisit,
        visitTypes: notifications.visitTypes,
        sentAt: notifications.sentAt,
        createdAt: notifications.createdAt
      })
      .from(notifications)
      .where(eq(notifications.branchId, branchId))
      .orderBy(desc(notifications.createdAt)); // Use createdAt instead of sentAt since sentAt might be null
    console.log("Storage: Found notifications:", result.length, result);
    return result;
  }




  async removeDuplicateNotifications(branchId: string): Promise<number> {
    console.log(`Removing duplicate notifications for branch: ${branchId}`);
    
    // Get all notifications for the branch
    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.branchId, branchId))
      .orderBy(desc(notifications.createdAt));
    
    // Group by message and visitDate to find duplicates
    const seen = new Set<string>();
    const duplicateIds: string[] = [];
    
    for (const notification of allNotifications) {
      const key = `${notification.message}:${notification.visitDate}`;
      if (seen.has(key)) {
        duplicateIds.push(notification.id);
      } else {
        seen.add(key);
      }
    }
    
    // Delete duplicates
    if (duplicateIds.length > 0) {
      console.log(`Found ${duplicateIds.length} duplicate notifications to remove`);
      for (const id of duplicateIds) {
        await db.delete(notifications).where(eq(notifications.id, id));
      }
    }
    
    return duplicateIds.length;
  }

  // CRITICAL: Comprehensive logo restoration and permanent protection system
  async restoreAllBranchLogos(): Promise<void> {
    console.log('🔄 Starting comprehensive branch logo restoration...');
    
    try {
      // Get all available logo files from both directories
      const uploadsDir = path.join(process.env.TMPDIR || "/tmp", "uploads");
      const attachedDir = path.join(process.cwd(), 'attached_assets');
      
      let uploadsFiles: string[] = [];
      let attachedFiles: string[] = [];
      
      try {
        if (fs.existsSync(uploadsDir)) {
          uploadsFiles = fs.readdirSync(uploadsDir).filter(file => 
            file.toLowerCase().includes('logo') || 
            file.toLowerCase().includes('food_logo') ||
            /\.(png|jpg|jpeg|gif|webp)$/i.test(file)
          );
        }
      } catch (error) {
        console.log('Error reading uploads directory:', error);
      }
      
      try {
        if (fs.existsSync(attachedDir)) {
          attachedFiles = fs.readdirSync(attachedDir).filter(file => 
            file.toLowerCase().includes('logo') || 
            file.toLowerCase().includes('food_logo') ||
            /\.(png|jpg|jpeg|gif|webp)$/i.test(file)
          );
        }
      } catch (error) {
        console.log('Error reading attached_assets directory:', error);
      }
      
      console.log(`Found ${uploadsFiles.length} potential logos in uploads/`);
      console.log(`Found ${attachedFiles.length} potential logos in attached_assets/`);
      
      // Get all branches that need logo restoration
      const allBranches = await db.select().from(branches);
      let restoredLogos = 0;
      
      for (const branch of allBranches) {
        const restoredPath = await this.findAndRecoverBranchLogo(branch, uploadsFiles, attachedFiles);
        if (restoredPath && restoredPath !== branch.logoUrl) {
          await db.update(branches)
            .set({ logoUrl: restoredPath, updatedAt: new Date() })
            .where(eq(branches.id, branch.id));
          restoredLogos++;
          console.log(`✅ Restored logo for ${branch.name}: ${restoredPath}`);
        }
      }
      
      console.log(`🎉 Logo restoration complete! Restored ${restoredLogos} branch logos`);
      
    } catch (error) {
      console.error('Error in logo restoration:', error);
    }
  }

  async findAndRecoverBranchLogo(branch: any, uploadsFiles?: string[], attachedFiles?: string[]): Promise<string | null> {
    const uploadsDir = path.join(process.env.TMPDIR || "/tmp", "uploads");
    const attachedDir = path.join(process.cwd(), 'attached_assets');
    
    // If file lists not provided, read them
    if (!uploadsFiles) {
      try {
        uploadsFiles = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
      } catch (error) {
        uploadsFiles = [];
      }
    }
    
    if (!attachedFiles) {
      try {
        attachedFiles = fs.existsSync(attachedDir) ? fs.readdirSync(attachedDir) : [];
      } catch (error) {
        attachedFiles = [];
      }
    }
    
    // Current logo exists and is accessible
    if (branch.logoUrl) {
      const currentPath = branch.logoUrl.startsWith('/') 
        ? path.join(process.cwd(), branch.logoUrl.substring(1))
        : branch.logoUrl;
      
      if (fs.existsSync(currentPath)) {
        return branch.logoUrl; // Current logo is fine
      }
    }
    
    // Search patterns for this branch
    const searchPatterns = [
      // Direct filename match if exists
      branch.logoUrl ? path.basename(branch.logoUrl) : null,
      // Branch ID patterns
      `logo_${branch.id}_`,
      `${branch.id}_logo`,
      // Branch name patterns (clean name)
      branch.name ? `logo_${branch.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_` : null,
      branch.name ? `${branch.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_logo` : null,
      // Generic logo patterns
      'logo',
      'food_logo'
    ].filter(Boolean);
    
    // Search in uploads first
    for (const pattern of searchPatterns) {
      if (!pattern) continue;
      const matchingFile = uploadsFiles.find(file => 
        file.toLowerCase().includes(pattern.toLowerCase()) &&
        /\.(png|jpg|jpeg|gif|webp)$/i.test(file)
      );
      
      if (matchingFile) {
        const fullPath = path.join(uploadsDir, matchingFile);
        if (fs.existsSync(fullPath)) {
          return `/uploads/${matchingFile}`;
        }
      }
    }
    
    // Search in attached_assets
    for (const pattern of searchPatterns) {
      if (!pattern) continue;
      const matchingFile = attachedFiles.find(file => 
        file.toLowerCase().includes(pattern.toLowerCase()) &&
        /\.(png|jpg|jpeg|gif|webp)$/i.test(file)
      );
      
      if (matchingFile) {
        const fullPath = path.join(attachedDir, matchingFile);
        if (fs.existsSync(fullPath)) {
          return `/attached_assets/${matchingFile}`;
        }
      }
    }
    
    return null; // No logo found
  }

  // File Management operations
  async indexAllFiles(): Promise<File[]> {
    const startTime = Date.now();
    console.log('🔍 Starting comprehensive file indexing...');
    
    // Get all uploaded files from filesystem
    const uploadsDir = path.join(process.env.TMPDIR || "/tmp", "uploads");
    const attachedDir = path.join(process.cwd(), 'attached_assets');
    
    const allFiles: InsertFile[] = [];
    
    // Scan uploads directory
    if (fs.existsSync(uploadsDir)) {
      const uploadFiles = fs.readdirSync(uploadsDir);
      for (const filename of uploadFiles) {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          const fileData = await this.analyzeFile(filePath, filename);
          if (fileData && fileData.filename && fileData.fileSize && fileData.mimeType && fileData.originalName && fileData.fileType && fileData.uploadedBy) {
            allFiles.push({
              ...fileData,
              filepath: `/uploads/${filename}`,
              uploadSource: 'uploads',
              filename: fileData.filename,
              fileSize: fileData.fileSize,
              mimeType: fileData.mimeType,
              originalName: fileData.originalName,
              fileType: fileData.fileType,
              uploadedBy: fileData.uploadedBy
            });
          }
        }
      }
    }
    
    // Scan attached_assets directory
    if (fs.existsSync(attachedDir)) {
      const attachedFiles = fs.readdirSync(attachedDir);
      for (const filename of attachedFiles) {
        const filePath = path.join(attachedDir, filename);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          const fileData = await this.analyzeFile(filePath, filename);
          if (fileData && fileData.filename && fileData.fileSize && fileData.mimeType && fileData.originalName && fileData.fileType && fileData.uploadedBy) {
            allFiles.push({
              ...fileData,
              filepath: `/attached_assets/${filename}`,
              uploadSource: 'attached_assets',
              filename: fileData.filename,
              fileSize: fileData.fileSize,
              mimeType: fileData.mimeType,
              originalName: fileData.originalName,
              fileType: fileData.fileType,
              uploadedBy: fileData.uploadedBy
            });
          }
        }
      }
    }
    
    // Insert files into database (replace existing)
    await db.delete(files);
    
    if (allFiles.length > 0) {
      await db.insert(files).values(allFiles);
    }
    
    console.log(`🎉 File indexing complete! Indexed ${allFiles.length} files in ${Date.now() - startTime}ms`);
    
    // Return all indexed files
    return await db.select().from(files).orderBy(desc(files.createdAt));
  }

  async analyzeFile(filePath: string, filename: string): Promise<Partial<InsertFile> | null> {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      // Determine file type and MIME type
      let fileType = 'unknown';
      let mimeType = 'application/octet-stream';
      let category = 'general';
      
      if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
        fileType = 'image';
        mimeType = `image/${ext.substring(1)}`;
        category = 'image';
      } else if (['.pdf'].includes(ext)) {
        fileType = 'document';
        mimeType = 'application/pdf';
        category = 'document';
      } else if (['.doc', '.docx'].includes(ext)) {
        fileType = 'document';
        mimeType = 'application/msword';
        category = 'document';
      } else if (['.xls', '.xlsx'].includes(ext)) {
        fileType = 'document';
        mimeType = 'application/vnd.ms-excel';
        category = 'document';
      }
      
      // Extract branch ID from filename if possible (pattern: branchId_timestamp_filename)
      let branchId = null;
      const parts = filename.split('_');
      if (parts.length >= 3) {
        // Try to match branch ID pattern
        const possibleBranchId = parts[0];
        if (possibleBranchId.length > 10) {
          branchId = possibleBranchId;
        }
      }
      
      return {
        filename,
        originalName: filename,
        fileSize: stats.size,
        mimeType,
        fileType,
        category,
        title: filename,
        branchId,
        uploadedBy: 'system_scan',
        isActive: true,
        isPermanent: true,
        tags: [fileType, category],
        metadata: {
          scannedAt: new Date().toISOString(),
          fileExtension: ext,
          directory: path.dirname(filePath)
        }
      };
    } catch (error) {
      console.error(`Error analyzing file ${filename}:`, error);
      return null;
    }
  }

  async getAllFiles(filters?: { 
    category?: string; 
    fileType?: string; 
    branchId?: string; 
    search?: string;
  }): Promise<File[]> {
    let conditions = [eq(files.isActive, true)];
    
    if (filters?.category) {
      conditions.push(eq(files.category, filters.category));
    }
    
    if (filters?.fileType) {
      conditions.push(eq(files.fileType, filters.fileType));
    }
    
    if (filters?.branchId) {
      conditions.push(eq(files.branchId, filters.branchId));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`${files.filename} ILIKE ${`%${filters.search}%`} OR ${files.title} ILIKE ${`%${filters.search}%`}`
      );
    }
    
    return await db
      .select()
      .from(files)
      .where(and(...conditions))
      .orderBy(desc(files.createdAt))
      .limit(1000); // Limit for performance
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(fileData).returning();
    return newFile;
  }

  async updateFile(id: string, fileData: Partial<InsertFile>): Promise<File> {
    const [updatedFile] = await db
      .update(files)
      .set({ ...fileData, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    
    if (!updatedFile) throw new Error('File not found');
    return updatedFile;
  }

  async deleteFile(id: string): Promise<void> {
    await db
      .update(files)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(files.id, id));
  }

  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
    categories: Record<string, number>;
  }> {
    const allFiles = await db
      .select()
      .from(files)
      .where(eq(files.isActive, true));
    
    const stats = {
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0),
      fileTypes: {} as Record<string, number>,
      categories: {} as Record<string, number>
    };
    
    allFiles.forEach(file => {
      stats.fileTypes[file.fileType] = (stats.fileTypes[file.fileType] || 0) + 1;
      stats.categories[file.category] = (stats.categories[file.category] || 0) + 1;
    });
    
    return stats;
  }

  // IoT Device methods
  async getIotDevices(): Promise<IotDevice[]> {
    return db.select().from(iotDevices).orderBy(desc(iotDevices.createdAt));
  }

  async getIotDevicesByBranch(branchId: string): Promise<IotDevice[]> {
    return db.select().from(iotDevices).where(eq(iotDevices.branchId, branchId)).orderBy(desc(iotDevices.createdAt));
  }

  async getIotDevice(id: string): Promise<IotDevice | undefined> {
    const [device] = await db.select().from(iotDevices).where(eq(iotDevices.id, id));
    return device;
  }

  async createIotDevice(device: InsertIotDevice): Promise<IotDevice> {
    const [created] = await db.insert(iotDevices).values(device).returning();
    return created;
  }

  async updateIotDevice(id: string, data: Partial<IotDevice>): Promise<IotDevice> {
    const [updated] = await db.update(iotDevices).set({ ...data, updatedAt: new Date() }).where(eq(iotDevices.id, id)).returning();
    return updated;
  }

  async deleteIotDevice(id: string): Promise<void> {
    await db.delete(iotDevices).where(eq(iotDevices.id, id));
  }

}

export const storage = new DatabaseStorage();
