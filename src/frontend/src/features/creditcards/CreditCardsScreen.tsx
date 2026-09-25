import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddCardBalance } from "@/hooks/useAddCardBalance";
import { useAllCustomerCards } from "@/hooks/useAllCustomerCards";
import { useDeleteCustomerCard } from "@/hooks/useDeleteCustomerCard";
import {
  CreditCard,
  Loader2,
  Plus,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SavedCard = {
  id: string;
  name: string;
  number: string; // full 16 digits stored
  expiry: string;
  cvv: string;
};

const STORAGE_KEY = "saved_credit_cards";

const CARD_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-700",
  "from-emerald-500 to-teal-700",
  "from-orange-500 to-amber-600",
];

const CUSTOMER_CARD_COLORS: Record<string, string> = {
  black: "from-neutral-700 to-neutral-900",
  gold: "from-amber-400 to-yellow-600",
  blue: "from-blue-400 to-blue-700",
  pink: "from-pink-400 to-rose-600",
  purple: "from-violet-400 to-purple-700",
  green: "from-emerald-400 to-green-700",
};

export default function CreditCardsScreen() {
  const [cards, setCards] = useState<SavedCard[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const { data: customerCards, isLoading: customerCardsLoading } =
    useAllCustomerCards();
  const addBalanceMutation = useAddCardBalance();
  const deleteCardMutation = useDeleteCustomerCard();

  const [balanceCardId, setBalanceCardId] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const formatNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleAdd = () => {
    const raw = number.replace(/\s/g, "");
    if (!name.trim()) {
      toast.error("Please enter cardholder name");
      return;
    }
    if (raw.length !== 16) {
      toast.error("Card number must be 16 digits");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      toast.error("Expiry must be MM/YY");
      return;
    }
    if (!/^\d{3}$/.test(cvv)) {
      toast.error("CVV must be 3 digits");
      return;
    }

    const card: SavedCard = {
      id: Date.now().toString(),
      name: name.trim(),
      number: raw,
      expiry,
      cvv,
    };
    setCards((prev) => [...prev, card]);
    setName("");
    setNumber("");
    setExpiry("");
    setCvv("");
    setShowForm(false);
    toast.success("Card added! 🎉");
  };

  const handleDeleteLocal = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    toast.success("Card removed");
  };

  const handleDeleteCustomerCard = (cardId: string) => {
    deleteCardMutation.mutate(cardId, {
      onSuccess: () => {
        toast.success("Customer card deleted");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete card",
        );
      },
    });
  };

  const handleAddBalance = () => {
    if (!balanceCardId) return;
    const amount = Number.parseFloat(balanceAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    addBalanceMutation.mutate(
      { cardId: balanceCardId, amount },
      {
        onSuccess: () => {
          toast.success("Balance added!");
          setBalanceCardId(null);
          setBalanceAmount("");
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Credit Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fake Cards for Fun 🎮 — for practice only!
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="gap-2"
          data-ocid="creditcards.open_modal_button"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Card"}
        </Button>
      </div>

      {/* Add Card Form */}
      {showForm && (
        <div
          className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm"
          data-ocid="creditcards.panel"
        >
          <h2 className="font-semibold text-foreground mb-4">
            New Fake Card ✨
          </h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="cc-name">Cardholder Name</Label>
              <Input
                id="cc-name"
                placeholder="e.g. Alex Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                data-ocid="creditcards.input"
              />
            </div>
            <div>
              <Label htmlFor="cc-number">Card Number</Label>
              <Input
                id="cc-number"
                placeholder="1234 5678 9012 3456"
                value={number}
                onChange={(e) => setNumber(formatNumber(e.target.value))}
                maxLength={19}
                className="mt-1 font-mono tracking-wider"
                data-ocid="creditcards.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cc-expiry">Expiry (MM/YY)</Label>
                <Input
                  id="cc-expiry"
                  placeholder="12/28"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  className="mt-1"
                  data-ocid="creditcards.input"
                />
              </div>
              <div>
                <Label htmlFor="cc-cvv">CVV</Label>
                <Input
                  id="cc-cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  maxLength={3}
                  className="mt-1"
                  data-ocid="creditcards.input"
                />
              </div>
            </div>
            <Button
              onClick={handleAdd}
              className="w-full"
              data-ocid="creditcards.submit_button"
            >
              Save Card 💳
            </Button>
          </div>
        </div>
      )}

      {/* Local Saved Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Saved Cards
        </h2>
        {cards.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl"
            data-ocid="creditcards.local_empty_state"
          >
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">No saved cards yet!</p>
            <p className="text-sm mt-1">Add a fake card to get started 🚀</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cards.map((card, idx) => {
              const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
              const last4 = card.number.slice(-4);
              const ocidIdx = idx + 1;
              return (
                <div
                  key={card.id}
                  className={`relative rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg overflow-hidden`}
                  data-ocid={`creditcards.local_item.${ocidIdx}`}
                >
                  <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">💳</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocal(card.id)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        data-ocid={`creditcards.local_delete_button.${ocidIdx}`}
                        aria-label="Remove card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="font-mono text-lg tracking-widest mb-3">
                      •••• •••• •••• {last4}
                    </p>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-white/70 uppercase tracking-wide">
                          Cardholder
                        </p>
                        <p className="font-semibold">{card.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/70 uppercase tracking-wide">
                          Expires
                        </p>
                        <p className="font-semibold">{card.expiry}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Generated Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Customer Cards
        </h2>

        {customerCardsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!customerCardsLoading &&
          (!customerCards || customerCards.length === 0) && (
            <div
              className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl"
              data-ocid="creditcards.customer_empty_state"
            >
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">No customer cards yet!</p>
              <p className="text-sm mt-1">
                Customers can generate cards from the customer app
              </p>
            </div>
          )}

        {!customerCardsLoading && customerCards && customerCards.length > 0 && (
          <div className="grid gap-4">
            {customerCards.map((card, idx) => {
              const gradient =
                CUSTOMER_CARD_COLORS[card.cardColor] ||
                CUSTOMER_CARD_COLORS.purple;
              const last4 = card.cardNumber.slice(-4);
              const ocidIdx = idx + 1;
              return (
                <div
                  key={card.id}
                  className={`relative rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg overflow-hidden`}
                  data-ocid={`creditcards.customer_item.${ocidIdx}`}
                >
                  <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">💳</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          {card.customerUsername}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                              data-ocid={`creditcards.customer_delete_button.${ocidIdx}`}
                              aria-label="Delete customer card"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Card?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete{" "}
                                {card.customerUsername}&apos;s &quot;
                                {card.cardName}&quot; card. This action cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteCustomerCard(card.id)
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <p className="font-mono text-lg tracking-widest mb-2">
                      •••• •••• •••• {last4}
                    </p>

                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-xs text-white/70 uppercase tracking-wide">
                          Card Name
                        </p>
                        <p className="font-semibold">{card.cardName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/70 uppercase tracking-wide">
                          Expires
                        </p>
                        <p className="font-semibold">{card.expirationDate}</p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-xs text-white/70 uppercase tracking-wide">
                          CVV
                        </p>
                        <p className="font-semibold">{card.cvv}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/70 uppercase tracking-wide">
                          Balance
                        </p>
                        <p className="font-bold text-xl">
                          ${card.balance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-white/20 hover:bg-white/30 text-white"
                      onClick={() => setBalanceCardId(card.id)}
                      data-ocid={`creditcards.customer_add_balance_button.${ocidIdx}`}
                    >
                      <Wallet className="w-3 h-3 mr-1" />
                      Add Balance
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Balance Dialog */}
      <Dialog
        open={!!balanceCardId}
        onOpenChange={(open) => {
          if (!open) {
            setBalanceCardId(null);
            setBalanceAmount("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="balance-amount">Amount ($)</Label>
              <Input
                id="balance-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddBalance();
                }}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setBalanceCardId(null);
                  setBalanceAmount("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddBalance}
                disabled={addBalanceMutation.isPending}
              >
                {addBalanceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
