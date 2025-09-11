'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Edit2, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPredefinedItems, categories } from '@/lib/knowledge-base';
import { useGetAllChecklists } from '@/api/checklist/checklist';
import { useChecklist } from '@/hooks/use-checklist';

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);

  const predefinedTemplates = getPredefinedItems();
  
  // Get checklists and use first one for adding templates
  const { data: checklists } = useGetAllChecklists();
  const firstChecklist = checklists?.[0];
  const { addItem: addItemToChecklist } = useChecklist(firstChecklist?.id || 0);

  // Simple function to add template directly to checklist
  const handleUseTemplate = async (template: any) => {
    if (!firstChecklist) {
      alert('Loo esmalt checklist main lehel!');
      return;
    }
    
    setUsingTemplate(template.key);
    
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
      alert(`✅ "${template.text}" lisatud checklist'i!`);
      
    } catch (error) {
      console.error('Error adding template:', error);
      alert('❌ Viga template lisamisel!');
    } finally {
      setUsingTemplate(null);
    }
  };

  // Category helper functions
  const getCategoryColor = (category: string) => {
    const colors = {
      work: 'bg-blue-500',
      personal: 'bg-green-500',
      health: 'bg-red-500',
      shopping: 'bg-yellow-500',
      event: 'bg-purple-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getCategoryName = (category: string) => {
    const names = {
      work: 'Töö',
      personal: 'Isiklik',
      health: 'Tervis',
      shopping: 'Ostlemine',
      event: 'Sündmus'
    };
    return names[category as keyof typeof names] || 'Muu';
  };

  const filteredTemplates = predefinedTemplates
    .filter(template => {
      // Search filter
      const matchesSearch = template.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.subItems.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Category filter
      const matchesCategory = selectedCategory === null || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.text.localeCompare(b.text)); // Sort alphabetically

  // Group templates by first letter for alphabet navigation
  const groupedTemplates = filteredTemplates.reduce((groups: any, template) => {
    const firstLetter = template.text.charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(template);
    return groups;
  }, {});

  const alphabetLetters = Object.keys(groupedTemplates).sort();
  const fullAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Scroll to letter function
  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get category counts
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {};
    predefinedTemplates.forEach(template => {
      counts[template.category] = (counts[template.category] || 0) + 1;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  // Category configuration helper
  const getCategoryConfig = (category: string) => {
    return categories.find(cat => cat.key === category) || 
           { key: 'other', name: 'Other', color: '#64748b', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '📝' };
  };

  const renderListView = (template: any) => {
    const categoryConfig = getCategoryConfig(template.category);
    const isExpanded = expandedTemplate === template.key;
    
    return (
      <div key={`list-${template.key}`} className="border-b border-slate-200 last:border-b-0 transition-all duration-200">
        <div 
          className={`p-4 sm:p-5 transition-all duration-300 cursor-pointer ${
            isExpanded 
              ? 'bg-blue-50 border-l-4 border-blue-400' 
              : 'hover:bg-slate-50 hover:shadow-sm'
          }`}
          onClick={() => setExpandedTemplate(isExpanded ? null : template.key)}
        >
          <div className="flex items-start space-x-4">
            {/* Category indicator */}
            <div 
              className={`w-1 h-12 rounded-full flex-shrink-0 transition-all duration-300 ${
                isExpanded ? 'w-2 h-14' : ''
              }`}
              style={{ backgroundColor: categoryConfig.color }}
            />
            
            {/* Category icon */}
            <div className={`flex-shrink-0 transition-transform duration-300 ${
              isExpanded ? 'scale-110' : ''
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryConfig.bgColor}`}>
                <span className="text-lg">{categoryConfig.icon}</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    isExpanded ? 'text-blue-900 text-lg sm:text-xl' : 'text-slate-900 text-base sm:text-lg'
                  }`}>
                    {template.text}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-slate-600 mt-1">
                    <span>{template.subItems.length} alamülesannet</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">Kasutatud {template.usageCount || 0}x</span>
                  </div>
                </div>
                <div className={`transition-all duration-300 self-start ${
                  isExpanded ? 'text-blue-700 font-medium' : 'text-blue-600'
                }`}>
                  <span className="text-sm">
                    {isExpanded ? '👁️' : '👆'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {/* Category badge */}
                <Badge 
                  variant="outline" 
                  className={`text-xs font-medium transition-all duration-300 ${categoryConfig.textColor} ${categoryConfig.bgColor} border-2 ${
                    isExpanded ? 'scale-105 shadow-sm' : ''
                  }`}
                >
                  <span className="mr-1">{categoryConfig.icon}</span>
                  {categoryConfig.name}
                </Badge>
              </div>
            </div>
          </div>          {/* Expanded content */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            {isExpanded && (
              <div className="mt-4 pl-4 sm:pl-8 space-y-3 border-l-2 sm:border-l-3 border-blue-200 animate-in slide-in-from-top-2 duration-300">
                <div className="text-xs sm:text-sm font-semibold text-blue-800 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Alamülesanded:</span>
                </div>
                <div className="space-y-2 bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-blue-100">
                  {template.subItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center text-xs sm:text-sm text-slate-700 py-2 px-2 sm:px-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mr-3 sm:mr-4 flex-shrink-0 animate-pulse"></div>
                      <span className="flex-1 font-medium">{item.text}</span>
                      {item.quantity && (
                        <Badge variant="secondary" className="ml-2 text-xs h-5 sm:h-6 bg-blue-100 text-blue-700">
                          {item.quantity}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Enhanced quick actions */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                  <Link href={`/templates/${template.key}`} className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs border-blue-200 text-blue-700 hover:bg-blue-50">
                      <Edit2 className="h-3 w-3 mr-2" />
                      ✏️ Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full sm:w-auto text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleUseTemplate(template)}
                    disabled={usingTemplate === template.key || !firstChecklist}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    {usingTemplate === template.key ? '⏳' : '🚀'} Use
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Create new template section */}
      <div className="mb-6">
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-slate-600" />
              <div>
                <h3 className="text-base font-medium text-slate-900">
                  Ei leia sobivat template'i?
                </h3>
                <p className="text-sm text-slate-600">
                  Loo oma template ja jaga seda teistega
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/templates/create'}
              className="flex-shrink-0 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Loo uus
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Simple warning if no checklists */}
        {(!checklists || checklists.length === 0) && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              💡 <span className="font-medium">Nõuanne:</span> Template'i kasutamiseks loo esmalt checklist <Link href="/" className="underline font-medium">main lehel</Link>.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Category filters - only show if there are templates */}
        {predefinedTemplates.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-xs h-8"
            >
              Kõik ({predefinedTemplates.length})
            </Button>
            {categories.map(category => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === category.key ? null : category.key)}
                className={`text-xs h-8 ${selectedCategory === category.key ? '' : category.textColor + ' ' + category.bgColor}`}
              >
                <span className="mr-1">{category.icon}</span>
                <span className="hidden sm:inline">{category.name}</span>
                <span className="sm:hidden">{category.icon}</span>
                <span className="ml-1">({categoryCounts[category.key] || 0})</span>
              </Button>
            ))}
          </div>
        )}

        {/* Search - only show if there are templates */}
        {predefinedTemplates.length > 0 && (
          <div className="relative bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200">
            <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Otsi template'e..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-white shadow-sm"
            />
          </div>
        )}

        {/* Info alert - only show if there are templates */}
        {predefinedTemplates.length > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <BookOpen className="h-4 w-4" />
            <AlertDescription className="text-blue-800 text-sm">
              <span className="font-medium">Template'id</span> aitavad kiiremini checklist item'eid luua.
              <span className="hidden sm:inline"> Vali template ja kõik alamülesanded lisatakse automaatselt!</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Templates list */}
        {predefinedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">Ühtegi template'i ei ole veel loodud</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Alusta esimese template'i loomisega üleval oleva nupuga
            </p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">Template'id ei leitud</h3>
            <p className="text-sm sm:text-base text-slate-600">
              {searchQuery 
                ? `Otsisõnaga "${searchQuery}" ei leitud template'e. Proovi teist otsisõna.` 
                : 'Proovi valida teistsugune kategooria üleval.'
              }
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="flex">
              {/* Main list content */}
              <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
                {alphabetLetters.map(letter => (
                  <div key={letter} id={`letter-${letter}`}>
                    {/* Letter header */}
                    <div className="bg-slate-50 px-3 sm:px-4 py-2 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-700 text-sm">{letter}</h3>
                    </div>
                    {/* Templates for this letter */}
                    {groupedTemplates[letter].map((template: any) => renderListView(template))}
                  </div>
                ))}
              </div>
                
              {/* Alphabet navigation sidebar - responsive */}
              <div className="ml-1 sm:ml-2 flex flex-col items-center justify-between bg-white rounded-lg border border-slate-200 py-1 sm:py-2 px-0.5 sm:px-1 sticky top-20 sm:top-32 self-start h-[calc(100vh-6rem)] sm:h-[calc(100vh-9rem)] min-h-[300px] sm:min-h-[400px] overflow-hidden">
                {fullAlphabet.map(letter => {
                  const hasTemplates = alphabetLetters.includes(letter);
                  return (
                    <button
                      key={letter}
                      onClick={() => hasTemplates && scrollToLetter(letter)}
                      disabled={!hasTemplates}
                      className={`
                        w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-medium rounded transition-colors
                        ${hasTemplates 
                          ? 'text-blue-600 hover:bg-blue-50 cursor-pointer' 
                          : 'text-slate-300 cursor-not-allowed'
                        }
                      `}
                      title={hasTemplates ? `Go to ${letter}` : `No templates for ${letter}`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}