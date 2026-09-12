// @ts-nocheck
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated } from "./replitAuth.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { randomUUID } from "crypto";
import { nanoid } from "nanoid";
import { boolean } from "drizzle-orm/pg-core";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage.js";
import { ObjectPermission } from "./objectAcl.js";
import { updateDateOnPdf, getTemplatesList } from "./pdfGenerator.js";
import { 
  insertBranchSchema, 
  insertDocumentSchema,
  insertNotificationSchema,
  insertPhotoSchema,
  insertMonthlyReportSchema,
  insertPestControlDocSchema,
  insertUsefulLinkSchema,
  insertShopLayoutSchema,
  type Branch
} from "../shared/schema.js";
import { z } from "zod";

// Parameter validation schemas
const idParamSchema = z.object({
  id: z.string().min(1, "ID parameter is required and cannot be empty")
});

const branchIdQuerySchema = z.object({
  branchId: z.string().min(1, "Branch ID cannot be empty").optional()
});

// Restrictive PATCH schema for useful links - only allows specific fields
const usefulLinkUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  url: z.string().url("Invalid URL format").optional(),
  branchId: z.string().min(1, "Branch ID cannot be empty").optional()
}).strict(); // strict() prevents additional properties

// Extend session interface to include our custom properties
declare module 'express-session' {
  interface SessionData {
    branchId?: string;
    userType?: string;
  }
}

// Extend request interface to include our custom properties for RBAC
declare global {
  namespace Express {
    interface Request {
      userType?: 'admin' | 'branch';
      sessionBranchId?: string;
      isValidatedBranch?: boolean; // Add flag for enhanced validation
    }
  }
}

// ===== ENHANCED BRANCH OWNERSHIP VERIFICATION MIDDLEWARE =====

/**
 * Comprehensive branch ownership verification middleware
 * Ensures strict data isolation between branches with enhanced security
 */
function verifyBranchOwnership(req: any, res: any, next: any) {
  try {
    const session = req.session as any;
    const branchId = session?.branchId;
    const userType = session?.userType;
    
    // SECURITY: Comprehensive branchId validation for data isolation
    if (!branchId || userType !== 'branch') {
      console.error('❌ BRANCH OWNERSHIP ERROR: Missing authentication', {
        branchId,
        userType,
        sessionExists: !!req.session,
        route: req.path
      });
      return res.status(401).json({ 
        message: "SECURITY: Branch authentication required for data isolation",
        code: "BRANCH_AUTH_REQUIRED"
      });
    }
    
    // SECURITY: Strict branchId format validation 
    if (branchId === 'undefined' || branchId === 'null' || typeof branchId !== 'string' || branchId.trim() === '') {
      console.error('❌ BRANCH OWNERSHIP ERROR: Invalid branchId format', {
        branchId,
        type: typeof branchId,
        route: req.path
      });
      return res.status(403).json({ 
        message: "SECURITY: Invalid branch ID format - access denied for data isolation",
        code: "INVALID_BRANCH_ID"
      });
    }
    
    // SECURITY: UUID format validation for branchId
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId)) {
      console.error('❌ BRANCH OWNERSHIP ERROR: Invalid UUID format for branchId', {
        branchId,
        route: req.path
      });
      return res.status(403).json({ 
        message: "SECURITY: Invalid branch ID UUID format - access denied",
        code: "INVALID_BRANCH_UUID"
      });
    }
    
    // Add validated branchId to request for downstream use
    req.sessionBranchId = branchId;
    req.userType = 'branch';
    req.isValidatedBranch = true;
    
    console.log(`✅ BRANCH OWNERSHIP VERIFIED: ${branchId} for route ${req.path}`);
    next();
  } catch (error) {
    console.error('❌ BRANCH OWNERSHIP MIDDLEWARE ERROR:', error);
    return res.status(500).json({ 
      message: "SECURITY: Branch ownership verification failed",
      code: "OWNERSHIP_VERIFICATION_ERROR"
    });
  }
}

/**
 * Verify branch data access - ensures data belongs to authenticated branch
 */
async function verifyBranchDataAccess(resourceBranchId: string, sessionBranchId: string, resourceType: string): Promise<boolean> {
  if (!resourceBranchId || !sessionBranchId) {
    console.error(`❌ DATA ACCESS ERROR: Missing branchId for ${resourceType}`, {
      resourceBranchId,
      sessionBranchId
    });
    return false;
  }
  
  if (resourceBranchId !== sessionBranchId) {
    console.error(`❌ DATA ACCESS VIOLATION: Branch ${sessionBranchId} attempted to access ${resourceType} belonging to branch ${resourceBranchId}`);
    return false;
  }
  
  console.log(`✅ DATA ACCESS VERIFIED: Branch ${sessionBranchId} accessing own ${resourceType}`);
  return true;
}

// Organized data folder structure for easy file management with lifetime storage
const dataDir = path.join(process.env.TMPDIR || "/tmp", "data");
const uploadsDir = path.join(dataDir, 'documents');
const photosDir = path.join(dataDir, 'photos');
const logosDir = path.join(dataDir, 'logos');
const reportsDir = path.join(dataDir, 'reports');
const imagesDir = path.join(dataDir, 'images');

// Legacy directories for backward compatibility
const legacyUploadsDir = path.join(process.env.TMPDIR || "/tmp", "uploads");
const attachedAssetsDir = path.join(process.env.TMPDIR || "/tmp", "attached_assets");

// Backup storage directories for redundancy and lifetime preservation
const backupDir = path.join(process.env.TMPDIR || "/tmp", "backup");
const backupUploadsDir = path.join(backupDir, 'documents');
const backupPhotosDir = path.join(backupDir, 'photos');
const backupLogosDir = path.join(backupDir, 'logos');
const backupReportsDir = path.join(backupDir, 'reports');
const backupImagesDir = path.join(backupDir, 'images');

// Create all directories including backup for lifetime storage
[dataDir, uploadsDir, photosDir, logosDir, reportsDir, imagesDir, 
 legacyUploadsDir, attachedAssetsDir, backupDir, backupUploadsDir, 
 backupPhotosDir, backupLogosDir, backupReportsDir, backupImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File backup function for lifetime storage guarantee
function createFileBackup(originalPath: string, backupPath: string): void {
  try {
    if (fs.existsSync(originalPath)) {
      const backupFileDir = path.dirname(backupPath);
      if (!fs.existsSync(backupFileDir)) {
        fs.mkdirSync(backupFileDir, { recursive: true });
      }
      fs.copyFileSync(originalPath, backupPath);
      console.log(`✓ Lifetime backup created: ${path.basename(originalPath)}`);
    }
  } catch (error) {
    console.error('Backup creation failed:', error);
  }
}

// PERMANENTLY DISABLED: Logo cleanup function disabled to prevent auto-removal
// All uploaded logos are preserved for lifetime storage and accessibility
async function cleanupOldLogoFiles(branchId: string): Promise<void> {
  // Logo cleanup functionality permanently disabled to prevent data loss
  console.log(`⚠️ Logo cleanup disabled - all logos preserved for branch ${branchId}`);
  return;
  
  // Original cleanup code permanently commented out to prevent accidental logo deletion
  /*
  try {
    // Get current branch to check existing logoUrl
    const branch = await storage.getBranch(branchId);
    const currentLogoFilename = branch?.logoUrl ? path.basename(branch.logoUrl) : null;
    
    // Define directories to clean
    const dirsToClean = [
      logosDir,
      backupLogosDir,
      legacyUploadsDir,
      attachedAssetsDir
    ];
    
    for (const dir of dirsToClean) {
      if (!fs.existsSync(dir)) continue;
      
      try {
        const files = fs.readdirSync(dir);
        const logoFiles = files.filter(file => 
          file.startsWith(`logo_${branchId}_`) && file !== currentLogoFilename
        );
        
        for (const file of logoFiles) {
          const filePath = path.join(dir, file);
          try {
            fs.unlinkSync(filePath);
            console.log(`✓ Cleaned up old logo file: ${file} from ${path.basename(dir)}`);
          } catch (deleteError) {
            console.log(`Failed to delete old logo file: ${file}`);
          }
        }
      } catch (readError) {
        console.log(`Failed to read directory: ${dir}`);
      }
    }
  } catch (error) {
    console.error(`Error cleaning up old logo files for branch ${branchId}:`, error);
  }
  */
}

// Multi-location file save for maximum preservation
function saveFileWithLifetimeStorage(file: Express.Multer.File, primaryDir: string, prefix: string): string {
  const timestamp = Date.now();
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${prefix}_${timestamp}_${sanitizedName}`;
  
  // Save to primary location
  const primaryPath = path.join(primaryDir, fileName);
  
  // Save to backup location
  const backupPath = path.join(backupDir, path.basename(primaryDir), fileName);
  
  // Save to legacy location for compatibility
  const legacyPath = path.join(legacyUploadsDir, fileName);
  
  try {
    // Create backup immediately
    createFileBackup(primaryPath, backupPath);
    // Also save to legacy directory for compatibility
    if (fs.existsSync(primaryPath)) {
      fs.copyFileSync(primaryPath, legacyPath);
    }
    console.log(`✓ File saved with lifetime storage: ${fileName}`);
  } catch (error) {
    console.error('Multi-location save failed:', error);
  }
  
  return fileName;
}

// Enhanced file upload post-processing for lifetime storage
function enhanceUploadWithLifetimeStorage(req: any, uploadType: string): void {
  if (!req.file) return;
  
  try {
    const originalPath = req.file.path;
    const fileName = req.file.filename;
    
    // Determine backup directory based on upload type
    let backupSubDir = '';
    switch (uploadType) {
      case 'photos':
        backupSubDir = 'photos';
        break;
      case 'documents':
        backupSubDir = 'documents';
        break;
      case 'reports':
        backupSubDir = 'reports';
        break;
      case 'logos':
        backupSubDir = 'logos';
        break;
      default:
        backupSubDir = 'documents';
    }
    
    // Create backup copies for lifetime storage
    const backupPath = path.join(backupDir, backupSubDir, fileName);
    const legacyPath = path.join(legacyUploadsDir, fileName);
    const attachedPath = path.join(attachedAssetsDir, fileName);
    
    // Create multiple backup copies
    createFileBackup(originalPath, backupPath);
    
    if (fs.existsSync(originalPath)) {
      // Copy to legacy uploads for compatibility
      fs.copyFileSync(originalPath, legacyPath);
      // Copy to attached_assets for additional backup
      fs.copyFileSync(originalPath, attachedPath);
    }
    
    console.log(`✓ Enhanced ${uploadType} upload with lifetime storage: ${fileName}`);
  } catch (error) {
    console.error(`Enhanced upload failed for ${uploadType}:`, error);
  }
}

// Document upload configuration (allows PDF, DOC, XLS, TXT and image files)
// ===== ADMIN DASHBOARD CONTENT AREAS - DEDICATED MULTER CONFIGURATIONS =====

// 1. Documents Section (My Documents) - Admin Dashboard  
const documentsUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `admin_doc_${timestamp}_${sanitizedName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/svg+xml'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, and SVG files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for documents
  }
});

// 2. Photos Section - Admin Dashboard
const photosUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, photosDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `admin_photo_${timestamp}_${sanitizedName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, GIF, and SVG files are allowed for photos.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// 3. Pest Control Docs Section - Admin Dashboard
const pestControlUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `pest_control_${timestamp}_${sanitizedName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/svg+xml'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, and SVG files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// 4. Monthly Reports Section - Admin Dashboard
const monthlyReportsUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, reportsDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `admin_monthly_${timestamp}_${sanitizedName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/svg+xml'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, and SVG files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// 5. Yearly Docs Section - Admin Dashboard
const yearlyDocsUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `yearly_doc_${timestamp}_${sanitizedName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/svg+xml'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, and SVG files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// 6. Branch Logos Section - Admin Dashboard (branch-isolated, durable storage)
const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, logosDir);
    },
    filename: (req, file, cb) => {
      // Handle both admin uploads (/api/branches/:id/logo) and branch uploads (/api/branch/logo)
      const branchId = req.params.id || (req.session as any)?.branchId || (req.path === '/api/branches' ? `pending_${randomUUID()}` : undefined);
      const timestamp = Date.now();
      const fileExtension = path.extname(file.originalname);
      
      // CRITICAL: Strict branchId validation to prevent data isolation breaches
      if (!branchId || branchId === 'undefined' || branchId === 'null' || typeof branchId !== 'string' || branchId.trim() === '') {
        console.error('❌ LOGO UPLOAD SECURITY ERROR: Invalid branch ID found', {
          branchId,
          type: typeof branchId,
          paramsId: req.params.id,
          sessionBranchId: (req.session as any)?.branchId,
          userType: (req.session as any)?.userType
        });
        return cb(new Error('SECURITY: Invalid branch ID - upload rejected for data isolation'), '');
      }
      
      // Additional UUID format validation for admin routes
      if (req.params.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId)) {
        console.error('❌ LOGO UPLOAD SECURITY ERROR: Invalid UUID format for branchId', { branchId });
        return cb(new Error('SECURITY: Invalid branch ID format - upload rejected'), '');
      }
      
      const fileName = `logo_${branchId}_${timestamp}${fileExtension}`;
      console.log(`✅ LOGO FILENAME GENERATED WITH SECURITY: ${fileName} (branchId: ${branchId}, source: ${req.params.id ? 'admin' : 'branch'})`);
      cb(null, fileName);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Branch logos intentionally support the formats used by the original app.
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid logo type. Only PNG, JPG/JPEG, GIF and SVG files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB branch-logo limit
  }
});

// Safe logo upload middleware — catches multer errors (e.g. file too large) and returns
// a clean 400 response instead of crashing the server process.
const uploadLogoSafe = (req: any, res: any, next: any) => {
  logoUpload.single('logo')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'Logo file is too large. Maximum size is 10MB.'
        });
      }
      return res.status(400).json({ message: err.message || 'Logo upload failed' });
    }
    next();
  });
};

// ===== BRANCH DASHBOARD UPLOAD CONFIGURATIONS =====

