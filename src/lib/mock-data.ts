export interface Startup {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  stage: string;
  raiseAmount: number;
  valuation: number;
  equityPercent: number;
  minTicket: number;
  logoUrl?: string;
  videoUrl: string;
  videoPoster: string;
  tags: string[];
  description: string;
  revenue?: number;
  burnRate?: number;
  runwayMonths?: number;
  growthPercent?: number;
  leadInvestor?: string;
  founderName: string;
  founderAvatar: string;
}

export const mockStartups: Startup[] = [
  {
    id: "1",
    name: "NeuroPay",
    tagline: "AI-powered fraud detection for fintech",
    industry: "Fintech",
    stage: "Seed",
    raiseAmount: 500000,
    valuation: 10000000,
    equityPercent: 5,
    minTicket: 1000,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    videoPoster: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=600&fit=crop",
    tags: ["AI", "Fintech", "B2B"],
    description: "We use machine learning to detect fraudulent transactions in real-time, saving businesses millions in chargebacks.",
    revenue: 50000,
    burnRate: 15000,
    runwayMonths: 18,
    growthPercent: 35,
    leadInvestor: "TechVentures Capital",
    founderName: "Sarah Chen",
    founderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "MediSync",
    tagline: "Healthcare data interoperability platform",
    industry: "Healthcare",
    stage: "Series A",
    raiseAmount: 2000000,
    valuation: 25000000,
    equityPercent: 8,
    minTicket: 5000,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    videoPoster: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=600&fit=crop",
    tags: ["Healthcare", "B2B", "SaaS"],
    description: "Seamlessly connect disparate healthcare systems with our HIPAA-compliant API platform.",
    revenue: 200000,
    burnRate: 80000,
    runwayMonths: 24,
    growthPercent: 25,
    leadInvestor: "Health Innovation Fund",
    founderName: "Dr. Michael Torres",
    founderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    name: "EduFlow",
    tagline: "Personalized learning paths with AI tutors",
    industry: "EdTech",
    stage: "Pre-Seed",
    raiseAmount: 250000,
    valuation: 3000000,
    equityPercent: 8,
    minTicket: 500,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    videoPoster: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=600&fit=crop",
    tags: ["EdTech", "AI", "Consumer"],
    description: "Every student learns differently. Our AI creates unique learning journeys that adapt in real-time.",
    revenue: 10000,
    burnRate: 8000,
    runwayMonths: 12,
    growthPercent: 50,
    founderName: "Amanda Park",
    founderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    name: "GreenGrid",
    tagline: "Smart energy management for commercial buildings",
    industry: "CleanTech",
    stage: "Seed",
    raiseAmount: 750000,
    valuation: 8000000,
    equityPercent: 9,
    minTicket: 2500,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    videoPoster: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=400&h=600&fit=crop",
    tags: ["CleanTech", "IoT", "B2B"],
    description: "Reduce energy costs by 30% with our AI-powered building management system.",
    revenue: 75000,
    burnRate: 25000,
    runwayMonths: 20,
    growthPercent: 40,
    leadInvestor: "Climate Capital",
    founderName: "James Liu",
    founderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "5",
    name: "ShopAI",
    tagline: "Conversational commerce for e-commerce brands",
    industry: "E-commerce",
    stage: "Series A",
    raiseAmount: 3000000,
    valuation: 35000000,
    equityPercent: 8.5,
    minTicket: 10000,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    videoPoster: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop",
    tags: ["E-commerce", "AI", "SaaS"],
    description: "Turn browsers into buyers with AI shopping assistants that understand intent.",
    revenue: 500000,
    burnRate: 150000,
    runwayMonths: 18,
    growthPercent: 45,
    leadInvestor: "Retail Ventures",
    founderName: "Elena Rodriguez",
    founderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
];

export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

export const stageColors: Record<string, string> = {
  "Pre-Seed": "bg-purple-100 text-purple-700",
  "Seed": "bg-primary/10 text-primary",
  "Series A": "bg-blue-100 text-blue-700",
  "Series B": "bg-indigo-100 text-indigo-700",
};
