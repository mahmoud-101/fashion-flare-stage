import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const AboutPage = () => {
  return (
    <>
      <SEOHead title="من نحن" description="Moda AI — منصة ذكاء اصطناعي متخصصة في توليد محتوى الموضة والفاشون للبراندات العربية." />
      <div className="min-h-screen bg-background gradient-bg" dir="rtl">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg btn-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-black text-gradient-gold">Moda AI</span>
          </Link>

          <h1 className="text-3xl font-black text-foreground mb-8">من نحن</h1>
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-foreground mb-2">رؤيتنا</h2>
              <p>
                Moda AI منصة ذكاء اصطناعي متخصصة في توليد محتوى الموضة والفاشون للبراندات
                العربية — من الكتابة الإبداعية وتصميم الإعلانات إلى التصوير الافتراضي
                وتحليل المنافسين.
              </p>
            </section>
            <section>
              <h2 className="text-base font-bold text-foreground mb-2">مهمتنا</h2>
              <p>
                نهدف إلى تمكين أصحاب البراندات والمتاجر الإلكترونية من إنتاج محتوى
                احترافي بسرعة وتكلفة أقل، مع الحفاظ على هوية البراند الفريدة.
              </p>
            </section>
            <section>
              <h2 className="text-base font-bold text-foreground mb-2">تواصل معنا</h2>
              <p>
                للاستفسارات والدعم الفني، يمكنك التواصل معنا عبر صفحة{" "}
                <Link to="/dashboard/help" className="text-primary hover:underline">المساعدة</Link>{" "}
                داخل لوحة التحكم.
              </p>
            </section>
          </div>

          <div className="mt-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-xl text-sm font-bold"
            >
              <Sparkles className="w-4 h-4" />
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
