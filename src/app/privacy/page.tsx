import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold font-headline">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: [Date]</p>
        </header>
        <div className="prose prose-stone dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold">1. Introduction</h2>
          <p>
            Welcome to Daily Chexly. We respect your privacy and are committed to protecting it. This Privacy Policy explains how we collect, use, and share your personal information.
          </p>
          <p className="font-bold text-destructive">
            [This is a placeholder. You must replace this content with your own Privacy Policy. 
            Consult a legal professional to ensure it complies with laws like GDPR, CCPA, etc.]
          </p>

          <h2 className="text-2xl font-semibold mt-6">2. Information We Collect</h2>
          <p>
            We collect information you provide directly to us. For example, we collect information when you create an account, create checklists, or communicate with us.
          </p>

          <h2 className="text-2xl font-semibold mt-6">3. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services.
          </p>

          <h2 className="text-2xl font-semibold mt-6">4. How We Share Your Information</h2>
          <p>
            We do not share your personal information with third parties except as described in this Privacy Policy.
          </p>

          <h2 className="text-2xl font-semibold mt-6">5. Your Choices</h2>
          <p>
            You may update, correct or delete information about you at any time by logging into your account.
          </p>

          <h2 className="text-2xl font-semibold mt-6">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at [Your Contact Email].</p>
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