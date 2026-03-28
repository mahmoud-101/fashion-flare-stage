import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const PricingPage = () => {
  return (
    <>
      <SEOHead title="الأسعار والخطط" description="اكتشف خطط Moda AI المناسبة لك — ابدأ مجاناً أو اختر خطة احترافية لتنمية براندك." />
      <div className="min-h-screen bg-background gradient-bg" dir="rtl">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg btn-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-black text-gradient-gold">Moda AI</span>
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-foreground mb-4">الأسعار والخطط</h1>
            <p className="text-muted-foreground">ابدأ مجاناً — لا بطاقة بنكية مطلوبة</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card gold-border rounded-2xl p-6">
              <h2 className="text-lg font-black text-foreground mb-2">مجاني</h2>
              <p className="text-3xl font-black text-foreground mb-1">0 ج.م</p>
              <p className="text-xs text-muted-foreground mb-6">للأبد</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                <li>✓ 10 توليدات شهرياً</li>
                <li>✓ الكتابة الإبداعية</li>
                <li>✓ استوديو الصور الأساسي</li>
              </ul>
              <Link to="/auth" className="block w-full text-center py-2.5 rounded-xl border border-border text-sm font-bold hover:border-primary/50 transition-colors">
                ابدأ مجاناً
              </Link>
            </div>

            <div className="glass-card gold-border rounded-2xl p-6 glow-gold relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                الأكثر شيوعاً
              </div>
              <h2 className="text-lg font-black text-foreground mb-2">احترافي</h2>
              <p className="text-3xl font-black text-foreground mb-1">400 ج.م</p>
              <p className="text-xs text-muted-foreground mb-6">شهرياً</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                <li>✓ 200 توليد شهرياً</li>
                <li>✓ جميع الميزات الأساسية</li>
                <li>✓ التصوير الافتراضي</li>
                <li>✓ مراقبة المنافسين</li>
              </ul>
              <Link to="/auth?plan=pro" className="block w-full text-center btn-gold py-2.5 rounded-xl text-sm font-bold">
                اشترك الآن
              </Link>
            </div>

            <div className="glass-card gold-border rounded-2xl p-6">
              <h2 className="text-lg font-black text-foreground mb-2">مؤسسات</h2>
              <p className="text-3xl font-black text-foreground mb-1">800 ج.م</p>
              <p className="text-xs text-muted-foreground mb-6">شهرياً</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                <li>✓ توليدات غير محدودة</li>
                <li>✓ جميع الميزات</li>
                <li>✓ متعدد المستخدمين</li>
                <li>✓ دعم أولوية</li>
              </ul>
              <Link to="/auth?plan=agency" className="block w-full text-center py-2.5 rounded-xl border border-border text-sm font-bold hover:border-primary/50 transition-colors">
                اشترك الآن
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;
