'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { categories } from '@/lib/knowledge-base';

interface SubItem {
  id: string;
  text: string;
}

interface NewTemplate {
  name: string;
  description: string;
  category: string;
  subItems: SubItem[];
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const [template, setTemplate] = useState<NewTemplate>({
    name: '',
    description: '',
    category: 'work',
    subItems: []
  });
  const [newSubItemText, setNewSubItemText] = useState('');

  const addSubItem = () => {
    if (newSubItemText.trim()) {
      const newSubItem: SubItem = {
        id: Date.now().toString(),
        text: newSubItemText.trim()
      };
      setTemplate(prev => ({
        ...prev,
        subItems: [...prev.subItems, newSubItem]
      }));
      setNewSubItemText('');
    }
  };

  const removeSubItem = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      subItems: prev.subItems.filter(item => item.id !== id)
    }));
  };

  const updateSubItem = (id: string, text: string) => {
    setTemplate(prev => ({
      ...prev,
      subItems: prev.subItems.map(item => 
        item.id === id ? { ...item, text } : item
      )
    }));
  };

  const handleSave = () => {
    if (!template.name.trim()) {
      alert('Palun sisesta template\'i nimi!');
      return;
    }
    if (template.subItems.length === 0) {
      alert('Lisa vähemalt üks alamülesanne!');
      return;
    }
    
    // Here you would save to your backend
    alert('Template loomine pole veel implementeeritud. Tuleb varsti!');
  };

  const getCategoryConfig = (categoryKey: string) => {
    const existingCategory = categories.find(cat => cat.key === categoryKey);
    if (existingCategory) {
      return existingCategory;
    }
    
    // Custom category
    return {
      key: categoryKey,
      name: categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      color: '#64748b',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      icon: '📝'
    };
  };

  const selectedCategoryConfig = getCategoryConfig(template.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Main content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Save button at top */}
        <div className="flex justify-end mb-6">
          <Button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvesta
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Basic info card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">{selectedCategoryConfig.icon}</span>
                <span>Template info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template nimi *
                </label>
                <Input
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="nt. Korteri koristamine"
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kirjeldus (valikuline)
                </label>
                <Textarea
                  value={template.description}
                  onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Lühike kirjeldus template'i kohta..."
                  rows={3}
                />
              </div>

              {/* Category selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kategooria
                </label>
                <div className="space-y-3">
                  {/* Existing categories */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => setTemplate(prev => ({ ...prev, category: category.key }))}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          template.category === category.key
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{category.icon}</div>
                        <div className="text-xs font-medium">{category.name}</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom category input */}
                  <div className="border-t border-slate-200 pt-3">
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Või loo uus kategooria:
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Kategooria nimi (nt. Kool, Spord)"
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            const categoryName = input.value.trim();
                            if (categoryName) {
                              const customKey = categoryName.toLowerCase().replace(/\s+/g, '-');
                              setTemplate(prev => ({ ...prev, category: customKey }));
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                          const categoryName = input.value.trim();
                          if (categoryName) {
                            const customKey = categoryName.toLowerCase().replace(/\s+/g, '-');
                            setTemplate(prev => ({ ...prev, category: customKey }));
                            input.value = '';
                          }
                        }}
                      >
                        Lisa
                      </Button>
                    </div>
                    
                    {/* Show custom category if selected */}
                    {!categories.find(cat => cat.key === template.category) && template.category && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">📝</span>
                          <span className="text-sm font-medium text-green-800">
                            Uus kategooria: {template.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sub-items card */}
          <Card>
            <CardHeader>
              <CardTitle>Alamülesanded</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new sub-item */}
              <div className="flex space-x-2">
                <Input
                  value={newSubItemText}
                  onChange={(e) => setNewSubItemText(e.target.value)}
                  placeholder="Lisa uus alamülesanne..."
                  onKeyPress={(e) => e.key === 'Enter' && addSubItem()}
                  className="flex-1"
                />
                <Button onClick={addSubItem} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Sub-items list */}
              {template.subItems.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Lisa vähemalt üks alamülesanne oma template'ile
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {template.subItems.map((subItem, index) => (
                    <div key={subItem.id} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                      <Badge variant="outline" className="flex-shrink-0">
                        {index + 1}
                      </Badge>
                      <Input
                        value={subItem.text}
                        onChange={(e) => updateSubItem(subItem.id, e.target.value)}
                        className="flex-1 bg-white"
                      />
                      <Button
                        onClick={() => removeSubItem(subItem.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview card */}
          {template.name && template.subItems.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Eelvaade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedCategoryConfig.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-slate-600">{template.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="ml-8 space-y-1">
                    {template.subItems.map((subItem, index) => (
                      <div key={subItem.id} className="flex items-center space-x-2 text-sm">
                        <span className="text-slate-400">•</span>
                        <span>{subItem.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
