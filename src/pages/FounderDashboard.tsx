import { useState } from "react";
import { motion } from "framer-motion";
import { Play, MessageSquare, Users, Settings, Edit, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FounderNav } from "@/components/layout/FounderNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getEmbedding } from "@/lib/embeddings";
import { saveCustomStartup } from "@/lib/data-store";
import { toast } from "@/hooks/use-toast";

const mockCompany = {
  name: "Acme AI",
  tagline: "AI-powered financial tools for SMBs",
  stage: "Seed",
  industry: "Fintech",
  videoPoster: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400",
  stats: {
    interested: 12,
    chats: 3,
  },
};

const mockInterested = [
  { id: "1", name: "Jane I.", time: "2h ago" },
  { id: "2", name: "Bob K.", time: "1d ago" },
  { id: "3", name: "Sarah L.", time: "3d ago" },
];

const FounderDashboard = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    industry: "",
    stage: "Seed",
    videoUrl: "",
    videoPoster: "",
    description: "",
    transcript: "",
    tags: "",
    revenue: "",
    burnRate: "",
    runwayMonths: "",
    growthPercent: "",
    leadInvestor: "",
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const embedding = await getEmbedding(form.transcript || form.description);
      const id = crypto.randomUUID();

      saveCustomStartup({
        id,
        name: form.name || "Untitled Startup",
        tagline: form.tagline || "No tagline yet",
        industry: form.industry || "General",
        stage: form.stage || "Seed",
        raiseAmount: 500000,
        valuation: 5000000,
        equityPercent: 5,
        minTicket: 1000,
        videoUrl: form.videoUrl,
        videoPoster: form.videoPoster || form.videoUrl,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        description: form.description,
        founderName: "You",
        founderAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
        revenue: form.revenue ? Number(form.revenue) : undefined,
        burnRate: form.burnRate ? Number(form.burnRate) : undefined,
        runwayMonths: form.runwayMonths ? Number(form.runwayMonths) : undefined,
        growthPercent: form.growthPercent ? Number(form.growthPercent) : undefined,
        leadInvestor: form.leadInvestor || undefined,
        embedding,
      });

      toast({
        title: "Pitch uploaded",
        description: embedding ? "Vectorized transcript attached." : "Uploaded without vector (no key or input).",
      });

      setForm({
        name: "",
        tagline: "",
        industry: "",
        stage: "Seed",
        videoUrl: "",
        videoPoster: "",
        description: "",
        transcript: "",
        tags: "",
        revenue: "",
        burnRate: "",
        runwayMonths: "",
        growthPercent: "",
        leadInvestor: "",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: "Something went wrong. Check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">{mockCompany.name}</h1>
        <button 
          onClick={() => navigate("/founder/settings")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/founder/profile")}
            className="text-sm text-primary hover:underline"
          >
            Preview investor view
          </button>
        </div>
        {/* Video Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden aspect-video bg-muted"
        >
          <img
            src={mockCompany.videoPoster}
            alt="Pitch video"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="card p-5 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{mockCompany.stats.interested}</p>
            <p className="text-sm text-muted-foreground">Interested</p>
          </div>
          <div className="card p-5 text-center">
            <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{mockCompany.stats.chats}</p>
            <p className="text-sm text-muted-foreground">Chats</p>
          </div>
        </motion.div>

        {/* Recent Interest */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Interest</h2>
          <div className="space-y-3">
            {mockInterested.map((investor) => (
              <div key={investor.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">{investor.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{investor.name}</p>
                    <p className="text-xs text-muted-foreground">{investor.time}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/founder/messages")}>
                  Message
                </Button>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate("/founder/interested")}
            className="w-full mt-4 text-primary font-medium text-sm hover:underline"
          >
            View All Interested →
          </button>
        </motion.div>

        {/* Upload new pitch (demo) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Upload a new pitch</h3>
              <p className="text-xs text-muted-foreground">Quick demo form. Embedding will be generated from transcript/description.</p>
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Startup name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              <Input
                placeholder="Stage (Seed, A, B...)"
                value={form.stage}
                onChange={(e) => handleChange("stage", e.target.value)}
              />
            </div>
            <Input
              placeholder="Tagline"
              value={form.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
            />
            <Input
              placeholder="Industry"
              value={form.industry}
              onChange={(e) => handleChange("industry", e.target.value)}
            />
            <Input
              placeholder="Video URL"
              value={form.videoUrl}
              onChange={(e) => handleChange("videoUrl", e.target.value)}
              required
            />
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  handleChange("videoUrl", url);
                  handleChange("videoPoster", url);
                  toast({ title: "Local video attached", description: "Using a local blob URL for preview." });
                }
              }}
            />
            <Input
              placeholder="Poster image URL (optional)"
              value={form.videoPoster}
              onChange={(e) => handleChange("videoPoster", e.target.value)}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
            />
            <Textarea
              placeholder="Short description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
            <Textarea
              placeholder="Transcript (preferred for embedding)"
              value={form.transcript}
              onChange={(e) => handleChange("transcript", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Monthly revenue ($)"
                value={form.revenue}
                onChange={(e) => handleChange("revenue", e.target.value)}
              />
              <Input
                placeholder="Monthly burn ($)"
                value={form.burnRate}
                onChange={(e) => handleChange("burnRate", e.target.value)}
              />
              <Input
                placeholder="Runway (months)"
                value={form.runwayMonths}
                onChange={(e) => handleChange("runwayMonths", e.target.value)}
              />
              <Input
                placeholder="Growth % (MoM)"
                value={form.growthPercent}
                onChange={(e) => handleChange("growthPercent", e.target.value)}
              />
              <Input
                placeholder="Lead investor (optional)"
                value={form.leadInvestor}
                onChange={(e) => handleChange("leadInvestor", e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload & vectorize"}
            </Button>
          </form>
        </motion.div>
      </div>

      <FounderNav />
    </div>
  );
};

export default FounderDashboard;
