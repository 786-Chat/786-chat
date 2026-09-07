"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type ProductType = "kulfi" | "cooked"

type Product = {
  id: string
  name: string
  type: ProductType
  ingredients: string
  allergens: string
}

type Settings = {
  businessName: string
  addressLine1: string
  addressLine2: string
  telephone: string
  approvedBy: string
  consultant: string
  directorWorker: string
  preparationStaff: string
  storageStaff: string
  haccpCompletedBy: string
  assessmentDate: string
  reviewDate: string
  bookStartDate: string
  heatTarget: string
  coolingTarget: string
  coolingTimeTarget: string
  coldRoomTarget: string
  freezerTarget: string
  defaultIngredients: string
  defaultAllergens: string
  products: Product[]
}

type HaccpRow = {
  hazard: string
  control: string
  monitoring: string
  action: string
  hygiene: string
}

type HaccpSection = {
  title: string
  description: string
  rows: HaccpRow[]
}

const STORAGE_KEY = "786-food-safety-record-book-v1"
const TOTAL_PAGES = 197
const FRONT_MATTER_PAGES = 14
const DAILY_PAGE_COUNT = 182

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "malai-kulfi",
    name: "Malai Kulfi",
    type: "kulfi",
    ingredients: "Milk, Cream, Sugar, Condensed Milk, Almond, Nuts",
    allergens: "Milk, Nuts",
  },
  {
    id: "mango-kulfi",
    name: "Mango Kulfi",
    type: "kulfi",
    ingredients: "Milk, Cream, Sugar, Condensed Milk, Almond, Nuts",
    allergens: "Milk, Nuts",
  },
  {
    id: "pista-kulfi",
    name: "Pista Kulfi",
    type: "kulfi",
    ingredients: "Milk, Cream, Sugar, Condensed Milk, Almond, Nuts",
    allergens: "Milk, Nuts",
  },
  { id: "pav-bhaji", name: "Pav Bhaji", type: "cooked", ingredients: "", allergens: "" },
  { id: "wada-pav", name: "Wada Pav", type: "cooked", ingredients: "", allergens: "" },
  { id: "vegetable-samosa", name: "Vegetable Samosa", type: "cooked", ingredients: "", allergens: "" },
  { id: "aloo-tikki", name: "Aloo Tikki", type: "cooked", ingredients: "", allergens: "" },
  { id: "meat-kebab-roll", name: "Meat Kebab Roll", type: "cooked", ingredients: "", allergens: "" },
  { id: "onion-bhaji", name: "Onion Bhaji", type: "cooked", ingredients: "", allergens: "" },
]

const DEFAULT_SETTINGS: Settings = {
  businessName: "Raja Catering",
  addressLine1: "Rear of 297 Green Street",
  addressLine2: "London: E13 9AR",
  telephone: "0800 4714 726",
  approvedBy: "Mujeeb Sardar",
  consultant: "Mujeeb Sardar",
  directorWorker: "Raja Muhammad Tayyab",
  preparationStaff: "Shamraiz",
  storageStaff: "Sonbar",
  haccpCompletedBy: "Shamraiz Khan",
  assessmentDate: "2026-08-29",
  reviewDate: "2027-08-29",
  bookStartDate: "2026-08-24",
  heatTarget: "85°C or above",
  coolingTarget: "below 8°C",
  coolingTimeTarget: "within 90 minutes",
  coldRoomTarget: "+2°C to +5°C",
  freezerTarget: "-18°C",
  defaultIngredients: "Milk, Cream, Sugar, Condensed Milk, Almond, Nuts",
  defaultAllergens: "Milk, Nuts",
  products: DEFAULT_PRODUCTS,
}

const ALLERGEN_COLUMNS = [
  "Celery",
  "Cereals containing gluten",
  "Crustaceans",
  "Eggs",
  "Fish",
  "Lupin",
  "Milk",
  "Molluscs",
  "Mustard",
  "Nuts",
  "Peanuts",
  "Sesame seeds",
  "Soya",
  "Sulphur dioxide",
]

