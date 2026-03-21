import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Video, RefreshCw, Download, Upload, X, Wand2, 
  ImageIcon, Play, Clock, Volume2, Camera
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingAnnouncer, usePageTitle } from "@/components/AccessibilityHelpers";
import type { EdgeFunctionError } from "@/hooks/useEdgeFunction";

interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

interface StoryboardScene {
  id: string;
  sequence: number;
  cameraAngle: string;
  description: string;
  visualPrompt: string;
  duration: number;
  audioNote: string;
  image: ImageFile | null;
  isLoading: boolean;
  error: string | null;
}

const ASPECT_RATIOS = [
  { id: "9:16", label: "Portrait (9:16)", desc: "Reels / TikTok" },
  { id: "16:9", label: "Landscape (16:9)", desc: "YouTube" },
];

const ReelsMaker = () => {
  usePageTitle("مخرج الـ Storyboard");
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storyVision, setStoryVision] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [subjectImages, setSubjectImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingGrid, setIsGeneratingGrid] = useState(false);
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [gridImage, setGridImage] = useState<ImageFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`${file.name} أكبر من 10MB`);
            return null;
          }
          return new Promise<ImageFile>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1];
              resolve({ base64, mimeType: file.type, name: file.name });
            };
            reader.readAsDataURL(file);
          });
        })
      );
      const valid = uploaded.filter((f): f is ImageFile => f !== null);
      setSubjectImages((prev) => [...prev, ...valid]);
      setScenes([]);
      setGridImage(null);
    } catch {
      setError("فشل رفع الصور");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setSubjectImages((prev) => prev.filter((_, i) => i !== idx));
    setScenes([]);
    setGridImage(null);
  };

  const onCreatePlan = async () => {
    if (!storyVision.trim()) {
      setError("يرجى كتابة رؤية القصة");
      return;
    }

    setIsGeneratingPlan(true);
    setError(null);
    setScenes([]);
    setGridImage(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-storyboard", {
        body: { storyVision, subjectImages, aspectRatio },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.scenes || !Array.isArray(data.scenes)) throw new Error("فشل توليد الـ Storyboard");

      const storyboardScenes: StoryboardScene[] = data.scenes.map((scene: Record<string, string | number>, idx: number) => ({
        id: `scene-${idx}`,
        sequence: (scene.sequence as number) || idx + 1,
        cameraAngle: (scene.cameraAngle as string) || "",
        description: (scene.description as string) || "",
        visualPrompt: (scene.visualPrompt as string) || "",
        duration: (scene.duration as number) || 3,
        audioNote: (scene.audioNote as string) || "",
        image: null,
        isLoading: false,
        error: null,
      }));

      setScenes(storyboardScenes);
      toast.success("🎬 تم توليد الـ Storyboard — 9 مشاهد!");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "حدث خطأ";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const onGenerateSceneImage = async (sceneId: string) => {
    const idx = scenes.findIndex((s) => s.id === sceneId);
    if (idx === -1) return;

    setScenes((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], isLoading: true, error: null };
      return next;
    });

    try {
      const scene = scenes[idx];
      const { data, error: fnError } = await supabase.functions.invoke("generate-scene-image", {
        body: {
          visualPrompt: scene.visualPrompt,
          cameraAngle: scene.cameraAngle,
          subjectImages,
          aspectRatio,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.image) throw new Error("فشل توليد صورة المشهد");

      setScenes((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], image: data.image, isLoading: false };
        return next;
      });
      toast.success(`✨ تم توليد المشهد ${idx + 1}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "فشل توليد الصورة";
      setScenes((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], isLoading: false, error: errMsg };
        return next;
      });
      toast.error(errMsg);
    }
  };

  const handleDownload = (image: ImageFile, label: string) => {
    const link = document.createElement("a");
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    link.download = `moda-storyboard-${label}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  return (
    <DashboardLayout title="مخرج الـ Storyboard" subtitle="أنشئ storyboard سينمائي 9 مشاهد بالذكاء الاصطناعي">
      <div className="max-w-7xl space-y-6">
        {/* Control Panel */}
        <div className="glass-card gold-border rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Subject Images */}
            <div className="lg:w-1/4">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                صور المنتج / الموديل
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 bg-surface-2/50"
              >
                {subjectImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 p-3 w-full h-full">
                    {subjectImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={`data:${img.mimeType};base64,${img.base64}`}
                          alt={img.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ارفع صورة المنتج</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {/* Settings */}
            <div className="lg:w-3/4 space-y-5">
              {/* Aspect Ratio */}
              <div className="flex gap-3">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      aspectRatio === ar.id
                        ? "btn-gold"
                        : "glass-card border border-border/50 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <div className="font-bold">{ar.label}</div>
                    <div className="text-xs opacity-70">{ar.desc}</div>
                  </button>
                ))}
              </div>

              {/* Story Vision */}
              <div>
                <label className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4" /> رؤية القصة / سكريبت الإعلان
                </label>
                <textarea
                  value={storyVision}
                  onChange={(e) => setStoryVision(e.target.value)}
                  placeholder="مثال: روبوت مستقبلي بيستكشف حديقة سرية وبيكتشف وردة متوهجة. التركيز على الإضاءة السينمائية والعاطفة..."
                  className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors min-h-[100px] resize-none"
                />
              </div>

              {/* Generate Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onCreatePlan}
                  disabled={isGeneratingPlan || !storyVision.trim()}
                  className="flex-1 btn-gold py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPlan ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      جاري كتابة السيناريو...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      أنشئ Storyboard 9 مشاهد
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Timeline Stats */}
        {scenes.length > 0 && (
          <div className="glass-card gold-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-muted-foreground">عدد المشاهد:</span>{" "}
                <span className="text-primary font-bold">{scenes.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">المدة الإجمالية:</span>{" "}
                <span className="text-primary font-bold">{totalDuration} ثانية</span>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-muted-foreground bg-surface-2 px-3 py-1 rounded-full">
                {aspectRatio === "9:16" ? "Reels / TikTok" : "YouTube"}
              </span>
            </div>
          </div>
        )}

        {/* Scenes Grid */}
        {scenes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="glass-card gold-border rounded-2xl overflow-hidden flex flex-col group hover:border-primary/50 transition-all"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Image Area */}
                <div
                  className={`relative bg-surface-2 flex items-center justify-center overflow-hidden ${
                    aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"
                  }`}
                >
                  {scene.isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">جاري توليد المشهد...</span>
                    </div>
                  ) : scene.image ? (
                    <div className="w-full h-full relative group/img">
                      <img
                        src={`data:${scene.image.mimeType};base64,${scene.image.base64}`}
                        alt={`Scene ${scene.sequence}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleDownload(scene.image!, `scene-${scene.sequence}`)}
                          className="p-3 bg-primary text-primary-foreground rounded-full hover:scale-110 transition-transform"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onGenerateSceneImage(scene.id)}
                          className="p-3 bg-white/20 text-white rounded-full hover:scale-110 transition-transform border border-white/30"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-primary/50" />
                      </div>
                      <button
                        onClick={() => onGenerateSceneImage(scene.id)}
                        className="px-4 py-2 btn-gold rounded-full text-xs font-bold"
                      >
                        توليد المشهد
                      </button>
                    </div>
                  )}

                  {/* Scene Badge */}
                  <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary border border-primary/30">
                    SCENE {String(scene.sequence).padStart(2, "0")}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {scene.duration}s
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 flex-1">
                  <div>
                    <label className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Camera
                    </label>
                    <div className="text-sm font-medium text-foreground">{scene.cameraAngle}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      الوصف
                    </label>
                    <p className="text-sm text-muted-foreground leading-relaxed">{scene.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-2 rounded-lg px-3 py-2">
                    <Volume2 className="w-3 h-3 text-primary" />
                    <span>{scene.audioNote}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {scenes.length === 0 && !isGeneratingPlan && (
          <div className="glass-card gold-border rounded-2xl p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">مخرج الـ Storyboard السينمائي</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              اكتب رؤية القصة أو سكريبت الإعلان
              <br />
              وخلّي الذكاء الاصطناعي يبني لك storyboard بصري 9 مشاهد
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReelsMaker;
