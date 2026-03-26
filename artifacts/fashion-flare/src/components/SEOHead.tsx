import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: object | object[];
}

const DEFAULT_DESCRIPTION =
  "Moda AI — ولّد محتوى فاشون احترافي بالعربي في ثواني. كابشنات، صور منتجات، إعلانات، وريلز. متخصص 100% في البراندات المصرية والعربية.";
const DEFAULT_OG_IMAGE = "/opengraph.jpg";
const SITE_NAME = "Moda AI";
const SITE_URL = "https://fashion-flare.lovable.app";

const SOFTWARE_APP_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Moda AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "ar",
  description:
    "منصة ذكاء اصطناعي متخصصة في توليد محتوى الفاشون العربي — كابشنات، صور، إعلانات، وسكريبتات ريلز للبراندات العربية.",
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EGP",
    availability: "https://schema.org/InStock",
    priceSpecification: [
      {
        "@type": "UnitPriceSpecification",
        price: "0",
        priceCurrency: "EGP",
        name: "مجاني",
      },
      {
        "@type": "UnitPriceSpecification",
        price: "400",
        priceCurrency: "EGP",
        billingDuration: "P1M",
        name: "احترافي",
      },
      {
        "@type": "UnitPriceSpecification",
        price: "800",
        priceCurrency: "EGP",
        billingDuration: "P1M",
        name: "مؤسسات",
      },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "247",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "توليد كابشنات بالعربية",
    "استوديو صور الفاشون",
    "سكريبتات ريلز",
    "مولّد الهاشتاجات",
    "ربط متاجر Salla وShopify وZid",
    "جدولة المحتوى",
  ],
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "هل محتاج خبرة تقنية عشان أستخدم Moda AI؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "لأ خالص! الواجهة بسيطة جداً وبالعربي. أي حد يعرف يستخدم موبايل هيقدر يشتغل عليها من أول يوم.",
      },
    },
    {
      "@type": "Question",
      name: "هل الذكاء الاصطناعي بيكتب بالعامية المصرية فعلاً؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "آه! متدرب خصيصاً على المحتوى الفاشون العربي بكل لهجاته — المصري، السعودي، الإماراتي، والفصحى.",
      },
    },
    {
      "@type": "Question",
      name: "إيه الفرق بين الخطة المجانية والاحترافية؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "الخطة المجانية بتديك 3 محتويات و3 صور يومياً. الاحترافية بـ 400 ج.م بتديك 50 محتوى + 30 صورة + جدولة + ربط المتجر.",
      },
    },
    {
      "@type": "Question",
      name: "هل ممكن أجرب قبل ما أدفع؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "أكيد! عندنا خطة مجانية دائمة بدون بيانات بنكية. بتجرب الأدوات الأساسية وتشوف بنفسك قبل ما تشترك.",
      },
    },
    {
      "@type": "Question",
      name: "هل بيدعم ربط المتاجر الإلكترونية؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "آه! دلوقتي بيدعم ربط Salla وShopify وZid. استورد منتجاتك تلقائياً وولّد محتوى لكل منتج بضغطة واحدة.",
      },
    },
    {
      "@type": "Question",
      name: "ممكن ألغي الاشتراك في أي وقت؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "أكيد. الإلغاء بضغطة زر من الإعدادات وبدون أي رسوم إضافية.",
      },
    },
  ],
};

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const ogImageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

  const schemas = [
    SOFTWARE_APP_LD,
    FAQ_LD,
    ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
  ];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://icjwbjeoremieofbiinb.supabase.co" />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="ar_EG" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content={title} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
