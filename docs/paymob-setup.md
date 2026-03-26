# إعداد PayMob للدفع الآلي

## المتطلبات

1. حساب PayMob على https://accept.paymob.com
2. تفعيل الـ integrations المطلوبة (بطاقة + فودافون كاش)

## المتغيرات البيئية المطلوبة

أضف هذه المتغيرات كـ Supabase Secrets من لوحة التحكم:

```
PAYMOB_API_KEY       → من لوحة PayMob > Settings > API Key
PAYMOB_INTEGRATION_ID → من لوحة PayMob > Integrations > Card Payment > Integration ID
PAYMOB_IFRAME_ID     → من لوحة PayMob > Integrations > Card Payment > iFrame ID  
PAYMOB_HMAC_SECRET   → من لوحة PayMob > Settings > HMAC Secret Key
```

## إضافة المتغيرات في Supabase

```bash
supabase secrets set PAYMOB_API_KEY=your_key_here
supabase secrets set PAYMOB_INTEGRATION_ID=123456
supabase secrets set PAYMOB_IFRAME_ID=123456
supabase secrets set PAYMOB_HMAC_SECRET=your_hmac_secret
```

## نشر الـ Edge Functions

```bash
supabase functions deploy create-paymob-order
supabase functions deploy paymob-webhook
supabase functions deploy check-subscription
```

## إعداد Webhook في PayMob

في لوحة PayMob > Settings > Webhooks:
- أضف URL: `https://[your-project].supabase.co/functions/v1/paymob-webhook`
- HTTP Method: POST

## تطبيق Migration

```bash
supabase db push
```

أو من Supabase Dashboard > SQL Editor، الصق محتوى `supabase/migrations/20240101000001_subscriptions.sql`

## الفعالية بدون PayMob (وضع يدوي)

لو لم تُضف مفاتيح PayMob بعد، الموقع يعمل في **وضع الدفع اليدوي**:
- المستخدم يختار الخطة
- يدفع عبر فودافون كاش أو إنستاباي يدوياً  
- يرسل رقم المرجع عبر واتساب
- أنت تُفعّل الخطة يدوياً من Supabase Dashboard

## تفعيل اشتراك يدوياً (من Supabase Dashboard)

```sql
-- تفعيل خطة pro لمستخدم معين
INSERT INTO public.subscriptions (user_id, plan, status, starts_at, expires_at, amount)
VALUES (
  'USER_ID_HERE',
  'pro',
  'active',
  now(),
  now() + interval '30 days',
  400
);
```
