import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import SEOHead from "@/components/SEOHead";

const PrivacyPage = () => {
  usePageTitle("سياسة الخصوصية");

  return (
    <>
    <SEOHead title="سياسة الخصوصية" description="سياسة خصوصية Moda AI — كيف نحمي بياناتك ونحترم خصوصيتك على المنصة." />
    <div className="min-h-screen bg-background gradient-bg">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg btn-gold flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-gradient-gold">Moda AI</span>
        </Link>

        <h1 className="text-3xl font-black text-foreground mb-8">سياسة الخصوصية</h1>
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">1. المعلومات التي نجمعها</h2>
            <p>نجمع المعلومات التالية: الاسم والبريد الإلكتروني عند التسجيل، بيانات الاستخدام والتفاعل مع المنصة، المحتوى الذي تنشئه والصور التي ترفعها، وبيانات المتجر عند ربطه بالمنصة.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">2. كيف نستخدم بياناتك</h2>
            <p>نستخدم بياناتك لتقديم خدمات المنصة وتحسينها، تخصيص المحتوى المُولّد ليتناسب مع براندك، إرسال إشعارات مهمة حول حسابك، وتحسين أداء خوارزميات الذكاء الاصطناعي.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">3. حماية البيانات</h2>
            <p>نستخدم تشفير SSL/TLS لحماية البيانات أثناء النقل. يتم تخزين البيانات في خوادم آمنة. نطبق سياسات التحكم في الوصول (RLS) على مستوى قاعدة البيانات. لا نشارك بياناتك مع أطراف ثالثة دون موافقتك.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">4. ملفات تعريف الارتباط (Cookies)</h2>
            <p>نستخدم ملفات تعريف الارتباط الضرورية لتشغيل المنصة وتسجيل الدخول. لا نستخدم ملفات تتبع إعلانية من أطراف ثالثة.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">5. حقوقك</h2>
            <p>لديك الحق في الوصول إلى بياناتك الشخصية، تصحيح أو تحديث بياناتك، حذف حسابك وبياناتك المرتبطة به، وتصدير بياناتك بتنسيق قابل للقراءة.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">6. الاحتفاظ بالبيانات</h2>
            <p>نحتفظ ببياناتك طالما حسابك نشط. عند حذف حسابك، يتم حذف جميع بياناتك خلال 30 يوماً.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">7. التواصل معنا</h2>
            <p>لأي استفسارات حول الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني: privacy@moda-ai.com</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground">آخر تحديث: مارس 2026</p>
          <Link to="/auth" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
            العودة لتسجيل الدخول <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default PrivacyPage;
