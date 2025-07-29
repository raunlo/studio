
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

type AddItemFormProps = {
  onFormSubmit: (text: string) => void;
  isProcessing: boolean;
};

export function AddItemForm({ onFormSubmit, isProcessing }: AddItemFormProps) {
  const [itemText, setItemText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemText.trim()) {
      onFormSubmit(itemText.trim());
      setItemText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={itemText}
        onChange={(e) => setItemText(e.target.value)}
        placeholder="Add an item or search templates..."
        className="h-9"
        disabled={isProcessing}
      />
      <Button 
        type="submit" 
        size="sm"
        disabled={isProcessing || !itemText.trim()}
      >
        <Plus className="mr-2 h-4 w-4" /> Add
      </Button>
    </form>
  );
}
