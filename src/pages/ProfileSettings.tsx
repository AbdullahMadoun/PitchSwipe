import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";
import { useState } from "react";

const ProfileSettings = () => {
  const [name, setName] = useState(localStorage.getItem("pitchswipe-name") || "Jane Investor");
  const [email, setEmail] = useState(localStorage.getItem("pitchswipe-email") || "jane@email.com");

  const handleSave = () => {
    localStorage.setItem("pitchswipe-name", name);
    localStorage.setItem("pitchswipe-email", email);
    alert("Saved locally");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Settings" />
      <main className="pt-20 px-4 max-w-lg mx-auto space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Name</label>
          <input
            className="input-base w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Email</label>
          <input
            className="input-base w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button className="btn-primary w-full" onClick={handleSave}>
          Save locally
        </button>
      </main>
      <InvestorNav />
    </div>
  );
};

export default ProfileSettings;

