"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MoreVertical, Edit, Share2, Trash2, Users, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface ChecklistOverviewCardProps {
  id: number;
  name: string;
  totalItems?: number;
  completedItems?: number;
  isOwner?: boolean;
  isShared?: boolean;
  numberOfSharedUsers?: number;
  onShare?: (id: number) => void;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
  onLeave?: (id: number) => void;
}

export function ChecklistOverviewCard({
  id,
  name,
  totalItems = 0,
  completedItems = 0,
  isOwner = true,
  isShared = false,
  numberOfSharedUsers = 0,
  onShare,
  onDelete,
  onEdit,
  onLeave
}: ChecklistOverviewCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const handleClick = () => {
    router.push(`/checklist/${id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLeave) {
      onLeave(id);
    }
  };

  return (
    <Card
      onClick={handleClick}
      className="group relative overflow-hidden cursor-pointer bg-card border border-border/60 hover:border-primary/40 transition-all duration-300 hover:shadow-[var(--shadow-card)] active:scale-[0.98]"
    >
      {/* Progress bar at top */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5 sm:p-6">
        {/* Header with title and menu */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              {isOwner && isShared && numberOfSharedUsers > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  <Users className="w-3 h-3" />
                  <span>{numberOfSharedUsers}</span>
                </span>
              )}
              {!isOwner && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  <Share2 className="w-3 h-3" />
                  <span>{t('overview.sharedWithMe')}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-headline text-lg sm:text-xl text-foreground truncate group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 p-2 -mr-2 -mt-1 hover:bg-muted rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 touch-manipulation"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isOwner && (
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}
              {isOwner ? (
                <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleLeave} className="cursor-pointer text-orange-600 focus:text-orange-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          {totalItems > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-headline text-primary">{completedItems}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-lg text-muted-foreground">{totalItems}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress === 100 ? (
                  <span className="text-accent font-medium">Complete</span>
                ) : (
                  `${Math.round(progress)}%`
                )}
              </span>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t('overview.emptyList')}</p>
          )}
        </div>
      </div>

      {/* Decorative corner element */}
      <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full text-primary/5"
          fill="currentColor"
        >
          <path d="M64 64V0C64 35.346 35.346 64 0 64h64z" />
        </svg>
      </div>
    </Card>
  );
}
