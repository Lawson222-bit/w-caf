import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTransactionStore } from "@/state/transactionsStore";
import { ArrowLeft } from "lucide-react";

interface ReceiptScreenProps {
  receiptId: string;
  onBack: () => void;
}

export default function ReceiptScreen({
  receiptId,
  onBack,
}: ReceiptScreenProps) {
  const transaction = useTransactionStore((state) =>
    state.transactions.find((t) => t.id === receiptId),
  );

  if (!transaction) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Receipt not found
            </p>
            <Button onClick={onBack} className="mt-4 mx-auto block">
              Back to POS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-2 mb-1">
            <img
              src="/assets/generated/pos-logo.dim_512x512.png"
              alt="W Café Logo"
              className="w-10 h-10 rounded-xl"
            />
            <CardTitle className="text-2xl font-bold">W Café</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Receipt</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(transaction.timestamp).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="space-y-3">
            {transaction.items.map((item) => (
              <div key={item.name} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${transaction.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                ${transaction.total.toFixed(2)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="text-center space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Payment Method:</span>{" "}
              <span className="font-medium break-words">
                {transaction.paymentMethod}
              </span>
            </p>
            <div className="fake-money-badge mx-auto">
              🎮 Fake Money Transaction
            </div>
          </div>

          <Separator />

          <div className="text-center text-xs text-muted-foreground">
            <p>Thank you for playing!</p>
            <p className="mt-1">Transaction ID: {transaction.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
