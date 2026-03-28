import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import React, { Suspense, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

const AIPage = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  </ProtectedRoute>
);

// Lazy loaded pages
const Index = React.lazy(() => import("./pages/Index"));
const AuthPage = React.lazy(() => import("./pages/AuthPage"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const AIWriter = React.lazy(() => import("./pages/AIWriter"));
const ImageStudio = React.lazy(() => import("./pages/ImageStudio"));
const Scheduler = React.lazy(() => import("./pages/Scheduler"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const StoreConnect = React.lazy(() => import("./pages/StoreConnect"));
const BrandSettings = React.lazy(() => import("./pages/BrandSettings"));
const ContentLibrary = React.lazy(() => import("./pages/ContentLibrary"));
const CreatorStudio = React.lazy(() => import("./pages/CreatorStudio"));
const PhotoshootPage = React.lazy(() => import("./pages/PhotoshootPage"));
const EditStudioPage = React.lazy(() => import("./pages/EditStudioPage"));
const BillingPage = React.lazy(() => import("./pages/BillingPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const TermsPage = React.lazy(() => import("./pages/TermsPage"));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage"));
const AdCreativeGenerator = React.lazy(() => import("./pages/AdCreativeGenerator"));
const CompetitorSpy = React.lazy(() => import("./pages/CompetitorSpy"));
const ABTesting = React.lazy(() => import("./pages/ABTesting"));
const ReferralPage = React.lazy(() => import("./pages/ReferralPage"));
const TemplatesPage = React.lazy(() => import("./pages/TemplatesPage"));
const HelpPage = React.lazy(() => import("./pages/HelpPage"));
const ImageUpscalerPage = React.lazy(() => import("./pages/ImageUpscalerPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const HashtagGenerator = React.lazy(() => import("./pages/HashtagGenerator"));
const PricingPage = React.lazy(() => import("./pages/PricingPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const CheckEmailPage = React.lazy(() => import("./pages/CheckEmailPage"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <span className="text-sm text-muted-foreground">جاري التحميل...</span>
    </div>
  </div>
);

const App = () => (
  <HelmetProvider>
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/check-email" element={<CheckEmailPage />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/register" element={<Navigate to="/auth" replace />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/writer" element={<AIPage><AIWriter /></AIPage>} />
              <Route path="/dashboard/library" element={<ProtectedRoute><ContentLibrary /></ProtectedRoute>} />
              <Route path="/dashboard/studio" element={<AIPage><ImageStudio /></AIPage>} />
              <Route path="/dashboard/creator" element={<AIPage><CreatorStudio /></AIPage>} />
              <Route path="/dashboard/photoshoot" element={<AIPage><PhotoshootPage /></AIPage>} />
              <Route path="/dashboard/edit-studio" element={<AIPage><EditStudioPage /></AIPage>} />
              <Route path="/dashboard/scheduler" element={<ProtectedRoute><Scheduler /></ProtectedRoute>} />
              <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/dashboard/store" element={<ProtectedRoute><StoreConnect /></ProtectedRoute>} />
              <Route path="/dashboard/brand" element={<ProtectedRoute><BrandSettings /></ProtectedRoute>} />
              <Route path="/dashboard/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/dashboard/ad-generator" element={<AIPage><AdCreativeGenerator /></AIPage>} />
              <Route path="/dashboard/competitor-spy" element={<AIPage><CompetitorSpy /></AIPage>} />
              <Route path="/dashboard/ab-testing" element={<AIPage><ABTesting /></AIPage>} />
              <Route path="/dashboard/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
              <Route path="/dashboard/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="/dashboard/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
              <Route path="/dashboard/upscaler" element={<AIPage><ImageUpscalerPage /></AIPage>} />
              <Route path="/dashboard/hashtags" element={<AIPage><HashtagGenerator /></AIPage>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
            </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
  </HelmetProvider>
);

export default App;
