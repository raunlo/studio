"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ListChecks, MoreVertical, Edit, Share2, Trash2, Users, Crown, LogOut } from "lucide-react";
import { useState } from "react";
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
  sharedWith?: string[];
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
  sharedWith = [],
  onShare,
  onDelete,
  onEdit,
  onLeave
}: ChecklistOverviewCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

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
      className="group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-blue-400 bg-white"
    >
      <div className="p-4 sm:p-5">
        {/* Icon and Title */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <ListChecks className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {name}
              </h3>
              {/* Owner/Shared badges */}
              {isOwner && isShared && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <Users className="w-3 h-3" />
                  <span>{sharedWith.length}</span>
                </div>
              )}
              {!isOwner && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  <Share2 className="w-3 h-3" />
                  <span>Jagatud</span>
                </div>
              )}
            </div>
            {totalItems > 0 ? (
              <p className="text-sm text-gray-500">
                <span className="font-medium text-blue-600">{completedItems}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span>{totalItems}</span>
                <span className="ml-1 text-gray-400">{t('overview.completed')}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400">{t('overview.emptyList')}</p>
            )}
          </div>
          
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isOwner && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Muuda nime
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Jaga
                </DropdownMenuItem>
              )}
              {isOwner ? (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Kustuta
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleLeave} className="text-orange-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Lahku
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/5 transition-all pointer-events-none" />
    </Card>
  );
}
