import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactionStore } from "@/state/transactionsStore";
import { Receipt } from "lucide-react";

interface TransactionsScreenProps {
  onViewReceipt: (receiptId: string) => void;
}

export default function TransactionsScreen({
  onViewReceipt,
}: TransactionsScreenProps) {
  const transactions = useTransactionStore((state) => state.transactions);

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <img
                src="/assets/generated/empty-cart.dim_1200x800.png"
                alt="No transactions"
                className="w-64 h-auto mx-auto mb-4 opacity-50"
              />
              <p className="text-muted-foreground">
                No transactions yet. Complete a sale to see it here!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {transaction.items.slice(0, 2).map((item) => (
                          <div key={`${transaction.id}-${item.name}`}>
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                        {transaction.items.length > 2 && (
                          <div className="text-muted-foreground">
                            +{transaction.items.length - 2} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                        {transaction.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${transaction.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewReceipt(transaction.id)}
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
