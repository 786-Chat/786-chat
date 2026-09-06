import { db } from "../server/db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const HELLO_MUMBAI_ID = "dd1ffb78-53cb-4601-a086-059f17cd25aa";

async function exportToppings() {
  console.log("Exporting topping groups and options for Hello Mumbai...");
  
  const menuItems = await db.select().from(schema.menuItems)
    .where(eq(schema.menuItems.restaurantId, HELLO_MUMBAI_ID));
  
  const itemIdToName: Record<string, string> = {};
  for (const item of menuItems) {
    itemIdToName[item.id] = item.name;
  }
  
  const toppingGroups = await db.select().from(schema.toppingGroups)
    .where(eq(schema.toppingGroups.restaurantId, HELLO_MUMBAI_ID));
  
  console.log(`Found ${toppingGroups.length} topping groups`);
  
  const groupsWithOptions = [];
  
  for (const group of toppingGroups) {
    const options = await db.select().from(schema.toppingGroupOptions)
      .where(eq(schema.toppingGroupOptions.groupId, group.id));
    
    const itemName = itemIdToName[group.menuItemId] || "Unknown";
    
    groupsWithOptions.push({
      menuItemName: itemName,
      headline: group.headline,
      isRequired: group.isRequired,
      maxSelections: group.maxSelections,
      allowQuantity: group.allowQuantity,
      maxQuantityPerOption: group.maxQuantityPerOption,
      sortOrder: group.sortOrder,
      options: options.map(opt => ({
        name: opt.name,
        price: opt.price,
        isDefault: opt.isDefault,
        isAvailable: opt.isAvailable,
        sortOrder: opt.sortOrder,
      }))
    });
  }
  
  const output = `export const helloMumbaiToppingGroups = ${JSON.stringify(groupsWithOptions, null, 2)};`;
  
  fs.writeFileSync("server/data/helloMumbaiToppings.ts", output);
  console.log(`Exported ${groupsWithOptions.length} topping groups to server/data/helloMumbaiToppings.ts`);
  
  process.exit(0);
}

exportToppings().catch(console.error);
