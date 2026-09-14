// @ts-nocheck
import { db } from './db.js';
import { branches } from '../shared/schema.js';
import { like, eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = 500;
const logosDir = path.join(process.cwd(), 'data', 'logos');
const uploadsDir = path.join(process.env.TMPDIR || "/tmp", "uploads");

async function migrateBranchLogos(dryRun = true) {
  console.log(`🔄 Starting logo migration (${dryRun ? 'DRY RUN' : 'LIVE MODE'})...`);
  
  // Ensure logos directory exists
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }

  let offset = 0;
  let totalMigrated = 0;
  let totalErrors = 0;
  const errors: string[] = [];

  while (true) {
    // Get batch of branches with old logo paths
    const branchBatch = await db
      .select()
      .from(branches)
      .where(like(branches.logoUrl, '/uploads/%'))
      .limit(BATCH_SIZE)
      .offset(offset);

    if (branchBatch.length === 0) {
      break;
    }

    console.log(`\n📦 Processing batch ${offset / BATCH_SIZE + 1} (${branchBatch.length} branches)...`);

    for (const branch of branchBatch) {
      try {
        const oldPath = branch.logoUrl;
        if (!oldPath) continue;

        // Extract filename and extension
        const filename = path.basename(oldPath);
        const ext = path.extname(filename);
        const timestamp = Date.now();

        // Create new path with branch ID
        const newFilename = `logo_${branch.id}_${timestamp}${ext}`;
        const newPath = `/data/logos/${newFilename}`;

        // Resolve old file location
        const oldFilePath = path.join(process.cwd(), oldPath.substring(1));
        
        if (!fs.existsSync(oldFilePath)) {
          errors.push(`❌ File missing for ${branch.name}: ${oldPath}`);
          console.log(`⚠️  File missing for ${branch.name}: ${oldPath}`);
          totalErrors++;
          continue;
        }

        // Copy file to new location
        const newFilePath = path.join(logosDir, newFilename);
        
        if (!dryRun) {
          fs.copyFileSync(oldFilePath, newFilePath);
          console.log(`✅ Copied: ${filename} → ${newFilename}`);

          // Update database
          await db
            .update(branches)
            .set({ logoUrl: newPath, updatedAt: new Date() })
            .where(eq(branches.id, branch.id));
          
          console.log(`✅ Updated ${branch.name}: ${oldPath} → ${newPath}`);
        } else {
          console.log(`[DRY RUN] Would copy: ${filename} → ${newFilename}`);
          console.log(`[DRY RUN] Would update ${branch.name}: ${oldPath} → ${newPath}`);
        }

        totalMigrated++;
      } catch (error) {
        const errorMsg = `Error migrating ${branch.name}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        totalErrors++;
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`\n📊 Migration Complete!`);
  console.log(`✅ Successfully migrated: ${totalMigrated} branches`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Error Summary:`);
    errors.forEach(err => console.log(err));
  }

  return { totalMigrated, totalErrors, errors };
}

// Run migration
const dryRun = process.argv.includes('--dry-run');
migrateBranchLogos(dryRun)
  .then(result => {
    console.log(`\n✨ Migration ${dryRun ? 'dry run' : 'completed'}!`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
