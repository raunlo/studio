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
  const filteredTemplates = predefinedTemplates.filter(template =>
    template.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subItems.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderTemplateCard = (template: PredefinedChecklistItem) => (
    <Card key={template.key} className="group hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-blue-300 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
              {template.text}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                <Star className="h-3 w-3 mr-1" />
                Eelseadistatud
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {template.subItems.length} alamülesannet
              </Badge>
            </div>
          </div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/templates/${template.key}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-sm text-slate-600 font-medium">
            Alamülesanded:
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {template.subItems.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center text-sm text-slate-600 py-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3 flex-shrink-0"></div>
                <span className="flex-1">{item.text}</span>
                {item.quantity && (
                  <Badge variant="outline" className="ml-2 text-xs h-5">
                    {item.quantity}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex space-x-2">
          <Link href={`/templates/${template.key}`} className="flex-1">
            <Button variant="outline" className="w-full text-sm">
              <Edit2 className="h-4 w-4 mr-2" />
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
    <Card key={template.key} className="group hover:shadow-md transition-all duration-200 border-slate-200 hover:border-blue-300 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center space-x-4">
            <BookOpen className="h-5 w-5 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                {template.text}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  <Star className="h-3 w-3 mr-1" />
                  Eelseadistatud
                </Badge>
                <span className="text-sm text-slate-500">
                  {template.subItems.length} alamülesannet
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link href={`/templates/${template.key}`}>
              <Button variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-1" />
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
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search and controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:hidden">Template'id</h1>
              <p className="text-slate-600 mt-1">
                Halda ülesannete template'e ja alamülesandeid
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Otsi template'e..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* View mode toggle */}
              <div className="flex border border-slate-200 rounded-lg p-1 bg-white">
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
          <Alert className="bg-blue-50 border-blue-200">
            <BookOpen className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Template'id</strong> aitavad kiiremini checklist item'eid luua. 
              Vali template ja kõik alamülesanded lisatakse automaatselt!
            </AlertDescription>
          </Alert>

          {/* Templates grid/list */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Template'id ei leitud</h3>
              <p className="text-slate-600 mb-6">
                {searchQuery ? 'Proovi muuta otsingusõna' : 'Lisa oma esimene template'}
              </p>
              <Link href="/templates/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Loo uus template
                </Button>
              </Link>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-3"
            }>
              {filteredTemplates.map(template => 
                viewMode === 'grid' 
                  ? renderTemplateCard(template)
                  : renderListView(template)
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
