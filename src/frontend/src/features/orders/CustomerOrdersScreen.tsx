import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useActor } from "@/hooks/useActor";
import { useCompleteTransaction } from "@/hooks/useCompleteTransaction";
import {
  useAllCustomerCards,
  useCustomerCardPayment,
} from "@/hooks/useCustomerCards";
import { useGiftCardPayment } from "@/hooks/useGiftCards";
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Gift,
  IdCard,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CartItem } from "../../App";
import type { CustomerOrder } from "../../state/ordersStore";
import { useOrdersStore } from "../../state/ordersStore";
import { useTransactionStore } from "../../state/transactionsStore";
import SimulatedCardForm from "../checkout/SimulatedCardForm";

type PaymentMethod = "cash" | "giftcard" | "card" | "wpay" | "customercard";

interface PaymentDialogProps {
  order: CustomerOrder | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentDialog({ order, onClose, onSuccess }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [error, setError] = useState("");
  const [cardValid, setCardValid] = useState(false);
  const [wPayCode, setWPayCode] = useState("");
  const [wPayOverlay, setWPayOverlay] = useState(false);
  const [wPayLoading, setWPayLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState("");
  const { actor } = useActor();

  const completeMutation = useCompleteTransaction();
  const giftCardMutation = useGiftCardPayment();
  const { data: allCustomerCards } = useAllCustomerCards();
  const customerCardMutation = useCustomerCardPayment();

  const reset = () => {
    setPaymentMethod("cash");
    setGiftCardCode("");
    setError("");
    setCardValid(false);
    setWPayCode("");
    setWPayOverlay(false);
    setWPayLoading(false);
    setSelectedCardId("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCardValidChange = useCallback((valid: boolean) => {
    setCardValid(valid);
  }, []);

  const handlePay = async () => {
    if (!order) return;
    setError("");

    if (paymentMethod === "wpay") {
      if (!actor) {
        setError("Not connected. Please try again.");
        return;
      }
      setWPayLoading(true);
      try {
        const cartItems = order.items.map((item) => ({
          name: item.name,
          price: item.price,
          category: undefined,
        }));
        const generatedCode = await actor.createWPayOrder(
          order.customerName,
          cartItems,
          order.total,
        );
        setWPayCode(generatedCode);
        setWPayOverlay(true);
        useTransactionStore.getState().addTransaction({
          id: `wpay-${Date.now()}`,
          items: order.items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity ?? 1,
            category:
              (
                item as {
                  name: string;
                  price: number;
                  quantity: number;
                  category?: string;
                }
              ).category ?? "",
          })),
          total: order.total,
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
          amount: order.total,
        });
        paymentMethodLabel = `Gift Card (${giftCardCode.trim()})`;
      } else if (paymentMethod === "card") {
        if (!cardValid) {
          setError("Please fill in all card details.");
          return;
        }
        paymentMethodLabel = "Online Credit Card";
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
        if (selectedCard.balance < order.total) {
          setError("Insufficient card balance");
          return;
        }
        await customerCardMutation.mutateAsync({
          cardId: selectedCardId,
          amount: order.total,
        });
        paymentMethodLabel = `Customer Card (${selectedCard.cardName})`;
      } else {
        paymentMethodLabel = "Fake Cash";
      }

      const cartItems: CartItem[] = order.items.map((item) => ({
        ...item,
        category: "",
      }));

      await completeMutation.mutateAsync({
        items: cartItems,
        total: order.total,
        paymentMethod: paymentMethodLabel,
      });

      reset();
      onSuccess();
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

  const isPending =
    completeMutation.isPending ||
    giftCardMutation.isPending ||
    customerCardMutation.isPending;

  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md" data-ocid="orders.payment.dialog">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogDescription>
            Order for <strong>{order?.customerName}</strong> — choose a payment
            method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Order summary */}
          <div className="rounded-lg bg-accent/20 p-3 space-y-1">
            {order?.items.map((item) => (
              <div key={item.name} className="flex justify-between text-sm">
                <span>
                  {item.quantity}× {item.name}
                </span>
                <span className="text-muted-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">${order?.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="orders.payment.cash.radio"
              >
                <RadioGroupItem value="cash" id="pay-cash" />
                <Label
                  htmlFor="pay-cash"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Banknote className="w-4 h-4 text-primary" />
                  Fake Cash
                </Label>
              </div>
              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="orders.payment.card.radio"
              >
                <RadioGroupItem value="card" id="pay-card" />
                <Label
                  htmlFor="pay-card"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <CreditCard className="w-4 h-4 text-primary" />
                  Online Credit Card
                </Label>
              </div>
              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="orders.payment.giftcard.radio"
              >
                <RadioGroupItem value="giftcard" id="pay-giftcard" />
                <Label
                  htmlFor="pay-giftcard"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Gift className="w-4 h-4 text-primary" />
                  Gift Card
                </Label>
              </div>
              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="orders.payment.wpay.radio"
              >
                <RadioGroupItem value="wpay" id="pay-wpay" />
                <Label
                  htmlFor="pay-wpay"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Smartphone className="w-4 h-4 text-primary" />W Pay
                </Label>
              </div>
              <div
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                data-ocid="orders.payment.customercard.radio"
              >
                <RadioGroupItem value="customercard" id="pay-customercard" />
                <Label
                  htmlFor="pay-customercard"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <IdCard className="w-4 h-4 text-primary" />
                  Customer Card
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === "card" && (
            <SimulatedCardForm onValidChange={handleCardValidChange} />
          )}

          {paymentMethod === "giftcard" && (
            <div className="space-y-2">
              <Label htmlFor="order-gift-code">Gift Card Code</Label>
              <Input
                id="order-gift-code"
                data-ocid="orders.payment.giftcard.input"
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value)}
                placeholder="Enter gift card code"
              />
            </div>
          )}

          {paymentMethod === "customercard" && (
            <div className="space-y-2">
              <Label htmlFor="order-customer-card-select">
                Select Customer Card
              </Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger
                  id="order-customer-card-select"
                  data-ocid="orders.payment.customercard.select"
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

          {/* W Pay overlay */}
          {wPayOverlay && wPayCode && (
            <div
              data-ocid="orders.payment.wpay.overlay"
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
                  data-ocid="orders.payment.wpay.close_button"
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
                data-ocid="orders.payment.wpay.copy_button"
                onClick={() => navigator.clipboard.writeText(wPayCode)}
              >
                Copy Code
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive" data-ocid="orders.payment.error_state">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            data-ocid="orders.payment.cancel_button"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePay}
            disabled={isPending || wPayLoading}
            data-ocid="orders.payment.submit_button"
          >
            {isPending || wPayLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...
              </>
            ) : paymentMethod === "wpay" ? (
              "Generate W Pay Code"
            ) : (
              "Collect Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerOrdersScreen() {
  const { orders, markDone, clearDone } = useOrdersStore();
  const [payingOrder, setPayingOrder] = useState<CustomerOrder | null>(null);
  const { actor } = useActor();

  // Poll backend for new orders every 3 seconds
  useEffect(() => {
    if (!actor) return;
    const fetchOrders = async () => {
      try {
        const backendOrders = await actor.getCustomerOrders();
        for (const bo of backendOrders) {
          const { orders: currentOrders, addOrder } = useOrdersStore.getState();
          const existingIds = currentOrders.map((o) => o.id);
          const id = bo.id.toString();
          if (!existingIds.includes(id)) {
            addOrder({
              id,
              customerName: bo.customerName,
              items: bo.items.map((item) => ({
                name: item.name,
                price: item.price,
                quantity: 1,
              })),
              total: bo.total,
              timestamp: Number(bo.timestamp),
              status: bo.status === "done" ? "done" : "pending",
            });
          }
        }
      } catch {
        // silent - polling
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [actor]);

  const pending = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status === "done");

  const handlePaymentSuccess = () => {
    if (payingOrder) {
      markDone(payingOrder.id);
    }
    setPayingOrder(null);
  };

  if (orders.length === 0) {
    return (
      <div
        data-ocid="orders.empty_state"
        className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground"
      >
        <ClipboardList className="w-16 h-16 opacity-30" />
        <p className="text-lg font-medium">No orders yet</p>
        <p className="text-sm">
          Customer orders placed online will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Online Orders
        </h2>
        {done.length > 0 && (
          <Button
            data-ocid="orders.secondary_button"
            variant="outline"
            size="sm"
            onClick={clearDone}
          >
            Clear Completed ({done.length})
          </Button>
        )}
      </div>

      {pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pending ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((order, i) => (
              <Card
                key={order.id}
                data-ocid={`orders.item.${i + 1}`}
                className="border-accent/60 bg-accent/10 shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {order.customerName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent text-accent-foreground text-xs">
                        Pending
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(order.timestamp)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm space-y-1 mb-3">
                    {order.items.map((item) => (
                      <li key={item.name} className="flex justify-between">
                        <span>
                          {item.quantity}× {item.name}
                        </span>
                        <span className="text-muted-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Separator className="mb-3" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      Total: ${order.total.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        data-ocid={`orders.confirm_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        onClick={() => markDone(order.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark Done
                      </Button>
                      <Button
                        data-ocid={`orders.primary_button.${i + 1}`}
                        size="sm"
                        onClick={() => setPayingOrder(order)}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Collect Payment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Completed ({done.length})
          </h3>
          <div className="space-y-3">
            {done.map((order, i) => (
              <Card
                key={order.id}
                data-ocid={`orders.item.${pending.length + i + 1}`}
                className="opacity-60"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-muted-foreground">
                      {order.customerName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Done
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(order.timestamp)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {order.items
                      .map((it) => `${it.quantity}× ${it.name}`)
                      .join(", ")}
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    ${order.total.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <PaymentDialog
        order={payingOrder}
        onClose={() => setPayingOrder(null)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
