export type FashionAdTemplate = {
  id: string;
  category: string;
  name_ar: string;
  aspectRatio: "9:16" | "4:5" | "1:1" | "16:9";
  /** For ImageStudio (scenario box) */
  scenario: string;
  /** Optional styling (customPrompt box) */
  styling?: string;
  /** Optional mood preset (ImageStudio auto mood) */
  mood?: string;
  /** For CreatorStudio (full prompt) */
  prompt: string;
};

const TEXT_CONSTRAINT =
  "STRICTLY PRESERVE all original branding, labels, and logos on the product. DO NOT remove or alter existing text. NO EXTRA generated text or watermarks.";

const CATEGORIES = [
  {
    category: "Launch",
    ar: "إطلاق مجموعة",
    base:
      "High-end fashion launch campaign. Editorial, premium, crisp details, clean composition. ",
  },
  {
    category: "Sale",
    ar: "تخفيضات",
    base:
      "Fashion sale campaign look. Premium retail vibe, irresistible offer mood, clean and punchy composition. ",
  },
  {
    category: "NewArrivals",
    ar: "وصل حديثاً",
    base:
      "New arrivals fashion campaign. Fresh, modern, highly desirable, premium storefront feel. ",
  },
  {
    category: "Lookbook",
    ar: "لوك بوك",
    base:
      "Lookbook spread style. Editorial styling, fashion magazine aesthetic, tasteful props and textures. ",
  },
  {
    category: "Minimal",
    ar: "مينيمال",
    base:
      "Ultra-minimal studio shot. Museum-like product presentation, subtle shadows, premium details. ",
  },
  {
    category: "Luxury",
    ar: "فاخر",
    base:
      "Luxury fashion campaign. Dramatic lighting, premium materials, gold accents, cinematic grade. ",
  },
  {
    category: "Lifestyle",
    ar: "لايف ستايل",
    base:
      "Lifestyle fashion ad. Natural candid feel, realistic environment, authentic shadows and perspective. ",
  },
  {
    category: "UGC",
    ar: "ستايل UGC",
    base:
      "UGC-inspired ad. Real phone-camera vibe, authentic, slight grain, but still sharp product. ",
  },
  {
    category: "Seasonal",
    ar: "موسمي",
    base:
      "Seasonal fashion campaign. Cohesive seasonal palette, on-trend props, modern composition. ",
  },
  {
    category: "BrandStory",
    ar: "قصة البراند",
    base:
      "Brand story ad. Emotional, cinematic still, premium storytelling through lighting and setting. ",
  },
] as const;

type Layout = {
  key: string;
  name: string;
  aspectRatio: FashionAdTemplate["aspectRatio"];
  scenario: string;
  styling?: string;
  mood?: string;
};

const LAYOUTS: Layout[] = [
  {
    key: "StoryHero",
    name: "Story Hero",
    aspectRatio: "9:16",
    scenario:
      "Instagram Story hero ad: product centered, generous negative space top/bottom for headline and CTA overlay later.",
    styling:
      "Clean premium background with subtle gradient and soft shadows; keep text areas empty.",
    mood: "Clean, minimalist white studio aesthetic",
  },
  {
    key: "StoryLifestyle",
    name: "Story Lifestyle",
    aspectRatio: "9:16",
    scenario:
      "Instagram Story lifestyle ad: product being worn/used naturally, background environment supports the product, keep empty area for text overlay.",
    styling: "Natural daylight, realistic shadows, premium but authentic.",
    mood: "Warm, golden hour luxury lighting",
  },
  {
    key: "ReelCover",
    name: "Reel Cover",
    aspectRatio: "9:16",
    scenario:
      "Reels cover still: strong subject focus, bold composition, clean background, high contrast, empty upper third for title overlay.",
    styling: "Cinematic lighting, strong rim light, premium contrast.",
    mood: "Dramatic dark luxury with gold accents",
  },
  {
    key: "FeedSquare",
    name: "IG Feed Square",
    aspectRatio: "1:1",
    scenario:
      "Instagram feed square ad: product centered with premium balance, symmetrical composition, empty margin for minimal badge overlay.",
    styling: "White/neutral studio, soft shadow, sharp details.",
    mood: "Clean, minimalist white studio aesthetic",
  },
  {
    key: "FeedPortrait",
    name: "IG Feed Portrait",
    aspectRatio: "4:5",
    scenario:
      "Instagram feed portrait ad (4:5): product slightly off-center, editorial composition, negative space for text overlay.",
    styling: "Soft pastel background with subtle textures; keep overlay space clean.",
    mood: "Soft playful pastel colors",
  },
  {
    key: "WebsiteBanner",
    name: "Website Banner",
    aspectRatio: "16:9",
    scenario:
      "Website hero banner: product on the right third, clean negative space on the left for headline, premium lighting, crisp details.",
    styling: "High-end studio lighting, subtle gradient background, keep headline area empty.",
  },
  {
    key: "FlatLay",
    name: "Flat Lay",
    aspectRatio: "1:1",
    scenario:
      "Flat lay ad: top-down shot with 2-3 complementary fashion accessories, clean layout, product is the hero.",
    styling: "Marble or soft fabric surface, natural soft shadowing.",
    mood: "Organic fresh natural green aesthetic",
  },
  {
    key: "DetailMacro",
    name: "Detail Macro",
    aspectRatio: "4:5",
    scenario:
      "Macro detail ad: extreme close-up on texture/stitching/finish, premium feel, shallow depth of field.",
    styling: "Cinematic macro, highlight craftsmanship, clean background.",
  },
  {
    key: "Packaging",
    name: "Packaging Moment",
    aspectRatio: "4:5",
    scenario:
      "Unboxing / packaging ad still: premium packaging, tissue paper, subtle brand vibe, product partially revealed.",
    styling: "Soft warm lighting, luxury feel, clean composition.",
    mood: "Warm, golden hour luxury lighting",
  },
  {
    key: "ColorPop",
    name: "Color Pop",
    aspectRatio: "1:1",
    scenario:
      "Color-pop studio ad: bold solid background color, product sharply lit, strong shadow, modern vibe.",
    styling: "Vibrant but premium, avoid cheap look, crisp edges.",
    mood: "Vibrant neon cyberpunk style",
  },
];


export const FASHION_AD_TEMPLATES: FashionAdTemplate[] = CATEGORIES.flatMap((c, ci) =>
  LAYOUTS.map((l, li) => {
    const n = ci * LAYOUTS.length + li + 1;
    const id = `fashion_${String(n).padStart(3, "0")}`;

    const name_ar = `${c.ar} — ${l.name} #${li + 1}`;

    const prompt =
      `${c.base}` +
      `Scene: ${l.scenario} ` +
      `Styling: ${l.styling ?? "Premium modern styling."} ` +
      `Quality: HIGH-END COMMERCIAL QUALITY, photorealistic, crisp details, cinematic lighting. ` +
      `${TEXT_CONSTRAINT}`;

    return {
      id,
      category: c.ar,
      name_ar,
      aspectRatio: l.aspectRatio,
      scenario: `${c.ar}: ${l.scenario}`,
      styling: l.styling,
      mood: l.mood,
      prompt,
    } satisfies FashionAdTemplate;
  }),
).slice(0, 100);