const HACCP_SECTIONS: HaccpSection[] = [
  {
    title: "Cooling - Kulfi Ice Cream",
    description: "Cooling",
    rows: [
      {
        hazard: "Bacterial multiplication during slow cooling down from boiling / pasteurisation temperatures.",
        control: "Cool the hot Kulfi base promptly from cooking temperature to the approved chilled limit. Use the daily production record to verify actual time and temperature.",
        monitoring: "Use clean, sanitised cooling equipment. Record cooling start time, start temperature, final time and final temperature.",
        action: "Dispose of any food that has taken too long to cool or cannot be shown to have met the approved cooling control.",
        hygiene: "Temperature-control and cleaning procedures must be followed.",
      },
      {
        hazard: "Cross-contamination during cooling.",
        control: "Cover food and use clean containers and utensils. Keep raw foods away from cooling ready-to-eat product.",
        monitoring: "Visual checks and staff supervision.",
        action: "Reject or dispose of contaminated food. Review staff handling and training.",
        hygiene: "Cross-contamination prevention and staff hygiene procedures must be followed.",
      },
    ],
  },
  {
    title: "Packaging - Kulfi Ice Cream",
    description: "Packaging",
    rows: [
      {
        hazard: "Bacterial contamination or multiplication during packaging and sleeving.",
        control: "Use clean food-contact surfaces and clean sleeves / packaging. Keep product protected during sleeving and packing.",
        monitoring: "Visual checks of packaging area, product condition, labels, dates and handling practices.",
        action: "Dispose of food that may have become unsafe or contaminated. Correct the packaging or handling problem before continuing.",
        hygiene: "Cleaning, temperature control and safe handling procedures must be followed.",
      },
      {
        hazard: "Incorrect ingredient or allergen declaration; cross-contamination from other foods.",
        control: "Declare ingredients and allergens clearly. Use packaging large enough to protect the entire product and keep different foods separated.",
        monitoring: "Check product name, batch, allergen declaration and use-by / best-before information.",
        action: "Hold affected stock. Correct labels before release. Reject contaminated product and review staff training.",
        hygiene: "Cross-contamination prevention and staff hygiene procedures must be followed.",
      },
    ],
  },
  {
    title: "Milk Reduction & Boiling - Kulfi Ice Cream",
    description: "Milk Reduction and Boiling",
    rows: [
      {
        hazard: "Survival of harmful bacteria or toxin production if milk is held too long at unsafe temperatures.",
        control: "Maintain the approved heat treatment during milk reduction. The daily production record uses the master heat-treatment target shown in this book.",
        monitoring: "Record actual measured heating time and temperature. Check date codes and ingredient condition.",
        action: "Continue heating until the approved target is achieved. Dispose of food if safety cannot be verified.",
        hygiene: "Heat-treatment, temperature-control and cleaning procedures must be followed.",
      },
      {
        hazard: "Cross-contamination between raw ingredients and cooked / ready-to-eat product.",
        control: "Keep raw ingredients apart from cooked / ready-to-eat foods. Use clean utensils and preparation surfaces.",
        monitoring: "Observe staff practices and separation of equipment and food.",
        action: "Dispose of contaminated food. Review equipment controls and staff training.",
        hygiene: "Training, contamination prevention and general hygiene rules must be followed.",
      },
      {
        hazard: "Contamination from fruit, vegetables or other added ingredients.",
        control: "Wash produce as required and inspect added ingredients for damage, pests or contamination.",
        monitoring: "Visual inspection of ingredients and staff preparation practices.",
        action: "Dispose of unsafe ingredients or product and review preparation controls.",
        hygiene: "Preparation and contamination-control procedures must be followed.",
      },
    ],
  },
  {
    title: "Receiving - Kulfi Ice Cream",
    description: "Receiving",
    rows: [
      {
        hazard: "Biological, physical or chemical contamination in milk, cream, reduced milk solids, dry ingredients or packaging.",
        control: "Use approved suppliers. Check chilled, frozen and dry ingredients are delivered in acceptable condition and within the approved temperature limits.",
        monitoring: "Check delivery temperature where required, packaging condition, date codes, supplier, batch / lot number and signs of pests or damage.",
        action: "Reject non-compliant deliveries, out-of-date food, damaged packaging or food that cannot be shown to have remained safe.",
        hygiene: "Receiving, temperature-control and stock-control procedures must be followed.",
      },
      {
        hazard: "Cross-contamination during delivery or collection.",
        control: "Keep raw and ready-to-eat foods separated and protected.",
        monitoring: "Observe separation, delivery vehicle cleanliness and handling practices.",
        action: "Reject food that may be contaminated. Review supplier / delivery methods and staff training.",
        hygiene: "Cross-contamination prevention and safe handling procedures must be followed.",
      },
    ],
  },
  {
    title: "Pasteurising / Cooking - Kulfi Ice Cream",
    description: "Cooking",
    rows: [
      {
        hazard: "Survival of harmful bacteria after ingredients are combined.",
        control: "Heat the complete product to the approved validated heat-treatment target. Raja Catering defaults to the master target shown in this book.",
        monitoring: "Check the temperature with a clean probe and record actual time and temperature on the daily production sheet.",
        action: "Continue heating until the approved target is achieved. If the process cannot be verified, hold or dispose of the food.",
        hygiene: "Cooking-time, probe hygiene and temperature-control procedures must be followed.",
      },
      {
        hazard: "Cross-contamination after cooking.",
        control: "Use clean utensils, containers and food-contact surfaces. Protect cooked product from raw foods.",
        monitoring: "Observe staff practices and equipment cleanliness.",
        action: "Dispose of contaminated food and review staff training.",
        hygiene: "Cleaning and contamination-prevention procedures must be followed.",
      },
    ],
  },
  {
    title: "Preparation of Food",
    description: "Preparation of Food",
    rows: [
      {
        hazard: "Presence and growth of harmful bacteria / spoilage in raw, cooked or ready-to-eat food.",
        control: "Check date codes and minimise the time food is outside temperature control.",
        monitoring: "Check date codes and observe food preparation practices.",
        action: "Dispose of unsafe or out-of-date food.",
        hygiene: "Temperature-control and cleaning procedures must be followed.",
      },
      {
        hazard: "Cross-contamination from raw foods to cooked / ready-to-eat foods.",
        control: "Keep raw food apart from cooked / ready-to-eat food. Use dedicated clean utensils and colour-coded boards where used.",
        monitoring: "Observe staff practices.",
        action: "Dispose of contaminated food and review staff training / equipment.",
        hygiene: "Contamination-prevention and general hygiene rules must be followed.",
      },
      {
        hazard: "Contamination from vegetables, salads or fruit.",
        control: "Wash produce as required and check for pests or spoilage.",
        monitoring: "Observe staff practices.",
        action: "Dispose of unsafe food and review training.",
        hygiene: "Preparation and contamination-control procedures must be followed.",
      },
      {
        hazard: "Cross-contamination - all foods.",
        control: "Clean and sanitise work areas between different foods and follow personal hygiene rules.",
        monitoring: "Observe staff practices.",
        action: "Dispose of unsafe food and review training.",
        hygiene: "Cleaning, hand-washing and general hygiene rules must be followed.",
      },
    ],
  },
  {
    title: "Storage",
    description: "Storage",
    rows: [
      {
        hazard: "Presence and growth of harmful bacteria - frozen storage.",
        control: "Maintain the master frozen-storage target shown in this book.",
        monitoring: "Check and record freezer temperature daily.",
        action: "Assess stock and equipment whenever the approved limit is not met. Dispose of unsafe food and repair malfunctioning equipment.",
        hygiene: "Temperature-control checks must be completed.",
      },
      {
        hazard: "Presence and growth of harmful bacteria - refrigerated / cold-room storage.",
        control: "Maintain the master cold-room / chilled target shown in this book.",
        monitoring: "Check and record refrigerator / cold-room temperature daily.",
        action: "Assess condition of stock whenever the approved limit is not met and dispose of unsafe food.",
        hygiene: "Temperature-control checks must be completed.",
      },
      {
        hazard: "Presence and growth of harmful bacteria - dry storage.",
        control: "Keep storage clean, dry, ventilated and protected from pests. Keep stock off the floor.",
        monitoring: "Visual inspection of storage areas and stock rotation.",
        action: "Dispose of unsafe or contaminated stock and correct storage problems.",
        hygiene: "Storage-separation and cleaning procedures must be followed.",
      },
      {
        hazard: "Cross-contamination from raw to cooked / ready-to-eat foods.",
        control: "Keep raw and ready-to-eat foods separated and protected.",
        monitoring: "Observe separation, storage and handling practices.",
        action: "Reject contaminated food and review staff training.",
        hygiene: "Storage and safe-handling procedures must be followed.",
      },
    ],
  },
  {
    title: "Defrosting",
    description: "Defrosting",
    rows: [
      {
        hazard: "Presence and growth of harmful bacteria / spoilage.",
        control: "Follow the manufacturer or approved site shelf life. Use food within the stated shelf-life period.",
        monitoring: "Complete stock-control checks and record date codes.",
        action: "Dispose of out-of-date food.",
        hygiene: "FIFO stock rotation must be followed.",
      },
      {
        hazard: "Presence and growth of harmful bacteria during defrosting.",
        control: "Defrost under controlled refrigeration, not at room temperature. Keep food covered and use within the approved shelf life.",
        monitoring: "Check chiller temperature, defrost date and use-by date.",
        action: "Dispose of mishandled or unsafe food and correct the temperature-control problem.",
        hygiene: "Temperature-control and stock-rotation procedures must be followed.",
      },
    ],
  },
  {
    title: "General Environment",
    description: "General Environment",
    rows: [
      {
        hazard: "Physical contamination from metal, wood and glass.",
        control: "Minimise unnecessary breakable or loose items in food areas.",
        monitoring: "Visual inspection and incident reporting.",
        action: "Dispose of contaminated food and inform management.",
        hygiene: "Glass-breakage and physical-contamination procedures must be followed.",
      },
      {
        hazard: "Physical contamination from pests.",
        control: "Maintain pest-control measures and keep food protected.",
        monitoring: "Visual checks and pest-control records.",
        action: "Dispose of contaminated food and report infestation.",
        hygiene: "Pest-control and storage procedures must be followed.",
      },
      {
        hazard: "Contamination from hair.",
        control: "Follow food-preparation area hygiene rules.",
        monitoring: "Visual staff checks.",
        action: "Dispose of contaminated food and correct staff practice.",
        hygiene: "Long hair must be tied back and suitable head covering used where required.",
      },
      {
        hazard: "Contamination from cleaning chemicals.",
        control: "Use approved chemicals and store them away from food.",
        monitoring: "Visual inspection and incident reporting.",
        action: "Dispose of contaminated food and correct chemical storage / use.",
        hygiene: "Cleaning-chemical and rinse procedures must be followed.",
      },
      {
        hazard: "Physical contamination from blood / cuts.",
        control: "Use food-grade waterproof dressings and follow first-aid rules.",
        monitoring: "Visual inspection.",
        action: "Dispose of contaminated food and clean affected areas.",
        hygiene: "Cuts must be reported and first-aid procedures followed.",
      },
      {
        hazard: "Physical contamination from dust and dirt.",
        control: "Follow the cleaning schedule and clean-as-you-go procedures.",
        monitoring: "Visual checks and daily cleaning records.",
        action: "Carry out a full clean-down and review procedures.",
        hygiene: "Work surfaces and equipment must be cleaned and sanitised after use.",
      },
    ],
  },
  {
    title: "Purchase, Delivery & Collection",
    description: "Purchase, Delivery and Collection",
    rows: [
      {
        hazard: "Presence and growth of harmful bacteria in chilled and frozen food.",
        control: "Use approved suppliers, check date codes, maintain temperature control and protect food during transport.",
        monitoring: "Check delivery temperature, packaging, dates and condition.",
        action: "Reject non-compliant or out-of-date food and review the supplier if needed.",
        hygiene: "Temperature-control, stock-control and delivery-record procedures must be followed.",
      },
      {
        hazard: "Cross-contamination from raw to cooked / ready-to-eat foods.",
        control: "Keep raw and ready-to-eat food separate and protected during transport.",
        monitoring: "Observe separation and handling practices.",
        action: "Reject contaminated food and review staff / delivery methods.",
        hygiene: "Cross-contamination procedures and records must be followed.",
      },
      {
        hazard: "Other contamination from dirty delivery / collection vehicles.",
        control: "Use clean vehicles and keep food covered / protected.",
        monitoring: "Visual checks of vehicle cleanliness and collection practices.",
        action: "Reject contaminated food and review delivery methods.",
        hygiene: "Training and contamination-prevention rules must be followed.",
      },
    ],
  },
]

