import { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Clock, Bell, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';

interface FeatureMeta {
  title: string;
  description: string;
  icon: string;
  launchDate: string;
  perks: string[];
}

const FEATURE_META: Record<string, FeatureMeta> = {
  reels: {
    title: 'صانع الريلز',
    description: 'أنشئ سكريبتات وأفكار ريلز احترافية بالذكاء الاصطناعي، مخصصة لجمهورك وهويتك البصرية.',
    icon: '🎬',
    launchDate: 'الربع الثالث 2025',
    perks: [
      'سكريبتات ريلز جاهزة للتصوير',
      'أفكار موسيقى وترندات مناسبة',
      'جدولة تلقائية للنشر',
      'تحليل أداء الريلز',
    ],
  },
  'sketch-to-image': {
    title: 'رسم للصورة',
    description: 'حوّل رسمتك أو مخططك البسيط إلى صورة احترافية عالية الجودة بضغطة زر.',
    icon: '✏️',
    launchDate: 'الربع الثالث 2025',
    perks: [
      'تحويل رسومات بسيطة لصور احترافية',
      'أنماط تصميم متعددة',
      'حفظ مباشر لمكتبة المحتوى',
      'دعم أبعاد متعددة',
    ],
  },
  'face-swap': {
    title: 'تبديل الوجوه',
    description: 'ضع وجهك أو وجه موديلك على صور المنتجات والإعلانات بدقة عالية.',
    icon: '🪄',
    launchDate: 'الربع الرابع 2025',
    perks: [
      'دقة عالية في التطبيق',
      'دعم صور متعددة دفعة واحدة',
      'معالجة الإضاءة والظلال تلقائياً',
      'خصوصية تامة — لا نحتفظ بالصور',
    ],
  },
  'virtual-tryon': {
    title: 'تجربة الملابس افتراضياً',
    description: 'أظهر منتجاتك على موديلات افتراضية متنوعة دون الحاجة لجلسة تصوير.',
    icon: '👗',
    launchDate: 'الربع الرابع 2025',
    perks: [
      'موديلات بأجسام وأحجام متنوعة',
      'دعم جميع أنواع الملابس',
      'إضاءة وخلفيات احترافية',
      'تصدير بجودة عالية للإعلانات',
    ],
  },
};

const ComingSoonPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const feature = location.pathname.split('/dashboard/')[1] ?? 'reels';
  const meta = FEATURE_META[feature] ?? FEATURE_META.reels;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const handleNotify = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await db.from('feature_waitlist').upsert(
        { user_id: user.id, email: user.email, feature_name: feature },
        { onConflict: 'user_id,feature_name' }
      );
      setNotified(true);
      toast.success('تم تسجيلك! هنبلغك فور إطلاق الميزة 🎉');
    } catch {
      toast.error('حصلت مشكلة. جرب تاني.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title={meta.title}>
      <div className="min-h-[70vh] flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="text-8xl leading-none">{meta.icon}</div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium">
              <Clock className="w-4 h-4" />
              قريباً — {meta.launchDate}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{meta.title}</h1>
            <p className="text-muted-foreground text-base leading-relaxed">{meta.description}</p>
          </div>

          <div className="glass-card rounded-2xl p-5 text-right space-y-3">
            <p className="text-sm font-semibold text-foreground mb-3">ستحصل على:</p>
            {meta.perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">{perk}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {notified ? (
              <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
                <CheckCircle className="w-5 h-5" />
                تم التسجيل — هنبلغك فور الإطلاق
              </div>
            ) : (
              <Button
                onClick={handleNotify}
                disabled={loading || !user}
                className="btn-gold w-full gap-2"
              >
                <Bell className="w-4 h-4" />
                {loading ? 'جاري التسجيل...' : 'أبلغني عند الإطلاق'}
              </Button>
            )}
            <Link to="/dashboard">
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
                <ArrowRight className="w-4 h-4" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ComingSoonPage;
