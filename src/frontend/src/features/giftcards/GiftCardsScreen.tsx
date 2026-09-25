import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useGetGiftCard, useIssueGiftCard } from "@/hooks/useGiftCards";
import { Gift, Search } from "lucide-react";
import { useState } from "react";

export default function GiftCardsScreen() {
  const [issueBalance, setIssueBalance] = useState("");
  const [issueCode, setIssueCode] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState<{
    code: string;
    balance: number;
  } | null>(null);
  const [lookupError, setLookupError] = useState("");

  const issueMutation = useIssueGiftCard();
  const lookupMutation = useGetGiftCard();

  const generateCode = () => {
    const code = `GC${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setIssueCode(code);
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = Number.parseFloat(issueBalance);
    if (!issueCode || Number.isNaN(balance) || balance <= 0) {
      return;
    }

    try {
      await issueMutation.mutateAsync({ code: issueCode, balance });
      setIssueCode("");
      setIssueBalance("");
    } catch (_err) {
      // Error handled by mutation
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    setLookupResult(null);

    if (!lookupCode.trim()) {
      setLookupError("Please enter a gift card code");
      return;
    }

    try {
      const result = await lookupMutation.mutateAsync(lookupCode.trim());
      setLookupResult(result);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message?.includes("Gift card not found")
      ) {
        setLookupError("Gift card not found. Please check the code.");
      } else {
        setLookupError("Failed to lookup gift card. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Issue Gift Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Issue Gift Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issueCode">Gift Card Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="issueCode"
                    value={issueCode}
                    onChange={(e) => setIssueCode(e.target.value.toUpperCase())}
                    placeholder="GC12345678"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCode}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueBalance">Initial Balance (Fake $)</Label>
                <Input
                  id="issueBalance"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={issueBalance}
                  onChange={(e) => setIssueBalance(e.target.value)}
                  placeholder="50.00"
                />
              </div>

              {issueMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {issueMutation.error?.message?.includes("already exists")
                      ? "This gift card code already exists. Please use a different code."
                      : "Failed to issue gift card. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              {issueMutation.isSuccess && (
                <Alert>
                  <AlertDescription className="text-primary">
                    Gift card issued successfully! 🎉
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={issueMutation.isPending}
              >
                {issueMutation.isPending ? "Issuing..." : "Issue Gift Card"}
              </Button>
            </form>

            <div className="mt-6">
              <img
                src="/assets/generated/gift-card-illustration.dim_1200x800.png"
                alt="Gift card"
                className="w-full h-auto rounded-lg opacity-60"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lookup Gift Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Check Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lookupCode">Gift Card Code</Label>
                <Input
                  id="lookupCode"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  placeholder="Enter gift card code"
                />
              </div>

              {lookupError && (
                <Alert variant="destructive">
                  <AlertDescription>{lookupError}</AlertDescription>
                </Alert>
              )}

              {lookupResult && (
                <div className="p-4 bg-accent/20 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Code:</span>
                    <span className="font-mono font-semibold">
                      {lookupResult.code}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Balance:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ${lookupResult.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={lookupMutation.isPending}
              >
                {lookupMutation.isPending ? "Checking..." : "Check Balance"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
