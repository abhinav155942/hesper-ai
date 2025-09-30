import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Hesper AI',
  description: 'Privacy Policy for Hesper AI Assistant'
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Hesper Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: September 26, 2025</p>
        </header>
        <div className="prose prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary max-w-none">
          <section>
            <h2>Introduction</h2>
            <p>This Privacy Policy explains how Hesper AI ("Hesper", "we", "us") collects, uses, and protects your information when you use our AI assistant service. We are committed to protecting your privacy.</p>
          </section>

          <section>
            <h2>Information We Collect</h2>
            <p>We collect: (i) Personal Information (e.g., email, name during registration); (ii) Usage Data (e.g., interactions with the AI); (iii) Device Information (e.g., IP address, browser type). We do not collect sensitive personal data unless necessary.</p>
          </section>

          <section>
            <h2>How We Use Information</h2>
            <p>We use your information to: (i) Provide and improve the service; (ii) Communicate with you; (iii) Analyze usage; (iv) Comply with legal obligations. We do not sell your personal data.</p>
          </section>

          <section>
            <h2>Sharing Information</h2>
            <p>We may share information with: (i) Service providers (e.g., hosting, analytics); (ii) Legal authorities if required; (iii) In business transfers. We do not share with third parties for marketing without consent.</p>
          </section>

          <section>
            <h2>Cookies and Tracking</h2>
            <p>We use cookies for functionality and analytics. You can manage preferences in your browser settings.</p>
          </section>

          <section>
            <h2>Data Security</h2>
            <p>We implement reasonable security measures to protect your data, but no system is completely secure.</p>
          </section>

          <section>
            <h2>Your Rights</h2>
            <p>You may access, update, or delete your data by contacting us. Depending on your location, you may have rights under GDPR or CCPA.</p>
          </section>

          <section>
            <h2>Children's Privacy</h2>
            <p>Hesper is not intended for children under 13. We do not knowingly collect their data.</p>
          </section>

          <section>
            <h2>Changes to Policy</h2>
            <p>We may update this policy. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>For privacy concerns, contact us at [your-email@example.com].</p>
          </section>
        </div>
      </div>
    </div>
  )
}