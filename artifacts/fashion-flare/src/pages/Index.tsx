import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofBar from "@/components/SocialProofBar";
import ProblemSection from "@/components/ProblemSection";
import FeaturesSection from "@/components/FeaturesSection";
import CompareSection from "@/components/CompareSection";
import HowItWorks from "@/components/HowItWorks";
import LiveDemoSection from "@/components/LiveDemoSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <>
      <SEOHead
        title="منصة محتوى الفاشون العربي بالذكاء الاصطناعي"
        description="Moda AI — ولّد كابشنات، صور منتجات، إعلانات، وريلز احترافية لبراندك الفاشون في ثواني. الذكاء الاصطناعي المتخصص في البراندات العربية والمصرية."
      />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <FeaturesSection />
      <CompareSection />
      <HowItWorks />
      <LiveDemoSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <WhatsAppButton />
    </div>
    </>
  );
};

export default Index;
