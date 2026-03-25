import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Settings, User, Bell, Shield, Trash2, Upload, Loader2, Check, Camera, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const SettingsPage = () => {
  usePageTitle("الإعدادات");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState(true);

  // Delete account
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const isGoogleUser = user?.app_metadata?.provider === "google" ||
    (user?.app_metadata?.providers as string[] | undefined)?.includes("google");

  // Profile data
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.full_name) setFullName(data.full_name);
      return data;
    },
    enabled: !!user,
  });

  const handleSaveName = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    try {
      // Update auth metadata
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      // Update profiles table
      await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("user_id", user.id);
      toast.success("تم حفظ الاسم بنجاح ✅");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      toast.error("حصل خطأ أثناء الحفظ");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة أكبر من 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("generated-images")
        .getPublicUrl(path);

      await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id);

      toast.success("تم رفع الصورة بنجاح 📸");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      toast.error("حصل خطأ أثناء رفع الصورة");
    }
    setUploadingAvatar(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("كلمة السر لازم تكون 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمة السر مش متطابقة");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("تم تغيير كلمة السر بنجاح 🔒");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("حصل خطأ أثناء تغيير كلمة السر");
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      await supabase.from("saved_content").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      await supabase.auth.signOut();
      toast.success("تم حذف حسابك بنجاح");
    } catch {
      toast.error("حصل خطأ أثناء حذف الحساب");
    }
    setDeletingAccount(false);
    setConfirmDelete(false);
  };

  const avatarUrl = profile?.avatar_url;

  return (
    <DashboardLayout title="الإعدادات" subtitle="تحكم في إعدادات حسابك">
      <div className="max-w-3xl space-y-6">
        {/* Avatar & Account */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <h2 className="text-sm font-black text-foreground mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> الحساب
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="relative w-16 h-16 rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="صورة البروفايل" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full btn-gold flex items-center justify-center text-xl font-black">
                  {fullName?.[0] || user?.email?.[0]?.toUpperCase() || "م"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">صورة البروفايل</p>
              <p className="text-xs text-muted-foreground">اضغط للتغيير • حد أقصى 2MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">الإيميل</label>
              <input
                value={user?.email || ""}
                disabled
                className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">الاسم</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اكتب اسمك هنا"
                className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <button
              onClick={handleSaveName}
              disabled={saving || fullName === (profile?.full_name || user?.user_metadata?.full_name || "")}
              className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              حفظ التغييرات
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <h2 className="text-sm font-black text-foreground mb-5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> الإشعارات
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">إشعارات البريد الإلكتروني</div>
              <div className="text-xs text-muted-foreground">استلم إشعارات عن المنشورات المجدولة</div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                notifications ? "bg-primary" : "bg-surface-2 border border-border/50"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full transition-all ${
                  notifications ? "right-1 bg-primary-foreground" : "left-1 bg-muted-foreground"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Security — only for email/password users */}
        {!isGoogleUser && (
          <div className="glass-card gold-border rounded-2xl p-6">
            <h2 className="text-sm font-black text-foreground mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> تغيير كلمة السر
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">كلمة السر الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة سر جديدة (6 أحرف على الأقل)"
                  className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">تأكيد كلمة السر</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة السر"
                  className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword}
                className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                تغيير كلمة السر
              </button>
            </div>
          </div>
        )}

        {/* Danger zone */}
        <div className="glass-card rounded-2xl p-6 border border-destructive/20">
          <h2 className="text-sm font-black text-destructive mb-5 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> منطقة الخطر
          </h2>
          <p className="text-xs text-muted-foreground mb-3">حذف الحساب نهائياً — هذا الإجراء لا يمكن التراجع عنه</p>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="glass-card border border-destructive/30 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> حذف الحساب
            </button>
          ) : (
            <div className="glass-card border border-destructive/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-bold">هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه</span>
              </div>
              <p className="text-xs text-muted-foreground">سيتم حذف حسابك وكل المحتوى المحفوظ نهائياً</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="bg-destructive text-destructive-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-destructive/90 transition-colors disabled:opacity-60"
                >
                  {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  نعم، احذف حسابي
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
