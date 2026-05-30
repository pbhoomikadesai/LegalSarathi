// ─── Types ───────────────────────────────────────────────────────────────────

export type LawyerCategory =
  | "Property"
  | "Criminal"
  | "Family"
  | "Labour"
  | "Consumer"
  | "Women"
  | "Startup"
  | "RTI";

export interface Lawyer {
  id: string;
  name: string;
  specialisations: string[];
  categories: LawyerCategory[];
  fee: number;
  city: string;
  area?: string;
  rating: number;
  reviews: number;
  languages: string[];
  availability: "today" | "tomorrow";
  bio: string;
  barId: string;
  initials: string;
  distanceKm: number;
}

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export interface SlotInfo { time: string; booked?: boolean }

export const DAY_SLOTS: Record<DayKey, SlotInfo[]> = {
  Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
};

// ─── City registry ────────────────────────────────────────────────────────────
// Lawrato slug → display label
export const CITIES: Record<string, string> = {
  "bangalore":  "Bengaluru",
  "mumbai":     "Mumbai",
  "delhi":      "Delhi",
  "hyderabad":  "Hyderabad",
  "chennai":    "Chennai",
  "kolkata":    "Kolkata",
  "pune":       "Pune",
  "ahmedabad":  "Ahmedabad",
  "jaipur":     "Jaipur",
  "lucknow":    "Lucknow",
  "chandigarh": "Chandigarh",
  "kochi":      "Kochi",
};

// ─── Category registry ────────────────────────────────────────────────────────
export interface CategoryMeta {
  label: string;
  slug: string;
  vakilSlug: string;
  icon: string;
  description: string;
}

export const CATEGORY_META: Record<LawyerCategory, CategoryMeta> = {
  Criminal:  { label: "Criminal",        slug: "criminal-lawyer",         vakilSlug: "criminal",   icon: "⚖️", description: "Bail, FIR, arrest, cyber crime" },
  Property:  { label: "Property",        slug: "property-lawyer",         vakilSlug: "property",   icon: "🏠", description: "Dispute, registration, rent" },
  Family:    { label: "Family",          slug: "family-lawyer",           vakilSlug: "family",     icon: "👨‍👩‍👧", description: "Divorce, custody, alimony" },
  Labour:    { label: "Labour",          slug: "labour-lawyer",           vakilSlug: "labour",     icon: "🏭", description: "Wrongful termination, PF, ESI" },
  Consumer:  { label: "Consumer",        slug: "consumer-court-lawyer",   vakilSlug: "consumer",   icon: "🛒", description: "Defective product, refund, fraud" },
  Women:     { label: "Women's Rights",  slug: "women-rights-lawyer",     vakilSlug: "women",      icon: "♀️", description: "Domestic violence, harassment, POCSO" },
  Startup:   { label: "Startup & Corp.", slug: "corporate-lawyer",        vakilSlug: "corporate",  icon: "🚀", description: "Contracts, IP, fundraising" },
  RTI:       { label: "RTI",             slug: "rti-lawyer",              vakilSlug: "rti",        icon: "📋", description: "RTI applications, PILs" },
};

// ─── Deep-link builders ───────────────────────────────────────────────────────

export function buildLawratoUrl(citySlug: string, category?: LawyerCategory | null): string {
  const base = "https://lawrato.com/lawyers";
  if (category) return `${base}/${citySlug}/${CATEGORY_META[category].slug}`;
  return `${base}/${citySlug}`;
}

export function buildVakilSearchUrl(citySlug: string, category?: LawyerCategory | null): string {
  const city = citySlug === "bangalore" ? "bengaluru" : citySlug;
  const base = `https://vakilsearch.com/lawyers/${city}`;
  if (category) return `${base}?practice_area=${CATEGORY_META[category].vakilSlug}`;
  return base;
}

// ─── Lawyer cards ─────────────────────────────────────────────────────────────

export interface LawyerCard {
  id: string;
  citySlug: string;
  category: LawyerCategory;
  displayCity: string;
  ratingRange: string;
  lawyerCount: string;
  avgFee: string;
  highlight: string;
  icon: string;
}

