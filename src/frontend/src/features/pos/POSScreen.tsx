import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useActor } from "@/hooks/useActor";
import { useMenu } from "@/hooks/useMenu";
import { useCardPaymentStore } from "@/state/cardPaymentStore";
import { Link, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CartItem } from "../../App";
import CheckoutDialog from "../checkout/CheckoutDialog";

interface POSScreenProps {
  onCheckoutComplete: (receiptId: string) => void;
}

export default function POSScreen({ onCheckoutComplete }: POSScreenProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { data: menuItems, isLoading, error } = useMenu();
  const setLiveCart = useCardPaymentStore((s) => s.setLiveCart);
  const clearLiveCart = useCardPaymentStore((s) => s.clearLiveCart);
  const setPairingCode = useCardPaymentStore((s) => s.setPairingCode);
  const setPaired = useCardPaymentStore((s) => s.setPaired);
  const pairingCode = useCardPaymentStore((s) => s.pairingCode);
  const { actor } = useActor();

  const syncCartToBackend = useCallback(
    async (nextCart: CartItem[], newTotal: number) => {
      if (!actor || !pairingCode) return;
      try {
        await actor.updatePairingCart(
          pairingCode,
          nextCart.map((i) => ({
            name: i.name,
            price: i.price,
            category: i.category,
          })),
          newTotal,
        );
      } catch (err) {
        console.error("[POSScreen] syncCartToBackend failed:", err);
      }
    },
    [actor, pairingCode],
  );

  const addToCart = (item: {
    name: string;
    price: number;
    category?: string;
  }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i,
        );
      } else {
        next = [
          ...prev,
          {
            name: item.name,
            price: item.price,
            category: item.category,
            quantity: 1,
          },
        ];
      }
      const newTotal = next.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setLiveCart(next, newTotal);
      syncCartToBackend(next, newTotal);
      return next;
    });
  };

  const updateQuantity = (name: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((item) =>
          item.name === name
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0);
      const newTotal = next.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setLiveCart(next, newTotal);
      syncCartToBackend(next, newTotal);
      return next;
    });
  };

  const removeFromCart = (name: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.name !== name);
      const newTotal = next.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setLiveCart(next, newTotal);
      syncCartToBackend(next, newTotal);
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    clearLiveCart();
    syncCartToBackend([], 0);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = subtotal;

  const handleCheckoutSuccess = (receiptId: string) => {
    clearCart();
    setCheckoutOpen(false);
    onCheckoutComplete(receiptId);
  };

  // Generate pairing code when POS screen mounts
  useEffect(() => {
    let cancelled = false;
    async function generate() {
      if (!actor) return;
      try {
        const code = await actor.generatePairingCode();
        if (!cancelled) {
          // removed local state, using store only
          setPairingCode(code);
          setPaired(false);
        }
      } catch {
        // ignore
      }
    }
    generate();
    return () => {
      cancelled = true;
    };
  }, [actor, setPairingCode, setPaired]);

  // When pairingCode becomes available, sync current cart to backend immediately
  useEffect(() => {
    if (!pairingCode) return;
    const newTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    syncCartToBackend(cart, newTotal);
  }, [pairingCode, cart, syncCartToBackend]);

  // Sync cart to card device store whenever cart changes
  useEffect(() => {
    if (cart.length === 0) {
      clearLiveCart();
    } else {
      setLiveCart(
        cart,
        cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
      );
    }
  }, [cart, setLiveCart, clearLiveCart]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              Failed to load menu. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Menu Items */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            {!menuItems || menuItems.length === 0 ? (
              <div className="text-center py-12">
                <img
                  src="/assets/generated/empty-cart.dim_1200x800.png"
                  alt="Empty menu"
                  className="w-64 h-auto mx-auto mb-4 opacity-50"
                />
                <p className="text-muted-foreground mb-4">
                  No menu items yet. Add some items in the Menu tab!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {menuItems.map((item) => (
                  <Button
                    key={item.name}
                    variant="outline"
                    className="h-auto flex flex-col items-start p-4 hover:bg-accent hover:border-primary transition-all"
                    onClick={() => addToCart(item)}
                  >
                    <span className="font-semibold text-base mb-1">
                      {item.name}
                    </span>
                    <span className="text-primary font-bold text-lg">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.category && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {item.category}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <img
                  src="/assets/generated/empty-cart.dim_1200x800.png"
                  alt="Empty cart"
                  className="w-32 h-auto mx-auto mb-3 opacity-40"
                />
                <p className="text-muted-foreground text-sm">
                  Tap menu items to add them to your cart
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.name, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.name, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.name)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    Checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        total={total}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Pairing Code — bottom left */}
      {pairingCode && (
        <div
          data-ocid="pos.pairing_code"
          className="fixed bottom-4 left-4 z-50"
        >
          <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
            <Link className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">
                Pairing Code
              </p>
              <p className="text-xl font-mono font-bold text-foreground tracking-widest leading-tight mt-0.5">
                {pairingCode}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
