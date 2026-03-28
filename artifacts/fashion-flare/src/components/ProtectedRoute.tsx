import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center animate-pulse">
            <span className="text-lg">✨</span>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!user.email_confirmed_at) return <Navigate to="/check-email" state={{ email: user.email }} replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
