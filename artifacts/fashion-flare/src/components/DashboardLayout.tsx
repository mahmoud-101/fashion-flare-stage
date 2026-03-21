import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, LogOut, Search } from "lucide-react";
import { SkipToContent } from "@/components/AccessibilityHelpers";
import { NotificationBell } from "@/components/NotificationBell";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name[0]
    : user?.email?.[0]?.toUpperCase() || "م";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SkipToContent />
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b border-border/50 px-6 glass-card shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
              <div className="w-px h-6 bg-border" />
              <div>
                <h1 className="text-base font-bold text-foreground leading-none">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
                }}
                className="hidden sm:flex items-center gap-2 glass-card border border-border/50 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:border-primary/30 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث...</span>
                <kbd className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded">⌘K</kbd>
              </button>
              <ThemeToggle />
              <NotificationBell />
              <Link to="/" className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ChevronLeft className="w-3 h-3" />
                الموقع
              </Link>
              <button
                onClick={handleSignOut}
                className="w-9 h-9 glass-card border border-border/50 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                aria-label="تسجيل خروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-xl btn-gold flex items-center justify-center text-sm font-black cursor-pointer" aria-label="الملف الشخصي">
                {initials}
              </div>
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6" role="main">
            {children}
          </main>
        </div>
        <MobileBottomNav />
        <PWAInstallPrompt />
        <GlobalSearch />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
