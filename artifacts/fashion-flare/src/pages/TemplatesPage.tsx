import DashboardLayout from "@/components/DashboardLayout";
import { TemplatesLibrary } from "@/components/TemplatesLibrary";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, Heart, Copy } from "lucide-react";

const TemplatesPage = () => {
  usePageTitle("قوالب المحتوى");
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">مكتبة القوالب</h1>
          <p className="text-sm text-muted-foreground mt-1">
            قوالب جاهزة لكل مناسبة — انسخي وعدّلي وانشري
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: BookOpen, label: "60+ قالب جاهز", color: "text-primary", bg: "bg-primary/10" },
            { icon: Sparkles, label: "7 فئات متنوعة", color: "text-violet-400", bg: "bg-violet-400/10" },
            { icon: Heart, label: "حفظ في المفضلة", color: "text-red-400", bg: "bg-red-400/10" },
            { icon: Copy, label: "نسخ بنقرة واحدة", color: "text-green-400", bg: "bg-green-400/10" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="glass-card rounded-xl p-3 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-foreground">{stat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Library */}
        <TemplatesLibrary
          onSelect={(template) => {
            navigate("/dashboard/writer", { state: { prefill: template.content } });
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default TemplatesPage;
