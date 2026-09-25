import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { useCardPaymentStore } from "@/state/cardPaymentStore";
import { useTransactionStore } from "@/state/transactionsStore";
import {
  CheckCircle,
  CreditCard,
  Loader2,
  LogOut,
  Mail,
  Receipt,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CardInfo {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

export default function CardDeviceScreen() {
  const {
    // activePaymentCode removed — unused, avoids lint error
    activeOrderCustomer,
    clearActivePayment,
    liveCartItems,
    liveCartTotal,
    isPaymentActive,
    isCheckoutActive,
    paired,
    setPaired,
    setPairingCode,
    setPaymentActive,
    setCheckoutActive,
  } = useCardPaymentStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);
  const [showReceiptPopup, setShowReceiptPopup] = useState(false);
  const [emailUnavailableMsg, setEmailUnavailableMsg] = useState(false);
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [inputCode, setInputCode] = useState("");
  const [pairingError, setPairingError] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);

  const { actor } = useActor();
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const pairingCode = useCardPaymentStore((s) => s.pairingCode);
  const setLiveCart = useCardPaymentStore((s) => s.setLiveCart);
  const clearLiveCart = useCardPaymentStore((s) => s.clearLiveCart);

  // Local state to force payment form visibility — works even if store subscription lags
  const [forcePaymentForm, setForcePaymentForm] = useState(false);
  const [localPaymentActive, setLocalPaymentActive] = useState(false);
  const [hasSubmittedPayment, setHasSubmittedPayment] = useState(false);

  const showPaymentForm =
    (isPaymentActive || localPaymentActive || forcePaymentForm) && !paid;
  const showCheckout =
    paired &&
    !paid &&
    !showPaymentForm &&
    isCheckoutActive &&
    liveCartItems.length > 0;
  const showCart =
    paired &&
    !paid &&
    !showPaymentForm &&
    !isCheckoutActive &&
    liveCartItems.length > 0;
  const showIdle =
    paired && !paid && !showPaymentForm && liveCartItems.length === 0;
  const showPairing = !paired;
  const handlePay = async () => {
    if (liveCartTotal <= 0) return;
    if (hasSubmittedPayment) return;
    setHasSubmittedPayment(true);
    console.log("[CardDevice] === handlePay START ===");
    console.log(
      "[CardDevice] Current state - paired:",
      paired,
      "isPaymentActive:",
      isPaymentActive,
      "isCheckoutActive:",
      isCheckoutActive,
      "pairingCode:",
      pairingCode,
      "forcePaymentForm:",
      forcePaymentForm,
    );
    console.log(
      "[CardDevice] actor:",
      !!actor,
      "pairingCode:",
      pairingCode,
      "cardInfo:",
      cardInfo,
    );
    if (!actor || !pairingCode) {
      console.error(
        "[CardDevice] handlePay aborted — actor:",
        !!actor,
        "pairingCode:",
        pairingCode,
      );
      setError("Not connected. Please try again.");
      return;
    }
    const cleanNumber = cardInfo.number.replace(/\s/g, "");
    if (
      cleanNumber.length < 13 ||
      cardInfo.expiry.length < 4 ||
      cardInfo.cvv.length < 3 ||
      cardInfo.name.trim().length === 0
    ) {
      console.log(
        "[CardDevice] handlePay validation failed - number:",
        cleanNumber.length,
        "expiry:",
        cardInfo.expiry.length,
        "cvv:",
        cardInfo.cvv.length,
        "name:",
        cardInfo.name.trim().length,
      );
      setError("Please fill in all card details.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      console.log(
        "[CardDevice] calling processCardDevicePayment with pairingCode:",
        pairingCode,
      );
      const result = await actor.processCardDevicePayment(
        pairingCode,
        cleanNumber,
        cardInfo.name.trim(),
        cardInfo.expiry,
        cardInfo.cvv,
      );
      console.log("[CardDevice] processCardDevicePayment result:", result);
      console.log("[CardDevice] Result type:", typeof result, "value:", result);

      // Handle null/undefined result
      if (result == null) {
        console.error(
          "[CardDevice] processCardDevicePayment returned null/undefined",
        );
        setError("Payment failed. Please try again.");
        setLoading(false);
        return;
      }

      // Handle error result (variant format)
      if (
        typeof result === "object" &&
        "__kind__" in result &&
        result.__kind__ === "err"
      ) {
        const errMsg =
          (result as { err?: string }).err ||
          "Payment failed. Please try again.";
        console.error("[CardDevice] processCardDevicePayment error:", errMsg);
        setError(errMsg);
        setLoading(false);
        return;
      }

      // Handle success result (variant format)
      if (
        typeof result === "object" &&
        "__kind__" in result &&
        result.__kind__ === "ok"
      ) {
        console.log(
          "[CardDevice] processCardDevicePayment succeeded (variant ok)",
        );
        addTransaction({
          id: `card-device-${Date.now()}`,
          items: liveCartItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category ?? "",
          })),
          total: liveCartTotal,
          paymentMethod: "Card (Device)",
          timestamp: Date.now(),
        });
        setPaid(true);
        setShowReceiptPopup(true);
        setLoading(false);
        return;
      }

      // Handle { ok: ... } result (Candid variant without __kind__)
      if (typeof result === "object" && "ok" in result && !("err" in result)) {
        console.log(
          "[CardDevice] processCardDevicePayment succeeded (ok variant)",
        );
        addTransaction({
          id: `card-device-${Date.now()}`,
          items: liveCartItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category ?? "",
          })),
          total: liveCartTotal,
          paymentMethod: "Card (Device)",
          timestamp: Date.now(),
        });
        setPaid(true);
        setShowReceiptPopup(true);
        setLoading(false);
        return;
      }

      // Handle boolean true result
      if (result === true) {
        console.log(
          "[CardDevice] processCardDevicePayment succeeded (boolean true)",
        );
        addTransaction({
          id: `card-device-${Date.now()}`,
          items: liveCartItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category ?? "",
          })),
          total: liveCartTotal,
          paymentMethod: "Card (Device)",
          timestamp: Date.now(),
        });
        setPaid(true);
        setShowReceiptPopup(true);
        setLoading(false);
        return;
      }

      // Handle string "ok" result
      if (result === "ok" || result === "success") {
        console.log(
          "[CardDevice] processCardDevicePayment succeeded (string result)",
        );
        addTransaction({
          id: `card-device-${Date.now()}`,
          items: liveCartItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category ?? "",
          })),
          total: liveCartTotal,
          paymentMethod: "Card (Device)",
          timestamp: Date.now(),
        });
        setPaid(true);
        setShowReceiptPopup(true);
        setLoading(false);
        return;
      }

      // Handle unexpected result shape
      console.error(
        "[CardDevice] processCardDevicePayment unexpected result:",
        result,
      );
      console.error(
        "[CardDevice] Result type:",
        typeof result,
        "keys:",
        result ? Object.keys(result) : "null",
      );
      setError("Payment failed. Please try again.");
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[CardDevice] processCardDevicePayment exception:", msg);
      console.error("[CardDevice] Full error:", err);
      setError(`Payment failed: ${msg}`);
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(" ").substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  useEffect(() => {
    if (!paired || !actor || !pairingCode) {
      console.log(
        "[CardDevice] polling skipped — paired:",
        paired,
        "actor:",
        !!actor,
        "pairingCode:",
        pairingCode,
      );
      return;
    }

    const poll = async () => {
      try {
        console.log(
          "[CardDevice] polling getPairingCart for code:",
          pairingCode,
          "at",
          new Date().toISOString(),
        );
        console.log(
          "[CardDevice] current local state - isCheckoutActive:",
          isCheckoutActive,
          "isPaymentActive:",
          isPaymentActive,
          "paid:",
          paid,
          "forcePaymentForm:",
          forcePaymentForm,
        );
        const result = await actor.getPairingCart(pairingCode);
        console.log("[CardDevice] poll result:", result);
        if (!result) {
          console.log("[CardDevice] poll returned null");
          return;
        }

        const items = result.items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: 1,
          category: item.category ?? undefined,
        }));
        const merged: Record<string, (typeof items)[number]> = {};
        for (const it of items) {
          if (merged[it.name]) {
            merged[it.name].quantity += 1;
          } else {
            merged[it.name] = { ...it };
          }
        }
        const mergedItems = Object.values(merged);
        setLiveCart(mergedItems, result.total);
        console.log(
          "[CardDevice] poll status:",
          result.status,
          "items:",
          mergedItems.length,
          "total:",
          result.total,
          "isCheckoutActive:",
          isCheckoutActive,
          "isPaymentActive:",
          isPaymentActive,
        );

        if (result.status === "checkout") {
          console.log("[CardDevice] setting checkout active");
          setCheckoutActive(true);
          setPaymentActive(true);
        } else if (result.status === "paid" && hasSubmittedPayment) {
          console.log("[CardDevice] order paid after submission");
          setPaid(true);
        } else if (result.status === "idle" && mergedItems.length > 0) {
          console.log(
            "[CardDevice] setting checkout inactive (idle with items)",
          );
          setCheckoutActive(false);
        }
      } catch (err) {
        console.error("[CardDevice] poll error:", err);
      }
    };

    poll();
    const interval = setInterval(poll, 500);
    return () => clearInterval(interval);
  }, [
    paired,
    actor,
    pairingCode,
    setLiveCart,
    setCheckoutActive,
    isCheckoutActive,
    isPaymentActive,
    paid,
    forcePaymentForm,
    hasSubmittedPayment,
    setPaymentActive,
  ]);

  useEffect(() => {
    if (!paid) return;
    const timer = setTimeout(() => {
      setError("");
      setPaid(false);
      setShowReceiptPopup(false);
      setEmailUnavailableMsg(false);
      setCardInfo({ number: "", expiry: "", cvv: "", name: "" });
      setForcePaymentForm(false);
      setLocalPaymentActive(false);
      setHasSubmittedPayment(false);
      setLocalPaymentActive(false);
      setHasSubmittedPayment(false);
      clearActivePayment();
      clearLiveCart();
      setCheckoutActive(false);
      setPaymentActive(false);
      setPaired(false);
      setPairingCode(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [
    paid,
    clearActivePayment,
    clearLiveCart,
    setCheckoutActive,
    setPaymentActive,
    setPaired,
    setPairingCode,
  ]);

  const handlePair = async () => {
    if (!actor || inputCode.length !== 4) return;
    setPairingLoading(true);
    setPairingError("");
    try {
      console.log("[CardDevice] validating pairing code:", inputCode);
      const valid = await actor.validatePairingCode(inputCode);
      console.log("[CardDevice] pairing code valid:", valid);
      if (valid) {
        console.log("[CardDevice] pairing succeeded - resetting states");
        // Reset any stale persisted state before pairing
        setPaymentActive(false);
        setCheckoutActive(false);
        setLocalPaymentActive(false);
        setForcePaymentForm(false);
        setHasSubmittedPayment(false);
        clearActivePayment();
        setPaired(true);
        setPairingCode(inputCode);
        console.log(
          "[CardDevice] pairing complete - isPaymentActive:",
          false,
          "isCheckoutActive:",
          false,
        );
      } else {
        setPairingError("Invalid code. Please try again.");
        setInputCode("");
      }
    } catch (err) {
      console.error("[CardDevice] pairing error:", err);
      setPairingError("Unable to verify code. Please try again.");
    } finally {
      setPairingLoading(false);
    }
  };

  const handleExit = () => {
    clearActivePayment();
    clearLiveCart();
    setCheckoutActive(false);
    setPaymentActive(false);
    setForcePaymentForm(false);
    setLocalPaymentActive(false);
    setHasSubmittedPayment(false);
    setPaired(false);
    setPairingCode(null);
    setInputCode("");
    setPairingError("");
    setPaid(false);
    setShowReceiptPopup(false);
    setEmailUnavailableMsg(false);
    setCardInfo({ number: "", expiry: "", cvv: "", name: "" });
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border px-6 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              W Café
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Customer Display
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {liveCartItems.length > 0 && !showPaymentForm && !paid && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Current Total
              </p>
              <p className="text-3xl font-bold text-primary">
                ${liveCartTotal.toFixed(2)}
              </p>
            </div>
          )}
          <button
            type="button"
            data-ocid="carddevice.exit_button"
            onClick={handleExit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Exit
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {showPairing && (
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10">
                <CreditCard className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  Pair with Register
                </h2>
                <p className="text-muted-foreground mt-3 text-lg">
                  Enter the 4-digit code shown at the bottom-left of the cashier
                  screen.
                </p>
              </div>
              <div className="w-full max-w-xs space-y-4">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                        i < inputCode.length
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-muted-foreground/30 bg-transparent text-muted-foreground"
                      }`}
                    >
                      {inputCode[i] ?? ""}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      data-ocid="carddevice.keypad.button"
                      className="h-14 rounded-xl bg-muted hover:bg-accent text-xl font-semibold transition-colors"
                      onClick={() =>
                        setInputCode((prev) =>
                          prev.length < 4 ? prev + d : prev,
                        )
                      }
                    >
                      {d}
                    </button>
                  ))}
                  <div />
                  <button
                    type="button"
                    data-ocid="carddevice.keypad.zero"
                    className="h-14 rounded-xl bg-muted hover:bg-accent text-xl font-semibold transition-colors"
                    onClick={() =>
                      setInputCode((prev) =>
                        prev.length < 4 ? `${prev}0` : prev,
                      )
                    }
                  >
                    0
                  </button>
                  <button
                    type="button"
                    data-ocid="carddevice.keypad.delete"
                    className="h-14 rounded-xl bg-muted hover:bg-accent text-sm font-semibold transition-colors"
                    onClick={() => setInputCode((prev) => prev.slice(0, -1))}
                  >
                    ⌫
                  </button>
                </div>
                {pairingError && (
                  <p
                    data-ocid="carddevice.pairing.error_state"
                    className="text-destructive text-sm font-medium"
                  >
                    {pairingError}
                  </p>
                )}
                <button
                  type="button"
                  data-ocid="carddevice.pair.button"
                  disabled={inputCode.length !== 4 || pairingLoading}
                  className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  onClick={handlePair}
                >
                  {pairingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            </div>
          )}

          {showIdle && (
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-muted animate-pulse">
                <ShoppingBag className="w-16 h-16 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  Waiting for order...
                </h2>
                <p className="text-muted-foreground mt-3 text-lg">
                  Your order will appear here as the cashier adds items.
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl px-8 py-6 w-full max-w-sm">
                <div className="flex items-center gap-3 justify-center">
                  <div
                    className="w-3 h-3 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-3 h-3 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-3 h-3 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Ready to take your order
                </p>
              </div>
            </div>
          )}

          {showCart && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-5 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-primary" />
                    Your Order
                  </h2>
                  {activeOrderCustomer && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      {activeOrderCustomer}
                    </div>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {liveCartItems.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="flex items-center justify-between px-6 py-4"
                      data-ocid={`carddevice.cart.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground text-base">
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/40 px-6 py-5 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-muted-foreground">
                      Total
                    </span>
                    <span className="text-4xl font-bold text-primary">
                      ${liveCartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-accent/20 border border-accent/40 rounded-2xl px-6 py-4 text-center">
                <p className="text-sm font-medium text-accent-foreground">
                  The cashier will let you know when it&apos;s time to pay.
                </p>
              </div>
            </div>
          )}

          {showCheckout && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-5 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-primary" />
                    Your Order
                  </h2>
                  {activeOrderCustomer && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      {activeOrderCustomer}
                    </div>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {liveCartItems.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="flex items-center justify-between px-6 py-4"
                      data-ocid={`carddevice.cart.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground text-base">
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/40 px-6 py-5 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-muted-foreground">
                      Total
                    </span>
                    <span className="text-4xl font-bold text-primary">
                      ${liveCartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                data-ocid="carddevice.paynow.button"
                className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-3 shadow-lg"
                onClick={() => {
                  console.log("[CardDevice] Pay Now button clicked");
                  setLocalPaymentActive(true);
                  setForcePaymentForm(true);
                  setPaymentActive(true);
                  setHasSubmittedPayment(false);
                }}
              >
                <CreditCard className="w-6 h-6" />
                Pay Now
              </button>
            </div>
          )}

          {showPaymentForm && !paid && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">
                    Order Summary
                  </h2>
                </div>
                <div className="px-6 py-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium text-foreground">
                      {activeOrderCustomer || "Guest"}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 space-y-1">
                    {liveCartItems.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-foreground">
                          {item.name}{" "}
                          {item.quantity > 1 ? `×${item.quantity}` : ""}
                        </span>
                        <span className="font-medium text-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-bold text-foreground text-base">
                      Total
                    </span>
                    <span className="text-3xl font-bold text-primary">
                      ${liveCartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Card Payment
                  </h2>
                </div>
                <div className="px-6 py-6 space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="cdCardName"
                      className="text-foreground font-medium"
                    >
                      Cardholder Name
                    </Label>
                    <Input
                      id="cdCardName"
                      data-ocid="carddevice.cardname.input"
                      value={cardInfo.name}
                      onChange={(e) =>
                        setCardInfo((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="John Doe"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="cdCardNumber"
                      className="text-foreground font-medium"
                    >
                      Card Number
                    </Label>
                    <Input
                      id="cdCardNumber"
                      data-ocid="carddevice.cardnumber.input"
                      value={cardInfo.number}
                      onChange={(e) =>
                        setCardInfo((prev) => ({
                          ...prev,
                          number: formatCardNumber(e.target.value),
                        }))
                      }
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="cdExpiry"
                        className="text-foreground font-medium"
                      >
                        Expiry (MM/YY)
                      </Label>
                      <Input
                        id="cdExpiry"
                        data-ocid="carddevice.expiry.input"
                        value={cardInfo.expiry}
                        onChange={(e) =>
                          setCardInfo((prev) => ({
                            ...prev,
                            expiry: formatExpiry(e.target.value),
                          }))
                        }
                        placeholder="12/25"
                        maxLength={5}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="cdCvv"
                        className="text-foreground font-medium"
                      >
                        CVV
                      </Label>
                      <Input
                        id="cdCvv"
                        data-ocid="carddevice.cvv.input"
                        value={cardInfo.cvv}
                        onChange={(e) =>
                          setCardInfo((prev) => ({
                            ...prev,
                            cvv: e.target.value
                              .replace(/\D/g, "")
                              .substring(0, 4),
                          }))
                        }
                        placeholder="123"
                        maxLength={4}
                        className="bg-background"
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      data-ocid="carddevice.pay.error_state"
                      className="text-destructive text-sm font-medium"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    data-ocid="carddevice.pay.button"
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      console.log("[CardDevice] Pay button clicked in form");
                      setHasSubmittedPayment(true);
                      handlePay();
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ${liveCartTotal.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showReceiptPopup && paid && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-5 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-primary" />
                    Receipt
                  </h2>
                  {activeOrderCustomer && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      {activeOrderCustomer}
                    </div>
                  )}
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="space-y-3">
                    {liveCartItems.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        className="flex justify-between items-start"
                        data-ocid={`carddevice.receipt.item.${idx + 1}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">
                        ${liveCartTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">
                        ${liveCartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4 text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Payment Method:{" "}
                      <span className="font-medium text-foreground">
                        Card (Device)
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {!emailUnavailableMsg ? (
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-6 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      Would you like to email this receipt?
                    </h3>
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        data-ocid="carddevice.email.yes_button"
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                        onClick={() => setEmailUnavailableMsg(true)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        data-ocid="carddevice.email.no_button"
                        className="px-6 py-3 rounded-xl bg-muted text-foreground font-semibold hover:bg-accent transition-colors"
                        onClick={() => {
                          setShowReceiptPopup(false);
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-6 text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Email receipts are not available at this time.
                    </p>
                    <button
                      type="button"
                      data-ocid="carddevice.email.dismiss_button"
                      className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                      onClick={() => {
                        setShowReceiptPopup(false);
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {paid && !showReceiptPopup && (
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-green-500/10">
                <CheckCircle className="w-14 h-14 text-green-500" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-foreground">
                  Thank You!
                </h2>
                <p className="text-muted-foreground mt-3 text-lg">
                  Your payment was approved.
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl px-10 py-6 w-full max-w-xs">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Total Paid
                </p>
                <p className="text-4xl font-bold text-primary mt-1">
                  ${liveCartTotal.toFixed(2)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Returning to order screen in a few seconds...
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-muted/40 border-t border-border px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} W Café — Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
