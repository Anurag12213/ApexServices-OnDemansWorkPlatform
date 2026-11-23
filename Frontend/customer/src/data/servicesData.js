/**
 * Standard Home Services Data Schema & Enrichment Layer
 * Conforms to production TypeScript / JSDoc Category spec.
 */

export const DEFAULT_CATEGORY_ENRICHMENT = {
  'Custom Carpentry': {
    slug: 'custom-carpentry',
    serviceCount: 14,
    badge: 'POPULAR',
    tags: ['popular'],
    rating: 4.8,
    reviewCount: 980,
    activePros: 92,
    startingPrice: '₹399',
    iconClass: 'fa-solid fa-hammer',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    subservices: [
      { id: 'sub-cc-1', name: 'Furniture Assembly & Joinery', startingPrice: '₹399' },
      { id: 'sub-cc-2', name: 'Door Hanging & Lock Alignment', startingPrice: '₹499' },
      { id: 'sub-cc-3', name: 'Custom Kitchen Cabinet Refit', startingPrice: '₹999' },
      { id: 'sub-cc-4', name: 'Deck Restoration & Wood Trim', startingPrice: '₹699' },
      { id: 'sub-cc-5', name: 'Window Frame & Latch Repair', startingPrice: '₹349' },
    ],
  },
  'Emergency Plumbing': {
    slug: 'emergency-plumbing',
    serviceCount: 18,
    badge: '24/7 EMERGENCY',
    tags: ['popular', 'emergency'],
    rating: 4.9,
    reviewCount: 1420,
    activePros: 145,
    startingPrice: '₹299',
    iconClass: 'fa-solid fa-faucet-drip',
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    subservices: [
      { id: 'sub-ep-1', name: 'Pipe Leak Detection & Repair', startingPrice: '₹299' },
      { id: 'sub-ep-2', name: 'Mainline Drain Unclogging', startingPrice: '₹499' },
      { id: 'sub-ep-3', name: 'Faucet & Shower Replacement', startingPrice: '₹349' },
      { id: 'sub-ep-4', name: 'Water Heater Diagnostic & Tune-up', startingPrice: '₹599' },
      { id: 'sub-ep-5', name: 'Toilet Flush & Valve Rebuild', startingPrice: '₹399' },
    ],
  },
  'Electrical Maintenance': {
    slug: 'electrical-maintenance',
    serviceCount: 22,
    badge: '24/7 EMERGENCY',
    tags: ['popular', 'emergency'],
    rating: 4.9,
    reviewCount: 2150,
    activePros: 180,
    startingPrice: '₹349',
    iconClass: 'fa-solid fa-bolt',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    subservices: [
      { id: 'sub-em-1', name: 'Short Circuit Diagnostic', startingPrice: '₹349' },
      { id: 'sub-em-2', name: 'Architectural Lighting Setup', startingPrice: '₹499' },
      { id: 'sub-em-3', name: 'Circuit Breaker Panel Upgrade', startingPrice: '₹899' },
      { id: 'sub-em-4', name: 'EV Home Charger Installation', startingPrice: '₹1499' },
      { id: 'sub-em-5', name: 'Safety Earthing & Rewiring', startingPrice: '₹699' },
    ],
  },
  'HVAC & AC Service': {
    slug: 'hvac-ac-service',
    serviceCount: 15,
    badge: 'POPULAR',
    tags: ['popular', 'emergency'],
    rating: 4.8,
    reviewCount: 1890,
    activePros: 130,
    startingPrice: '₹499',
    iconClass: 'fa-solid fa-snowflake',
    imageUrl: 'https://images.unsplash.com/photo-1631545850383-798835b69c4c?auto=format&fit=crop&w=800&q=80',
    subservices: [
      { id: 'sub-hvac-1', name: 'Deep AC Chemical Cleaning', startingPrice: '₹499' },
      { id: 'sub-hvac-2', name: 'Refrigerant Gas Leak Refill', startingPrice: '₹1199' },
      { id: 'sub-hvac-3', name: 'Compressor & Fan Motor Repair', startingPrice: '₹899' },
      { id: 'sub-hvac-4', name: 'Smart Thermostat Installation', startingPrice: '₹399' },
    ],
  },
  'Painting & Decor': {
    slug: 'painting-decor',
    serviceCount: 12,
    badge: 'PREMIUM',
    tags: ['popular'],
    rating: 4.7,
    reviewCount: 860,
    activePros: 74,
    startingPrice: '₹599',
    iconClass: 'fa-solid fa-paint-roller',
    imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
    subservices: [
      { id: 'sub-pd-1', name: 'Full Interior Wall Painting', startingPrice: '₹1499' },
      { id: 'sub-pd-2', name: 'Weather-Shield Exterior Coating', startingPrice: '₹2999' },
      { id: 'sub-pd-3', name: 'Drywall Repair & Texture Matching', startingPrice: '₹599' },
      { id: 'sub-pd-4', name: 'Wood Stain & Lacquer Refinish', startingPrice: '₹699' },
    ],
  },
  'Appliance Care': {
    slug: 'appliance-care',
    serviceCount: 19,
    badge: 'FAST TURNAROUND',
    tags: ['popular', 'emergency'],
    rating: 4.8,
    reviewCount: 1340,
    activePros: 110,
    startingPrice: '₹349',
    iconClass: 'fa-solid fa-tv',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    subservices: [
      { id: 'sub-ac-1', name: 'Washing Machine Drum & Motor Fix', startingPrice: '₹399' },
      { id: 'sub-ac-2', name: 'Refrigerator Gas & Inverter Board', startingPrice: '₹499' },
      { id: 'sub-ac-3', name: 'Microwave Magnetron Replacement', startingPrice: '₹349' },
      { id: 'sub-ac-4', name: 'Built-in Dishwasher Drainage Fix', startingPrice: '₹449' },
    ],
  },
  'Deep Cleaning': {
    slug: 'deep-cleaning',
    serviceCount: 16,
    badge: 'POPULAR',
    tags: ['popular'],
    rating: 4.9,
    reviewCount: 3100,
    activePros: 220,
    startingPrice: '₹499',
    iconClass: 'fa-solid fa-broom',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    subservices: [
      { id: 'sub-dc-1', name: 'Full Residential Deep Sanitization', startingPrice: '₹999' },
      { id: 'sub-dc-2', name: 'Upholstery & Mattress Steam Clean', startingPrice: '₹499' },
      { id: 'sub-dc-3', name: 'Intense Bathroom Descaling', startingPrice: '₹349' },
      { id: 'sub-dc-4', name: 'Kitchen Chimney & Oven Degrease', startingPrice: '₹449' },
    ],
  },
  'Pest Control': {
    slug: 'pest-control',
    serviceCount: 10,
    badge: 'CERTIFIED',
    tags: ['emergency'],
    rating: 4.8,
    reviewCount: 750,
    activePros: 65,
    startingPrice: '₹399',
    iconClass: 'fa-solid fa-bug',
    imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=800&q=80',
    subservices: [
      { id: 'sub-pc-1', name: 'Termite Barrier & Drill Treatment', startingPrice: '₹799' },
      { id: 'sub-pc-2', name: 'Cockroach & Ant Gel Formulation', startingPrice: '₹399' },
      { id: 'sub-pc-3', name: 'Bedbug Thermal Fumigation', startingPrice: '₹899' },
      { id: 'sub-pc-4', name: 'Eco-Friendly Herbal Spray', startingPrice: '₹499' },
    ],
  },
};

