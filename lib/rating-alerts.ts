// Rating alerts and notification system for Food Hygiene Alert System

export interface AlertConfig {
  email: boolean;
  emailAddress: string;
  sms: boolean;
  smsPhone: string;
  dashboard: boolean;
  highRiskOnly: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface WatchlistItem {
  id: string;
  fhrsId: number;
  businessName: string;
  address: string;
  postcode: string;
  rating: number;
  lastInspectionDate: string;
  localAuthority: string;
  addedAt: string;
  lastAlertedAt?: string;
}

export interface AlertEvent {
  id: string;
  watchlistItemId: string;
  businessName: string;
  rating: number;
  previousRating?: number;
  type: 'rating_drop' | 'high_risk' | 'new_inspection' | 'reminder';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
  read: boolean;
}

// Default alert config
export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  email: true,
  emailAddress: 'mujeeb@job4u.com',
  sms: false,
  smsPhone: '',
  dashboard: true,
  highRiskOnly: false,
  frequency: 'immediate'
};

// Generate a unique ID
function generateId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// In-memory storage (in production this would be a database)
let watchlist: WatchlistItem[] = [];
let alertConfig: AlertConfig = { ...DEFAULT_ALERT_CONFIG };
let alertHistory: AlertEvent[] = [];

// Load from localStorage if available (client-side)
export function loadFromStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const savedWatchlist = localStorage.getItem('fhrs_watchlist');
    if (savedWatchlist) watchlist = JSON.parse(savedWatchlist);
    
    const savedConfig = localStorage.getItem('fhrs_alert_config');
    if (savedConfig) alertConfig = JSON.parse(savedConfig);
    
    const savedHistory = localStorage.getItem('fhrs_alert_history');
    if (savedHistory) alertHistory = JSON.parse(savedHistory);
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
}

// Save to localStorage
export function saveToStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('fhrs_watchlist', JSON.stringify(watchlist));
    localStorage.setItem('fhrs_alert_config', JSON.stringify(alertConfig));
    localStorage.setItem('fhrs_alert_history', JSON.stringify(alertHistory));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

// Watchlist management
export function getWatchlist(): WatchlistItem[] {
  loadFromStorage();
  return [...watchlist];
}

export function addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'>): WatchlistItem {
  loadFromStorage();
  
  // Check if already in watchlist
  const existing = watchlist.find(w => w.fhrsId === item.fhrsId);
  if (existing) return existing;
  
  const newItem: WatchlistItem = {
    ...item,
    id: generateId(),
    addedAt: new Date().toISOString()
  };
  
  watchlist.push(newItem);
  saveToStorage();
  
  // Generate alert if high risk
  if (item.rating >= 0 && item.rating <= 2) {
    generateAlert(newItem, 'high_risk', `HIGH RISK: ${item.businessName} has a rating of ${item.rating} - urgent improvement needed`);
  }
  
  return newItem;
}

export function removeFromWatchlist(fhrsId: number): void {
  loadFromStorage();
  watchlist = watchlist.filter(w => w.fhrsId !== fhrsId);
  saveToStorage();
}

export function isWatched(fhrsId: number): boolean {
  loadFromStorage();
  return watchlist.some(w => w.fhrsId === fhrsId);
}

// Alert configuration
export function getAlertConfig(): AlertConfig {
  loadFromStorage();
  return { ...alertConfig };
}

export function updateAlertConfig(config: Partial<AlertConfig>): AlertConfig {
  loadFromStorage();
  alertConfig = { ...alertConfig, ...config };
  saveToStorage();
  return { ...alertConfig };
}

