'use client';

import { ListChecks, Search, CheckCircle } from 'lucide-react';

type EmptyStateVariant = 'no-items' | 'no-results' | 'all-completed';

type ChecklistEmptyStateProps = {
  variant: EmptyStateVariant;
  searchQuery?: string;
};

export function ChecklistEmptyState({ variant, searchQuery }: ChecklistEmptyStateProps) {
  const content = {
    'no-items': {
      icon: ListChecks,
      title: 'No items yet',
      description: 'Add your first item to get started with your checklist.',
    },
    'no-results': {
      icon: Search,
      title: 'No items found',
      description: searchQuery
        ? `No items match "${searchQuery}". Try a different search.`
        : 'No items match your current filters.',
    },
    'all-completed': {
      icon: CheckCircle,
      title: 'All done!',
      description: "You've completed all items in this checklist.",
    },
  };

  const { icon: Icon, title, description } = content[variant];

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-base font-medium text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
