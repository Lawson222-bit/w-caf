import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PasscodeScreenProps {
  onCashierUnlock: () => void;
  onCustomerUnlock: () => void;
  onCardDeviceUnlock: () => void;
}

export default function PasscodeScreen({
  onCashierUnlock,
  onCustomerUnlock,
  onCardDeviceUnlock,
}: PasscodeScreenProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);
    setError(false);
    if (next.length === 4) {
      if (next === "2516") {
        onCashierUnlock();
      } else if (next === "3415") {
        onCustomerUnlock();
      } else if (next === "6767") {
        onCardDeviceUnlock();
      } else {
        setTimeout(() => {
          setInput("");
          setError(true);
        }, 400);
      }
    }
  };

  const handleDelete = () => {
    setInput((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 bg-card border border-border rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <div className="text-4xl font-bold text-foreground">W Café</div>
        <p className="text-muted-foreground text-sm">
          Enter passcode to continue
        </p>

        {/* Dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < input.length
                  ? error
                    ? "bg-destructive border-destructive"
                    : "bg-primary border-primary"
                  : "border-muted-foreground bg-transparent"
              }`}
            />
          ))}
        </div>

        {error && (
          <p
            data-ocid="passcode.error_state"
            className="text-destructive text-sm font-medium"
          >
            Incorrect passcode
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <Button
              key={d}
              variant="outline"
              className="h-14 text-xl font-semibold"
              onClick={() => handleDigit(d)}
              data-ocid="passcode.button"
            >
              {d}
            </Button>
          ))}
          <div />
          <Button
            variant="outline"
            className="h-14 text-xl font-semibold"
            onClick={() => handleDigit("0")}
          >
            0
          </Button>
          <Button
            variant="ghost"
            className="h-14 text-sm"
            onClick={handleDelete}
          >
            ⌫
          </Button>
        </div>
      </div>
    </div>
  );
}
