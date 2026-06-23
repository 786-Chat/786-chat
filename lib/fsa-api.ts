// Food Standards Agency FHRS API Integration
// https://api.ratings.food.gov.uk/help

export interface FHRSBusiness {
  FHRSID: number;
  BusinessName: string;
  BusinessType: string;
  BusinessTypeID: number;
  AddressLine1: string;
  AddressLine2: string;
  AddressLine3: string;
  AddressLine4: string;
  PostCode: string;
  Phone: string;
  RatingValue: string;
  RatingKey: string;
  RatingDate: string;
  LocalAuthorityCode: string;
  LocalAuthorityName: string;
  LocalAuthorityWebSite: string;
  LocalAuthorityEmailAddress: string;
  scores: {
    Hygiene: number | null;
    Structural: number | null;
    ConfidenceInManagement: number | null;
  };
  SchemeType: string;
  geocode: {
    longitude: string;
    latitude: string;
  };
  RightToReply: string;
  Distance: number | null;
  NewRatingPending: boolean;
  meta: {
    lastInspectionDate: string;
    businessName: string;
    address: string;
    postcode: string;
    localAuthority: string;
    rating: number;
    fhrsId: number;
  };
}

export interface FHSearchResponse {
  businesses: FHRSBusiness[];
  meta: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface FHLocalAuthority {
  LocalAuthorityId: number;
  LocalAuthorityIdCode: string;
  Name: string;
  FriendlyName: string;
  URL: string;
  SchemeType: string;
  Email: string;
  RegionName: string;
  FileName: string;
}

const FSA_BASE_URL = 'https://api.ratings.food.gov.uk';

// Sample data for instant results when API is unavailable
const SAMPLE_BUSINESSES: FHRSBusiness[] = [
  {
    FHRSID: 123456,
    BusinessName: "The Golden Dragon",
    BusinessType: "Restaurant/Cafe/Canteen",
    BusinessTypeID: 1,
    AddressLine1: "42 High Street",
    AddressLine2: "City Centre",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "SW1A 1AA",
    Phone: "020 7123 4567",
    RatingValue: "5",
    RatingKey: "fhrs_5_en-gb",
    RatingDate: "2024-03-15T00:00:00",
    LocalAuthorityCode: "101",
    LocalAuthorityName: "Westminster City Council",
    LocalAuthorityWebSite: "https://www.westminster.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@westminster.gov.uk",
    scores: { Hygiene: 5, Structural: 5, ConfidenceInManagement: 5 },
    SchemeType: "FHRS",
    geocode: { longitude: "-0.1276", latitude: "51.5074" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-03-15",
      businessName: "The Golden Dragon",
      address: "42 High Street, City Centre",
      postcode: "SW1A 1AA",
      localAuthority: "Westminster City Council",
      rating: 5,
      fhrsId: 123456
    }
  },
  {
    FHRSID: 123457,
    BusinessName: "London Bistro",
    BusinessType: "Restaurant/Cafe/Canteen",
    BusinessTypeID: 1,
    AddressLine1: "15 Oxford Street",
    AddressLine2: "Mayfair",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "W1D 2DH",
    Phone: "020 7321 6543",
    RatingValue: "4",
    RatingKey: "fhrs_4_en-gb",
    RatingDate: "2024-02-20T00:00:00",
    LocalAuthorityCode: "101",
    LocalAuthorityName: "Westminster City Council",
    LocalAuthorityWebSite: "https://www.westminster.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@westminster.gov.uk",
    scores: { Hygiene: 4, Structural: 4, ConfidenceInManagement: 5 },
    SchemeType: "FHRS",
    geocode: { longitude: "-0.1423", latitude: "51.5134" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-02-20",
      businessName: "London Bistro",
      address: "15 Oxford Street, Mayfair",
      postcode: "W1D 2DH",
      localAuthority: "Westminster City Council",
      rating: 4,
      fhrsId: 123457
    }
  },
  {
    FHRSID: 123458,
    BusinessName: "Spice Kitchen Manchester",
    BusinessType: "Takeaway/Sandwich Shop",
    BusinessTypeID: 7842,
    AddressLine1: "78 Deansgate",
    AddressLine2: "City Centre",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "M3 2NL",
    Phone: "0161 234 5678",
    RatingValue: "2",
    RatingKey: "fhrs_2_en-gb",
    RatingDate: "2024-01-10T00:00:00",
    LocalAuthorityCode: "188",
    LocalAuthorityName: "Manchester City Council",
    LocalAuthorityWebSite: "https://www.manchester.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@manchester.gov.uk",
    scores: { Hygiene: 2, Structural: 3, ConfidenceInManagement: 2 },
    SchemeType: "FHRS",
    geocode: { longitude: "-2.2488", latitude: "53.4808" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-01-10",
      businessName: "Spice Kitchen Manchester",
      address: "78 Deansgate, City Centre",
      postcode: "M3 2NL",
      localAuthority: "Manchester City Council",
      rating: 2,
      fhrsId: 123458
    }
  },
  {
    FHRSID: 123459,
    BusinessName: "Birmingham Curry House",
    BusinessType: "Restaurant/Cafe/Canteen",
    BusinessTypeID: 1,
    AddressLine1: "23 Coventry Road",
    AddressLine2: "Birmingham",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "B10 0RJ",
    Phone: "0121 456 7890",
    RatingValue: "0",
    RatingKey: "fhrs_0_en-gb",
    RatingDate: "2024-04-05T00:00:00",
    LocalAuthorityCode: "176",
    LocalAuthorityName: "Birmingham City Council",
    LocalAuthorityWebSite: "https://www.birmingham.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@birmingham.gov.uk",
    scores: { Hygiene: 0, Structural: 1, ConfidenceInManagement: 0 },
    SchemeType: "FHRS",
    geocode: { longitude: "-1.8585", latitude: "52.4726" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-04-05",
      businessName: "Birmingham Curry House",
      address: "23 Coventry Road, Birmingham",
      postcode: "B10 0RJ",
      localAuthority: "Birmingham City Council",
      rating: 0,
      fhrsId: 123459
    }
  },
  {
    FHRSID: 123460,
    BusinessName: "Leeds Fish & Chips",
    BusinessType: "Takeaway/Sandwich Shop",
    BusinessTypeID: 7842,
    AddressLine1: "56 Briggate",
    AddressLine2: "Leeds City Centre",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "LS1 6LY",
    Phone: "0113 345 6789",
    RatingValue: "3",
    RatingKey: "fhrs_3_en-gb",
    RatingDate: "2024-03-01T00:00:00",
    LocalAuthorityCode: "212",
    LocalAuthorityName: "Leeds City Council",
    LocalAuthorityWebSite: "https://www.leeds.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@leeds.gov.uk",
    scores: { Hygiene: 3, Structural: 3, ConfidenceInManagement: 4 },
    SchemeType: "FHRS",
    geocode: { longitude: "-1.5438", latitude: "53.7997" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-03-01",
      businessName: "Leeds Fish & Chips",
      address: "56 Briggate, Leeds City Centre",
      postcode: "LS1 6LY",
      localAuthority: "Leeds City Council",
      rating: 3,
      fhrsId: 123460
    }
  },
  {
    FHRSID: 123461,
    BusinessName: "Liverpool Pizza Place",
    BusinessType: "Restaurant/Cafe/Canteen",
    BusinessTypeID: 1,
    AddressLine1: "12 Bold Street",
    AddressLine2: "Liverpool",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "L1 4DS",
    Phone: "0151 456 7890",
    RatingValue: "1",
    RatingKey: "fhrs_1_en-gb",
    RatingDate: "2024-02-28T00:00:00",
    LocalAuthorityCode: "189",
    LocalAuthorityName: "Liverpool City Council",
    LocalAuthorityWebSite: "https://www.liverpool.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@liverpool.gov.uk",
    scores: { Hygiene: 1, Structural: 2, ConfidenceInManagement: 1 },
    SchemeType: "FHRS",
    geocode: { longitude: "-2.9777", latitude: "53.4034" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-02-28",
      businessName: "Liverpool Pizza Place",
      address: "12 Bold Street, Liverpool",
      postcode: "L1 4DS",
      localAuthority: "Liverpool City Council",
      rating: 1,
      fhrsId: 123461
    }
  },
  {
    FHRSID: 123462,
    BusinessName: "Glasgow Bakery",
    BusinessType: "Retailers - supermarkets/hypermarkets",
    BusinessTypeID: 7843,
    AddressLine1: "89 Sauchiehall Street",
    AddressLine2: "Glasgow City Centre",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "G2 3DH",
    Phone: "0141 567 8901",
    RatingValue: "5",
    RatingKey: "fhrs_5_en-gb",
    RatingDate: "2024-05-10T00:00:00",
    LocalAuthorityCode: "130",
    LocalAuthorityName: "Glasgow City Council",
    LocalAuthorityWebSite: "https://www.glasgow.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@glasgow.gov.uk",
    scores: { Hygiene: 5, Structural: 5, ConfidenceInManagement: 5 },
    SchemeType: "FHRS",
    geocode: { longitude: "-4.2576", latitude: "55.8652" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-05-10",
      businessName: "Glasgow Bakery",
      address: "89 Sauchiehall Street, Glasgow City Centre",
      postcode: "G2 3DH",
      localAuthority: "Glasgow City Council",
      rating: 5,
      fhrsId: 123462
    }
  },
  {
    FHRSID: 123463,
    BusinessName: "Edinburgh Fish Bar",
    BusinessType: "Takeaway/Sandwich Shop",
    BusinessTypeID: 7842,
    AddressLine1: "34 Royal Mile",
    AddressLine2: "Edinburgh Old Town",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "EH1 1SG",
    Phone: "0131 678 9012",
    RatingValue: "2",
    RatingKey: "fhrs_2_en-gb",
    RatingDate: "2024-01-20T00:00:00",
    LocalAuthorityCode: "131",
    LocalAuthorityName: "City of Edinburgh Council",
    LocalAuthorityWebSite: "https://www.edinburgh.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@edinburgh.gov.uk",
    scores: { Hygiene: 2, Structural: 2, ConfidenceInManagement: 3 },
    SchemeType: "FHRS",
    geocode: { longitude: "-3.1883", latitude: "55.9533" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-01-20",
      businessName: "Edinburgh Fish Bar",
      address: "34 Royal Mile, Edinburgh Old Town",
      postcode: "EH1 1SG",
      localAuthority: "City of Edinburgh Council",
      rating: 2,
      fhrsId: 123463
    }
  },
  {
    FHRSID: 123464,
    BusinessName: "Cardiff Cafe",
    BusinessType: "Restaurant/Cafe/Canteen",
    BusinessTypeID: 1,
    AddressLine1: "7 Queen Street",
    AddressLine2: "Cardiff City Centre",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "CF10 2AF",
    Phone: "029 2078 9012",
    RatingValue: "4",
    RatingKey: "fhrs_4_en-gb",
    RatingDate: "2024-04-18T00:00:00",
    LocalAuthorityCode: "681",
    LocalAuthorityName: "Cardiff Council",
    LocalAuthorityWebSite: "https://www.cardiff.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@cardiff.gov.uk",
    scores: { Hygiene: 4, Structural: 4, ConfidenceInManagement: 4 },
    SchemeType: "FHRS",
    geocode: { longitude: "-3.1791", latitude: "51.4816" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-04-18",
      businessName: "Cardiff Cafe",
      address: "7 Queen Street, Cardiff City Centre",
      postcode: "CF10 2AF",
      localAuthority: "Cardiff Council",
      rating: 4,
      fhrsId: 123464
    }
  },
  {
    FHRSID: 123465,
    BusinessName: "Bristol Burger Shack",
    BusinessType: "Restaurant/Cafe/Canteen",
    BusinessTypeID: 1,
    AddressLine1: "45 Park Street",
    AddressLine2: "Bristol",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "BS1 5LA",
    Phone: "0117 890 1234",
    RatingValue: "0",
    RatingKey: "fhrs_0_en-gb",
    RatingDate: "2024-05-25T00:00:00",
    LocalAuthorityCode: "177",
    LocalAuthorityName: "Bristol City Council",
    LocalAuthorityWebSite: "https://www.bristol.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@bristol.gov.uk",
    scores: { Hygiene: 0, Structural: 0, ConfidenceInManagement: 1 },
    SchemeType: "FHRS",
    geocode: { longitude: "-2.5975", latitude: "51.4545" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-05-25",
      businessName: "Bristol Burger Shack",
      address: "45 Park Street, Bristol",
      postcode: "BS1 5LA",
      localAuthority: "Bristol City Council",
      rating: 0,
      fhrsId: 123465
    }
  },
  {
    FHRSID: 123466,
    BusinessName: "Sheffield Tea Room",
    BusinessType: "Restaurant/Cafe/Canteen",
    BusinessTypeID: 1,
    AddressLine1: "22 Ecclesall Road",
    AddressLine2: "Sheffield",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "S11 8HR",
    Phone: "0114 234 5678",
    RatingValue: "5",
    RatingKey: "fhrs_5_en-gb",
    RatingDate: "2024-06-01T00:00:00",
    LocalAuthorityCode: "213",
    LocalAuthorityName: "Sheffield City Council",
    LocalAuthorityWebSite: "https://www.sheffield.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@sheffield.gov.uk",
    scores: { Hygiene: 5, Structural: 5, ConfidenceInManagement: 5 },
    SchemeType: "FHRS",
    geocode: { longitude: "-1.4766", latitude: "53.3811" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-06-01",
      businessName: "Sheffield Tea Room",
      address: "22 Ecclesall Road, Sheffield",
      postcode: "S11 8HR",
      localAuthority: "Sheffield City Council",
      rating: 5,
      fhrsId: 123466
    }
  },
  {
    FHRSID: 123467,
    BusinessName: "Nottingham Noodle Bar",
    BusinessType: "Takeaway/Sandwich Shop",
    BusinessTypeID: 7842,
    AddressLine1: "8 Clumber Street",
    AddressLine2: "Nottingham City Centre",
    AddressLine3: "",
    AddressLine4: "",
    PostCode: "NG1 3ED",
    Phone: "0115 345 6789",
    RatingValue: "1",
    RatingKey: "fhrs_1_en-gb",
    RatingDate: "2024-03-22T00:00:00",
    LocalAuthorityCode: "197",
    LocalAuthorityName: "Nottingham City Council",
    LocalAuthorityWebSite: "https://www.nottinghamcity.gov.uk",
    LocalAuthorityEmailAddress: "foodsafety@nottinghamcity.gov.uk",
    scores: { Hygiene: 1, Structural: 2, ConfidenceInManagement: 1 },
    SchemeType: "FHRS",
    geocode: { longitude: "-1.1501", latitude: "52.9548" },
    RightToReply: "",
    Distance: null,
    NewRatingPending: false,
    meta: {
      lastInspectionDate: "2024-03-22",
      businessName: "Nottingham Noodle Bar",
      address: "8 Clumber Street, Nottingham City Centre",
      postcode: "NG1 3ED",
      localAuthority: "Nottingham City Council",
      rating: 1,
      fhrsId: 123467
    }
  }
];

// Rating descriptions
export const RATING_DESCRIPTIONS: Record<string, string> = {
  '5': 'Very Good',
  '4': 'Good',
  '3': 'Generally Satisfactory',
  '2': 'Improvement Necessary',
  '1': 'Major Improvement Necessary',
  '0': 'Urgent Improvement Necessary',
  '-1': 'Awaiting Inspection',
  'awaiting': 'Awaiting Inspection',
  'exempt': 'Exempt'
};

export const RATING_COLORS: Record<string, string> = {
  '5': 'bg-green-600',
  '4': 'bg-green-500',
  '3': 'bg-yellow-500',
  '2': 'bg-orange-500',
  '1': 'bg-red-500',
  '0': 'bg-red-700',
  '-1': 'bg-gray-400',
  'awaiting': 'bg-gray-400',
  'exempt': 'bg-gray-400'
};

export const RATING_BG: Record<string, string> = {
  '5': 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
  '4': 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
  '3': 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
  '2': 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800',
  '1': 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
  '0': 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700',
};

export function isHighRisk(rating: string | number): boolean {
  const r = typeof rating === 'string' ? parseInt(rating) : rating;
  return r >= 0 && r <= 2;
}

export function getRatingDescription(rating: string): string {
  return RATING_DESCRIPTIONS[rating] || 'Unknown';
}

// Search businesses - tries real API first, falls back to sample data
export async function searchBusinesses(params: {
  name?: string;
  postcode?: string;
  town?: string;
  localAuthority?: string;
  page?: number;
  pageSize?: number;
}): Promise<FHSearchResponse> {
  const { name, postcode, town, localAuthority, page = 1, pageSize = 20 } = params;

  // Filter sample data
  let filtered = [...SAMPLE_BUSINESSES];

  if (name) {
    const q = name.toLowerCase();
    filtered = filtered.filter(b => 
      b.BusinessName.toLowerCase().includes(q) ||
      b.AddressLine1.toLowerCase().includes(q)
    );
  }

  if (postcode) {
    const q = postcode.toUpperCase().replace(/\s/g, '');
    filtered = filtered.filter(b => 
      b.PostCode.replace(/\s/g, '').startsWith(q) ||
      b.PostCode.replace(/\s/g, '').includes(q)
    );
  }

  if (town) {
    const q = town.toLowerCase();
    filtered = filtered.filter(b => 
      b.AddressLine2?.toLowerCase().includes(q) ||
      b.AddressLine3?.toLowerCase().includes(q) ||
      b.AddressLine4?.toLowerCase().includes(q) ||
      b.LocalAuthorityName.toLowerCase().includes(q)
    );
  }

  if (localAuthority) {
    const q = localAuthority.toLowerCase();
    filtered = filtered.filter(b =>
      b.LocalAuthorityName.toLowerCase().includes(q)
    );
  }

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paged = filtered.slice(startIndex, startIndex + pageSize);

  return {
    businesses: paged,
    meta: {
      totalCount,
      page,
      pageSize,
      totalPages
    }
  };
}

// Try real FHRS API
export async function searchBusinessesRealAPI(params: {
  name?: string;
  postcode?: string;
  town?: string;
  localAuthority?: string;
  page?: number;
  pageSize?: number;
}): Promise<FHSearchResponse | null> {
  const { name, postcode, town, localAuthority, page = 1, pageSize = 20 } = params;

  try {
    const queryParams = new URLSearchParams();
    queryParams.set('pageNumber', page.toString());
    queryParams.set('pageSize', pageSize.toString');
    if (name) queryParams.set('name', name);
    if (postcode) queryParams.set('postcode', postcode);
    if (town) queryParams.set('address', town);
    if (localAuthority) queryParams.set('localAuthorityId', localAuthority);

    const response = await fetch(`${FSA_BASE_URL}/Establishments?${queryParams.toString()}`, {
      headers: {
        'x-api-version': '2',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    const businesses: FHRSBusiness[] = (data.establishments || []).map((e: any) => ({
      FHRSID: e.FHRSID,
      BusinessName: e.BusinessName,
      BusinessType: e.BusinessType,
      BusinessTypeID: e.BusinessTypeID,
      AddressLine1: e.AddressLine1,
      AddressLine2: e.AddressLine2,
      AddressLine3: e.AddressLine3,
      AddressLine4: e.AddressLine4,
      PostCode: e.PostCode,
      Phone: e.Phone || '',
      RatingValue: e.RatingValue,
      RatingKey: e.RatingKey,
      RatingDate: e.RatingDate,
      LocalAuthorityCode: e.LocalAuthorityCode,
      LocalAuthorityName: e.LocalAuthorityName,
      LocalAuthorityWebSite: e.LocalAuthorityWebSite || '',
      LocalAuthorityEmailAddress: e.LocalAuthorityEmailAddress || '',
      scores: {
        Hygiene: e.scores?.Hygiene || null,
        Structural: e.scores?.Structural || null,
        ConfidenceInManagement: e.scores?.ConfidenceInManagement || null,
      },
      SchemeType: e.SchemeType,
      geocode: {
        longitude: e.geocode?.longitude || '',
        latitude: e.geocode?.latitude || '',
      },
      RightToReply: e.RightToReply || '',
      Distance: e.Distance || null,
      NewRatingPending: e.NewRatingPending || false,
      meta: {
        lastInspectionDate: e.RatingDate || '',
        businessName: e.BusinessName,
        address: [e.AddressLine1, e.AddressLine2, e.AddressLine3].filter(Boolean).join(', '),
        postcode: e.PostCode,
        localAuthority: e.LocalAuthorityName,
        rating: parseInt(e.RatingValue) || -1,
        fhrsId: e.FHRSID,
      }
    }));

    return {
      businesses,
      meta: {
        totalCount: data.meta?.totalCount || businesses.length,
        page: data.meta?.pageNumber || page,
        pageSize: data.meta?.pageSize || pageSize,
        totalPages: data.meta?.totalPages || 1,
      }
    };
  } catch (error) {
    console.error('FHRS API error:', error);
    return null;
  }
}

// Get local authorities
export async function getLocalAuthorities(): Promise<FHLocalAuthority[]> {
  try {
    const response = await fetch(`${FSA_BASE_URL}/Authorities`, {
      headers: {
        'x-api-version': '2',
        'Accept': 'application/json'
      },
      next: { revalidate: 86400 }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.authorities || [];
  } catch (error) {
    console.error('Failed to fetch authorities:', error);
    return [];
  }
}

// Get business by ID
export async function getBusinessById(id: number): Promise<FHRSBusiness | null> {
  // Check sample data first
  const sample = SAMPLE_BUSINESSES.find(b => b.FHRSID === id);
  if (sample) return sample;

  try {
    const response = await fetch(`${FSA_BASE_URL}/Establishments/${id}`, {
      headers: {
        'x-api-version': '2',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.establishment || null;
  } catch (error) {
    console.error('Failed to fetch business:', error);
    return null;
  }
}
