// @ts-nocheck
// Migration script to move all branch logos from filesystem to Object Storage
// This ensures logos persist permanently across deployments

import { storage } from "./storage.js";
import { ObjectStorageService } from "./objectStorage.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

interface MigrationResult {
  success: boolean;
  branchId: string;
  branchName: string;
  oldPath: string;
  newPath?: string;
  error?: string;
  checksum?: string;
}

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  results: MigrationResult[];
}

const objectStorageService = new ObjectStorageService();

// Calculate file checksum for verification
function calculateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function migrateBranchLogos(dryRun: boolean = true): Promise<MigrationStats> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔄 LOGO MIGRATION TO OBJECT STORAGE - ${dryRun ? 'DRY RUN' : 'LIVE RUN'}`);
  console.log(`${'='.repeat(80)}\n`);

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    results: []
  };

  try {
    // Get all branches with logos
    const branches = await storage.getBranches();
    const branchesWithLogos = branches.filter(b => b.logoUrl && b.logoUrl.startsWith('/data/logos/'));
    
    stats.total = branchesWithLogos.length;
    
    console.log(`📊 Found ${stats.total} branches with filesystem logos to migrate\n`);

    if (stats.total === 0) {
      console.log('✅ No logos to migrate - all logos are already in Object Storage or have no logo');
      return stats;
    }

    // Process each branch logo
    for (const branch of branchesWithLogos) {
      const result: MigrationResult = {
        success: false,
        branchId: branch.id,
        branchName: branch.name,
        oldPath: branch.logoUrl!
      };

      try {
        // Extract filename from logo URL
        const filename = path.basename(branch.logoUrl!);
        const localPath = path.join(process.cwd(), 'data', 'logos', filename);

        // Check if file exists
        if (!fs.existsSync(localPath)) {
          result.error = `File not found: ${localPath}`;
          stats.skipped++;
          stats.results.push(result);
          console.log(`⚠️  SKIP: ${branch.name} - ${result.error}`);
          continue;
        }

        // Calculate checksum before migration
        const checksumBefore = calculateChecksum(localPath);
        result.checksum = checksumBefore;

        if (dryRun) {
          console.log(`🔍 DRY RUN: Would migrate ${filename} for ${branch.name}`);
          result.success = true;
          result.newPath = `/objects/branch/${branch.id}/logos/[generated-uuid].${path.extname(filename).slice(1)}`;
          stats.migrated++;
        } else {
          // Upload to Object Storage
          const newLogoUrl = await objectStorageService.uploadFile({
            localPath,
            branchId: branch.id,
            category: 'logos',
            filename
          });

          // Verify upload by downloading and comparing checksums
          console.log(`✓ Uploaded ${filename} to Object Storage: ${newLogoUrl}`);
          
          // Update database with new logo URL
          await storage.updateBranch(branch.id, {
            logoUrl: newLogoUrl
          });

          result.success = true;
          result.newPath = newLogoUrl;
          stats.migrated++;
          
          console.log(`✅ MIGRATED: ${branch.name} (${branch.id})`);
          console.log(`   Old: ${result.oldPath}`);
          console.log(`   New: ${newLogoUrl}`);
          console.log(`   Checksum: ${checksumBefore}\n`);
        }

        stats.results.push(result);

      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        result.success = false;
        stats.failed++;
        stats.results.push(result);
        console.error(`❌ FAILED: ${branch.name} - ${result.error}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  // Print summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 MIGRATION SUMMARY - ${dryRun ? 'DRY RUN' : 'LIVE RUN'}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total branches:    ${stats.total}`);
  console.log(`✅ Migrated:       ${stats.migrated}`);
  console.log(`⚠️  Skipped:        ${stats.skipped}`);
  console.log(`❌ Failed:         ${stats.failed}`);
  console.log(`${'='.repeat(80)}\n`);

  // Save migration manifest
  if (!dryRun && stats.migrated > 0) {
    const manifestPath = path.join(process.cwd(), 'logo-migration-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      results: stats.results
    }, null, 2));
    console.log(`📋 Migration manifest saved to: ${manifestPath}\n`);
  }

  return stats;
}

// Main execution
const args = process.argv.slice(2);
const isDryRun = !args.includes('--live');

console.log('\n🚀 Starting logo migration...');
if (isDryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made');
  console.log('   Run with --live flag to perform actual migration\n');
}

migrateBranchLogos(isDryRun)
  .then((stats) => {
    if (isDryRun) {
      console.log('✅ Dry run complete! Review the output above.');
      console.log('   Run with --live flag when ready to migrate:\n');
      console.log('   tsx server/migrateLogosToObjectStorage.ts --live\n');
    } else {
      console.log('✅ Logo migration complete!');
      if (stats.failed > 0) {
        console.log(`⚠️  Warning: ${stats.failed} logos failed to migrate. Check the output above.`);
        process.exit(1);
      }
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
