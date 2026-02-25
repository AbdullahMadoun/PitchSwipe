import { motion } from "framer-motion";
import { User, PieChart, Edit, Settings, LogOut, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { InvestorNav } from "@/components/layout/InvestorNav";

const Profile = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("Jane Investor");
  const [email, setEmail] = useState("jane@email.com");

  useEffect(() => {
    setName(localStorage.getItem("pitchswipe-name") || "Jane Investor");
    setEmail(localStorage.getItem("pitchswipe-email") || "jane@email.com");
  }, []);

  const menuItems = [
    { icon: PieChart, label: "View Portfolio", path: "/portfolio" },
    { icon: Edit, label: "Edit Preferences", path: "/onboarding/investor" },
    { icon: Settings, label: "Settings", path: "/profile/settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Profile" />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-6 text-center mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-1">{name}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div>
              <p className="text-2xl font-bold text-foreground">24</p>
              <p className="text-xs text-muted-foreground">Reviewed</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">Invested</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Quick Links
          </h3>
          
          {menuItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-4 p-4 card-base hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="flex-1 font-medium text-foreground">{label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          ))}

          {/* Sign Out */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-4 p-4 card-base hover:border-destructive/30 transition-colors w-full text-left mt-4"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <span className="flex-1 font-medium text-destructive">Sign Out</span>
          </button>
        </motion.div>
      </main>

      <InvestorNav />
    </div>
  );
};

export default Profile;
