import ErrorState from "@/components/common/ErrorState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  useAddMenuItem,
  useEditMenuItem,
  useMenu,
  useRemoveMenuItem,
} from "@/hooks/useMenu";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import MenuItemForm from "./MenuItemForm";

export default function MenuManagementScreen() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const { data: menuItems, isLoading, error, refetch } = useMenu();
  const addMutation = useAddMenuItem();
  const editMutation = useEditMenuItem();
  const removeMutation = useRemoveMenuItem();

  const handleAdd = async (name: string, price: number, category: string) => {
    await addMutation.mutateAsync({ name, price, category: category || null });
    setFormOpen(false);
  };

  const handleEdit = async (name: string, price: number, category: string) => {
    if (editingIndex !== null) {
      await editMutation.mutateAsync({
        index: editingIndex,
        name,
        price,
        category: category || null,
      });
      setEditingIndex(null);
      setFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (deleteIndex !== null) {
      await removeMutation.mutateAsync(deleteIndex);
      setDeleteIndex(null);
    }
  };

  const openEditForm = (index: number) => {
    setEditingIndex(index);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingIndex(null);
  };

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
    return <ErrorState message="Failed to load menu items" onRetry={refetch} />;
  }

  const editingItem =
    editingIndex !== null && menuItems ? menuItems[editingIndex] : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Menu Management</CardTitle>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!menuItems || menuItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No menu items yet. Click "Add Item" to get started!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item, index) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.category ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditForm(index)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteIndex(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MenuItemForm
        open={formOpen}
        onOpenChange={closeForm}
        onSubmit={editingIndex !== null ? handleEdit : handleAdd}
        initialData={editingItem || undefined}
        isLoading={addMutation.isPending || editMutation.isPending}
      />

      <AlertDialog
        open={deleteIndex !== null}
        onOpenChange={() => setDeleteIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
