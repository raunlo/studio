'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPredefinedItemByKey, PredefinedChecklistItem, categories } from '@/lib/knowledge-base';
import { useGetAllChecklists } from '@/api/checklist/checklist';
import { useChecklist } from '@/hooks/use-checklist';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<PredefinedChecklistItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToChecklist, setIsAddingToChecklist] = useState(false);

  // Get checklists and use first one
  const { data: checklists } = useGetAllChecklists();
  const firstChecklist = checklists?.[0];
  const { addItem: addItemToChecklist } = useChecklist(firstChecklist?.id || 0);

  useEffect(() => {
    if (templateId === 'new') {
      setTemplate(null);
      setTemplateName('');
      setTemplateDescription('');
      setItems([]);
      setIsLoading(false);
    } else {
      const predefinedTemplate = getPredefinedItemByKey(templateId);
      if (predefinedTemplate) {
        setTemplate(predefinedTemplate);
        setTemplateName(predefinedTemplate.text);
        setTemplateDescription('Eelseadistatud template');
        setItems(predefinedTemplate.subItems.map((item, index) => ({
          id: `item-${index}`,
          text: item.text,
          quantity: item.quantity,
          completed: false
        })));
      }
      setIsLoading(false);
    }
  }, [templateId]);

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: TemplateItem = {
        id: `item-${Date.now()}`,
        text: newItemText.trim(),
        completed: false
      };
      setItems([...items, newItem]);
      setNewItemText('');
    }
  };

  const updateItem = (id: string, updates: Partial<TemplateItem>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setIsEditing(false);
    
    // If this was a new template, redirect to the new template ID
    if (templateId === 'new') {
      const newTemplateId = `custom-${Date.now()}`;
      router.push(`/templates/${newTemplateId}`);
    }
  };

  const createChecklistFromTemplate = async () => {
    if (!template || !firstChecklist) {
      alert('Esmalt loo checklist, kuhu template lisada!');
      return;
    }
    
    setIsCreatingChecklist(true);
    
    try {
      // Create the main item with all sub-items
      const checklistItem = {
        completed: false,
        name: template.text,
        id: null,
        orderNumber: null,
        rows: template.subItems.map((subItem: any) => ({
          id: null,
          name: subItem.text,
          completed: false
        }))
      };
      
      await addItemToChecklist(checklistItem);
      
      // Show success message and redirect
      alert(`Template "${template.text}" lisatud checklist'i "${firstChecklist.name}"!`);
      router.push('/');
      
    } catch (error) {
      console.error('Error adding template:', error);
      alert('Viga template lisamisel!');
    } finally {
      setIsCreatingChecklist(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Laadib template'i...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tagasi template'idele
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {templateId === 'new' ? 'Uus template' : (isEditing ? 'Muuda template\'i' : templateName)}
            </h1>
            <p className="text-slate-600">
              {templateId === 'new' ? 'Loo uus korduvate ülesannete template' : 'Template detailid ja haldamine'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing && template && (
            <Button 
              onClick={createChecklistFromTemplate} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isCreatingChecklist || !firstChecklist}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreatingChecklist ? '⏳ Lisab...' : '🚀 Lisa checklist\'i'}
            </Button>
          )}
          
          {templateId !== 'new' && (
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvesta
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Muuda
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Warning if no checklists */}
      {(!checklists || checklists.length === 0) && !isEditing && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription className="text-orange-800">
            <span className="font-medium">Hoiatus:</span> Sul pole veel ühtegi checklist'i. 
            Template'i kasutamiseks loo esmalt checklist main lehel.
          </AlertDescription>
        </Alert>
      )}

      {/* Template Basic Info */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Template info</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template nimi</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={!isEditing}
                placeholder="Sisesta template nimi..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="items-count">Ülesannete arv</Label>
              <Input
                id="items-count"
                value={items.length}
                disabled
                className="mt-1 bg-slate-50"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="template-description">Kirjeldus</Label>
            <Textarea
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              disabled={!isEditing}
              placeholder="Template kirjeldus..."
              className="mt-1"
              rows={3}
            />
          </div>

          {template && !isEditing && (
            <div className="pt-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Eelseadistatud template
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Items */}
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>Template ülesanded</span>
            </CardTitle>
            {isEditing && (
              <Button
                onClick={addItem}
                size="sm"
                variant="outline"
                disabled={!newItemText.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Lisa ülesanne
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new item input (only in edit mode) */}
          {isEditing && (
            <div className="flex space-x-2 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Uue ülesande nimi..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addItem();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={addItem} disabled={!newItemText.trim()}>
                Lisa
              </Button>
            </div>
          )}

          {/* Items list */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Veel pole ülesandeid lisatud</p>
              {isEditing && (
                <p className="text-sm mt-1">Lisa esimene ülesanne üleval</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  {isEditing && (
                    <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />
                  )}
                  
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => 
                      updateItem(item.id, { completed: !!checked })
                    }
                    disabled={!isEditing}
                  />
                  
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={item.text}
                        onChange={(e) => updateItem(item.id, { text: e.target.value })}
                        className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                      />
                    ) : (
                      <span className={`${item.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {item.text}
                      </span>
                    )}
                  </div>
                  
                  {item.quantity && (
                    <Badge variant="outline" className="text-xs">
                      {item.quantity}
                    </Badge>
                  )}
                  
                  <div className="text-sm text-slate-500 min-w-[2rem] text-center">
                    {index + 1}
                  </div>
                  
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700 p-1 h-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save/Action Buttons */}
      {isEditing && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              if (templateId === 'new') {
                router.push('/templates');
              }
            }}
          >
            Tühista
          </Button>
          <Button
            onClick={handleSave}
            disabled={!templateName.trim() || items.length === 0 || isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvestab...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvesta template
              </>
            )}
          </Button>
        </div>
      )}

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          💡 <strong>Nõuanne:</strong> Template'ist loodud checklist'id säilitavad kõik siin määratud ülesanded. 
          Sa saad neid hiljem checklist'is muuta ja täiendada.
        </AlertDescription>
      </Alert>
    </div>
  );
}
