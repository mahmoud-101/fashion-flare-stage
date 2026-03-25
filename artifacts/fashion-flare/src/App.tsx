import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

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
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/register" element={<Navigate to="/auth" replace />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/writer" element={<ProtectedRoute><AIWriter /></ProtectedRoute>} />
              <Route path="/dashboard/library" element={<ProtectedRoute><ContentLibrary /></ProtectedRoute>} />
              <Route path="/dashboard/studio" element={<ProtectedRoute><ImageStudio /></ProtectedRoute>} />
              <Route path="/dashboard/creator" element={<ProtectedRoute><CreatorStudio /></ProtectedRoute>} />
              <Route path="/dashboard/photoshoot" element={<ProtectedRoute><PhotoshootPage /></ProtectedRoute>} />
              <Route path="/dashboard/edit-studio" element={<ProtectedRoute><EditStudioPage /></ProtectedRoute>} />
              <Route path="/dashboard/reels" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/scheduler" element={<ProtectedRoute><Scheduler /></ProtectedRoute>} />
              <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/dashboard/store" element={<ProtectedRoute><StoreConnect /></ProtectedRoute>} />
              <Route path="/dashboard/brand" element={<ProtectedRoute><BrandSettings /></ProtectedRoute>} />
              <Route path="/dashboard/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/dashboard/ad-generator" element={<ProtectedRoute><AdCreativeGenerator /></ProtectedRoute>} />
              <Route path="/dashboard/competitor-spy" element={<ProtectedRoute><CompetitorSpy /></ProtectedRoute>} />
              <Route path="/dashboard/ab-testing" element={<ProtectedRoute><ABTesting /></ProtectedRoute>} />
              <Route path="/dashboard/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
              <Route path="/dashboard/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="/dashboard/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
              <Route path="/dashboard/face-swap" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/virtual-tryon" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/upscaler" element={<ProtectedRoute><ImageUpscalerPage /></ProtectedRoute>} />
              <Route path="/dashboard/sketch-to-image" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/hashtags" element={<ProtectedRoute><HashtagGenerator /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
  </HelmetProvider>
);

export default App;