/**
 * Enriches any category item (from backend API or local state) with full schema properties.
 */
export const enrichCategory = (cat, currencySymbol = '₹') => {
  if (!cat) return null;

  const nameKey = cat.name || '';
  const defaults = DEFAULT_CATEGORY_ENRICHMENT[nameKey] || {};

  const slug =
    cat.slug ||
    defaults.slug ||
    nameKey
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    'service';

  const subservices =
    Array.isArray(cat.subservices) && cat.subservices.length > 0
      ? cat.subservices
      : defaults.subservices || [
          { id: `sub-${cat.id}-1`, name: `${cat.name} Inspection & Diagnostic`, startingPrice: `${currencySymbol}299` },
          { id: `sub-${cat.id}-2`, name: `Standard ${cat.name} Service`, startingPrice: `${currencySymbol}499` },
          { id: `sub-${cat.id}-3`, name: `Comprehensive ${cat.name} Repair`, startingPrice: `${currencySymbol}799` },
        ];

  const serviceCount = cat.serviceCount || defaults.serviceCount || subservices.length || 8;
  const rating = cat.rating || defaults.rating || 4.8;
  const reviewCount = cat.reviewCount || defaults.reviewCount || 950;
  const activePros = cat.activePros || defaults.activePros || 75;
  const startingPrice = cat.startingPrice || defaults.startingPrice || `${currencySymbol}299`;
  const badge = cat.badge || cat.tag || defaults.badge || (rating >= 4.85 ? 'TOP RATED' : null);
  const tags = Array.isArray(cat.tags) && cat.tags.length > 0
    ? cat.tags
    : defaults.tags || ['popular'];

  const imageUrl =
    cat.bannerImageUrl ||
    cat.imageUrl ||
    defaults.imageUrl ||
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';

  const iconClass = cat.iconClass || defaults.iconClass || 'fa-solid fa-wrench';

  return {
    ...cat,
    id: cat.id || slug,
    slug,
    name: cat.name,
    serviceCount,
    imageUrl,
    iconClass,
    badge,
    tags,
    description: cat.description || 'Professional home repairs and certified craftsmanship.',
    rating,
    reviewCount,
    activePros,
    startingPrice,
    subservices,
  };
};

/**
 * Simulates async REST API fetch (GET /api/v1/categories)
 */
export async function fetchCategoriesAPI() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const enriched = Object.keys(DEFAULT_CATEGORY_ENRICHMENT).map((name) =>
        enrichCategory({ name, ...DEFAULT_CATEGORY_ENRICHMENT[name] })
      );
      resolve(enriched);
    }, 300);
  });
}
