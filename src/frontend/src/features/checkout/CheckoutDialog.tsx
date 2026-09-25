import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor } from "@/hooks/useActor";
import { useCompleteTransaction } from "@/hooks/useCompleteTransaction";
import {
  useAllCustomerCards,
  useCustomerCardPayment,
} from "@/hooks/useCustomerCards";
import { useGiftCardPayment } from "@/hooks/useGiftCards";
import { useCardPaymentStore } from "@/state/cardPaymentStore";
import {
  Banknote,
  CreditCard,
  Gift,
  IdCard,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CartItem } from "../../App";
import { useTransactionStore } from "../../state/transactionsStore";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  total: number;
  onSuccess: (receiptId: string) => void;
}

type PaymentMethod = "cash" | "giftcard" | "card" | "wpay" | "customercard";

type CardSubMethod = "device" | "customercard";

export default function CheckoutDialog({
  open,
  onOpenChange,
  cart,
  total,
  onSuccess,
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [error, setError] = useState("");

  const [wPayCode, setWPayCode] = useState("");
  const [wPayOverlay, setWPayOverlay] = useState(false);
  const [wPayLoading, setWPayLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [cardPayLoading, setCardPayLoading] = useState(false);
  const [cardSubMethod, setCardSubMethod] = useState<CardSubMethod>("device");
  const [cardPayPolling, setCardPayPolling] = useState(false);
  const { actor } = useActor();
  const activePaymentCode = useCardPaymentStore((s) => s.activePaymentCode);
  const setCardPayment = useCardPaymentStore((s) => s.setActivePayment);
  const clearCardPayment = useCardPaymentStore((s) => s.clearActivePayment);
  const setPaymentActive = useCardPaymentStore((s) => s.setPaymentActive);
  const setCheckoutActive = useCardPaymentStore((s) => s.setCheckoutActive);
  const isPaymentActive = useCardPaymentStore((s) => s.isPaymentActive);

  const completeMutation = useCompleteTransaction();
  const giftCardMutation = useGiftCardPayment();
  const { data: allCustomerCards } = useAllCustomerCards();
  const customerCardMutation = useCustomerCardPayment();

  const resetForm = () => {
    setPaymentMethod("cash");
    setGiftCardCode("");
    setError("");

    setWPayCode("");
    setWPayOverlay(false);
    setWPayLoading(false);
    setSelectedCardId("");
    setCardPayLoading(false);
    setCardPayPolling(false);
    setCardSubMethod("device");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
      clearCardPayment();
      setPaymentActive(false);
      setCheckoutActive(false);
    }
    onOpenChange(open);
  };

  useEffect(() => {
    if (!cardPayPolling || !activePaymentCode || !actor) return;

    const interval = setInterval(async () => {
      try {
        const result = await actor.getOrderByPaymentCode(activePaymentCode);
        if (!result) {
          clearInterval(interval);
          setCardPayPolling(false);
          useTransactionStore.getState().addTransaction({
            id: `card-device-${Date.now()}`,
            items: cart.map((item) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity ?? 1,
              category: item.category ?? "",
            })),
            total,
            paymentMethod: "Card (Device)",
            timestamp: Date.now(),
          });
          clearCardPayment();
          setPaymentActive(false);
          setCheckoutActive(false);
          onSuccess(`card-device-${Date.now()}`);
        }
      } catch {
        // ignore polling errors, keep trying
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [
    cardPayPolling,
    activePaymentCode,
    actor,
    cart,
    total,
    onSuccess,
    clearCardPayment,
    setPaymentActive,
    setCheckoutActive,
  ]);

  // Listen for card device payment completion via store
  useEffect(() => {
    // When payment is no longer active and we were polling, it means payment completed
    if (cardPayPolling && !isPaymentActive && activePaymentCode === null) {
      setCardPayPolling(false);
      setCheckoutActive(false);
      onSuccess(`card-device-${Date.now()}`);
    }
  }, [
    isPaymentActive,
    cardPayPolling,
    activePaymentCode,
    onSuccess,
    setCheckoutActive,
  ]);

  const handleCheckout = async () => {
    setError("");

    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    if (paymentMethod === "card") {
      if (cardSubMethod === "customercard") {
        if (!selectedCardId) {
          setError("Please select a customer card");
          return;
        }
        const selectedCard = allCustomerCards?.find(
          (c) => c.id === selectedCardId,
        );
        if (!selectedCard) {
          setError("Selected card not found");
          return;
        }
        if (selectedCard.balance < total) {
          setError("Insufficient card balance");
          return;
        }
        try {
          await customerCardMutation.mutateAsync({
            cardId: selectedCardId,
            amount: total,
          });
          const receiptId = await completeMutation.mutateAsync({
            items: cart,
            total,
            paymentMethod: `Customer Card (${selectedCard.cardName})`,
          });
          resetForm();
          onSuccess(receiptId);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "";
          if (msg.includes("Insufficient card balance")) {
            setError(
              "Insufficient card balance. Please use a different payment method.",
            );
          } else {
            setError("Payment failed. Please try again.");
          }
        }
        return;
      }

      // cardSubMethod === "device"
      // cardSubMethod === "device"
      if (!actor) {
        setError("Not connected. Please try again.");
        return;
      }
      const pairingCode = useCardPaymentStore.getState().pairingCode;
      if (!pairingCode) {
        setError("No pairing code available. Please refresh the page.");
        return;
      }
      setCardPayLoading(true);
      try {
        const orderId = BigInt(Date.now());
        await actor.activateCardDevice(pairingCode, orderId);
        // Set active payment code so polling and completion detection work
        setCardPayment(
          pairingCode,
          cart.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity ?? 1,
            category: item.category ?? undefined,
          })),
          total,
          "Cashier Order",
        );
        setCheckoutActive(true);
        setCardPayPolling(true);
      } catch {
        setError("Failed to activate card device. Please try again.");
      } finally {
        setCardPayLoading(false);
      }
      return;
    }

    if (paymentMethod === "wpay") {
      if (!actor) {
        setError("Not connected. Please try again.");
        return;
      }
      setWPayLoading(true);
      try {
        const cartMenuItems = cart.map((item) => ({
          name: item.name,
          price: item.price,
          category: item.category,
        }));
        const generatedCode = await actor.createWPayOrder(
          "Cashier Order",
          cartMenuItems,
          total,
        );
        setWPayCode(generatedCode);
        setWPayOverlay(true);
        useTransactionStore.getState().addTransaction({
          id: `wpay-${Date.now()}`,
          items: cart.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity ?? 1,
            category: item.category ?? "",
          })),
          total,
          paymentMethod: "W Pay",
          timestamp: Date.now(),
        });
      } catch {
        setError("Failed to create W Pay order. Please try again.");
      } finally {
        setWPayLoading(false);
      }
      return;
    }

    try {
      let paymentMethodLabel = "";

      if (paymentMethod === "giftcard") {
        if (!giftCardCode.trim()) {
          setError("Please enter a gift card code");
          return;
        }
        await giftCardMutation.mutateAsync({
          code: giftCardCode.trim(),
          amount: total,
        });
        paymentMethodLabel = `Gift Card (${giftCardCode.trim()})`;
      } else if (paymentMethod === "customercard") {
        if (!selectedCardId) {
          setError("Please select a customer card");
          return;
        }
        const selectedCard = allCustomerCards?.find(
          (c) => c.id === selectedCardId,
        );
        if (!selectedCard) {
          setError("Selected card not found");
          return;
        }
        if (selectedCard.balance < total) {
          setError("Insufficient card balance");
          return;
        }
        await customerCardMutation.mutateAsync({
          cardId: selectedCardId,
          amount: total,
        });
        paymentMethodLabel = `Customer Card (${selectedCard.cardName})`;
      } else {
        paymentMethodLabel = "Fake Cash";
      }

      const receiptId = await completeMutation.mutateAsync({
        items: cart,
        total,
        paymentMethod: paymentMethodLabel,
      });

      resetForm();
      onSuccess(receiptId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Insufficient gift card balance")) {
        setError(
          "Insufficient gift card balance. Please use a different payment method.",
        );
      } else if (msg.includes("Gift card not found")) {
        setError("Gift card not found. Please check the code and try again.");
      } else if (msg.includes("Insufficient card balance")) {
        setError(
          "Insufficient card balance. Please use a different payment method.",
        );
      } else {
        setError("Payment failed. Please try again.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Choose your payment method. Remember, all money is fake! 🎮
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center p-4 bg-accent/20 rounded-lg">
            <span className="font-semibold">Total:</span>
            <span className="text-2xl font-bold text-primary">
              ${total.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="checkout.cash.radio"
              >
                <RadioGroupItem value="cash" id="cash" />
                <Label
                  htmlFor="cash"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Banknote className="w-5 h-5 text-primary" />
                  <span>Fake Cash</span>
                </Label>
              </div>

              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="checkout.card.radio"
              >
                <RadioGroupItem value="card" id="card" />
                <Label
                  htmlFor="card"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>Online Credit Card</span>
                </Label>
              </div>

              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="checkout.giftcard.radio"
              >
                <RadioGroupItem value="giftcard" id="giftcard" />
                <Label
                  htmlFor="giftcard"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Gift className="w-5 h-5 text-primary" />
                  <span>Gift Card</span>
                </Label>
              </div>

              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="checkout.wpay.radio"
              >
                <RadioGroupItem value="wpay" id="wpay" />
                <Label
                  htmlFor="wpay"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span>W Pay</span>
                </Label>
              </div>

              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="checkout.customercard.radio"
              >
                <RadioGroupItem value="customercard" id="customercard" />
                <Label
                  htmlFor="customercard"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <IdCard className="w-5 h-5 text-primary" />
                  <span>Customer Card</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === "giftcard" && (
            <div className="space-y-2">
              <Label htmlFor="giftCardCode">Gift Card Code</Label>
              <Input
                id="giftCardCode"
                data-ocid="checkout.giftcard.input"
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value)}
                placeholder="Enter gift card code"
              />
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="space-y-2 pl-8">
              <Label>Card Option</Label>
              <RadioGroup
                value={cardSubMethod}
                onValueChange={(v) => setCardSubMethod(v as CardSubMethod)}
              >
                <div className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="device" id="card-device" />
                  <Label
                    htmlFor="card-device"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span>Use Card Device</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="customercard" id="card-customer" />
                  <Label
                    htmlFor="card-customer"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <IdCard className="w-4 h-4 text-primary" />
                    <span>Pay with Customer Card</span>
                  </Label>
                </div>
              </RadioGroup>

              {cardSubMethod === "customercard" && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="customerCardSelectCard">
                    Select Customer Card
                  </Label>
                  <Select
                    value={selectedCardId}
                    onValueChange={setSelectedCardId}
                  >
                    <SelectTrigger
                      id="customerCardSelectCard"
                      data-ocid="checkout.card.customercard.select"
                    >
                      <SelectValue placeholder="Choose a card..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allCustomerCards && allCustomerCards.length > 0 ? (
                        allCustomerCards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.cardName} — ${card.balance.toFixed(2)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No customer cards available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {paymentMethod === "customercard" && (
            <div className="space-y-2">
              <Label htmlFor="customerCardSelect">Select Customer Card</Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger
                  id="customerCardSelect"
                  data-ocid="checkout.customercard.select"
                >
                  <SelectValue placeholder="Choose a card..." />
                </SelectTrigger>
                <SelectContent>
                  {allCustomerCards && allCustomerCards.length > 0 ? (
                    allCustomerCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.cardName} — ${card.balance.toFixed(2)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No customer cards available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Card Payment waiting overlay */}
          {cardPayPolling && (
            <div
              data-ocid="checkout.cardpay.overlay"
              className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-foreground">
                  Card Device Activated
                </p>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setCardPayPolling(false);
                    clearCardPayment();
                    setPaymentActive(false);
                    setCheckoutActive(false);
                  }}
                  data-ocid="checkout.cardpay.close_button"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Waiting for customer to pay on the card device...
              </p>
              <div className="flex justify-center py-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            </div>
          )}

          {/* W Pay overlay */}
          {wPayOverlay && wPayCode && (
            <div
              data-ocid="checkout.wpay.overlay"
              className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-foreground">
                  W Pay Code
                </p>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setWPayOverlay(false)}
                  data-ocid="checkout.wpay.close_button"
                >
                  ✕
                </button>
              </div>
              <p className="text-3xl font-mono font-bold text-primary tracking-widest text-center">
                {wPayCode}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Ask the customer to open W Pay and enter this code
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                data-ocid="checkout.wpay.copy_button"
                onClick={() => navigator.clipboard.writeText(wPayCode)}
              >
                Copy Code
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive" data-ocid="checkout.error_state">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            data-ocid="checkout.cancel_button"
          >
            Cancel
          </Button>
          <Button
            data-ocid="checkout.submit_button"
            onClick={handleCheckout}
            disabled={
              completeMutation.isPending ||
              giftCardMutation.isPending ||
              customerCardMutation.isPending ||
              wPayLoading ||
              cardPayLoading
            }
          >
            {completeMutation.isPending ||
            giftCardMutation.isPending ||
            customerCardMutation.isPending ||
            wPayLoading ||
            cardPayLoading
              ? "Processing..."
              : paymentMethod === "wpay"
                ? "Generate W Pay Code"
                : paymentMethod === "card"
                  ? cardSubMethod === "customercard"
                    ? "Pay with Customer Card"
                    : "Activate Card Device"
                  : "Complete Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
