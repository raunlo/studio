"use client";

import type { Checklist, ChecklistItem, SubItem } from "@/lib/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Sparkles } from "lucide-react";
import { ChecklistCard } from "@/components/checklist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestTasks } from "@/ai/flows/suggest-tasks-flow";
import { useToast } from "@/hooks/use-toast";

const LOCAL_STORAGE_KEY = "nestedChecklists";

const defaultChecklists: Checklist[] = [
  {
    id: 'cl-1',
    title: "Project Phoenix Kick-off",
    items: [
      {
        id: 'item-1-1',
        text: "Finalize project scope",
        checked: true,
        isCollapsed: false,
        subItems: [
          { id: 'sub-1-1-1', text: "Review initial requirements", checked: true },
          { id: 'sub-1-1-2', text: "Get stakeholder sign-off", checked: true },
        ]
      },
      {
        id: 'item-1-2',
        text: "Assemble the project team",
        checked: false,
        isCollapsed: true,
        subItems: [
          { id: 'sub-1-2-1', text: "Identify key roles", checked: true },
          { id: 'sub-1-2-2', text: "Interview candidates for backend dev", checked: false },
          { id: 'sub-1-2-3', text: "Send out offer letters", checked: false },
        ]
      },
       {
        id: 'item-1-3',
        text: "Setup development environment",
        checked: false,
        isCollapsed: true,
        subItems: []
      }
    ]
  }
];


export function ChecklistManager() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        setChecklists(JSON.parse(storedData));
      } else {
        setChecklists(defaultChecklists);
      }
    } catch (error) {
      console.error("Failed to load from local storage.", error);
      setChecklists(defaultChecklists);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(checklists));
    }
  }, [checklists, isLoading]);

  const addChecklist = async () => {
    if (!newChecklistTitle.trim()) return;

    const newChecklistId = crypto.randomUUID();
    const newChecklist: Checklist = {
      id: newChecklistId,
      title: newChecklistTitle.trim(),
      items: [],
    };
    
    // Optimistically add the new checklist with no items
    setChecklists((prev) => [...prev, newChecklist]);
    const originalTitle = newChecklistTitle;
    setNewChecklistTitle("");
    setIsSuggesting(true);

    try {
      const result = await suggestTasks({ title: originalTitle });
      const suggestedItems: ChecklistItem[] = result.tasks.map(taskText => ({
        id: crypto.randomUUID(),
        text: taskText,
        checked: false,
        isCollapsed: true,
        subItems: [],
      }));
      
      setChecklists((prev) => prev.map(cl => 
        cl.id === newChecklistId ? { ...cl, items: suggestedItems } : cl
      ));

    } catch (error) {
      console.error("Failed to suggest tasks:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate suggested tasks. Please add them manually.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const deleteChecklist = (id: string) => {
    setChecklists(checklists.filter((cl) => cl.id !== id));
  };
  
  const updateChecklistTitle = (id: string, title: string) => {
     setChecklists(checklists.map((cl) => (cl.id === id ? { ...cl, title } : cl)));
  };

  const addItem = (checklistId: string, text: string) => {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text,
      checked: false,
      isCollapsed: true,
      subItems: [],
    };
    setChecklists(
      checklists.map((cl) =>
        cl.id === checklistId ? { ...cl, items: [...cl.items, newItem] } : cl
      )
    );
  };
  
  const deleteItem = (checklistId: string, itemId: string) => {
     setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        return { ...cl, items: cl.items.filter(item => item.id !== itemId) };
     }));
  };

  const updateItem = (checklistId: string, updatedItem: ChecklistItem) => {
    setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        return { ...cl, items: cl.items.map(item => item.id === updatedItem.id ? updatedItem : item) };
    }));
  };
  
  const addSubItem = (checklistId: string, itemId: string, text: string) => {
    const newSubItem: SubItem = { id: crypto.randomUUID(), text, checked: false };
    setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.id !== itemId) return item;
            // When adding a new sub-item, uncheck the parent
            return { ...item, checked: false, subItems: [...item.subItems, newSubItem] };
        });
        return { ...cl, items: updatedItems };
    }));
  };

  const deleteSubItem = (checklistId: string, itemId: string, subItemId: string) => {
    setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.id !== itemId) return item;
            const updatedSubItems = item.subItems.filter(sub => sub.id !== subItemId);
            // After deleting, check if parent should be checked
            const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every(sub => sub.checked);
            return { ...item, checked: parentChecked, subItems: updatedSubItems };
        });
        return { ...cl, items: updatedItems };
    }));
  };
  
  const updateSubItem = (checklistId: string, itemId: string, updatedSubItem: SubItem) => {
    setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.id !== itemId) return item;
            const updatedSubItems = item.subItems.map(sub => sub.id === updatedSubItem.id ? updatedSubItem : sub);
            const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every(sub => sub.checked);
            return { ...item, checked: parentChecked, subItems: updatedSubItems };
        });
        return { ...cl, items: updatedItems };
    }));
  };
  
  const reorderItems = (checklistId: string, draggedItemId: string, targetItemId: string) => {
    setChecklists(checklists.map(cl => {
      if (cl.id !== checklistId) return cl;
  
      const items = [...cl.items];
      const draggedIndex = items.findIndex(item => item.id === draggedItemId);
      const targetIndex = items.findIndex(item => item.id === targetItemId);
  
      if (draggedIndex === -1 || targetIndex === -1) return cl;
  
      const [draggedItem] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, draggedItem);
  
      return { ...cl, items };
    }));
  };


  if (isLoading) {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addChecklist();
        }}
        className="flex gap-2 mb-8"
      >
        <Input
          value={newChecklistTitle}
          onChange={(e) => setNewChecklistTitle(e.target.value)}
          placeholder="Add a new checklist..."
          className="text-base"
          disabled={isSuggesting}
        />
        <Button type="submit" aria-label="Add checklist and suggest tasks" disabled={isSuggesting}>
          {isSuggesting ? (
            <Sparkles className="h-5 w-5 animate-pulse" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </Button>
      </form>

      {isSuggesting && !checklists.find(cl => cl.title === newChecklistTitle) && (
        <div className="space-y-4 mb-6">
            <Skeleton className="h-32 w-full" />
        </div>
      )}

      <div className="space-y-6">
        {checklists.map((checklist) => (
          <ChecklistCard
            key={checklist.id}
            checklist={checklist}
            onDelete={deleteChecklist}
            onUpdateTitle={updateChecklistTitle}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
            onUpdateItem={updateItem}
            onAddSubItem={addSubItem}
            onDeleteSubItem={deleteSubItem}
            onUpdateSubItem={updateSubItem}
            onReorderItems={reorderItems}
          />
        ))}
        {checklists.length === 0 && !isSuggesting && (
            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold text-muted-foreground">No checklists yet!</h3>
                <p className="text-muted-foreground mt-2">Create your first checklist above to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
}
