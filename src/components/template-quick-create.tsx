'use client';

import { useState } from 'react';
import { ChevronDown, Plus, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getPredefinedItems } from '@/lib/knowledge-base';
import { createChecklist } from '@/api/checklist/checklist';
import { createChecklistItem } from '@/api/checklist-item/checklist-item';

export function TemplateQuickCreate() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const predefinedTemplates = getPredefinedItems();

  const createChecklistFromTemplate = async (template: any) => {
    setIsCreating(true);
    setIsOpen(false);
    
    try {
      // Create the checklist
      const newChecklist = await createChecklist({
        name: template.text
      });
      
      if (!newChecklist?.id) {
        throw new Error('Failed to create checklist');
      }
      
      // Add all template items to the checklist
      for (const subItem of template.subItems) {
        await createChecklistItem(newChecklist.id, {
          name: subItem.text,
          rows: []
        });
      }
      
      // Trigger a page refresh to show the new checklist
      window.location.reload();
      
      console.log('Checklist created from template:', template.text);
    } catch (error) {
      console.error('Failed to create checklist from template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50"
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loon...</span>
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4" />
              <span>Template'ist</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 bg-white/95 backdrop-blur-sm" align="start">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-slate-900">Loo template'ist</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Vali template, et kiiresti checklist luua
          </p>
        </div>
        
        <Separator />
        
        <div className="max-h-96 overflow-y-auto">
          {predefinedTemplates.map((template) => (
            <div key={template.key} className="p-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0">
              <button
                onClick={() => createChecklistFromTemplate(template)}
                className="w-full text-left space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm">
                      {template.text}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        <Star className="h-3 w-3 mr-1" />
                        Eelseadistatud
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.subItems.length} ülesannet
                      </Badge>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                </div>
                
                <div className="space-y-1">
                  {template.subItems.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center text-xs text-slate-600">
                      <div className="w-1 h-1 bg-slate-400 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="truncate">{item.text}</span>
                      {item.quantity && (
                        <Badge variant="outline" className="ml-1 text-xs h-4">
                          {item.quantity}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {template.subItems.length > 3 && (
                    <div className="text-xs text-slate-500 pl-3">
                      +{template.subItems.length - 3} rohkem...
                    </div>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
        
        <Separator />
        
        <div className="p-3">
          <a
            href="/templates"
            className="w-full justify-start text-sm flex items-center p-2 rounded-md hover:bg-slate-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Halda template'e
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
