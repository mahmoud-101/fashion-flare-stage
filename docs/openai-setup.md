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

## الوظائف المضافة (11 وظيفة)

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
