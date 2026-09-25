import { createActor } from "@/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActor } from "@caffeineai/core-infrastructure";
import { BarChart3, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface TopItem {
  name: string;
  quantity: bigint;
}

interface DailySummary {
  totalRevenue: number;
  orderCount: bigint;
  topItems: TopItem[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function SalesScreen() {
  const { actor, isFetching } = useActor(createActor);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;

    const fetchSummary = async () => {
      try {
        const data = await actor.getDailySalesSummary();
        setSummary({
          totalRevenue: data.totalRevenue,
          orderCount: data.orderCount,
          topItems: data.topItems.slice(0, 5),
        });
        setError(null);
      } catch {
        setError("Could not load sales data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [actor, isFetching]);

  const today = formatDate(new Date());
  const hasOrders =
    summary && (Number(summary.orderCount) > 0 || summary.totalRevenue > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-ocid="sales.page">
      {/* Date Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{today}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daily Sales Summary
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm">Auto-refreshing</span>
        </div>
      </div>

      {loading && (
        <div
          className="flex items-center justify-center py-16 text-muted-foreground"
          data-ocid="sales.loading_state"
        >
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading sales data…</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <Card data-ocid="sales.error_state">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && !hasOrders && (
        <Card data-ocid="sales.empty_state">
          <CardContent className="py-16 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">
              No sales yet today
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a sale on the POS tab to see your daily summary here.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && hasOrders && summary && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <Card data-ocid="sales.revenue_card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card data-ocid="sales.orders_card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {Number(summary.orderCount)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Items */}
          <Card data-ocid="sales.top_items_card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top 5 Items Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.topItems.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No item data available.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.topItems.map((item, index) => {
                    const maxQty = Number(summary.topItems[0].quantity);
                    const qty = Number(item.quantity);
                    const pct =
                      maxQty > 0 ? Math.round((qty / maxQty) * 100) : 0;
                    return (
                      <div
                        key={item.name}
                        className="flex items-center gap-3"
                        data-ocid={`sales.top_items_card.item.${index + 1}`}
                      >
                        <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-foreground truncate">
                              {item.name}
                            </span>
                            <span className="text-sm font-semibold text-foreground ml-2 shrink-0">
                              {qty} sold
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
