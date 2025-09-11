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
    // If someone tries to access /templates/new, redirect to templates page
    if (templateId === 'new') {
      router.push('/templates');
      return;
    }
    
    const predefinedTemplate = getPredefinedItemByKey(templateId);
    if (predefinedTemplate) {
      setTemplate(predefinedTemplate);
    }
    setIsLoading(false);
  }, [templateId, router]);

  const handleAddToChecklist = async () => {
    if (!template || !firstChecklist) {
      alert('Esmalt loo checklist, kuhu template lisada!');
      return;
    }
    
    setIsAddingToChecklist(true);
    
    try {
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
      
      alert(`Template "${template.text}" lisatud checklist'i!`);
      router.push('/');
      
    } catch (error) {
      console.error('Error adding template:', error);
      alert('Viga template lisamisel!');
    } finally {
      setIsAddingToChecklist(false);
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

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Template'i ei leitud!
          </AlertDescription>
        </Alert>
        <Link href="/templates">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tagasi template'idele
          </Button>
        </Link>
      </div>
    );
  }

  // Get category info
  const categoryConfig = categories.find(cat => cat.key === template.category) || 
                         { key: 'other', name: 'Other', color: '#64748b', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '📝' };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-3 sm:p-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tagasi
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{template.text}</h1>
            <p className="text-slate-600">Template eelvaade ja kasutamine</p>
          </div>
        </div>
        
        {/* Simple Add Button */}
        <Button 
          onClick={handleAddToChecklist} 
          className="bg-green-600 hover:bg-green-700"
          disabled={isAddingToChecklist || !firstChecklist}
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {isAddingToChecklist ? '⏳ Lisab...' : '🚀 Lisa checklist\'i'}
        </Button>
      </div>

      {/* Warning if no checklists */}
      {(!checklists || checklists.length === 0) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription className="text-orange-800">
            <span className="font-medium">Hoiatus:</span> Sul pole veel ühtegi checklist'i. 
            Template'i kasutamiseks loo esmalt checklist main lehel.
          </AlertDescription>
        </Alert>
      )}

      {/* Simple Template Preview */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryConfig.bgColor}`}>
                <span className="text-lg">{categoryConfig.icon}</span>
              </div>
              <span>{template.text}</span>
            </CardTitle>
            <Badge 
              variant="outline" 
              className={`${categoryConfig.textColor} ${categoryConfig.bgColor}`}
            >
              {categoryConfig.name}
            </Badge>
          </div>
          <p className="text-slate-600 mt-2">
            See template sisaldab {template.subItems.length} alamülesannet
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
              <span>📋</span>
              <span>Alamülesanded:</span>
            </h3>
            
            <div className="space-y-2">
              {template.subItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-4 flex-shrink-0"></div>
                  <span className="flex-1 text-slate-700">{item.text}</span>
                  {item.quantity && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                      {item.quantity}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-2">Kuidas kasutada?</h3>
            <p className="text-blue-800 text-sm">
              Vajuta <span className="font-semibold">"🚀 Lisa checklist'i"</span> nuppu, 
              et lisada see template koos kõigi alamülesannetega oma aktiivsesse checklist'i.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
