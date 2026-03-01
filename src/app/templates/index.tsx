'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Star, BookOpen, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPredefinedItems, PredefinedChecklistItem } from '@/lib/knowledge-base';

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const predefinedTemplates = getPredefinedItems();

  // Filter templates based on search
  const filteredTemplates = predefinedTemplates.filter(
    (template) =>
      template.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subItems.some((item) => item.text.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const renderTemplateCard = (template: PredefinedChecklistItem) => (
    <Card
      key={template.key}
      className="group border-slate-200 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-blue-300 hover:shadow-lg"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg font-medium text-slate-900 transition-colors group-hover:text-blue-700">
              {template.text}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-xs text-amber-700"
              >
                <Star className="mr-1 h-3 w-3" />
                Eelseadistatud
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {template.subItems.length} alamülesannet
              </Badge>
            </div>
          </div>
          <div className="flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Link href={`/templates/${template.key}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-600">Alamülesanded:</div>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {template.subItems.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center py-1 text-sm text-slate-600">
                <div className="mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400"></div>
                <span className="flex-1">{item.text}</span>
                {item.quantity && (
                  <Badge variant="outline" className="ml-2 h-5 text-xs">
                    {item.quantity}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex space-x-2 border-t border-slate-100 pt-3">
          <Link href={`/templates/${template.key}`} className="flex-1">
            <Button variant="outline" className="w-full text-sm">
              <Edit2 className="mr-2 h-4 w-4" />
              Muuda
            </Button>
          </Link>
          <Button variant="outline" className="text-sm text-blue-600 hover:text-blue-700">
            Kopeeri
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderListView = (template: any) => (
    <Card
      key={template.key}
      className="group border-slate-200 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-4">
            <BookOpen className="h-5 w-5 flex-shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium text-slate-900 transition-colors group-hover:text-blue-700">
                {template.text}
              </h3>
              <div className="mt-1 flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-xs text-amber-700"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Eelseadistatud
                </Badge>
                <span className="text-sm text-slate-500">
                  {template.subItems.length} alamülesannet
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center space-x-2">
            <Link href={`/templates/${template.key}`}>
              <Button variant="outline" size="sm">
                <Edit2 className="mr-1 h-4 w-4" />
                Muuda
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Tagasi</span>
                </Button>
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-slate-900">Template'id</h1>
                <p className="text-sm text-slate-600">Halda ülesannete template'e</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/templates/new">
                <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Uus template</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Search and controls */}
          <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:hidden">Template'id</h1>
              <p className="mt-1 text-slate-600">Halda ülesannete template'e ja alamülesandeid</p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                <Input
                  placeholder="Otsi template'e..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>

              {/* View mode toggle */}
              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
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
          </div>

          {/* Info alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <BookOpen className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Template'id</strong> aitavad kiiremini checklist item'eid luua. Vali template
              ja kõik alamülesanded lisatakse automaatselt!
            </AlertDescription>
          </Alert>

          {/* Templates grid/list */}
          {filteredTemplates.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-medium text-slate-900">Template'id ei leitud</h3>
              <p className="mb-6 text-slate-600">
                {searchQuery ? 'Proovi muuta otsingusõna' : 'Lisa oma esimene template'}
              </p>
              <Link href="/templates/new">
                <Button className="bg-blue-600 hover:bg-blue-700">Loo uus template</Button>
              </Link>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'space-y-3'
              }
            >
              {filteredTemplates.map((template) =>
                viewMode === 'grid' ? renderTemplateCard(template) : renderListView(template),
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
