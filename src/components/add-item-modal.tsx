
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";
import { PredefinedSubItem } from "@/lib/knowledge-base";

type SubItemState = {
    text: string;
    quantity: string;
}

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (itemText: string, quantity: number | undefined, subItems: PredefinedSubItem[]) => void;
  initialText?: string;
  initialQuantity?: number;
  initialSubItems?: PredefinedSubItem[];
};

export function AddItemModal({ 
    isOpen, 
    onClose, 
    onAddItem, 
    initialText = "", 
    initialQuantity, 
    initialSubItems = [] 
}: AddItemModalProps) {
  const [itemText, setItemText] = useState(initialText);
  const [quantity, setQuantity] = useState(initialQuantity?.toString() ?? "");
  const [subItems, setSubItems] = useState<SubItemState[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItemText(initialText);
      setQuantity(initialQuantity?.toString() ?? "");
      const formattedSubItems = initialSubItems.map(si => ({
          text: si.text,
          quantity: si.quantity?.toString() ?? ""
      }));
      setSubItems(formattedSubItems.length > 0 ? formattedSubItems : [{ text: "", quantity: "" }]);
    }
  }, [isOpen, initialText, initialQuantity, initialSubItems]);

  const handleSubItemChange = (index: number, field: 'text' | 'quantity', value: string) => {
    const newSubItems = [...subItems];
    newSubItems[index][field] = value;
    setSubItems(newSubItems);
  };

  const addSubItemInput = () => {
    setSubItems([...subItems, { text: "", quantity: "" }]);
  };

  const removeSubItemInput = (index: number) => {
    if (subItems.length > 1) {
      const newSubItems = subItems.filter((_, i) => i !== index);
      setSubItems(newSubItems);
    } else {
      setSubItems([{ text: "", quantity: "" }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemText.trim()) {
      const finalSubItems = subItems
        .map(s => ({ text: s.text.trim(), quantity: s.quantity ? parseInt(s.quantity) : undefined }))
        .filter(s => s.text !== "");
      onAddItem(itemText.trim(), quantity ? parseInt(quantity) : undefined, finalSubItems);
      handleClose();
    }
  };
  
  const handleClose = () => {
    setItemText("");
    setQuantity("");
    setSubItems([{ text: "", quantity: "" }]);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-6 items-center gap-4">
              <Input
                id="name"
                value={itemText}
                onChange={(e) => setItemText(e.target.value)}
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
              {subItems.map((subItem, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={subItem.text}
                    onChange={(e) => handleSubItemChange(index, 'text', e.target.value)}
                    placeholder={`Sub-item ${index + 1}`}
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    value={subItem.quantity}
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