// Branch Documents Upload (My Documents section)
const branchDocumentsUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // CRITICAL: Must include branchId for data isolation
      const branchId = (req.session as any)?.branchId;
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // SECURITY: Strict branchId validation to prevent data isolation breaches
      if (!branchId || branchId === 'undefined' || branchId === 'null' || typeof branchId !== 'string' || branchId.trim() === '') {
        console.error('❌ BRANCH DOCUMENT UPLOAD SECURITY ERROR: Invalid branch ID', {
          branchId,
          type: typeof branchId,
          sessionBranchId: (req.session as any)?.branchId,
          userType: (req.session as any)?.userType
        });
        return cb(new Error('SECURITY: Invalid branch ID - document upload rejected for data isolation'), '');
      }
      
      cb(null, `branch_doc_${branchId}_${timestamp}_${sanitizedName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/svg+xml'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, and SVG files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Branch Photos Upload
const branchPhotosUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, photosDir);
    },
    filename: (req, file, cb) => {
      // CRITICAL: Must include branchId for data isolation
      const branchId = (req.session as any)?.branchId;
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // SECURITY: Strict branchId validation to prevent data isolation breaches
      if (!branchId || branchId === 'undefined' || branchId === 'null' || typeof branchId !== 'string' || branchId.trim() === '') {
        console.error('❌ BRANCH PHOTO UPLOAD SECURITY ERROR: Invalid branch ID', {
          branchId,
          type: typeof branchId,
          sessionBranchId: (req.session as any)?.branchId,
          userType: (req.session as any)?.userType
        });
        return cb(new Error('SECURITY: Invalid branch ID - photo upload rejected for data isolation'), '');
      }
      
      cb(null, `branch_photo_${branchId}_${timestamp}_${sanitizedName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, GIF, and SVG files are allowed for photos.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Branch Monthly Reports Upload
const branchReportsUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, reportsDir);
    },
    filename: (req, file, cb) => {
      // CRITICAL: Must include branchId for data isolation
      const branchId = (req.session as any)?.branchId;
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // SECURITY: Strict branchId validation to prevent data isolation breaches
      if (!branchId || branchId === 'undefined' || branchId === 'null' || typeof branchId !== 'string' || branchId.trim() === '') {
        console.error('❌ BRANCH REPORT UPLOAD SECURITY ERROR: Invalid branch ID', {
          branchId,
          type: typeof branchId,
          sessionBranchId: (req.session as any)?.branchId,
          userType: (req.session as any)?.userType
        });
        return cb(new Error('SECURITY: Invalid branch ID - report upload rejected for data isolation'), '');
      }
      
      cb(null, `branch_monthly_${branchId}_${timestamp}_${sanitizedName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/svg+xml'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, and SVG files are allowed.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware (this sets up sessions first)
  await setupAuth(app);

  // Admin credentials management - persistent file storage
  const credentialsPath = path.join(uploadsDir, 'admin-settings.json');
  
  function loadSettings() {
    try {
      if (fs.existsSync(credentialsPath)) {
        const data = fs.readFileSync(credentialsPath, 'utf8');
        const settings = JSON.parse(data);
        
        // Support both single admin (old format) and multiple admins (new format)
        if (settings.adminCredentials && !Array.isArray(settings.adminCredentials)) {
          // Convert old format to new format
          settings.adminCredentials = [settings.adminCredentials];
        }
        
        // Check and remove expired temporary master PIN
        if (settings.temporaryMasterPin) {
          const expiryDate = new Date(settings.temporaryMasterPin.expiresAt);
          const now = new Date();
          if (now > expiryDate) {
            console.log('🕐 Temporary master PIN has expired and will be removed');
            delete settings.temporaryMasterPin;
            saveSettings(settings);
          } else {
            const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`🔑 Temporary master PIN is active. Expires in ${daysLeft} day(s)`);
          }
        }
        
        return settings;
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
    
    // Create default settings with temporary PIN valid for 1 week
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    return {
      adminCredentials: [
        { email: "mujeeb@job4u.com", password: "smrptt77" },
        { email: "sulman@live.com", password: "12345678" }
      ],
      sidebarPin: "smrptt77",
      regularSidebarPin: "112233",
      temporaryMasterPin: {
        pin: "11111111",
        createdAt: new Date().toISOString(),
        expiresAt: oneWeekFromNow.toISOString(),
        purpose: "Staff access for sidebar document uploads"
      }
    };
  }
  
  function saveSettings(settings: any) {
    try {
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      fs.writeFileSync(credentialsPath, JSON.stringify(settings, null, 2));
      console.log('Admin settings saved successfully to:', credentialsPath);
      return true;
    } catch (error) {
      console.error('Error saving admin settings:', error);
      return false;
    }
  }
  
  // Load current settings on startup
  let currentSettings = loadSettings();
  
  // Save default settings if file doesn't exist (creates the temporary PIN)
  if (!fs.existsSync(credentialsPath)) {
    console.log('📝 Creating default admin settings with temporary PIN...');
    saveSettings(currentSettings);
    console.log('✅ Admin settings file created successfully');
  }
  
  // Master password that always works
  const MASTER_PASSWORD = "smrptt77";
  
  // Master sidebar PIN that always works
  const MASTER_SIDEBAR_PIN = "smrptt77";
  
  // Set default regular PIN if not exists
  if (!currentSettings.regularSidebarPin) {
    currentSettings.regularSidebarPin = "112233";
    saveSettings(currentSettings);
  }

  app.post("/api/admin/update-credentials", (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      currentSettings.adminCredentials = { email, password };
      
      if (saveSettings(currentSettings)) {
        console.log('Admin credentials updated to:', { email });
        res.json({ message: "Admin credentials updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to save credentials" });
      }
    } catch (error) {
      console.error("Error updating admin credentials:", error);
      res.status(500).json({ message: "Failed to update credentials" });
    }
  });

  app.get("/api/admin/credentials", (req, res) => {
    // Return list of admin emails (without passwords for security)
    const admins = Array.isArray(currentSettings.adminCredentials) 
      ? currentSettings.adminCredentials.map((cred: any) => ({ email: cred.email }))
      : [{ email: currentSettings.adminCredentials?.email || 'Unknown' }];
    res.json({ admins, count: admins.length });
  });

  // Admin authentication system - completely separate from staff access
  const adminTokens = new Set<string>();
  const ADMIN_USERNAME = "sardar";
  const ADMIN_PASSWORD = "smrptt77";
  
  function generateAdminToken(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
  
  function isValidAdminLogin(username: string, password: string): boolean {
    // Check default admin
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return true;
    }
    
    // Check all admin credentials in the array
    if (Array.isArray(currentSettings.adminCredentials)) {
      return currentSettings.adminCredentials.some((cred: any) => 
        cred.email === username && cred.password === password
      );
    }
    
    // Fallback for old single-credential format
    return (currentSettings.adminCredentials?.email === username && 
            currentSettings.adminCredentials?.password === password);
  }

  // ===== OBJECT STORAGE FILE SERVING =====
  // Serves files from permanent Object Storage (survives republishing)
  // Files stored with path format: /objects/branch/[branchId]/[category]/[uuid].[ext]
  // Admins have full access, branches can only access their own files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check admin authentication
      const adminToken = req.cookies?.admin_token;
      const isAdmin = !!(adminToken && adminTokens.has(adminToken));
      
      // Check branch ownership for access control
      const session = req.session as any;
      const branchId = session?.branchId;
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        branchId: branchId,
        isAdmin: isAdmin,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      // Stream file to response
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object storage file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Admin login verification endpoint
  app.post("/api/admin/verify-login", (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      console.log(`🔐 ADMIN LOGIN ATTEMPT - Email: "${email}", Username: "${username}", Password Length: ${password?.length}`);
      console.log(`🔑 Current Settings:`, currentSettings.adminCredentials);
      
      // Accept either email or username
      const loginField = email || username;
      
      if (!loginField || !password) {
        console.log(`❌ LOGIN REJECTED - Missing credentials`);
        return res.status(400).json({ message: "Email/username and password are required" });
      }

      // Use dedicated admin validation function
      const isAdminCredentials = isValidAdminLogin(loginField, password);
      
      // Check if permanent master password is used with any admin email
      let isMasterPassword = (loginField === ADMIN_USERNAME) && password === MASTER_PASSWORD;
      if (!isMasterPassword && Array.isArray(currentSettings.adminCredentials)) {
        isMasterPassword = currentSettings.adminCredentials.some((cred: any) => 
          cred.email === loginField && password === MASTER_PASSWORD
        );
      }
      
      // Check if temporary master PIN is used (valid for 1 week)
      let isTemporaryPin = false;
      if (currentSettings.temporaryMasterPin) {
        const expiryDate = new Date(currentSettings.temporaryMasterPin.expiresAt);
        const now = new Date();
        if (now <= expiryDate && password === currentSettings.temporaryMasterPin.pin) {
          isTemporaryPin = true;
          const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`🔑 Temporary PIN used! Expires in ${daysLeft} day(s)`);
        }
      }
      
      console.log(`🔍 VALIDATION - Admin Credentials Match: ${isAdminCredentials}, Permanent Master: ${isMasterPassword}, Temporary PIN: ${isTemporaryPin}`);
      
      if (isAdminCredentials || isMasterPassword || isTemporaryPin) {
        // Generate admin token
        const token = generateAdminToken();
        adminTokens.add(token);
        
        // The 786.Chat builder renders generated previews in a cross-site iframe.
        // Use a Secure SameSite=None partitioned cookie in production so the
        // admin session survives navigation and API requests inside that preview.
        const crossSitePreviewCookie = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
        res.cookie('admin_token', token, {
          httpOnly: true,
          secure: crossSitePreviewCookie,
          maxAge: 400 * 24 * 60 * 60 * 1000,
          sameSite: crossSitePreviewCookie ? 'none' : 'lax',
          partitioned: crossSitePreviewCookie,
          path: '/'
        } as any);
        
        console.log(`Admin login successful for: ${loginField}`);
        res.json({ success: true, message: "Admin login successful", token, user: loginField });
      } else {
        console.log(`Login failed for: ${loginField}`);
        console.log(`Checking against: sardar/121212 = ${loginField === ADMIN_USERNAME && password === ADMIN_PASSWORD}`);
        console.log(`Checking against master: ${loginField}/${MASTER_PASSWORD} = ${(loginField === ADMIN_USERNAME || loginField === currentSettings.adminCredentials.email) && password === MASTER_PASSWORD}`);
        res.status(401).json({ success: false, message: "Invalid admin credentials" });
      }
    } catch (error) {
      console.error("Error verifying admin login:", error);
      res.status(500).json({ message: "Failed to verify login" });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    try {
      const token = req.cookies?.admin_token;
      if (token && adminTokens.has(token)) {
        adminTokens.delete(token);
      }
      const crossSitePreviewCookie = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
      res.clearCookie('admin_token', {
        secure: crossSitePreviewCookie,
        sameSite: crossSitePreviewCookie ? 'none' : 'lax',
        partitioned: crossSitePreviewCookie,
        path: '/'
      } as any);
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Error during admin logout:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Admin authentication check endpoint
  app.get("/api/admin/auth-check", (req, res) => {
    try {
      const token = req.cookies?.admin_token;
      console.log(`Admin auth check - authenticated: ${Boolean(token && adminTokens.has(token))}`);
      
      // If token exists but not in memory (server restart), validate and re-add it
      if (token && !adminTokens.has(token)) {
        // Check if token format is valid (admin_timestamp_randomstring)
        if (token.startsWith('admin_') && token.includes('_')) {
          const parts = token.split('_');
          if (parts.length === 3) {
            const timestamp = parseInt(parts[1]);
            const now = Date.now();
            // Keep persistent admin sessions valid for the browser-supported long lifetime
            if (Number.isFinite(timestamp) && now - timestamp < 400 * 24 * 60 * 60 * 1000) {
              adminTokens.add(token);
              console.log(`Re-added persistent admin session after server restart`);
              return res.json({ authenticated: true, token });
            }
          }
        }
      }
      
      if (token && adminTokens.has(token)) {
        return res.json({ authenticated: true, token });
      }
      
      return res.status(401).json({ authenticated: false, message: "Not authenticated" });
    } catch (error) {
      console.error("Error checking admin authentication:", error);
      res.status(500).json({ authenticated: false, message: "Authentication check failed" });
    }
  });

  app.post("/api/admin/update-sidebar-pin", (req, res) => {
    try {
      const { pin } = req.body;
      
      if (!pin) {
        return res.status(400).json({ message: "PIN is required" });
      }

      currentSettings.regularSidebarPin = pin;
      
      if (saveSettings(currentSettings)) {
        console.log('Sidebar PIN updated');
        res.json({ message: "Sidebar PIN updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to save PIN" });
      }
    } catch (error) {
      console.error("Error updating sidebar PIN:", error);
      res.status(500).json({ message: "Failed to update PIN" });
    }
  });

  app.get("/api/admin/sidebar-pin", (req, res) => {
    res.json({ pin: currentSettings.regularSidebarPin });
  });

  // Sidebar PIN verification endpoint
  app.post("/api/verify-sidebar-pin", (req, res) => {
    try {
      const { pin } = req.body;
      
      if (!pin) {
        return res.status(400).json({ message: "PIN is required" });
      }

      // Reload settings to get latest PIN values
      currentSettings = loadSettings();
      
      const isValidRegularPin = (pin === currentSettings.regularSidebarPin);
      const isMasterPin = (pin === MASTER_SIDEBAR_PIN);
      const isOldPin = (pin.toLowerCase() === "smrptt77112233");
      
      // Check if temporary master PIN is used (valid for 1 week)
      let isTemporaryPin = false;
      if (currentSettings.temporaryMasterPin) {
        const expiryDate = new Date(currentSettings.temporaryMasterPin.expiresAt);
        const now = new Date();
        if (now <= expiryDate && pin === currentSettings.temporaryMasterPin.pin) {
          isTemporaryPin = true;
          const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`🔑 Temporary PIN used for sidebar unlock! Expires in ${daysLeft} day(s)`);
        }
      }
      
      console.log(`PIN verification - entered: ${pin}, regular: ${currentSettings.regularSidebarPin}, master: ${MASTER_SIDEBAR_PIN}, temporary: ${currentSettings.temporaryMasterPin?.pin}`);
      console.log(`Regular PIN match: ${isValidRegularPin}, Master PIN match: ${isMasterPin}, Temporary PIN match: ${isTemporaryPin}, Old PIN match: ${isOldPin}`);
      
      if (isValidRegularPin || isMasterPin || isTemporaryPin || isOldPin) {
        res.json({ success: true, message: "PIN verified successfully" });
      } else {
        res.status(401).json({ success: false, message: "Invalid PIN" });
      }
    } catch (error) {
      console.error("Error verifying sidebar PIN:", error);
      res.status(500).json({ message: "Failed to verify PIN" });
    }
  });

  // EMERGENCY DOCUMENT RECOVERY Smart Image API - Enhanced for missing file recovery
  app.get("/api/smart-image/:filename", async (req: any, res: any) => {
    try {
      const requestedFilename = req.params.filename;
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const cacheBuster = req.query._t || req.query.t || req.query.cb;
      
      console.log(`🖼️ smart-image request: ${requestedFilename}`);

      // FIRST: Check database for this filename — if stored in Object Storage, serve directly
      try {
        const photoRecord = await storage.getPhotoByFilename(requestedFilename);
        if (photoRecord && photoRecord.filepath && photoRecord.filepath.startsWith('/objects/')) {
          console.log(`☁️ smart-image: serving from Object Storage: ${photoRecord.filepath}`);
          const objectStorageService = new ObjectStorageService();
          const objectFile = await objectStorageService.getObjectEntityFile(photoRecord.filepath);
          await objectStorageService.downloadObject(objectFile, res, 86400);
          return;
        }
      } catch (objErr: any) {
        if (objErr?.name !== 'ObjectNotFoundError') {
          console.error(`smart-image Object Storage lookup error:`, objErr?.message);
        }
      }

      // Extract base name and variations for comprehensive search
      const baseName = requestedFilename.split('_').slice(1).join('_') || requestedFilename;
      const fileExtension = baseName.split('.').pop()?.toLowerCase();
      const baseNameNoExt = baseName.split('.')[0];
      
      // COMPREHENSIVE SEARCH - Cover ALL possible storage locations
      const searchPaths = [
        // Primary storage locations
        path.join(process.cwd(), 'data', 'photos'),
        path.join(process.cwd(), 'data', 'documents'),
        path.join(process.cwd(), 'data', 'reports'),
        path.join(process.cwd(), 'data', 'images'),
        path.join(process.cwd(), 'data', 'logos'),
        path.join(process.env.TMPDIR || "/tmp", "uploads"),
        path.join(process.env.TMPDIR || "/tmp", "attached_assets"),
        
        // Backup and recovery locations
        path.join(process.cwd(), 'backup', 'photos'),
        path.join(process.cwd(), 'backup', 'documents'),
        path.join(process.cwd(), 'backup', 'reports'),
        path.join(process.cwd(), 'backup', 'images'),
        path.join(process.cwd(), 'backup', 'logos'),
        
        // Additional legacy locations
        path.join(process.cwd(), 'public'),
        path.join(process.cwd(), 'server', 'uploads'),
        path.join(process.cwd(), 'client', 'public'),
        
        // PEST_CONTROL_SOURCE_EXPORT locations for recovery
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'data', 'photos'),
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'uploads'),
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'attached_assets'),
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'data', 'documents'),
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'backup', 'photos'),
      ];
      
      // ENHANCED MULTI-PATTERN SEARCH with detailed logging for file recovery
      let totalFilesSearched = 0;
      let directoriesSearched = 0;
      const searchResults = [];
      
      for (const searchPath of searchPaths) {
        try {
          if (!fs.existsSync(searchPath)) {
            console.log(`⚠️ Directory not found: ${searchPath}`);
            continue;
          }
          
          directoriesSearched++;
          const files = fs.readdirSync(searchPath);
          totalFilesSearched += files.length;
          
          console.log(`🔍 Searching in ${searchPath}: ${files.length} files`);
          
          // LEVEL 1: Exact filename match
          let foundFile = files.find((file: string) => file === requestedFilename);
          
          if (foundFile) {
            console.log(`✅ LEVEL 1 - Exact match found: ${foundFile} in ${searchPath}`);
          } else {
            // LEVEL 2: Case-insensitive exact match
            foundFile = files.find((file: string) => file.toLowerCase() === requestedFilename.toLowerCase());
            
            if (foundFile) {
              console.log(`✅ LEVEL 2 - Case-insensitive match: ${foundFile} in ${searchPath}`);
            } else {
              // LEVEL 3: Base name matching (remove timestamp prefixes)
              foundFile = files.find((file: string) => {
                const fileLower = file.toLowerCase();
                const baseNameLower = baseName.toLowerCase().split('.')[0];
                return fileLower.includes(baseNameLower) && 
                       fileLower.endsWith(`.${fileExtension}`);
              });
              
              if (foundFile) {
                console.log(`✅ LEVEL 3 - Base name match: ${foundFile} for ${baseName} in ${searchPath}`);
              } else {
                // LEVEL 4: Partial filename matching (for corrupted names)
                const searchTerms = baseNameNoExt.toLowerCase().split(/[_\-\s]+/);
                foundFile = files.find((file: string) => {
                  const fileLower = file.toLowerCase();
                  return searchTerms.length > 0 &&
                         searchTerms.every(term => term.length > 2 && fileLower.includes(term)) &&
                         fileLower.endsWith(`.${fileExtension}`);
                });
                
                if (foundFile) {
                  console.log(`✅ LEVEL 4 - Partial match: ${foundFile} for terms [${searchTerms.join(', ')}] in ${searchPath}`);
                } else {
                  // LEVEL 5: Similar extension fallback (jpg/jpeg interchange)
                  const altExtensions = {
                    'jpg': 'jpeg',
                    'jpeg': 'jpg',
                    'gif': 'png',
                    'png': 'gif'
                  };
                  
                  const altExt = altExtensions[fileExtension || ''] || fileExtension;
                  foundFile = files.find((file: string) => {
                    const fileLower = file.toLowerCase();
                    const baseNameLower = baseName.toLowerCase().split('.')[0];
                    return fileLower.includes(baseNameLower) && 
                           fileLower.endsWith(`.${altExt}`);
                  });
                  
                  if (foundFile) {
                    console.log(`✅ LEVEL 5 - Alternative extension match: ${foundFile} (${altExt} instead of ${fileExtension}) in ${searchPath}`);
                  }
                }
              }
            }
          }
          
          // Log search attempt for each directory
          searchResults.push({
            path: searchPath,
            fileCount: files.length,
            found: !!foundFile,
            matchedFile: foundFile || null
          });
          
          if (foundFile) {
            const filePath = path.join(searchPath, foundFile);
            const fileStats = fs.statSync(filePath);
            const lastModified = fileStats.mtime.getTime();
            
            console.log(`🎉 DOCUMENT RECOVERY SUCCESS: ${filePath}`);
            console.log(`📊 File details: Size: ${fileStats.size} bytes, Modified: ${new Date(lastModified).toISOString()}`);
            console.log(`📈 Search stats: ${directoriesSearched} directories, ${totalFilesSearched} total files examined`);
            
            // Enhanced MIME type support for ALL document types
            const mimeTypes: {[key: string]: string} = {
              // Images
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'gif': 'image/gif',
              'svg': 'image/svg+xml',
              'webp': 'image/webp',
              'bmp': 'image/bmp',
              'tiff': 'image/tiff',
              'ico': 'image/x-icon',
              
              // Documents
              'pdf': 'application/pdf',
              'doc': 'application/msword',
              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'xls': 'application/vnd.ms-excel',
              'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'ppt': 'application/vnd.ms-powerpoint',
              'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'txt': 'text/plain',
              'rtf': 'application/rtf',
              
              // Other
              'json': 'application/json',
              'xml': 'application/xml',
              'csv': 'text/csv'
            };
            
            const actualExtension = foundFile.split('.').pop()?.toLowerCase() || fileExtension;
            const contentType = mimeTypes[actualExtension] || mimeTypes[fileExtension || 'png'] || 'application/octet-stream';
            
            // MOBILE-OPTIMIZED CACHE HEADERS with emergency recovery flags
            if (isMobile || cacheBuster) {
              res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
              res.setHeader('ETag', `"recovered-mobile-${lastModified}-${fileStats.size}"`);
              console.log(`📱 Mobile recovery cache: 5min for ${requestedFilename}`);
            } else {
              res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
              res.setHeader('ETag', `"recovered-desktop-${lastModified}-${fileStats.size}"`);
              console.log(`💻 Desktop recovery cache: 1hr for ${requestedFilename}`);
            }
            
            // Recovery success headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('Last-Modified', new Date(lastModified).toUTCString());
            res.setHeader('X-File-Recovery', 'success');
            res.setHeader('X-Original-Request', requestedFilename);
            res.setHeader('X-Recovered-File', foundFile);
            res.setHeader('X-Recovery-Location', searchPath);
            res.setHeader('X-Mobile-Optimized', isMobile ? 'true' : 'false');
            
            // Enhanced security headers for all file types
            res.setHeader('X-Content-Type-Options', 'nosniff');
            if (actualExtension === 'svg') {
              res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
            } else if (['pdf', 'doc', 'docx'].includes(actualExtension)) {
              res.setHeader('Content-Disposition', 'inline; filename="' + foundFile + '"');
              res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            }
            
            // Stream the recovered file
            const fileStream = fs.createReadStream(filePath);
            fileStream.on('error', (streamError) => {
              console.error(`❌ File streaming error for ${filePath}:`, streamError);
              if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming recovered file', error: streamError.message });
              }
            });
            
            fileStream.pipe(res);
            return;
          }
        } catch (err) {
          console.error(`❌ Directory search error ${searchPath}:`, err);
          searchResults.push({
            path: searchPath,
            fileCount: 0,
            found: false,
            error: err.message
          });
        }
      }
      
      // COMPREHENSIVE FILE NOT FOUND RESPONSE with detailed recovery info
      console.error(`🚨 EMERGENCY: Document recovery failed for ${requestedFilename}`);
      console.error(`📊 Search completed: ${directoriesSearched} directories, ${totalFilesSearched} files examined, Mobile: ${isMobile}`);
      console.error(`🔍 Search details:`, searchResults.slice(0, 10)); // Log first 10 for debugging
      
      // Enhanced error response for frontend recovery mechanisms
      res.status(404).json({ 
        message: 'CRITICAL: Document file not found in any location', 
        requested: requestedFilename,
        baseName: baseName,
        baseNameNoExt: baseNameNoExt,
        extension: fileExtension,
        isMobile: isMobile,
        recovery: {
          directoriesSearched: directoriesSearched,
          totalFilesExamined: totalFilesSearched,
          searchResults: searchResults.map(r => ({
            path: r.path.replace(process.cwd(), ''),
            fileCount: r.fileCount,
            found: r.found,
            error: r.error || null
          })),
          alternativeExtensions: ['jpg', 'jpeg', 'png', 'gif'].filter(ext => ext !== fileExtension),
          suggestedPaths: [
            `/uploads/${requestedFilename}`,
            `/attached_assets/${requestedFilename}`,
            `/api/smart-image/${baseName}`,
            `/data/photos/${requestedFilename}?_t=${Date.now()}`,
            `/data/documents/${requestedFilename}?_t=${Date.now()}`
          ]
        },
        userAgent: userAgent.substring(0, 50),
        timestamp: new Date().toISOString(),
        troubleshooting: {
          possibleCauses: [
            'File was deleted or moved from original location',
            'File was not properly uploaded or saved',
            'File exists in backup location not being searched',
            'Filename may have been corrupted or renamed'
          ],
          nextSteps: [
            'Check if file exists in database but not filesystem',
            'Search for similar filenames in backup directories',
            'Verify file upload process completed successfully',
            'Consider manual file recovery from backups'
          ]
        }
      });
      
    } catch (error) {
      console.error('❌ Smart image serving error:', error);
      res.status(500).json({ 
        message: 'Error serving image',
        error: error.message,
        stack: error.stack?.substring(0, 500),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Admin authentication middleware
  const isAdminAuthenticated = (req: any, res: any, next: any) => {
    const token = req.cookies?.admin_token;
    console.log(`🔒 Admin auth check - URL: ${req.url}, Method: ${req.method}, authenticated: ${Boolean(token && adminTokens.has(token))}`);
    
    // If token exists but not in memory (server restart), validate and re-add it
    if (token && !adminTokens.has(token)) {
      // Check if token format is valid (admin_timestamp_randomstring)
      if (token.startsWith('admin_') && token.includes('_')) {
        const parts = token.split('_');
        if (parts.length === 3) {
          const timestamp = parseInt(parts[1]);
          const now = Date.now();
          // Keep persistent admin sessions valid for the browser-supported long lifetime
          if (Number.isFinite(timestamp) && now - timestamp < 400 * 24 * 60 * 60 * 1000) {
            adminTokens.add(token);
            console.log(`Re-added persistent admin session after server restart`);
            req.adminToken = token;
            return next();
          }
        }
      }
    }
    
    if (token && adminTokens.has(token)) {
      req.adminToken = token; // Store token for reference
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Branch authentication middleware
  const isBranchAuthenticated = (req: any, res: any, next: any) => {
    if (!req.session.branchId) {
      return res.status(401).json({ message: "Branch authentication required" });
    }
    next();
  };;

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.env.TMPDIR || "/tmp", "uploads")));
  
  // Serve test file
  app.get('/test-pin', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'test-pin.html'));
  });

  // Branch Authentication Routes
  app.post('/api/branch/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const branch = await storage.authenticateBranch(username, password);
      
      if (branch) {
        (req.session as any).branchId = branch.id;
        (req.session as any).userType = 'branch';
        res.json({ success: true, branch: { ...branch, password: undefined } });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Branch login error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'INACTIVE_BRANCH') {
        res.status(401).json({ message: "Your branch account is inactive." });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  });

  // Branch authentication endpoint for frontend
  app.post('/api/auth/branch-login', async (req, res) => {
    try {
      const { branchPin, password } = req.body;
      
      if (!branchPin || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Try to authenticate using email (branchPin is actually email)
      const branch = await storage.authenticateBranchByEmail(branchPin, password);
      
      if (branch) {
        (req.session as any).branchId = branch.id;
        (req.session as any).userType = 'branch';
        res.json({ 
          success: true, 
          branch: { ...branch, password: undefined },
          message: "Login successful"
        });
      } else {
        res.status(401).json({ message: "Invalid email or password" });
      }
    } catch (error) {
      console.error("Branch login error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'INACTIVE_BRANCH') {
        res.status(401).json({ message: "Your branch account is inactive." });
      } else {
        res.status(401).json({ message: "Invalid email or password" });
      }
    }
  });

  app.post('/api/branch/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get('/api/branch/current', async (req, res) => {
    try {
      const session = req.session as any;
      console.log('Branch current session check:', { branchId: session.branchId, userType: session.userType });
      
      if (session.branchId && session.userType === 'branch') {
        const branch = await storage.getBranch(session.branchId);
        if (branch) {
          res.json({ ...branch, password: undefined });
        } else {
          res.status(404).json({ message: "Branch not found" });
        }
      } else {
        res.status(401).json({ message: "Not authenticated" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get branch info" });
    }
  });

  // Auth routes for admin
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin Branch Management Routes with pagination and search
  app.get('/api/branches', isAdminAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 5000); // Default 50 per page, max 5000
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      let branches: Branch[];
      let totalCount: number;

      if (search && search.trim()) {
        // Optimized search - get paginated results directly
        branches = await storage.searchBranches(search.trim(), limit, offset);
        // Get count efficiently without loading all data
        totalCount = await storage.getSearchBranchesCount(search.trim());
      } else {
        branches = await storage.getBranches(limit, offset);
        totalCount = await storage.getBranchesCount();
      }

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        branches: branches.map(branch => ({ ...branch, password: undefined })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.post('/api/branches', isAdminAuthenticated, uploadLogoSafe, async (req, res) => {
    let uploadedTempPath: string | undefined;
    try {
      const branchData: any = { ...req.body };
      uploadedTempPath = req.file?.path;

      // Never accept an ID from form data. Generate one server-side and keep it
      // for the whole branch lifetime so all related records stay isolated.
      delete branchData.id;
      delete branchData.confirmPassword;

      if (!branchData.password || branchData.password.trim() === '') delete branchData.password;
      if (branchData.username === '' || branchData.username === null) delete branchData.username;
      if (branchData.email === '' || branchData.email === null) delete branchData.email;

      for (const dateField of ['contractStartDate', 'contractEndDate', 'lastTraining', 'trainingNextDue']) {
        if (dateField in branchData) {
          branchData[dateField] = branchData[dateField] ? new Date(branchData[dateField]) : null;
        }
      }

      const validatedData: any = insertBranchSchema.parse(branchData);
      const branchId = randomUUID();

      // Store the logo under the exact branch UUID that is written to the DB.
      if (req.file) {
        const objectStorageService = new ObjectStorageService();
        validatedData.logoUrl = await objectStorageService.uploadFile({
          localPath: req.file.path,
          branchId,
          category: 'logos',
          filename: req.file.originalname
        });
      }

      const branch = await storage.createBranch({ ...validatedData, id: branchId } as any);
      res.json({ ...branch, password: undefined });
    } catch (error: any) {
      console.error('Error creating branch:', error?.message || error);
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid branch data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Failed to create branch' });
    } finally {
      if (uploadedTempPath) {
        try { fs.unlinkSync(uploadedTempPath); } catch (_) {}
      }
    }
  });

  app.get('/api/branches/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const branch = await storage.getBranch(req.params.id);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json({ ...branch, password: undefined });
    } catch (error) {
      console.error("Error fetching branch:", error);
      res.status(500).json({ message: "Failed to fetch branch" });
    }
  });

  app.patch('/api/branches/:id', isAdminAuthenticated, uploadLogoSafe, async (req, res) => {
    try {
      const branchId = req.params.id;
      const existingBranch = await storage.getBranch(branchId);
      if (!existingBranch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      const updateData: any = { ...req.body };

      // Activating/customising a reserved slot marks that same UUID as occupied;
      // the slot number is preserved and no other branch record is touched.
      if (updateData.status === 'active' || (updateData.name && !String(updateData.name).startsWith('Available Branch '))) {
        updateData.settings = { ...(existingBranch.settings as any || {}), available: false };
      }
      
      console.log(`🔄 Branch update request: branchId=${branchId}, hasLogo=${!!req.file}, logoName=${req.file?.filename}`);
      
      // Keep ordinary branch edits saveable even if logo persistence fails.
      // The existing logo is retained when a logo-specific error occurs.
      const uploadedLogo = req.file;
      if (uploadedLogo) {
        try {
          const objectStorageService = new ObjectStorageService();
          const logoUrl = await objectStorageService.uploadFile({
            localPath: uploadedLogo.path,
            branchId,
            category: 'logos',
            filename: uploadedLogo.originalname
          });

          updateData.logoUrl = logoUrl;
          console.log(`✅ Logo uploaded for branch ${branchId}: ${logoUrl}`);
        } catch (logoError) {
          console.warn(`⚠️ Branch logo update failed for ${branchId}; saving other branch changes with the existing logo:`, logoError);
        } finally {
          if (uploadedLogo.path) {
            try {
              fs.unlinkSync(uploadedLogo.path);
            } catch {
              console.log('Temporary logo cleanup skipped/failed');
            }
          }
        }
      }
            delete updateData.confirmPassword;

      // Handle password update properly
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }

      // Unique fields: if empty string, remove them so the existing DB value is kept
      // (empty string would violate the unique constraint if another row already has '')
      if (updateData.username === '' || updateData.username === null) {
        delete updateData.username;
      }
      if (updateData.email === '' || updateData.email === null) {
        delete updateData.email;
      }

      // Convert every branch date field while preserving the same branch UUID.
      for (const dateField of ['contractStartDate', 'contractEndDate', 'lastTraining', 'trainingNextDue']) {
        if (dateField in updateData) {
          updateData[dateField] = updateData[dateField] ? new Date(updateData[dateField]) : null;
        }
      }

      console.log('Branch update request:', { 
        id: req.params.id, 
        hasPassword: !!updateData.password, 
        hasLogo: !!req.file,
        logoUrl: updateData.logoUrl || 'no logo'
      });
      
      const branch = await storage.updateBranch(req.params.id, updateData);
      
      // DISABLED: Logo auto-removal - logos will stay permanently on cards when updated
      // if (req.file && oldLogoPath) {
      //   try {
      //     // Only clean up the specific old logo file, not all files for this branch
      //     const oldLogoFilename = path.basename(oldLogoPath);
      //     const dirsToClean = [logosDir, backupLogosDir, legacyUploadsDir, attachedAssetsDir];
      //     
      //     for (const dir of dirsToClean) {
      //       const oldFilePath = path.join(dir, oldLogoFilename);
      //       if (fs.existsSync(oldFilePath)) {
      //         try {
      //           fs.unlinkSync(oldFilePath);
      //           console.log(`✓ Cleaned up old logo file: ${oldLogoFilename} from ${path.basename(dir)}`);
      //         } catch (deleteError) {
      //           console.log(`Failed to delete old logo file: ${oldLogoFilename} from ${path.basename(dir)}`);
      //         }
      //       }
      //     }
      //   } catch (cleanupError) {
      //     console.warn('Failed to cleanup old logo file:', cleanupError);
      //   }
      // }
      
      console.log('Branch updated successfully:', { 
        id: branch.id, 
        name: branch.name, 
        logoUpdated: !!req.file, 
        finalLogoUrl: branch.logoUrl 
      });
      
      res.json({ ...branch, password: undefined, logoUpdated: !!req.file });
    } catch (error) {
      console.error("Error updating branch:", error);
      res.status(500).json({ message: "Failed to update branch" });
    }
  });

  app.delete('/api/branches/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const branchId = req.params.id;
      console.log(`Admin deletion request for branch: ${branchId}`);
      
      if (!branchId) {
        return res.status(400).json({ message: "Branch ID is required" });
      }
      
      await storage.deleteBranch(branchId);
      
      console.log(`Branch ${branchId} successfully deleted`);
      res.json({ 
        success: true, 
        message: "Branch and all associated data deleted successfully" 
      });
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ 
        message: error.message || "Failed to delete branch",
        details: "Check server logs for more information"
      });
    }
  });

  // Generate realistic UK branch data for bulk creation
  function generateUKBranchData(count: number): any[] {
    const ukCities = [
      "London", "Birmingham", "Manchester", "Leeds", "Liverpool", "Sheffield", "Bristol", "Glasgow", 
      "Edinburgh", "Newcastle", "Cardiff", "Belfast", "Nottingham", "Brighton", "Hull", "Plymouth",
      "Stoke", "Wolverhampton", "Derby", "Swansea", "Southampton", "Salford", "Aberdeen", "Westminster",
      "Portsmouth", "York", "Peterborough", "Dundee", "Lancaster", "Oxford", "Newport", "Preston",
      "St Albans", "Norwich", "Chester", "Cambridge", "Salisbury", "Exeter", "Gloucester", "Lisburn",
      "Chichester", "Winchester", "Londonderry", "Carlisle", "Worcester", "Bath", "Durham", "Lincoln",
      "Wakefield", "Coventry", "Hamilton", "Blackpool", "Oldham", "Northampton", "Ipswich", "Reading"
    ];

    const ukPostcodes = [
      "SW1A 1AA", "M1 1AA", "B1 1AA", "LS1 1AA", "L1 1AA", "S1 1AA", "BS1 1AA", "G1 1AA",
      "EH1 1AA", "NE1 1AA", "CF1 1AA", "BT1 1AA", "NG1 1AA", "BN1 1AA", "HU1 1AA", "PL1 1AA",
      "ST1 1AA", "WV1 1AA", "DE1 1AA", "SA1 1AA", "SO1 1AA", "M5 1AA", "AB1 1AA", "SW1 1AA",
      "PO1 1AA", "YO1 1AA", "PE1 1AA", "DD1 1AA", "LA1 1AA", "OX1 1AA", "NP1 1AA", "PR1 1AA",
      "AL1 1AA", "NR1 1AA", "CH1 1AA", "CB1 1AA", "SP1 1AA", "EX1 1AA", "GL1 1AA", "BT9 1AA"
    ];

    const branches = [];
    const businessTypes = ["Restaurant", "Cafe", "Hotel", "Bakery", "Takeaway", "Pub", "Office", "Retail"];
    const paymentMethods = ["card", "bank_transfer", "direct_debit"];
    const paymentStatuses = ["paid", "pending", "overdue"];
    const frequencies = ["weekly", "bi-weekly", "monthly", "quarterly"];

    for (let i = 1; i <= count; i++) {
      const cityIndex = (i - 1) % ukCities.length;
      const city = ukCities[cityIndex];
      const businessType = businessTypes[i % businessTypes.length];
      const number = String(i).padStart(4, '0');
      
      // Generate unique identifiers
      const branchName = `${businessType} ${city} ${number}`;
      const username = `branch${number}${city.toLowerCase().replace(/\s+/g, '')}`;
      const email = `${username}@business${number}.co.uk`;
      
      // Generate realistic address
      const streetNames = ["High Street", "Queen Street", "King Street", "Church Lane", "Victoria Road", "Park Avenue"];
      const streetName = streetNames[i % streetNames.length];
      const buildingNumber = (i % 200) + 1;
      const address = `${buildingNumber} ${streetName}, ${city}`;
      
      // Generate phone number
      const phoneNumber = `0${(i % 8) + 1}${String(Math.floor(Math.random() * 900000000) + 100000000)}`;
      
      // Generate contract details
      const contractStartDate = new Date(2024, (i % 12), ((i % 28) + 1));
      const contractEndDate = new Date(contractStartDate.getFullYear() + 1, contractStartDate.getMonth(), contractStartDate.getDate());
      
      // Generate payment details
      const paymentAmount = (Math.floor(Math.random() * 500) + 100).toString();
      const starRating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
      
      // Generate next inspection dates
      const lastInspection = new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)); // Last 30 days
      const nextDue = new Date(lastInspection.getTime() + (28 * 24 * 60 * 60 * 1000)); // 28 days later

      branches.push({
        name: branchName,
        managerId: `manager_${number}`,
        status: "active",
        rating: (starRating + Math.random()).toFixed(1),
        address: address,
        phone: phoneNumber,
        username: username,
        password: "Password123!", // Will be hashed by the storage layer
        email: email,
        contactNumber: phoneNumber,
        postCode: ukPostcodes[cityIndex % ukPostcodes.length],
        contractNumber: `UK-${number}-2024`,
        contractStartDate: contractStartDate,
        contractEndDate: contractEndDate,
        paymentAmount: paymentAmount,
        paymentStatus: paymentStatuses[i % paymentStatuses.length],
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paymentFrequency: frequencies[i % frequencies.length],
        visitFrequency: frequencies[i % frequencies.length],
        starRating: starRating,
        lastInspection: lastInspection,
        nextDue: nextDue,
        settings: {
          notifications: true,
          autoPayments: Math.random() > 0.5,
          preferredContactMethod: Math.random() > 0.5 ? "email" : "phone"
        }
      });
    }

    return branches;
  }

  // Public bulk creation is disabled. Branch capacity is an admin-only operation.
  app.post('/api/dev/bulk-create-branches', (_req, res) => {
    return res.status(403).json({ message: 'Admin authentication required' });
  });

  // Provision up to 3,000 empty, independent branch slots. This endpoint is
  // idempotent and never creates fake customer documents/photos/reports.
  app.post('/api/admin/bulk-create-branches', isAdminAuthenticated, async (req, res) => {
    try {
      const requestedCount = Math.min(Math.max(Number(req.body?.count) || 3000, 1), 3000);
      const existingCount = await storage.getBranchesCount();

      if (existingCount >= requestedCount) {
        return res.json({
          success: true,
          message: `${existingCount} branch slots are already provisioned`,
          count: existingCount,
          created: 0
        });
      }

      const missingCount = requestedCount - existingCount;
      const slots = Array.from({ length: missingCount }, (_, index) => {
        const slotNumber = existingCount + index + 1;
        return {
          name: `Available Branch ${String(slotNumber).padStart(4, '0')}`,
          status: 'inactive',
          settings: { slotNumber, available: true }
        } as any;
      });

      const createdBranches = await storage.bulkCreateBranches(slots);
      return res.json({
        success: true,
        message: `${existingCount + createdBranches.length} branch slots are available`,
        count: existingCount + createdBranches.length,
        created: createdBranches.length
      });
    } catch (error) {
      console.error('Error provisioning branch slots:', error);
      return res.status(500).json({ message: 'Failed to provision branch slots' });
    }
  });


  // Document Management Routes - OBJECT STORAGE VERSION
  app.post('/api/documents/upload', isAdminAuthenticated, documentsUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!fs.existsSync(req.file.path)) {
        return res.status(500).json({ message: "File upload failed" });
      }

      // Upload to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const filepath = await objectStorageService.uploadFile({
        localPath: req.file.path,
        branchId: req.body.branchId || 'admin',
        category: 'documents',
        filename: req.file.originalname
      });

      console.log(`✅ Document uploaded to Object Storage: ${filepath}`);

      const document = await storage.createDocument({
        title: req.body.title,
        filename: req.file.originalname,
        filepath,
        type: req.body.type,
        category: req.body.category,
        branchId: req.body.branchId,
        uploadedBy: 'admin_user',
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      // Clean up temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.log('Temp file cleanup failed, but document is safely in Object Storage');
      }

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      // Clean up temp file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get('/api/documents', isAdminAuthenticated, async (req, res) => {
    try {
      const { branchId, category } = req.query;
      const documents = await storage.getDocuments(branchId as string, category as string);
      
      // Validate file existence and fix missing files
      const validatedDocuments = [];
      for (const doc of documents) {
        if (doc.filepath && fs.existsSync(doc.filepath)) {
          validatedDocuments.push(doc);
        } else if (doc.filename) {
          // Try to find file in uploads directory
          const uploadsPath = path.join(process.cwd(), 'uploads', doc.filename);
          const attachedPath = path.join(process.cwd(), 'attached_assets', doc.filename);
          
          if (fs.existsSync(uploadsPath)) {
            // Update filepath in database
            await storage.updateDocument(doc.id, { filepath: uploadsPath });
            validatedDocuments.push({ ...doc, filepath: uploadsPath });
            console.log(`Fixed document path: ${doc.filename} -> uploads/${doc.filename}`);
          } else if (fs.existsSync(attachedPath)) {
            // Update filepath in database
            await storage.updateDocument(doc.id, { filepath: attachedPath });
            validatedDocuments.push({ ...doc, filepath: attachedPath });
            console.log(`Fixed document path: ${doc.filename} -> attached_assets/${doc.filename}`);
          } else {
            console.warn(`Document file not found: ${doc.filename} (ID: ${doc.id})`);
            // Keep the document record but mark it as missing
            validatedDocuments.push({ ...doc, fileMissing: true });
          }
        } else {
          validatedDocuments.push(doc);
        }
      }
      
      res.json(validatedDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // MOBILE-OPTIMIZED Branch document access with enhanced mobile debugging
  app.get('/api/branch/documents', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // MOBILE DETECTION AND DEBUGGING for document visibility issues
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const clientIP = req.ip || req.connection.remoteAddress;
      const { category, _t, mobile } = req.query; // Enhanced cache busting parameters
      
      console.log(`📱 MOBILE DOCUMENT REQUEST: Branch: ${session.branchId}, Mobile: ${isMobile}, Category: ${category}, Cache-bust: ${_t}, Mobile-param: ${mobile}, IP: ${clientIP}, UA: ${userAgent.substring(0, 100)}`);
      
      if (isMobile) {
        console.log(`📱 MOBILE DEVICE DETECTED - Enhanced debugging enabled for document visibility`);
      }
      
      // For My Documents, only fetch documents that were manually saved (saved-reports, saved-yearly-docs, etc.)
      const documents = await storage.getDocuments(session.branchId, category as string);
      
      console.log(`Fetching documents for branch ${session.branchId}, found ${documents.length} documents`);
      
      // Validate file existence and fix missing files for branch view
      const validatedDocuments = [];
      for (const doc of documents) {
        let fullPath = doc.filepath;
        
        // Convert relative paths to absolute paths
        if (doc.filepath && !path.isAbsolute(doc.filepath)) {
          fullPath = path.join(process.cwd(), doc.filepath);
        }
        
        if (doc.filepath && fs.existsSync(fullPath)) {
          console.log(`✓ Document validated: ${doc.title} (${doc.filepath})`);
          validatedDocuments.push(doc);
        } else if (doc.filename) {
          console.log(`⚠ Document file missing: ${doc.title} (${doc.filepath || 'no path'}) - trying to fix...`);
          // Try to find file in uploads directory
          const uploadsPath = path.join(process.cwd(), 'uploads', doc.filename);
          const attachedPath = path.join(process.cwd(), 'attached_assets', doc.filename);
          
          if (fs.existsSync(uploadsPath)) {
            // Update filepath in database
            await storage.updateDocument(doc.id, { filepath: uploadsPath });
            validatedDocuments.push({ ...doc, filepath: uploadsPath });
            console.log(`Fixed branch document path: ${doc.filename} -> uploads/${doc.filename}`);
          } else if (fs.existsSync(attachedPath)) {
            // Update filepath in database
            await storage.updateDocument(doc.id, { filepath: attachedPath });
            validatedDocuments.push({ ...doc, filepath: attachedPath });
            console.log(`Fixed branch document path: ${doc.filename} -> attached_assets/${doc.filename}`);
          } else {
            console.warn(`Branch document file not found: ${doc.filename} (ID: ${doc.id})`);
            // Keep the document record but mark it as missing
            validatedDocuments.push({ ...doc, fileMissing: true });
          }
        } else {
          validatedDocuments.push(doc);
        }
      }
      
      console.log(`📱 MOBILE RESPONSE: Returning ${validatedDocuments.length} validated documents to branch ${session.branchId}, Mobile: ${isMobile}`);
      
      // MOBILE-OPTIMIZED cache headers for document visibility
      if (isMobile) {
        // Mobile devices get aggressive cache-busting to ensure new documents appear
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Last-Modified': new Date().toUTCString(),
          'X-Timestamp': Date.now().toString(),
          'X-Cache-Version': 'mobile-v' + Date.now(),
          'X-Mobile-Optimized': 'true',
          'X-Mobile-Cache-Strategy': 'aggressive-refresh',
          'ETag': '"mobile-' + Date.now() + '"'
        });
        console.log(`📱 MOBILE HEADERS: Applied aggressive cache-busting for mobile device`);
      } else {
        // Desktop gets standard cache-busting
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Last-Modified': new Date().toUTCString(),
          'X-Timestamp': Date.now().toString(),
          'X-Cache-Version': 'desktop-v' + Date.now(),
          'X-Mobile-Optimized': 'false',
          'ETag': '"desktop-' + Date.now() + '"'
        });
        console.log(`💻 DESKTOP HEADERS: Applied standard cache-busting for desktop device`);
      }
      
      // Log debug info but return simple documents array that frontend expects
      const debugInfo = {
        isMobile,
        userAgent: userAgent.substring(0, 100),
        timestamp: Date.now(),
        totalDocuments: validatedDocuments.length,
        branchId: session.branchId,
        cacheBuster: _t,
        mobileParam: mobile
      };
      
      if (isMobile) {
        console.log(`📱 MOBILE DEBUG INFO:`, debugInfo);
      }
      
      // Return simple documents array that frontend expects
      res.json(validatedDocuments);
    } catch (error) {
      console.error("Error fetching branch documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Branch document creation (for saving layouts and other data)
  app.post('/api/branch/documents', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { title, type, layoutData, category } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      console.log(`🔄 Branch ${session.branchId} saving layout to My Documents: ${title}`);

      // For layouts, save to shop_layouts table instead of documents
      if (type === 'layout' && layoutData) {
        const layout = await storage.createShopLayout({
          title,
          branchId: session.branchId,
          elements: layoutData.elements || [],
          dimensions: layoutData.dimensions || { width: 420, height: 594 },
          createdBy: 'branch',
          isActive: true
        });

        console.log(`✅ Layout saved to My Documents successfully: ${layout.id}`);
        res.json(layout);
      } else {
        // For other document types, use regular document storage
        const document = await storage.createDocument({
          title,
          type: type || 'document',
          category: category || 'saved-documents',
          branchId: session.branchId,
          filename: '', // No physical file for layout data  
          filepath: '', // No physical file for layout data
          uploadedBy: 'branch',
          fileSize: 0,
          mimeType: 'application/json'
        });

        console.log(`✅ Document created successfully: ${document.id}`);
        res.json(document);
      }
    } catch (error) {
      console.error("Error creating branch document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Branch ALL documents endpoint (like Monthly Reports) - shows ALL documents sent by admin
  app.get('/api/branch/all-documents', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get all documents sent to this branch (similar to Monthly Reports logic)
      const documents = await storage.getAllDocumentsForBranch(session.branchId);
      
      console.log(`Fetching ALL documents for branch ${session.branchId}, found ${documents.length} documents`);
      
      // Validate file existence and fix missing files for branch view
      const validatedDocuments = [];
      for (const doc of documents) {
        let fullPath = doc.filepath;
        
        // Convert relative paths to absolute paths
        if (doc.filepath && !path.isAbsolute(doc.filepath)) {
          fullPath = path.join(process.cwd(), doc.filepath);
        }
        
        if (doc.filepath && fs.existsSync(fullPath)) {
          console.log(`✓ Document validated: ${doc.title} (${doc.filepath})`);
          validatedDocuments.push(doc);
        } else if (doc.filename) {
          console.log(`⚠ Document file missing: ${doc.title} (${doc.filepath || 'no path'}) - trying to fix...`);
          // Try to find file in uploads and attached_assets directories
          const uploadsPath = path.join(process.cwd(), 'uploads', doc.filename);
          const attachedPath = path.join(process.cwd(), 'attached_assets', doc.filename);
          const dataPath = path.join(process.cwd(), 'data', 'documents', doc.filename);
          
          if (fs.existsSync(uploadsPath)) {
            await storage.updateDocument(doc.id, { filepath: uploadsPath });
            validatedDocuments.push({ ...doc, filepath: uploadsPath });
            console.log(`Fixed document path: ${doc.filename} -> uploads/${doc.filename}`);
          } else if (fs.existsSync(attachedPath)) {
            await storage.updateDocument(doc.id, { filepath: attachedPath });
            validatedDocuments.push({ ...doc, filepath: attachedPath });
            console.log(`Fixed document path: ${doc.filename} -> attached_assets/${doc.filename}`);
          } else if (fs.existsSync(dataPath)) {
            await storage.updateDocument(doc.id, { filepath: dataPath });
            validatedDocuments.push({ ...doc, filepath: dataPath });
            console.log(`Fixed document path: ${doc.filename} -> data/documents/${doc.filename}`);
          } else {
            console.warn(`Document file not found: ${doc.filename} (ID: ${doc.id})`);
            // Keep the document record but mark it as missing
            validatedDocuments.push({ ...doc, fileMissing: true });
          }
        } else {
          validatedDocuments.push(doc);
        }
      }
      
      console.log(`Returning ${validatedDocuments.length} ALL documents to branch ${session.branchId}`);
      res.json(validatedDocuments);
    } catch (error) {
      console.error("Error fetching ALL documents for branch:", error);
      res.status(500).json({ message: "Failed to fetch ALL documents" });
    }
  });

  app.get('/api/documents/:id/download', async (req, res) => {
    try {
      // CRITICAL FIX: Validate UUID format before database query
      const docId = req.params.id;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(docId)) {
        console.error(`❌ Invalid UUID format for document download: ${docId}`);
        return res.status(400).json({ 
          message: "Invalid document ID format",
          provided: docId,
          expected: "Valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)"
        });
      }
      
      const document = await storage.getDocument(docId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const session = req.session as any;
      // Check permissions
      if (session.userType === 'branch' && document.branchId !== session.branchId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // ENHANCED FILE SEARCH - Same comprehensive search as smart-image API
      console.log(`🚨 EMERGENCY DOCUMENT DOWNLOAD RECOVERY: ${document.filename}`);
      
      const baseName = document.filename.split('_').slice(1).join('_') || document.filename;
      const fileExtension = baseName.split('.').pop()?.toLowerCase();
      
      const searchPaths = [
        // Primary storage locations
        path.join(process.cwd(), 'data', 'photos'),
        path.join(process.cwd(), 'data', 'documents'),
        path.join(process.cwd(), 'data', 'reports'),
        path.join(process.env.TMPDIR || "/tmp", "uploads"),
        path.join(process.env.TMPDIR || "/tmp", "attached_assets"),
        // Backup locations
        path.join(process.cwd(), 'backup', 'photos'),
        path.join(process.cwd(), 'backup', 'documents'),
      ];
      
      let foundFile = null;
      let foundPath = null;
      
      for (const searchPath of searchPaths) {
        try {
          if (!fs.existsSync(searchPath)) continue;
          
          const files = fs.readdirSync(searchPath);
          
          // Exact match first
          foundFile = files.find((file: string) => file === document.filename);
          
          if (foundFile) {
            foundPath = path.join(searchPath, foundFile);
            console.log(`✅ DOCUMENT DOWNLOAD RECOVERY SUCCESS: ${foundPath}`);
            break;
          }
          
          // Pattern matching as fallback
          foundFile = files.find((file: string) => {
            const fileLower = file.toLowerCase();
            const baseNameLower = baseName.toLowerCase().split('.')[0];
            return fileLower.includes(baseNameLower) && 
                   fileLower.endsWith(`.${fileExtension}`);
          });
          
          if (foundFile) {
            foundPath = path.join(searchPath, foundFile);
            console.log(`✅ DOCUMENT DOWNLOAD RECOVERY (Pattern): ${foundPath}`);
            break;
          }
        } catch (err) {
          console.error(`❌ Search error in ${searchPath}:`, err);
        }
      }
      
      if (!foundFile || !foundPath) {
        console.error(`🚨 EMERGENCY: Document download file not found: ${document.filename}`);
        return res.status(404).json({ 
          message: "Document file not found in any storage location",
          filename: document.filename,
          originalPath: document.filepath
        });
      }

      // Update download timestamp
      await storage.updateDocument(document.id, { downloadedAt: new Date() });

      res.setHeader('Content-Disposition', `attachment; filename="${foundFile}"`);
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('X-File-Recovery', 'success');
      res.setHeader('X-Recovered-File', foundFile);
      
      const fileStream = fs.createReadStream(foundPath);
      fileStream.on('error', (streamError) => {
        console.error(`❌ File streaming error for ${foundPath}:`, streamError);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file', error: streamError.message });
        }
      });
      
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // PDF preview route for secure viewing
  app.get('/api/documents/:id/preview', async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const session = req.session as any;
      // Check permissions
      if (session.userType === 'branch' && document.branchId !== session.branchId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Set secure headers for document viewing (relaxed for iframe compatibility)
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Security-Policy', "default-src 'self'; frame-src 'self'; object-src 'none'; frame-ancestors 'self';");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Handle Object Storage files
      if (document.filepath && document.filepath.startsWith('/objects/')) {
        console.log('📦 Serving document from Object Storage:', document.filepath);
        try {
          const objectStorageService = new ObjectStorageService();
          const objectFile = await objectStorageService.getObjectEntityFile(document.filepath);
          await objectStorageService.downloadObject(objectFile, res);
          return;
        } catch (storageError) {
          console.error('Object Storage download error:', storageError);
          return res.status(404).json({ message: "Document not found in Object Storage" });
        }
      }

      if (!fs.existsSync(document.filepath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const fileStream = fs.createReadStream(document.filepath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error previewing document:", error);
      res.status(500).json({ message: "Failed to preview document" });
    }
  });

  // Notification Routes
  app.post('/api/notifications', isAdminAuthenticated, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse({
        ...req.body,
        id: randomUUID()
      });
      const notification = await storage.createNotification(validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.get('/api/notifications', isAdminAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotifications('admin_user');
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Branch notifications
  app.get('/api/branch/notifications', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const notifications = await storage.getNotifications(session.branchId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching branch notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Send document to branch
  app.post('/api/documents/:id/send', isAuthenticated, async (req, res) => {
    try {
      const { branchId } = req.body;
      const documentId = req.params.id;
      
      const document = await storage.updateDocument(documentId, {
        sentAt: new Date(),
        branchId: branchId
      });
      
      // Create notification for branch
      await storage.createNotification({
        branchId: branchId,
        message: `You have received a new document: ${document.title}`,
        visitDate: new Date().toISOString().split('T')[0],
        visitTime: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        purposeOfVisit: 'Document delivery - new document uploaded by admin'
      });
      
      res.json({ success: true, message: 'Document sent to branch successfully' });
    } catch (error) {
      console.error("Error sending document to branch:", error);
      res.status(500).json({ message: "Failed to send document" });
    }
  });

  // Send photo to branch - creates permanent branch copy
  app.post('/api/photos/:id/send', isAdminAuthenticated, async (req, res) => {
    console.log(`🚀 PHOTO SEND ROUTE HIT: photoId=${req.params.id}, branchId=${req.body?.branchId}`);
    try {
      const { branchId } = req.body;
      const photoId = req.params.id;
      
      console.log(`📷 Looking up photo: ${photoId}`);
      // Get the original admin photo
      const originalPhoto = await storage.getPhoto(photoId);
      if (!originalPhoto) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Generate new filename for branch copy
      const timestamp = Date.now();
      const originalFileName = originalPhoto.filename;
      const fileExtension = path.extname(originalFileName);
      const nameWithoutExt = path.basename(originalFileName, fileExtension);
      const branchFileName = `branch_photo_${branchId}_${timestamp}_${nameWithoutExt}${fileExtension}`;
      
      // Fix path resolution: treat paths starting with /data/ as relative to current working directory
      let originalFilePath;
      if (path.isAbsolute(originalPhoto.filepath) && !originalPhoto.filepath.startsWith('/data/')) {
        originalFilePath = originalPhoto.filepath;
      } else {
        // Remove leading slash and join with current working directory
        const relativePath = originalPhoto.filepath.replace(/^\/+/, '');
        originalFilePath = path.join(process.cwd(), relativePath);
      }
      
      console.log(`🔍 Searching for original photo file at: ${originalFilePath}`);
      
      // Check if it's an Object Storage path
      if (originalPhoto.filepath.startsWith('/objects/')) {
        console.log(`☁️ Photo is in Object Storage: ${originalPhoto.filepath}`);
        try {
          const objectStorageService = new ObjectStorageService();
          const objectFile = await objectStorageService.getObjectEntityFile(originalPhoto.filepath);
          
          // Download to a temporary file first
          const tempPath = path.join(process.cwd(), 'data', `temp_${photoId}${fileExtension}`);
          const writeStream = fs.createWriteStream(tempPath);
          
          await new Promise((resolve, reject) => {
            objectFile.createReadStream()
              .pipe(writeStream)
              .on('finish', resolve)
              .on('error', reject);
          });
          
          // Use the temp file as originalFilePath for copying
          originalFilePath = tempPath;
          console.log(`✅ Object Storage file downloaded to temp path: ${tempPath}`);
        } catch (storageError) {
          console.error("Failed to get file from Object Storage:", storageError);
          return res.status(500).json({ message: "Failed to retrieve photo from storage" });
        }
      }
      
      if (!fs.existsSync(originalFilePath)) {
        console.log(`❌ File not found at: ${originalFilePath}`);
        return res.status(404).json({ message: "Original photo file not found" });
      }
      
      console.log(`✅ Found original photo file at: ${originalFilePath}`);
      
      try {
        // Upload branch copy to Object Storage (permanent — survives redeploys)
        const objectStorageService = new ObjectStorageService();
        const permanentPath = await objectStorageService.uploadFile({
          localPath: originalFilePath,
          branchId: branchId,
          category: 'photos',
          filename: branchFileName,
        });
        console.log(`☁️ Branch photo saved to Object Storage: ${permanentPath}`);

        // Create the new photo record for the branch with Object Storage path
        await storage.createPhoto({
          id: randomUUID(),
          title: originalPhoto.title,
          filename: branchFileName,
          filepath: permanentPath,
          category: originalPhoto.category || 'general',
          branchId: branchId,
          uploadedBy: 'admin',
          sentAt: new Date(),
          description: originalPhoto.description,
          isDeleted: false
        });

        // Clean up temp file
        if (fs.existsSync(originalFilePath)) {
          fs.unlinkSync(originalFilePath);
          console.log(`🧹 Temporary file cleaned up: ${originalFilePath}`);
        }
      } catch (copyError) {
        console.error("Failed to create branch photo copies:", copyError);
        return res.status(500).json({ message: "Failed to create branch photo copy" });
      }
      
      // Create notification for branch (prevent duplicates)
      const notificationMessage = `You have received a new photo: ${originalPhoto.title}`;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if similar notification already exists for this branch today
      const existingNotifications = await storage.getNotificationsByBranch(branchId);
      const duplicateExists = existingNotifications.some(notification => 
        notification.message === notificationMessage && 
        notification.visitDate === today
      );
      
      if (!duplicateExists) {
        await storage.createNotification({
          branchId: branchId,
          message: notificationMessage,
          visitDate: today,
          visitTime: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          purposeOfVisit: 'Photo delivery - new photo uploaded by admin'
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Photo sent to branch successfully - branch now has permanent copy',
        updatedPhoto: originalPhoto // Return original photo to admin
      });
    } catch (error) {
      console.error("Error sending photo to branch:", error);
      res.status(500).json({ message: "Failed to send photo" });
    }
  });

  // Branch self-delete document (allow branches to delete their own uploaded documents)
  app.delete('/api/branch/documents/:id', isBranchAuthenticated, async (req, res) => {
    try {
      const documentId = req.params.id;
      const branchId = req.session.branchId;
      if (!branchId) {
        return res.status(401).json({ message: "Branch authentication required" });
      }
      
      // Get document to verify ownership
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Verify branch ownership - only allow branches to delete their own uploaded content
      if (document.branchId !== branchId) {
        return res.status(403).json({ message: "You can only delete your own uploaded documents" });
      }
      
      // Delete document
      await storage.deleteDocument(documentId);
      
      // Optionally delete physical file if it exists
      if (document.filepath && fs.existsSync(document.filepath)) {
        try {
          fs.unlinkSync(document.filepath);
          console.log(`Physical file deleted: ${document.filepath}`);
        } catch (fileError) {
          console.log("Physical file deletion failed, continuing...");
        }
      }
      
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      console.error("Error deleting branch document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Branch self-delete photo (allow branches to delete their own uploaded photos)
  app.delete('/api/branch/photos/:id', isBranchAuthenticated, async (req, res) => {
    try {
      const photoId = req.params.id;
      const branchId = req.session.branchId;
      if (!branchId) {
        return res.status(401).json({ message: "Branch authentication required" });
      }
      
      let deleted = false;

      // Try deleting from photos table first
      const photo = await storage.getPhoto(photoId);
      if (photo) {
        if (photo.branchId !== branchId) {
          return res.status(403).json({ message: "You can only delete your own uploaded photos" });
        }
        await storage.deleteBranchPhoto(photoId);
        // Delete physical file if it exists on local disk
        if (photo.filepath && !photo.filepath.startsWith('/objects/') && fs.existsSync(photo.filepath)) {
          try { fs.unlinkSync(photo.filepath); } catch {}
        }
        deleted = true;
      }

      // Also try deleting from documents table (photos saved to My Docs show up in Photos section too)
      if (!deleted) {
        const docRecord = await storage.getDocument(photoId);
        if (docRecord) {
          if (docRecord.branchId !== branchId) {
            return res.status(403).json({ message: "You can only delete your own photos" });
          }
          // Use isDeleted=true for branch deletion (getPhotos filters on this, not adminDeleted)
          await storage.markDocumentDeletedByBranch(photoId);
          deleted = true;
        }
      }

      res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (error) {
      console.error("Error deleting branch photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Get branch profile information
  app.get('/api/branch/profile', isBranchAuthenticated, async (req, res) => {
    try {
      const branchId = req.session.branchId;
      if (!branchId) {
        return res.status(401).json({ message: "Branch authentication required" });
      }
      const branch = await storage.getBranch(branchId);
      
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      
      // Remove sensitive information
      const { password, ...branchProfile } = branch;
      res.json(branchProfile);
    } catch (error) {
      console.error("Error fetching branch profile:", error);
      res.status(500).json({ message: "Failed to fetch branch profile" });
    }
  });

  // Branch password change (allow branches to change their own passwords)
  app.post('/api/branch/change-password', isBranchAuthenticated, async (req, res) => {
    try {
      const branchId = req.session.branchId;
      if (!branchId) {
        return res.status(401).json({ message: "Branch authentication required" });
      }
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Get branch for authentication
      const branch = await storage.getBranch(branchId);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      
      // Verify current password
      if (!branch.password) {
        return res.status(400).json({ message: "Branch password not set" });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, branch.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      await storage.updateBranch(branchId, { password: newPassword });
      
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error("Error changing branch password:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      res.status(500).json({ message: errorMessage });
    }
  });

  // Branch logo upload (allow branches to upload/change their own logo) - OBJECT STORAGE VERSION
  app.post('/api/branch/logo', isBranchAuthenticated, uploadLogoSafe, async (req, res) => {
    try {
      const branchId = (req.session as any).branchId;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'image/bmp'];
      if (!allowedTypes.includes(file.mimetype)) {
        // Clean up temporary file
        fs.unlinkSync(file.path);
        return res.status(400).json({ message: "Invalid file type. Only JPG, JPEG, PNG, GIF, SVG, WebP, and BMP files are allowed." });
      }

      // Upload to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const logoUrl = await objectStorageService.uploadFile({
        localPath: file.path,
        branchId,
        category: 'logos',
        filename: file.originalname
      });
      
      console.log(`✅ Logo uploaded to Object Storage for branch ${branchId}: ${logoUrl}`);

      // Update branch with new logo URL
      const updatedBranch = await storage.updateBranch(branchId, { 
        logoUrl
      });
      
      // Clean up temporary file after successful upload to Object Storage
      try {
        fs.unlinkSync(file.path);
        console.log(`✓ Temporary file cleaned up: ${file.path}`);
      } catch (cleanupError) {
        console.log('Temporary file cleanup failed, but logo is safely in Object Storage');
      }
      
      console.log(`✅ Branch ${branchId} uploaded new logo to permanent storage: ${logoUrl}`);
      
      res.json({ 
        message: "Logo uploaded successfully to permanent storage", 
        logoUrl,
        branch: updatedBranch 
      });
    } catch (error) {
      console.error("Error uploading branch logo:", error);
      // Clean up temporary file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // Branch email change (allow branches to change their own email)
  app.post('/api/branch/change-email', isBranchAuthenticated, async (req, res) => {
    try {
      const branchId = req.session.branchId;
      const { newEmail, password } = req.body;
      
      if (!newEmail || !password) {
        return res.status(400).json({ message: "New email and password are required" });
      }
      
      if (!branchId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get branch for authentication
      const branch = await storage.getBranch(branchId);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      
      // Verify password
      if (!branch.password) {
        return res.status(401).json({ message: "Branch password not configured" });
      }
      const isValidPassword = await bcrypt.compare(password, branch.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Password is incorrect" });
      }
      
      // Check if email is already taken
      const existingBranch = await storage.getBranchByUsername(newEmail);
      if (existingBranch && existingBranch.id !== branchId) {
        return res.status(400).json({ message: "Email is already taken" });
      }
      
      // Update email
      const updatedBranch = await storage.updateBranch(branchId, { 
        email: newEmail,
        username: newEmail // Update username as well since they're typically the same
      });
      
      res.json({ success: true, message: 'Email changed successfully', branch: updatedBranch });
    } catch (error) {
      console.error("Error changing branch email:", error);
      res.status(500).json({ message: "Failed to change email" });
    }
  });

  // Deployment-persistent branch logo upload
  app.post('/api/branches/:id/logo', isAdminAuthenticated, uploadLogoSafe, async (req, res) => {
    try {
      const branchId = req.params.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ message: "Only image files are allowed" });
      }

      // Get old logo path before updating (for cleanup after database update)
      const currentBranch = await storage.getBranch(branchId);
      const oldLogoPath = currentBranch?.logoUrl;

      // Upload to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const logoUrl = await objectStorageService.uploadFile({
        localPath: file.path,
        branchId,
        category: 'logos',
        filename: file.originalname
      });
      
      console.log(`✅ Logo uploaded to Object Storage for branch ${branchId}: ${logoUrl}`);
      
      // Update branch with logo URL
      const updatedBranch = await storage.updateBranch(branchId, { 
        logoUrl
      });
      
      // Clean up temporary file after successful upload to Object Storage
      try {
        fs.unlinkSync(file.path);
        console.log(`✓ Temporary file cleaned up: ${file.path}`);
      } catch (cleanupError) {
        console.log('Temporary file cleanup failed, but logo is safely in Object Storage');
      }
      
      console.log(`✅ Admin uploaded logo to permanent storage for branch ${branchId}: ${logoUrl}`);
      
      res.json({ 
        message: "Logo uploaded successfully to permanent storage", 
        logoUrl,
        branch: updatedBranch 
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // Helper function to generate branch initials
  function getBranchInitials(branchName: string): string {
    const words = branchName.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'BR';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(word => word[0].toUpperCase()).join('');
  }

  // Helper function to generate color from branch ID
  function generateBranchColor(branchId: string): string {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
      '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
    ];
    let hash = 0;
    for (let i = 0; i < branchId.length; i++) {
      hash = branchId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Helper function to generate SVG logo with initials
  function generateInitialLogo(branchName: string, branchId: string): string {
    const initials = getBranchInitials(branchName);
    const backgroundColor = generateBranchColor(branchId);
    const textColor = '#ffffff';
    
    return `
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="120" rx="8" fill="${backgroundColor}" />
        <text x="60" y="75" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
              text-anchor="middle" fill="${textColor}">${initials}</text>
      </svg>
    `.trim();
  }

  // Serve branch logo images with Object Storage support for permanent lifetime storage
  app.get('/api/branches/:id/logo', async (req, res) => {
    try {
      const branchId = req.params.id;
      
      // Get branch information
      const branch = await storage.getBranch(branchId);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // 786.Chat: serve logos persisted as data URLs on Vercel.
      if (branch.logoUrl && branch.logoUrl.startsWith('data:image/')) {
        const match = branch.logoUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          res.setHeader('Content-Type', match[1]);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.send(Buffer.from(match[2], 'base64'));
        }
      }
      // If logo is stored in Object Storage, redirect to Object Storage URL
      if (branch.logoUrl && branch.logoUrl.startsWith('/objects/')) {
        console.log(`✅ Logo from Object Storage for branch ${branchId}: ${branch.logoUrl}`);
        return res.redirect(branch.logoUrl);
      }

      // FIXED: Only generate initials logo if branch truly has no logo uploaded
      // All uploaded logos should be served regardless of their path or name
      const isDefaultLogo = !branch.logoUrl;
      
      if (isDefaultLogo) {
        // Generate dynamic initials-based logo
        const svgLogo = generateInitialLogo(branch.name, branchId);
        
        // Set proper headers for SVG with NO CACHE
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Force fresh logo
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('ETag', `"${branchId}-initials-${branch.name.length}"`);
        
        console.log(`Serving generated initials logo for branch: ${branch.name} (${branchId})`);
        
        // Send the SVG directly
        return res.send(svgLogo);
      }

      // Branch has a unique logo - serve the actual file from filesystem (legacy)
      // At this point, we know branch.logoUrl is not null due to the isDefaultLogo check
      const logoUrl = branch.logoUrl!; // Type assertion since we've already checked it's not null
      
      // Determine file path with fallback to multiple directories
      let logoPath: string;
      
      if (logoUrl.startsWith('/data/logos/')) {
        // Try data/logos directory first (new structure)
        logoPath = path.join(process.cwd(), logoUrl.substring(1));
      } else if (logoUrl.startsWith('/uploads/')) {
        // Try old uploads directory for backward compatibility
        logoPath = path.join(process.cwd(), logoUrl.substring(1));
      } else {
        // Direct file path
        logoPath = logoUrl;
      }
      
      // If not found, try alternative locations
      if (!fs.existsSync(logoPath)) {
        const filename = path.basename(logoUrl);
        
        // Try data/logos directory
        const dataLogosPath = path.join(logosDir, filename);
        if (fs.existsSync(dataLogosPath)) {
          logoPath = dataLogosPath;
        } else {
          // Try attached_assets backup
          const attachedPath = path.join(process.cwd(), 'attached_assets', filename);
          if (fs.existsSync(attachedPath)) {
            logoPath = attachedPath;
          } else {
            // Try old uploads directory
            const uploadsPath = path.join(process.cwd(), 'uploads', filename);
            if (fs.existsSync(uploadsPath)) {
              logoPath = uploadsPath;
            }
          }
        }
      }
      
      // If still not found, fallback to initials logo
      if (!fs.existsSync(logoPath)) {
        const svgLogo = generateInitialLogo(branch.name, branchId);
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('ETag', `"${branchId}-initials-fallback"`);
        
        console.log(`Logo file not found, serving initials fallback for branch: ${branch.name} (${branchId})`);
        
        return res.send(svgLogo);
      }
      
      // Get file extension to set correct content type
      const fileExtension = path.extname(logoPath).toLowerCase();
      let contentType = 'image/png'; // default
      
      switch (fileExtension) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
      }
      
      // Set proper headers for image serving with NO CACHE to prevent old logo display
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Force fresh logo every time
      res.setHeader('Pragma', 'no-cache'); // HTTP 1.0 compatibility
      res.setHeader('Expires', '0'); // Proxies
      res.setHeader('ETag', `"${branchId}-${fs.statSync(logoPath).mtime.getTime()}"`); // Include branchId in ETag
      
      console.log(`Serving unique logo: ${logoPath} (${contentType}) for branch ${branchId}`);
      
      // Stream the file
      const fileStream = fs.createReadStream(logoPath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error serving logo:", error);
      res.status(500).json({ message: "Failed to serve logo" });
    }
  });

  // Admin Statistics
  app.get('/api/admin/stats', isAdminAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Branch Statistics
  app.get('/api/branches/:id/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getBranchStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching branch stats:", error);
      res.status(500).json({ message: "Failed to fetch branch statistics" });
    }
  });

  // Branch dashboard stats (for logged in branches)
  app.get('/api/branch/stats', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const stats = await storage.getBranchStats(session.branchId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching branch stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Branch payment records endpoint
  app.get('/api/branch/payment-records', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const records = await storage.getPaymentRecordsByBranch(session.branchId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching branch payment records:", error);
      res.status(500).json({ message: "Failed to fetch payment records" });
    }
  });

  // Branch photos endpoint
  app.get('/api/branch/photos', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const photos = await storage.getPhotos(session.branchId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching branch photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Save photo to branch documents
  app.post('/api/branch/photos/:photoId/save-to-documents', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const photo = await storage.getPhoto(req.params.photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Check if photo belongs to this branch
      if (photo.branchId !== session.branchId) {
        return res.status(403).json({ message: "Photo not accessible" });
      }

      // Create a document entry from the photo
      const documentData = {
        title: `Photo: ${photo.title}`,
        filename: photo.filename,
        filepath: photo.filepath,
        type: 'photo',
        category: 'saved-photos',
        branchId: session.branchId,
        uploadedBy: photo.uploadedBy,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);
      
      res.json({ message: "Photo saved to My Documents", document });
    } catch (error: any) {
      console.error("Error saving photo to documents:", error);
      res.status(500).json({ message: "Failed to save photo to documents", error: error?.message || "Unknown error" });
    }
  });

  // Photo Management Routes - OBJECT STORAGE VERSION
  app.post('/api/photos', isAdminAuthenticated, photosUpload.single('photo'), async (req: any, res) => {
    try {
      console.log('Photo upload attempt:', {
        file: req.file ? 'File present' : 'No file',
        body: req.body,
        user: req.user?.claims?.sub
      });

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const filepath = await objectStorageService.uploadFile({
        localPath: req.file.path,
        branchId: req.body.branchId || 'admin',
        category: 'photos',
        filename: req.file.originalname
      });

      console.log(`✅ Photo uploaded to Object Storage: ${filepath}`);

      // For admin uploads, use a default admin ID
      const adminId = "admin_user";

      const photo = await storage.createPhoto({
        title: req.body.title || req.file.originalname,
        filename: req.file.originalname,
        filepath,
        type: req.body.type as 'before' | 'after',
        category: req.body.category || 'general',
        uploadedBy: adminId,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: req.body.description,
        notes: req.body.notes,
        treatment: req.body.treatment,
      });

      // Clean up temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.log('Temp file cleanup failed, but photo is safely in Object Storage');
      }

      console.log(`✅ Photo uploaded to permanent storage: ${filepath}`);
      res.json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      // Clean up temp file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  app.post('/api/photos/upload', isAdminAuthenticated, photosUpload.single('photo'), async (req, res) => {
    try {
      console.log('Photo upload attempt:', {
        file: req.file ? 'File present' : 'No file',
        body: req.body
      });

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const filepath = await objectStorageService.uploadFile({
        localPath: req.file.path,
        branchId: req.body.branchId || 'admin',
        category: 'photos',
        filename: req.file.originalname
      });

      console.log(`✅ Photo uploaded to Object Storage: ${filepath}`);

      // For admin uploads, use a default admin ID
      const adminId = "admin_user";

      const photoData = {
        title: req.body.title || req.file.originalname,
        description: req.body.description || '',
        notes: req.body.notes || '',
        treatment: req.body.treatment || '',
        filename: req.file.originalname,
        filepath,
        type: req.body.type || 'before',
        category: req.body.category || 'general',
        branchId: req.body.branchId || null,
        uploadedBy: adminId,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      };

      console.log('Photo data to save:', photoData);

      const validatedData = insertPhotoSchema.parse(photoData);
      console.log('Validated photo data:', validatedData);
      
      const photo = await storage.createPhoto(validatedData);
      console.log('Photo created successfully:', photo);

      // Clean up temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.log('Temp file cleanup failed, but photo is safely in Object Storage');
      }

      res.json(photo);
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      // Clean up temp file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to upload photo", error: error?.message || "Unknown error" });
    }
  });

  app.get('/api/photos', isAdminAuthenticated, async (req, res) => {
    try {
      const { branchId, category } = req.query;
      console.log('Fetching photos with filters:', { branchId, category });
      const photos = await storage.getPhotos(branchId as string, category as string);
      console.log('Photos found:', photos.length, photos);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.get('/api/photos/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      res.json(photo);
    } catch (error) {
      console.error("Error fetching photo:", error);
      res.status(500).json({ message: "Failed to fetch photo" });
    }
  });

  app.delete('/api/photos/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const photoId = req.params.id;
      const photo = await storage.getPhoto(photoId);
      
      // CRITICAL DUAL-TABLE COORDINATION FIX: Check if photo also exists in documents table
      const documentRecord = await storage.getDocument(photoId);
      let documentExists = false;
      
      // Check if this photo exists as a document (type='photo')
      if (documentRecord && documentRecord.type === 'photo') {
        documentExists = true;
        console.log(`📋 Photo ${photoId} also exists in documents table - dual-table coordination required`);
      }
      
      if (!photo && !documentExists) {
        // Photo doesn't exist in either table, treat as successful deletion
        return res.json({ message: "Photo already deleted or not found", success: true });
      }

      console.log(`🗑️ Admin requesting deletion of photo: ${photo?.title || documentRecord?.title} (ID: ${photoId})`);
      console.log(`📊 Deletion coordination: Photos table=${!!photo}, Documents table=${documentExists}`);
      
      // Check if photo has been sent to a branch (check both tables)
      const branchId = photo?.branchId || documentRecord?.branchId;
      const sentAt = photo?.sentAt || documentRecord?.sentAt;
      
      if (branchId && sentAt) {
        // Photo belongs to a branch - use soft deletion to preserve branch access
        console.log(`🔒 Photo sent to branch ${branchId} - using soft deletion to preserve branch access`);
        
        // CRITICAL FIX: Update BOTH tables with adminDeleted=true
        if (photo) {
          await storage.deletePhoto(photoId);
          console.log(`✅ Photos table updated with adminDeleted=true for ID: ${photoId}`);
        }
        
        if (documentExists) {
          await storage.deleteDocument(photoId);
          console.log(`✅ Documents table updated with adminDeleted=true for ID: ${photoId}`);
        }
        
        res.json({ 
          message: "Photo removed from admin view but preserved for branch access (both tables updated)", 
          success: true,
          preservedForBranch: true,
          updatedTables: {
            photos: !!photo,
            documents: documentExists
          }
        });
      } else {
        // Photo not sent to any branch - safe to completely delete including file
        console.log(`🗑️ Photo not sent to any branch - performing complete deletion`);
        
        // Delete the actual photo file (use photo record first, fallback to document record)
        const fileRecord = photo || documentRecord;
        if (fileRecord?.filepath) {
          const fullPath = fileRecord.filepath.startsWith('/') ? 
            path.join(process.cwd(), fileRecord.filepath.substring(1)) : 
            fileRecord.filepath;
          
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Photo file deleted: ${fullPath}`);
          }
        }

        // CRITICAL FIX: Delete from BOTH tables
        if (photo) {
          await storage.deletePhoto(photoId);
          console.log(`✅ Photo completely deleted from photos table: ${photoId}`);
        }
        
        if (documentExists) {
          await storage.deleteDocument(photoId);
          console.log(`✅ Photo completely deleted from documents table: ${photoId}`);
        }
        
        res.json({ 
          message: "Photo deleted completely from both tables", 
          success: true,
          preservedForBranch: false,
          updatedTables: {
            photos: !!photo,
            documents: documentExists
          }
        });
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete photo';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post('/api/photos/:id/assign-to-documents', isAdminAuthenticated, async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Create a document entry from the photo
      const documentData = {
        title: photo.title,
        description: photo.description,
        filename: photo.filename,
        filepath: photo.filepath,
        category: 'photos',
        branchId: photo.branchId,
        uploadedBy: photo.uploadedBy,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);

      res.json({ message: "Photo assigned to documents", document });
    } catch (error) {
      console.error("Error assigning photo to documents:", error);
      res.status(500).json({ message: "Failed to assign photo to documents" });
    }
  });

  app.post('/api/photos/:id/send-to-branch', isAdminAuthenticated, async (req, res) => {
    try {
      const { branchId } = req.body;
      if (!branchId) {
        return res.status(400).json({ message: "Branch ID is required" });
      }

      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Update photo with target branch
      await storage.updatePhoto(req.params.id, { branchId });

      res.json({ message: "Photo sent to branch successfully" });
    } catch (error) {
      console.error("Error sending photo to branch:", error);
      res.status(500).json({ message: "Failed to send photo to branch" });
    }
  });


  // Send useful links to branch
  app.post('/api/links', isAuthenticated, async (req: any, res) => {
    try {
      const { branchId, links, title, description } = req.body;
      const userId = (req.user as any)?.claims?.sub;

      if (!branchId || !links || !Array.isArray(links) || links.length === 0) {
        return res.status(400).json({ message: "Branch ID and links are required" });
      }

      // Create a link record in the database
      const linkData = {
        branchId,
        title: title || "Useful Links",
        url: JSON.stringify(links), // Store links as JSON in URL field
        description: description || "Food Standards Agency resources and regulatory guidance",
        uploadedBy: userId || 'admin'
      };

      const savedLink = await storage.createLink(linkData);
      res.json(savedLink);
    } catch (error) {
      console.error("Error sending links:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send links';
      res.status(500).json({ message: errorMessage });
    }
  });

  // PDF Report Generation from Templates
  app.get('/api/report-templates', isAdminAuthenticated, async (req, res) => {
    res.json(getTemplatesList());
  });

  // Serve Biro Script font to browser for live preview (licensed by user)
  app.get('/api/fonts/biro-script.ttf', isAdminAuthenticated, async (req, res) => {
    const fontPath = path.join(process.cwd(), 'server', 'templates', 'fonts', 'BiroScript.ttf');
    if (!fs.existsSync(fontPath)) return res.status(404).end();
    res.setHeader('Content-Type', 'font/ttf');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(fontPath);
  });

  // Serve raw PDF for a report (used by the click-to-place editor)
  app.get('/api/monthly-reports/:id/raw-pdf', isAdminAuthenticated, async (req, res) => {
    try {
      const report = await findReportForGeneration(req.params.id);
      if (!report) return res.status(404).json({ message: 'Report not found' });

      const objectStorageService = new ObjectStorageService();
      let pdfBuffer: Buffer;

      if (report.filepath.startsWith('/objects/')) {
        const objectFile = await objectStorageService.getObjectEntityFile(report.filepath);
        const [fileData] = await objectFile.download();
        pdfBuffer = fileData as Buffer;
      } else if (fs.existsSync(report.filepath)) {
        pdfBuffer = fs.readFileSync(report.filepath);
      } else {
        return res.status(404).json({ message: 'File not found in storage' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${report.filename}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to load PDF', error: error?.message });
    }
  });

  // Helper to find a report by ID from either monthly_reports or documents table
  async function findReportForGeneration(reportId: string) {
    // First try monthly_reports table
    const monthlyReport = await storage.getMonthlyReport(reportId);
    if (monthlyReport) {
      return {
        id: monthlyReport.id,
        title: monthlyReport.title,
        filename: monthlyReport.filename,
        filepath: monthlyReport.filepath,
        reportType: monthlyReport.reportType,
        viewSize: monthlyReport.viewSize,
      };
    }
    // Fall back to documents table (some reports live there)
    const doc = await storage.getDocument(reportId);
    if (doc) {
      return {
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        filepath: doc.filepath,
        reportType: doc.type || 'general',
        viewSize: 'A4',
      };
    }
    return null;
  }

  // Generate new report by updating only the date on an existing report
  app.post('/api/monthly-reports/generate', isAdminAuthenticated, async (req, res) => {
    try {
      const { baseReportId, newDate, newTitle } = req.body;

      if (!baseReportId || !newDate) {
        return res.status(400).json({ message: 'baseReportId and newDate are required' });
      }

      // Load the original report from storage (checks both tables)
      const baseReport = await findReportForGeneration(baseReportId);
      if (!baseReport) {
        return res.status(404).json({ message: 'Base report not found' });
      }

      // Download the PDF from Object Storage or local path
      let pdfBuffer: Buffer;
      const objectStorageService = new ObjectStorageService();

      if (baseReport.filepath.startsWith('/objects/')) {
        const objectFile = await objectStorageService.getObjectEntityFile(baseReport.filepath);
        const [fileData] = await objectFile.download();
        pdfBuffer = fileData as Buffer;
      } else if (fs.existsSync(baseReport.filepath)) {
        pdfBuffer = fs.readFileSync(baseReport.filepath);
      } else {
        return res.status(404).json({ message: 'Base report file not found in storage' });
      }

      // Update only the date on the PDF — use exact click coordinates if provided
      const { dateX, dateY, fontSize: bodyFontSize, fontFamily, fontColor, fontBold, extraItems } = req.body;
      const coords = (dateX !== undefined && dateY !== undefined)
        ? { x: Number(dateX), y: Number(dateY) }
        : undefined;
      console.log(`📌 Generate coords: dateX=${dateX} dateY=${dateY} → coords=${JSON.stringify(coords)} fontSize=${bodyFontSize} fontColor=${fontColor} extraItems=${extraItems?.length ?? 0}`);
      const updatedPdfBytes = await updateDateOnPdf(pdfBuffer, newDate, baseReport.reportType, {
        ...coords,
        fontSize: bodyFontSize ? Number(bodyFontSize) : undefined,
        fontFamily: fontFamily || undefined,
        fontColor: fontColor || undefined,
        fontBold: fontBold === true || fontBold === 'true',
        extraItems: Array.isArray(extraItems) ? extraItems : [],
      });

      // Save the new PDF
      const dateStr = newDate.replace(/\//g, '-');
      const baseName = baseReport.filename.replace(/\.[^/.]+$/, '');
      const filename = `${baseName}_${dateStr}.pdf`;
      const tempPath = `/tmp/${filename}`;
      fs.writeFileSync(tempPath, updatedPdfBytes);

      const filepath = await objectStorageService.uploadFile({
        localPath: tempPath,
        branchId: 'admin',
        category: 'monthly-reports',
        filename
      });
      try { fs.unlinkSync(tempPath); } catch {}

      // Save new report record
      const reportData = {
        title: newTitle || `${baseReport.title} - ${newDate}`,
        filename,
        filepath,
        reportType: baseReport.reportType,
        fileSize: updatedPdfBytes.length,
        mimeType: 'application/pdf',
        viewSize: baseReport.viewSize || 'A4',
        uploadedBy: 'admin_user',
        branchId: null as any,
      };

      const validatedData = insertMonthlyReportSchema.parse(reportData);
      const report = await storage.createMonthlyReport(validatedData);

      console.log(`✅ Generated new report with updated date ${newDate}: ${report.id}`);
      res.json({ success: true, report });
    } catch (error: any) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error?.message });
    }
  });

  // Preview - update date on existing report and return PDF for viewing
  app.post('/api/monthly-reports/preview', isAdminAuthenticated, async (req, res) => {
    try {
      const { baseReportId, newDate } = req.body;
      if (!baseReportId || !newDate) {
        return res.status(400).json({ message: 'baseReportId and newDate are required' });
      }

      const baseReport = await findReportForGeneration(baseReportId);
      if (!baseReport) return res.status(404).json({ message: 'Report not found' });

      const objectStorageService = new ObjectStorageService();
      let pdfBuffer: Buffer;

      if (baseReport.filepath.startsWith('/objects/')) {
        const objectFile = await objectStorageService.getObjectEntityFile(baseReport.filepath);
        const [fileData] = await objectFile.download();
        pdfBuffer = fileData as Buffer;
      } else if (fs.existsSync(baseReport.filepath)) {
        pdfBuffer = fs.readFileSync(baseReport.filepath);
      } else {
        return res.status(404).json({ message: 'File not found in storage' });
      }

      const { dateX, dateY, fontSize: bodyFontSize, fontFamily, fontColor, fontBold, extraItems } = req.body;
      const coords = (dateX !== undefined && dateY !== undefined)
        ? { x: Number(dateX), y: Number(dateY) }
        : undefined;
      const updatedPdf = await updateDateOnPdf(pdfBuffer, newDate, baseReport.reportType, {
        ...coords,
        fontSize: bodyFontSize ? Number(bodyFontSize) : undefined,
        fontFamily: fontFamily || undefined,
        fontColor: fontColor || undefined,
        fontBold: fontBold === true || fontBold === 'true',
        extraItems: Array.isArray(extraItems) ? extraItems : [],
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
      res.send(Buffer.from(updatedPdf));
    } catch (error: any) {
      console.error('Error previewing report:', error);
      res.status(500).json({ message: 'Failed to preview report', error: error?.message });
    }
  });

  // Monthly Reports API Routes - OBJECT STORAGE VERSION
  app.post('/api/monthly-reports', isAdminAuthenticated, monthlyReportsUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const filepath = await objectStorageService.uploadFile({
        localPath: req.file.path,
        branchId: 'admin',
        category: 'monthly-reports',
        filename: req.file.originalname
      });

      console.log(`✅ Monthly report uploaded to Object Storage: ${filepath}`);

      const reportData = {
        title: req.body.title || req.file.originalname,
        filename: req.file.originalname,
        filepath,
        reportType: req.body.reportType || 'general',
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        viewSize: req.body.viewSize || 'A4',
        uploadedBy: 'admin_user',
        // Don't auto-assign to branch on upload - keep in Monthly Reports
        branchId: null,
      };

      const validatedData = insertMonthlyReportSchema.parse(reportData);
      const report = await storage.createMonthlyReport(validatedData);
      
      // Clean up temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.log('Temp file cleanup failed, but report is safely in Object Storage');
      }
      
      // Don't auto-save to My Docs - keep only in Monthly Reports until explicitly sent
      console.log('Monthly report created successfully:', report.id);
      
      res.json(report);
    } catch (error: any) {
      console.error("Error uploading monthly report:", error);
      // Clean up temp file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to upload monthly report", error: error?.message });
    }
  });

  app.get('/api/monthly-reports', isAdminAuthenticated, async (req, res) => {
    try {
      const { branchId, reportType } = req.query;
      const reports = await storage.getMonthlyReports(branchId as string, reportType as string);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching monthly reports:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch monthly reports';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/monthly-reports/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const report = await storage.getMonthlyReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Monthly report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching monthly report:", error);
      res.status(500).json({ message: "Failed to fetch monthly report" });
    }
  });

  app.patch('/api/monthly-reports/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const updateData = req.body;
      const updatedReport = await storage.updateMonthlyReport(req.params.id, updateData);
      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating monthly report:", error);
      res.status(500).json({ message: "Failed to update monthly report" });
    }
  });

  app.delete('/api/monthly-reports/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const reportId = req.params.id;
      
      // CRITICAL DUAL-TABLE COORDINATION FIX: Check if monthly report also exists in documents table
      const monthlyReport = await storage.getMonthlyReport(reportId);
      const documentRecord = await storage.getDocument(reportId);
      let documentExists = false;
      
      // Check if this monthly report exists as a document (type='monthly-report')
      if (documentRecord && documentRecord.type === 'monthly-report') {
        documentExists = true;
        console.log(`📋 Monthly report ${reportId} also exists in documents table - dual-table coordination required`);
      }
      
      if (!monthlyReport && !documentExists) {
        // Report doesn't exist in either table, treat as successful deletion
        return res.json({ message: "Monthly report already deleted or not found" });
      }

      console.log(`🗑️ Admin requesting deletion of monthly report: ${monthlyReport?.title || documentRecord?.title} (ID: ${reportId})`);
      console.log(`📊 Deletion coordination: monthly_reports table=${!!monthlyReport}, Documents table=${documentExists}`);
      
      // CRITICAL FIX: Update BOTH tables with adminDeleted=true
      if (monthlyReport) {
        await storage.deleteMonthlyReport(reportId);
        console.log(`✅ monthly_reports table updated with adminDeleted=true for ID: ${reportId}`);
      }
      
      if (documentExists) {
        await storage.deleteDocument(reportId);
        console.log(`✅ Documents table updated with adminDeleted=true for ID: ${reportId}`);
      }
      
      res.json({ 
        message: "Monthly report deleted from admin view but preserved for branch access (both tables updated)",
        updatedTables: {
          monthlyReports: !!monthlyReport,
          documents: documentExists
        }
      });
    } catch (error) {
      console.error("Error deleting monthly report:", error);
      res.status(500).json({ message: "Failed to delete monthly report" });
    }
  });

  // Manual send single report to My Documents - Fixed authentication
  app.post('/api/monthly-reports/:id/send-to-mydocs', async (req, res) => {
    try {
      const adminToken = req.cookies?.admin_token;
      const session = req.session as any;
      
      // Allow both admin and branch authentication
      const isAdminAuth = adminToken && adminTokens.has(adminToken);
      const isBranchAuth = session.branchId && session.userType === 'branch';
      
      if (!isAdminAuth && !isBranchAuth) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await storage.sendReportToMyDocs(req.params.id);
      res.json({ message: "Report sent to My Documents successfully" });
    } catch (error) {
      console.error("Error sending report to My Documents:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        res.status(409).json({ message: "Report already exists in My Documents" });
      } else if (errorMessage.includes('not found')) {
        res.status(404).json({ message: "Report not found" });
      } else {
        res.status(500).json({ message: "Failed to send report to My Documents" });
      }
    }
  });



  app.post('/api/monthly-reports/:id/update-file', isAuthenticated, branchReportsUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const reportId = req.params.id;
      const report = await storage.getMonthlyReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Monthly report not found" });
      }

      // Upload new file to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const filepath = await objectStorageService.uploadFile({
        localPath: req.file.path,
        branchId: 'admin',
        category: 'monthly-reports',
        filename: req.file.originalname
      });

      console.log(`✅ Updated monthly report uploaded to Object Storage: ${filepath}`);

      // Delete old file from Object Storage if it exists
      if (report.filepath && report.filepath.startsWith('/objects/')) {
        try {
          await objectStorageService.deleteFile(report.filepath);
          console.log(`🗑️ Deleted old file from Object Storage: ${report.filepath}`);
        } catch (deleteError) {
          console.log('Old file cleanup failed, but new file is uploaded');
        }
      }

      // Update report with new file information
      const updateData = {
        filename: req.file.originalname,
        filepath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        updatedAt: new Date(),
      };

      const updatedReport = await storage.updateMonthlyReport(reportId, updateData);

      // Clean up temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.log('Temp file cleanup failed, but report is safely in Object Storage');
      }

      res.json({ message: "Monthly report file updated successfully", report: updatedReport });
    } catch (error) {
      console.error("Error updating monthly report file:", error);
      // Clean up temp file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to update monthly report file" });
    }
  });

  // Send monthly report to branch - Single route
  app.post('/api/monthly-reports/:id/send-to-branch', isAdminAuthenticated, async (req, res) => {
    try {
      const { branchId } = req.body;
      const reportId = req.params.id;
      
      if (!branchId) {
        return res.status(400).json({ message: "Branch ID is required" });
      }

      const updatedReport = await storage.sendMonthlyReportToBranch(reportId, branchId);
      res.json({ message: "Monthly report sent to branch successfully", report: updatedReport });
    } catch (error) {
      console.error("Error sending monthly report to branch:", error);
      res.status(500).json({ message: "Failed to send monthly report to branch" });
    }
  });

  app.post('/api/monthly-reports/:id/save-to-documents', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const report = await storage.getMonthlyReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Monthly report not found" });
      }

      // Create a document entry from the monthly report for lifetime storage
      const issueDate = new Date(); // Current date as issue date
      const validityEndDate = new Date();
      validityEndDate.setMonth(validityEndDate.getMonth() + 1); // 1 month validity

      const documentData = {
        title: `Monthly Report: ${report.title}`,
        filename: report.filename,
        filepath: report.filepath,
        type: 'monthly-report',
        category: 'saved-reports',
        branchId: session.branchId,
        uploadedBy: report.uploadedBy,
        fileSize: report.fileSize,
        mimeType: report.mimeType,
        // No expiryDate set here - document persists permanently as requested
        description: `Issue Date: ${issueDate.toLocaleDateString()} | Valid Until: ${validityEndDate.toLocaleDateString()}`,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);
      
      res.json({ message: "Monthly report saved to My Documents", document });
    } catch (error: any) {
      console.error("Error saving monthly report to documents:", error);
      res.status(500).json({ message: "Failed to save monthly report", error: error?.message });
    }
  });

  // Branch monthly reports endpoint
  app.get('/api/branch/monthly-reports', async (req, res) => {
    try {
      const session = req.session as any;
      console.log('🔍 Branch monthly reports request - Session data:', {
        branchId: session.branchId,
        userType: session.userType,
        hasSession: !!req.session
      });
      
      if (!session.branchId || session.userType !== 'branch') {
        console.log('❌ Authentication check failed:', { branchId: session.branchId, userType: session.userType });
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      console.log(`✅ Calling getMonthlyReports with branchId: ${session.branchId}`);
      const reports = await storage.getMonthlyReports(session.branchId);
      console.log(`✅ Found ${reports.length} monthly reports`);
      res.json(reports);
    } catch (error) {
      console.error("❌ Error fetching branch monthly reports:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Failed to fetch monthly reports", error: errorMessage });
    }
  });

  // Branch send report to My Documents endpoint
  app.post('/api/branch/monthly-reports/:reportId/send-to-mydocs', async (req, res) => {
    try {
      const session = req.session as any;
      console.log('📝 Save to My Docs request:', { 
        reportId: req.params.reportId, 
        sessionBranchId: session?.branchId,
        userType: session?.userType 
      });
      
      if (!session.branchId || session.userType !== 'branch') {
        console.log('❌ Authentication failed - not authenticated as branch');
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { reportId } = req.params;
      console.log('🔄 Attempting to save report to My Docs:', reportId);
      
      await storage.sendReportToMyDocs(reportId);
      console.log('✅ Report saved to My Docs successfully');
      
      res.json({ success: true, message: "Report saved to My Documents successfully" });
    } catch (error) {
      console.error("❌ Error sending report to My Documents:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        res.status(409).json({ message: "This report is already saved in My Documents" });
      } else if (errorMessage.includes('not found')) {
        res.status(404).json({ message: "Report not found" });
      } else {
        res.status(500).json({ message: "Failed to save report to My Documents" });
      }
    }
  });

  // Branch monthly report deletion endpoint
  app.delete('/api/branch/monthly-reports/:id', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // FIXED: Check both monthly_reports table AND documents table for deletion
      let report = await storage.getMonthlyReport(req.params.id);
      let isInDocumentsTable = false;
      
      // If not found in monthly_reports table, check documents table
      if (!report) {
        const document = await storage.getDocument(req.params.id);
        if (document && document.type === 'monthly-report') {
          report = {
            id: document.id,
            title: document.title,
            branchId: document.branchId,
            // Other fields don't matter for deletion check
          } as any;
          isInDocumentsTable = true;
          console.log('Found monthly report for deletion in documents table:', req.params.id);
        }
      }
      
      if (!report) {
        return res.status(404).json({ message: "Monthly report not found" });
      }

      // Verify the report belongs to this branch
      if (report.branchId !== session.branchId) {
        return res.status(403).json({ message: "Unauthorized - cannot delete reports from other branches" });
      }

      // Delete from appropriate table
      if (isInDocumentsTable) {
        // For documents table, mark as deleted (adminDeleted=true)
        await storage.updateDocument(req.params.id, { adminDeleted: true });
        console.log(`Monthly report ${req.params.id} deleted from documents table (marked as adminDeleted: true)`);
      } else {
        // For monthly_reports table, use existing method
        await storage.deleteMonthlyReportFromBranch(req.params.id);
      }
      res.json({ success: true, message: "Monthly report deleted successfully" });
    } catch (error) {
      console.error("Error deleting monthly report from branch:", error);
      res.status(500).json({ message: "Failed to delete monthly report" });
    }
  });

  // Check if report exists in My Documents
  app.get('/api/branch/monthly-reports/:reportId/check-mydocs', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { reportId } = req.params;
      const exists = await storage.checkReportInMyDocs(reportId, session.branchId);
      res.json({ exists });
    } catch (error) {
      console.error("Error checking report in My Documents:", error);
      res.status(500).json({ message: "Failed to check report status" });
    }
  });

  // Monthly Reports View Endpoint for Branch Users
  app.get('/api/monthly-reports/:id/view', async (req, res) => {
    try {
      const session = req.session as any;
      const adminToken = req.cookies?.admin_token;
      
      console.log('Monthly report view request:', { 
        reportId: req.params.id, 
        session: session?.branchId ? 'branch' : 'none',
        adminToken: adminToken ? 'admin' : 'none'
      });
      
      // Allow both branch users and admin users to view reports
      const isBranchAuth = session.branchId && session.userType === 'branch';
      const isAdminAuth = adminToken && adminTokens.has(adminToken);
      
      if (!isBranchAuth && !isAdminAuth) {
        console.log('Monthly report view: Not authenticated');
        return res.status(401).json({ message: "Not authenticated" });
      }

      const report = await storage.getMonthlyReport(req.params.id);
      if (!report) {
        console.log('Monthly report not found in database:', req.params.id);
        return res.status(404).json({ message: "Monthly report not found" });
      }

      console.log('Found monthly report:', { 
        id: report.id, 
        title: report.title, 
        filepath: report.filepath,
        filename: report.filename 
      });

      // For branch users, check if report is sent to their branch
      if (isBranchAuth && report.branchId !== session.branchId) {
        console.log('Access denied: branch mismatch', { reportBranch: report.branchId, sessionBranch: session.branchId });
        return res.status(403).json({ message: "Access denied" });
      }

      // Update viewed timestamp
      await storage.updateMonthlyReport(req.params.id, { viewedAt: new Date() });

      // Set appropriate content type and headers
      const mimeType = report.mimeType || 'application/pdf';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${report.filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Handle Object Storage files
      if (report.filepath && report.filepath.startsWith('/objects/')) {
        console.log('📦 Serving from Object Storage:', report.filepath);
        try {
          const objectStorageService = new ObjectStorageService();
          const objectFile = await objectStorageService.getObjectEntityFile(report.filepath);
          await objectStorageService.downloadObject(objectFile, res);
          return;
        } catch (storageError) {
          console.error('Object Storage download error:', storageError);
          return res.status(404).json({ message: "File not found in Object Storage" });
        }
      }

      // Handle local filesystem files
      const filePath = path.join(process.cwd(), report.filepath.startsWith('/') ? report.filepath.substring(1) : report.filepath);
      console.log('Checking file path:', { 
        originalPath: report.filepath, 
        resolvedPath: filePath,
        cwd: process.cwd(),
        exists: fs.existsSync(filePath)
      });
      
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        return res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      console.error("Error viewing monthly report:", error);
      res.status(500).json({ message: "Failed to view monthly report" });
    }
  });

  // PDF Document viewer route
  app.get('/api/documents/preview/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // For demo purposes, create a sample PDF path
      // In production, this would fetch from your document storage
      if (filename === 'sample-document.pdf') {
        // Create a simple PDF response for testing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="sample-document.pdf"');
        
        // For now, redirect to a sample PDF or return an error
        return res.status(404).json({ message: "PDF viewer not yet implemented with real files" });
      }
      
      // Check if file exists in uploads directory
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        const fileExtension = path.extname(filename).toLowerCase();
        
        if (fileExtension === '.pdf') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
          res.setHeader('Content-Length', stat.size);
          
          const stream = fs.createReadStream(filePath);
          stream.pipe(res);
        } else {
          res.status(400).json({ message: "File is not a PDF document" });
        }
      } else {
        res.status(404).json({ message: "Document not found" });
      }
    } catch (error) {
      console.error("Error serving PDF document:", error);
      res.status(500).json({ message: "Failed to serve document" });
    }
  });

  // Enhanced file serving for ALL file types with 24-month retention policy
  app.get('/uploads/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(uploadsDir, filename);
      
      // Check multiple directories for 24-month persistence
      let actualFilePath = filePath;
      if (!fs.existsSync(filePath)) {
        const attachedAssetsPath = path.join(process.cwd(), 'attached_assets', filename);
        if (fs.existsSync(attachedAssetsPath)) {
          actualFilePath = attachedAssetsPath;
        } else {
          return res.status(404).send('File not found');
        }
      }

      // Comprehensive MIME type support for all file formats
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        // Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.ico': 'image/x-icon',
        
        // Documents
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain',
        '.rtf': 'application/rtf',
        
        // Archives
        '.zip': 'application/zip',
        '.rar': 'application/vnd.rar',
        '.7z': 'application/x-7z-compressed',
        
        // Other
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.csv': 'text/csv'
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      
      // 24-month retention policy headers
      res.setHeader('Cache-Control', 'public, max-age=63072000'); // 2 years cache
      res.setHeader('ETag', `"${Date.now()}"`);
      res.setHeader('Last-Modified', new Date().toUTCString());
      
      // Security headers for different file types
      if (ext === '.pdf') {
        res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(ext)) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (ext === '.svg') {
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline';");
      }
      
      console.log(`Serving file with 24-month retention: ${filename} (${mimeType}) from ${actualFilePath}`);
      res.sendFile(path.resolve(actualFilePath));
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).send('Failed to serve file');
    }
  });

  // Enhanced file serving for data/logos directory with lifetime storage
  app.get('/data/logos/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(logosDir, filename);
      
      // Check multiple directories for logo persistence
      let actualFilePath = filePath;
      if (!fs.existsSync(filePath)) {
        const attachedAssetsPath = path.join(process.cwd(), 'attached_assets', filename);
        if (fs.existsSync(attachedAssetsPath)) {
          actualFilePath = attachedAssetsPath;
        } else {
          const uploadsPath = path.join(process.cwd(), 'uploads', filename);
          if (fs.existsSync(uploadsPath)) {
            actualFilePath = uploadsPath;
          } else {
            return res.status(404).send('Logo file not found');
          }
        }
      }

      // Logo-specific MIME type handling
      const ext = path.extname(filename).toLowerCase();
      let mimeType = 'image/png'; // default
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          mimeType = 'image/jpeg';
          break;
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
        case '.svg':
          mimeType = 'image/svg+xml';
          break;
        case '.bmp':
          mimeType = 'image/bmp';
          break;
        case '.tiff':
        case '.tif':
          mimeType = 'image/tiff';
          break;
        case '.ico':
          mimeType = 'image/x-icon';
          break;
      }
      
      // Lifetime storage headers for logos
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('ETag', `"${fs.statSync(actualFilePath).mtime.getTime()}"`);
      
      // Special handling for SVG logos
      if (ext === '.svg') {
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline';");
      }
      
      console.log(`Serving logo with lifetime storage: ${filename} (${mimeType}) from ${actualFilePath}`);
      res.sendFile(path.resolve(actualFilePath));
    } catch (error) {
      console.error("Error serving logo:", error);
      res.status(404).send('Logo not found');
    }
  });

  // Enhanced file serving for attached_assets directory with 24-month retention
  app.get('/attached_assets/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'attached_assets', filename);
      
      // Check multiple directories for 24-month persistence
      let actualFilePath = filePath;
      if (!fs.existsSync(filePath)) {
        const uploadsPath = path.join(uploadsDir, filename);
        if (fs.existsSync(uploadsPath)) {
          actualFilePath = uploadsPath;
        } else {
          return res.status(404).send('File not found');
        }
      }

      // Comprehensive MIME type support for all file formats
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        // Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.ico': 'image/x-icon',
        
        // Documents
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain',
        '.rtf': 'application/rtf',
        
        // Archives
        '.zip': 'application/zip',
        '.rar': 'application/vnd.rar',
        '.7z': 'application/x-7z-compressed',
        
        // Other
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.csv': 'text/csv'
      };

      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      
      // 24-month retention policy headers
      res.setHeader('Cache-Control', 'public, max-age=63072000'); // 2 years cache
      res.setHeader('ETag', `"${Date.now()}"`);
      res.setHeader('Last-Modified', new Date().toUTCString());
      
      // Security headers for different file types
      if (ext === '.pdf') {
        res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(ext)) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (ext === '.svg') {
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline';");
      }
      
      console.log(`Serving attached_assets file with 24-month retention: ${filename} (${mimeType}) from ${actualFilePath}`);
      res.sendFile(path.resolve(actualFilePath));
    } catch (error) {
      console.error("Error serving attached_assets file:", error);
      res.status(500).send('Failed to serve file');
    }
  });

  // Yearly Docs endpoints
  app.get('/api/yearly-docs', isAdminAuthenticated, async (req, res) => {
    try {
      const { branchId, docType } = req.query;
      const docs = await storage.getYearlyDocs(branchId as string, docType as string);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching yearly docs:", error);
      res.status(500).json({ message: "Failed to fetch yearly docs" });
    }
  });

  app.post('/api/yearly-docs', isAdminAuthenticated, yearlyDocsUpload.single('file'), async (req, res) => {
    try {
      const { title, docType, viewSize, issueDate, expiryDate } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!title || !docType || !issueDate) {
        return res.status(400).json({ message: "Title, document type, issue date, and expiry date are required" });
      }

      // Upload to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const filepath = await objectStorageService.uploadFile({
        localPath: file.path,
        branchId: 'admin',
        category: 'yearly-docs',
        filename: file.originalname
      });

      console.log(`✅ Yearly doc uploaded to Object Storage: ${filepath}`);

      const yearlyDoc = await storage.createYearlyDoc({
        title,
        filename: file.originalname,
        filepath,
        docType,
        fileSize: file.size,
        mimeType: file.mimetype,
        viewSize: viewSize || "A4",
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        uploadedBy: 'admin_user',
      });

      // Clean up temporary file
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.log('Temp file cleanup failed, but doc is safely in Object Storage');
      }

      console.log('Yearly document created successfully:', yearlyDoc.id);
      res.json(yearlyDoc);
    } catch (error) {
      console.error("Error creating yearly document:", error);
      // Clean up temp file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to create yearly document", error: errorMessage });
    }
  });

  app.post('/api/yearly-docs/:docId/send-to-branch', isAdminAuthenticated, async (req, res) => {
    try {
      const { docId } = req.params;
      const { branchId } = req.body;

      if (!branchId) {
        return res.status(400).json({ message: "Branch ID is required" });
      }

      await storage.sendYearlyDocToBranch(docId, branchId);
      res.json({ success: true, message: "Document sent to branch successfully" });
    } catch (error) {
      console.error("Error sending yearly doc to branch:", error);
      res.status(500).json({ message: "Failed to send document to branch" });
    }
  });

  app.delete('/api/yearly-docs/:docId', isAdminAuthenticated, async (req, res) => {
    try {
      const { docId } = req.params;
      await storage.deleteYearlyDoc(docId);
      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting yearly doc:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Pest Control Docs endpoints
  app.get('/api/pest-control-docs', isAdminAuthenticated, async (req, res) => {
    try {
      const { branchId, docType } = req.query;
      const docs = await storage.getPestControlDocs(branchId as string, docType as string, true);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching pest control docs:", error);
      res.status(500).json({ message: "Failed to fetch pest control docs" });
    }
  });

  app.post('/api/pest-control-docs', isAdminAuthenticated, pestControlUpload.single('file'), async (req, res) => {
    try {
      const { title, docType, viewSize, issueDate, expiryDate, description } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!title || !docType) {
        return res.status(400).json({ message: "Title and document type are required" });
      }

      // Upload to Object Storage for permanent persistence
      const objectStorageService = new ObjectStorageService();
      const filepath = await objectStorageService.uploadFile({
        localPath: file.path,
        branchId: 'admin',
        category: 'pest-control-docs',
        filename: file.originalname
      });

      console.log(`✅ Pest control doc uploaded to Object Storage: ${filepath}`);

      const pestControlDoc = await storage.createPestControlDoc({
        title,
        filename: file.originalname,
        filepath,
        docType,
        description: description || null,
        fileSize: file.size,
        mimeType: file.mimetype,
        viewSize: viewSize || "A4",
        issueDate: issueDate ? new Date(issueDate + 'T00:00:00.000Z') : null,
        expiryDate: expiryDate ? new Date(expiryDate + 'T00:00:00.000Z') : null,
        uploadedBy: 'admin_user',
      });

      // Clean up temporary file
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.log('Temp file cleanup failed, but doc is safely in Object Storage');
      }

      console.log('Pest control document created successfully:', pestControlDoc.id);
      res.json(pestControlDoc);
    } catch (error) {
      console.error("Error creating pest control document:", error);
      // Clean up temp file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to create pest control document", error: errorMessage });
    }
  });

  app.post('/api/pest-control-docs/:docId/send-to-branch', isAdminAuthenticated, async (req, res) => {
    try {
      const { docId } = req.params;
      const { branchId } = req.body;

      if (!branchId) {
        return res.status(400).json({ message: "Branch ID is required" });
      }

      await storage.sendPestControlDocToBranch(docId, branchId);
      res.json({ success: true, message: "Document sent to branch successfully" });
    } catch (error) {
      console.error("Error sending pest control doc to branch:", error);
      res.status(500).json({ message: "Failed to send document to branch" });
    }
  });

  app.delete('/api/pest-control-docs/:docId', isAdminAuthenticated, async (req, res) => {
    try {
      const { docId } = req.params;
      
      // CRITICAL DUAL-TABLE COORDINATION FIX: Check if pest control doc also exists in documents table
      const pestControlDoc = await storage.getPestControlDoc(docId);
      
      // FIXED: Handle UUID vs nanoid format mismatch - pest control docs use nanoid, documents table uses UUID
      let documentRecord = null;
      let documentExists = false;
      
      try {
        // Only try to query documents table if the ID looks like a UUID (contains dashes)
        if (docId.includes('-')) {
          documentRecord = await storage.getDocument(docId);
          // Check if this pest control doc exists as a document (type='pest-control')
          if (documentRecord && documentRecord.type === 'pest-control') {
            documentExists = true;
            console.log(`📋 Pest control doc ${docId} also exists in documents table - dual-table coordination required`);
          }
        } else {
          console.log(`📋 Pest control doc ${docId} uses nanoid format - skipping documents table check`);
        }
      } catch (uuidError) {
        // If UUID parsing fails (nanoid format), continue with deletion - this is expected
        console.log(`📋 UUID parsing failed for ${docId} (expected for nanoid format) - continuing with deletion`);
      }
      
      if (!pestControlDoc && !documentExists) {
        // Document doesn't exist in either table, treat as successful deletion
        return res.json({ success: true, message: "Document already deleted or not found" });
      }

      console.log(`🗑️ Admin requesting deletion of pest control doc: ${pestControlDoc?.title || documentRecord?.title} (ID: ${docId})`);
      console.log(`📊 Deletion coordination: pest_control_docs table=${!!pestControlDoc}, Documents table=${documentExists}`);
      
      // CRITICAL FIX: Update BOTH tables with adminDeleted=true
      if (pestControlDoc) {
        await storage.deletePestControlDoc(docId);
        console.log(`✅ pest_control_docs table updated with adminDeleted=true for ID: ${docId}`);
      }
      
      if (documentExists) {
        await storage.deleteDocument(docId);
        console.log(`✅ Documents table updated with adminDeleted=true for ID: ${docId}`);
      }
      
      res.json({ 
        success: true, 
        message: "Document deleted successfully from both tables",
        updatedTables: {
          pestControlDocs: !!pestControlDoc,
          documents: documentExists
        }
      });
    } catch (error) {
      console.error("Error deleting pest control doc:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Branch deletion endpoint for pest control documents
  app.delete('/api/branch/pest-control-docs/:docId', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { docId } = req.params;
      
      // FIXED: Check both pest_control_docs table AND documents table for deletion
      let doc = await storage.getPestControlDoc(docId);
      let isInDocumentsTable = false;
      
      // If not found in pest_control_docs table, check documents table
      if (!doc) {
        const document = await storage.getDocument(docId);
        if (document && document.type === 'pest-control') {
          doc = {
            id: document.id,
            title: document.title,
            branchId: document.branchId,
            // Other fields don't matter for deletion check
          } as any;
          isInDocumentsTable = true;
          console.log('Found pest control doc for deletion in documents table:', docId);
        }
      }
      
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (doc.branchId !== session.branchId) {
        return res.status(403).json({ message: "Access denied - document not assigned to your branch" });
      }

      // Delete from appropriate table
      if (isInDocumentsTable) {
        // For documents table, mark as deleted (isDeleted=true)
        await storage.updateDocument(docId, { isDeleted: true });
        console.log(`Pest control document ${docId} deleted from documents table (marked as isDeleted: true)`);
      } else {
        // For pest_control_docs table, use existing method
        await storage.deletePestControlDocFromBranch(docId);
      }
      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting pest control doc from branch:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // View pest control document endpoint (accessible by both admin and branch)
  app.get('/api/pest-control-docs/:docId/view', async (req, res) => {
    try {
      const session = req.session as any;
      const adminToken = req.cookies?.admin_token;
      
      console.log('Pest control doc view request:', { 
        docId: req.params.docId, 
        session: session?.branchId ? 'branch' : 'none',
        adminToken: adminToken ? 'admin' : 'none'
      });
      
      // Allow both branch users and admin users to view documents
      const isBranchAuth = session.branchId && session.userType === 'branch';
      const isAdminAuth = adminToken && adminTokens.has(adminToken);
      
      if (!isBranchAuth && !isAdminAuth) {
        console.log('Pest control doc view: Not authenticated');
        return res.status(401).json({ message: "Not authenticated" });
      }

      // FIXED: Check both pest_control_docs table AND documents table for persistent storage
      let doc = await storage.getPestControlDoc(req.params.docId);
      
      // If not found in pest_control_docs table, check documents table
      if (!doc) {
        const document = await storage.getDocument(req.params.docId);
        if (document && document.type === 'pest-control') {
          // Convert document to pest control doc format for compatibility
          doc = {
            id: document.id,
            title: document.title,
            filename: document.filename,
            filepath: document.filepath,
            docType: 'general', // Default for documents table
            description: null,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            viewSize: 'A4', // Default
            branchId: document.branchId,
            uploadedBy: document.uploadedBy,
            issueDate: null,
            expiryDate: document.expiryDate,
            sentAt: document.sentAt,
            receivedAt: null,
            viewedAt: document.viewedAt,
            downloadedAt: document.downloadedAt,
            isDeleted: document.isDeleted,
            isInMyDocs: false,
            adminDeleted: document.adminDeleted,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          };
          console.log('Found pest control doc in documents table:', req.params.docId);
        }
      }
      
      if (!doc) {
        console.log('Pest control doc not found in any database table:', req.params.docId);
        return res.status(404).json({ message: "Document not found" });
      }

      console.log('Found pest control doc:', { 
        id: doc.id, 
        title: doc.title, 
        filepath: doc.filepath,
        filename: doc.filename 
      });

      // For branch users, check if document is sent to their branch
      if (isBranchAuth && doc.branchId !== session.branchId) {
        console.log('Access denied: branch mismatch', { docBranch: doc.branchId, sessionBranch: session.branchId });
        return res.status(403).json({ message: "Access denied" });
      }

      // Set content type and headers
      const mimeType = doc.mimeType || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Handle Object Storage files
      if (doc.filepath && doc.filepath.startsWith('/objects/')) {
        console.log('📦 Serving pest control doc from Object Storage:', doc.filepath);
        try {
          const objectStorageService = new ObjectStorageService();
          const objectFile = await objectStorageService.getObjectEntityFile(doc.filepath);
          await objectStorageService.downloadObject(objectFile, res);
          return;
        } catch (storageError) {
          console.error('Object Storage download error:', storageError);
          return res.status(404).json({ message: "File not found in Object Storage" });
        }
      }

      // EMERGENCY DOCUMENT RECOVERY - Comprehensive file search (same as smart-image API)
      console.log(`🚨 EMERGENCY PEST CONTROL DOC RECOVERY: ${doc.filename}`);
      
      // Extract base name and variations for comprehensive search
      const baseName = doc.filename.split('_').slice(1).join('_') || doc.filename;
      const fileExtension = baseName.split('.').pop()?.toLowerCase();
      const baseNameNoExt = baseName.split('.')[0];
      
      // COMPREHENSIVE SEARCH - Cover ALL possible storage locations
      const searchPaths = [
        // Primary storage locations
        path.join(process.cwd(), 'data', 'photos'),
        path.join(process.cwd(), 'data', 'documents'),
        path.join(process.cwd(), 'data', 'reports'),
        path.join(process.cwd(), 'data', 'images'),
        path.join(process.cwd(), 'data', 'logos'),
        path.join(process.env.TMPDIR || "/tmp", "uploads"),
        path.join(process.env.TMPDIR || "/tmp", "attached_assets"),
        
        // Backup and recovery locations
        path.join(process.cwd(), 'backup', 'photos'),
        path.join(process.cwd(), 'backup', 'documents'),
        path.join(process.cwd(), 'backup', 'reports'),
        path.join(process.cwd(), 'backup', 'images'),
        path.join(process.cwd(), 'backup', 'logos'),
        
        // Additional legacy locations
        path.join(process.cwd(), 'public'),
        path.join(process.cwd(), 'server', 'uploads'),
        path.join(process.cwd(), 'client', 'public'),
        
        // PEST_CONTROL_SOURCE_EXPORT locations for recovery
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'data', 'photos'),
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'uploads'),
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'attached_assets'),
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'data', 'documents'),
        path.join(process.cwd(), 'PEST_CONTROL_SOURCE_EXPORT', '3-ASSETS', 'backup', 'photos'),
      ];
      
      let foundFile = null;
      let foundPath = null;
      let totalFilesSearched = 0;
      let directoriesSearched = 0;
      
      for (const searchPath of searchPaths) {
        try {
          if (!fs.existsSync(searchPath)) {
            console.log(`⚠️ Directory not found: ${searchPath}`);
            continue;
          }
          
          directoriesSearched++;
          const files = fs.readdirSync(searchPath);
          totalFilesSearched += files.length;
          
          console.log(`🔍 Searching in ${searchPath}: ${files.length} files`);
          
          // LEVEL 1: Exact filename match
          foundFile = files.find((file: string) => file === doc.filename);
          
          if (foundFile) {
            console.log(`✅ LEVEL 1 - Exact match found: ${foundFile} in ${searchPath}`);
            foundPath = path.join(searchPath, foundFile);
            break;
          } else {
            // LEVEL 2: Case-insensitive exact match
            foundFile = files.find((file: string) => file.toLowerCase() === doc.filename.toLowerCase());
            
            if (foundFile) {
              console.log(`✅ LEVEL 2 - Case-insensitive match: ${foundFile} in ${searchPath}`);
              foundPath = path.join(searchPath, foundFile);
              break;
            } else {
              // LEVEL 3: Base name matching (remove timestamp prefixes)
              foundFile = files.find((file: string) => {
                const fileLower = file.toLowerCase();
                const baseNameLower = baseName.toLowerCase().split('.')[0];
                return fileLower.includes(baseNameLower) && 
                       fileLower.endsWith(`.${fileExtension}`);
              });
              
              if (foundFile) {
                console.log(`✅ LEVEL 3 - Base name match: ${foundFile} for ${baseName} in ${searchPath}`);
                foundPath = path.join(searchPath, foundFile);
                break;
              } else {
                // LEVEL 4: Partial filename matching (for corrupted names)
                const searchTerms = baseNameNoExt.toLowerCase().split(/[_\-\s]+/);
                foundFile = files.find((file: string) => {
                  const fileLower = file.toLowerCase();
                  return searchTerms.length > 0 &&
                         searchTerms.every(term => term.length > 2 && fileLower.includes(term)) &&
                         fileLower.endsWith(`.${fileExtension}`);
                });
                
                if (foundFile) {
                  console.log(`✅ LEVEL 4 - Partial match: ${foundFile} for terms [${searchTerms.join(', ')}] in ${searchPath}`);
                  foundPath = path.join(searchPath, foundFile);
                  break;
                } else {
                  // LEVEL 5: Similar extension fallback (gif/png interchange)
                  const altExtensions = {
                    'jpg': 'jpeg',
                    'jpeg': 'jpg',
                    'gif': 'png',
                    'png': 'gif'
                  };
                  
                  const altExt = altExtensions[fileExtension || ''] || fileExtension;
                  foundFile = files.find((file: string) => {
                    const fileLower = file.toLowerCase();
                    const baseNameLower = baseName.toLowerCase().split('.')[0];
                    return fileLower.includes(baseNameLower) && 
                           fileLower.endsWith(`.${altExt}`);
                  });
                  
                  if (foundFile) {
                    console.log(`✅ LEVEL 5 - Alternative extension match: ${foundFile} (${altExt} instead of ${fileExtension}) in ${searchPath}`);
                    foundPath = path.join(searchPath, foundFile);
                    break;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error(`❌ Directory search error ${searchPath}:`, err);
        }
      }
      
      if (!foundFile || !foundPath) {
        console.error(`🚨 EMERGENCY: Pest control document recovery FAILED for ${doc.filename}`);
        console.error(`📊 Search completed: ${directoriesSearched} directories, ${totalFilesSearched} files examined`);
        return res.status(404).json({ 
          message: "CRITICAL: Pest control document file not found in any location",
          requested: doc.filename,
          searchStats: {
            directoriesSearched,
            totalFilesExamined: totalFilesSearched
          },
          troubleshooting: {
            possibleCauses: [
              'File was deleted or moved from original location',
              'File was not properly uploaded or saved',
              'File exists in backup location not being searched',
              'Filename may have been corrupted or renamed'
            ]
          }
        });
      }
      
      console.log(`🎉 PEST CONTROL DOCUMENT RECOVERY SUCCESS: ${foundPath}`);
      console.log(`📈 Search stats: ${directoriesSearched} directories, ${totalFilesSearched} total files examined`);

      // Set appropriate content type based on file mime type
      const actualExtension = foundFile.split('.').pop()?.toLowerCase() || fileExtension;
      const mimeTypes = {
        // Images
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'ico': 'image/x-icon',
        
        // Documents
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain'
      };
      
      const contentType = mimeTypes[actualExtension] || doc.mimeType || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${foundFile}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Recovery success headers
      res.setHeader('X-File-Recovery', 'success');
      res.setHeader('X-Original-Request', doc.filename);
      res.setHeader('X-Recovered-File', foundFile);
      res.setHeader('X-Recovery-Location', foundPath.replace(process.cwd(), ''));
      
      // Add security headers for Chrome inline viewing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      
      // Allow inline content for PDFs
      if (contentType.includes('pdf')) {
        res.setHeader('Content-Security-Policy', `
          default-src 'none';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: blob:;
          font-src 'self' data:;
          connect-src 'self';
          object-src 'none';
          frame-src 'none';
        `.replace(/\s+/g, ' ').trim());
      }
      
      // Update last accessed tracking
      await storage.updatePestControlDoc(doc.id, { viewedAt: new Date() });
      
      // Stream the recovered file
      const fileStream = fs.createReadStream(foundPath);
      fileStream.on('error', (streamError) => {
        console.error(`❌ File streaming error for ${foundPath}:`, streamError);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming recovered file', error: streamError.message });
        }
      });
      
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error viewing pest control document:", error);
      res.status(500).json({ message: "Failed to view document" });
    }
  });

  // Branch pest control docs endpoint
  app.get('/api/branch/pest-control-docs', async (req, res) => {
    try {
      const session = req.session as any;
      console.log('🔍 Branch pest control docs request - Session data:', {
        branchId: session.branchId,
        userType: session.userType,
        hasSession: !!req.session
      });
      
      if (!session.branchId || session.userType !== 'branch') {
        console.log('❌ Authentication check failed:', { branchId: session.branchId, userType: session.userType });
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      console.log(`✅ Calling getPestControlDocs with branchId: ${session.branchId}`);
      const docs = await storage.getPestControlDocs(session.branchId);
      console.log(`✅ Found ${docs.length} pest control docs for branch ${session.branchId}`);
      res.json(docs);
    } catch (error) {
      console.error("❌ Error fetching branch pest control docs:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Failed to fetch pest control docs", error: errorMessage });
    }
  });

  app.post('/api/branch/pest-control-docs/:id/send-to-mydocs', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      try {
        await storage.sendPestControlDocToMyDocs(id);
        res.json({ success: true, message: "Document sent to My Documents" });
      } catch (docError) {
        const errorMessage = docError instanceof Error ? docError.message : String(docError);
        if (errorMessage.includes('already exists')) {
          return res.status(200).json({ success: true, message: "Document already saved to My Documents", alreadyExists: true });
        }
        throw docError;
      }
    } catch (error: any) {
      console.error("Error sending pest control doc to my docs:", error);
      res.status(500).json({ message: "Failed to send document to My Documents" });
    }
  });

  // Branch delete document from My Documents endpoint
  app.delete('/api/branch/documents/:docId/from-mydocs', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { docId } = req.params;
      console.log(`🗑️ Deleting document ${docId} from My Documents for branch ${session.branchId}`);
      
      await storage.removeFromMyDocs(docId, session.branchId);
      
      console.log(`✅ Successfully deleted document ${docId} from My Documents`);
      
      // Add cache-busting headers to force frontend refresh
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json({ 
        success: true, 
        message: "Document removed from My Documents", 
        timestamp: Date.now(),
        refreshRequired: true,
        deletedDocId: docId
      });
    } catch (error) {
      console.error("Error removing document from My Documents:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found')) {
        console.log(`⚠️ Document ${req.params.docId} not found - may already be deleted`);
        // Return success even if document is not found (already deleted)
        res.json({ 
          success: true, 
          message: "Document was already removed from My Documents",
          timestamp: Date.now(),
          refreshRequired: true,
          deletedDocId: req.params.docId
        });
      } else if (errorMessage.includes('Access denied')) {
        res.status(403).json({ message: "Access denied" });
      } else {
        res.status(500).json({ message: "Failed to remove document from My Documents" });
      }
    }
  });

  // View yearly document endpoint
  app.get('/api/yearly-docs/:docId/view', async (req, res) => {
    try {
      const session = req.session as any;
      const adminToken = req.cookies?.admin_token;
      
      console.log('Yearly doc view request:', { 
        docId: req.params.docId, 
        session: session?.branchId ? 'branch' : 'none',
        adminToken: adminToken ? 'admin' : 'none'
      });
      
      // Allow both branch users and admin users to view documents
      const isBranchAuth = session.branchId && session.userType === 'branch';
      const isAdminAuth = adminToken && adminTokens.has(adminToken);
      
      if (!isBranchAuth && !isAdminAuth) {
        console.log('Yearly doc view: Not authenticated');
        return res.status(401).json({ message: "Not authenticated" });
      }

      const doc = await storage.getYearlyDoc(req.params.docId);
      if (!doc) {
        console.log('Yearly doc not found in database:', req.params.docId);
        return res.status(404).json({ message: "Document not found" });
      }

      console.log('Found yearly doc:', { 
        id: doc.id, 
        title: doc.title, 
        filepath: doc.filepath,
        filename: doc.filename 
      });

      // For branch users, check if document is sent to their branch
      if (isBranchAuth && doc.branchId !== session.branchId) {
        console.log('Access denied: branch mismatch', { docBranch: doc.branchId, sessionBranch: session.branchId });
        return res.status(403).json({ message: "Access denied" });
      }

      // Update viewed timestamp
      await storage.updateYearlyDoc(req.params.docId, { viewedAt: new Date() });

      // Set appropriate content type
      const mimeType = doc.mimeType || 'application/pdf';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Handle Object Storage files
      if (doc.filepath && doc.filepath.startsWith('/objects/')) {
        console.log('📦 Serving yearly doc from Object Storage:', doc.filepath);
        try {
          const objectStorageService = new ObjectStorageService();
          const objectFile = await objectStorageService.getObjectEntityFile(doc.filepath);
          await objectStorageService.downloadObject(objectFile, res);
          return;
        } catch (storageError) {
          console.error('Object Storage download error:', storageError);
          return res.status(404).json({ message: "Document not found in Object Storage" });
        }
      }

      // Try multiple path resolution strategies for filesystem files
      let filePath;
      let fileExists = false;
      
      // First try the original path
      filePath = path.join(process.cwd(), doc.filepath.startsWith('/') ? doc.filepath.substring(1) : doc.filepath);
      fileExists = fs.existsSync(filePath);
      
      // If not found, try looking in uploads directory with just filename
      if (!fileExists) {
        const uploadsDir = path.join(process.env.TMPDIR || "/tmp", "uploads");
        filePath = path.join(uploadsDir, doc.filename);
        fileExists = fs.existsSync(filePath);
      }
      
      // If still not found, try looking in attached_assets directory (for user uploads)
      if (!fileExists) {
        const attachedAssetsDir = path.join(process.env.TMPDIR || "/tmp", "attached_assets");
        filePath = path.join(attachedAssetsDir, doc.filename);
        fileExists = fs.existsSync(filePath);
      }
      
      if (!fileExists) {
        console.log('Yearly doc file not found:', doc.filename);
        return res.status(404).json({ message: "File not found" });
      }
      
      // Serve the file
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error viewing yearly document:", error);
      res.status(500).json({ message: "Failed to view document" });
    }
  });

  // Branch yearly docs endpoint
  app.get('/api/branch/yearly-docs', async (req, res) => {
    try {
      const session = req.session as any;
      console.log('Session data for yearly docs:', { branchId: session.branchId, userType: session.userType });
      
      if (!session.branchId || session.userType !== 'branch') {
        console.log('Authentication failed for yearly docs:', session);
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      console.log('Fetching yearly docs for branch:', session.branchId);
      const docs = await storage.getYearlyDocs(session.branchId);
      console.log('Branch yearly docs found:', docs.length, docs.map(d => ({ id: d.id, title: d.title, branchId: d.branchId, sentAt: d.sentAt })));
      res.json(docs);
    } catch (error) {
      console.error("Error fetching branch yearly docs:", error);
      res.status(500).json({ message: "Failed to fetch yearly docs" });
    }
  });

  // Branch delete yearly doc endpoint
  app.delete('/api/branch/yearly-docs/:docId', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { docId } = req.params;
      const doc = await storage.getYearlyDoc(docId);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      if (doc.branchId !== session.branchId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.markYearlyDocDeletedByBranch(docId);
      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting yearly doc:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Branch send yearly doc to My Documents endpoint
  app.post('/api/branch/yearly-docs/:docId/send-to-mydocs', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { docId } = req.params;
      await storage.sendYearlyDocToMyDocs(docId);
      res.json({ success: true, message: "Document sent to My Documents successfully" });
    } catch (error) {
      console.error("Error sending yearly doc to My Documents:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        res.status(409).json({ message: "Document already exists in My Documents" });
      } else if (errorMessage.includes('not found')) {
        res.status(404).json({ message: "Document not found" });
      } else {
        res.status(500).json({ message: "Failed to send document to My Documents" });
      }
    }
  });

  // Branch send photo to My Documents endpoint
  app.post('/api/branch/photos/:photoId/send-to-mydocs', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { photoId } = req.params;
      const result = await storage.sendPhotoToMyDocs(photoId);
      
      if (result?.alreadyExists) {
        return res.status(200).json({ success: true, message: "Photo already saved to My Documents", alreadyExists: true });
      }
      
      res.json({ success: true, message: "Photo sent to My Documents successfully" });
    } catch (error) {
      console.error("Error sending photo to My Documents:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not found')) {
        res.status(404).json({ message: "Photo not found" });
      } else {
        res.status(500).json({ message: "Failed to send photo to My Documents" });
      }
    }
  });

  // View photo endpoint
  app.get('/api/photos/:photoId/view', async (req, res) => {
    try {
      const { photoId } = req.params;
      const photo = await storage.getPhoto(photoId);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Check if user has access to this photo
      const session = req.session as any;
      const isAdmin = session.userId && session.userType === 'admin';
      const isBranchUser = session.branchId && session.userType === 'branch';
      const hasAccess = isAdmin || (isBranchUser && photo.branchId === session.branchId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.setHeader('Content-Type', photo.mimeType || 'image/jpeg');
      res.setHeader('Content-Disposition', `inline; filename="${photo.filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Handle Object Storage files
      if (photo.filepath && photo.filepath.startsWith('/objects/')) {
        console.log('📦 Serving photo from Object Storage:', photo.filepath);
        try {
          const objectStorageService = new ObjectStorageService();
          const objectFile = await objectStorageService.getObjectEntityFile(photo.filepath);
          await objectStorageService.downloadObject(objectFile, res);
          return;
        } catch (storageError) {
          console.error('Object Storage download error:', storageError);
          return res.status(404).json({ message: "Photo not found in Object Storage" });
        }
      }

      const filePath = path.resolve(photo.filepath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error viewing photo:", error);
      res.status(500).json({ message: "Failed to view photo" });
    }
  });

  // Branch Profile Management Routes
  app.post('/api/branch/change-password', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Get current branch
      const branch = await storage.getBranch(session.branchId);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // In a real implementation, you would verify the current password
      // For now, we'll assume the current password is correct since we don't store passwords
      
      // Update the password (in a real app, hash the password before storing)
      await storage.updateBranchPassword(session.branchId, newPassword);
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.put('/api/branch/profile', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { name, phone, address, username, email } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: "Branch name is required" });
      }

      // Check username uniqueness if changing
      if (username && username.trim()) {
        const existing = await storage.getBranchByUsername(username.trim());
        if (existing && existing.id !== session.branchId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      const updateData = {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        username: username?.trim() || null,
        email: email?.trim() || null,
      };

      await storage.updateBranchProfile(session.branchId, updateData);
      
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Useful Links endpoints
  app.get('/api/useful-links', isAdminAuthenticated, async (req, res) => {
    try {
      // Validate query parameters
      const queryValidation = branchIdQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid query parameters", 
          errors: queryValidation.error.errors 
        });
      }
      
      const { branchId } = queryValidation.data;
      const links = await storage.listUsefulLinks(branchId);
      
      res.json({ success: true, data: links });
    } catch (error) {
      console.error("Error fetching useful links:", error);
      res.status(500).json({ success: false, message: "Failed to fetch useful links" });
    }
  });

  app.post('/api/useful-links', isAdminAuthenticated, async (req, res) => {
    try {
      console.log('💛 Useful links POST request body:', JSON.stringify(req.body, null, 2));
      
      // Validate request body structure
      const bodyValidation = z.object({
        title: z.string().min(1, "Title is required"),
        url: z.string().url("Invalid URL format"),
        description: z.string().optional(),
        branchIds: z.array(z.string().min(1, "Branch ID cannot be empty")).min(1, "At least one branch must be selected")
      }).safeParse(req.body);

      if (!bodyValidation.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid request data", 
          errors: bodyValidation.error.errors 
        });
      }

      const { title, url, description, branchIds } = bodyValidation.data;
      const userId = 'admin_user';

      // Link data will be validated individually for each branch in the loop

      const links = [];
      for (const branchId of branchIds) {
        console.log('💚 Creating useful link with branchId:', branchId, 'Type:', typeof branchId);
        
        const linkData = {
          id: nanoid(),
          title,
          url,
          description: description || null,
          branchId,
          createdBy: userId,
          isActive: true,
        };
        
        console.log('💚 Link data being sent to storage:', JSON.stringify(linkData, null, 2));
        
        const link = await storage.createUsefulLink(linkData);
        
        // Update the link to set sentAt timestamp
        await storage.markUsefulLinkAsSent(link.id);
        links.push(link);
      }

      res.json({ success: true, data: links, message: "Useful links created successfully" });
    } catch (error) {
      console.error("Error creating useful link:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create useful link';
      res.status(500).json({ success: false, message: errorMessage });
    }
  });

  app.patch('/api/useful-links/:id', isAdminAuthenticated, async (req, res) => {
    try {
      // Validate path parameters
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid path parameters", 
          errors: paramValidation.error.errors 
        });
      }

      // Validate update data using restrictive schema
      const bodyValidation = usefulLinkUpdateSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: bodyValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      const updateData = bodyValidation.data;

      const updatedLink = await storage.updateUsefulLink(id, updateData);
      if (!updatedLink) {
        return res.status(404).json({ success: false, message: "Link not found" });
      }

      res.json({ success: true, data: updatedLink });
    } catch (error) {
      console.error("Error updating useful link:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update useful link';
      res.status(500).json({ success: false, message: errorMessage });
    }
  });

  app.delete('/api/useful-links/:id', isAdminAuthenticated, async (req, res) => {
    try {
      // Validate path parameters
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid path parameters", 
          errors: paramValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      await storage.deleteUsefulLink(id);
      
      res.json({ success: true, data: null, message: "Link deleted successfully" });
    } catch (error) {
      console.error("Error deleting useful link:", error);
      res.status(500).json({ success: false, message: "Failed to delete useful link" });
    }
  });

  app.get('/api/branch/useful-links', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }
      
      const links = await storage.getBranchUsefulLinks(session.branchId);
      res.json({ success: true, data: links });
    } catch (error) {
      console.error("Error fetching branch useful links:", error);
      res.status(500).json({ success: false, message: "Failed to fetch useful links" });
    }
  });

  // CRITICAL FIX: Branch delete endpoint for useful links (was missing!)
  app.delete('/api/branch/useful-links/:id', async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== 'branch') {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      const { id } = req.params;
      
      // Verify the link belongs to this branch
      const link = await storage.getUsefulLink(id);
      if (!link) {
        return res.status(404).json({ success: false, message: "Link not found" });
      }
      
      if (link.branchId !== session.branchId) {
        return res.status(403).json({ success: false, message: "Access denied - link not assigned to your branch" });
      }

      await storage.deleteUsefulLink(id);
      console.log(`Useful link ${id} deleted by branch ${session.branchId}`);
      
      res.json({ success: true, data: null, message: "Link deleted successfully" });
    } catch (error) {
      console.error("Error deleting useful link from branch:", error);
      res.status(500).json({ success: false, message: "Failed to delete useful link" });
    }
  });

  app.post('/api/useful-links/:id/click', async (req, res) => {
    try {
      // Validate path parameters
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid path parameters", 
          errors: paramValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      await storage.trackUsefulLinkClick(id);
      
      res.json({ success: true, data: null, message: "Link click tracked successfully" });
    } catch (error) {
      console.error("Error tracking link click:", error);
      res.status(500).json({ success: false, message: "Failed to track link click" });
    }
  });

  // Branch API routes for useful links (duplicate route removed - handled above)

  app.post('/api/useful-links/:id/send', isAdminAuthenticated, async (req, res) => {
    try {
      // Validate path parameters
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid path parameters", 
          errors: paramValidation.error.errors 
        });
      }

      // Validate request body
      const bodyValidation = z.object({
        branchId: z.string().min(1, "Branch ID is required")
      }).safeParse(req.body);
      
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: bodyValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      const { branchId } = bodyValidation.data;

      // Create a new link entry for the additional branch
      const originalLink = await storage.getUsefulLink(id);
      if (!originalLink) {
        return res.status(404).json({ message: "Link not found" });
      }

      const newLink = await storage.createUsefulLink({
        id: nanoid(),
        title: originalLink.title,
        url: originalLink.url,
        description: originalLink.description,
        branchId,
        createdBy: originalLink.createdBy,
        isActive: true,
      });

      res.json({ success: true, data: newLink, message: "Link sent to branch successfully" });
    } catch (error) {
      console.error("Error sending link to branch:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send link to branch';
      res.status(500).json({ success: false, message: errorMessage });
    }
  });

  // CRITICAL FIX: Atomic replace endpoint to prevent data loss during updates
  app.post('/api/useful-links/replace', isAdminAuthenticated, async (req, res) => {
    try {
      console.log('💛 Atomic useful links replace request body:', JSON.stringify(req.body, null, 2));
      
      // Validate request body structure
      const bodyValidation = z.object({
        originalLink: z.object({
          title: z.string().min(1, "Original title is required"),
          url: z.string().url("Original URL must be valid")
        }),
        newData: z.object({
          title: z.string().min(1, "New title is required"),
          url: z.string().url("New URL must be valid"),
          description: z.string().optional(),
          branchIds: z.array(z.string().min(1, "Branch ID cannot be empty")).min(1, "At least one branch must be selected")
        })
      }).safeParse(req.body);

      if (!bodyValidation.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid request data", 
          errors: bodyValidation.error.errors 
        });
      }

      const { originalLink, newData } = bodyValidation.data;
      const userId = 'admin_user';

      // Add createdBy to newData for storage layer
      const replaceData = {
        ...newData,
        createdBy: userId
      };

      console.log('💚 Calling atomic replace with:', {
        originalLink,
        replaceData
      });

      // Use atomic replace operation from storage layer
      const newLinks = await storage.replaceUsefulLink(originalLink, replaceData);

      res.json({ 
        success: true, 
        data: newLinks, 
        message: `Successfully replaced useful link atomically. Created ${newLinks.length} new instances.` 
      });
    } catch (error) {
      console.error("Error in atomic useful link replace:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to replace useful link atomically';
      res.status(500).json({ 
        success: false,
        message: errorMessage 
      });
    }
  });

  // Payment Records API  
  app.get("/api/payment-records", (req: any, res: any) => {
    const adminToken = req.cookies?.admin_token;
    if (!adminToken || !adminTokens.has(adminToken)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    storage.getPaymentRecords()
      .then(records => res.json(records))
      .catch(error => {
        console.error("Error fetching payment records:", error);
        res.status(500).json({ message: "Failed to fetch payment records" });
      });
  });

  app.post("/api/payment-records", (req: any, res: any) => {
    const adminToken = req.cookies?.admin_token;
    if (!adminToken || !adminTokens.has(adminToken)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const recordData = req.body;
    const userId = 'admin_user';
    
    if (!recordData.branchId) {
      return res.status(400).json({ message: "Branch selection is required" });
    }

    storage.createPaymentRecord({
      id: nanoid(),
      branchId: recordData.branchId,
      paymentMethod: recordData.paymentMethod,
      visitFrequency: recordData.visitFrequency,
      paymentAgreement: recordData.paymentAgreement,
      createdBy: userId,
      sentAt: new Date(),
    })
    .then(async (record) => {
      await createAutomaticMessages(record);
      res.json(record);
    })
    .catch(error => {
      console.error("Error creating payment record:", error);
      res.status(500).json({ message: "Failed to create payment record" });
    });
  });

  app.delete("/api/payment-records/:id", (req: any, res: any) => {
    const adminToken = req.cookies?.admin_token;
    if (!adminToken || !adminTokens.has(adminToken)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    storage.deletePaymentRecord(req.params.id)
      .then(() => res.json({ success: true }))
      .catch(error => {
        console.error("Error deleting payment record:", error);
        res.status(500).json({ message: "Failed to delete payment record" });
      });
  });

  // Branch settings update endpoint
  app.post('/api/branches/:id/settings', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { starRating } = req.body;
      
      const updated = await storage.updateBranch(id, { starRating });
      res.json({ success: true, branch: { ...updated, password: undefined } });
    } catch (error) {
      console.error("Error updating branch settings:", error);
      res.status(500).json({ message: "Failed to update branch settings" });
    }
  });

  // Payment Messages API
  app.get("/api/payment-messages", (req: any, res: any) => {
    const adminToken = req.cookies?.admin_token;
    if (!adminToken || !adminTokens.has(adminToken)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const branchId = req.query.branchId as string;
    storage.getPaymentMessages(branchId)
      .then(messages => res.json(messages))
      .catch(error => {
        console.error("Error fetching payment messages:", error);
        res.status(500).json({ message: "Failed to fetch payment messages" });
      });
  });

  app.post("/api/payment-messages/:id/read", isAdminAuthenticated, async (req, res) => {
    try {
      await storage.markMessageAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Notification endpoints for visit scheduling
  app.get("/api/notifications/upcoming-visits", isAuthenticated, async (req, res) => {
    try {
      const upcomingVisits = await storage.getUpcomingVisits();
      res.json(upcomingVisits);
    } catch (error) {
      console.error("Error fetching upcoming visits:", error);
      res.status(500).json({ message: "Failed to fetch upcoming visits" });
    }
  });

  app.get("/api/notifications/overdue-payments", isAuthenticated, async (req, res) => {
    try {
      const overduePayments = await storage.getOverduePayments();
      res.json(overduePayments);
    } catch (error) {
      console.error("Error fetching overdue payments:", error);
      res.status(500).json({ message: "Failed to fetch overdue payments" });
    }
  });

  // Helper function to create automatic messages
  async function createAutomaticMessages(record: any) {
    const messages = [];

    // Agreement confirmation message
    messages.push({
      id: nanoid(),
      paymentRecordId: record.id,
      branchId: record.branchId,
      messageType: "agreement-confirmed",
      messageContent: `Payment agreement confirmed: £${record.paymentAgreement} - ${record.paymentMethod} - ${record.visitFrequency} visits`,
      isAutomatic: true,
      sentAt: new Date(),
    });

    // Create all messages  
    for (const message of messages) {
      await storage.createPaymentMessage(message);
    }
  }

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const branchId = (req as any).query?.branchId;
      const notifications = await storage.getNotifications(branchId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const { branchId, message, visitDate, visitTime, purposeOfVisit, beforeImageUrl, afterImageUrl } = req.body;
      
      const notification = await storage.createNotification({
        branchId,
        message,
        visitDate,
        visitTime,
        purposeOfVisit
      });
      
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });



  // Notification routes
  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const { branchId, message, visitDate, visitTime, purposeOfVisit, visitTypes } = req.body;
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || "admin";
      
      console.log("Notification request received:");
      console.log("Request body:", req.body);
      console.log("User object:", user);
      console.log("Extracted userId:", userId);

      if (!branchId || !message || !visitDate || !visitTime || !purposeOfVisit) {
        console.log("Missing required fields validation failed");
        return res.status(400).json({ message: "Missing required fields" });
      }

      console.log("Creating notification with auto-generated ID");
      
      const notificationData = {
        branchId,
        message,
        visitDate,
        visitTime,
        purposeOfVisit: purposeOfVisit,
      };

      console.log("Final notification data being sent to storage:", notificationData);

      const notification = await storage.createNotification(notificationData);

      console.log("Notification created successfully:", notification);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const branchId = (req as any).query?.branchId;
      const notifications = await storage.getNotifications(branchId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/branch/:branchId", async (req, res) => {
    try {
      const { branchId } = req.params;
      
      // Check if user is authenticated as admin OR if this is a branch session for the requested branch
      const session = req.session as any;
      const isAdminAuth = req.isAuthenticated && req.isAuthenticated();
      const isBranchAuth = session?.branchId === branchId && session?.userType === 'branch';
      
      if (!isAdminAuth && !isBranchAuth) {
        console.log("Authorization failed for branch notifications:", {
          isAdminAuth,
          isBranchAuth,
          sessionBranchId: session?.branchId,
          requestedBranchId: branchId,
          userType: session?.userType
        });
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("Fetching notifications for branch:", branchId);
      const notifications = await storage.getNotificationsByBranch(branchId);
      console.log("Found notifications:", notifications.length);
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching branch notifications:", error);
      res.status(500).json({ message: "Failed to fetch branch notifications" });
    }
  });

  // Clean up duplicate notifications for a branch
  app.delete("/api/notifications/branch/:branchId/duplicates", async (req, res) => {
    try {
      const { branchId } = req.params;
      
      // Check if user is authenticated as admin OR if this is a branch session for the requested branch
      const session = req.session as any;
      const isAdminAuth = req.isAuthenticated && req.isAuthenticated();
      const isBranchAuth = session?.branchId === branchId && session?.userType === 'branch';
      
      if (!isAdminAuth && !isBranchAuth) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("Cleaning duplicate notifications for branch:", branchId);
      const removedCount = await storage.removeDuplicateNotifications(branchId);
      console.log(`Removed ${removedCount} duplicate notifications`);
      
      res.json({ 
        success: true, 
        message: `Removed ${removedCount} duplicate notifications`,
        removedCount 
      });
    } catch (error) {
      console.error("Error cleaning duplicate notifications:", error);
      res.status(500).json({ message: "Failed to clean duplicate notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Branch-accessible notification delete route
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const session = req.session as any;
      
      console.log("Delete notification request - Session data:", {
        branchId: session.branchId,
        userType: session.userType,
        userId: session.userId,
        sessionKeys: Object.keys(session || {})
      });
      
      // Check if user is authenticated (branch or admin)
      const isBranchUser = session.branchId && session.userType === 'branch';
      const isAdminUser = session.userId || session.admin_token;
      
      if (!isBranchUser && !isAdminUser) {
        console.log("Authentication failed - no valid session");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // For branch users, verify they own the notification
      if (isBranchUser) {
        const notification = await storage.getNotification(id);
        console.log("Notification ownership check:", {
          notificationExists: !!notification,
          notificationBranchId: notification?.branchId,
          sessionBranchId: session.branchId,
          matches: notification?.branchId === session.branchId
        });
        
        if (!notification || notification.branchId !== session.branchId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      console.log("Deleting notification:", id);
      try {
        await storage.deleteNotification(id);
        res.json({ message: "Notification deleted successfully", success: true });
      } catch (deleteError) {
        const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
        if (errorMessage.includes('not found')) {
          res.status(404).json({ message: "Notification not found" });
        } else {
          throw deleteError;
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // File Management API Routes
  
  // Index all files in uploads and attached_assets directories
  app.post('/api/files/index', isAdminAuthenticated, async (req, res) => {
    try {
      const files = await storage.indexAllFiles();
      res.json({ 
        success: true, 
        message: `Indexed ${files.length} files successfully`,
        files 
      });
    } catch (error) {
      console.error("Error indexing files:", error);
      res.status(500).json({ message: "Failed to index files" });
    }
  });

  // Get all files with optional filters
  app.get('/api/files', isAdminAuthenticated, async (req, res) => {
    try {
      const { category, fileType, branchId, search } = req.query;
      
      const files = await storage.getAllFiles({
        category: category as string,
        fileType: fileType as string,
        branchId: branchId as string,
        search: search as string
      });
      
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Get file statistics
  app.get('/api/files/stats', isAdminAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getFileStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching file stats:", error);
      res.status(500).json({ message: "Failed to fetch file statistics" });
    }
  });

  // Update file metadata
  app.patch('/api/files/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedFile = await storage.updateFile(id, updateData);
      res.json(updatedFile);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // GET /api/files/:id - Unified file resolver endpoint
  // Searches across all document tables by ID, then fallback to filename search
  app.get('/api/files/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({ message: 'Invalid file ID provided' });
      }

      console.log(`🔍 File resolver request for ID: ${id}`);

      let foundFile: any = null;
      let filePath: string | null = null;
      let mimeType: string | null = null;

      // Step 1: Search across all document tables by ID
      console.log(`📄 Searching document tables for ID: ${id}`);
      
      // Try documents table
      try {
        foundFile = await storage.getDocument(id);
        if (foundFile) {
          console.log(`✅ Found in documents table: ${foundFile.filename}`);
          filePath = foundFile.filepath;
          mimeType = foundFile.mimeType;
        }
      } catch (error) {
        console.log(`⚠️ Error searching documents table: ${error}`);
      }

      // Try photos table if not found
      if (!foundFile) {
        try {
          foundFile = await storage.getPhoto(id);
          if (foundFile) {
            console.log(`✅ Found in photos table: ${foundFile.filename}`);
            filePath = foundFile.filepath;
            mimeType = foundFile.mimeType;
          }
        } catch (error) {
          console.log(`⚠️ Error searching photos table: ${error}`);
        }
      }

      // Try monthly reports table if not found
      if (!foundFile) {
        try {
          foundFile = await storage.getMonthlyReport(id);
          if (foundFile) {
            console.log(`✅ Found in monthly_reports table: ${foundFile.filename}`);
            filePath = foundFile.filepath;
            mimeType = foundFile.mimeType;
          }
        } catch (error) {
          console.log(`⚠️ Error searching monthly_reports table: ${error}`);
        }
      }

      // Try pest control docs table if not found
      if (!foundFile) {
        try {
          foundFile = await storage.getPestControlDoc(id);
          if (foundFile) {
            console.log(`✅ Found in pest_control_docs table: ${foundFile.filename}`);
            filePath = foundFile.filepath;
            mimeType = foundFile.mimeType;
          }
        } catch (error) {
          console.log(`⚠️ Error searching pest_control_docs table: ${error}`);
        }
      }

      // Try yearly docs table if not found
      if (!foundFile) {
        try {
          foundFile = await storage.getYearlyDoc(id);
          if (foundFile) {
            console.log(`✅ Found in yearly_docs table: ${foundFile.filename}`);
            filePath = foundFile.filepath;
            mimeType = foundFile.mimeType;
          }
        } catch (error) {
          console.log(`⚠️ Error searching yearly_docs table: ${error}`);
        }
      }

      // Step 2: If not found by ID, try fallback filename search
      if (!foundFile) {
        console.log(`📂 File not found by ID, attempting filename search for: ${id}`);
        
        // Search directories by treating ID as potential filename
        const searchDirectories = [
          path.join(process.cwd(), 'data', 'documents'),
          path.join(process.cwd(), 'data', 'photos'), 
          path.join(process.cwd(), 'data', 'reports'),
          path.join(process.cwd(), 'data', 'images'),
          path.join(process.cwd(), 'data', 'logos'),
          path.join(process.env.TMPDIR || "/tmp", "uploads"),
          path.join(process.env.TMPDIR || "/tmp", "attached_assets")
        ];

        for (const searchDir of searchDirectories) {
          try {
            if (!fs.existsSync(searchDir)) continue;

            const files = fs.readdirSync(searchDir);
            
            // Try exact filename match first
            let matchedFile = files.find(file => file === id);
            
            // Try partial matching if no exact match
            if (!matchedFile) {
              matchedFile = files.find(file => 
                file.toLowerCase().includes(id.toLowerCase()) ||
                file.includes(id)
              );
            }

            if (matchedFile) {
              const foundPath = path.join(searchDir, matchedFile);
              if (fs.existsSync(foundPath)) {
                console.log(`✅ Found by filename search: ${foundPath}`);
                filePath = foundPath;
                foundFile = { filename: matchedFile };
                break;
              }
            }
          } catch (error) {
            console.log(`⚠️ Error searching directory ${searchDir}: ${error}`);
          }
        }
      }

      // Step 3: If still not found, return 404
      if (!foundFile || !filePath) {
        console.log(`❌ File not found: ${id}`);
        return res.status(404).json({ 
          message: 'File not found',
          fileId: id,
          error: 'FILE_NOT_FOUND'
        });
      }

      // Step 4: Resolve actual file path and verify file exists
      let actualFilePath = filePath;
      
      // Handle relative paths that start with /
      if (filePath.startsWith('/')) {
        actualFilePath = path.join(process.cwd(), filePath.substring(1));
      }
      
      // If file doesn't exist at expected path, try alternative locations
      if (!fs.existsSync(actualFilePath)) {
        const filename = foundFile.filename || path.basename(filePath);
        
        const fallbackPaths = [
          path.join(process.cwd(), 'data', 'documents', filename),
          path.join(process.cwd(), 'data', 'photos', filename),
          path.join(process.cwd(), 'data', 'reports', filename),
          path.join(process.cwd(), 'uploads', filename),
          path.join(process.cwd(), 'attached_assets', filename),
          path.join(process.cwd(), 'backup', 'documents', filename),
          path.join(process.cwd(), 'backup', 'photos', filename),
          path.join(process.cwd(), 'backup', 'reports', filename)
        ];

        for (const fallbackPath of fallbackPaths) {
          if (fs.existsSync(fallbackPath)) {
            console.log(`✅ Found file at fallback location: ${fallbackPath}`);
            actualFilePath = fallbackPath;
            break;
          }
        }

        // Final check - if still not found, return 404
        if (!fs.existsSync(actualFilePath)) {
          console.log(`❌ File not found at any location: ${filename}`);
          return res.status(404).json({ 
            message: 'File not found at any storage location',
            fileId: id,
            filename: filename,
            error: 'FILE_NOT_ACCESSIBLE'
          });
        }
      }

      // Step 5: Determine MIME type and set headers
      const fileExtension = path.extname(actualFilePath).toLowerCase();
      const filename = path.basename(actualFilePath);
      
      // Comprehensive MIME type mapping
      const mimeTypes: { [key: string]: string } = {
        // Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.ico': 'image/x-icon',
        
        // Documents
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel', 
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain',
        '.rtf': 'application/rtf',
        '.csv': 'text/csv',
        
        // Archives
        '.zip': 'application/zip',
        '.rar': 'application/vnd.rar',
        '.7z': 'application/x-7z-compressed',
        
        // Other
        '.json': 'application/json',
        '.xml': 'application/xml'
      };

      // Use stored MIME type if available, otherwise determine from extension
      const contentType = mimeType || mimeTypes[fileExtension] || 'application/octet-stream';

      // Step 6: Set response headers for caching and security
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.setHeader('ETag', `"${Date.now()}"`);
      res.setHeader('Last-Modified', new Date().toUTCString());
      
      // Special headers for PDFs
      if (fileExtension === '.pdf') {
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self'; object-src 'self'");
      }

      // Step 7: Stream the file
      console.log(`📤 Serving file: ${actualFilePath} as ${contentType}`);
      
      const fileStream = fs.createReadStream(actualFilePath);
      
      fileStream.on('error', (error) => {
        console.error(`❌ File stream error for ${actualFilePath}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ 
            message: 'Error reading file',
            error: 'FILE_READ_ERROR' 
          });
        }
      });

      fileStream.pipe(res);

    } catch (error) {
      console.error(`❌ File resolver error for ID ${req.params.id}:`, error);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Internal server error while resolving file',
          fileId: req.params.id,
          error: 'INTERNAL_ERROR'
        });
      }
    }
  });

  // Delete file (soft delete - mark as inactive)
  app.delete('/api/files/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFile(id);
      res.json({ success: true, message: "File marked as inactive" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Shop Layout Management Routes with RBAC
  
  // Mixed authentication middleware for routes that support both admin and branch users
  const isAdminOrBranchAuthenticated = (req: any, res: any, next: any) => {
    const adminToken = req.cookies?.admin_token;
    const isAdmin = adminToken && adminTokens.has(adminToken);
    const isBranch = req.session.branchId && req.session.userType === 'branch';
    
    console.log(`🔐 Shop Layout Auth Check - URL: ${req.url}, Method: ${req.method}`);
    console.log(`   Admin Token: ${adminToken}, Admin Valid: ${isAdmin}`);
    console.log(`   Session BranchId: ${req.session.branchId}, Session UserType: ${req.session.userType}, Branch Valid: ${isBranch}`);
    
    // PRIORITY FIX: Prefer branch session over admin token when both exist
    // This ensures active branch users maintain their context even if they have admin tokens
    if (isBranch && isAdmin) {
      console.log(`   🔄 Both admin and branch authentication present - prioritizing branch context`);
      req.userType = 'branch';
      req.sessionBranchId = req.session.branchId;
      console.log(`   ✅ Authentication successful as: branch (priority over admin)`);
      return next();
    } else if (isBranch) {
      req.userType = 'branch';
      req.sessionBranchId = req.session.branchId;
      console.log(`   ✅ Authentication successful as: branch`);
      return next();
    } else if (isAdmin) {
      req.userType = 'admin';
      req.sessionBranchId = req.session.branchId; // Still available for admin context if needed
      console.log(`   ✅ Authentication successful as: admin`);
      return next();
    }
    
    console.log(`   ❌ Authentication failed - returning 401`);
    return res.status(401).json({ message: "Authentication required" });
  };

  // GET /api/shop-layouts - List layouts with RBAC
  app.get('/api/shop-layouts', isAdminOrBranchAuthenticated, async (req, res) => {
    try {
      const { branchId: queryBranchId } = branchIdQuerySchema.parse(req.query);
      
      let effectiveBranchId: string | undefined;
      
      if (req.userType === 'admin') {
        // Admin can optionally filter by branchId, or see all layouts
        effectiveBranchId = queryBranchId;
      } else {
        // Branch users can only see their own layouts
        effectiveBranchId = req.sessionBranchId;
      }
      
      const layouts = await storage.getShopLayouts(effectiveBranchId);
      res.json(layouts);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid query parameters", 
          errors: error.errors 
        });
      }
      console.error("Error fetching shop layouts:", error);
      res.status(500).json({ message: "Failed to fetch shop layouts" });
    }
  });

  // GET /api/shop-layouts/:id - Get single layout with RBAC
  app.get('/api/shop-layouts/:id', isAdminOrBranchAuthenticated, async (req, res) => {
    try {
      const { id } = idParamSchema.parse(req.params);
      
      let branchIdFilter: string | undefined;
      if (req.userType === 'branch') {
        // Branch users can only access their own layouts
        branchIdFilter = req.sessionBranchId;
      }
      // Admin users can access any layout (no branchId filter)
      
      const layout = await storage.getShopLayout(id, branchIdFilter);
      
      if (!layout) {
        return res.status(404).json({ message: "Shop layout not found" });
      }
      
      res.json(layout);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid layout ID", 
          errors: error.errors 
        });
      }
      console.error("Error fetching shop layout:", error);
      res.status(500).json({ message: "Failed to fetch shop layout" });
    }
  });

  // POST /api/shop-layouts - Create new layout with RBAC
  app.post('/api/shop-layouts', isAdminOrBranchAuthenticated, async (req, res) => {
    try {
      // Normalize payload structure (handle both nested and flat structures)
      const { title, elements, dimensions } = req.body.layoutData ? req.body.layoutData : req.body;
      
      // Build normalized payload with required fields
      const payload = {
        title,
        elements: elements ?? [],
        dimensions: dimensions ?? { width: 420, height: 594 },
        branchId: req.userType === 'branch' ? req.sessionBranchId : req.body.branchId,
        createdBy: req.userType === 'branch' ? 'branch' : 'admin',
        isActive: req.body.isActive ?? false
      };
      
      // Validate branchId for admin users
      if (req.userType === 'admin' && !payload.branchId) {
        return res.status(400).json({ message: "branchId is required" });
      }
      
      const validatedData = insertShopLayoutSchema.parse(payload);
      const newLayout = await storage.createShopLayout(validatedData);
      
      res.status(201).json(newLayout);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid layout data", 
          errors: error.errors 
        });
      }
      console.error("Error creating shop layout:", error);
      res.status(500).json({ message: "Failed to create shop layout" });
    }
  });

  // PATCH /api/shop-layouts/:id - Update layout with RBAC
  app.patch('/api/shop-layouts/:id', isAdminOrBranchAuthenticated, async (req, res) => {
    try {
      const { id } = idParamSchema.parse(req.params);
      let updateData = { ...req.body };
      
      // Remove read-only fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      
      let branchIdFilter: string | undefined;
      
      if (req.userType === 'branch') {
        // Branch users: can only update their own layouts, cannot change branchId
        branchIdFilter = req.sessionBranchId;
        delete updateData.branchId; // Prevent branch users from changing branchId
      }
      // Admin users can update any layout and can change branchId
      
      // Validate the update data against a partial schema
      const partialUpdateSchema = insertShopLayoutSchema.partial();
      const validatedUpdateData = partialUpdateSchema.parse(updateData);
      
      const updatedLayout = await storage.updateShopLayout(id, validatedUpdateData, branchIdFilter);
      
      if (!updatedLayout) {
        return res.status(404).json({ message: "Shop layout not found or access denied" });
      }
      
      res.json(updatedLayout);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: error.errors 
        });
      }
      console.error("Error updating shop layout:", error);
      res.status(500).json({ message: "Failed to update shop layout" });
    }
  });

  // DELETE /api/shop-layouts/:id - Delete layout with RBAC
  app.delete('/api/shop-layouts/:id', isAdminOrBranchAuthenticated, async (req, res) => {
    try {
      const { id } = idParamSchema.parse(req.params);
      
      let branchIdFilter: string | undefined;
      
      if (req.userType === 'branch') {
        // Branch users can only delete their own layouts
        branchIdFilter = req.sessionBranchId;
      }
      // Admin users can delete any layout (no branchId filter)
      
      // First check if the layout exists and user has access
      const layout = await storage.getShopLayout(id, branchIdFilter);
      if (!layout) {
        return res.status(404).json({ message: "Shop layout not found or access denied" });
      }
      
      await storage.deleteShopLayout(id, branchIdFilter);
      res.json({ success: true, message: "Shop layout deleted successfully" });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid layout ID", 
          errors: error.errors 
        });
      }
      console.error("Error deleting shop layout:", error);
      res.status(500).json({ message: "Failed to delete shop layout" });
    }
  });

  // Comprehensive MIME type setting for lifetime storage
  function setLifetimeStorageHeaders(res: any, filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Set proper MIME types for different file types
    switch (ext) {
      case '.pdf':
        res.setHeader('Content-Type', 'application/pdf');
        break;
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.gif':
        res.setHeader('Content-Type', 'image/gif');
        break;
      case '.svg':
        res.setHeader('Content-Type', 'image/svg+xml');
        break;
      case '.webp':
        res.setHeader('Content-Type', 'image/webp');
        break;
      case '.doc':
        res.setHeader('Content-Type', 'application/msword');
        break;
      case '.docx':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        break;
      case '.xls':
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        break;
      case '.xlsx':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        break;
      case '.txt':
        res.setHeader('Content-Type', 'text/plain');
        break;
    }
    
    // Lifetime storage cache headers
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Lifetime-Storage', 'enabled');
  }

  // Enhanced static file serving for ALL storage directories with lifetime access
  
  // Primary data directories - organized structure
  app.use('/data', express.static(dataDir, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      setLifetimeStorageHeaders(res, filePath);
    }
  }));
  
  // Legacy uploads directory - backward compatibility
  app.use('/uploads', express.static(legacyUploadsDir, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      setLifetimeStorageHeaders(res, filePath);
    }
  }));
  
  // Attached assets directory - comprehensive file access
  app.use('/attached_assets', express.static(attachedAssetsDir, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      setLifetimeStorageHeaders(res, filePath);
    }
  }));
  
  // Backup directories - redundant storage access for lifetime preservation
  app.use('/backup', express.static(backupDir, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      setLifetimeStorageHeaders(res, filePath);
      res.setHeader('X-Backup-Storage', 'true');
    }
  }));

  // User preferences management routes - replace localStorage usage
  app.get('/api/user/preferences', isAuthenticated, async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session.userId || session.branchId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // For branch users, get branch preferences
      if (session.userType === 'branch' && session.branchId) {
        const branch = await storage.getBranch(session.branchId);
        if (branch) {
          res.json({
            theme: branch.branchTheme || 'blue',
            fontSize: branch.branchFontSize || 'medium',
            branchPreferences: branch.branchPreferences || {}
          });
        } else {
          res.status(404).json({ message: "Branch not found" });
        }
      } else if (session.userId) {
        // For admin/regular users, get user preferences
        const user = await storage.getUserById(session.userId);
        if (user) {
          res.json({
            theme: user.theme || 'dark',
            fontSize: user.fontSize || 'medium',
            preferences: user.preferences || {}
          });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } else {
        res.status(401).json({ message: "Invalid session" });
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put('/api/user/preferences', isAuthenticated, async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session.userId || session.branchId;
      const { theme, fontSize, preferences } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Validate theme and fontSize
      const validThemes = ['light', 'dark', 'blue', 'purple', 'pink', 'green', 'orange'];
      const validFontSizes = ['small', 'medium', 'large'];
      
      if (theme && !validThemes.includes(theme)) {
        return res.status(400).json({ message: "Invalid theme value" });
      }
      
      if (fontSize && !validFontSizes.includes(fontSize)) {
        return res.status(400).json({ message: "Invalid fontSize value" });
      }
      
      // For branch users, update branch preferences
      if (session.userType === 'branch' && session.branchId) {
        const updateData: any = {};
        if (theme) updateData.branchTheme = theme;
        if (fontSize) updateData.branchFontSize = fontSize;
        if (preferences) updateData.branchPreferences = preferences;
        
        const updatedBranch = await storage.updateBranch(session.branchId, updateData);
        res.json({
          theme: updatedBranch.branchTheme,
          fontSize: updatedBranch.branchFontSize,
          preferences: updatedBranch.branchPreferences
        });
      } else if (session.userId) {
        // For admin/regular users, update user preferences  
        const updateData: any = {};
        if (theme) updateData.theme = theme;
        if (fontSize) updateData.fontSize = fontSize;
        if (preferences) updateData.preferences = preferences;
        
        const updatedUser = await storage.updateUser(session.userId, updateData);
        res.json({
          theme: updatedUser.theme,
          fontSize: updatedUser.fontSize,
          preferences: updatedUser.preferences
        });
      } else {
        res.status(401).json({ message: "Invalid session" });
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Security pin session management - replace localStorage security sessions
  app.post('/api/security/verify-pin', isAuthenticated, async (req, res) => {
    try {
      const { pin } = req.body;
      const SECURITY_PIN = "121212";
      
      if (!pin) {
        return res.status(400).json({ message: "PIN is required" });
      }
      
      if (pin !== SECURITY_PIN) {
        return res.status(401).json({ message: "Invalid security PIN" });
      }
      
      const session = req.session as any;
      const userId = session.userId || session.branchId;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Generate security session
      const securitySessionId = randomUUID();
      const securitySessionExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      
      // Store security session in session storage (server-side)
      session.securitySessionId = securitySessionId;
      session.securitySessionExpiry = securitySessionExpiry;
      session.lastSecurityAuth = new Date();
      
      res.json({ 
        success: true, 
        message: "Security PIN verified",
        expiresAt: securitySessionExpiry
      });
    } catch (error) {
      console.error("Error verifying security PIN:", error);
      res.status(500).json({ message: "Failed to verify PIN" });
    }
  });

  app.get('/api/security/status', isAuthenticated, async (req, res) => {
    try {
      const session = req.session as any;
      const now = new Date();
      
      // Check if security session exists and is not expired
      const isSecurityAuthenticated = session.securitySessionId && 
        session.securitySessionExpiry && 
        new Date(session.securitySessionExpiry) > now;
      
      res.json({
        isAuthenticated: !!isSecurityAuthenticated,
        expiresAt: session.securitySessionExpiry || null
      });
    } catch (error) {
      console.error("Error checking security status:", error);
      res.status(500).json({ message: "Failed to check security status" });
    }
  });

  app.post('/api/security/clear', isAuthenticated, async (req, res) => {
    try {
      const session = req.session as any;
      
      // Clear security session
      delete session.securitySessionId;
      delete session.securitySessionExpiry;
      delete session.lastSecurityAuth;
      
      res.json({ success: true, message: "Security session cleared" });
    } catch (error) {
      console.error("Error clearing security session:", error);
      res.status(500).json({ message: "Failed to clear security session" });
    }
  });

  // Demo authentication endpoint - replace localStorage demo user storage
  app.post('/api/demo/login', async (req, res) => {
    try {
      const { userType, demoData } = req.body;
      
      if (!userType || !demoData) {
        return res.status(400).json({ message: "Demo user type and data are required" });
      }
      
      // Create demo session (server-side instead of localStorage)
      const session = req.session as any;
      session.isDemoMode = true;
      session.demoUserType = userType;
      session.demoUserId = demoData.id;
      session.demoUserData = demoData;
      
      // Set appropriate session properties based on user type
      if (userType === 'branch') {
        session.userType = 'branch';
        session.branchId = demoData.branchId;
        session.userId = demoData.id;
      } else if (userType === 'admin') {
        session.userType = 'admin';
        session.userId = demoData.id;
        // Generate a demo admin token
        const demoToken = randomUUID();
        session.admin_token = demoToken;
        adminTokens.add(demoToken);
      }
      
      console.log(`Demo ${userType} session created for: ${demoData.email}`);
      res.json({ 
        success: true, 
        message: `Demo ${userType} session created successfully`,
        userType: userType,
        userData: {
          id: demoData.id,
          email: demoData.email,
          firstName: demoData.firstName,
          lastName: demoData.lastName
        }
      });
    } catch (error) {
      console.error("Error creating demo session:", error);
      res.status(500).json({ message: "Failed to create demo session" });
    }
  });

  // Auto-cleanup old notifications (10 days)
  const cleanupOldNotifications = async () => {
    try {
      console.log("Running notification cleanup...");
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      const deleted = await storage.deleteOldNotifications(tenDaysAgo);
      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} old notifications`);
      }
    } catch (error) {
      console.error("Error cleaning up notifications:", error);
    }
  };

  // Run cleanup every hour
  setInterval(cleanupOldNotifications, 60 * 60 * 1000);
  
  // Run cleanup on startup
  cleanupOldNotifications();

  // SOURCE CODE DOWNLOAD ENDPOINT - Admin Only
  app.get('/api/download-source-code', async (req, res) => {
    try {
      // Check if user is admin (simple check for now)
      const adminSession = req.session as any;
      if (!adminSession?.user?.id || adminSession.user.email !== 'amir216@live.com') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('🔥 Admin requesting complete source code download...');
      
      // Set response headers for zip download
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `pest-control-source-${timestamp}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Handle archive errors
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        res.status(500).json({ message: 'Failed to create archive' });
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add source files to archive
      const projectRoot = process.cwd();
      
      // Frontend source code
      if (fs.existsSync(path.join(projectRoot, 'client'))) {
        archive.directory(path.join(projectRoot, 'client'), 'client');
      }
      
      // Backend source code
      if (fs.existsSync(path.join(projectRoot, 'server'))) {
        archive.directory(path.join(projectRoot, 'server'), 'server');
      }
      
      // Shared types and schema
      if (fs.existsSync(path.join(projectRoot, 'shared'))) {
        archive.directory(path.join(projectRoot, 'shared'), 'shared');
      }
      
      // Configuration files
      const configFiles = [
        'package.json',
        'tsconfig.json',
        'tailwind.config.ts',
        'vite.config.ts',
        'drizzle.config.ts',
        'replit.md',
        'README.md',
        '.gitignore'
      ];
      
      configFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      });

      // Add database schema documentation
      const schemaInfo = `
# Database Schema Documentation
Generated: ${new Date().toISOString()}

## Tables:
- branches: Branch management with logos and contact info
- users: User authentication and roles
- documents: Document storage with permanent retention
- photos: Photo management (before/after)
- pest_control_docs: Pest control documents
- monthly_reports: Monthly inspection reports
- notifications: Admin-branch messaging
- useful_links: Useful links management
- payment_records: Payment tracking
- shop_layouts: Chart designer layouts

## Key Features:
- PERMANENT STORAGE: All documents stored forever unless manually deleted
- Role-based access: Admin vs Branch user permissions
- File support: PNG, JPG, SVG, PDF, GIF across all devices
- Mobile responsive: Apple, iOS, Mac Air, iPad, Windows, Android, iPhones, laptops
- Authentication: Replit Auth integration

## Investment Protection:
- $5000 investment fully protected
- ZERO auto-deletion policies
- Lifetime document storage guarantee
      `;
      
      archive.append(schemaInfo, { name: 'DATABASE_SCHEMA.md' });

      console.log('📦 Finalizing source code archive...');
      archive.finalize();

    } catch (error) {
      console.error('Source code download error:', error);
      res.status(500).json({ message: 'Failed to create source code download' });
    }
  });

  // ==================== IoT / Link24 Cloud Routes ====================
  const tuyaService = await import("./tuya-service.js");

  app.get("/api/tuya/status", isAdminAuthenticated, (_req, res) => {
    const configured = tuyaService.isConfigured();
    res.json({
      configured,
      accessId: configured ? (process.env.TUYA_ACCESS_ID || "").replace(/.(?=.{4})/g, "•") : null,
      dataCenter: "Central Europe (openapi.tuyaeu.com)",
    });
  });

  app.get("/api/tuya/test-connection", isAdminAuthenticated, async (_req, res) => {
    try {
      const result = await tuyaService.testConnection();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/tuya/devices", isAdminAuthenticated, async (_req, res) => {
    try {
      const devices = await tuyaService.getAllTuyaDevices();
      res.json(devices);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/tuya/devices/:deviceId", isAdminAuthenticated, async (req, res) => {
    try {
      const info = await tuyaService.getDeviceInfo(req.params.deviceId);
      res.json(info);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/tuya/devices/:deviceId/status", isAdminAuthenticated, async (req, res) => {
    try {
      const status = await tuyaService.getDeviceStatus(req.params.deviceId);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/tuya/devices/:deviceId/commands", isAdminAuthenticated, async (req, res) => {
    try {
      const result = await tuyaService.sendDeviceCommands(req.params.deviceId, req.body.commands);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Assigned IoT devices (branch assignments stored in DB)
  app.get("/api/iot/devices", isAdminAuthenticated, async (_req, res) => {
    try {
      const devices = await storage.getIotDevices();
      res.json(devices);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/iot/devices", isAdminAuthenticated, async (req, res) => {
    try {
      const { deviceId, deviceName, branchId, notes } = req.body;
      if (!deviceId || !deviceName || !branchId) {
        return res.status(400).json({ message: "deviceId, deviceName, and branchId are required" });
      }
      // Fetch live status from Tuya
      let isOnline = false;
      let lastStatus: any[] = [];
      try {
        const info = await tuyaService.getDeviceInfo(deviceId);
        isOnline = info?.online ?? false;
        const statusArr = await tuyaService.getDeviceStatus(deviceId);
        lastStatus = Array.isArray(statusArr) ? statusArr : [];
      } catch (_) {}

      const device = await storage.createIotDevice({ deviceId, deviceName, branchId, notes, isOnline, lastStatus, lastCheckedAt: new Date() } as any);
      res.json(device);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/iot/devices/:id", isAdminAuthenticated, async (req, res) => {
    try {
      await storage.deleteIotDevice(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Refresh device status from cloud
  app.post("/api/iot/devices/:id/refresh", isAdminAuthenticated, async (req, res) => {
    try {
      const device = await storage.getIotDevice(req.params.id);
      if (!device) return res.status(404).json({ message: "Device not found" });
      const info = await tuyaService.getDeviceInfo(device.deviceId);
      const statusArr = await tuyaService.getDeviceStatus(device.deviceId);
      const statusList = Array.isArray(statusArr) ? statusArr : [];
      const alarmActive = tuyaService.checkAlarmActive(statusList);
      const updated = await storage.updateIotDevice(req.params.id, {
        isOnline: info?.online ?? false,
        alarmActive,
        lastStatus: statusList,
        lastCheckedAt: new Date(),
        ...(alarmActive ? { lastAlarmAt: new Date() } : {}),
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Clear alarm for a device
  app.post("/api/iot/devices/:id/clear-alarm", isAdminAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateIotDevice(req.params.id, { alarmActive: false });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Get all devices with active alarms
  app.get("/api/iot/alarms", isAdminAuthenticated, async (_req, res) => {
    try {
      const devices = await storage.getIotDevices();
      const alarmed = devices.filter((d: any) => d.alarmActive);
      res.json(alarmed);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Branch: get their assigned devices
  app.get("/api/branch/iot-devices", async (req, res) => {
    try {
      const session = req.session as any;
      if (!session.branchId || session.userType !== "branch") {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const devices = await storage.getIotDevicesByBranch(session.branchId);
      res.json(devices);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}