export const LAWYER_CARDS: LawyerCard[] = [
  // Bengaluru
  { id: "blr-crim",  citySlug: "bangalore",  category: "Criminal",  displayCity: "Bengaluru", ratingRange: "4.1 – 4.9", lawyerCount: "200+", avgFee: "₹1,000 – ₹5,000",  highlight: "FIR quashing, bail, cyber crime specialists", icon: "⚖️" },
  { id: "blr-prop",  citySlug: "bangalore",  category: "Property",  displayCity: "Bengaluru", ratingRange: "4.0 – 4.8", lawyerCount: "180+", avgFee: "₹800 – ₹3,500",   highlight: "BBMP disputes, registration, rental agreements", icon: "🏠" },
  { id: "blr-fam",   citySlug: "bangalore",  category: "Family",    displayCity: "Bengaluru", ratingRange: "4.2 – 4.9", lawyerCount: "150+", avgFee: "₹700 – ₹3,000",   highlight: "Mutual divorce, child custody, NRI family law", icon: "👨‍👩‍👧" },
  { id: "blr-lab",   citySlug: "bangalore",  category: "Labour",    displayCity: "Bengaluru", ratingRange: "4.0 – 4.7", lawyerCount: "90+",  avgFee: "₹500 – ₹2,500",   highlight: "IT sector layoffs, PF disputes, offer letter fraud", icon: "🏭" },
  { id: "blr-cons",  citySlug: "bangalore",  category: "Consumer",  displayCity: "Bengaluru", ratingRange: "4.1 – 4.8", lawyerCount: "110+", avgFee: "₹500 – ₹2,000",   highlight: "E-commerce refunds, builder delays, insurance fraud", icon: "🛒" },
  { id: "blr-wom",   citySlug: "bangalore",  category: "Women",     displayCity: "Bengaluru", ratingRange: "4.3 – 5.0", lawyerCount: "80+",  avgFee: "₹500 – ₹2,000",   highlight: "Domestic violence, workplace harassment, POCSO", icon: "♀️" },
  { id: "blr-corp",  citySlug: "bangalore",  category: "Startup",   displayCity: "Bengaluru", ratingRange: "4.2 – 4.9", lawyerCount: "160+", avgFee: "₹1,500 – ₹8,000", highlight: "DPIIT startup contracts, term sheets, IP protection", icon: "🚀" },
  { id: "blr-rti",   citySlug: "bangalore",  category: "RTI",       displayCity: "Bengaluru", ratingRange: "4.0 – 4.7", lawyerCount: "50+",  avgFee: "₹300 – ₹1,500",   highlight: "BBMP/BMRCL RTI applications, PILs", icon: "📋" },
  // Mumbai
  { id: "mum-crim",  citySlug: "mumbai",     category: "Criminal",  displayCity: "Mumbai",    ratingRange: "4.2 – 4.9", lawyerCount: "300+", avgFee: "₹1,500 – ₹8,000", highlight: "High Court bail, economic offences, NDPS", icon: "⚖️" },
  { id: "mum-prop",  citySlug: "mumbai",     category: "Property",  displayCity: "Mumbai",    ratingRange: "4.1 – 4.8", lawyerCount: "250+", avgFee: "₹1,000 – ₹6,000", highlight: "Tenancy, RERA, redevelopment, slum rehab disputes", icon: "🏠" },
  { id: "mum-fam",   citySlug: "mumbai",     category: "Family",    displayCity: "Mumbai",    ratingRange: "4.2 – 4.9", lawyerCount: "200+", avgFee: "₹800 – ₹4,000",   highlight: "Family court, HUF, NRI matrimonial disputes", icon: "👨‍👩‍👧" },
  { id: "mum-lab",   citySlug: "mumbai",     category: "Labour",    displayCity: "Mumbai",    ratingRange: "4.0 – 4.8", lawyerCount: "130+", avgFee: "₹700 – ₹3,500",   highlight: "Termination, gratuity, industrial tribunal", icon: "🏭" },
  { id: "mum-cons",  citySlug: "mumbai",     category: "Consumer",  displayCity: "Mumbai",    ratingRange: "4.1 – 4.8", lawyerCount: "160+", avgFee: "₹600 – ₹3,000",   highlight: "Builder fraud, insurance disputes, RERA complaints", icon: "🛒" },
  { id: "mum-wom",   citySlug: "mumbai",     category: "Women",     displayCity: "Mumbai",    ratingRange: "4.3 – 5.0", lawyerCount: "100+", avgFee: "₹500 – ₹2,500",   highlight: "Domestic violence, maintenance, stalking cases", icon: "♀️" },
  { id: "mum-corp",  citySlug: "mumbai",     category: "Startup",   displayCity: "Mumbai",    ratingRange: "4.3 – 5.0", lawyerCount: "220+", avgFee: "₹2,000 – ₹12,000","highlight": "SEBI, Bombay HC, M&A, foreign investment docs", icon: "🚀" },
  { id: "mum-rti",   citySlug: "mumbai",     category: "RTI",       displayCity: "Mumbai",    ratingRange: "4.1 – 4.7", lawyerCount: "60+",  avgFee: "₹400 – ₹2,000",   highlight: "BMC RTI, PILs, Bombay High Court writ petitions", icon: "📋" },
  // Delhi
  { id: "del-crim",  citySlug: "delhi",      category: "Criminal",  displayCity: "Delhi",     ratingRange: "4.2 – 4.9", lawyerCount: "400+", avgFee: "₹1,000 – ₹6,000", highlight: "Tis Hazari, Saket court bail & trial lawyers", icon: "⚖️" },
  { id: "del-prop",  citySlug: "delhi",      category: "Property",  displayCity: "Delhi",     ratingRange: "4.0 – 4.8", lawyerCount: "300+", avgFee: "₹800 – ₹4,000",   highlight: "DDA flats, registry, land acquisition disputes", icon: "🏠" },
  { id: "del-fam",   citySlug: "delhi",      category: "Family",    displayCity: "Delhi",     ratingRange: "4.2 – 5.0", lawyerCount: "250+", avgFee: "₹700 – ₹3,500",   highlight: "Family court, guardianship, succession", icon: "👨‍👩‍👧" },
  { id: "del-lab",   citySlug: "delhi",      category: "Labour",    displayCity: "Delhi",     ratingRange: "4.0 – 4.7", lawyerCount: "140+", avgFee: "₹600 – ₹3,000",   highlight: "Central govt disputes, ESI, PF tribunal", icon: "🏭" },
  { id: "del-cons",  citySlug: "delhi",      category: "Consumer",  displayCity: "Delhi",     ratingRange: "4.1 – 4.8", lawyerCount: "180+", avgFee: "₹500 – ₹2,500",   highlight: "National Consumer Forum, e-commerce fraud", icon: "🛒" },
  { id: "del-wom",   citySlug: "delhi",      category: "Women",     displayCity: "Delhi",     ratingRange: "4.4 – 5.0", lawyerCount: "120+", avgFee: "₹500 – ₹2,000",   highlight: "Delhi Commission for Women cases, Protection Orders", icon: "♀️" },
  { id: "del-corp",  citySlug: "delhi",      category: "Startup",   displayCity: "Delhi",     ratingRange: "4.2 – 4.9", lawyerCount: "200+", avgFee: "₹1,500 – ₹10,000","highlight": "NCLT, Startup India, trademark registration", icon: "🚀" },
  { id: "del-rti",   citySlug: "delhi",      category: "RTI",       displayCity: "Delhi",     ratingRange: "4.1 – 4.8", lawyerCount: "70+",  avgFee: "₹300 – ₹1,800",   highlight: "CIC appeals, Delhi HC writ petitions, PILs", icon: "📋" },
  // Hyderabad
  { id: "hyd-crim",  citySlug: "hyderabad",  category: "Criminal",  displayCity: "Hyderabad", ratingRange: "4.0 – 4.8", lawyerCount: "180+", avgFee: "₹800 – ₹4,000",   highlight: "Cyberabad cybercrime, Nampally sessions court", icon: "⚖️" },
  { id: "hyd-prop",  citySlug: "hyderabad",  category: "Property",  displayCity: "Hyderabad", ratingRange: "4.0 – 4.7", lawyerCount: "160+", avgFee: "₹700 – ₹3,500",   highlight: "HMDA, RERA, Hyderabad metro land disputes", icon: "🏠" },
  { id: "hyd-fam",   citySlug: "hyderabad",  category: "Family",    displayCity: "Hyderabad", ratingRange: "4.1 – 4.9", lawyerCount: "130+", avgFee: "₹600 – ₹2,800",   highlight: "Family court, divorce, succession certificates", icon: "👨‍👩‍👧" },
  { id: "hyd-cons",  citySlug: "hyderabad",  category: "Consumer",  displayCity: "Hyderabad", ratingRange: "4.0 – 4.7", lawyerCount: "90+",  avgFee: "₹500 – ₹2,000",   highlight: "TSRERA, e-commerce, builder complaints", icon: "🛒" },
  { id: "hyd-corp",  citySlug: "hyderabad",  category: "Startup",   displayCity: "Hyderabad", ratingRange: "4.1 – 4.8", lawyerCount: "140+", avgFee: "₹1,200 – ₹7,000", highlight: "IT/ITES contracts, STPI, angel & VC deals", icon: "🚀" },
  // Chennai
  { id: "che-crim",  citySlug: "chennai",    category: "Criminal",  displayCity: "Chennai",   ratingRange: "4.1 – 4.8", lawyerCount: "160+", avgFee: "₹800 – ₹4,500",   highlight: "Madras HC, sessions court, economic offences", icon: "⚖️" },
  { id: "che-prop",  citySlug: "chennai",    category: "Property",  displayCity: "Chennai",   ratingRange: "4.0 – 4.7", lawyerCount: "150+", avgFee: "₹700 – ₹3,000",   highlight: "CMDA, patta, encroachment, TNRERA disputes", icon: "🏠" },
  { id: "che-fam",   citySlug: "chennai",    category: "Family",    displayCity: "Chennai",   ratingRange: "4.2 – 4.9", lawyerCount: "110+", avgFee: "₹600 – ₹2,500",   highlight: "Hindu succession, NRI divorce, child custody", icon: "👨‍👩‍👧" },
  { id: "che-wom",   citySlug: "chennai",    category: "Women",     displayCity: "Chennai",   ratingRange: "4.3 – 4.9", lawyerCount: "80+",  avgFee: "₹400 – ₹2,000",   highlight: "Domestic violence, TN State Women Commission", icon: "♀️" },
  // Kolkata
  { id: "kol-crim",  citySlug: "kolkata",    category: "Criminal",  displayCity: "Kolkata",   ratingRange: "4.0 – 4.7", lawyerCount: "140+", avgFee: "₹700 – ₹3,500",   highlight: "Calcutta HC, sessions, anticipatory bail", icon: "⚖️" },
  { id: "kol-prop",  citySlug: "kolkata",    category: "Property",  displayCity: "Kolkata",   ratingRange: "3.9 – 4.7", lawyerCount: "120+", avgFee: "₹600 – ₹3,000",   highlight: "Mutation, KMDA, land acquisition disputes", icon: "🏠" },
  { id: "kol-fam",   citySlug: "kolkata",    category: "Family",    displayCity: "Kolkata",   ratingRange: "4.1 – 4.8", lawyerCount: "100+", avgFee: "₹500 – ₹2,500",   highlight: "Family court, succession, HUF partition", icon: "👨‍👩‍👧" },
  // Pune
  { id: "pun-crim",  citySlug: "pune",       category: "Criminal",  displayCity: "Pune",      ratingRange: "4.0 – 4.8", lawyerCount: "130+", avgFee: "₹800 – ₹4,000",   highlight: "Sessions court bail, cybercrime, Pune rural cases", icon: "⚖️" },
  { id: "pun-prop",  citySlug: "pune",       category: "Property",  displayCity: "Pune",      ratingRange: "4.0 – 4.7", lawyerCount: "120+", avgFee: "₹700 – ₹3,000",   highlight: "PMRDA, RERA, cooperative housing disputes", icon: "🏠" },
  { id: "pun-corp",  citySlug: "pune",       category: "Startup",   displayCity: "Pune",      ratingRange: "4.1 – 4.8", lawyerCount: "100+", avgFee: "₹1,000 – ₹6,000", highlight: "Baner/Hinjewadi startup contracts, IP protection", icon: "🚀" },
  // Ahmedabad
  { id: "ahm-crim",  citySlug: "ahmedabad",  category: "Criminal",  displayCity: "Ahmedabad", ratingRange: "4.0 – 4.7", lawyerCount: "120+", avgFee: "₹700 – ₹3,500",   highlight: "Gujarat HC, sessions, economic crimes", icon: "⚖️" },
  { id: "ahm-prop",  citySlug: "ahmedabad",  category: "Property",  displayCity: "Ahmedabad", ratingRange: "3.9 – 4.7", lawyerCount: "110+", avgFee: "₹600 – ₹2,800",   highlight: "AUDA, Patel land disputes, RERA Gujarat", icon: "🏠" },
  // Jaipur
  { id: "jai-crim",  citySlug: "jaipur",     category: "Criminal",  displayCity: "Jaipur",    ratingRange: "4.0 – 4.7", lawyerCount: "100+", avgFee: "₹600 – ₹3,000",   highlight: "Rajasthan HC bail, sessions, anticipatory bail", icon: "⚖️" },
  { id: "jai-prop",  citySlug: "jaipur",     category: "Property",  displayCity: "Jaipur",    ratingRange: "3.9 – 4.6", lawyerCount: "90+",  avgFee: "₹500 – ₹2,500",   highlight: "JDA disputes, agricultural land, registry", icon: "🏠" },
];

// ─── Compatibility shim ───────────────────────────────────────────────────────
export const LAWYERS: Lawyer[] = [];
