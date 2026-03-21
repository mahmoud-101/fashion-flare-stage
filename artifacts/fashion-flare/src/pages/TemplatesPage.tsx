import DashboardLayout from "@/components/DashboardLayout";
import { TemplatesLibrary } from "@/components/TemplatesLibrary";
import { usePageTitle } from "@/components/AccessibilityHelpers";
import { useNavigate } from "react-router-dom";

const TemplatesPage = () => {
  usePageTitle("قوالب المحتوى");
  const navigate = useNavigate();

  return (
    <DashboardLayout title="قوالب المحتوى" subtitle="قوالب جاهزة لكل مناسبة — انسخ وعدّل وانشر">
      <div className="max-w-4xl">
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
