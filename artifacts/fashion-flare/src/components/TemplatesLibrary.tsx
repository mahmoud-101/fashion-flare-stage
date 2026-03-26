import { useState, useMemo, useEffect } from "react";
import { Search, Copy, Check, Sparkles, Heart, Eye, X, Video, Pen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export type Template = {
  id: string;
  nameAr: string;
  category: string;
  occasion: string;
  platform: "instagram" | "tiktok" | "facebook" | "twitter";
  type: "caption" | "story" | "ad" | "reel_script";
  content: string;
  tips?: string;
  isNew?: boolean;
};

// ======= 60+ TEMPLATES =======
const templates: Template[] = [

  // ── رمضان (4) ──────────────────────────────────────────────────────
  {
    id: "r1", nameAr: "عرض رمضان كريم", category: "مناسبات", occasion: "رمضان",
    platform: "instagram", type: "caption",
    content: "🌙 رمضان كريم!\nخصم {discount}% على كل القطع الجديدة\nالعرض محدود — لا تفوّتها 🔥\n\n#رمضان #تخفيضات #فاشون #{brand}",
    tips: "استخدم الرقم الفعلي للخصم. أفضل وقت للنشر: بعد الإفطار بساعة."
  },
  {
    id: "r2", nameAr: "ستوري إفطار أنيق", category: "مناسبات", occasion: "رمضان",
    platform: "instagram", type: "story",
    content: "✨ إطلالة الإفطار لازم تكون مميزة\nاكتشف تشكيلتنا الجديدة\n🛒 اسحب لفوق",
    tips: "أضيف ستيكر الرابط لصفحة المنتج مباشرة."
  },
  {
    id: "r3", nameAr: "ريلز رمضان", category: "مناسبات", occasion: "رمضان",
    platform: "tiktok", type: "reel_script",
    content: "🎬 مشهد 1: منتج يظهر بإضاءة رمضانية دافئة (3 ثواني)\n🎬 مشهد 2: عارضة بإطلالة رمضانية أنيقة (4 ثواني)\n🎬 مشهد 3: عرض السعر مع خصم رمضان (3 ثواني)\n🎵 موسيقى: هادئة شرقية\n📝 نص الشاشة: 'رمضان أحلى مع {brand}'",
    tips: "استخدم فلاتر الإضاءة الدافئة. الريلز القصيرة (10-15 ثانية) تحصل على engagement أعلى."
  },
  {
    id: "r4", nameAr: "إعلان سحور ستايل", category: "مناسبات", occasion: "رمضان",
    platform: "facebook", type: "ad",
    content: "🌙 سحور بأناقة!\nتشكيلة رمضان وصلت 🎉\nقطع مريحة وأنيقة تناسب سهراتك\n\n✅ توصيل سريع\n✅ استبدال مجاني\n\n🛒 تسوّق الآن",
    tips: "اعرض الإعلان بين 2–5 صباحاً للوصول للجمهور في وقت السحور."
  },

  // ── العيد (5) ──────────────────────────────────────────────────────
  {
    id: "e1", nameAr: "عرض عيد الفطر", category: "مناسبات", occasion: "العيد",
    platform: "instagram", type: "caption",
    content: "🎉 كل عام وأنتم بخير!\nإطلالة العيد جاهزة؟ 👗\nخصم {discount}% على كل المجموعة\n\n#عيد_سعيد #فاشون #ستايل #{brand}",
    tips: "انشر قبل العيد بيومين للحصول على أعلى مبيعات."
  },
  {
    id: "e2", nameAr: "ستوري إطلالة العيد", category: "مناسبات", occasion: "العيد",
    platform: "instagram", type: "story",
    content: "🌸 إطلالة العيد من {brand}\nتشكيلة حصرية — كمية محدودة\n⬆️ اسحب لفوق للتسوق",
    tips: "أضيف صور المنتجات المتعددة في سلايدر ستوري."
  },
  {
    id: "e3", nameAr: "إعلان عيد الفطر", category: "مناسبات", occasion: "العيد",
    platform: "facebook", type: "ad",
    content: "عيد سعيد 🎊\nجهّز إطلالتك مع {brand}\n\n🎁 هدية مجانية مع كل طلب فوق 300 ر.س\n📦 توصيل خلال 24 ساعة\n\nتسوّق الآن 👇",
    tips: "الهدية المجانية تزيد AOV بشكل ملحوظ. وضّح ما هي الهدية في الصورة."
  },
  {
    id: "e4", nameAr: "ريلز لم شمل العيد", category: "مناسبات", occasion: "العيد",
    platform: "tiktok", type: "reel_script",
    content: "🎬 مشهد 1: عائلة بإطلالات عيد متناسقة (3 ث)\n🎬 مشهد 2: close-up على تفاصيل القطع (3 ث)\n🎬 مشهد 3: الأسعار + كود الخصم (4 ث)\n🎵 موسيقى: عيدية سعيدة\n📝 كابشن: 'إطلالة عيدية لكل العائلة 🌸'",
    tips: "المحتوى العائلي في العيد يحصل على shares عالية."
  },
  {
    id: "e5", nameAr: "كابشن عيد الأضحى", category: "مناسبات", occasion: "العيد",
    platform: "instagram", type: "caption",
    content: "🐑 عيد أضحى مبارك!\nتشكيلة {brand} الجديدة للعيد الكبير 🎊\n\nأناقتك في أبهى صورها\nخصم {discount}% — لمدة 48 ساعة فقط\n\n#عيد_الأضحى #فاشون #{brand}",
    tips: "استخدم صور بألوان دافئة تعبّر عن أجواء عيد الأضحى."
  },

  // ── بلاك فرايدي (4) ───────────────────────────────────────────────
  {
    id: "b1", nameAr: "إعلان بلاك فرايدي كبير", category: "عروض", occasion: "بلاك فرايدي",
    platform: "instagram", type: "caption",
    content: "🖤 BLACK FRIDAY\nأقوى عروض السنة وصلت! 🔥\nخصومات تصل لـ {discount}%\n\nالعرض لمدة محدودة ⏰\n\n#بلاك_فرايدي #تخفيضات #{brand}",
    tips: "استخدم countdown sticker في الستوري لخلق urgency."
  },
  {
    id: "b2", nameAr: "إعلان مدفوع بلاك فرايدي", category: "إعلانات", occasion: "بلاك فرايدي",
    platform: "facebook", type: "ad",
    content: "🖤 بلاك فرايدي = أكبر خصم في السنة\n\n⚡ خصم {discount}% على كل شيء\n🚚 شحن مجاني\n🔄 استرجاع مجاني\n\nالعرض ينتهي قريباً — تسوّق الآن!",
    tips: "ارفع الميزانية الإعلانية بنسبة 3x في البلاك فرايدي. RPM أعلى لكن ROI أفضل."
  },
  {
    id: "b3", nameAr: "ريلز بلاك فرايدي", category: "ريلز", occasion: "بلاك فرايدي",
    platform: "tiktok", type: "reel_script",
    content: "🎬 مشهد 1: شاشة سوداء + نص 'BLACK FRIDAY' (2 ث)\n🎬 مشهد 2: منتجات تظهر بسرعة واحد تلو الآخر (5 ث)\n🎬 مشهد 3: السعر قبل وبعد الخصم بشكل واضح (3 ث)\n🎬 مشهد 4: CTA — 'تسوّق الآن قبل ما تخلص' (2 ث)\n🎵 موسيقى: إيقاع سريع حماسي",
    tips: "الريلز تبدأ بشاشة سوداء تلفت الانتباه فوراً."
  },
  {
    id: "b4", nameAr: "ستوري عداد بلاك فرايدي", category: "عروض", occasion: "بلاك فرايدي",
    platform: "instagram", type: "story",
    content: "⏰ {hours} ساعة على انتهاء العرض!\n\n🖤 بلاك فرايدي — خصم {discount}%\n\nلا تفوّتها! 👇",
    tips: "استخدم countdown sticker الأصلي في انستقرام بدلاً من كتابة الساعات يدوياً."
  },

  // ── يومي / محتوى عام (6) ──────────────────────────────────────────
  {
    id: "d1", nameAr: "وصل حديثاً", category: "متجر", occasion: "يومي",
    platform: "instagram", type: "caption",
    content: "✨ وصل حديثاً!\nقطعة لازم تكون في دولابك 👗\n\nالسعر: {price} ر.س\n📦 توصيل لكل المدن\n\n#جديد #فاشون #ستايل #{brand}",
    tips: "أضف الرابط المباشر للمنتج في bio وأشر له في الكابشن."
  },
  {
    id: "d2", nameAr: "نصيحة ستايل", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption",
    content: "💡 نصيحة ستايل اليوم:\n{tip}\n\nأنتِ إيه رأيك؟ شاركينا في الكومنتات 👇\n\n#نصائح_ستايل #فاشون #{brand}",
    tips: "اجعل النصيحة عملية وقابلة للتطبيق. اطرح سؤالاً لزيادة التعليقات."
  },
  {
    id: "d3", nameAr: "سؤال تفاعلي", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "story",
    content: "🤔 أيهما تفضلين؟\n\nA) القطعة البيضاء\nB) القطعة السوداء\n\nصوّتي في الستوري! 🗳️",
    tips: "استخدم Poll sticker الأصلي في انستقرام لنتائج تفاعلية حقيقية."
  },
  {
    id: "d4", nameAr: "شهادة عميل", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption",
    content: "❤️ رأي عميلتنا {name}:\n\n\"{review}\"\n\nشكراً لثقتك الغالية! 🙏\n\n#آراء_العملاء #ثقة #{brand}",
    tips: "استأذن العميلة قبل النشر. صورة العميلة مع المنتج تضاعف التأثير."
  },
  {
    id: "d5", nameAr: "ريلز تنسيق يومي", category: "ريلز", occasion: "يومي",
    platform: "tiktok", type: "reel_script",
    content: "🎬 مشهد 1: قطعة واحدة على هانجر (2 ث)\n🎬 مشهد 2: طريقة تنسيق 1 — كاجوال (3 ث)\n🎬 مشهد 3: طريقة تنسيق 2 — رسمي (3 ث)\n🎬 مشهد 4: طريقة تنسيق 3 — سهرة (3 ث)\n🎵 موسيقى: ترند اليوم\n📝 نص: '3 طرق لتنسيق نفس القطعة 🔥'",
    tips: "ريلز التنسيق من أعلى محتوى في الفاشون من ناحية views."
  },
  {
    id: "d6", nameAr: "إعلان يومي", category: "إعلانات", occasion: "يومي",
    platform: "facebook", type: "ad",
    content: "👗 أناقتك تبدأ من هنا\n\nتشكيلة {brand} الجديدة متوفرة الآن\n\n✅ أقمشة عالية الجودة\n✅ تصاميم عصرية\n✅ أسعار مناسبة\n\n🛒 تسوّقي الآن واستمتعي بشحن مجاني",
    tips: "غيّر الصورة المصاحبة كل 3–5 أيام للحد من ad fatigue."
  },

  // ── اليوم الوطني (2) ──────────────────────────────────────────────
  {
    id: "n1", nameAr: "اليوم الوطني السعودي", category: "مناسبات", occasion: "اليوم الوطني",
    platform: "instagram", type: "caption",
    content: "🇸🇦 عروض اليوم الوطني!\nخصم 93% على قطع مختارة 💚\n\nلأن أناقتك جزء من فخرنا 🌟\n\n#اليوم_الوطني #السعودية_93 #هي_لنا_دار #{brand}",
    tips: "رقم 93 يرمز لعدد سنوات المملكة — خصصه حسب السنة الفعلية."
  },
  {
    id: "n2", nameAr: "ريلز اليوم الوطني", category: "مناسبات", occasion: "اليوم الوطني",
    platform: "tiktok", type: "reel_script",
    content: "🎬 مشهد 1: ألوان العلم السعودي + منتجات (3 ث)\n🎬 مشهد 2: إطلالات بالأخضر والأبيض (5 ث)\n🎬 مشهد 3: عرض خاص باليوم الوطني مع كود الخصم (3 ث)\n🎵 موسيقى: وطنية حماسية\n📝 نص: 'نحتفل معك 💚🇸🇦'",
    tips: "استخدم الهاشتاقات الوطنية السعودية الرائجة في ذلك اليوم."
  },

  // ── الصيف (3 كانت موجودة + نضيف المزيد بشكل موسع) ───────────────
  {
    id: "s1", nameAr: "تشكيلة الصيف", category: "مناسبات", occasion: "الصيف",
    platform: "instagram", type: "caption",
    content: "☀️ تشكيلة الصيف وصلت!\nألوان مشرقة وأقمشة خفيفة 🌴\n\nجاهزة للبحر والسفر؟ 🏖️\n\n#صيف #فاشون #ستايل_صيفي #{brand}",
    tips: "استخدم صور بضوء طبيعي في الخارج لتعكس أجواء الصيف."
  },
  {
    id: "s2", nameAr: "إعلان صيفي", category: "مناسبات", occasion: "الصيف",
    platform: "facebook", type: "ad",
    content: "🌞 صيفك أحلى مع {brand}\n\nقطع صيفية مريحة وأنيقة\n🏖️ تناسب البحر والسفر والسهرات\n\n✅ خصم 30% على أول طلب\n📦 توصيل مجاني\n\nتسوّقي الآن!",
    tips: "فعّل الإعلان مع بداية الإجازات المدرسية لأفضل نتائج."
  },

  // ────────────────────────────────────────────────────────────────
  // *** القوالب الجديدة — NEW ***
  // ────────────────────────────────────────────────────────────────

  // ── موسم الشتاء (4) ────────────────────────────────────────────
  {
    id: "win1", nameAr: "تشكيلة الشتاء", category: "مناسبات", occasion: "الشتاء",
    platform: "instagram", type: "caption", isNew: true,
    content: "🧥 تشكيلة الشتاء وصلت!\nدفء وأناقة في آنٍ واحد ✨\n\nجاكيتات • معاطف • بلايز صوف\nكلها من {brand} 🌬️\n\n#شتاء #فاشون #ستايل_شتوي #{brand}",
    tips: "أظهر القطع في بيئة شتوية — كافيه أو منتجع جبلي — لتعزيز الشعور الموسمي."
  },
  {
    id: "win2", nameAr: "ريلز لوك شتوي", category: "مناسبات", occasion: "الشتاء",
    platform: "tiktok", type: "reel_script", isNew: true,
    content: "🎬 مشهد 1: طقس ممطر أو بارد بالخارج (2 ث)\n🎬 مشهد 2: تفاصيل المعطف أو الجاكيت (3 ث)\n🎬 مشهد 3: الإطلالة الكاملة مع تنسيقات مختلفة (5 ث)\n🎬 مشهد 4: 'دفا بأناقة مع {brand}' + سعر (2 ث)\n🎵 موسيقى: هادئة كوزي",
    tips: "ريلز الشتاء تؤدي أفضل في أكتوبر–يناير."
  },
  {
    id: "win3", nameAr: "إعلان كوليكشن شتوي", category: "إعلانات", occasion: "الشتاء",
    platform: "facebook", type: "ad", isNew: true,
    content: "🧣 الشتاء جاي — هل دولابك جاهز؟\n\nتشكيلة الشتاء من {brand} وصلت! 🌬️\nمعاطف فاخرة • جاكيتات عصرية • كنزات أنيقة\n\n✅ توصيل مجاني فوق 200 ر.س\n🔄 استبدال مجاني 30 يوم\n\n🛒 تسوّق الآن قبل أن تنتهي الكميات",
    tips: "ابدأ إعلانات الشتاء مبكراً (سبتمبر–أكتوبر) لتحصد المبيعات في ذروة الموسم."
  },
  {
    id: "win4", nameAr: "ستوري أجواء شتوية", category: "مناسبات", occasion: "الشتاء",
    platform: "instagram", type: "story", isNew: true,
    content: "🍵 أجواء الشتاء مع {brand}\n\nاختاري لوكك الشتوي المفضل:\n❤️ المعطف الكلاسيكي\n💙 الجاكيت الكاجوال\n\nاستفسري عبر DM!",
    tips: "استخدم خاصية 'اسأليني' لتشجيع التفاعل الحقيقي."
  },

  // ── الخريف والربيع (4) ─────────────────────────────────────────
  {
    id: "aut1", nameAr: "كوليكشن الخريف", category: "مناسبات", occasion: "الخريف",
    platform: "instagram", type: "caption", isNew: true,
    content: "🍂 لوكات الخريف أحلى مع {brand}\n\nألوان دافئة + أقمشة ناعمة\nكاراميل • بني • كاكي • خردلي 🌿\n\n#خريف #ستايل #فاشون #{brand}",
    tips: "ألوان الخريف (ترنتش، بيج، خردلي) تحصل على أعلى saves في الخريف."
  },
  {
    id: "aut2", nameAr: "ريلز ألوان الخريف", category: "مناسبات", occasion: "الخريف",
    platform: "tiktok", type: "reel_script", isNew: true,
    content: "🎬 مشهد 1: باليت ألوان الخريف (2 ث)\n🎬 مشهد 2: قطع بألوان الخريف تتناغم مع بعض (5 ث)\n🎬 مشهد 3: إطلالة كاملة من الخريف (3 ث)\n🎵 موسيقى: هادئة aesthetic\n📝 نص: 'لوكات الخريف 🍂'",
    tips: "استخدم تأثيرات الألوان الدافئة في التصوير والتعديل."
  },
  {
    id: "spr1", nameAr: "تشكيلة الربيع", category: "مناسبات", occasion: "الربيع",
    platform: "instagram", type: "caption", isNew: true,
    content: "🌸 مرحباً بالربيع!\nتشكيلة جديدة بألوان زاهية ومنعشة 🌷\n\nوردي • فستقي • أزرق سماوي • ليلكي\n\n#ربيع #فاشون #pastel #{brand}",
    tips: "صور الربيع في أماكن خضراء أو بحضور أزهار لتعزيز الأجواء."
  },
  {
    id: "spr2", nameAr: "إعلان الربيع", category: "إعلانات", occasion: "الربيع",
    platform: "facebook", type: "ad", isNew: true,
    content: "🌸 الربيع = تجديد الدولاب!\n\nتشكيلة {brand} الربيعية وصلت\nألوان باستيل جميلة تناسب كل المناسبات\n\n✅ مقاسات XS حتى XXL\n✅ توصيل خلال يومين\n🔖 كود خصم: {code}\n\nتسوّقي الآن 🛒",
    tips: "كود الخصم يسهّل التتبع ويشجع على الإجراء الفوري."
  },

  // ── مناسبات دينية (6) ──────────────────────────────────────────
  {
    id: "rel1", nameAr: "المولد النبوي الشريف", category: "مناسبات", occasion: "المولد النبوي",
    platform: "instagram", type: "caption", isNew: true,
    content: "🌹 بمناسبة المولد النبوي الشريف\nكل عام وأمتنا بخير 🤍\n\n{brand} تهنئكم بهذه المناسبة المباركة\nنسأل الله أن يعمّ السلام والخير\n\n#المولد_النبوي #فرحة_المولد #{brand}",
    tips: "تجنب الترويج المباشر في هذه المناسبة. الإنسانية قبل التسويق."
  },
  {
    id: "rel2", nameAr: "اليوم الوطني الإماراتي", category: "مناسبات", occasion: "اليوم الوطني الإماراتي",
    platform: "instagram", type: "caption", isNew: true,
    content: "🇦🇪 كل عام والإمارات بخير!\nنحتفل مع أبطالنا في هذا اليوم المجيد 🌟\n\nخصم خاص باليوم الوطني: {discount}%\n\n#يوم_الوطني_الاماراتي #الإمارات_52 #{brand}",
    tips: "خصص الرقم حسب السنة. استخدم الألوان الحمراء والخضراء والبيضاء والسوداء."
  },
  {
    id: "rel3", nameAr: "اليوم الوطني الكويتي", category: "مناسبات", occasion: "اليوم الوطني الكويتي",
    platform: "instagram", type: "caption", isNew: true,
    content: "🇰🇼 عاشت الكويت!\nيوم وطني سعيد لكل الكويتيين 🌟\n\n{brand} تشاركك الاحتفال\nخصم وطني: {discount}%\n\n#اليوم_الوطني_الكويتي #{brand}",
    tips: "المحتوى الوطني يبني ارتباطاً عاطفياً قوياً مع جمهور ذلك البلد."
  },
  {
    id: "rel4", nameAr: "ذكرى اليوم الوطني البحريني", category: "مناسبات", occasion: "اليوم الوطني البحريني",
    platform: "instagram", type: "caption", isNew: true,
    content: "🇧🇭 عيد الاستقلال البحريني مبارك!\nنفخر بتواجدنا في مملكة البحرين 🌺\n\nعرض خاص: {discount}% خصم\n\n#البحرين #اليوم_الوطني_البحريني #{brand}",
    tips: "خصص المحتوى لكل سوق خليجي على حدة للحصول على engagement أعلى."
  },
  {
    id: "rel5", nameAr: "رأس السنة الهجرية", category: "مناسبات", occasion: "رأس السنة الهجرية",
    platform: "instagram", type: "caption", isNew: true,
    content: "🌙 عام هجري جديد مبارك!\nنسأل الله أن يكون عاماً مليئاً بالخير والبركة 🤲\n\n{brand} تهنئكم بمطلع العام الجديد\n\n#السنة_الهجرية_الجديدة #{brand}",
    tips: "محتوى تهنئة بدون ترويج مباشر يبني الثقة مع الجمهور."
  },
  {
    id: "rel6", nameAr: "اليوم الوطني القطري", category: "مناسبات", occasion: "اليوم الوطني القطري",
    platform: "instagram", type: "caption", isNew: true,
    content: "🇶🇦 عيد الوطني القطري المجيد!\nتحية لكل المقيمين والمواطنين في قطر الحبيبة 🌟\n\nخصم العيد الوطني: {discount}%\n\n#قطر #اليوم_الوطني_القطري #{brand}",
    tips: "المناسبات الوطنية في الخليج فرصة ذهبية لبناء ارتباط محلي."
  },

  // ── إطلاق منتج جديد (8) ───────────────────────────────────────
  {
    id: "pl1", nameAr: "تيزر قبل الإطلاق (48 ساعة)", category: "متجر", occasion: "إطلاق منتج",
    platform: "instagram", type: "caption", isNew: true,
    content: "👀 شيء جميل قادم...\n\n48 ساعة فقط ويصل إليك ✨\n\nهل خمّنت إيه هو؟ اكتب تخمينك في الكومنتات 👇\n\n#قريباً #ترقبوا #{brand}",
    tips: "الـ teaser content يبني الترقّب ويضاعف مشاركة الإطلاق. لا تكشف أي تفاصيل."
  },
  {
    id: "pl2", nameAr: "تيزر قبل 24 ساعة", category: "متجر", occasion: "إطلاق منتج",
    platform: "instagram", type: "story", isNew: true,
    content: "⏰ 24 ساعة على الإطلاق!\n\nحدّث التنبيهات لتكوني أول من يعرف 🔔\n\nلن تندمي... وعد 🤍",
    tips: "استخدم countdown sticker مع رابط الصفحة مسبقاً للسماح بالاشتراك في التنبيه."
  },
  {
    id: "pl3", nameAr: "يوم الإطلاق الرسمي", category: "متجر", occasion: "إطلاق منتج",
    platform: "instagram", type: "caption", isNew: true,
    content: "🎉 وصل أخيراً!\n{product_name} — من {brand}\n\nكنتوا تنتظرونها... وهي أحلى من توقعاتكم ✨\n\nالسعر: {price} ر.س\n🔗 الرابط في البايو\n\n#جديد #إطلاق #لازم_تحصلينها #{brand}",
    tips: "يوم الإطلاق يحتاج 3–5 بوستات بشكل مكثف. ابدئي من الصبح."
  },
  {
    id: "pl4", nameAr: "ريلز إطلاق المنتج", category: "متجر", occasion: "إطلاق منتج",
    platform: "tiktok", type: "reel_script", isNew: true,
    content: "🎬 مشهد 1: علبة التغليف تُفتح ببطء (3 ث)\n🎬 مشهد 2: المنتج يظهر لأول مرة (3 ث)\n🎬 مشهد 3: تفاصيل قريبة — جودة ونعومة القماش (4 ث)\n🎬 مشهد 4: الإطلالة الكاملة مع السعر (3 ث)\n🎵 موسيقى: dramatic reveal\n📝 نص: 'الكوليكشن الجديد هنا 🔥'",
    tips: "ريلز الـ unboxing والإطلاق تحصل على أعلى نسب مشاهدة في فئة الفاشون."
  },
  {
    id: "pl5", nameAr: "نفد المخزون — SOLD OUT", category: "متجر", occasion: "إطلاق منتج",
    platform: "instagram", type: "caption", isNew: true,
    content: "🚨 نفد المخزون!\n{product_name} نفدت في {hours} ساعة فقط!\n\nشكراً لثقتكم 🙏\nسنُعلن عن الدفعة الثانية قريباً 👀\n\nاشتركي في التنبيهات لتكوني أول من يعرف 🔔\n\n#{brand} #sold_out",
    tips: "SOLD OUT content يزيد الرغبة في الشراء للدفعة القادمة. لا تترددي في نشره."
  },
  {
    id: "pl6", nameAr: "عاد للمخزون — Back in Stock", category: "متجر", occasion: "إطلاق منتج",
    platform: "instagram", type: "caption", isNew: true,
    content: "🎉 عادت!\n{product_name} عادت للمخزون!\n\nكنتوا تطلبونها... ها هي 🙌\n⚠️ كميات محدودة جداً\n\n🛒 الرابط في البايو — تسوّقي الآن قبل أن تنفد\n\n#{brand} #back_in_stock",
    tips: "اشعلي urgency حقيقية فقط لو الكمية محدودة فعلاً. لا تكذبي على جمهورك."
  },
  {
    id: "pl7", nameAr: "إعلان إطلاق مدفوع", category: "إعلانات", occasion: "إطلاق منتج",
    platform: "facebook", type: "ad", isNew: true,
    content: "🚀 جديد! {product_name} من {brand}\n\nللمرة الأولى في السوق...\nتصميم {design_feature} + قماش {fabric}\n\n✅ متوفر بـ {colors_count} ألوان\n✅ توصيل خلال {delivery_days} أيام\n\nاطلبي الآن 👇",
    tips: "أعلانات الإطلاق تؤدي أفضل مع فيديو. خصص budget أعلى في الأسبوع الأول."
  },
  {
    id: "pl8", nameAr: "ستوري Pre-order", category: "متجر", occasion: "إطلاق منتج",
    platform: "instagram", type: "story", isNew: true,
    content: "🔖 Pre-order متاح الآن!\n\n{product_name} ستصلك قبل الجميع 📦\nسعر الـ Pre-order: {price} ر.س\n\n⬆️ اسحب لفوق للحجز",
    tips: "الـ Pre-order يعطيك سيولة مسبقة ويثبت الطلب قبل الإنتاج."
  },

  // ── التفاعل والمجتمع (8) ───────────────────────────────────────
  {
    id: "eng1", nameAr: "إعادة نشر UGC", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "😍 {customer_name} تبدو رائعة في {product_name}!\n\nنحب نشوف كيف تنسّقوا قطعنا 🤍\nشاركونا لوكاتكم بوسم {brand}\n\n#العميلة_الأميرة #ستايل #{brand}",
    tips: "اطلب الإذن دائماً قبل إعادة النشر. UGC يبني الثقة أكثر من أي إعلان."
  },
  {
    id: "eng2", nameAr: "تحدي الستايل", category: "تفاعل", occasion: "يومي",
    platform: "tiktok", type: "caption", isNew: true,
    content: "🎯 تحدي الستايل!\nأنسّقي قطعة {brand} بطريقتك الخاصة\nوسّمينا وسنعيد نشر أفضل لوك 🔥\n\nالفائزة ستحصل على {prize}\n\n#تحدي_الستايل #{brand}_challenge",
    tips: "Challenges يولّدون UGC مجاني. حدّد جائزة واضحة لتحفيز المشاركة."
  },
  {
    id: "eng3", nameAr: "هدية — Giveaway", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "🎁 هدية من {brand}!\n\nمجموعة قطع بقيمة {value} ر.س\nلك مجاناً 🎉\n\nللمشاركة:\n1️⃣ تابعي الحساب\n2️⃣ اعملي like لهذا البوست\n3️⃣ وسّمي صديقة في الكومنتات\n\n⏰ الإعلان بعد {days} أيام\n\n#هدية #giveaway #{brand}",
    tips: "الـ Giveaway يضاعف الفولوورز بسرعة لكن يجذب جمهور غير مستهدف أحياناً. استخدمه بحكمة."
  },
  {
    id: "eng4", nameAr: "سؤال This or That", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "story", isNew: true,
    content: "This or That؟ 🤔\n\nA) {option_a}\nB) {option_b}\n\nأيهما تختارين؟ صوّتي الآن! 🗳️",
    tips: "This or That يحصل على أعلى response rate بين أنواع التفاعل. نشريه يومياً."
  },
  {
    id: "eng5", nameAr: "سؤال AMA", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "story", isNew: true,
    content: "🙋‍♀️ اسأليني أي شيء!\n\nعن موضة هذا الموسم\nعن منتجاتنا\nعن {brand}\n\nاكتبي سؤالك 👇",
    tips: "AMA sessions تبني تواصلاً حقيقياً مع الجمهور. ردّي على كل الأسئلة."
  },
  {
    id: "eng6", nameAr: "Poll ستوري", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "story", isNew: true,
    content: "📊 نبي رأيك!\n\nهل تفضلين المقاسات {size_a} أو {size_b}؟\n\n🔵 {size_a}\n🔴 {size_b}",
    tips: "نتائج الـ Poll تعطيك بيانات حقيقية عن تفضيلات جمهورك — استخدميها في قرارات المنتج."
  },
  {
    id: "eng7", nameAr: "شارك إطلالتك", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "🌟 OOTD من {brand}\n\nإطلالة اليوم: {outfit_description} 👗✨\n\nما هو لوكك المفضل اليوم؟ شاركينا في الكومنتات!\n\n#OOTD #outfit_of_the_day #فاشون #{brand}",
    tips: "OOTD content يشجع العملاء على مشاركة لوكاتهم وإنشاء UGC."
  },
  {
    id: "eng8", nameAr: "كابشن ما وراء الكواليس", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "👀 خلف الكواليس!\n\nكيف يُصنع المنتج الذي تحبينه؟ 🧵✂️\n\nمن الفكرة → التصميم → الخامة → التنفيذ\nكل خطوة تُنجز بعناية وحب 🤍\n\n#behind_the_scenes #صُنع_باتقان #{brand}",
    tips: "Behind the scenes content يزيد الثقة بالعلامة التجارية ويُظهر القيمة الحقيقية."
  },

  // ── إعلانات متخصصة (8) ─────────────────────────────────────────
  {
    id: "adv1", nameAr: "إعلان كاروسيل — Carousel Ad", category: "إعلانات", occasion: "يومي",
    platform: "facebook", type: "ad", isNew: true,
    content: "بطاقة 1: '{product_1}' — {price_1} ر.س\nبطاقة 2: '{product_2}' — {price_2} ر.س\nبطاقة 3: '{product_3}' — {price_3} ر.س\nبطاقة 4: 'اكتشفي الكوليكشن كاملاً'\n\n📝 كابشن رئيسي:\n✨ من كوليكشن {brand} الجديد\nشحن مجاني على جميع الطلبات 📦",
    tips: "Carousel ads تحقق CTR أعلى بـ 10x من صور مفردة. كل بطاقة = منتج محدد."
  },
  {
    id: "adv2", nameAr: "سكريبت إعلان فيديو", category: "إعلانات", occasion: "يومي",
    platform: "tiktok", type: "reel_script", isNew: true,
    content: "⏱️ 0–3 ث: Hook — 'لو دولابك مليء بقطع ما تلبسيها...'\n⏱️ 3–8 ث: المشكلة — 'كل صباح نفس الحيرة!'\n⏱️ 8–13 ث: الحل — 'تشكيلة {brand} حلّت مشكلتي'\n⏱️ 13–17 ث: إثبات — عرض المنتجات والنتائج\n⏱️ 17–20 ث: CTA — 'الرابط في البايو — توصيل مجاني'\n🎵 موسيقى: energetic",
    tips: "أفضل طول للإعلانات المدفوعة على TikTok هو 15–21 ثانية. ابدأ بـ hook قوية."
  },
  {
    id: "adv3", nameAr: "إعلان Retargeting — زوار المتجر", category: "إعلانات", occasion: "يومي",
    platform: "facebook", type: "ad", isNew: true,
    content: "😊 لاحظنا اهتمامك!\n\nعدتِ لنشوف {product_name}؟ نحن هنا 💛\n\nقطعتك المفضلة لا تزال متوفرة\n🎁 خصم إضافي {discount}% لكِ خصيصاً\n\n⏰ العرض ينتهي خلال 24 ساعة\n\n🛒 اطلبيها الآن",
    tips: "Retargeting ads لمن زاروا المنتج بدون شراء — conversion rate أعلى بكثير من cold audience."
  },
  {
    id: "adv4", nameAr: "إعلان Lookalike — جمهور مشابه", category: "إعلانات", occasion: "يومي",
    platform: "facebook", type: "ad", isNew: true,
    content: "👗 لو كنتِ تحبين الأناقة البسيطة...\n\nأنتِ بالتأكيد ستحبين {brand} 💛\n\nتشكيلات عصرية تناسب المرأة العربية\n✅ قماش عالي الجودة\n✅ قصّات مريحة وأنيقة\n✅ أسعار معقولة\n\nاكتشفي الكوليكشن 👇",
    tips: "Lookalike 1% من قاعدة العملاء الحاليين = أفضل audience ممكن لكسب عملاء جدد."
  },
  {
    id: "adv5", nameAr: "إعلان مع Social Proof", category: "إعلانات", occasion: "يومي",
    platform: "facebook", type: "ad", isNew: true,
    content: "+{count} عميلة تثق بـ {brand} ⭐⭐⭐⭐⭐\n\n\"{review_text}\"\n— {customer_name}\n\nانضمي لعائلة {brand} اليوم\n🛒 تسوّقي الآن وانضمي للأسرة",
    tips: "الإعلانات بشهادات حقيقية تحصل على CTR أعلى بـ 300%. استخدمي تقييمات حقيقية فقط."
  },
  {
    id: "adv6", nameAr: "إعلان بعرض محدود", category: "إعلانات", occasion: "يومي",
    platform: "facebook", type: "ad", isNew: true,
    content: "⚡ عرض يوم واحد فقط!\n\n{product_name} بخصم {discount}%\nالسعر كان: {old_price} ر.س\nاليوم فقط: {new_price} ر.س\n\n⏰ العرض ينتهي في منتصف الليل\n📦 شحن مجاني\n🔄 استرجاع مجاني\n\nاطلبي الآن قبل أن ينتهي العرض 👇",
    tips: "Flash sales تخلق urgency حقيقية. لا تمددي العرض لأنه يُفقد المصداقية."
  },
  {
    id: "adv7", nameAr: "إعلان Bundle — باقة منتجات", category: "إعلانات", occasion: "يومي",
    platform: "instagram", type: "ad", isNew: true,
    content: "💝 اجمعيها ووفّري!\n\nباقة {bundle_name} من {brand}:\n• {item_1}\n• {item_2}\n• {item_3}\n\nبدل {original_price} ر.س\nبـ {bundle_price} ر.س فقط 🎊\n\nوفّري {saving} ر.س دفعة واحدة!",
    tips: "Bundle offers ترفع AOV بمعدل 35%. اربطي قطعاً متناسقة مع بعض."
  },
  {
    id: "adv8", nameAr: "إعلان Dynamic Product", category: "إعلانات", occasion: "يومي",
    platform: "facebook", type: "ad", isNew: true,
    content: "🛍️ اكتشفي ما يناسبك من {brand}\n\nآلاف المنتجات تنتظرك\nكل يوم وصولات جديدة ✨\n\n🔍 ابحثي عن {category}\n✅ شحن لجميع الدول الخليجية\n\n👗 تسوّقي الآن",
    tips: "استخدمي Dynamic Ads في Facebook Business Manager لاستهداف مستخدمين بمنتجات رأوها مسبقاً."
  },

  // ── المتجر الإلكتروني (6) ───────────────────────────────────────
  {
    id: "str1", nameAr: "وصول جديد — سلة وشوبفاي", category: "متجر", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "🛍️ وصول جديد على متجرنا!\n\nكوليكشن {collection_name} متوفر الآن على سلة 🛒\n\n• {item_1} — {price_1} ر.س\n• {item_2} — {price_2} ر.س\n• {item_3} — {price_3} ر.س\n\n📦 توصيل سريع لجميع المدن\n🔗 الرابط في البايو",
    tips: "اذكري المتجر (سلة/شوبفاي) لبناء المصداقية. أضيفي رابط المتجر مباشرة في البايو."
  },
  {
    id: "str2", nameAr: "تخفيض سعر تلقائي", category: "متجر", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "📉 خفّضنا السعر!\n\n{product_name} كان: {old_price} ر.س\nالآن: {new_price} ر.س\n\nالتخفيض مؤقت — لا تترددي! ⏰\n🛒 الرابط في البايو\n\n#{brand} #تخفيض #فرصة",
    tips: "إعلانات تخفيض السعر تحصل على أعلى نسب تحويل. كوني صريحة بسبب التخفيض."
  },
  {
    id: "str3", nameAr: "نفاد مخزون قريباً", category: "متجر", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "⚠️ {product_name} — {count} قطعة فقط تبقّت!\n\nلو كنتِ تفكرين فيها... الوقت الآن 👆\n\n🛒 تسوّقي قبل أن تنتهي\nالرابط في البايو\n\n#{brand} #آخر_قطع",
    tips: "Scarcity messaging يزيد conversion بنسبة 200%. استخدميه بصدق فقط."
  },
  {
    id: "str4", nameAr: "تتبع الشحن", category: "متجر", occasion: "يومي",
    platform: "instagram", type: "story", isNew: true,
    content: "📦 طلبك في الطريق إليك!\n\nيمكنك تتبع شحنتك عبر:\n{tracking_link}\n\nسعيدون بخدمتك دائماً 💛\n{brand}",
    tips: "محتوى ما بعد الشراء يبني ولاء العميل ويشجع على الشراء مرة أخرى."
  },
  {
    id: "str5", nameAr: "كود خصم خاص للمتابعين", category: "متجر", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "🎁 هدية خاصة لمتابعينا!\n\nكود خصم {discount}% حصري:\n✏️ {coupon_code}\n\nيُستخدم مرة واحدة لكل عميلة\nصالح حتى {expiry_date}\n\n🛒 تسوّقي الآن واستخدمي الكود عند الدفع",
    tips: "الأكواد الخاصة للمتابعين تزيد loyalty وتمنح شعوراً بالامتياز."
  },
  {
    id: "str6", nameAr: "تقييم المنتج بعد الشراء", category: "متجر", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "⭐⭐⭐⭐⭐\n\nعميلتنا الجميلة {name} تحكي عن تجربتها:\n\n\"{review}\"\n\nشكراً لتقييمك الرائع 💛\n\nشاركي تجربتك أنتِ أيضاً — راسلينا عبر DM 📩\n\n#{brand} #تقييم #رأي_العميل",
    tips: "اطلبي التقييمات بعد 5–7 أيام من الاستلام. قدّمي حافزاً صغيراً كهدية بالتقييم."
  },

  // ── ما وراء الكواليس (6) ───────────────────────────────────────
  {
    id: "bts1", nameAr: "قصة البراند", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "✨ قصتنا\n\nبدأنا {brand} من {year} بحلم بسيط:\nأن تجد كل امرأة عربية ستايلها الخاص 💛\n\nاليوم نفخر بخدمة {count}+ عميلة\nونعدكم بالاستمرار في تقديم الأفضل\n\nشكراً لكل من ثقت بنا 🤍\n\n#قصتنا #{brand}",
    tips: "Brand story content يحصل على أعلى save rate. تكوني صادقة وشخصية."
  },
  {
    id: "bts2", nameAr: "تعرفي على الفريق", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "👋 تعرفي على فريق {brand}!\n\n{team_member_name} — {role}\n\"{quote}\"\n\nخلف كل منتج رائع... فريق يعمل بشغف 💪\n\n#الفريق #TeamWork #{brand}",
    tips: "Meet the team content يُنسّن البراند ويبني ارتباطاً عاطفياً مع الجمهور."
  },
  {
    id: "bts3", nameAr: "عملية التغليف", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "📦 كيف نُغلّف طلباتكم؟\n\nكل طلب عندنا يُعامَل كهدية ثمينة 🎀\n\n• ورق التغليف الأنيق\n• ريبون {brand} الخاص\n• كرت شكر مكتوب يدوياً\n• طيّة عناية بالقطعة\n\nلأن أنتِ تستحقين أكثر من مجرد منتج 💛\n\n#تغليف #packaging #{brand}",
    tips: "Packaging content يُثير excitement للشراء. صوّري Unboxing experience بشكل احترافي."
  },
  {
    id: "bts4", nameAr: "عملية تصميم المنتج", category: "تفاعل", occasion: "يومي",
    platform: "tiktok", type: "reel_script", isNew: true,
    content: "🎬 مشهد 1: ورق رسم وأقلام — الفكرة الأولى (3 ث)\n🎬 مشهد 2: اختيار الأقمشة والألوان (3 ث)\n🎬 مشهد 3: الباترون والتفصيل (3 ث)\n🎬 مشهد 4: المنتج النهائي الجميل (3 ث)\n🎵 موسيقى: إبداعية هادئة\n📝 نص: 'من فكرة إلى واقع 🎨'",
    tips: "Design process ريلز من أعلى محتوى في saves و shares في فئة الفاشون."
  },
  {
    id: "bts5", nameAr: "يوم التصوير", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "📸 يوم تصوير كوليكشن {collection_name}!\n\nساعات من الإعداد لثوانٍ من الكمال ✨\n\nسؤال: أيهما يثير اهتمامك أكثر?\nالصورة النهائية أم ما خلف الكواليس؟\n\nأخبرينا في الكومنتات 👇\n\n#يوم_تصوير #BTS #{brand}",
    tips: "BTS content يُظهر الجهد المبذول مما يُبرر السعر ويزيد الاحترام للبراند."
  },
  {
    id: "bts6", nameAr: "إنتاج المنسوجات والأقمشة", category: "تفاعل", occasion: "يومي",
    platform: "instagram", type: "caption", isNew: true,
    content: "🧵 نختار لكِ الأفضل فقط!\n\nأقمشتنا تأتي من:\n🇮🇹 {origin} — {fabric_name}\nمحاك بعناية لضمان:\n✅ نعومة استثنائية\n✅ متانة تدوم سنوات\n✅ مقاومة الغسيل المتكرر\n\nجودة تستحق أن تُعاش 💛\n\n#{brand} #جودة #قماش",
    tips: "محتوى الجودة والخامة يبرر السعر الأعلى ويُقنع العملاء المترددين."
  },
];

// ======= CONFIG =======
const TABS = [
  { key: "all", label: "كل القوالب" },
  { key: "مناسبات", label: "المناسبات" },
  { key: "إعلانات", label: "الإعلانات" },
  { key: "ريلز", label: "الريلز" },
  { key: "تفاعل", label: "التفاعل" },
  { key: "متجر", label: "المتجر" },
  { key: "عروض", label: "العروض" },
];

const PLATFORMS = ["الكل", "instagram", "tiktok", "facebook"];
const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  twitter: "Twitter/X",
};
const TYPE_LABELS: Record<string, string> = {
  caption: "كابشن",
  story: "ستوري",
  ad: "إعلان",
  reel_script: "ريلز",
};
const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-400 bg-pink-400/10",
  tiktok: "text-cyan-400 bg-cyan-400/10",
  facebook: "text-blue-400 bg-blue-400/10",
  twitter: "text-sky-400 bg-sky-400/10",
};
const TYPE_COLORS: Record<string, string> = {
  caption: "text-primary bg-primary/10",
  story: "text-violet-400 bg-violet-400/10",
  ad: "text-amber-400 bg-amber-400/10",
  reel_script: "text-green-400 bg-green-400/10",
};

