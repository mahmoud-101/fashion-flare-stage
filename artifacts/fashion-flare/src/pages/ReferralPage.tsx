import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Gift, Copy, Check, Users, Award, Share2 } from "lucide-react";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ReferralPage = () => {
  usePageTitle("دعوة صديق");
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_or_create_referral_code", {
        _user_id: user.id,
      });
      if (error) throw error;
      return data as string;
    },
    enabled: !!user,
  });

  const { data: referrals } = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const referralLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const convertedCount = referrals?.filter((r) => r.status === "converted").length || 0;
  const pendingCount = referrals?.filter((r) => r.status === "pending").length || 0;

  return (
    <DashboardLayout title="دعوة صديق" subtitle="ادعِ صديقك واحصل على أسبوع Pro مجاناً!">
      <div className="max-w-3xl space-y-8">
        {/* Hero Card */}
        <div className="glass-card gold-border rounded-2xl p-8 glow-gold text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl btn-gold flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">ادعِ صديقك، واكسب أسبوع Pro 🎁</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              كل صديق يسجّل من رابطك ويفعّل حسابه، تحصل على أسبوع اشتراك احترافي مجاناً. 
              صديقك كمان يحصل على 3 أيام Pro عند التسجيل!
            </p>

            {/* Referral Link */}
            <div className="glass-card border border-border/50 rounded-xl p-4 flex items-center gap-3 max-w-lg mx-auto">
              <input
                type="text"
                value={codeLoading ? "جاري التحميل..." : referralLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-foreground text-left dir-ltr truncate focus:outline-none"
                dir="ltr"
              />
              <button
                onClick={handleCopy}
                className="btn-gold px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "تم النسخ!" : "نسخ"}
              </button>
            </div>

            {/* Share buttons */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <a
                href={`https://wa.me/?text=جرّب Moda AI — أقوى منصة محتوى للفاشون بالعربي! ${referralLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card border border-border/50 px-4 py-2 rounded-lg text-sm font-bold text-foreground hover:border-primary/40 transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4 text-primary" />
                واتساب
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=جرّب Moda AI — أقوى منصة محتوى للفاشون بالعربي!&url=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card border border-border/50 px-4 py-2 rounded-lg text-sm font-bold text-foreground hover:border-primary/40 transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4 text-primary" />
                تويتر
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card gold-border rounded-2xl p-5 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-black text-foreground">{(referrals?.length || 0)}</div>
            <div className="text-xs text-muted-foreground">إجمالي الدعوات</div>
          </div>
          <div className="glass-card gold-border rounded-2xl p-5 text-center">
            <Award className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-black text-foreground">{convertedCount}</div>
            <div className="text-xs text-muted-foreground">تحوّلوا لمشتركين</div>
          </div>
          <div className="glass-card gold-border rounded-2xl p-5 text-center">
            <Gift className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-black text-foreground">{convertedCount * 7}</div>
            <div className="text-xs text-muted-foreground">أيام Pro مكتسبة</div>
          </div>
        </div>

        {/* How it works */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4">كيف يعمل؟</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "شارك رابطك", desc: "انسخ الرابط وأرسله لصديقك" },
              { step: "2", title: "صديقك يسجّل", desc: "يفتح حساب ويفعّله من الرابط" },
              { step: "3", title: "تكسبوا سوا", desc: "أنت أسبوع Pro + صديقك 3 أيام Pro" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full btn-gold flex items-center justify-center mx-auto mb-3 text-sm font-black">
                  {item.step}
                </div>
                <div className="text-sm font-bold text-foreground mb-1">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReferralPage;
