import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, Building2, DollarSign, BarChart3, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const steps = [
  { id: 1, title: "Basic Info", icon: Building2 },
  { id: 2, title: "Deal Terms", icon: DollarSign },
  { id: 3, title: "Financials", icon: BarChart3 },
  { id: 4, title: "Videos", icon: Video },
];

const industries = ["Fintech", "AI/ML", "Healthcare", "EdTech", "E-commerce", "SaaS", "Consumer", "Climate", "Other"];
const stages = ["Pre-Seed", "Seed", "Series A", "Series B"];

const FounderOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    industry: "",
    stage: "",
    raiseAmount: "",
    valuation: "",
    equityPercent: "",
    minTicket: "",
    leadInvestor: "",
    revenue: "",
    burnRate: "",
    runway: "",
    growth: "",
    description: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
    else navigate("/founder/dashboard");
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={prevStep} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-foreground">Create Company Profile</h1>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="px-6 pt-6">
        <p className="text-sm text-muted-foreground mb-2">Step {currentStep} of 4: {steps[currentStep - 1].title}</p>
        <div className="flex gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step.id <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company Name *</label>
                <Input
                  placeholder="Acme AI"
                  value={formData.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tagline *</label>
                <Input
                  placeholder="AI for SMB finance"
                  value={formData.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Industry *</label>
                <Select value={formData.industry} onValueChange={(v) => updateField("industry", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Stage *</label>
                <Select value={formData.stage} onValueChange={(v) => updateField("stage", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company Logo</label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Upload Image</p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Raising Amount *</label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={formData.raiseAmount}
                  onChange={(e) => updateField("raiseAmount", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Valuation Cap *</label>
                <Input
                  type="number"
                  placeholder="10000000"
                  value={formData.valuation}
                  onChange={(e) => updateField("valuation", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Equity Offered (%) *</label>
                <Input
                  type="number"
                  placeholder="5"
                  value={formData.equityPercent}
                  onChange={(e) => updateField("equityPercent", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Minimum Ticket *</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={formData.minTicket}
                  onChange={(e) => updateField("minTicket", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Lead Investor (optional)</label>
                <Input
                  placeholder="TechVC Partners"
                  value={formData.leadInvestor}
                  onChange={(e) => updateField("leadInvestor", e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Monthly Revenue</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.revenue}
                  onChange={(e) => updateField("revenue", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Monthly Burn Rate</label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={formData.burnRate}
                  onChange={(e) => updateField("burnRate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Runway (months)</label>
                <Input
                  type="number"
                  placeholder="18"
                  value={formData.runway}
                  onChange={(e) => updateField("runway", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">MoM Growth (%)</label>
                <Input
                  type="number"
                  placeholder="25"
                  value={formData.growth}
                  onChange={(e) => updateField("growth", e.target.value)}
                />
              </div>
              <div className="p-4 bg-warning/10 rounded-xl border border-warning/30">
                <p className="text-sm text-warning-foreground">
                  ⚠️ Financials are only shown to investors who express interest (swipe right on your pitch)
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Main Pitch Video *</label>
                <p className="text-xs text-muted-foreground mb-3">This is your "reel" - shown in investor feed</p>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer aspect-[9/16] max-w-[200px] mx-auto flex flex-col items-center justify-center">
                  <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Upload Video</p>
                  <p className="text-xs text-muted-foreground mt-1">30-60 seconds</p>
                  <p className="text-xs text-muted-foreground">Vertical (9:16)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Additional Videos</label>
                <p className="text-xs text-muted-foreground mb-3">Demos, team intros, etc.</p>
                <div className="flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-20 h-20 border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">About / Description *</label>
                <Textarea
                  placeholder="We're building AI-powered financial tools for SMBs..."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <Button onClick={nextStep} className="w-full btn-primary">
          {currentStep === 4 ? "Complete Setup" : "Next"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default FounderOnboarding;
