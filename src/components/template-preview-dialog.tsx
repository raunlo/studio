"use client";

import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { Drawer } from "vaul";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import type { DropdownItem } from "./predefined-items-dropdown";

type TemplatePreviewDialogProps = {
  item: DropdownItem | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function SubItemsList({ subItems }: { subItems: DropdownItem["subItems"] }) {
  const { t } = useTranslation();

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">
        {t("recipes.itemsToAdd")}
      </h4>
      <ul className="max-h-60 overflow-y-auto space-y-1.5">
        {subItems.map((subItem, index) => (
          <li
            key={index}
            className="flex items-center gap-2.5 text-sm text-foreground py-1 px-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
            <span>{subItem.text}</span>
            {subItem.quantity != null && subItem.quantity > 1 && (
              <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                x{subItem.quantity}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TemplatePreviewDialog({
  item,
  onConfirm,
  onCancel,
}: TemplatePreviewDialogProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isOpen = item !== null;

  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-auto fixed bottom-0 left-0 right-0 z-50 outline-none">
            {/* iOS-style drag handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/30 mt-4 mb-6" />

            <div className="px-6 pb-6">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4.5 w-4.5 text-primary shrink-0" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {item?.text}
                  </h2>
                </div>
                {item?.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Sub-items list */}
              {item && item.subItems.length > 0 && (
                <div className="mb-6">
                  <SubItemsList subItems={item.subItems} />
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 h-12 touch-manipulation"
                >
                  {t("item.cancel")}
                </Button>
                <Button
                  onClick={onConfirm}
                  className="flex-1 h-12 touch-manipulation"
                >
                  {t("recipes.addToChecklist")}
                </Button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-primary shrink-0" />
            {item?.text}
          </DialogTitle>
          {item?.description && (
            <DialogDescription className="whitespace-pre-wrap">
              {item.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Sub-items list */}
        {item && item.subItems.length > 0 && (
          <SubItemsList subItems={item.subItems} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("item.cancel")}
          </Button>
          <Button onClick={onConfirm}>
            {t("recipes.addToChecklist")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
