import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { FounderNav } from "@/components/layout/FounderNav";
import { getLatestCustomStartup } from "@/lib/data-store";
import StartupDetails from "./StartupDetails";

// Reuse investor-facing profile; fallback message if no upload yet
const FounderProfile = () => {
  const latest = useMemo(() => getLatestCustomStartup(), []);

  if (!latest) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col">
        <Header title="My Startup" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <p className="text-muted-foreground mb-4">No pitch uploaded yet.</p>
          <Link to="/founder/dashboard" className="btn-primary">Go upload</Link>
        </div>
        <FounderNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Preview (Investor View)" />
      <StartupDetails startupIdOverride={latest.id} forceUnlocked hideNav />
      <FounderNav />
    </div>
  );
};

export default FounderProfile;