// Alert history
export function getAlertHistory(): AlertEvent[] {
  loadFromStorage();
  return [...alertHistory].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getUnreadAlertCount(): number {
  loadFromStorage();
  return alertHistory.filter(a => !a.read).length;
}

export function markAlertRead(alertId: string): void {
  loadFromStorage();
  alertHistory = alertHistory.map(a => 
    a.id === alertId ? { ...a, read: true } : a
  );
  saveToStorage();
}

export function markAllAlertsRead(): void {
  loadFromStorage();
  alertHistory = alertHistory.map(a => ({ ...a, read: true }));
  saveToStorage();
}

export function clearAlertHistory(): void {
  alertHistory = [];
  saveToStorage();
}

// Generate alert
function generateAlert(item: WatchlistItem, type: AlertEvent['type'], message: string): AlertEvent {
  const alert: AlertEvent = {
    id: generateId(),
    watchlistItemId: item.id,
    businessName: item.businessName,
    rating: item.rating,
    type,
    message,
    severity: item.rating <= 1 ? 'critical' : item.rating === 2 ? 'warning' : 'info',
    createdAt: new Date().toISOString(),
    read: false
  };
  
  alertHistory.unshift(alert);
  saveToStorage();
  
  // Send email alert if configured
  if (alertConfig.email && alertConfig.emailAddress) {
    sendEmailAlert(alert);
  }
  
  // Send SMS alert if configured
  if (alertConfig.sms && alertConfig.smsPhone) {
    sendSMSAlert(alert);
  }
  
  return alert;
}

// Email alert - placeholder for real email integration
export async function sendEmailAlert(alert: AlertEvent): Promise<boolean> {
  const config = getAlertConfig();
  if (!config.email || !config.emailAddress) return false;
  
  console.log(`[EMAIL ALERT] To: ${config.emailAddress}`);
  console.log(`[EMAIL ALERT] Subject: 🚨 Food Hygiene Alert - ${alert.businessName}`);
  console.log(`[EMAIL ALERT] Message: ${alert.message}`);
  console.log(`[EMAIL ALERT] Severity: ${alert.severity}`);
  console.log(`[EMAIL ALERT] Rating: ${alert.rating}/5`);
  console.log(`[EMAIL ALERT] Time: ${new Date(alert.createdAt).toLocaleString()}`);
  
  // In production, integrate with SendGrid, SES, etc.
  // await sendEmail({
  //   to: config.emailAddress,
  //   subject: `🚨 Food Hygiene Alert - ${alert.businessName}`,
  //   html: generateEmailTemplate(alert)
  // });
  
  return true;
}

// SMS alert - Twilio placeholder
export async function sendSMSAlert(alert: AlertEvent): Promise<boolean> {
  const config = getAlertConfig();
  if (!config.sms || !config.smsPhone) return false;
  
  console.log(`[SMS ALERT] To: ${config.smsPhone}`);
  console.log(`[SMS ALERT] Body: 🚨 ${alert.businessName} - ${alert.message}`);
  console.log(`[SMS ALERT] Severity: ${alert.severity}`);
  
  // In production, integrate with Twilio
  // const twilioClient = require('twilio')(TWILIO_SID, TWILIO_AUTH_TOKEN);
  // await twilioClient.messages.create({
  //   body: `🚨 Food Hygiene Alert: ${alert.businessName} - ${alert.message}`,
  //   to: config.smsPhone,
  //   from: TWILIO_PHONE_NUMBER
  // });
  
  return true;
}

// Generate email HTML template
function generateEmailTemplate(alert: AlertEvent): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6'}; padding: 20px; color: white; }
        .content { padding: 20px; }
        .rating-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 24px; }
        .footer { padding: 20px; background: #f9fafb; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Food Hygiene Alert</h1>
          <p>${alert.severity === 'critical' ? 'Critical Risk Detected' : 'Warning'}</p>
        </div>
        <div class="content">
          <h2>${alert.businessName}</h2>
          <p>${alert.message}</p>
          <p>Rating: <strong>${alert.rating}/5</strong></p>
          <p>Alert Time: ${new Date(alert.createdAt).toLocaleString()}</p>
          <p>View full details on your <a href="https://mujeebproai.com/food">Food Hygiene Dashboard</a></p>
        </div>
        <div class="footer">
          <p>Food Hygiene Alert System - MujeebProAI</p>
          <p>This is an automated alert from your watchlist.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Get high-risk businesses from watchlist
export function getHighRiskBusinesses(): WatchlistItem[] {
  return getWatchlist().filter(w => w.rating >= 0 && w.rating <= 2);
}

// Get risk statistics
export function getRiskStats() {
  const items = getWatchlist();
  return {
    total: items.length,
    highRisk: items.filter(w => w.rating >= 0 && w.rating <= 2).length,
    mediumRisk: items.filter(w => w.rating === 3).length,
    lowRisk: items.filter(w => w.rating >= 4).length,
    critical: items.filter(w => w.rating <= 1).length,
  };
}

// Check for rating changes (simulated)
export function checkForRatingChanges(): AlertEvent[] {
  const newAlerts: AlertEvent[] = [];
  const items = getWatchlist();
  
  // In production, this would query the FHRS API for each watched business
  // and compare with stored ratings
  
  return newAlerts;
}
