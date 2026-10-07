import { db } from "../server/db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

async function main() {
  console.log("Exporting menu items...");
  
  const items = await db.select({
    name: schema.menuItems.name,
    description: schema.menuItems.description,
    price: schema.menuItems.price,
    category: schema.menuCategories.slug,
    available: schema.menuItems.available,
    image: schema.menuItems.image
  })
  .from(schema.menuItems)
  .innerJoin(schema.menuCategories, eq(schema.menuItems.category, schema.menuCategories.id))
  .where(eq(schema.menuItems.restaurantId, "dd1ffb78-53cb-4601-a086-059f17cd25aa"))
  .orderBy(schema.menuCategories.slug, schema.menuItems.name);
  
  console.log(`Total items: ${items.length}`);
  
  const formatted = items.map(item => ({
    name: item.name,
    description: item.description || "",
    price: item.price,
    category: item.category,
    available: item.available,
    image: item.image || ""
  }));
  
  const output = `export const helloMumbaiMenuItemsComplete = ${JSON.stringify(formatted, null, 2).replace(/"([^"]+)":/g, '$1:')};`;
  
  fs.writeFileSync("/tmp/menu_items.ts", output);
  console.log("Written to /tmp/menu_items.ts");
  
  process.exit(0);
}

main().catch(console.error);
