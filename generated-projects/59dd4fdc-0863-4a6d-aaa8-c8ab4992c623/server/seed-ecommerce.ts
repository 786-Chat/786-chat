import { db } from "./db";
import { clothingBrands, clothingCategories, clothingProducts, furnitureBrands, furnitureCategories, furnitureProducts, quranAcademies, quranStudents } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedEcommerceData() {
  try {
    await seedClothingBrand();
    await seedFurnitureBrand();
    await seedQuranAcademy();
    console.log("[ecommerce-seed] Clothing & Furniture seed complete.");
  } catch (err) {
    console.error("[ecommerce-seed] Error:", err);
  }
}

async function seedQuranAcademy() {
  const existing = await db.select().from(quranAcademies);
  if (existing.length > 0) return;

  const [academy] = await db.insert(quranAcademies).values({
    name: "Al-Huda Quran Academy",
    slug: "al-huda-academy",
    description: "Learn Quran with Tajweed - Online Quran recitation and memorization classes",
    phone: "+44 7700 900123",
    email: "info@alhudaacademy.co.uk",
    address: "41 Hamilton Road",
    city: "London",
    country: "UK",
    primaryColor: "#0D7C3D",
    secondaryColor: "#D4AF37",
    adminUsername: "quran1",
    adminPassword: "quran2024",
    isActive: true,
  }).returning();

  await db.insert(quranStudents).values([
    { academyId: academy.id, name: "Ahmed Khan", phone: "+44 7700 900101", email: "ahmed@example.com", age: 12, currentJuz: 1, currentSurah: 2, currentPage: 3, totalMistakes: 5, sessionsCompleted: 8 },
    { academyId: academy.id, name: "Fatima Ali", phone: "+44 7700 900102", email: "fatima@example.com", age: 10, currentJuz: 1, currentSurah: 1, currentPage: 1, totalMistakes: 2, sessionsCompleted: 3 },
    { academyId: academy.id, name: "Yusuf Rahman", phone: "+44 7700 900103", email: "yusuf@example.com", age: 14, currentJuz: 2, currentSurah: 3, currentPage: 50, totalMistakes: 12, sessionsCompleted: 20 },
  ]);

  console.log("[quran-seed] Al-Huda Quran Academy seeded with 3 demo students.");
}

