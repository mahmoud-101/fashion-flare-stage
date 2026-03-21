import DashboardLayout from "@/components/DashboardLayout";
import { HelpCircle, MessageCircle, BookOpen, Video, Mail, ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { usePageTitle } from "@/components/AccessibilityHelpers";

const faqs = [
  {
    q: "إيه هو Moda AI؟",
    a: "Moda AI هي منصة ذكاء اصطناعي متخصصة في صناعة محتوى تسويقي للأزياء والموضة. تقدر تكتب كابشنات، تصمم إعلانات، تعمل ريلز، وتحلل منافسيك — كل ده بالعربي وبأسلوب يناسب جمهورك.",
  },
  {
    q: "كم حد الاستخدام اليومي؟",
    a: "الخطة المجانية تتضمن 5 محتوى + 3 صور + 1 ريلز يومياً. الخطة الاحترافية تمنحك 50 محتوى + 30 صورة + 10 ريلز يومياً. الحدود بتتجدد كل 24 ساعة.",
  },
  {
    q: "إزاي أرقّي خطتي؟",
    a: "روح لصفحة 'الاشتراك' من القائمة الجانبية واختار الخطة المناسبة. هتقدر تدفع بالفيزا أو مدى أو أبل باي.",
  },
  {
    q: "هل أقدر أربط متجري على سلة أو شوبيفاي؟",
    a: "أيوا! من صفحة 'ربط المتجر' تقدر تربط متجرك على Salla أو Shopify أو Zid وتستورد منتجاتك تلقائياً.",
  },
  {
    q: "إيه الفرق بين استوديو التصوير واستوديو الصور؟",
    a: "استوديو التصوير متخصص في تصوير منتجات بموديلات AI وخلفيات احترافية. استوديو الصور للتعديلات السريعة زي حذف الخلفية والفلاتر.",
  },
  {
    q: "هل المحتوى المولّد حصري؟",
    a: "نعم! كل محتوى يتم توليده فريد ومخصص لبراندك ومنتجاتك. الـ AI بيستخدم بيانات البراند بتاعك (النبرة، الجمهور، الهاشتاجات) لإنتاج محتوى مميز.",
  },
  {
    q: "أقدر ألغي اشتراكي في أي وقت؟",
    a: "طبعاً! تقدر تلغي اشتراكك في أي وقت من صفحة الإعدادات. هتفضل تستخدم المميزات حتى نهاية الفترة المدفوعة.",
  },
  {
    q: "إزاي أستخدم ميزة تجسس المنافسين؟",
    a: "ارفع صورة إعلان المنافس في صفحة 'تجسس المنافسين' وهيحلله الـ AI ويديك نقاط قوة وضعف + اقتراحات للتفوق عليه.",
  },
];

const tutorials = [
  { title: "كيف تبدأ أول حملة إعلانية", icon: "🚀" },
  { title: "استخدام كاتب المحتوى باحتراف", icon: "✍️" },
  { title: "تصوير منتجات بالـ AI", icon: "📸" },
  { title: "تحليل المنافسين خطوة بخطوة", icon: "🔍" },
  { title: "جدولة المحتوى على كل المنصات", icon: "📅" },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-right glass-card border border-border/40 rounded-xl p-4 transition-all hover:border-primary/30"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-foreground">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <p className="text-xs text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/30">
          {a}
        </p>
      )}
    </button>
  );
}

const HelpPage = () => {
  usePageTitle("مركز المساعدة");

  return (
    <DashboardLayout title="مركز المساعدة" subtitle="نساعدك تحقق أقصى استفادة من Moda AI">
      <div className="max-w-4xl space-y-8">
        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <a
            href="https://wa.me/201000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card gold-border rounded-2xl p-5 card-hover flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">تواصل واتساب</div>
              <div className="text-xs text-muted-foreground mt-0.5">رد سريع خلال دقائق</div>
            </div>
          </a>
          <a
            href="mailto:support@modaai.com"
            className="glass-card gold-border rounded-2xl p-5 card-hover flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">البريد الإلكتروني</div>
              <div className="text-xs text-muted-foreground mt-0.5">support@modaai.com</div>
            </div>
          </a>
          <div className="glass-card gold-border rounded-2xl p-5 card-hover flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">دليل المستخدم</div>
              <div className="text-xs text-muted-foreground mt-0.5">شروحات تفصيلية لكل أداة</div>
            </div>
          </div>
        </div>

        {/* Tutorials */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            دروس سريعة
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tutorials.map((tut, i) => (
              <div
                key={i}
                className="glass-card border border-border/40 rounded-xl p-4 flex items-center gap-3 card-hover cursor-pointer"
              >
                <span className="text-2xl">{tut.icon}</span>
                <span className="text-sm font-medium text-foreground">{tut.title}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground mr-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            الأسئلة الشائعة
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HelpPage;
