'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TemplateQuickGuide() {
  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
      <CardHeader>
        <CardTitle className="text-lg">📖 Templates Quick Guide</CardTitle>
        <CardDescription>Learn how to create and use templates in 3 steps</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="use">Use</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-3 mt-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-sm">Click "New Template"</p>
                  <p className="text-xs text-muted-foreground">On the Templates page</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-sm">Fill in the form</p>
                  <p className="text-xs text-muted-foreground">Name (required) + Description (optional)</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-sm">Click "Create"</p>
                  <p className="text-xs text-muted-foreground">Template is now ready to use!</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-3 mt-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  ✎
                </div>
                <div>
                  <p className="font-semibold text-sm">Add Items</p>
                  <p className="text-xs text-muted-foreground">Click "Edit" → Type item name → Press Enter</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  ⚙
                </div>
                <div>
                  <p className="font-semibold text-sm">Edit Template Info</p>
                  <p className="text-xs text-muted-foreground">Click "Edit" → Change name/description → Save</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  🗑
                </div>
                <div>
                  <p className="font-semibold text-sm">Delete Template</p>
                  <p className="text-xs text-muted-foreground">Click "Delete" → Confirm → Gone forever</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="use" className="space-y-3 mt-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-sm">Go to Checklists page</p>
                  <p className="text-xs text-muted-foreground">From main navigation</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-sm">Click "Apply Template" button</p>
                  <p className="text-xs text-muted-foreground">Select the template you want to use</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-sm">Confirm & Done!</p>
                  <p className="text-xs text-muted-foreground">New checklist created with all template items</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-900 dark:text-green-100">
            <strong>💡 Pro Tip:</strong> Create templates for things you do repeatedly (groceries, packing, cleaning, etc.)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
