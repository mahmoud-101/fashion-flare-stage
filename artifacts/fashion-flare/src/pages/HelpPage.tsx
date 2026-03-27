import DashboardLayout from "@/components/DashboardLayout";
import { HelpCircle, MessageCircle, BookOpen, Video, Mail, ChevronDown, ExternalLink, Search, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const faqs = [
  {
    q: "إيه هو Moda AI؟",
    a: "Moda AI هي منصة ذكاء اصطناعي متخصصة في صناعة محتوى تسويقي للأزياء والموضة. تقدر تكتب كابشنات، تصمم إعلانات، تعمل ريلز، وتحلل منافسيك — كل ده بالعربي وبأسلوب يناسب جمهورك.",
    tags: ["عام", "البداية"],
  },
  {
    q: "كم حد الاستخدام اليومي؟",
    a: "الخطة المجانية تتضمن 3 محتوى + 3 صور + 1 ريلز يومياً. الخطة الاحترافية تمنحك 50 محتوى + 30 صورة + 10 ريلز يومياً. الحدود بتتجدد كل 24 ساعة.",
    tags: ["استخدام", "خطة"],
  },
  {
    q: "إزاي أرقّي خطتي؟",
    a: "روح لصفحة 'الاشتراك' من القائمة الجانبية واختار الخطة المناسبة. هتقدر تدفع بالفيزا أو مدى أو أبل باي.",
    tags: ["الاشتراك", "دفع"],
  },
  {
    q: "هل أقدر أربط متجري على سلة أو شوبيفاي؟",
    a: "أيوا! من صفحة 'ربط المتجر' تقدر تربط متجرك على Salla أو Shopify أو Zid وتستورد منتجاتك تلقائياً.",
    tags: ["متجر", "تكامل"],
  },
  {
    q: "إيه الفرق بين استوديو التصوير واستوديو الصور؟",
    a: "استوديو التصوير متخصص في تصوير منتجات بموديلات AI وخلفيات احترافية. استوديو الصور للتعديلات السريعة زي حذف الخلفية والفلاتر.",
    tags: ["صور", "استوديو"],
  },
  {
    q: "هل المحتوى المولّد حصري؟",
    a: "نعم! كل محتوى يتم توليده فريد ومخصص لبراندك ومنتجاتك. الـ AI بيستخدم بيانات البراند بتاعك (النبرة، الجمهور، الهاشتاجات) لإنتاج محتوى مميز.",
    tags: ["محتوى", "خصوصية"],
  },
  {
    q: "أقدر ألغي اشتراكي في أي وقت؟",
    a: "طبعاً! تقدر تلغي اشتراكك في أي وقت من صفحة الإعدادات. هتفضل تستخدم المميزات حتى نهاية الفترة المدفوعة.",
    tags: ["الاشتراك", "إلغاء"],
  },
  {
    q: "إزاي أستخدم ميزة تجسس المنافسين؟",
    a: "ارفع صورة إعلان المنافس في صفحة 'تجسس المنافسين' وهيحلله الـ AI ويديك نقاط قوة وضعف + اقتراحات للتفوق عليه.",
    tags: ["منافسين", "تحليل"],
  },
  {
    q: "هل بياناتي ومنتجاتي آمنة؟",
    a: "100%. بنستخدم أحدث معايير التشفير ولا نشارك بيانات براندك مع أي طرف تالت.",
    tags: ["الأمان", "خصوصية"],
  },
];

const tutorials = [
  { title: "كيف تبدأ أول حملة إعلانية", icon: "🚀", youtubeId: null },
  { title: "استخدام كاتب المحتوى باحتراف", icon: "✍️", youtubeId: null },
  { title: "تصوير منتجات بالـ AI", icon: "📸", youtubeId: null },
  { title: "تحليل المنافسين خطوة بخطوة", icon: "🔍", youtubeId: null },
  { title: "جدولة المحتوى على كل المنصات", icon: "📅", youtubeId: null },
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
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <p className="text-xs text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/30 text-right">
          {a}
        </p>
      )}
    </button>
  );
}

const WHATSAPP_NUMBER = "201000000000";
const WHATSAPP_MSG = encodeURIComponent("مرحباً! لدي استفسار عن Moda AI.");

const HelpPage = () => {
  usePageTitle("مركز المساعدة");
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.includes(search) || f.a.includes(search) || f.tags.some((t) => t.includes(search))
  );

  const handleReport = async () => {
    if (!reportTitle.trim() || !reportDesc.trim()) {
      setReportError("أدخل عنوان المشكلة والوصف");
      return;
    }
    setReportLoading(true);
    setReportError(null);

    const { error } = await supabase.from("support_tickets").insert({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      title: reportTitle.trim(),
      description: reportDesc.trim(),
    });

    if (error) {
      setReportError("حصل خطأ في الإرسال. جرّب مرة أخرى.");
    } else {
      setReportSent(true);
      setReportTitle("");
      setReportDesc("");
    }
    setReportLoading(false);
  };

  return (
    <DashboardLayout title="مركز المساعدة" subtitle="نساعدك تحقق أقصى استفادة من Moda AI">
      <div className="max-w-4xl space-y-8">
        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
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

        {/* FAQ with search */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            الأسئلة الشائعة
          </h2>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في الأسئلة..."
              className="w-full bg-background/50 border border-border/50 rounded-xl pr-10 pl-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-right"
              dir="rtl"
            />
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="glass-card border border-border/40 rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">لم يُعثر على نتائج لـ "{search}"</p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`لدي سؤال عن: ${search}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                اسأل فريق الدعم مباشرة ←
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFaqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          )}
        </div>

        {/* Report a Problem */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            إبلاغ عن مشكلة
          </h2>
          <div className="glass-card gold-border rounded-2xl p-6">
            {reportSent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-foreground mb-1">تم إرسال بلاغك بنجاح!</p>
                <p className="text-xs text-muted-foreground">هنرد عليك خلال 24 ساعة على أقصى تقدير</p>
                <button
                  onClick={() => setReportSent(false)}
                  className="text-xs text-primary hover:underline mt-3 inline-block"
                >
                  إرسال بلاغ آخر
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                    عنوان المشكلة *
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="مثلاً: خطأ عند توليد المحتوى"
                    maxLength={100}
                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                    وصف المشكلة *
                  </label>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="اشرح المشكلة بالتفصيل — متى حدثت؟ ماذا كنت تفعل؟"
                    maxLength={1000}
                    rows={4}
                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-right resize-none"
                    dir="rtl"
                  />
                </div>
                {reportError && (
                  <p className="text-xs text-red-400">{reportError}</p>
                )}
                <button
                  onClick={handleReport}
                  disabled={reportLoading}
                  className="flex items-center gap-2 btn-gold px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {reportLoading ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>أرسل البلاغ</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HelpPage;
