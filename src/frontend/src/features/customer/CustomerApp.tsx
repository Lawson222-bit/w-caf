import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetRewardPoints, useRedeemForGiftCard } from "@/hooks/useRewards";
import { Gift, LogOut, Star } from "lucide-react";
import { useState } from "react";
import CustomerCardsTab from "./CustomerCardsTab";
import CustomerOrderScreen from "./CustomerOrderScreen";
import WPayTabContent from "./WPayTabContent";

interface CustomerAppProps {
  username: string;
  password: string;
  onLogout: () => void;
}

export default function CustomerApp({
  username,
  password,
  onLogout,
}: CustomerAppProps) {
  const { data: points, refetch: refetchPoints } = useGetRewardPoints(username);
  const redeemMutation = useRedeemForGiftCard();

  const [activeTab, setActiveTab] = useState("order");
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [redeemError, setRedeemError] = useState("");

  const pointsNum = points ? Number(points) : 0;
  const canRedeem = pointsNum >= 500;

  const handleRedeem = async () => {
    if (!cardName.trim()) {
      setRedeemError("Please enter a name for your gift card.");
      return;
    }
    setRedeemError("");
    try {
      const code = await redeemMutation.mutateAsync({
        username,
        cardName: cardName.trim(),
      });
      if (code && code.length > 0) {
        setGiftCode(code);
        refetchPoints();
      } else {
        setRedeemError("Redemption failed. Please try again.");
      }
    } catch {
      setRedeemError("Redemption failed. Please try again.");
    }
  };

  const handleRedeemClose = () => {
    setRedeemOpen(false);
    setCardName("");
    setGiftCode("");
    setRedeemError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border shadow-sm py-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <img
              src="/assets/generated/pos-logo.dim_512x512.png"
              alt="W Cafe logo"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">The W Cafe</h1>
              <p className="text-sm text-muted-foreground">Hi, {username}!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-2">
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              <span className="text-sm font-semibold text-foreground">
                {pointsNum} pts
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                You have {pointsNum} point{pointsNum !== 1 ? "s" : ""}
              </span>
            </div>

            {canRedeem && (
              <Button
                data-ocid="customer.redeem.button"
                variant="outline"
                size="sm"
                className="border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 font-semibold gap-1"
                onClick={() => setRedeemOpen(true)}
              >
                <Gift className="w-4 h-4" />
                Redeem Reward
              </Button>
            )}

            <Button
              data-ocid="customer.logout.button"
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="bg-card border-b border-border">
            <TabsList className="mx-auto max-w-xs flex w-full rounded-none bg-transparent border-0 h-12">
              <TabsTrigger
                value="order"
                data-ocid="customer.order.tab"
                className="flex-1 text-base"
              >
                Order
              </TabsTrigger>
              <TabsTrigger
                value="cards"
                data-ocid="customer.cards.tab"
                className="flex-1 text-base"
              >
                Cards
              </TabsTrigger>
              <TabsTrigger
                value="wpay"
                data-ocid="customer.wpay.tab"
                className="flex-1 text-base"
              >
                W Pay
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="order" className="flex-1 mt-0 p-0">
            <CustomerOrderScreenWrapped
              username={username}
              onOrderPlaced={refetchPoints}
            />
          </TabsContent>

          <TabsContent value="cards" className="flex-1 mt-0 p-0">
            <CustomerCardsTab username={username} password={password} />
          </TabsContent>

          <TabsContent value="wpay" className="flex-1 mt-0 p-0">
            <WPayTabContent username={username} onPaid={refetchPoints} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={redeemOpen} onOpenChange={handleRedeemClose}>
        <DialogContent data-ocid="customer.redeem.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
              Redeem Your Reward
            </DialogTitle>
          </DialogHeader>

          {giftCode ? (
            <div
              className="flex flex-col items-center gap-4 py-4"
              data-ocid="customer.redeem.success_state"
            >
              <div className="text-5xl">🎁</div>
              <p className="text-center font-semibold text-foreground text-lg">
                Your gift card is ready!
              </p>
              <div className="bg-muted rounded-xl px-6 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Gift Card Code
                </p>
                <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                  {giftCode}
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Share this code with the cashier to use your $500 gift card!
              </p>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                500 points redeemed
              </Badge>
              <Button
                onClick={handleRedeemClose}
                data-ocid="customer.redeem.close_button"
                className="w-full mt-2"
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-foreground">
                  {pointsNum} points
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Redeem 500 points for a $500 gift card
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="card-name-input"
                  className="text-sm font-medium text-foreground"
                >
                  Name your gift card
                </label>
                <Input
                  id="card-name-input"
                  data-ocid="customer.redeem.input"
                  placeholder="e.g. My Cafe Card"
                  value={cardName}
                  onChange={(e) => {
                    setCardName(e.target.value);
                    setRedeemError("");
                  }}
                />
                {redeemError && (
                  <p
                    className="text-destructive text-xs"
                    data-ocid="customer.redeem.error_state"
                  >
                    {redeemError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRedeemClose}
                  data-ocid="customer.redeem.cancel_button"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRedeem}
                  disabled={redeemMutation.isPending}
                  data-ocid="customer.redeem.confirm_button"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  {redeemMutation.isPending ? "Redeeming..." : "Redeem"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Thin wrapper to intercept order placed event
// Thin wrapper to intercept order placed event
function CustomerOrderScreenWrapped({
  username,
  onOrderPlaced,
}: {
  username: string;
  onOrderPlaced: () => void;
}) {
  return (
    <CustomerOrderScreen username={username} onOrderPlaced={onOrderPlaced} />
  );
}
