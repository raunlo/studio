import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold font-headline">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: [Date]</p>
        </header>
        <div className="prose prose-stone dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold">1. Introduction</h2>
          <p>
            Welcome to QuickCheck! These Terms of Service ("Terms") govern your use of our application. 
            By using our service, you agree to these terms.
          </p>
          <p className="font-bold text-destructive">
            [This is a placeholder. You must replace this content with your own Terms of Service. 
            Consult a legal professional to draft this document.]
          </p>
          
          <h2 className="text-2xl font-semibold mt-6">2. Your Account</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and password.
          </p>

          <h2 className="text-2xl font-semibold mt-6">3. Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material.
          </p>

          <h2 className="text-2xl font-semibold mt-6">4. Prohibited Uses</h2>
          <p>
            You may use the Service only for lawful purposes.
          </p>

          <h2 className="text-2xl font-semibold mt-6">5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever.
          </p>

          <h2 className="text-2xl font-semibold mt-6">6. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
          </p>

          <h2 className="text-2xl font-semibold mt-6">Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at [Your Contact Email].</p>
        </div>
        <div className="mt-12 text-center">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}