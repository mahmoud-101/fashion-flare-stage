import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const DEFAULT_DESCRIPTION =
  "Moda AI — ولّد محتوى فاشون احترافي بالعربي في ثواني. كابشنات، صور منتجات، إعلانات، وريلز. متخصص 100% في البراندات المصرية والعربية.";
const DEFAULT_OG_IMAGE = "/og-image.png";
const SITE_NAME = "Moda AI";

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
