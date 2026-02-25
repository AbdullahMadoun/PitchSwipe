import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/mock-data";
import { Startup } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  startup: Startup;
  onInvest: (amount: number, numTickets: number, isBid: boolean) => void;
}

export function InvestmentModal({ isOpen, onClose, startup, onInvest }: InvestmentModalProps) {
  const [numTickets, setNumTickets] = useState(1);
  const [customPrice, setCustomPrice] = useState(startup.minTicket);
  const [isCustomPrice, setIsCustomPrice] = useState(false);
  const [agreement, setAgreement] = useState(false);

  const totalAmount = numTickets * customPrice;
  const isBelowTicket = customPrice < startup.minTicket;
  const platformFee = totalAmount * 0.02; // 2% platform fee
  const totalWithFees = totalAmount + platformFee;
  
  // Calculate equity based on investment amount
  const equityPercentage = ((totalAmount / startup.valuation) * 100).toFixed(3);

  useEffect(() => {
    // Reset when modal opens
    if (isOpen) {
      setNumTickets(1);
      setCustomPrice(startup.minTicket);
      setIsCustomPrice(false);
      setAgreement(false);
    }
  }, [isOpen, startup.minTicket]);

  const handleInvest = () => {
    if (!agreement) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the investment terms",
        variant: "destructive",
      });
      return;
    }

    if (isBelowTicket) {
      toast({
        title: "📨 Bid Request Sent",
        description: `Your bid of ${formatCurrency(customPrice)} per ticket has been sent to ${startup.founderName} for approval.`,
      });
    } else {
      toast({
        title: "✅ Investment Confirmed",
        description: `Successfully invested ${formatCurrency(totalAmount)} in ${startup.name}`,
      });
    }

    onInvest(totalAmount, numTickets, isBelowTicket);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Invest in {startup.name}
          </DialogTitle>
          <DialogDescription>
            Configure your investment details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ticket Information */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ticket Size</span>
              <span className="font-semibold">{formatCurrency(startup.minTicket)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valuation</span>
              <span className="font-semibold">{formatCurrency(startup.valuation)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Equity</span>
              <span className="font-semibold">{startup.equityPercent}%</span>
            </div>
          </div>

          {/* Number of Tickets */}
          <div className="space-y-2">
            <Label htmlFor="tickets">Number of Tickets</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="tickets"
                min={1}
                max={50}
                step={1}
                value={[numTickets]}
                onValueChange={(value) => setNumTickets(value[0])}
                className="flex-1"
              />
              <Input
                type="number"
                value={numTickets}
                onChange={(e) => setNumTickets(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-20"
                min={1}
                max={50}
              />
            </div>
          </div>

          {/* Custom Price per Ticket */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="price">Price per Ticket</Label>
              <button
                onClick={() => setIsCustomPrice(!isCustomPrice)}
                className={isCustomPrice 
                  ? "text-xs text-muted-foreground hover:underline" 
                  : "px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-full transition-colors"
                }
              >
                {isCustomPrice ? "← Use standard price" : "💰 Make an offer"}
              </button>
            </div>
            
            {isCustomPrice ? (
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  value={customPrice}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setCustomPrice(value);
                    }
                  }}
                  className="pl-9"
                  min={1}
                  step={100}
                />
                {isBelowTicket && (
                  <div className="flex items-center gap-2 mt-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">This bid will be sent as a message to the founder for approval</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Standard ticket price</span>
                <span className="font-semibold">{formatCurrency(startup.minTicket)}</span>
              </div>
            )}
          </div>

          {/* Investment Summary */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm">Investment Summary</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{numTickets} ticket{numTickets > 1 ? 's' : ''} × {formatCurrency(customPrice)}</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (2%)</span>
                <span>{formatCurrency(platformFee)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount</span>
                <span className="text-primary">{formatCurrency(totalWithFees)}</span>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Equity Stake</span>
                <div className="flex items-center gap-1">
                  {parseFloat(equityPercentage) > 0.001 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-bold text-primary">{equityPercentage}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {formatCurrency(startup.valuation)} valuation
              </p>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agreement"
              checked={agreement}
              onChange={(e) => setAgreement(e.target.checked)}
              className="mt-0.5"
            />
            <label htmlFor="agreement" className="text-sm text-muted-foreground">
              I agree to the investment terms and understand that {isBelowTicket ? "this bid will be sent to the founder via message for approval" : "this investment is final upon confirmation"}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleInvest} 
              disabled={!agreement}
              className="flex-1"
              variant={isBelowTicket ? "secondary" : "default"}
            >
              {isBelowTicket ? "Send Bid Request" : "Confirm Investment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}