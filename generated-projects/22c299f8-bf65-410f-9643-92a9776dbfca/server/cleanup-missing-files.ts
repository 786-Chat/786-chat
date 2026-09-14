// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import { monthlyReports, pestControlDocs } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function cleanupMissingFiles() {
  console.log('🔍 Checking for database records with missing files...\n');
  
  let fixedMonthly = 0;
  let fixedPest = 0;
  
  // Check monthly reports
  console.log('📊 Checking monthly reports...');
  const allReports = await db.select().from(monthlyReports).where(eq(monthlyReports.isDeleted, false));
  
  for (const report of allReports) {
    if (!report.filepath) continue;
    
    const fullPath = path.join('/home/runner/workspace', report.filepath.startsWith('/') ? report.filepath.substring(1) : report.filepath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ Missing file for report "${report.title}": ${report.filepath}`);
      console.log(`   Marking as deleted in database...`);
      
      await db.update(monthlyReports)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(monthlyReports.id, report.id));
      
      fixedMonthly++;
    }
  }
  
  // Check pest control docs
  console.log('\n🐛 Checking pest control docs...');
  const allDocs = await db.select().from(pestControlDocs).where(eq(pestControlDocs.isDeleted, false));
  
  for (const doc of allDocs) {
    if (!doc.filepath) continue;
    
    const fullPath = path.join('/home/runner/workspace', doc.filepath.startsWith('/') ? doc.filepath.substring(1) : doc.filepath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ Missing file for doc "${doc.title}": ${doc.filepath}`);
      console.log(`   Marking as deleted in database...`);
      
      await db.update(pestControlDocs)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(pestControlDocs.id, doc.id));
      
      fixedPest++;
    }
  }
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Monthly reports fixed: ${fixedMonthly}`);
  console.log(`   Pest control docs fixed: ${fixedPest}`);
  console.log(`\nDatabase now only shows files that actually exist.`);
}

cleanupMissingFiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during cleanup:', error);
    process.exit(1);
  });
