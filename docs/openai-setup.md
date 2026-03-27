# إعداد مفتاح OpenAI في Supabase

## خطوة واحدة فقط: أضف المفتاح في لوحة تحكم Supabase

1. افتح مشروعك على [app.supabase.com](https://app.supabase.com)
2. من القائمة الجانبية → **Settings** → **Functions** → **Secrets**
3. اضغط **Add secret**
4. الاسم: `OPENAI_API_KEY`
5. القيمة: مفتاحك الذي يبدأ بـ `sk-`
6. اضغط **Save**

## نشر الـ Edge Functions (بعد إضافة المفتاح)

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref icjwbjeoremieofbiinb

# نشر جميع الوظائف
supabase functions deploy
```

## الوظائف المضافة (15 وظيفة)

### الوظائف الأساسية (Task #7)
| الوظيفة | الأداة | النموذج |
|---------|--------|---------|
| generate-campaign-plan | كاتب المحتوى AI | GPT-4o |
| generate-campaign-images | استوديو الصور + المحتوى | DALL-E 3 |
| generate-content | الهاشتاجات + A/B Testing | GPT-4o-mini |
| analyze-competitor | تحليل المنافس | GPT-4o Vision |
| generate-ad-creative | مولّد الإعلانات | DALL-E 3 |
| generate-storyboard | صانع الريلز | GPT-4o-mini |
| generate-scene-image | صور مشاهد الريلز | DALL-E 3 |
| score-ad | تقييم الإعلان | GPT-4o-mini |
| caption-variations | نسخ الكابشن | GPT-4o-mini |
| analyze-style | تحليل الستايل | GPT-4o Vision |

### أدوات الذكاء البصري (Task #8)
| الوظيفة | الأداة | النموذج |
|---------|--------|---------|
| face-swap | تبديل الوجوه Face Swap | GPT-4o Vision + DALL-E 3 HD |
| virtual-try-on | التجربة الافتراضية | GPT-4o Vision + DALL-E 3 HD |
| upscale-image | تكبير الصور AI Upscaler | GPT-4o Vision + DALL-E 3 HD |
| sketch-to-image | تحويل السكتش لصورة | GPT-4o Vision + DALL-E 3 HD |

#### آلية عمل الأدوات البصرية
كل أداة بصرية تعمل بمرحلتين:
1. **GPT-4o Vision** — يحلل الصورة/الصور ويولّد وصفاً دقيقاً
2. **DALL-E 3 HD** — يولّد الصورة النهائية بجودة عالية

جميع الوظائف:
- تستقبل صور كـ Data URLs (مع prefix `data:image/...;base64,`)
- ترجع `{ resultImage: "data:image/png;base64,..." }`
- تحتوي على رسائل خطأ عربية واضحة
- تدعم CORS لجميع النطاقات
