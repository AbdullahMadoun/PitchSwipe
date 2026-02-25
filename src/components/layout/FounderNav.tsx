import { Link, useLocation } from "react-router-dom";
import { Home, Users, MessageCircle, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/founder/dashboard" },
  { icon: Users, label: "Interest", path: "/founder/interested" },
  { icon: MessageCircle, label: "Chat", path: "/founder/messages" },
  { icon: User, label: "Profile", path: "/founder/profile" },
  { icon: Settings, label: "Settings", path: "/founder/settings" },
];

export const FounderNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-overlay border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn("nav-item py-2 px-3", isActive && "active")}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
