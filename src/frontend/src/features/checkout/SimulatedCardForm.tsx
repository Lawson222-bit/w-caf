import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";

interface SimulatedCardFormProps {
  onValidChange?: (valid: boolean) => void;
}

export default function SimulatedCardForm({
  onValidChange,
}: SimulatedCardFormProps) {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    const isValid =
      cardName.trim().length > 0 &&
      cardNumber.replace(/\s/g, "").length >= 13 &&
      expiry.length === 5 &&
      cvc.length >= 3;
    onValidChange?.(isValid);
  }, [cardName, cardNumber, expiry, cvc, onValidChange]);

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

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a simulated payment form. No real payment will be processed.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="cardName">Cardholder Name</Label>
        <Input
          id="cardName"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="John Doe"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry (MM/YY)</Label>
          <Input
            id="expiry"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="12/25"
            maxLength={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            value={cvc}
            onChange={(e) =>
              setCvc(e.target.value.replace(/\D/g, "").substring(0, 4))
            }
            placeholder="123"
            maxLength={4}
          />
        </div>
      </div>
    </div>
  );
}
