'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { MoreVertical, Edit, Share2, Trash2, Users, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';

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
  onLeave,
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
    if (totalItems > 0) {
      toast({
        title: t('overview.cannotDelete'),
        description: t('overview.deleteAllItemsFirst'),
      });
      return;
    }
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
      className="group relative cursor-pointer overflow-hidden border border-border/60 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-[var(--shadow-card)] active:scale-[0.98]"
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
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Badges */}
            <div className="mb-2 flex items-center gap-2">
              {isOwner && isShared && numberOfSharedUsers > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Users className="h-3 w-3" />
                  <span>{numberOfSharedUsers}</span>
                </span>
              )}
              {!isOwner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Share2 className="h-3 w-3" />
                  <span>{t('overview.sharedWithMe')}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="truncate font-headline text-lg text-foreground transition-colors group-hover:text-primary sm:text-xl">
              {name}
            </h3>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="-mr-2 -mt-1 flex-shrink-0 touch-manipulation rounded-lg p-2 transition-colors hover:bg-muted sm:opacity-0 sm:focus:opacity-100 sm:group-hover:opacity-100"
            >
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isOwner && (
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  {t('overview.rename')}
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('overview.share')}
                </DropdownMenuItem>
              )}
              {isOwner ? (
                <DropdownMenuItem
                  onClick={handleDelete}
                  className={
                    totalItems > 0
                      ? 'cursor-not-allowed text-muted-foreground opacity-50'
                      : 'cursor-pointer text-destructive focus:text-destructive'
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('overview.delete')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleLeave}
                  className="cursor-pointer text-orange-600 focus:text-orange-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('overview.leave')}
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
                <span className="font-headline text-2xl text-primary">{completedItems}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-lg text-muted-foreground">{totalItems}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress === 100 ? (
                  <span className="font-medium text-accent">{t('overview.complete')}</span>
                ) : (
                  `${Math.round(progress)}%`
                )}
              </span>
            </>
          ) : (
            <p className="text-sm italic text-muted-foreground">{t('overview.emptyList')}</p>
          )}
        </div>
      </div>

      {/* Decorative corner element */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 opacity-0 transition-opacity group-hover:opacity-100">
        <svg viewBox="0 0 64 64" className="h-full w-full text-primary/5" fill="currentColor">
          <path d="M64 64V0C64 35.346 35.346 64 0 64h64z" />
        </svg>
      </div>
    </Card>
  );
}
