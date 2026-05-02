'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import type { TemplateResponse as Template } from '@/api/checklistServiceV1.schemas';

interface TemplateCardProps {
  template: Template;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 cursor-pointer" onClick={() => onEdit(template.id)}>
          <CardTitle className="text-lg hover:text-primary transition-colors">
            {template.name}
          </CardTitle>
          {template.description && (
            <CardDescription className="mt-1">{template.description}</CardDescription>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(template.id)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit', 'Edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(template.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <span>
              {template.rows.length} {template.rows.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Created {new Date(template.createdAt).toLocaleDateString()}
          </p>
          {template.description && (
            <p className="text-xs italic text-muted-foreground/60 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