async function seedClothingBrand() {
  const existing = await db.select().from(clothingBrands);
  if (existing.length > 0) return;

  const [brand] = await db.insert(clothingBrands).values({
    name: "Fashion Peaks",
    slug: "fashion-peaks",
    description: "Premium Pakistani fashion brand offering elegant clothing for Women, Men, Kids and Accessories.",
    phone: "+92 300 1234567",
    email: "info@link24.online",
    address: "House 2, Gali Number 1, Survey Number 90, Golden Town, Karachi Sharqi",
    city: "Karachi",
    country: "Pakistan",
    currency: "PKR",
    primaryColor: "#1a1a2e",
    secondaryColor: "#16213e",
    accentColor: "#e94560",
    adminUsername: "zellbury",
    adminPassword: "zell2024",
    isActive: true,
    paymentMethods: {
      cashEnabled: true,
      cardEnabled: false,
      jazzCashEnabled: false,
      easyPaisaEnabled: false,
      bankEnabled: false,
    },
  }).returning();

  const defaultCategories = [
    { name: "Chikankari", gender: "Women", sortOrder: 1 },
    { name: "Essential Pret", gender: "Women", sortOrder: 2 },
    { name: "Unstitched", gender: "Women", sortOrder: 3 },
    { name: "Designer", gender: "Women", sortOrder: 4 },
    { name: "Signature Pret", gender: "Women", sortOrder: 5 },
    { name: "Western", gender: "Women", sortOrder: 6 },
    { name: "Tank Tops", gender: "Women", sortOrder: 7 },
    { name: "Shalwar Kameez", gender: "Men", sortOrder: 8 },
    { name: "Waist Coat", gender: "Men", sortOrder: 9 },
    { name: "Polo", gender: "Men", sortOrder: 10 },
    { name: "Oversized T-Shirt", gender: "Men", sortOrder: 11 },
    { name: "Denim", gender: "Men", sortOrder: 12 },
    { name: "Formal Shirts", gender: "Men", sortOrder: 13 },
    { name: "Basic T-Shirt", gender: "Men", sortOrder: 14 },
    { name: "Girls", gender: "Kids", sortOrder: 15 },
    { name: "Boys", gender: "Kids", sortOrder: 16 },
    { name: "Bags", gender: "Accessories", sortOrder: 17 },
    { name: "Body Mist", gender: "Accessories", sortOrder: 18 },
    { name: "Fragrance", gender: "Accessories", sortOrder: 19 },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of defaultCategories) {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const [created] = await db.insert(clothingCategories).values({ brandId: brand.id, name: cat.name, slug, gender: cat.gender, sortOrder: cat.sortOrder }).returning();
    catMap[cat.name] = created.id;
  }

  const sampleImages = [
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
  ];

  for (const cat of defaultCategories) {
    const numProducts = cat.gender === "Accessories" ? 2 : 3;
    for (let i = 1; i <= numProducts; i++) {
      const name = `${cat.name} Style ${i}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const basePrice = cat.gender === "Accessories" ? 1500 + (i * 200) : 2500 + (i * 500);
      await db.insert(clothingProducts).values({
        brandId: brand.id,
        categoryId: catMap[cat.name],
        name, slug,
        description: `Beautiful ${cat.name} collection - Style ${i}. Premium quality fabric with elegant design.`,
        fabric: cat.gender === "Accessories" ? "Mixed" : "Cotton Blend",
        color: ["Black", "White", "Navy", "Beige", "Red"][i % 5],
        sizes: cat.gender === "Accessories" ? ["One Size"] : ["XS", "S", "M", "L", "XL"],
        price: basePrice.toString(),
        wasPrice: (basePrice + 800).toString(),
        image1: sampleImages[0], image2: sampleImages[1], image3: sampleImages[2], image4: sampleImages[3], image5: sampleImages[4],
        isSoldOut: i === 3 && cat.gender === "Women",
        isFeatured: i === 1,
        isNew: i === 2,
      });
    }
  }
  console.log("[ecommerce-seed] Fashion Peaks clothing brand seeded with categories & products.");
}

async function seedFurnitureBrand() {
  const existing = await db.select().from(furnitureBrands);
  if (existing.length > 0) return;

  const [brand] = await db.insert(furnitureBrands).values({
    name: "Furniture In Fashion",
    slug: "furniture-in-fashion",
    description: "Premium furniture for modern living. Dining tables, beds, sofas, TV stands and more at unbeatable prices with free UK delivery.",
    phone: "+44 20 1234 5678",
    email: "info@link24.online",
    address: "41 Hamilton Road, IG1 2EU",
    city: "London",
    country: "UK",
    currency: "£",
    primaryColor: "#C9A96E",
    secondaryColor: "#1a1a2e",
    accentColor: "#D4AF37",
    bgColor: "#0f0f1a",
    cardBgColor: "rgba(255,255,255,0.05)",
    adminUsername: "furniture1",
    adminPassword: "furn2024",
    deliveryFee: "0",
    isActive: true,
    openingHours: {
      Monday: { open: "09:00", close: "18:00" },
      Tuesday: { open: "09:00", close: "18:00" },
      Wednesday: { open: "09:00", close: "18:00" },
      Thursday: { open: "09:00", close: "18:00" },
      Friday: { open: "09:00", close: "18:00" },
      Saturday: { open: "10:00", close: "17:00" },
      Sunday: { closed: true },
    },
    paymentMethods: {
      cashEnabled: true,
      cardEnabled: false,
      bankEnabled: true,
      bankName: "Halifax",
      bankAccountName: "Mujeeb Sardar",
      bankAccountNumber: "00065300",
      bankIBAN: "11-13-16",
    },
  }).returning();

  const categoryData = [
    { name: "Dining Tables", sortOrder: 1 },
    { name: "Sofas", sortOrder: 2 },
    { name: "Beds", sortOrder: 3 },
    { name: "TV Stands", sortOrder: 4 },
    { name: "Wardrobes", sortOrder: 5 },
    { name: "Office Furniture", sortOrder: 6 },
    { name: "Outdoor", sortOrder: 7 },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categoryData) {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const [created] = await db.insert(furnitureCategories).values({ brandId: brand.id, name: cat.name, slug, sortOrder: cat.sortOrder }).returning();
    catMap[cat.name] = created.id;
  }

  const productData = [
    { name: "Milano Oak Extending Dining Table", categoryId: catMap["Dining Tables"], price: "899", wasPrice: "1199", description: "A beautiful extending dining table crafted from solid oak. Seats 6-8 people comfortably.", material: "Solid Oak Wood", color: "Natural Oak", dimensions: "160-200cm x 90cm x 76cm", weight: "45kg", specifications: "Extends from 160cm to 200cm\nSeats 6-8\nSelf-storing butterfly leaf\n2 year warranty", isFeatured: true, isOnSale: true, image1: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800", image2: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800" },
    { name: "Victoria Chesterfield 3 Seater Sofa", categoryId: catMap["Sofas"], price: "1299", wasPrice: "1699", description: "Luxurious Chesterfield sofa with deep button tufting and rolled arms. Upholstered in premium velvet fabric.", material: "Velvet Fabric, Solid Wood Frame", color: "Emerald Green", dimensions: "220cm x 90cm x 80cm", weight: "65kg", specifications: "Deep button tufting\nHigh density foam\nSolid hardwood frame\n5 year frame warranty", isFeatured: true, isOnSale: true, image1: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", image2: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800" },
    { name: "Royal Ambassador King Size Bed", categoryId: catMap["Beds"], price: "1499", description: "Stunning upholstered king size bed with a tall winged headboard. Includes solid slatted base.", material: "Crushed Velvet, Solid Wood", color: "Silver Grey", dimensions: "168cm x 220cm x 140cm", weight: "55kg", specifications: "King size (150x200cm mattress)\nSolid slatted base included\nEasy assembly\nMattress not included", isFeatured: true, isNew: true, image1: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800", image2: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800" },
    { name: "Manhattan High Gloss TV Stand 160cm", categoryId: catMap["TV Stands"], price: "449", wasPrice: "599", description: "Sleek modern TV stand with LED lighting and ample storage. Fits TVs up to 70 inches.", material: "High Gloss MDF", color: "White & Black", dimensions: "160cm x 40cm x 45cm", weight: "32kg", specifications: "LED lighting included\nCable management system\n2 drawers + 2 shelves\nSupports TVs up to 70in", isOnSale: true, image1: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800" },
    { name: "Berlin Sliding Door Wardrobe 250cm", categoryId: catMap["Wardrobes"], price: "1199", description: "Large sliding door wardrobe with mirror panels. Includes shelves, hanging rails and drawers.", material: "Laminated Board, Mirror Glass", color: "Walnut", dimensions: "250cm x 216cm x 61cm", weight: "120kg", specifications: "Full length mirror doors\n4 shelves + 2 hanging rails\nSoft-close mechanism\nProfessional assembly recommended", isNew: true, image1: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800" },
    { name: "Executive Corner Office Desk", categoryId: catMap["Office Furniture"], price: "549", wasPrice: "699", description: "L-shaped executive desk with cable management and built-in shelving.", material: "Engineered Wood, Steel Frame", color: "Oak & Black", dimensions: "160cm x 140cm x 75cm", weight: "38kg", specifications: "L-shaped design\nBuilt-in cable management\n3 shelves + 2 drawers\nAdjustable feet", isFeatured: true, isOnSale: true, image1: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800" },
    { name: "Scandinavian Round Dining Table", categoryId: catMap["Dining Tables"], price: "599", description: "Minimalist round dining table with solid beech wood legs. Seats 4 comfortably.", material: "Solid Beech Wood, MDF Top", color: "White & Natural", dimensions: "120cm diameter x 75cm", weight: "28kg", specifications: "Seats 4\nSolid wood legs\nEasy assembly\n1 year warranty", isNew: true, image1: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=800" },
    { name: "Cloud 9 Modular Corner Sofa", categoryId: catMap["Sofas"], price: "1899", wasPrice: "2499", description: "Ultra comfortable modular corner sofa with adjustable headrests and USB charging ports.", material: "Premium Fabric, Foam Filling", color: "Charcoal Grey", dimensions: "300cm x 200cm x 95cm", weight: "85kg", specifications: "Modular design - rearrangeable\nUSB charging ports\nAdjustable headrests\nRemovable covers", isFeatured: true, isOnSale: true, image1: "https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800" },
  ];

  for (const p of productData) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await db.insert(furnitureProducts).values({ ...p, brandId: brand.id, slug });
  }

  console.log("[ecommerce-seed] Furniture In Fashion brand seeded with categories & products.");
}
