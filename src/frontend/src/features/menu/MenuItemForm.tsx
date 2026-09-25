import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import type { MenuItem } from "../../backend";

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, price: number, category: string) => void;
  initialData?: MenuItem;
  isLoading?: boolean;
}

export default function MenuItemForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: MenuItemFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: open is intentionally used to reset the form when the dialog opens/closes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(initialData.price.toString());
      setCategory(initialData.category || "");
    } else {
      setName("");
      setPrice("");
      setCategory("");
    }
    setErrors({});
  }, [initialData, open]);

  const validate = () => {
    const newErrors: { name?: string; price?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    const priceNum = Number.parseFloat(price);
    if (!price || Number.isNaN(priceNum)) {
      newErrors.price = "Valid price is required";
    } else if (priceNum < 0) {
      newErrors.price = "Price cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(name.trim(), Number.parseFloat(price), category.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the details of this menu item."
              : "Add a new item to your menu."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cheeseburger"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (Fake $) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Burgers, Drinks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
