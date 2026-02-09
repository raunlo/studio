'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Star, BookOpen, Grid, List, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PredefinedChecklistItem } from '@/lib/knowledge-base';
import { useGetAllRecipes, createRecipe, updateRecipeById, deleteRecipeById, getGetAllRecipesKey } from '@/api/recipe/recipe';
import type { RecipeResponse, CreateRecipeRequest, UpdateRecipeRequest } from '@/api/checklistServiceV1.schemas';
import { toast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';

export default function TemplatesPage() {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Recipe dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeResponse | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeRows, setRecipeRows] = useState<{ id?: number; name: string }[]>([]);
  const [newRowName, setNewRowName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRecipe, setDeletingRecipe] = useState<RecipeResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user recipes from API
  const { data: recipes, isLoading, error } = useGetAllRecipes();



  // Filter user recipes
  const filteredRecipes = (recipes ?? []).filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.rows.some(row => row.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Alphabetically grouped items for scrubber
  type AlphaItem = { type: 'recipe'; data: RecipeResponse } | { type: 'predefined'; data: PredefinedChecklistItem };

  const alphabeticalGroups = useMemo(() => {
    const items: AlphaItem[] = [
      ...filteredRecipes.map(r => ({ type: 'recipe' as const, data: r })),
    ];

    items.sort((a, b) => {
      const nameA = (a.type === 'recipe' ? a.data.name : a.data.text).toLowerCase();
      const nameB = (b.type === 'recipe' ? b.data.name : b.data.text).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const groups: Record<string, AlphaItem[]> = {};
    for (const item of items) {
      const name = item.type === 'recipe' ? item.data.name : item.data.text;
      const letter = (name[0] || '#').toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    return groups;
  }, [filteredRecipes]);

  const activeLetters = useMemo(() => Object.keys(alphabeticalGroups).sort(), [alphabeticalGroups]);

  // Scrubber refs and state
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const scrollToLetter = useCallback((letter: string) => {
    const el = sectionRefs.current[letter];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveLetter(letter);
    }
  }, []);

  const hasResults = filteredRecipes.length > 0 || activeLetters.length > 0;

  const getLetterFromY = useCallback((clientY: number) => {
    if (!scrubberRef.current) return null;
    const rect = scrubberRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const index = Math.floor((y / rect.height) * activeLetters.length);
    const clamped = Math.max(0, Math.min(activeLetters.length - 1, index));
    return activeLetters[clamped];
  }, [activeLetters]);

  const handleScrubberTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const letter = getLetterFromY(e.touches[0].clientY);
    if (letter) {
      scrollToLetter(letter);
    }
  }, [getLetterFromY, scrollToLetter]);

  // Dialog handlers
  const openCreateDialog = () => {
    setEditingRecipe(null);
    setRecipeName('');
    setRecipeDescription('');
    setRecipeRows([]);
    setNewRowName('');
    setDialogOpen(true);
  };

  const openEditDialog = (recipe: RecipeResponse) => {
    setEditingRecipe(recipe);
    setRecipeName(recipe.name);
    setRecipeDescription(recipe.description ?? '');
    setRecipeRows(recipe.rows.map(r => ({ id: r.id, name: r.name })));
    setNewRowName('');
    setDialogOpen(true);
  };

  const openDeleteDialog = (recipe: RecipeResponse) => {
    setDeletingRecipe(recipe);
    setDeleteDialogOpen(true);
  };

  const handleAddRow = () => {
    const trimmed = newRowName.trim();
    if (!trimmed) return;
    setRecipeRows([...recipeRows, { name: trimmed }]);
    setNewRowName('');
  };

  const handleRemoveRow = (index: number) => {
    setRecipeRows(recipeRows.filter((_, i) => i !== index));
  };

  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRow();
    }
  };

  const handleSaveRecipe = async () => {
    const trimmedName = recipeName.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    try {
      if (editingRecipe) {
        // Update existing recipe
        const request: UpdateRecipeRequest = {
          name: trimmedName,
          description: recipeDescription.trim() || undefined,
          rows: recipeRows.map(r => ({ id: r.id, name: r.name })),
        };
        await updateRecipeById(editingRecipe.id, request);
        toast({ title: t('recipes.recipeUpdated') });
      } else {
        // Create new recipe
        const request: CreateRecipeRequest = {
          name: trimmedName,
          description: recipeDescription.trim() || undefined,
          rows: recipeRows.map(r => ({ name: r.name })),
        };
        await createRecipe(request);
        toast({ title: t('recipes.recipeCreated') });
      }
      // Revalidate the recipes list
      mutate(getGetAllRecipesKey());
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast({
        title: editingRecipe ? t('recipes.failedToUpdate') : t('recipes.failedToCreate'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!deletingRecipe) return;

    setIsDeleting(true);
    try {
      await deleteRecipeById(deletingRecipe.id);
      toast({ title: t('recipes.recipeDeleted') });
      mutate(getGetAllRecipesKey());
      setDeleteDialogOpen(false);
      setDeletingRecipe(null);
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      toast({
        title: t('recipes.failedToDelete'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Render user recipe card (grid view)
  const renderRecipeCard = (recipe: RecipeResponse) => (
    <Card key={`recipe-${recipe.id}`} className="group overflow-hidden border border-border/60 hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition-all duration-300 bg-card">
      {/* Teal accent bar */}
      <div className="h-1 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="text-lg font-headline text-foreground group-hover:text-primary transition-colors truncate">
              {recipe.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/8 text-primary border-primary/20">
                <BookOpen className="h-3 w-3 mr-1" />
                {t('recipes.userRecipe')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {recipe.rows.length} {t('recipes.subItems')}
              </span>
            </div>
          </div>
          <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(recipe)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => openDeleteDialog(recipe)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {recipe.description && (
          <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
        )}
        <div className="space-y-2">
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recipe.rows.map((row) => (
              <div key={row.id} className="flex items-center text-sm text-foreground/70 py-0.5">
                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full mr-3 flex-shrink-0"></div>
                <span className="flex-1">{row.name}</span>
              </div>
            ))}
            {recipe.rows.length === 0 && (
              <p className="text-sm text-muted-foreground italic">{t('recipes.empty')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render predefined template card (grid view)
  const renderPredefinedCard = (template: PredefinedChecklistItem) => (
    <Card key={`predefined-${template.key}`} className="group overflow-hidden border border-border/60 hover:border-accent/30 hover:shadow-[var(--shadow-card)] transition-all duration-300 bg-card">
      <div className="h-1 bg-accent/20 group-hover:bg-accent/40 transition-colors" />
      <CardHeader className="pb-3">
        <div className="space-y-1.5">
          <CardTitle className="text-lg font-headline text-foreground group-hover:text-accent transition-colors truncate">
            {template.text}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-accent/8 text-accent border-accent/20">
              <Star className="h-3 w-3 mr-1" />
              {t('recipes.predefined')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {template.subItems.length} {t('recipes.subItems')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {template.subItems.map((item, idx) => (
            <div key={idx} className="flex items-center text-sm text-foreground/70 py-0.5">
              <div className="w-1.5 h-1.5 bg-accent/50 rounded-full mr-3 flex-shrink-0"></div>
              <span className="flex-1">{item.text}</span>
              {item.quantity && (
                <span className="text-xs text-muted-foreground ml-2">{item.quantity}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Render user recipe in list view
  const renderRecipeListItem = (recipe: RecipeResponse) => (
    <Card key={`recipe-${recipe.id}`} className="group border border-border/60 hover:border-primary/40 hover:shadow-[var(--shadow-subtle)] transition-all duration-300 bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {recipe.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {recipe.rows.length} {t('recipes.subItems')}
                {recipe.description && ` · ${recipe.description}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(recipe)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => openDeleteDialog(recipe)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render predefined template in list view
  const renderPredefinedListItem = (template: PredefinedChecklistItem) => (
    <Card key={`predefined-${template.key}`} className="group border border-border/60 hover:border-accent/30 hover:shadow-[var(--shadow-subtle)] transition-all duration-300 bg-card">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Star className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
                {template.text}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {template.subItems.length} {t('recipes.subItems')} · {t('recipes.predefined')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {[1, 2, 3].map(i => (
        <Card key={i} className="border-border/60 bg-card overflow-hidden">
          <div className="h-1 bg-muted" />
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 pb-20 sm:pb-4 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/checklist"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('overview.title')}
            </Link>
            <span className="text-muted-foreground/40">/</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-headline text-foreground">{t('recipes.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('recipes.subtitle')}</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-primary hover:bg-primary/90 text-primary-foreground self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('recipes.newRecipe')}
        </Button>
      </div>

      {/* Search and controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('recipes.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex border border-border rounded-lg p-1 bg-card">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="px-3"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
        <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-sm text-foreground/80">{t('recipes.info')}</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5">
          <p className="text-sm text-destructive">{t('error.loadError')}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && renderSkeleton()}

      {/* Empty / no results */}
      {!isLoading && !hasResults && (
        <div className="text-center py-20 px-4 border-2 border-dashed border-border rounded-xl bg-card">
          <div className="max-w-md mx-auto">
            <button
              onClick={!searchQuery ? openCreateDialog : undefined}
              className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={t('recipes.newRecipe')}
            >
              <BookOpen className="w-8 h-8 text-primary" />
            </button>
            <h3 className="text-xl font-headline text-foreground">
              {searchQuery ? t('recipes.noResults') : t('recipes.empty')}
            </h3>
            <p className="text-muted-foreground mt-2 mb-6">
              {searchQuery ? t('recipes.noResultsDescription') : t('recipes.emptyDescription')}
            </p>
            {!searchQuery && (
              <Button
                onClick={openCreateDialog}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('recipes.createFirst')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content sections with alphabet scrubber */}
      {!isLoading && hasResults && (
        <div className="relative flex">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {activeLetters.map(letter => (
              <div
                key={letter}
                ref={(el) => { sectionRefs.current[letter] = el; }}
                className="scroll-mt-4"
              >
                {/* Section header */}
                <div className="sticky top-0 z-[5] bg-background/95 backdrop-blur-sm -mx-1 px-1 pb-2 pt-1">
                  <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">{letter}</h2>
                </div>
                {/* Section items */}
                <div className={
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                    : "space-y-3"
                }>
                  {alphabeticalGroups[letter].map(item =>
                    item.type === 'recipe'
                      ? (viewMode === 'grid'
                          ? renderRecipeCard(item.data as RecipeResponse)
                          : renderRecipeListItem(item.data as RecipeResponse))
                      : (viewMode === 'grid'
                          ? renderPredefinedCard(item.data as PredefinedChecklistItem)
                          : renderPredefinedListItem(item.data as PredefinedChecklistItem))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Compact alphabet scrubber - only active letters, vertically centered */}
          {activeLetters.length > 1 && (
            <div className="sticky top-1/3 self-start ml-1 sm:ml-2 z-30">
              <div
                ref={scrubberRef}
                className="flex flex-col items-center gap-1 select-none touch-none relative"
                onTouchStart={(e) => {
                  setIsScrubbing(true);
                  handleScrubberTouch(e);
                }}
                onTouchMove={handleScrubberTouch}
                onTouchEnd={() => {
                  setIsScrubbing(false);
                  setTimeout(() => setActiveLetter(null), 1000);
                }}
              >
                {activeLetters.map(letter => {
                  const isCurrent = activeLetter === letter;
                  return (
                    <button
                      key={letter}
                      className={`
                        w-6 h-6 flex items-center justify-center text-[11px] sm:text-xs rounded-full
                        transition-all duration-100
                        ${isCurrent
                          ? 'bg-primary text-primary-foreground font-bold scale-110'
                          : 'text-primary/70 font-semibold hover:bg-primary/10'
                        }
                      `}
                      onClick={() => scrollToLetter(letter)}
                      aria-label={`Jump to ${letter}`}
                    >
                      {letter}
                    </button>
                  );
                })}
                {/* Floating letter bubble when scrubbing */}
                {isScrubbing && activeLetter && (
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-headline shadow-lg pointer-events-none">
                    {activeLetter}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Recipe Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
          {/* Header with accent stripe */}
          <div className="h-1 bg-primary/30" />
          <DialogHeader className="px-6 pt-5 pb-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-headline">
                  {editingRecipe ? t('recipes.editRecipe') : t('recipes.createTitle')}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  {editingRecipe ? t('recipes.editDescription') : t('recipes.createDescription')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-6">
            {/* Recipe name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">{t('recipes.name')}</label>
              <Input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder={t('recipes.namePlaceholder')}
                autoFocus
                className="text-base h-12 sm:h-11"
              />
            </div>

            {/* Recipe description */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-foreground block">{t('recipes.description')}</label>
                <span className="text-[11px] text-muted-foreground/60">
                  {recipeDescription.length > 0 ? `${recipeDescription.length}/200` : ''}
                </span>
              </div>
              <Textarea
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                placeholder={t('recipes.descriptionPlaceholder')}
                className="text-base min-h-[88px] resize-y"
                rows={3}
                maxLength={200}
              />
            </div>

            {/* Recipe rows */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-foreground block">{t('recipes.rows')}</label>
                {recipeRows.length > 0 && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {recipeRows.length} {t('recipes.subItems')}
                  </span>
                )}
              </div>

              {/* Add row input - moved above list for better flow */}
              <div className="flex items-center gap-2">
                <Input
                  value={newRowName}
                  onChange={(e) => setNewRowName(e.target.value)}
                  onKeyDown={handleRowKeyDown}
                  placeholder={t('recipes.rowPlaceholder')}
                  className="flex-1 h-11"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  disabled={!newRowName.trim()}
                  className="h-11 px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {recipeRows.length > 0 && (
                <div className="space-y-0.5 max-h-52 overflow-y-auto rounded-lg border border-border/60 bg-muted/20">
                  {recipeRows.map((row, index) => (
                    <div key={index} className="flex items-center gap-2.5 group px-3 py-2 hover:bg-muted/40 transition-colors">
                      <span className="text-sm text-muted-foreground tabular-nums w-5 text-right flex-shrink-0">{index + 1}.</span>
                      <span className="flex-1 text-sm text-foreground">{row.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveRow(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {recipeRows.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 py-6 text-center">
                  <p className="text-sm text-muted-foreground/60">{t('recipes.empty')}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-1 border-t border-border/40">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-11 px-6 mt-4">
                {t('recipes.cancel')}
              </Button>
              <Button
                onClick={handleSaveRecipe}
                disabled={!recipeName.trim() || isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 min-w-[110px] mt-4"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSaving
                  ? (editingRecipe ? t('recipes.saving') : t('recipes.creating'))
                  : (editingRecipe ? t('recipes.save') : t('recipes.create'))
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">{t('recipes.deleteRecipe')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('recipes.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('recipes.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecipe}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isDeleting ? t('recipes.deleting') : t('recipes.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
