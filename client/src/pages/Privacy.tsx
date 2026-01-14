import { motion } from 'framer-motion';

export function Privacy() {
  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24">
      <section className="max-w-[800px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-display text-4xl md:text-5xl font-semibold mb-6">
            PRIVACY POLICY
          </h1>
          <p className="text-muted-foreground mb-4">
            Last updated: January 2024
          </p>
        </motion.div>

        <div className="prose prose-neutral max-w-none mt-12 space-y-8">
          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly to us, such as when 
              you create an account, make a purchase, subscribe to our newsletter, 
              or contact us for support.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              This information may include:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Name and contact information</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Order history and preferences</li>
              <li>Communications with our team</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Notify you about new drops and collections</li>
              <li>Improve our website and services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              3. Information Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or rent your personal information to third 
              parties. We may share your information with:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Payment processors (Stripe) to complete transactions</li>
              <li>Shipping carriers to deliver your orders</li>
              <li>Service providers who assist in our operations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              4. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate security measures to protect your personal 
              information. All payment information is encrypted and processed 
              securely through Stripe. We never store your complete credit card 
              details on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              5. Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity 
              on our website and hold certain information. Cookies are used to 
              maintain your shopping cart, remember your preferences, and analyze 
              site traffic.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              6. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              7. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@studiodrop.com" className="text-foreground link-underline">
                privacy@studiodrop.com
              </a>
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
