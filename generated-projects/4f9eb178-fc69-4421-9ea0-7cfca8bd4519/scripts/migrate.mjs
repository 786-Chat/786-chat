import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(url);
const migrationDir = join(process.cwd(), 'sql/migrations');
const files = ['001_initial.sql', '002_add_vip_to_customers.sql', '003_add_products.sql', '004_add_stock_details.sql', '005_add_stock_timestamps.sql', '006_add_stock_movements.sql', '007_add_batches.sql', '008_add_storage_temperature.sql', '009_add_wastage.sql', '010_add_wastage_movement_type.sql'];

for (const file of files) {
  const migration = readFileSync(join(migrationDir, file), 'utf8');
  try {
    await sql(migration);
    console.log(`Applied ${file}`);
  } catch (err) {
    console.error(`Failed ${file}:`, err);
    process.exit(1);
  }
}
console.log('All migrations applied successfully');
