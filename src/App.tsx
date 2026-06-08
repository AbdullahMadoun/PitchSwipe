import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import InvestorOnboarding from "./pages/InvestorOnboarding";
import InvestorFeed from "./pages/InvestorFeed";
import Search from "./pages/Search";
import Saved from "./pages/Saved";
import Messages from "./pages/Messages";
import MessageThread from "./pages/MessageThread";
import Profile from "./pages/Profile";
import Portfolio from "./pages/Portfolio";
import StartupDetailsAPI from "./pages/StartupDetailsAPI";
import ProfileSettings from "./pages/ProfileSettings";
import FounderOnboarding from "./pages/FounderOnboarding";
import FounderDashboard from "./pages/FounderDashboard";
import FounderInterested from "./pages/FounderInterested";
import FounderMessages from "./pages/FounderMessages";
import FounderMessageThread from "./pages/FounderMessageThread";
import FounderSettings from "./pages/FounderSettings";
import FounderProfile from "./pages/FounderProfile";
import NotFound from "./pages/NotFound";
import TestFeed from "./pages/TestFeed";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Test route for direct feed access */}
          <Route path="/test" element={<TestFeed />} />
          {/* Investor routes */}
          <Route path="/onboarding/investor" element={<InvestorOnboarding />} />
          <Route path="/feed" element={<InvestorFeed />} />
          <Route path="/search" element={<Search />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<MessageThread />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/settings" element={<ProfileSettings />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/startup/:id" element={<StartupDetailsAPI />} />
          {/* Founder routes */}
          <Route path="/onboarding/founder" element={<FounderOnboarding />} />
          <Route path="/founder/dashboard" element={<FounderDashboard />} />
          <Route path="/founder/interested" element={<FounderInterested />} />
          <Route path="/founder/messages" element={<FounderMessages />} />
          <Route path="/founder/messages/:id" element={<FounderMessageThread />} />
          <Route path="/founder/settings" element={<FounderSettings />} />
          <Route path="/founder/profile" element={<FounderProfile />} />
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
