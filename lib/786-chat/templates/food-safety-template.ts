import { FOOD_SAFETY_APP_PART_1 } from "./food-safety-app-part-1"
import { FOOD_SAFETY_APP_PART_2 } from "./food-safety-app-part-2"
import { FOOD_SAFETY_APP_PART_3 } from "./food-safety-app-part-3"
import { FOOD_SAFETY_APP_PART_4 } from "./food-safety-app-part-4"
import { FOOD_SAFETY_APP_PART_5 } from "./food-safety-app-part-5"
import { FOOD_SAFETY_APP_PART_6 } from "./food-safety-app-part-6"
import { FOOD_SAFETY_APP_PART_7 } from "./food-safety-app-part-7"
import { FOOD_SAFETY_CSS_PART_1 } from "./food-safety-css-part-1"
import { FOOD_SAFETY_CSS_PART_2 } from "./food-safety-css-part-2"
import { FOOD_SAFETY_CSS_PART_3 } from "./food-safety-css-part-3"
import { FOOD_SAFETY_COVER_SVG } from "./food-safety-cover"

export const FOOD_SAFETY_TEMPLATE_ID = "food-safety-record-book"
export const FOOD_SAFETY_TEMPLATE_VERSION = 2
export const FOOD_SAFETY_TEMPLATE_TITLE = "Raja Catering Food Safety Record Book"

const FOOD_SAFETY_APP_COMPONENT = [FOOD_SAFETY_APP_PART_1, FOOD_SAFETY_APP_PART_2, FOOD_SAFETY_APP_PART_3, FOOD_SAFETY_APP_PART_4, FOOD_SAFETY_APP_PART_5, FOOD_SAFETY_APP_PART_6, FOOD_SAFETY_APP_PART_7].join("")
const FOOD_SAFETY_APP_STYLES = [FOOD_SAFETY_CSS_PART_1, FOOD_SAFETY_CSS_PART_2, FOOD_SAFETY_CSS_PART_3].join("")

export function foodSafetyRecordBookFiles(): Record<string, string> {
  return {
    "app/page.tsx": "import FoodSafetyBook from \"@/components/food-safety-book\"\n\nexport default function Page() {\n  return <FoodSafetyBook />\n}\n",
    "app/layout.tsx": "import type { Metadata } from \"next\"\nimport \"./globals.css\"\n\nexport const metadata: Metadata = { title: \"Food Safety Record Book\", description: \"Reusable 26-week Production and Food Safety Record Book\" }\n\nexport default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang=\"en\"><body>{children}</body></html> }\n",
    "app/globals.css": FOOD_SAFETY_APP_STYLES,
    "components/food-safety-book.tsx": FOOD_SAFETY_APP_COMPONENT,
    "package.json": "{\n  \"name\": \"food-safety-record-book\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"scripts\": { \"dev\": \"next dev\", \"build\": \"next build\", \"start\": \"next start\" },\n  \"dependencies\": { \"next\": \"16.2.6\", \"react\": \"^19\", \"react-dom\": \"^19\" },\n  \"devDependencies\": { \"@types/node\": \"^22\", \"@types/react\": \"^19\", \"@types/react-dom\": \"^19\", \"typescript\": \"5.7.3\", \"tailwindcss\": \"^3.4.17\", \"postcss\": \"^8.4.49\", \"autoprefixer\": \"^10.4.20\" }\n}\n",
    "tsconfig.json": "{\n  \"compilerOptions\": { \"target\": \"ES2017\", \"lib\": [\"dom\", \"dom.iterable\", \"esnext\"], \"allowJs\": false, \"skipLibCheck\": true, \"strict\": true, \"noEmit\": true, \"esModuleInterop\": true, \"module\": \"esnext\", \"moduleResolution\": \"bundler\", \"resolveJsonModule\": true, \"isolatedModules\": true, \"jsx\": \"preserve\", \"incremental\": true, \"plugins\": [{ \"name\": \"next\" }], \"paths\": { \"@/*\": [\"./*\"] } },\n  \"include\": [\"next-env.d.ts\", \".next/types/**/*.ts\", \"**/*.ts\", \"**/*.tsx\"],\n  \"exclude\": [\"node_modules\"]\n}\n",
    "next-env.d.ts": "/// <reference types=\"next\" />\n/// <reference types=\"next/image-types/global\" />\n",
    "next.config.mjs": "/** @type {import('next').NextConfig} */\nconst nextConfig = {}\nexport default nextConfig\n",
    "postcss.config.mjs": "export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n",
    "tailwind.config.ts": "import type { Config } from 'tailwindcss'\n\nconst config: Config = {\n  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],\n  theme: { extend: {} },\n  plugins: [],\n}\n\nexport default config\n",
    "public/cover.svg": FOOD_SAFETY_COVER_SVG,
    "README.md": "# Food Safety Record Book\n\nReusable 197-page, 26-week food safety record book template.\n\nUse **Master Setup** to change the business, address, dates, staff, products, ingredients, allergens and temperature limits once. The complete book updates automatically.\n\nUse the 786.Chat Projects screen to duplicate this project for a new customer. For an existing customer, update the book start / assessment / review dates for the next six-month cycle.\n",
  }
}

export const FOOD_SAFETY_TEMPLATE_METADATA = {
  template_id: FOOD_SAFETY_TEMPLATE_ID, template_version: FOOD_SAFETY_TEMPLATE_VERSION, page_count: 197, week_count: 26, daily_page_count: 182,
  editable_master_fields: ["businessName","addressLine1","addressLine2","telephone","approvedBy","assessmentDate","reviewDate","bookStartDate","consultant","directorWorker","preparationStaff","storageStaff","haccpCompletedBy","products","ingredients","allergens","heatTarget","coolingTarget","coldRoomTarget","freezerTarget"],
  reuse: { new_customer: "Duplicate project, then change Master Setup.", renewal: "Keep customer settings and change book / assessment / review dates." },
} as const
