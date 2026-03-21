import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import SEOHead from "@/components/SEOHead";

const TermsPage = () => {
  usePageTitle("شروط الاستخدام");

  return (
    <>
    <SEOHead title="شروط الاستخدام" description="اقرأ شروط استخدام Moda AI — المنصة المتخصصة في توليد محتوى الفاشون العربي بالذكاء الاصطناعي." />
    <div className="min-h-screen bg-background gradient-bg">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg btn-gold flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-gradient-gold">Moda AI</span>
        </Link>

        <h1 className="text-3xl font-black text-foreground mb-8">شروط الاستخدام</h1>
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">1. القبول بالشروط</h2>
            <p>باستخدامك لمنصة Moda AI، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام المنصة.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">2. وصف الخدمة</h2>
            <p>Moda AI هي منصة ذكاء اصطناعي لإنشاء المحتوى التسويقي وتصميم الصور الإعلانية لأصحاب المتاجر والبراندات. تشمل الخدمة كتابة المحتوى، توليد الصور، جدولة المنشورات، وربط المتاجر الإلكترونية.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">3. حساب المستخدم</h2>
            <p>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور. تتحمل المسؤولية الكاملة عن جميع الأنشطة التي تتم من خلال حسابك.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">4. الملكية الفكرية</h2>
            <p>المحتوى الذي تنشئه باستخدام المنصة يعود ملكيته لك. ومع ذلك، تحتفظ Moda AI بحقوق الملكية الفكرية للمنصة نفسها وتقنياتها.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">5. الاستخدام المقبول</h2>
            <p>يُحظر استخدام المنصة لإنشاء محتوى غير قانوني أو مسيء أو ينتهك حقوق الآخرين. نحتفظ بالحق في تعليق أو إنهاء حسابات تنتهك هذه الشروط.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">6. حدود المسؤولية</h2>
            <p>يتم تقديم الخدمة "كما هي" دون ضمانات صريحة أو ضمنية. لا تتحمل Moda AI المسؤولية عن أي أضرار ناتجة عن استخدام المنصة.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">7. التعديلات</h2>
            <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار داخل المنصة.</p>
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

export default TermsPage;
