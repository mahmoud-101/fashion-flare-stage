import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Upload, Plus, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const dialects = ["مصري 🇪🇬", "سعودي 🇸🇦", "إماراتي 🇦🇪", "فصحى"];
const tones = ["أنيق ومميز", "شبابي ومرح", "فاخر وراقي", "كاجوال وعفوي", "احترافي وموثوق"];
const audiences = ["بنات 18-25", "بنات 25-35", "ستات 35-50", "رجال فاشون", "الكل"];
const fonts = ["Tajawal", "Cairo", "Almarai", "Changa", "Lemonada"];

interface Brand {
  id?: string;
  name: string;
  dialect: string;
  tone: string;
  target_audience: string;
  tagline: string;
  hashtags: string[];
  logo_url: string | null;
  font: string;
}

const BrandSettings = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hashInput, setHashInput] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState<Brand>({
    name: "",
    dialect: "مصري 🇪🇬",
    tone: "أنيق ومميز",
    target_audience: "بنات 18-25",
    tagline: "",
    hashtags: [],
    logo_url: null,
    font: "Tajawal",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("brands")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBrand({
            id: data.id,
            name: data.name || "",
            dialect: data.dialect || "مصري 🇪🇬",
            tone: data.tone || "أنيق ومميز",
            target_audience: data.target_audience || "بنات 18-25",
            tagline: data.tagline || "",
            hashtags: data.hashtags || [],
            logo_url: data.logo_url || null,
            font: (data as any).font || "Tajawal",
          });
        }
      });
  }, [user]);

  const save = async () => {
    if (!user || !brand.name.trim()) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: brand.name,
      dialect: brand.dialect,
      tone: brand.tone,
      target_audience: brand.target_audience,
      tagline: brand.tagline,
      hashtags: brand.hashtags,
      logo_url: brand.logo_url,
      font: brand.font,
    } as any;
    if (brand.id) {
      await supabase.from("brands").update(payload).eq("id", brand.id);
    } else {
      const { data } = await supabase.from("brands").insert(payload).select().single();
      if (data) setBrand((b) => ({ ...b, id: data.id }));
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addHashtag = () => {
    const tag = hashInput.trim().replace(/^#/, "");
    if (tag && !brand.hashtags.includes(tag)) {
      setBrand((b) => ({ ...b, hashtags: [...b.hashtags, tag] }));
    }
    setHashInput("");
  };

  const removeHashtag = (tag: string) =>
    setBrand((b) => ({ ...b, hashtags: b.hashtags.filter((h) => h !== tag) }));

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم اللوجو يجب أن يكون أقل من 5MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(path);
      setBrand((b) => ({ ...b, logo_url: urlData.publicUrl }));
      toast.success("تم رفع اللوجو ✅");
    } catch {
      toast.error("فشل رفع اللوجو");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <DashboardLayout title="إعدادات البراند" subtitle="حدد شخصية براندك عشان الـ AI يكتب بأسلوبك">
      <div className="max-w-3xl space-y-6">
        {/* Brand name */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <h2 className="text-sm font-black text-foreground mb-5">هوية البراند</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">اسم البراند *</label>
              <input
                value={brand.name}
                onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))}
                placeholder="مثال: Hana Boutique"
                className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">الـ Tagline</label>
              <input
                value={brand.tagline}
                onChange={(e) => setBrand((b) => ({ ...b, tagline: e.target.value }))}
                placeholder="مثال: حيث الأناقة تبدأ"
                className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          {/* Logo upload */}
          <div className="mt-4">
            <label className="text-xs font-bold text-foreground mb-2 block">اللوجو</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border/50 flex items-center justify-center overflow-hidden">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{brand.name?.[0] || "B"}</span>
                )}
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2 glass-card gold-border rounded-xl text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingLogo ? "جاري الرفع..." : "رفع لوجو"}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoUpload(e.target.files)}
              />
            </div>
          </div>
        </div>

        {/* Dialect & Tone */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <h2 className="text-sm font-black text-foreground mb-5">أسلوب الكتابة</h2>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-foreground mb-3 block">اللهجة</label>
              <div className="flex flex-wrap gap-2">
                {dialects.map((d) => (
                  <button
                    key={d}
                    onClick={() => setBrand((b) => ({ ...b, dialect: d }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      brand.dialect === d ? "btn-gold" : "glass-card border border-border/50 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-3 block">أسلوب البراند</label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => setBrand((b) => ({ ...b, tone: t }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      brand.tone === t ? "btn-gold" : "glass-card border border-border/50 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-3 block">الجمهور المستهدف</label>
              <div className="flex flex-wrap gap-2">
                {audiences.map((a) => (
                  <button
                    key={a}
                    onClick={() => setBrand((b) => ({ ...b, target_audience: a }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      brand.target_audience === a ? "btn-gold" : "glass-card border border-border/50 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Font */}
            <div>
              <label className="text-xs font-bold text-foreground mb-3 block">الخط</label>
              <div className="flex flex-wrap gap-2">
                {fonts.map((f) => (
                  <button
                    key={f}
                    onClick={() => setBrand((b) => ({ ...b, font: f }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      brand.font === f ? "btn-gold" : "glass-card border border-border/50 text-muted-foreground hover:border-primary/40"
                    }`}
                    style={{ fontFamily: f }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hashtags */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <h2 className="text-sm font-black text-foreground mb-5">الهاشتاقات الثابتة</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
              placeholder="اكتب هاشتاق واضغط Enter أو +"
              className="flex-1 bg-surface-2 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
            <button onClick={addHashtag} className="btn-gold px-4 py-2.5 rounded-xl">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {brand.hashtags.map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 bg-primary/15 border border-primary/25 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                #{tag}
                <button onClick={() => removeHashtag(tag)}>
                  <X className="w-3 h-3 opacity-70 hover:opacity-100" />
                </button>
              </span>
            ))}
            {brand.hashtags.length === 0 && (
              <span className="text-xs text-muted-foreground">لم تضف هاشتاقات بعد</span>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={save}
          disabled={saving || !brand.name.trim()}
          className="w-full btn-gold py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saved ? (
            <><Check className="w-5 h-5" /> تم الحفظ!</>
          ) : saving ? (
            <span className="animate-pulse">جاري الحفظ...</span>
          ) : (
            <><Save className="w-5 h-5" /> حفظ إعدادات البراند</>
          )}
        </button>
      </div>
    </DashboardLayout>
  );
};

export default BrandSettings;
