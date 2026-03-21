import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingBag, Plus, RefreshCw, CheckCircle2, Package, ExternalLink, X, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SallaProduct {
  id: number;
  name: string;
  sku: string | null;
  price: { amount: number; currency: string };
  status: string;
  image?: { url: string } | null;
  thumbnail?: string | null;
}

interface StoreInfo {
  name: string;
  domain: string;
  description: string;
  avatar?: string;
}

const STORE_PLATFORMS = [
  { name: "Salla", desc: "أكبر منصة عربية للتجارة الإلكترونية", supported: true },
  { name: "Shopify", desc: "أشهر منصة إي كوميرس عالمياً", supported: false },
  { name: "Zid", desc: "منصة المتاجر الإلكترونية السعودية", supported: false },
  { name: "WooCommerce", desc: "إضافة ووردبريس للتجارة الإلكترونية", supported: false },
];

const StoreConnect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiToken, setApiToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<SallaProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved token from database
  useEffect(() => {
    if (!user) return;
    const loadToken = async () => {
      const { data: brand } = await supabase
        .from("brands")
        .select("salla_token")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (brand?.salla_token) {
        setApiToken(brand.salla_token);
        verifyAndConnect(brand.salla_token);
      }
    };
    loadToken();
  }, [user]);

  const verifyAndConnect = async (token: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("salla-proxy", {
        body: { action: "verify", apiToken: token },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setStoreInfo(data.store);
      setIsConnected(true);
      toast.success("✅ تم ربط المتجر بنجاح");
      
      // Fetch products after connecting
      await fetchProducts(token);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "فشل ربط المتجر";
      setError(errMsg);
      setIsConnected(false);
      toast.error(errMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchProducts = async (token?: string) => {
    const t = token || apiToken;
    if (!t) return;

    setLoadingProducts(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("salla-proxy", {
        body: { action: "products", apiToken: t, page: 1 },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setProducts(data.products || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل جلب المنتجات");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleConnect = () => {
    if (!apiToken.trim()) {
      setError("يرجى إدخال API Token");
      return;
    }
    verifyAndConnect(apiToken);
  };

  const handleDisconnect = async () => {
    if (user) {
      await supabase.from("brands").update({ salla_token: null }).eq("user_id", user.id);
    }
    setIsConnected(false);
    setStoreInfo(null);
    setProducts([]);
    setApiToken("");
    toast.success("تم فصل المتجر");
  };

  const handleCreateContent = (productName: string) => {
    navigate(`/dashboard/writer?product=${encodeURIComponent(productName)}`);
  };

  return (
    <DashboardLayout title="ربط المتجر" subtitle="اربط متجرك واستورد المنتجات تلقائياً">
      <div className="max-w-5xl space-y-8">
        {/* Stores */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            منصات المتاجر
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STORE_PLATFORMS.map((s) => {
              const isSalla = s.name === "Salla";
              const connected = isSalla && isConnected;
              
              return (
                <div key={s.name} className={`glass-card rounded-2xl p-5 card-hover ${connected ? "gold-border glow-gold" : "border border-border/40"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    {connected && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  </div>
                  <div className="text-sm font-bold text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 mb-4">{s.desc}</div>
                  
                  {isSalla ? (
                    connected ? (
                      <button 
                        onClick={handleDisconnect}
                        className="w-full py-2 rounded-lg text-xs font-bold glass-card border border-green-500/30 text-green-400 hover:border-destructive/30 hover:text-destructive transition-colors"
                      >
                        ✓ متصل — فصل
                      </button>
                    ) : (
                      <button 
                        onClick={() => setShowTokenInput(true)}
                        className="w-full py-2 rounded-lg text-xs font-bold btn-gold"
                      >
                        ربط المتجر
                      </button>
                    )
                  ) : (
                    <button className="w-full py-2 rounded-lg text-xs font-bold glass-card border border-border/30 text-muted-foreground cursor-not-allowed" disabled>
                      قريباً
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Token Input Modal */}
        {showTokenInput && !isConnected && (
          <div className="glass-card gold-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">ربط متجر Salla</h3>
              <button onClick={() => { setShowTokenInput(false); setError(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              للربط، ادخل على لوحة تحكم Salla → الإعدادات → التطبيقات → أنشئ تطبيق جديد واحصل على الـ API Token.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="الصق Salla API Token هنا..."
              className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
            />

            <button
              onClick={handleConnect}
              disabled={isConnecting || !apiToken.trim()}
              className="w-full btn-gold py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isConnecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الربط...</>
              ) : (
                <><ShoppingBag className="w-4 h-4" /> ربط المتجر</>
              )}
            </button>
          </div>
        )}

        {/* Store Info */}
        {isConnected && storeInfo && (
          <div className="glass-card gold-border rounded-2xl p-5">
            <div className="flex items-center gap-4">
              {storeInfo.avatar && (
                <img src={storeInfo.avatar} alt={storeInfo.name} className="w-12 h-12 rounded-xl object-cover" />
              )}
              <div>
                <div className="text-sm font-bold text-foreground">{storeInfo.name}</div>
                <div className="text-xs text-muted-foreground">{storeInfo.domain}</div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 className="w-4 h-4" /> متصل
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {isConnected && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                منتجات المتجر
                <span className="text-xs text-muted-foreground font-normal">({products.length} منتج)</span>
              </h2>
              <button
                onClick={() => fetchProducts()}
                disabled={loadingProducts}
                className="flex items-center gap-1.5 px-3 py-1.5 glass-card border border-border/50 rounded-lg text-xs text-muted-foreground hover:border-primary/40 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? "animate-spin" : ""}`} /> تحديث
              </button>
            </div>

            {loadingProducts ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">جاري جلب المنتجات...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-border/30">
                <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">لا يوجد منتجات</p>
              </div>
            ) : (
              <div className="glass-card gold-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-right text-xs text-muted-foreground font-medium p-4">المنتج</th>
                        <th className="text-right text-xs text-muted-foreground font-medium p-4">SKU</th>
                        <th className="text-right text-xs text-muted-foreground font-medium p-4">السعر</th>
                        <th className="text-right text-xs text-muted-foreground font-medium p-4">الحالة</th>
                        <th className="text-right text-xs text-muted-foreground font-medium p-4">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-border/30 hover:bg-surface-2/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {p.image?.url || p.thumbnail ? (
                                <img 
                                  src={p.image?.url || p.thumbnail || ""} 
                                  alt={p.name} 
                                  className="w-10 h-10 rounded-lg object-cover" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                                  <Package className="w-4 h-4 text-primary/40" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-foreground">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground font-mono">{p.sku || "—"}</td>
                          <td className="p-4 text-sm font-bold text-foreground">
                            {p.price?.amount} {p.price?.currency}
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              p.status === "sale" || p.status === "active" 
                                ? "bg-green-400/15 text-green-400" 
                                : "bg-surface-2 text-muted-foreground"
                            }`}>
                              {p.status === "sale" || p.status === "active" ? "نشط" : p.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleCreateContent(p.name)}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              أنشئ محتوى <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StoreConnect;
