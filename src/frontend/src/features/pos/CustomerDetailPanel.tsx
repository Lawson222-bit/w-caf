import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAddCardBalance } from "@/hooks/useAddCardBalance";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import {
  CreditCard,
  Loader2,
  Package,
  Star,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CustomerDetailPanelProps {
  customerUsername: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CARD_COLOR_GRADIENTS: Record<string, string> = {
  black: "from-neutral-700 to-neutral-900",
  gold: "from-amber-400 to-yellow-600",
  blue: "from-blue-400 to-blue-700",
  pink: "from-pink-400 to-rose-600",
  purple: "from-violet-400 to-purple-700",
  green: "from-emerald-400 to-green-700",
};

function CustomerCardTile({
  card,
  onAddBalance,
}: {
  card: {
    id: string;
    cardName: string;
    cardNumber: string;
    expirationDate: string;
    cvv: string;
    balance: number;
    cardColor: string;
  };
  onAddBalance: (cardId: string, amount: number) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [amount, setAmount] = useState("");

  const gradient =
    CARD_COLOR_GRADIENTS[card.cardColor] || CARD_COLOR_GRADIENTS.purple;
  const last4 = card.cardNumber.slice(-4);

  const handleAdd = () => {
    const val = Number.parseFloat(amount);
    if (Number.isNaN(val) || val <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    onAddBalance(card.id, val);
    setAmount("");
    setShowInput(false);
  };

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg overflow-hidden`}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl">💳</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {card.cardName}
          </span>
        </div>

        <p className="font-mono text-base tracking-widest mb-2">
          •••• •••• •••• {last4}
        </p>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wide">
              Expires
            </p>
            <p className="font-semibold text-sm">{card.expirationDate}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70 uppercase tracking-wide">
              Balance
            </p>
            <p className="font-bold text-lg">${card.balance.toFixed(2)}</p>
          </div>
        </div>

        {showInput ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white h-8"
              onClick={handleAdd}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/70 hover:text-white h-8"
              onClick={() => {
                setShowInput(false);
                setAmount("");
              }}
            >
              ✕
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full bg-white/20 hover:bg-white/30 text-white"
            onClick={() => setShowInput(true)}
          >
            <Wallet className="w-3 h-3 mr-1" />
            Add Balance
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CustomerDetailPanel({
  customerUsername,
  open,
  onOpenChange,
}: CustomerDetailPanelProps) {
  const {
    data: profile,
    isLoading,
    error,
  } = useCustomerProfile(customerUsername);
  const addBalanceMutation = useAddCardBalance();

  const handleAddBalance = (cardId: string, amount: number) => {
    addBalanceMutation.mutate(
      { cardId, amount },
      {
        onSuccess: () => {
          toast.success("Balance added!");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to add balance",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {customerUsername}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            <p>Failed to load customer profile.</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        )}

        {profile && (
          <div className="space-y-6">
            {/* Points */}
            <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-xl">
              <Star className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Reward Points</p>
                <p className="text-xl font-bold">{profile.points.toString()}</p>
              </div>
            </div>

            {/* Orders */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Orders ({profile.orders.length})
              </h3>
              {profile.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No orders yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {profile.orders.map((order) => (
                    <div
                      key={order.id.toString()}
                      className="p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          Order #{order.id.toString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            Number(order.timestamp),
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {order.items.map((item) => (
                          <li key={item.name} className="flex justify-between">
                            <span>{item.name}</span>
                            <span>${item.price.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                      <Separator className="my-1.5" />
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span className="text-primary">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cards */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Credit Cards ({profile.cards.length})
              </h3>
              {profile.cards.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No credit cards yet.
                </p>
              ) : (
                <div className="grid gap-3">
                  {profile.cards.map((card) => (
                    <CustomerCardTile
                      key={card.id}
                      card={card}
                      onAddBalance={handleAddBalance}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
