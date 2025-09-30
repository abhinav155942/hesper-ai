import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Hesper AI',
  description: 'Terms of Service for Hesper AI Assistant'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Hesper Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: September 26, 2025</p>
        </header>
        <div className="prose prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary max-w-none">
          <section>
            <h2>Introduction</h2>
            <p>These Terms of Service ("Terms") govern your access to and use of Hesper AI ("Hesper", "we", "us", or "our"), a personal AI assistant platform provided by [Your Company Name]. By accessing or using Hesper, you agree to be bound by these Terms. If you do not agree, you must not use the service.</p>
          </section>

          <section>
            <h2>Who We Are</h2>
            <p>Hesper is an AI-powered chatbot application that utilizes large language models to assist users in various tasks. We are not affiliated with providers of the underlying AI models but use their APIs under official agreements.</p>
          </section>

          <section>
            <h2>Eligibility</h2>
            <p>You must be at least 18 years old to use Hesper. By using the service, you represent that you meet this requirement and have the authority to enter into these Terms.</p>
          </section>

          <section>
            <h2>License and Use</h2>
            <p>We grant you a limited, non-exclusive, revocable license to use Hesper for personal, non-commercial purposes. You may not: (i) copy, modify, or distribute the service; (ii) use it for unlawful purposes; (iii) reverse engineer the service; or (iv) interfere with its operation.</p>
          </section>

          <section>
            <h2>User Content</h2>
            <p>You retain ownership of content you submit to Hesper. By submitting content, you grant us a worldwide, royalty-free license to use it for operating and improving the service. You are responsible for your content and ensure it does not violate laws or third-party rights.</p>
          </section>

          <section>
            <h2>Disclaimers</h2>
            <p>Hesper is provided "as is" without warranties. AI responses may contain errors; always verify information. We are not liable for any damages arising from your use of the service, including indirect or consequential damages.</p>
          </section>

          <section>
            <h2>Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Hesper's total liability shall not exceed $100. We are not responsible for user-generated content or third-party materials.</p>
          </section>

          <section>
            <h2>Termination</h2>
            <p>We may terminate or suspend your access at any time for violation of these Terms. Upon termination, your license ends, and you must cease using the service.</p>
          </section>

          <section>
            <h2>Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use after changes constitutes acceptance. Check this page periodically for updates.</p>
          </section>

          <section>
            <h2>Governing Law</h2>
            <p>These Terms are governed by the laws of [Your Jurisdiction, e.g., California, USA], without regard to conflict of laws principles.</p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>If you have questions about these Terms, contact us at [your-email@example.com].</p>
          </section>
        </div>
      </div>
    </div>
  )
}