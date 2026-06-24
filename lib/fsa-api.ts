// Food Standards Agency FHRS API Integration
// Real API docs: https://api.ratings.food.gov.uk/help

export interface FHRSBusiness {
  FHRSID: number
  BusinessName: string
  BusinessType: string
  BusinessTypeID: number
  AddressLine1: string
  AddressLine2: string
  AddressLine3: string
  AddressLine4: string
  PostCode: string
  Phone: string
  RatingValue: string
  RatingKey: string
  RatingDate: string
  LocalAuthorityCode: string
  LocalAuthorityName: string
  LocalAuthorityWebSite: string
  LocalAuthorityEmailAddress: string
  scores: {
    Hygiene: number | null
    Structural: number | null
    ConfidenceInManagement: number | null
  }
  SchemeType: string
  geocode: {
    longitude: string
    latitude: string
  }
  RightToReply: string
  Distance: number | null
  NewRatingPending: boolean
  meta: {
    lastInspectionDate: string
    businessName: string
    address: string
    postcode: string
    localAuthority: string
    rating: number
    fhrsId: number
  }
}

export interface FHSearchResponse {
  businesses: FHRSBusiness[]
  meta: {
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface FHLocalAuthority {
  LocalAuthorityId: number
  LocalAuthorityIdCode: string
  Name: string
  FriendlyName: string
  URL: string
  SchemeType: string
  Email: string
  RegionName: string
  FileName: string
}

const FSA_BASE_URL = "https://api.ratings.food.gov.uk"

const SAMPLE_BUSINESSES: FHRSBusiness[] = [
  makeBusiness(123456, "The Golden Dragon", "42 High Street", "City Centre", "SW1A 1AA", "Westminster City Council", "5", "2024-03-15"),
  makeBusiness(123457, "London Bistro", "15 Oxford Street", "Mayfair", "W1D 2DH", "Westminster City Council", "4", "2024-02-20"),
  makeBusiness(123458, "Spice Kitchen Manchester", "78 Deansgate", "City Centre", "M3 2NL", "Manchester City Council", "2", "2024-01-10"),
  makeBusiness(123459, "Birmingham Curry House", "23 Coventry Road", "Birmingham", "B10 0RJ", "Birmingham City Council", "0", "2024-04-05"),
  makeBusiness(123460, "Leeds Fish & Chips", "56 Briggate", "Leeds City Centre", "LS1 6LY", "Leeds City Council", "3", "2024-03-01"),
  makeBusiness(123461, "Liverpool Pizza Place", "12 Bold Street", "Liverpool", "L1 4DS", "Liverpool City Council", "1", "2024-02-28"),
  makeBusiness(123462, "Glasgow Bakery", "89 Sauchiehall Street", "Glasgow City Centre", "G2 3DH", "Glasgow City Council", "5", "2024-05-10"),
  makeBusiness(123463, "Edinburgh Fish Bar", "34 Royal Mile", "Edinburgh Old Town", "EH1 1SG", "City of Edinburgh Council", "2", "2024-01-20"),
  makeBusiness(123464, "Cardiff Cafe", "7 Queen Street", "Cardiff City Centre", "CF10 2AF", "Cardiff Council", "4", "2024-04-18"),
  makeBusiness(123465, "Bristol Burger Shack", "45 Park Street", "Bristol", "BS1 5LA", "Bristol City Council", "0", "2024-05-25"),
  makeBusiness(123466, "Sheffield Tea Room", "22 Ecclesall Road", "Sheffield", "S11 8HR", "Sheffield City Council", "5", "2024-06-01"),
  makeBusiness(123467, "Nottingham Noodle Bar", "8 Clumber Street", "Nottingham City Centre", "NG1 3ED", "Nottingham City Council", "1", "2024-03-22"),
]

export const RATING_DESCRIPTIONS: Record<string, string> = {
  "5": "Very Good",
  "4": "Good",
  "3": "Generally Satisfactory",
  "2": "Improvement Necessary",
  "1": "Major Improvement Necessary",
  "0": "Urgent Improvement Necessary",
  "-1": "Awaiting Inspection",
  awaiting: "Awaiting Inspection",
  exempt: "Exempt",
}

export const RATING_COLORS: Record<string, string> = {
  "5": "bg-green-600",
  "4": "bg-green-500",
  "3": "bg-yellow-500",
  "2": "bg-orange-500",
  "1": "bg-red-500",
  "0": "bg-red-700",
  "-1": "bg-gray-400",
  awaiting: "bg-gray-400",
  exempt: "bg-gray-400",
}

export const RATING_BG: Record<string, string> = {
  "5": "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
  "4": "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
  "3": "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
  "2": "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
  "1": "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
  "0": "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700",
}

function makeBusiness(
  id: number,
  name: string,
  address1: string,
  address2: string,
  postcode: string,
  authority: string,
  rating: string,
  date: string
): FHRSBusiness {
  return {
    FHRSID: id,
    BusinessName: name,
    BusinessType: "Restaurant/Cafe/Canteen",
    BusinessTypeID: 1,
    AddressLine1: address1,
    AddressLine2: address2,
    AddressLine3: "",
    AddressLine4: "",
    PostCode: postcode,
    Phone: "",
    RatingValue: rating,
    RatingKey: `fhrs_${rating}_en-gb`,
    RatingDate: `${date}T00:00:00`,
    LocalAuthorityCode: String(id).slice(-3),
    LocalAuthorityName: authority,
    LocalAuthorityWebSite: "",
    LocalAuthorityEmailAddress: "",
    scores: {
      Hygiene: Number(rating),
      Structural: Number(rating),
      ConfidenceInManagement: Number(rating),
    },
    SchemeType: "FHRS",
    geocode: { longitude: "", latitude: "" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: date,
      businessName: name,
      address: [address1, address2].filter(Boolean).join(", "),
      postcode,
      localAuthority: authority,
      rating: Number(rating),
      fhrsId: id,
    },
  }
}

function mapApiBusiness(establishment: any): FHRSBusiness {
  const ratingValue = String(establishment.RatingValue ?? "-1")
  const ratingNumber = Number.parseInt(ratingValue, 10)
  const address = [
    establishment.AddressLine1,
    establishment.AddressLine2,
    establishment.AddressLine3,
    establishment.AddressLine4,
  ].filter(Boolean)

  return {
    FHRSID: Number(establishment.FHRSID),
    BusinessName: String(establishment.BusinessName || "Unknown business"),
    BusinessType: String(establishment.BusinessType || ""),
    BusinessTypeID: Number(establishment.BusinessTypeID || 0),
    AddressLine1: String(establishment.AddressLine1 || ""),
    AddressLine2: String(establishment.AddressLine2 || ""),
    AddressLine3: String(establishment.AddressLine3 || ""),
    AddressLine4: String(establishment.AddressLine4 || ""),
    PostCode: String(establishment.PostCode || ""),
    Phone: String(establishment.Phone || ""),
    RatingValue: ratingValue,
    RatingKey: String(establishment.RatingKey || ""),
    RatingDate: String(establishment.RatingDate || ""),
    LocalAuthorityCode: String(establishment.LocalAuthorityCode || ""),
    LocalAuthorityName: String(establishment.LocalAuthorityName || ""),
    LocalAuthorityWebSite: String(establishment.LocalAuthorityWebSite || ""),
    LocalAuthorityEmailAddress: String(establishment.LocalAuthorityEmailAddress || ""),
    scores: {
      Hygiene: establishment.scores?.Hygiene ?? null,
      Structural: establishment.scores?.Structural ?? null,
      ConfidenceInManagement: establishment.scores?.ConfidenceInManagement ?? null,
    },
    SchemeType: String(establishment.SchemeType || "FHRS"),
    geocode: {
      longitude: String(establishment.geocode?.longitude || ""),
      latitude: String(establishment.geocode?.latitude || ""),
    },
    RightToReply: String(establishment.RightToReply || ""),
    Distance: establishment.Distance ?? null,
    NewRatingPending: Boolean(establishment.NewRatingPending),
    meta: {
      lastInspectionDate: String(establishment.RatingDate || ""),
      businessName: String(establishment.BusinessName || "Unknown business"),
      address: address.join(", "),
      postcode: String(establishment.PostCode || ""),
      localAuthority: String(establishment.LocalAuthorityName || ""),
      rating: Number.isFinite(ratingNumber) ? ratingNumber : -1,
      fhrsId: Number(establishment.FHRSID),
    },
  }
}

export function isHighRisk(rating: string | number): boolean {
  const ratingNumber = typeof rating === "string" ? Number.parseInt(rating, 10) : rating
  return ratingNumber >= 0 && ratingNumber <= 2
}

export function getRatingDescription(rating: string): string {
  return RATING_DESCRIPTIONS[rating] || "Unknown"
}

export async function searchBusinesses(params: {
  name?: string
  postcode?: string
  town?: string
  localAuthority?: string
  page?: number
  pageSize?: number
}): Promise<FHSearchResponse> {
  const { name, postcode, town, localAuthority, page = 1, pageSize = 20 } = params
  let filtered = [...SAMPLE_BUSINESSES]

  if (name) {
    const query = name.toLowerCase()
    filtered = filtered.filter((business) =>
      business.BusinessName.toLowerCase().includes(query) ||
      business.AddressLine1.toLowerCase().includes(query)
    )
  }

  if (postcode) {
    const query = postcode.toUpperCase().replace(/\s/g, "")
    filtered = filtered.filter((business) =>
      business.PostCode.replace(/\s/g, "").toUpperCase().includes(query)
    )
  }

  if (town) {
    const query = town.toLowerCase()
    filtered = filtered.filter((business) =>
      business.AddressLine2.toLowerCase().includes(query) ||
      business.AddressLine3.toLowerCase().includes(query) ||
      business.AddressLine4.toLowerCase().includes(query) ||
      business.LocalAuthorityName.toLowerCase().includes(query)
    )
  }

  if (localAuthority) {
    const query = localAuthority.toLowerCase()
    filtered = filtered.filter((business) => business.LocalAuthorityName.toLowerCase().includes(query))
  }

  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const startIndex = (page - 1) * pageSize

  return {
    businesses: filtered.slice(startIndex, startIndex + pageSize),
    meta: { totalCount, page, pageSize, totalPages },
  }
}

export async function searchBusinessesRealAPI(params: {
  name?: string
  postcode?: string
  town?: string
  localAuthority?: string
  page?: number
  pageSize?: number
}): Promise<FHSearchResponse | null> {
  const { name, postcode, town, localAuthority, page = 1, pageSize = 20 } = params

  try {
    const queryParams = new URLSearchParams()
    queryParams.set("pageNumber", page.toString())
    queryParams.set("pageSize", pageSize.toString())
    if (name) queryParams.set("name", name)
    if (postcode) queryParams.set("postcode", postcode)
    if (town) queryParams.set("address", town)
    if (localAuthority) queryParams.set("localAuthorityId", localAuthority)

    const response = await fetch(`${FSA_BASE_URL}/Establishments?${queryParams.toString()}`, {
      headers: {
        "x-api-version": "2",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) return null

    const data = await response.json()
    const businesses = (data.establishments || []).map(mapApiBusiness)

    return {
      businesses,
      meta: {
        totalCount: data.meta?.totalCount || businesses.length,
        page: data.meta?.pageNumber || page,
        pageSize: data.meta?.pageSize || pageSize,
        totalPages: data.meta?.totalPages || 1,
      },
    }
  } catch (error) {
    console.error("FHRS API error:", error)
    return null
  }
}

export async function getLocalAuthorities(): Promise<FHLocalAuthority[]> {
  try {
    const response = await fetch(`${FSA_BASE_URL}/Authorities`, {
      headers: {
        "x-api-version": "2",
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) return []
    const data = await response.json()
    return data.authorities || []
  } catch (error) {
    console.error("Failed to fetch authorities:", error)
    return []
  }
}

export async function getBusinessById(id: number): Promise<FHRSBusiness | null> {
  const sample = SAMPLE_BUSINESSES.find((business) => business.FHRSID === id)
  if (sample) return sample

  try {
    const response = await fetch(`${FSA_BASE_URL}/Establishments/${id}`, {
      headers: {
        "x-api-version": "2",
        Accept: "application/json",
      },
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.establishment ? mapApiBusiness(data.establishment) : null
  } catch (error) {
    console.error("Failed to fetch business:", error)
    return null
  }
}
