"use client";

import { useState } from 'react';
import { ChevronDown, BookOpen, Star, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { PredefinedChecklistItem, getPredefinedItems, categories } from '@/lib/knowledge-base';

type ItemTemplatePickerProps = {
  onSelectTemplate: (template: PredefinedChecklistItem) => void;
  onCreateManual: () => void;
  disabled?: boolean;
};

export function ItemTemplatePicker({ onSelectTemplate, onCreateManual, disabled = false }: ItemTemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const predefinedTemplates = getPredefinedItems();
  
  // Filter templates based on search and category
  const filteredTemplates = predefinedTemplates.filter(template => {
    const matchesSearch = template.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subItems.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: PredefinedChecklistItem) => {
    onSelectTemplate(template);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const handleCreateManual = () => {
    onCreateManual();
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50"
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Vali template või loo käsitsi</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 bg-white/95 backdrop-blur-sm" align="start">
        {/* Compact Header */}
        <div className="p-3 border-b border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium text-slate-900">Lisa ülesanne</h3>
          </div>
          
          {/* Compact Category filters */}
          <div className="flex flex-wrap gap-1 mb-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-xs h-6 px-2"
            >
              Kõik
            </Button>
            {categories.map(category => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === category.key ? null : category.key)}
                className={`text-xs h-6 px-2 ${selectedCategory === category.key ? '' : category.textColor + ' ' + category.bgColor}`}
              >
                <span className="mr-1">{category.icon}</span>
                <span className="hidden sm:inline">{category.name}</span>
              </Button>
            ))}
          </div>
          
          {/* Compact Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3" />
            <Input
              placeholder="Otsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Compact Manual create option */}
        <div className="p-2 border-b border-slate-200">
          <button
            onClick={handleCreateManual}
            className="w-full p-2 text-left rounded-md hover:bg-slate-50 border border-dashed border-slate-200 hover:border-blue-300 transition-all"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">Loo käsitsi</div>
                <div className="text-xs text-slate-600">Lisa tühi ülesanne</div>
              </div>
            </div>
          </button>
        </div>

        {/* Compact Templates list */}
        <div className="max-h-60 overflow-y-auto">
          {filteredTemplates.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <BookOpen className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-sm">Template'id ei leitud</p>
            </div>
          ) : (
            <div className="p-1 space-y-1">
              {filteredTemplates.map((template) => {
                const categoryConfig = categories.find(cat => cat.key === template.category) || 
                                     { key: 'other', name: 'Other', color: '#64748b', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '📝' };
                
                return (
                <button
                  key={template.key}
                  onClick={() => handleSelectTemplate(template)}
                  className="w-full p-2 text-left rounded-md hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 truncate">
                        {template.text}
                      </h4>
                      <div className="flex items-center space-x-1 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs h-5 ${categoryConfig.textColor} ${categoryConfig.bgColor}`}
                        >
                          <span className="mr-1">{categoryConfig.icon}</span>
                          <span className="hidden sm:inline">{categoryConfig.name}</span>
                        </Badge>
                        <Badge variant="secondary" className="text-xs h-5">
                          {template.subItems.length}
                        </Badge>
                      </div>
                    </div>
                    <Plus className="h-3 w-3 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                    
                </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Templates browse link */}
        <div className="border-t border-slate-200 p-2">
          <a
            href="/templates"
            className="w-full justify-center text-sm flex items-center p-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Sirvi kõiki template'e
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
