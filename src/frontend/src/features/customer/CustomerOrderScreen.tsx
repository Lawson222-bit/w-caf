import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useActor } from "@caffeineai/core-infrastructure";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { createActor } from "../../backend";
import type { MenuItem } from "../../backend";
import { useMenu } from "../../hooks/useMenu";
import { useOrdersStore } from "../../state/ordersStore";

type CartItem = { name: string; price: number; quantity: number };

type Phase = "ordering" | "confirmed";

interface CustomerOrderScreenProps {
  username?: string;
  onOrderPlaced?: () => void;
}

export default function CustomerOrderScreen({
  username = "",
  onOrderPlaced,
}: CustomerOrderScreenProps = {}) {
  const { data: menuItems, isLoading } = useMenu();
  const addOrder = useOrdersStore((s) => s.addOrder);
  const { actor } = useActor(createActor);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [phase, setPhase] = useState<Phase>("ordering");
  const [lastOrderName, setLastOrderName] = useState("");

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.name === item.name);
      if (existing) {
        return prev.map((c) =>
          c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (name: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((c) =>
        c.name === name ? { ...c, quantity: c.quantity + delta } : c,
      );
      return updated.filter((c) => c.quantity > 0);
    });
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      setNameError(true);
      return;
    }
    if (cart.length === 0) return;

    const order = {
      id: `order-${Date.now()}`,
      customerName: customerName.trim(),
      items: cart,
      total,
      timestamp: Date.now(),
      status: "pending" as const,
    };
    addOrder(order);
    setLastOrderName(customerName.trim());
    setPhase("confirmed");
    onOrderPlaced?.();

    // Also persist to backend for reward points accrual (fire-and-forget)
    if (actor) {
      try {
        await actor.placeCustomerOrder(
          customerName.trim(),
          cart.map((c) => ({ name: c.name, price: c.price })),
          total,
        );
        // Award reward points for order
        if (username) {
          const pts = BigInt(Math.floor(total));
          await actor.addRewardPoints(username, pts);
        }
      } catch {
        // Backend call failed silently — local order is already placed
      }
    }
  };

  const handleNewOrder = () => {
    setCart([]);
    setCustomerName("");
    setNameError(false);
    setPhase("ordering");
  };

  if (phase === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6 bg-card border border-border rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-foreground">
            Thank you, {lastOrderName}!
          </h2>
          <p className="text-muted-foreground">
            Your order has been received. We'll have it ready for you shortly!
          </p>
          <Button
            data-ocid="customer.primary_button"
            size="lg"
            className="w-full text-lg"
            onClick={handleNewOrder}
          >
            Place New Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row gap-0 max-w-5xl mx-auto">
        {/* Menu grid */}
        <main className="flex-1 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Menu</h2>
          {isLoading && (
            <div
              data-ocid="customer.loading_state"
              className="text-muted-foreground text-center py-12"
            >
              Loading menu…
            </div>
          )}
          {!isLoading && (!menuItems || menuItems.length === 0) && (
            <div
              data-ocid="customer.empty_state"
              className="text-muted-foreground text-center py-12"
            >
              No menu items yet. Check back soon!
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(menuItems ?? []).map((item, idx) => (
              <button
                key={item.name}
                type="button"
                data-ocid={`customer.item.${idx + 1}`}
                onClick={() => addToCart(item)}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md hover:border-primary transition-all active:scale-95 cursor-pointer text-left"
              >
                <span className="text-3xl">
                  {getCategoryEmoji(item.category?.[0] ?? null)}
                </span>
                <span className="font-semibold text-foreground text-sm text-center leading-tight">
                  {item.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  ${item.price.toFixed(2)}
                </Badge>
              </button>
            ))}
          </div>
        </main>

        {/* Cart sidebar */}
        <aside className="lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card">
          <div className="p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Your Order</h2>
              {cart.length > 0 && (
                <Badge className="ml-auto">{cart.length}</Badge>
              )}
            </div>

            {cart.length === 0 ? (
              <p
                data-ocid="customer.empty_state"
                className="text-muted-foreground text-sm text-center py-8"
              >
                Tap items to add them to your order
              </p>
            ) : (
              <ScrollArea className="flex-1 max-h-64 lg:max-h-none">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 bg-background rounded-xl p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQty(item.name, -1)}
                        >
                          {item.quantity === 1 ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </Button>
                        <span className="text-sm font-semibold w-5 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQty(item.name, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <Separator className="my-4" />

            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium" htmlFor="customer-name">
                Your Name
              </label>
              <Input
                id="customer-name"
                data-ocid="customer.input"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setNameError(false);
                }}
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && (
                <p
                  data-ocid="customer.error_state"
                  className="text-destructive text-xs"
                >
                  Please enter your name
                </p>
              )}
            </div>

            <Button
              data-ocid="customer.submit_button"
              size="lg"
              className="w-full text-base"
              disabled={cart.length === 0}
              onClick={handlePlaceOrder}
            >
              Place Order
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string | null): string {
  if (!category) return "☕";
  const cat = category.toLowerCase();
  if (
    cat.includes("coffee") ||
    cat.includes("drink") ||
    cat.includes("beverage")
  )
    return "☕";
  if (cat.includes("food") || cat.includes("snack") || cat.includes("sandwich"))
    return "🥪";
  if (cat.includes("dessert") || cat.includes("sweet") || cat.includes("cake"))
    return "🍰";
  if (cat.includes("juice") || cat.includes("smoothie")) return "🧃";
  if (cat.includes("tea")) return "🍵";
  return "🍽️";
}
