
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PredefinedChecklistItem } from "@/lib/knowledge-base";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type AddItemSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  originalQuery: string;
  foundItems: PredefinedChecklistItem[];
  onSelect: (item: PredefinedChecklistItem) => void;
  onSelectNone: () => void;
};

export function AddItemSelectionModal({ 
    isOpen, 
    onClose, 
    originalQuery, 
    foundItems, 
    onSelect, 
    onSelectNone 
}: AddItemSelectionModalProps) {
  
  const [selectedValue, setSelectedValue] = useState<string>(foundItems[0]?.key || "");

  const handleSelect = () => {
    const selectedItem = foundItems.find(item => item.key === selectedValue);
    if(selectedItem) {
        onSelect(selectedItem);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Template Found</DialogTitle>
          <DialogDescription>
            We found some templates matching &quot;{originalQuery}&quot;. Select one to use or continue with a blank item.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <RadioGroup value={selectedValue} onValueChange={setSelectedValue}>
                {foundItems.map(item => (
                     <div key={item.key} className="flex items-center space-x-2">
                        <RadioGroupItem value={item.key} id={item.key} />
                        <Label htmlFor={item.key} className="flex flex-col gap-1 py-2">
                           <span>{item.text}</span>
                           {item.subItems.length > 0 && (
                            <span className="text-xs text-muted-foreground italic">
                                Includes: {item.subItems.join(', ')}
                            </span>
                           )}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onSelectNone}>Create Blank Item</Button>
          <Button type="button" onClick={handleSelect} disabled={!selectedValue}>Use Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
