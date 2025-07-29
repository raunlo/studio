import { ChecklistManager } from "@/components/checklist-manager";

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
            QuickCheck
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Organize your tasks with AI-powered suggestions.
          </p>
        </header>
        <ChecklistManager />
      </div>
    </main>
  );
}
