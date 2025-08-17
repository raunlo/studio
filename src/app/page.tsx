
// This is a Server Component.
// It runs on the server to generate the initial HTML for the page.
// This makes the initial page load very fast.
import { ChecklistManager } from "@/components/checklist-manager";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow min-h-screen bg-background font-body text-foreground overflow-x-hidden">
        <div className="container mx-auto max-w-2xl p-2 sm:p-6 md:p-8">
          <header className="text-center mb-8 md:mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground">
              Checklist
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Organize checklist here using drag and drop to order your items.
            </p>
          </header>
          <ChecklistManager />
        </div>
      </main>
      <footer className="w-full bg-background border-t border-border mt-auto">
        <div className="container mx-auto max-w-2xl p-4 flex justify-center items-center text-sm text-muted-foreground">
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