function cloneDefaults(): Settings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as Settings
}

function safeDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return new Date(Date.UTC(2026, 7, 24))
  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(value: string, days: number) {
  const date = safeDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return date
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function displayDate(value: string | Date) {
  const date = typeof value === "string" ? safeDate(value) : value
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function displayDay(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date)
}

function normaliseAllergens(value: string) {
  return value
    .split(/[,\n;]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function includesAllergen(product: Product, allergen: string) {
  const current = normaliseAllergens(product.allergens)
  const needle = allergen.toLowerCase()
  if (needle === "nuts") {
    return current.some((item) => item === "nuts" || item.includes("almond") || item.includes("pistach"))
  }
  if (needle === "milk") return current.some((item) => item === "milk" || item.includes("dairy"))
  return current.some((item) => item === needle || item.includes(needle) || needle.includes(item))
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  hint?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function PageShell({
  settings,
  pageNumber,
  children,
  landscape = false,
  title,
}: {
  settings: Settings
  pageNumber: number
  children: React.ReactNode
  landscape?: boolean
  title?: string
}) {
  return (
    <section className={`book-page ${landscape ? "landscape" : "portrait"}`}>
      <div className="page-watermark">FS</div>
      <header className="page-header">
        <strong>{settings.businessName}</strong>
        <span>{title || "Production & Food Safety Record Book"}</span>
      </header>
      <div className="page-body">{children}</div>
      <footer className="page-footer">
        <span>Controlled food safety record - complete in ink and retain with site records.</span>
        <strong>{pageNumber}</strong>
      </footer>
    </section>
  )
}

function CoverPage({ settings }: { settings: Settings }) {
  return (
    <section className="book-page portrait cover-page">
      <img className="cover-art" src="/cover.svg" alt="" />
      <div className="cover-business-mask">
        <div className="cover-crown">♛</div>
        <div className="cover-business-name">{settings.businessName}</div>
      </div>
      <div className="cover-bottom-mask">
        <div>Approved By: <strong>{settings.approvedBy}</strong></div>
        <div className="cover-phone-label">Telephone</div>
        <div className="cover-phone">{settings.telephone}</div>
        <small>Freephone — free from all UK mobiles & landlines</small>
      </div>
      <div className="cover-page-number">Page 1 of {TOTAL_PAGES}</div>
    </section>
  )
}

function TeamPage({ settings }: { settings: Settings }) {
  return (
    <PageShell settings={settings} pageNumber={2} title="HACCP Team">
      <div className="team-page">
        <div className="team-brand">THE HACCP TEAM</div>
        <div className="team-box">
          <strong>{settings.consultant || "Consultant"}</strong>
          <span>CONSULTANT</span>
        </div>
        <div className="team-arrow">↓</div>
        <div className="team-box">
          <strong>{settings.directorWorker || "Director / Worker"}</strong>
          <span>DIRECTOR - WORKER</span>
        </div>
        <div className="team-arrow">↓</div>
        <div className="team-branches">
          <div className="team-box small">
            <strong>{settings.preparationStaff || "Preparation Staff"}</strong>
            <span>PREPARATION & COOKING</span>
          </div>
          <div className="team-box small">
            <strong>{settings.storageStaff || "Storage Staff"}</strong>
            <span>STORAGE & WASH-UP AREA</span>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function HaccpPage({
  settings,
  pageNumber,
  section,
}: {
  settings: Settings
  pageNumber: number
  section: HaccpSection
}) {
  return (
    <PageShell settings={settings} pageNumber={pageNumber} landscape title="HACCP Assessment Sheet">
      <div className="haccp-top">
        <div>
          <b>Assessment Area:</b> {section.title}
        </div>
        <div>
          <b>Address:</b> {settings.addressLine1}, {settings.addressLine2}
        </div>
      </div>
      <div className="haccp-meta">
        <span><b>Description</b><em>{section.description}</em></span>
        <span><b>Completed By</b><em>{settings.haccpCompletedBy}</em></span>
        <span><b>Approved By</b><em>{settings.approvedBy}</em></span>
        <span><b>Date of Assessment</b><em>{displayDate(settings.assessmentDate)}</em></span>
        <span><b>Review Date</b><em>{displayDate(settings.reviewDate)}</em></span>
      </div>
      <table className="haccp-table">
        <thead>
          <tr>
            <th>HAZARDS</th>
            <th>CONTROL MEASURES</th>
            <th>MONITORING AND RECORDING</th>
            <th>VERIFICATION AND CORRECTIVE ACTION</th>
            <th>HYGIENE RULES TO COMPLY WITH</th>
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row, index) => (
            <tr key={`${section.title}-${index}`}>
              <td>{row.hazard}</td>
              <td>{row.control}</td>
              <td>{row.monitoring}</td>
              <td>{row.action}</td>
              <td>{row.hygiene}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="haccp-signoff">
        <span>Approved By: <b>{settings.approvedBy}</b></span>
        <span>Telephone: <b>{settings.telephone}</b></span>
      </div>
    </PageShell>
  )
}

function AllergenPage({ settings }: { settings: Settings }) {
  return (
    <PageShell settings={settings} pageNumber={13} landscape title="Dishes & Their Allergen Content">
      <div className="allergen-intro">
        Marked automatically from the product allergens in Master Setup. Always verify against the current approved recipe and supplier labels.
      </div>
      <table className="allergen-table">
        <thead>
          <tr>
            <th className="product-head">DISH / PRODUCT</th>
            {ALLERGEN_COLUMNS.map((allergen) => <th key={allergen}>{allergen}</th>)}
          </tr>
        </thead>
        <tbody>
          {settings.products.map((product) => (
            <tr key={product.id}>
              <td className="product-name-cell">{product.name}</td>
              {ALLERGEN_COLUMNS.map((allergen) => (
                <td key={allergen}>{includesAllergen(product, allergen) ? "X" : ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="allergen-footer">
        <span>Assessment Date: <b>{displayDate(settings.assessmentDate)}</b></span>
        <span>Reviewed By: __________________________</span>
        <span>Review Date: <b>{displayDate(settings.reviewDate)}</b></span>
      </div>
    </PageShell>
  )
}

function ProcessFlowPage({ settings }: { settings: Settings }) {
  const steps = [
    ["1", "Ingredients", "Approved ingredients / raw materials"],
    ["2", "Mixing", "Record mixing start time and start temperature"],
    ["3", "Heat Treatment", `Actual measured temperature and time recorded. Heat to ${settings.heatTarget}.`],
    ["4", "Cooling", `Cool to ${settings.coolingTarget} before freezer transfer. Target ${settings.coolingTimeTarget}.`],
    ["5", "Freezing / Hardening", "Transfer promptly to freezer / hardening storage"],
    ["6", "Packaging & Labelling", "Correct product, allergen, batch, date and use-by label"],
    ["7", "Frozen Storage", `Freezer / equipment storage target: ${settings.freezerTarget}`],
  ]
  return (
    <PageShell settings={settings} pageNumber={14} title="Kulfi Process Flow">
      <div className="flow-title">
        <h2>Kulfi Process Flow Diagram</h2>
        <p>Use with the daily Production record for actual measured temperatures and times.</p>
      </div>
      <div className="flow-list">
        {steps.map(([number, title, description], index) => (
          <div key={number}>
            <div className={`flow-step c${number}`}>
              <span>{number}</span>
              <div><b>{title}</b><small>{description}</small></div>
            </div>
            {index < steps.length - 1 ? <div className="flow-arrow">↓</div> : null}
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function BlankLine({ label, wide = false }: { label: string; wide?: boolean }) {
  return <div className={`blank-line ${wide ? "wide" : ""}`}><b>{label}</b><span /></div>
}

function DailyPage({
  settings,
  dayIndex,
}: {
  settings: Settings
  dayIndex: number
}) {
  const date = addDays(settings.bookStartDate, dayIndex)
  const week = Math.floor(dayIndex / 7) + 1
  const pageNumber = FRONT_MATTER_PAGES + dayIndex + 1
  const kulfi = settings.products.filter((product) => product.type === "kulfi")
  const cooked = settings.products.filter((product) => product.type === "cooked")

  return (
    <PageShell
      settings={settings}
      pageNumber={pageNumber}
      title={`Week ${String(week).padStart(2, "0")} · ${displayDay(date)} ${displayDate(date)}`}
    >
      <div className="daily-title-row">
        <div>
          <h2>Daily Production Sheet</h2>
          <p>Week {String(week).padStart(2, "0")} · {displayDay(date)}</p>
        </div>
        <div className="date-card">
          <span>Production Date</span>
          <strong>{displayDate(date)}</strong>
        </div>
      </div>

      <section className="record-section ingredients-section">
        <h3><span>1</span> Product & Ingredients</h3>
        <div className="kulfi-options">
          {kulfi.map((product) => (
            <label key={product.id}>□ {product.name}</label>
          ))}
        </div>
        <div className="fixed-line"><b>Ingredients</b><span>{settings.defaultIngredients}</span></div>
        <div className="fixed-line"><b>Allergens</b><span>{settings.defaultAllergens}</span></div>
        <div className="cooked-grid">
          {cooked.map((product) => (
            <div className="cooked-item" key={product.id}>
              <b>□ {product.name}</b>
              <span>Cook Date: ____ / ____ / ______</span>
              <span>Use By Date: ____ / ____ / ______</span>
            </div>
          ))}
        </div>
      </section>

      <section className="record-section">
        <h3><span>2</span> Mixing</h3>
        <div className="four-grid">
          <BlankLine label="Start Time" />
          <BlankLine label="Finish Time" />
          <BlankLine label="Start Temperature (°C)" />
          <BlankLine label="Batch Number" />
        </div>
      </section>

      <section className="record-section heat">
        <h3><span>3</span> Heat Treatment <em>Critical target: {settings.heatTarget}</em></h3>
        <div className="four-grid">
          <BlankLine label="Heat Temperature (°C)" />
          <BlankLine label="Heat Time" />
          <BlankLine label="Checked By" />
          <BlankLine label="Result / Action" />
        </div>
      </section>

      <section className="record-section cooling">
        <h3><span>4</span> Cooling <em>Target: {settings.coolingTarget}; {settings.coolingTimeTarget}</em></h3>
        <div className="four-grid">
          <BlankLine label="Cooling Start Time" />
          <BlankLine label="Start Temperature (°C)" />
          <BlankLine label="Cooling Final Time" />
          <BlankLine label="Final Temperature (°C)" />
        </div>
        <div className="cold-room-row">
          <b>Cold Room Used?</b> □ YES □ NO
          <span>Product Stored: __________________</span>
          <span>Time In: ______</span>
          <span>Actual Temp: ______ °C</span>
          <span>Use By: ____ / ____ / ______</span>
          <strong>Target {settings.coldRoomTarget}</strong>
        </div>
      </section>

      <section className="record-section">
        <h3><span>5</span> Freezing / Hardening</h3>
        <div className="four-grid">
          <BlankLine label="Transfer Time" />
          <BlankLine label="Freezer / Equipment" />
          <BlankLine label="Storage Temperature (°C)" />
          <BlankLine label="Checked By" />
        </div>
      </section>

      <section className="record-section">
        <h3><span>6</span> Packaging & Labelling</h3>
        <div className="four-grid">
          <BlankLine label="Packaging Type" />
          <BlankLine label="Net Weight" />
          <BlankLine label="Use By Date" />
          <BlankLine label="Label OK? YES / NO" />
        </div>
      </section>

      <section className="record-section frozen">
        <h3><span>7</span> Frozen Storage <em>Target: {settings.freezerTarget}</em></h3>
        <div className="four-grid">
          <BlankLine label="Storage Location" />
          <BlankLine label="Storage In Date" />
          <BlankLine label="Actual Temperature (°C)" />
          <BlankLine label="Operator / Initials" />
        </div>
      </section>

      <div className="daily-signoff">
        <BlankLine label="Daily record completed by" wide />
        <BlankLine label="Signature / initials" wide />
        <BlankLine label="Time" />
      </div>
    </PageShell>
  )
}

function GuidancePage({ settings }: { settings: Settings }) {
  const instructions = [
    "Complete records in ink on the day of production.",
    "Tick the correct product boxes and write actual batch information.",
    "Record ingredients and allergens clearly and keep product information current.",
    `Heat treatment target: ${settings.heatTarget}. Record actual measured time and temperature.`,
    `Cooling target: ${settings.coolingTarget} and ${settings.coolingTimeTarget}.`,
    `Cold-room target: ${settings.coldRoomTarget}.`,
    `Frozen storage target: ${settings.freezerTarget}.`,
    "Record corrective action whenever a food-safety limit is not met.",
    "Keep completed records with site food-safety documents.",
  ]
  return (
    <PageShell settings={settings} pageNumber={197} title="Instructions & Final Guidance">
      <div className="guidance">
        <h2>Instructions & Final Guidance</h2>
        <p>How to complete this Production & Food Safety Record Book</p>
        <div className="guidance-grid">
          {instructions.map((item, index) => (
            <div className="guidance-card" key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
        <div className="guidance-flow">
          <h3>Kulfi Process Flow</h3>
          <div>Ingredients → Mixing → Heat Treatment → Cooling → Freezing / Hardening → Packaging & Labelling → Frozen Storage</div>
        </div>
        <div className="guidance-signoff">
          <b>Approved By: {settings.approvedBy}</b>
          <span>Telephone: {settings.telephone}</span>
          <small>{settings.businessName} · {settings.addressLine1} · {settings.addressLine2}</small>
        </div>
      </div>
    </PageShell>
  )
}

function pageName(page: number) {
  if (page === 1) return "Cover"
  if (page === 2) return "HACCP Team"
  if (page >= 3 && page <= 12) return HACCP_SECTIONS[page - 3]?.title || "HACCP"
  if (page === 13) return "Allergen Matrix"
  if (page === 14) return "Process Flow"
  if (page >= 15 && page <= 196) return `Daily Production ${page - 14}`
  return "Final Guidance"
}

function renderBookPage(settings: Settings, page: number) {
  if (page === 1) return <CoverPage settings={settings} />
  if (page === 2) return <TeamPage settings={settings} />
  if (page >= 3 && page <= 12) {
    return <HaccpPage settings={settings} pageNumber={page} section={HACCP_SECTIONS[page - 3]} />
  }
  if (page === 13) return <AllergenPage settings={settings} />
  if (page === 14) return <ProcessFlowPage settings={settings} />
  if (page >= 15 && page <= 196) return <DailyPage settings={settings} dayIndex={page - 15} />
  return <GuidancePage settings={settings} />
}

function SettingsPanel({
  settings,
  setSettings,
  onImport,
  onExport,
  onReset,
  onPrint,
  importRef,
}: {
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
  onReset: () => void
  onPrint: () => void
  importRef: React.RefObject<HTMLInputElement | null>
}) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setSettings((current) => ({
      ...current,
      products: current.products.map((product) => product.id === id ? { ...product, ...patch } : product),
    }))
  }

  const removeProduct = (id: string) => {
    setSettings((current) => ({ ...current, products: current.products.filter((product) => product.id !== id) }))
  }

  const addProduct = () => {
    const id = `product-${Date.now()}`
    setSettings((current) => ({
      ...current,
      products: [...current.products, { id, name: "New Product", type: "cooked", ingredients: "", allergens: "" }],
    }))
  }

  return (
    <aside className="settings-panel no-print">
      <div className="settings-heading">
        <div>
          <span className="eyebrow">MASTER SETUP</span>
          <h2>Food Safety Book Settings</h2>
          <p>Change a master value once and the whole 197-page book updates.</p>
        </div>
        <button className="primary" onClick={onPrint}>Print / Save PDF</button>
      </div>

      <details open>
        <summary>Business details</summary>
        <div className="settings-grid">
          <Field label="Business Name" value={settings.businessName} onChange={(value) => update("businessName", value)} />
          <Field label="Telephone" value={settings.telephone} onChange={(value) => update("telephone", value)} />
          <Field label="Address Line 1" value={settings.addressLine1} onChange={(value) => update("addressLine1", value)} />
          <Field label="Address Line 2 / Postcode" value={settings.addressLine2} onChange={(value) => update("addressLine2", value)} />
          <Field label="Approved By" value={settings.approvedBy} onChange={(value) => update("approvedBy", value)} />
          <Field label="HACCP Completed By" value={settings.haccpCompletedBy} onChange={(value) => update("haccpCompletedBy", value)} />
        </div>
      </details>

      <details open>
        <summary>Global dates — one change updates every HACCP page</summary>
        <div className="settings-grid">
          <Field label="Assessment Date" type="date" value={settings.assessmentDate} onChange={(value) => update("assessmentDate", value)} hint="Used on all HACCP assessment sheets." />
          <Field label="Review Date" type="date" value={settings.reviewDate} onChange={(value) => update("reviewDate", value)} hint="Used on all HACCP review fields." />
          <Field label="First Monday of 26-week book" type="date" value={settings.bookStartDate} onChange={(value) => update("bookStartDate", value)} hint="Automatically regenerates all 182 daily dates." />
          <label className="global-date-check"><input type="checkbox" checked readOnly /> Apply these dates across the complete book</label>
        </div>
      </details>

      <details>
        <summary>Staff & HACCP team</summary>
        <div className="settings-grid">
          <Field label="Consultant" value={settings.consultant} onChange={(value) => update("consultant", value)} />
          <Field label="Director / Worker" value={settings.directorWorker} onChange={(value) => update("directorWorker", value)} />
          <Field label="Preparation & Cooking" value={settings.preparationStaff} onChange={(value) => update("preparationStaff", value)} />
          <Field label="Storage & Wash-up" value={settings.storageStaff} onChange={(value) => update("storageStaff", value)} />
        </div>
      </details>

      <details>
        <summary>Food-safety limits</summary>
        <div className="settings-grid">
          <Field label="Heat Treatment" value={settings.heatTarget} onChange={(value) => update("heatTarget", value)} />
          <Field label="Cooling Final Target" value={settings.coolingTarget} onChange={(value) => update("coolingTarget", value)} />
          <Field label="Cooling Time Target" value={settings.coolingTimeTarget} onChange={(value) => update("coolingTimeTarget", value)} />
          <Field label="Cold Room Target" value={settings.coldRoomTarget} onChange={(value) => update("coldRoomTarget", value)} />
          <Field label="Frozen Storage Target" value={settings.freezerTarget} onChange={(value) => update("freezerTarget", value)} />
          <Field label="Production Ingredients Line" value={settings.defaultIngredients} onChange={(value) => update("defaultIngredients", value)} />
          <Field label="Production Allergens Line" value={settings.defaultAllergens} onChange={(value) => update("defaultAllergens", value)} />
        </div>
      </details>

      <details>
        <summary>Products, ingredients & allergens</summary>
        <div className="product-editor-list">
          {settings.products.map((product) => (
            <div className="product-editor" key={product.id}>
              <div className="product-editor-top">
                <input value={product.name} onChange={(event) => updateProduct(product.id, { name: event.target.value })} />
                <select value={product.type} onChange={(event) => updateProduct(product.id, { type: event.target.value as ProductType })}>
                  <option value="kulfi">Kulfi checkbox row</option>
                  <option value="cooked">Cooked product + date row</option>
                </select>
                <button className="danger" type="button" onClick={() => removeProduct(product.id)}>Remove</button>
              </div>
              <label>
                Ingredients
                <textarea value={product.ingredients} onChange={(event) => updateProduct(product.id, { ingredients: event.target.value })} />
              </label>
              <label>
                Allergens
                <input value={product.allergens} onChange={(event) => updateProduct(product.id, { allergens: event.target.value })} placeholder="e.g. Milk, Nuts, Gluten" />
              </label>
            </div>
          ))}
          <button className="secondary" type="button" onClick={addProduct}>+ Add Product</button>
        </div>
      </details>

      <div className="settings-actions">
        <button className="secondary" type="button" onClick={onExport}>Export Setup</button>
        <button className="secondary" type="button" onClick={() => importRef.current?.click()}>Import Setup</button>
        <input ref={importRef} className="hidden-input" type="file" accept="application/json" onChange={onImport} />
        <button className="danger" type="button" onClick={onReset}>Restore Raja Catering Defaults</button>
      </div>

      <div className="template-note">
        <b>New customer:</b> duplicate this project from the 786.Chat Projects screen, then change Business details, staff, dates and products here.
        <br />
        <b>Same customer after six months:</b> keep their details and only change the First Monday / assessment / review dates.
      </div>
    </aside>
  )
}

export default function FoodSafetyBook() {
  const [settings, setSettings] = useState<Settings>(() => cloneDefaults())
  const [hydrated, setHydrated] = useState(false)
  const [selectedPage, setSelectedPage] = useState(1)
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [searchPage, setSearchPage] = useState("1")
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Settings>
        setSettings({
          ...cloneDefaults(),
          ...parsed,
          products: Array.isArray(parsed.products) ? parsed.products : DEFAULT_PRODUCTS,
        })
      }
    } catch {
      // Ignore malformed local data and keep safe defaults.
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [hydrated, settings])

  const dailyEnd = useMemo(() => addDays(settings.bookStartDate, DAILY_PAGE_COUNT - 1), [settings.bookStartDate])

  function exportSetup() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${settings.businessName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "food-safety"}-book-setup.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function importSetup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}")) as Partial<Settings>
        setSettings({
          ...cloneDefaults(),
          ...parsed,
          products: Array.isArray(parsed.products) ? parsed.products : DEFAULT_PRODUCTS,
        })
      } catch {
        window.alert("That setup file could not be read.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  function restoreDefaults() {
    if (!window.confirm("Restore the original Raja Catering template settings?")) return
    setSettings(cloneDefaults())
  }

  function printBook() {
    window.print()
  }

  function jumpToPage() {
    const page = Math.max(1, Math.min(TOTAL_PAGES, Number.parseInt(searchPage, 10) || 1))
    setSelectedPage(page)
    setSearchPage(String(page))
  }

  return (
    <main className="app-shell">
      <div className="workspace no-print">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">786.CHAT REUSABLE TEMPLATE</span>
            <h1>{settings.businessName} · Food Safety Record Book</h1>
            <p>
              197-page master book · 26 weeks · {displayDate(settings.bookStartDate)} to {displayDate(dailyEnd)}
            </p>
          </div>
          <div className="header-actions">
            <button className="secondary" type="button" onClick={() => setSettingsOpen((value) => !value)}>
              {settingsOpen ? "Hide Master Setup" : "Show Master Setup"}
            </button>
            <button className="primary" type="button" onClick={printBook}>Print / Save PDF</button>
          </div>
        </header>

        {settingsOpen ? (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            onImport={importSetup}
            onExport={exportSetup}
            onReset={restoreDefaults}
            onPrint={printBook}
            importRef={importRef}
          />
        ) : null}

        <section className="preview-toolbar">
          <button type="button" onClick={() => setSelectedPage((page) => Math.max(1, page - 1))}>← Previous</button>
          <label>
            Page
            <input
              value={searchPage}
              onChange={(event) => setSearchPage(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") jumpToPage() }}
            />
            of {TOTAL_PAGES}
          </label>
          <button type="button" onClick={jumpToPage}>Go</button>
          <button type="button" onClick={() => {
            const page = Math.min(TOTAL_PAGES, selectedPage + 1)
            setSelectedPage(page)
            setSearchPage(String(page))
          }}>Next →</button>
          <span>{pageName(selectedPage)}</span>
        </section>
      </div>

      <section className="single-preview no-print">
        {renderBookPage(settings, selectedPage)}
      </section>

      <section className="print-book" aria-hidden="true">
        {Array.from({ length: TOTAL_PAGES }, (_, index) => (
          <div key={index + 1}>{renderBookPage(settings, index + 1)}</div>
        ))}
      </section>
    </main>
  )
}
