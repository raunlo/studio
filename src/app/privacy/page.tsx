import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-8">
          <h1 className="font-headline text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </header>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p>
              Daily Chexly (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
              protecting your privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our checklist application.
            </p>
            <p>
              By using Daily Chexly, you agree to the collection and use of information in
              accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Information We Collect</h2>

            <h3 className="mt-4 text-xl font-medium">2.1 Information from Google Sign-In</h3>
            <p>When you sign in with Google, we receive and store:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Google User ID</strong> - Unique account identifier
              </li>
              <li>
                <strong>Email address</strong> - Account identification and communication
              </li>
              <li>
                <strong>Display name</strong> - Personalization (optional display)
              </li>
              <li>
                <strong>Profile photo URL</strong> - Personalization (optional display)
              </li>
              <li>
                <strong>Age verification timestamp</strong> - When you confirmed meeting age
                requirements
              </li>
            </ul>

            <h3 className="mt-4 text-xl font-medium">2.2 User-Generated Content</h3>
            <p>Content you create within the application:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Checklist names and descriptions</strong> - Free text fields
              </li>
              <li>
                <strong>Checklist items</strong> - Tasks you create
              </li>
              <li>
                <strong>Checklist item rows</strong> - Sub-tasks within items
              </li>
              <li>
                <strong>Sharing preferences</strong> - Which users you share checklists with
              </li>
            </ul>
            <p className="mt-2 rounded-md bg-muted p-3 text-sm">
              <strong>Important:</strong> You control what you enter in free text fields. Do not
              enter sensitive personal information (health data, financial details, passwords)
              unless you understand these are stored in our database.
            </p>

            <h3 className="mt-4 text-xl font-medium">2.3 Technical Data (Transient)</h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>IP addresses</strong> - Used temporarily for rate limiting; not persisted
                beyond 60 minutes
              </li>
              <li>
                <strong>Session tokens</strong> - Encrypted; used for authentication
              </li>
              <li>
                <strong>Request timestamps</strong> - For rate limiting and security; not persisted
              </li>
            </ul>

            <h3 className="mt-4 text-xl font-medium">2.4 Information We Do NOT Collect</h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>Payment or financial information</li>
              <li>Precise geolocation data</li>
              <li>Device fingerprints or advertising identifiers</li>
              <li>Browsing history outside our application</li>
              <li>Third-party tracking cookies</li>
              <li>Biometric data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>

            <h3 className="mt-4 text-xl font-medium">3.1 Service Provision</h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>Authenticate your identity via Google Sign-In</li>
              <li>Store and manage your checklists</li>
              <li>Enable sharing checklists with other users</li>
              <li>Display your name/photo in shared checklists</li>
            </ul>

            <h3 className="mt-4 text-xl font-medium">3.2 Security</h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>Validate authentication tokens</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Security logging with hashed user identifiers</li>
            </ul>

            <h3 className="mt-4 text-xl font-medium">3.3 Communication</h3>
            <p>
              We may use your email for critical service notifications (security alerts, terms
              changes) and to respond to support requests. We do <strong>not</strong> send marketing
              emails unless you opt in.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Data Sharing</h2>
            <p>
              <strong>We never sell, rent, or trade your personal information.</strong>
            </p>
            <p className="mt-2">We may share your information only:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>With other users</strong> - When you share a checklist (name, photo visible
                to collaborators)
              </li>
              <li>
                <strong>With law enforcement</strong> - When legally required
              </li>
              <li>
                <strong>With service providers</strong> - Infrastructure hosting with appropriate
                data agreements
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Data Retention</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Account data</strong> - Until you delete your account
              </li>
              <li>
                <strong>Checklists</strong> - Until you delete them or your account
              </li>
              <li>
                <strong>Session tokens</strong> - Until logout or 7 days of inactivity
              </li>
              <li>
                <strong>Security logs</strong> - 90 days maximum
              </li>
              <li>
                <strong>Rate limiting data</strong> - 60 minutes
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Your Rights</h2>

            <h3 className="mt-4 text-xl font-medium">6.1 GDPR Rights (EU/EEA Users)</h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Access</strong> - Export all your data via Settings
              </li>
              <li>
                <strong>Erasure</strong> - Delete your account and all data
              </li>
              <li>
                <strong>Portability</strong> - Data export in machine-readable JSON format
              </li>
              <li>
                <strong>Rectification</strong> - Edit your checklists anytime
              </li>
              <li>
                <strong>Restriction/Object</strong> - Contact us
              </li>
            </ul>

            <h3 className="mt-4 text-xl font-medium">6.2 CCPA Rights (California Users)</h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Know</strong> - What personal information we collect and how it&apos;s used
              </li>
              <li>
                <strong>Delete</strong> - Your personal information
              </li>
              <li>
                <strong>Non-discrimination</strong> - For exercising your privacy rights
              </li>
            </ul>
            <p className="mt-2">
              <strong>Do Not Sell or Share:</strong> We do not sell or share personal information
              for cross-context behavioral advertising.
            </p>

            <h3 className="mt-4 text-xl font-medium">6.3 Other US State Laws</h3>
            <p>
              We comply with applicable state privacy laws including Virginia (VCDPA), Colorado
              (CPA), Connecticut (CTDPA), and Utah (UCPA).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Data Security</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Encryption in transit (TLS 1.2+)</li>
              <li>Encryption at rest</li>
              <li>Google OAuth 2.0 authentication</li>
              <li>Ownership verification before data access</li>
              <li>Encrypted session tokens with automatic expiration</li>
              <li>Input validation and rate limiting</li>
              <li>Security headers (HSTS, CSP, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Data Hosting</h2>
            <p>All our services and data are hosted within the European Union.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. Age Requirements</h2>
            <p>
              Daily Chexly is intended for users who meet the minimum age requirement for using
              online services in their jurisdiction. By using our service, you confirm that you meet
              this requirement. If you believe someone who does not meet the age requirement in
              their jurisdiction has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. User-Generated Content</h2>
            <p>
              You are responsible for content you enter into checklists. Do not use Daily Chexly to
              store:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Illegal content</li>
              <li>Content that infringes others&apos; rights</li>
              <li>Sensitive personal data of third parties without consent</li>
              <li>Passwords, API keys, or security credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Changes will be indicated by updating
              the &quot;Last Updated&quot; date. For material changes, we will post a notice in the
              application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">12. Contact Us</h2>
            <p>
              <strong>Data Controller:</strong> Daily Chexly is operated by an individual based in
              Spain (European Union).
            </p>
            <p className="mt-2">
              <strong>Privacy Questions:</strong> privacy@dailychexly.com
              <br />
              <strong>Security Issues:</strong> security@dailychexly.com
              <br />
              <strong>Support:</strong> support@dailychexly.com
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Since the operator is based within the EU, no separate EU Representative is required.
              Given the limited scope of data processing, no DPO is required.
            </p>
            <p className="mt-4">
              <strong>Complaints:</strong> If you believe your privacy rights have been violated,
              you may lodge a complaint with your local Data Protection Authority (EU), the ICO
              (UK), or the FTC (US).
            </p>
          </section>

          <section className="rounded-lg bg-muted p-4">
            <h2 className="text-xl font-semibold">Summary</h2>
            <p className="mt-2">
              In plain language: We collect your Google account info (email, name, photo) and the
              checklists you create. We use this to provide the service and let you collaborate with
              others. We don&apos;t sell your data. You can export or delete everything anytime.
            </p>
          </section>
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
