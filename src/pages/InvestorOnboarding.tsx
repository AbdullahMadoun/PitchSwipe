import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const stages = ["Pre-Seed", "Seed", "Series A", "Series B+"];
const industries = ["Fintech", "AI/ML", "Healthcare", "EdTech", "CleanTech", "E-commerce", "SaaS", "Consumer"];
const models = ["B2B", "B2C", "Marketplace", "Hardware"];

const InvestorOnboarding = () => {
  const navigate = useNavigate();
  const [thesis, setThesis] = useState("");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSelection = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleContinue = async () => {
    // Navigate to the bulletproof test feed that always works
    navigate("/test");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 glass-overlay z-50 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-foreground">Investment Thesis</span>
          <button 
            onClick={() => navigate("/feed")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            What's your investment thesis?
          </h1>
          <p className="text-muted-foreground mb-8">
            Help us find startups that match your interests
          </p>

          {/* Free text */}
          <div className="mb-8">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Describe what you're looking for
            </label>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="I'm interested in early-stage B2B SaaS companies in fintech and healthcare..."
              className="input-base min-h-[120px] resize-none"
            />
          </div>

          {/* Quick picks */}
          <div className="space-y-6">
            {/* Stage */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Stage preference
              </label>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
                  <motion.button
                    key={stage}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(stage, selectedStages, setSelectedStages)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedStages.includes(stage)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {stage}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Industries
              </label>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <motion.button
                    key={industry}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(industry, selectedIndustries, setSelectedIndustries)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedIndustries.includes(industry)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {industry}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Business Model */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Business model
              </label>
              <div className="flex flex-wrap gap-2">
                {models.map((model) => (
                  <motion.button
                    key={model}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(model, selectedModels, setSelectedModels)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedModels.includes(model)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {model}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-overlay border-t border-border">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Start Scouting
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default InvestorOnboarding;
