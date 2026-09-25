import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useCustomerCards,
  useGenerateCustomerCard,
} from "@/hooks/useCustomerCards";
import { CreditCard, Loader2, Plus } from "lucide-react";
import { useState } from "react";

interface CustomerCardsTabProps {
  username: string;
  password: string;
}

const CARD_COLORS = [
  {
    name: "black",
    label: "Black",
    bg: "bg-[#1a1a2e]",
    text: "text-white",
    border: "border-white/20",
  },
  {
    name: "gold",
    label: "Gold",
    bg: "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700",
    text: "text-white",
    border: "border-white/20",
  },
  {
    name: "blue",
    label: "Blue",
    bg: "bg-[#1e3a8a]",
    text: "text-white",
    border: "border-white/20",
  },
  {
    name: "pink",
    label: "Pink",
    bg: "bg-[#db2777]",
    text: "text-white",
    border: "border-white/20",
  },
  {
    name: "purple",
    label: "Purple",
    bg: "bg-[#7c3aed]",
    text: "text-white",
    border: "border-white/20",
  },
  {
    name: "green",
    label: "Green",
    bg: "bg-[#065f46]",
    text: "text-white",
    border: "border-white/20",
  },
];

function formatCardNumber(num: string): string {
  return num.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomerCardsTab({
  username,
  password,
}: CustomerCardsTabProps) {
  const { data: cards, isLoading } = useCustomerCards(username, password);
  const generateMutation = useGenerateCustomerCard();

  const [open, setOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [selectedColor, setSelectedColor] = useState("black");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!cardName.trim()) {
      setError("Please enter a name for your card.");
      return;
    }
    setError("");
    try {
      await generateMutation.mutateAsync({
        username,
        password,
        cardName: cardName.trim(),
        cardColor: selectedColor,
      });
      setCardName("");
      setSelectedColor("black");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate card.");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCardName("");
    setSelectedColor("black");
    setError("");
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">My Cards</h2>
            <p className="text-sm text-muted-foreground">
              Generate and manage your W Café cards
            </p>
          </div>
          <Button
            data-ocid="customer.cards.generate_open_button"
            onClick={() => setOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate New Card
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (!cards || cards.length === 0) && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-4"
            data-ocid="customer.cards.empty_state"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No cards yet.</p>
            <Button
              variant="outline"
              onClick={() => setOpen(true)}
              data-ocid="customer.cards.empty_generate_button"
            >
              Generate Your First Card
            </Button>
          </div>
        )}

        {!isLoading && cards && cards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card, index) => {
              const colorDef =
                CARD_COLORS.find((c) => c.name === card.cardColor) ||
                CARD_COLORS[0];
              return (
                <div
                  key={card.id}
                  data-ocid={`customer.cards.item.${index + 1}`}
                  className={`relative rounded-2xl p-5 ${colorDef.bg} ${colorDef.text} shadow-lg border ${colorDef.border} overflow-hidden`}
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                        W Café Card
                      </span>
                      <CreditCard className="w-5 h-5 opacity-80" />
                    </div>

                    <p className="font-mono text-lg tracking-widest">
                      {formatCardNumber(card.cardNumber)}
                    </p>

                    <div className="flex items-center gap-4 text-xs opacity-90">
                      <div>
                        <p className="uppercase tracking-wider opacity-70">
                          Expires
                        </p>
                        <p className="font-medium">{card.expirationDate}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wider opacity-70">
                          CVV
                        </p>
                        <p className="font-medium">{card.cvv}</p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <p className="text-xs opacity-70">Card Name</p>
                        <p className="text-sm font-semibold">{card.cardName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-70">Balance</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(card.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent data-ocid="customer.cards.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Generate New Card
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            <div className="space-y-2">
              <label
                htmlFor="card-name"
                className="text-sm font-medium text-foreground"
              >
                Card Name
              </label>
              <Input
                id="card-name"
                data-ocid="customer.cards.name_input"
                placeholder="e.g. My Cafe Card"
                value={cardName}
                onChange={(e) => {
                  setCardName(e.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Card Color</p>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    data-ocid={`customer.cards.color_${c.name}_button`}
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${c.bg} ${c.border} ${
                      selectedColor === c.name
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    aria-label={`Select ${c.label} color`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p
                className="text-destructive text-sm"
                data-ocid="customer.cards.error_state"
              >
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={handleClose}
                data-ocid="customer.cards.cancel_button"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                data-ocid="customer.cards.confirm_button"
                className="flex-1 gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
