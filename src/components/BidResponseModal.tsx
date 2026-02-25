import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ArrowUpDown, DollarSign } from "lucide-react";

interface BidDetails {
  investorName: string;
  numTickets: number;
  pricePerTicket: number;
  totalAmount: number;
  originalMinTicket: number;
  messageId: string;
  threadId: string;
}

interface BidResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidDetails: BidDetails;
  onAccept: () => void;
  onReject: (reason?: string) => void;
  onCounter: (newPrice: number, message?: string) => void;
}

export function BidResponseModal({ 
  isOpen, 
  onClose, 
  bidDetails,
  onAccept,
  onReject,
  onCounter 
}: BidResponseModalProps) {
  const [responseType, setResponseType] = useState<"review" | "counter" | "reject">("review");
  const [counterPrice, setCounterPrice] = useState(bidDetails.pricePerTicket);
  const [counterMessage, setCounterMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const percentBelowMin = ((bidDetails.originalMinTicket - bidDetails.pricePerTicket) / bidDetails.originalMinTicket * 100).toFixed(1);

  const handleAccept = () => {
    onAccept();
    toast({
      title: "✅ Bid Accepted",
      description: `Investment of ${formatCurrency(bidDetails.totalAmount)} confirmed`,
    });
    onClose();
  };

  const handleReject = () => {
    onReject(rejectReason);
    toast({
      title: "❌ Bid Rejected",
      description: "The investor has been notified",
    });
    onClose();
  };

  const handleCounter = () => {
    if (counterPrice <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid counter price",
        variant: "destructive",
      });
      return;
    }
    
    onCounter(counterPrice, counterMessage);
    toast({
      title: "🔄 Counter Offer Sent",
      description: `Your counter offer of ${formatCurrency(counterPrice)} per ticket has been sent`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Investment Bid Request
          </DialogTitle>
          <DialogDescription>
            Review and respond to this investment bid
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bid Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Investor</span>
              <span className="font-semibold">{bidDetails.investorName}</span>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Number of tickets</span>
                <span className="font-medium">{bidDetails.numTickets}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Offered price per ticket</span>
                <span className="font-medium text-amber-600">{formatCurrency(bidDetails.pricePerTicket)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your minimum ticket</span>
                <span className="font-medium">{formatCurrency(bidDetails.originalMinTicket)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Difference</span>
                <span className="font-medium text-red-500">-{percentBelowMin}%</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Total Investment</span>
                <span className="font-bold text-primary">{formatCurrency(bidDetails.totalAmount)}</span>
              </div>
            </div>
          </div>

          {responseType === "review" && (
            <>
              {/* Quick Response Options */}
              <div className="space-y-2">
                <Label>Choose your response:</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="default"
                    className="justify-start"
                    onClick={handleAccept}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Bid ({formatCurrency(bidDetails.totalAmount)})
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => setResponseType("counter")}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Make Counter Offer
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="justify-start text-red-600 hover:bg-red-50"
                    onClick={() => setResponseType("reject")}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Bid
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                💡 Tip: Consider the investor's commitment level. They're showing interest even at a lower price point.
              </div>
            </>
          )}

          {responseType === "counter" && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Counter Price per Ticket</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(Math.max(1, parseInt(e.target.value) || 1))}
                      className="pl-9"
                      min={1}
                      placeholder="Enter your counter price"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total would be: {formatCurrency(counterPrice * bidDetails.numTickets)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Message (Optional)</Label>
                  <Textarea
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    placeholder="Explain your counter offer..."
                    className="resize-none h-20"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setResponseType("review")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCounter}
                    className="flex-1"
                  >
                    Send Counter Offer
                  </Button>
                </div>
              </div>
            </>
          )}

          {responseType === "reject" && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reason for Rejection (Optional)</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Let the investor know why their bid doesn't work..."
                    className="resize-none h-20"
                  />
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    ⚠️ Rejecting this bid will notify the investor. Consider making a counter offer instead to keep negotiations open.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setResponseType("review")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    className="flex-1"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}