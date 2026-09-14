// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import { branches } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const DEFAULT_LOGO = '/home/runner/workspace/uploads/1751077571616_Food_Logo.png';
const DATA_LOGOS_DIR = '/home/runner/workspace/data/logos';
const BACKUP_LOGOS_DIR = '/home/runner/workspace/backup/logos';

async function restoreAllLogos() {
  console.log('🔧 Starting comprehensive logo restoration...');
  
  // Ensure directories exist
  if (!fs.existsSync(DATA_LOGOS_DIR)) {
    fs.mkdirSync(DATA_LOGOS_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_LOGOS_DIR)) {
    fs.mkdirSync(BACKUP_LOGOS_DIR, { recursive: true });
  }
  
  // Get all branches
  const allBranches = await db.select().from(branches);
  console.log(`📋 Found ${allBranches.length} branches to process`);
  
  let restored = 0;
  let errors = 0;
  
  for (const branch of allBranches) {
    try {
      const timestamp = Date.now();
      const ext = 'png'; // Default extension
      const newFilename = `logo_${branch.id}_${timestamp}.${ext}`;
      const newPath = path.join(DATA_LOGOS_DIR, newFilename);
      const backupPath = path.join(BACKUP_LOGOS_DIR, newFilename);
      
      let sourceFile: string | null = null;
      
      // Check if branch already has a valid logo in data/logos
      if (branch.logoUrl && branch.logoUrl.startsWith('/data/logos/')) {
        const fullPath = path.join('/home/runner/workspace', branch.logoUrl.substring(1));
        if (fs.existsSync(fullPath)) {
          console.log(`✅ ${branch.name}: Logo already in correct location`);
          
          // Just ensure backup exists
          const filename = path.basename(fullPath);
          const backupDest = path.join(BACKUP_LOGOS_DIR, filename);
          if (!fs.existsSync(backupDest)) {
            fs.copyFileSync(fullPath, backupDest);
          }
          continue;
        }
      }
      
      // Try to find existing logo file for this branch
      if (branch.logoUrl) {
        const oldPath = branch.logoUrl.startsWith('/') 
          ? path.join('/home/runner/workspace', branch.logoUrl.substring(1))
          : branch.logoUrl;
          
        if (fs.existsSync(oldPath)) {
          sourceFile = oldPath;
          console.log(`📂 ${branch.name}: Found existing logo at ${branch.logoUrl}`);
        }
      }
      
      // If no logo found, use default
      if (!sourceFile) {
        if (fs.existsSync(DEFAULT_LOGO)) {
          sourceFile = DEFAULT_LOGO;
          console.log(`🔄 ${branch.name}: Using default logo`);
        } else {
          console.warn(`⚠️  ${branch.name}: No logo found, skipping`);
          errors++;
          continue;
        }
      }
      
      // Copy to data/logos and backup
      fs.copyFileSync(sourceFile, newPath);
      fs.copyFileSync(sourceFile, backupPath);
      
      // Update database
      const newLogoUrl = `/data/logos/${newFilename}`;
      await db.update(branches)
        .set({ logoUrl: newLogoUrl })
        .where(eq(branches.id, branch.id));
      
      console.log(`✅ ${branch.name}: Logo restored to ${newLogoUrl}`);
      restored++;
      
    } catch (error) {
      console.error(`❌ ${branch.name}: Error restoring logo:`, error);
      errors++;
    }
  }
  
  console.log(`\n🎉 Logo restoration complete!`);
  console.log(`✅ Restored: ${restored} branches`);
  console.log(`❌ Errors: ${errors} branches`);
  console.log(`📁 All logos stored in: ${DATA_LOGOS_DIR}`);
  console.log(`💾 Backups stored in: ${BACKUP_LOGOS_DIR}`);
}

// Run the restoration
restoreAllLogos()
  .then(() => {
    console.log('✅ Logo restoration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Logo restoration failed:', error);
    process.exit(1);
  });
