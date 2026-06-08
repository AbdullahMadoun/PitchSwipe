import { motion } from "framer-motion";
import { Search, Rocket } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { RoleCard } from "@/components/landing/RoleCard";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-glow mx-auto mb-6">
            <span className="text-primary-foreground font-bold text-3xl">PS</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground text-center mb-2">
            PitchSwipe
          </h1>
          <p className="text-lg text-muted-foreground text-center">
            Swipe. Discover. Invest.
          </p>
        </motion.div>

        {/* Floating cards animation */}
        <motion.div 
          className="relative w-full max-w-xs h-48 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Back card */}
          <motion.div
            className="absolute inset-x-4 top-4 h-40 rounded-2xl bg-card border border-border shadow-card"
            animate={{ rotate: -6 }}
          />
          {/* Middle card */}
          <motion.div
            className="absolute inset-x-2 top-2 h-40 rounded-2xl bg-card border border-border shadow-card"
            animate={{ rotate: 3 }}
          />
          {/* Front card */}
          <motion.div
            className="absolute inset-0 h-40 rounded-2xl bg-gradient-to-br from-primary to-primary-hover shadow-elevated flex flex-col items-center justify-center text-primary-foreground"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-5xl mb-2">🚀</span>
            <span className="font-semibold">60-second pitches</span>
          </motion.div>
        </motion.div>

        {/* Role Selection */}
        <div className="w-full max-w-sm space-y-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-muted-foreground mb-4"
          >
            I am a...
          </motion.p>
          
          <RoleCard
            icon={Search}
            title="Investor"
            description="Looking for the next big thing"
            onClick={() => navigate("/onboarding/investor")}
            delay={0.5}
          />
          
          <RoleCard
            icon={Rocket}
            title="Founder"
            description="Raising capital for my startup"
            onClick={() => navigate("/onboarding/founder")}
            delay={0.6}
          />
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="py-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Landing;