const FAVORITES_KEY = "fashion_flare_fav_templates";

interface TemplatesLibraryProps {
  onSelect?: (template: Template) => void;
}

export function TemplatesLibrary({ onSelect }: TemplatesLibraryProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [platform, setPlatform] = useState("الكل");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showFavOnly, setShowFavOnly] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  const saveFavorites = (favs: string[]) => {
    setFavorites(favs);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); } catch {}
  };

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    saveFavorites(next);
  };

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (showFavOnly && !favorites.includes(t.id)) return false;
      if (activeTab !== "all" && t.category !== activeTab) return false;
      if (platform !== "الكل" && t.platform !== platform) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.nameAr.includes(search) && !t.content.includes(search) && !t.occasion.includes(search)) return false;
      }
      return true;
    });
  }, [search, activeTab, platform, favorites, showFavOnly]);

  const handleCopy = (template: Template, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    toast({ title: "تم النسخ ✅", description: "القالب تم نسخه للحافظة" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseInWriter = (template: Template) => {
    if (onSelect) {
      onSelect(template);
    } else {
      navigate("/dashboard/writer", { state: { prefill: template.content } });
    }
    setPreviewTemplate(null);
  };

  const handleUseInReels = (template: Template) => {
    navigate("/dashboard/reels", { state: { prefill: template.content } });
    setPreviewTemplate(null);
  };

  return (
    <div className="space-y-4" dir="rtl">

      {/* Search + Fav toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث في القوالب... (اسم أو محتوى أو مناسبة)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-surface-2 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition"
          />
        </div>
        <button
          onClick={() => setShowFavOnly(v => !v)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFavOnly
              ? "bg-red-500/15 border-red-500/30 text-red-400"
              : "glass-card border-border/50 text-muted-foreground hover:text-foreground"
          }`}
          title="المفضلة"
        >
          <Heart className={`w-4 h-4 ${showFavOnly ? "fill-red-400" : ""}`} />
        </button>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "btn-gold"
                : "glass-card border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Platform filter */}
      <div className="flex gap-1.5 flex-wrap">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              platform === p
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p === "الكل" ? "كل المنصات" : PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {filtered.length} قالب {search ? "مطابق للبحث" : ""}
        </span>
        <span className="text-xs text-muted-foreground/60">
          {favorites.length > 0 && `${favorites.length} في المفضلة`}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          لم يتم العثور على قوالب. جرّبي كلمة بحث مختلفة.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(template => (
            <div
              key={template.id}
              className="glass-card border border-border/40 rounded-xl p-4 hover:border-primary/30 transition-all group cursor-pointer"
              onClick={() => setPreviewTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground truncate">{template.nameAr}</span>
                    {template.isNew && (
                      <span className="text-[9px] font-bold bg-green-400/15 text-green-400 border border-green-400/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        جديد
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[template.type]}`}>
                      {TYPE_LABELS[template.type]}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[template.platform]}`}>
                      {PLATFORM_LABELS[template.platform]}
                    </span>
                    <span className="text-[10px] bg-surface-2 text-muted-foreground px-1.5 py-0.5 rounded-full">
                      {template.occasion}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(template.id); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      favorites.includes(template.id)
                        ? "text-red-400 bg-red-400/10"
                        : "text-muted-foreground hover:text-red-400 bg-surface-2"
                    }`}
                    title="حفظ في المفضلة"
                  >
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(template.id) ? "fill-red-400" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => handleCopy(template, e)}
                    className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    title="نسخ"
                  >
                    {copiedId === template.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}
                    className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary hover:bg-primary/25 transition-colors"
                    title="معاينة"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-2 max-h-20 overflow-hidden font-sans">
                {template.content}
              </pre>
              <div className="mt-2 h-4 flex items-end">
                <span className="text-[10px] text-muted-foreground/40 group-hover:text-primary/50 transition-colors">
                  اضغطي للمعاينة الكاملة ←
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="glass-card gold-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground">{previewTemplate.nameAr}</h3>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[previewTemplate.type]}`}>
                    {TYPE_LABELS[previewTemplate.type]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PLATFORM_COLORS[previewTemplate.platform]}`}>
                    {PLATFORM_LABELS[previewTemplate.platform]}
                  </span>
                  <span className="text-xs bg-surface-2 text-muted-foreground px-2 py-0.5 rounded-full">
                    {previewTemplate.occasion}
                  </span>
                  {previewTemplate.isNew && (
                    <span className="text-xs font-bold bg-green-400/15 text-green-400 border border-green-400/20 px-2 py-0.5 rounded-full">
                      جديد
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 mr-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="bg-surface-2/50 rounded-xl p-4 mb-4 border border-border/30">
              <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                {previewTemplate.content}
              </pre>
            </div>

            {/* Tips */}
            {previewTemplate.tips && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 mb-4">
                <div className="text-xs font-bold text-primary mb-1">💡 نصيحة الاستخدام</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{previewTemplate.tips}</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleCopy(previewTemplate)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  copiedId === previewTemplate.id
                    ? "bg-green-400/15 text-green-400 border border-green-400/20"
                    : "glass-card border border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {copiedId === previewTemplate.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === previewTemplate.id ? "تم النسخ!" : "نسخ"}
              </button>
              <button
                onClick={() => handleUseInWriter(previewTemplate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium btn-gold transition-all"
              >
                <Pen className="w-3.5 h-3.5" />
                استخدم في الكاتب
              </button>
              {previewTemplate.type === "reel_script" && (
                <button
                  onClick={() => handleUseInReels(previewTemplate)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-green-400/15 text-green-400 border border-green-400/20 hover:bg-green-400/25 transition-all"
                >
                  <Video className="w-3.5 h-3.5" />
                  استخدم في الريلز
                </button>
              )}
              <button
                onClick={() => toggleFavorite(previewTemplate.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  favorites.includes(previewTemplate.id)
                    ? "bg-red-400/15 text-red-400 border border-red-400/20"
                    : "glass-card border border-border/50 text-muted-foreground hover:text-red-400"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favorites.includes(previewTemplate.id) ? "fill-red-400" : ""}`} />
                {favorites.includes(previewTemplate.id) ? "من المفضلة" : "حفظ في المفضلة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
