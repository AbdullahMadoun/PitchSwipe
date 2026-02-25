import { Link, useLocation } from "react-router-dom";
import { Film, Search, Bookmark, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Film, label: "Feed", path: "/feed" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Bookmark, label: "Saved", path: "/saved" },
  { icon: MessageCircle, label: "Chat", path: "/messages" },
  { icon: User, label: "Me", path: "/profile" },
];

export const InvestorNav = () => {
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
