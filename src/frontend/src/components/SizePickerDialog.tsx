import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SIZES = [
  { label: "Small", emoji: "🥤", priceAdj: 0 },
  { label: "Medium", emoji: "🥤", priceAdj: 0.5 },
  { label: "Large", emoji: "🥤", priceAdj: 1.0 },
] as const;

export type DrinkSize = (typeof SIZES)[number]["label"];

interface SizePickerDialogProps {
  open: boolean;
  itemName: string;
  basePrice: number;
  onSelect: (size: DrinkSize, finalPrice: number) => void;
  onClose: () => void;
}

export default function SizePickerDialog({
  open,
  itemName,
  basePrice,
  onSelect,
  onClose,
}: SizePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose a size for {itemName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          {SIZES.map((s) => {
            const price = basePrice + s.priceAdj;
            return (
              <Button
                key={s.label}
                variant="outline"
                className="h-14 flex items-center justify-between px-5 text-base hover:bg-accent hover:border-primary transition-all"
                onClick={() => onSelect(s.label, price)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="font-semibold">{s.label}</span>
                </span>
                <span className="text-primary font-bold">
                  ${price.toFixed(2)}
                </span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function isDrink(category: string | undefined | null): boolean {
  if (!category) return false;
  const c = category.toLowerCase();
  return (
    c.includes("drink") ||
    c.includes("beverage") ||
    c.includes("coffee") ||
    c.includes("tea") ||
    c.includes("juice") ||
    c.includes("smoothie") ||
    c.includes("soda")
  );
}
