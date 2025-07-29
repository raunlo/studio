
"use client";

import type { Checklist, ChecklistItem, SubItem } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";
import { AddItemModal } from "@/components/add-item-modal";
import { Droppable } from "@hello-pangea/dnd";
import { AddItemForm } from "@/components/add-item-form";
import { findPredefinedItems } from "@/ai/flows/find-predefined-items-flow";
import { PredefinedChecklistItem, getPredefinedItemByKey } from "@/lib/knowledge-base";
import { AddItemSelectionModal } from "./add-item-selection-modal";
import { useToast } from "@/hooks/use-toast";


type ChecklistCardProps = {
  checklist: Checklist;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onAddItem: (checklistId: string, text: string, subItems: string[]) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onUpdateItem: (checklistId: string, item: ChecklistItem) => void;
  onAddSubItem: (checklistId: string, itemId: string, text: string) => void;
  onDeleteSubItem: (checklistId: string, itemId: string, subItemId: string) => void;
  onUpdateSubItem: (checklistId: string, itemId: string, subItem: SubItem) => void;
};

export function ChecklistCard({
  checklist,
  onDelete,
  onUpdateTitle,
  onAddItem,
  ...itemHandlers
}: ChecklistCardProps) {
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [itemText, setItemText] = useState("");
  const [subItems, setSubItems] = useState<string[]>([]);
  const [foundItems, setFoundItems] = useState<PredefinedChecklistItem[]>([]);
  const { toast } = useToast();


  const handleAddItem = (itemText: string, subItems: string[]) => {
    if (itemText.trim()) {
        onAddItem(checklist.id, itemText.trim(), subItems);
    }
  };

  const handleFormSubmit = async (text: string) => {
    setIsProcessing(true);
    setItemText(text);
    try {
      const result = await findPredefinedItems({ query: text });
      if (result && result.items && result.items.length > 0) {
        // We need to get the full predefined item from the key, as the AI might hallucinate sub-items
        const fullItems = result.items.map(item => getPredefinedItemByKey(item.key)).filter(Boolean) as PredefinedChecklistItem[];
        setFoundItems(fullItems);
        setIsSelectionModalOpen(true);
      } else {
        // No matches, open regular add modal
        setSubItems([]);
        setIsAddItemModalOpen(true);
      }
    } catch (error) {
      console.error("Error finding predefined items:", error);
      toast({
        title: "AI Search Failed",
        description: "Could not search for templates. Opening a blank item instead.",
        variant: "default",
      });
      // Fallback to regular add modal on error
      setSubItems([]);
      setIsAddItemModalOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateSelect = (item: PredefinedChecklistItem) => {
    setItemText(item.text);
    setSubItems(item.subItems);
    setIsSelectionModalOpen(false);
    setIsAddItemModalOpen(true);
  }

  const handleSelectNone = () => {
     // ItemText is already set from the form
    setSubItems([]);
    setIsSelectionModalOpen(false);
    setIsAddItemModalOpen(true);
  }

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-2xl font-bold font-headline">{checklist.title}</h2>
          <Button variant="ghost" size="icon" onClick={() => onDelete(checklist.id)} aria-label="Delete checklist">
            <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
          </Button>
        </CardHeader>
        <CardContent className="pb-4 flex-grow">
          <Droppable droppableId={checklist.id} type="item">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 min-h-[10px]"
              >
                {checklist.items.map((item, index) => (
                  <ChecklistItemComponent
                      key={item.id}
                      item={item}
                      index={index}
                      checklistId={checklist.id}
                      {...itemHandlers}
                  />
                ))}
                {provided.placeholder}
                {checklist.items.length === 0 && (
                     <p className="text-muted-foreground text-center py-4">No items in this checklist yet.</p>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
        <CardFooter className="pt-4 border-t">
           <AddItemForm onFormSubmit={handleFormSubmit} isProcessing={isProcessing} />
        </CardFooter>
      </Card>

      <AddItemModal 
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onAddItem={handleAddItem}
        initialText={itemText}
        initialSubItems={subItems}
      />

      {foundItems.length > 0 && (
        <AddItemSelectionModal
          isOpen={isSelectionModalOpen}
          onClose={() => setIsSelectionModalOpen(false)}
          originalQuery={itemText}
          foundItems={foundItems}
          onSelect={handleTemplateSelect}
          onSelectNone={handleSelectNone}
        />
      )}
    </>
  );
}
