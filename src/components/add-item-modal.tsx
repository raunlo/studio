
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";

type ChecklistITemRowModel = {
    name: string;
    quantity: string;
}

type AddItemModalProps = {
  isOpen: boolean;
  initialChecklistItemName: string;
  onClose: () => void;
  onAddItem: (newItem: ChecklistItem) => void;
};

export function AddItemModal({ 
    isOpen, 
    initialChecklistItemName,
    onClose,
    onAddItem
}: AddItemModalProps) {
  const [checklistItemName, setChecklistItemName] = useState(initialChecklistItemName);
  const [quantity, setQuantity] = useState("");
  const [rows, setRows] = useState<ChecklistITemRowModel[]>([]);

  const handleSubItemChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newSubItems = [...rows];
    newSubItems[index][field] = value;
    setRows(newSubItems);
  };

  useEffect(() => {
    if (isOpen) {
        setChecklistItemName(initialChecklistItemName)
    }
  }, [initialChecklistItemName])

  const addSubItemInput = () => {
    setRows([...rows, { name: "", quantity: "" }]);
  };

  const removeSubItemInput = (index: number) => {
    if (rows.length > 1) {
      const newSubItems = rows.filter((_, i) => i !== index);
      setRows(newSubItems);
    } else {
      setRows([{ name: "", quantity: "" }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checklistItemName.trim()) {
      const checklistItemRows: ChecklistItemRow[] = rows
        .map((s) => ({
          id: null,
          name: s.name.trim(),
          completed: false,
        }))
        .filter((s) => s.name !== "");

      const item: ChecklistItem = {
        id: null,
        name: checklistItemName.trim(),
        completed: false,
        orderNumber: null,
        rows: checklistItemRows.length > 0 ? checklistItemRows : null,
      };
      onAddItem(item);
      handleClose();
    }
  };
  
  const handleClose = () => {
    setChecklistItemName("");
    setQuantity("");
    setRows([{ name: "", quantity: "" }]);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-6 items-center gap-4">
              <Input
                id="name"
                value={checklistItemName}
                onChange={(e) => setChecklistItemName(e.target.value)}
                placeholder="Main item name..."
                className="col-span-4"
                required
              />
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty."
                className="col-span-2"
              />
            </div>
            <div className="col-span-6 space-y-2">
              <label className="text-sm font-medium">Sub-items (optional)</label>
              {rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={row.name}
                    onChange={(e) => handleSubItemChange(index, 'name', e.target.value)}
                    placeholder={`Sub-item ${index + 1}`}
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => handleSubItemChange(index, 'quantity', e.target.value)}
                    placeholder="Qty."
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubItemInput(index)}
                    className="h-9 w-9 shrink-0"
                    aria-label="Remove sub-item"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSubItemInput}>
                <Plus className="mr-2 h-4 w-4" /> Add Sub-item
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button type="submit">Add Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
  
