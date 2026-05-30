import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestProvider } from "@/contexts/GuestContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PremiumProvider } from "@/contexts/PremiumContext";
import { SOSProvider } from "@/contexts/SOSContext";
import { CasesProvider } from "@/contexts/CasesContext";
import { CommunityProvider } from "@/contexts/CommunityContext";
import { PremiumUpgradeModal } from "@/components/premium/PremiumUpgradeModal";
import { GuestLoginPrompt } from "@/components/auth/GuestLoginPrompt";
import { SOSSheet } from "@/components/sos/SOSSheet";
import { SOSFab } from "@/components/sos/SOSFab";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import OnboardingForm from "./pages/OnboardingForm";
import LanguageSelect from "./pages/LanguageSelect";
import Login from "./pages/Login";
import OtpVerify from "./pages/OtpVerify";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Documents from "./pages/Documents";
import DocumentWizard from "./pages/DocumentWizard";
import PortalTracker from "./pages/PortalTracker";
import Lawyers from "./pages/Lawyers";
import LawyerProfile from "./pages/LawyerProfile";
import RtiWizard from "./pages/RtiWizard";
import Community from "./pages/Community";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Cases from "./pages/Cases";
import CommunityPostDetail from "./pages/CommunityPostDetail";
import CreatePost from "./pages/CreatePost";
import SavedDocuments from "./pages/profile/SavedDocuments";
import AppointmentHistory from "./pages/profile/AppointmentHistory";
import SavedLawyers from "./pages/profile/SavedLawyers";
import HelpCenter from "./pages/profile/HelpCenter";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const protect = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <GuestProvider>
          <NotificationProvider>
            <PremiumProvider>
              <SOSProvider>
                <CasesProvider>
                  <CommunityProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <ErrorBoundary>
                          <Routes>
                            <Route path="/" element={<Navigate to="/splash" replace />} />
                            <Route path="/splash" element={<Splash />} />
                            <Route path="/onboarding" element={<Onboarding />} />
                            <Route path="/onboarding-form" element={<OnboardingForm />} />
                            <Route path="/language" element={<LanguageSelect />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/otp" element={<OtpVerify />} />

                            <Route path="/home" element={protect(<Home />)} />
                            <Route path="/chat" element={protect(<Chat />)} />
                            <Route path="/documents" element={protect(<Documents />)} />
                            <Route path="/documents/new" element={protect(<DocumentWizard />)} />
                            <Route path="/portal-tracker" element={protect(<PortalTracker />)} />
                            <Route path="/lawyers" element={protect(<Lawyers />)} />
                            <Route path="/lawyers/:id" element={protect(<LawyerProfile />)} />
                            <Route path="/rti" element={protect(<RtiWizard />)} />
                            <Route path="/community" element={protect(<Community />)} />
                            <Route path="/community/new" element={protect(<CreatePost />)} />
                            <Route path="/community/:id" element={protect(<CommunityPostDetail />)} />
                            <Route path="/notifications" element={protect(<Notifications />)} />
                            <Route path="/cases" element={protect(<Cases />)} />
                            <Route path="/profile" element={protect(<Profile />)} />
                            <Route path="/profile/edit" element={protect(<EditProfile />)} />
                            <Route path="/profile/saved-documents" element={protect(<SavedDocuments />)} />
                            <Route path="/profile/appointments" element={protect(<AppointmentHistory />)} />
                            <Route path="/profile/saved-lawyers" element={protect(<SavedLawyers />)} />
                            <Route path="/profile/help" element={protect(<HelpCenter />)} />
                            <Route path="/about" element={<About />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<Terms />} />

                            <Route path="*" element={<NotFound />} />
                          </Routes>
                          <SOSFab />
                          <PremiumUpgradeModal />
                          <GuestLoginPrompt />
                          <SOSSheet />
                        </ErrorBoundary>
                      </BrowserRouter>
                    </TooltipProvider>
                  </CommunityProvider>
                </CasesProvider>
              </SOSProvider>
            </PremiumProvider>
          </NotificationProvider>
        </GuestProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
