import { motion } from "framer-motion";
import { ArrowLeft, Building2, DollarSign, BarChart3, Video, Bell, HelpCircle, FileText, Trash2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FounderNav } from "@/components/layout/FounderNav";

const FounderSettings = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Building2, label: "Edit Basic Info", section: "Company" },
    { icon: DollarSign, label: "Edit Deal Terms", section: "Company" },
    { icon: BarChart3, label: "Edit Financials", section: "Company" },
    { icon: Video, label: "Manage Videos", section: "Company" },
    { icon: Bell, label: "Notifications", section: "Preferences" },
    { icon: HelpCircle, label: "Help & FAQ", section: "Support" },
    { icon: FileText, label: "Terms of Service", section: "Support" },
  ];

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {Object.entries(groupedItems).map(([section, items], sectionIndex) => (
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{section}</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.label}
                  className="w-full card p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Account</h2>
          <div className="space-y-2">
            <button 
              onClick={() => navigate("/")}
              className="w-full card p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Sign Out</span>
            </button>
            <button className="w-full card p-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors border-destructive/30">
              <Trash2 className="w-5 h-5 text-destructive" />
              <span className="font-medium text-destructive">Delete Account</span>
            </button>
          </div>
        </motion.div>
      </div>

      <FounderNav />
    </div>
  );
};

export default FounderSettings;
