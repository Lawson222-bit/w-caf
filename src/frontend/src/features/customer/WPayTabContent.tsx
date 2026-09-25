import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useActor } from "@/hooks/useActor";
import { useOrdersStore } from "@/state/ordersStore";
import { useTransactionStore } from "@/state/transactionsStore";
import { CheckCircle2, Loader2, Search, Smartphone } from "lucide-react";
import { useState } from "react";
import type { CustomerOrder } from "../../backend";

interface WPayTabContentProps {
  username?: string;
  onPaid?: () => void;
}

export default function WPayTabContent({
  username = "",
  onPaid,
}: WPayTabContentProps) {
  const { actor } = useActor();
  const markDone = useOrdersStore((s) => s.markDone);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  const handleLookup = async () => {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    if (!actor) {
      setError("Not connected. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    setPaid(false);
    try {
      const result = await actor.lookupWPayOrder(trimmed);
      if (!result) {
        setError("Code not found. Please check and try again.");
      } else {
        if (result.status === "paid") {
          setPaid(true);
        }
        setOrder(result);
      }
    } catch {
      setError("Failed to look up order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!actor || !order) return;
    setPaying(true);
    setError("");
    try {
      await actor.markWPayOrderPaid(code.trim());
      await actor.updateOrderStatus(order.id, "done", null);
      // Award reward points for W Pay payment
      if (username) {
        const pts = BigInt(Math.floor(order.total));
        await actor.addRewardPoints(username, pts);
      }
      markDone(String(order.id));
      addTransaction({
        id: `wpay-${code.trim()}-${Date.now()}`,
        items: order.items.map((item) => ({
          name: item.name,
          price: item.price,
          category: item.category ?? "",
          quantity: 1,
        })),
        total: order.total,
        paymentMethod: "W Pay",
        timestamp: Date.now(),
      });
      setPaid(true);
      onPaid?.();
    } catch {
      setError("Payment failed, please try again.");
    } finally {
      setPaying(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setOrder(null);
    setError("");
    setPaid(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[60vh]">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">W Pay</h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your 6-digit code to view and pay your order
          </p>
        </div>

        {!order && (
          <div className="space-y-3">
            <Label htmlFor="wpay-tab-code">Order Code</Label>
            <div className="flex gap-2">
              <Input
                id="wpay-tab-code"
                data-ocid="wpay.code.input"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                placeholder="123456"
                maxLength={6}
                className="text-center text-xl tracking-widest font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
              <Button
                type="button"
                data-ocid="wpay.lookup.button"
                onClick={handleLookup}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" data-ocid="wpay.error_state">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {order && (
          <div className="space-y-4" data-ocid="wpay.order.card">
            {paid ? (
              <div
                data-ocid="wpay.success_state"
                className="flex flex-col items-center gap-4"
              >
                <div className="flex flex-col items-center gap-2 pt-2">
                  <CheckCircle2 className="w-14 h-14 text-green-500" />
                  <p className="text-xl font-bold text-foreground">
                    Payment Confirmed!
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Thank you, {order.customerName}!
                  </p>
                </div>
                <div className="w-full rounded-lg bg-accent/20 border border-border p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Order Summary
                  </p>
                  {order.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-muted-foreground">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleReset}
                  data-ocid="wpay.done.button"
                  className="w-full mt-1"
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Order for
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {order.customerName}
                  </p>
                </div>
                <div className="rounded-lg bg-accent/20 p-3 space-y-1">
                  {order.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-muted-foreground">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" data-ocid="wpay.pay.error_state">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    data-ocid="wpay.back.button"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleMarkPaid}
                    disabled={paying}
                    data-ocid="wpay.pay.confirm_button"
                    className="flex-1"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Paying...
                      </>
                    ) : (
                      "Mark as Paid"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
