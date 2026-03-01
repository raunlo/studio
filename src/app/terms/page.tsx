import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-8">
          <h1 className="font-headline text-4xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </header>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold">1. Agreement to Terms</h2>
            <p>
              By accessing or using Daily Chexly (&quot;the Service&quot;), you agree to be bound by
              these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not
              use the Service.
            </p>
            <p>
              We may modify these Terms at any time. Continued use after changes constitutes
              acceptance of the modified Terms. We will notify you of material changes via the
              application or email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
            <p>
              Daily Chexly is a checklist application that allows you to create, manage, and share
              checklists with nested items. The Service includes:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Creating and organizing checklists</li>
              <li>Adding items and sub-items (rows) to checklists</li>
              <li>Sharing checklists with other users</li>
              <li>Real-time synchronization across devices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Account Registration</h2>

            <h3 className="mt-4 text-xl font-medium">3.1 Google Sign-In</h3>
            <p>
              You must sign in with a valid Google account to use the Service. By signing in, you
              authorize us to access certain information from your Google account as described in
              our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            <h3 className="mt-4 text-xl font-medium">3.2 Account Responsibility</h3>
            <p>You are responsible for:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Maintaining the security of your Google account</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. User Content</h2>

            <h3 className="mt-4 text-xl font-medium">4.1 Your Content</h3>
            <p>
              &quot;User Content&quot; means any content you create, upload, or enter into the
              Service, including checklist names, descriptions, items, and rows. You retain
              ownership of your User Content.
            </p>

            <h3 className="mt-4 text-xl font-medium">4.2 License to Us</h3>
            <p>
              By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free
              license to use, store, display, and transmit your User Content solely for the purpose
              of operating and providing the Service to you and those you share content with.
            </p>

            <h3 className="mt-4 text-xl font-medium">4.3 Content Responsibility</h3>
            <p>You are solely responsible for your User Content. You represent and warrant that:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>You own or have the right to use and share the content</li>
              <li>Your content does not violate any third party&apos;s rights</li>
              <li>Your content complies with these Terms and applicable laws</li>
            </ul>

            <h3 className="mt-4 text-xl font-medium">4.4 Content Guidelines</h3>
            <p className="rounded-md bg-muted p-3">
              <strong>Free Text Fields:</strong> Checklist names, descriptions, and items are free
              text fields. You may enter any content, but you are responsible for what you store. We
              recommend not storing sensitive information like passwords, financial data, or
              confidential business information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Prohibited Uses</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Violate any applicable law or regulation</li>
              <li>Infringe intellectual property rights of others</li>
              <li>Store or transmit malicious code, viruses, or harmful content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Store illegal content or content depicting illegal activities</li>
              <li>Store sensitive personal data of third parties without their consent</li>
              <li>Attempt to gain unauthorized access to the Service or other accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Circumvent security features or rate limits</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
              <li>Resell or commercially exploit the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Sharing and Collaboration</h2>

            <h3 className="mt-4 text-xl font-medium">6.1 Sharing Checklists</h3>
            <p>
              When you share a checklist with another user, they can view (and possibly edit) the
              checklist content. Your name and profile photo may be visible to collaborators.
            </p>

            <h3 className="mt-4 text-xl font-medium">6.2 Shared Content Responsibility</h3>
            <p>
              You are responsible for content you share. Do not share content that others should not
              see, and do not share checklists containing sensitive information about third parties.
            </p>

            <h3 className="mt-4 text-xl font-medium">6.3 Invite Links</h3>
            <p>
              Invite links allow others to access shared checklists. You are responsible for
              managing who has access and revoking invites when appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Intellectual Property</h2>

            <h3 className="mt-4 text-xl font-medium">7.1 Our Intellectual Property</h3>
            <p>
              The Service, including its design, features, code, and branding, is owned by Daily
              Chexly and protected by intellectual property laws. You may not copy, modify,
              distribute, sell, or lease any part of the Service.
            </p>

            <h3 className="mt-4 text-xl font-medium">7.2 Feedback</h3>
            <p>
              If you provide feedback or suggestions about the Service, we may use them without
              obligation to compensate you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Service Availability</h2>

            <h3 className="mt-4 text-xl font-medium">8.1 No Guarantee</h3>
            <p>
              We strive to provide reliable service but do not guarantee uninterrupted or error-free
              operation. The Service is provided &quot;as is&quot; and &quot;as available.&quot;
            </p>

            <h3 className="mt-4 text-xl font-medium">8.2 Modifications</h3>
            <p>
              We may modify, suspend, or discontinue any part of the Service at any time, with or
              without notice. We will make reasonable efforts to notify you of significant changes.
            </p>

            <h3 className="mt-4 text-xl font-medium">8.3 Data Backup</h3>
            <p>
              While we maintain backups, you are encouraged to export your data regularly. We are
              not responsible for data loss.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. Termination</h2>

            <h3 className="mt-4 text-xl font-medium">9.1 By You</h3>
            <p>
              You may stop using the Service and delete your account at any time through the account
              settings. Upon deletion, all your data will be permanently removed.
            </p>

            <h3 className="mt-4 text-xl font-medium">9.2 By Us</h3>
            <p>
              We may suspend or terminate your access to the Service at any time for any reason,
              including but not limited to:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Violation of these Terms</li>
              <li>Illegal activity</li>
              <li>Extended inactivity</li>
              <li>Technical or security reasons</li>
            </ul>
            <p className="mt-2">
              We will make reasonable efforts to notify you before termination unless prohibited by
              law or immediate action is necessary.
            </p>

            <h3 className="mt-4 text-xl font-medium">9.3 Effect of Termination</h3>
            <p>
              Upon termination, your right to use the Service ceases immediately. Sections that by
              their nature should survive termination will survive (including limitation of
              liability, indemnification, and governing law).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. Disclaimer of Warranties</h2>
            <p className="rounded-md bg-muted p-3 font-mono text-sm">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
              WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY.
            </p>
            <p className="mt-2">
              We do not warrant that the Service will be uninterrupted, secure, or error-free, or
              that defects will be corrected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">11. Limitation of Liability</h2>
            <p className="rounded-md bg-muted p-3 font-mono text-sm">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DAILY CHEXLY SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
              LIMITED TO LOSS OF DATA, PROFITS, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE
              OF THE SERVICE.
            </p>
            <p className="mt-2">
              Our total liability for any claims arising from the Service shall not exceed the
              amount you paid us in the twelve (12) months preceding the claim, or $100 USD,
              whichever is greater.
            </p>
            <p className="mt-2">
              Some jurisdictions do not allow limitation of liability for certain damages, so some
              of these limitations may not apply to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Daily Chexly and its officers,
              directors, employees, and agents from any claims, damages, losses, liabilities, and
              expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Your use of the Service</li>
              <li>Your User Content</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third party&apos;s rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">13. Governing Law and Disputes</h2>

            <h3 className="mt-4 text-xl font-medium">13.1 Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Spain,
              without regard to conflict of law principles.
            </p>

            <h3 className="mt-4 text-xl font-medium">13.2 Dispute Resolution</h3>
            <p>
              Any disputes arising from these Terms or the Service shall first be attempted to be
              resolved through good-faith negotiation. If negotiation fails, disputes shall be
              resolved through binding arbitration or in the courts of Spain.
            </p>

            <h3 className="mt-4 text-xl font-medium">13.3 Class Action Waiver</h3>
            <p>
              You agree to resolve disputes with us on an individual basis. You waive the right to
              participate in class actions, class arbitrations, or representative actions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">14. General Provisions</h2>

            <h3 className="mt-4 text-xl font-medium">14.1 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between
              you and Daily Chexly regarding the Service.
            </p>

            <h3 className="mt-4 text-xl font-medium">14.2 Severability</h3>
            <p>
              If any provision of these Terms is found unenforceable, the remaining provisions will
              continue in effect.
            </p>

            <h3 className="mt-4 text-xl font-medium">14.3 Waiver</h3>
            <p>
              Our failure to enforce any right or provision does not constitute a waiver of that
              right or provision.
            </p>

            <h3 className="mt-4 text-xl font-medium">14.4 Assignment</h3>
            <p>
              You may not assign your rights under these Terms. We may assign our rights to any
              affiliate or successor.
            </p>

            <h3 className="mt-4 text-xl font-medium">14.5 Force Majeure</h3>
            <p>
              We shall not be liable for any failure to perform due to causes beyond our reasonable
              control, including natural disasters, war, terrorism, riots, embargoes, acts of civil
              or military authorities, fire, floods, accidents, strikes, or shortages of
              transportation, facilities, fuel, energy, labor, or materials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">15. Contact Us</h2>
            <p>Daily Chexly is operated by an individual based in Spain (European Union).</p>
            <p className="mt-2">If you have questions about these Terms, please contact us:</p>
            <p className="mt-2">
              <strong>Email:</strong> support@dailychexly.com
            </p>
          </section>

          <section className="rounded-lg bg-muted p-4">
            <h2 className="text-xl font-semibold">Summary</h2>
            <p className="mt-2">
              In plain language: You can use Daily Chexly to create and share checklists. You own
              your content but give us permission to store and display it. Don&apos;t use the
              Service for illegal purposes. We provide the Service &quot;as is&quot; without
              guarantees. These Terms are governed by Spanish law.
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
