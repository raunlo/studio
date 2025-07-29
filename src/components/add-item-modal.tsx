
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (itemText: string, subItems: string[]) => void;
};

export function AddItemModal({ isOpen, onClose, onAddItem }: AddItemModalProps) {
  const [itemText, setItemText] = useState("");
  const [subItems, setSubItems] = useState<string[]>([""]);

  const handleSubItemChange = (index: number, value: string) => {
    const newSubItems = [...subItems];
    newSubItems[index] = value;
    setSubItems(newSubItems);
  };

  const addSubItemInput = () => {
    setSubItems([...subItems, ""]);
  };

  const removeSubItemInput = (index: number) => {
    if (subItems.length > 1) {
      const newSubItems = subItems.filter((_, i) => i !== index);
      setSubItems(newSubItems);
    } else {
      // Clear the last remaining input instead of removing it
      setSubItems([""]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemText.trim()) {
      const finalSubItems = subItems.map(s => s.trim()).filter(s => s !== "");
      onAddItem(itemText.trim(), finalSubItems);
      // Reset form and close
      setItemText("");
      setSubItems([""]);
      onClose();
    }
  };
  
  const handleClose = () => {
    setItemText("");
    setSubItems([""]);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="name"
                value={itemText}
                onChange={(e) => setItemText(e.target.value)}
                placeholder="Main item name..."
                className="col-span-4"
                required
              />
            </div>
            <div className="col-span-4 space-y-2">
              <label className="text-sm font-medium">Sub-items (optional)</label>
              {subItems.map((subItem, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={subItem}
                    onChange={(e) => handleSubItemChange(index, e.target.value)}
                    placeholder={`Sub-item ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubItemInput(index)}
                    className="h-9 w-9"
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
