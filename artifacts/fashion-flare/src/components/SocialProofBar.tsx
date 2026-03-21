import { Shield, Zap, Award, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { icon: Shield, text: "بدون بيانات بنكية" },
  { icon: Zap, text: "نتائج في ثوانٍ" },
  { icon: Award, text: "متخصص في الفاشون العربي" },
  { icon: Users, text: "دعم واتساب بالعربي" },
  { icon: Sparkles, text: "ذكاء اصطناعي متقدم" },
];

const SocialProofBar = () => (
  <section className="py-5 border-y border-border/20 overflow-hidden relative">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...items, ...items, ...items, ...items].map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="flex items-center gap-2 text-muted-foreground mx-8 shrink-0">
            <Icon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium">{item.text}</span>
          </div>
        );
      })}
    </div>
  </section>
);

export default SocialProofBar;
