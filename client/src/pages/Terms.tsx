import { motion } from 'framer-motion';

export function Terms() {
  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24">
      <section className="max-w-[800px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-display text-4xl md:text-5xl font-semibold mb-6">
            TERMS OF SERVICE
          </h1>
          <p className="text-muted-foreground mb-4">
            Last updated: January 2024
          </p>
        </motion.div>

        <div className="prose prose-neutral max-w-none mt-12 space-y-8">
          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using STUDIODROP, you accept and agree to be bound 
              by these Terms of Service. If you do not agree to these terms, 
              please do not use our website or services.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              2. Products and Pricing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All artworks are sold as described on our website. Prices are 
              listed in USD and are subject to change without notice. We reserve 
              the right to modify or discontinue any product at any time.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              While we strive for accuracy, we do not warrant that product 
              descriptions or prices are accurate, complete, or error-free. 
              Colors may appear differently on various screens.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              3. Orders and Payment
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By placing an order, you represent that you are authorized to use 
              the designated payment method. We reserve the right to refuse or 
              cancel any order for any reason, including suspected fraud.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              All payments are processed securely through Stripe. We do not 
              store complete credit card information on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              4. Shipping and Delivery
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We ship worldwide. Delivery times are estimates and not guaranteed. 
              Risk of loss and title for items purchased pass to you upon delivery 
              to the carrier.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              International orders may be subject to import duties and taxes, 
              which are the responsibility of the buyer.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              5. Returns and Refunds
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We accept returns within 14 days of delivery. Items must be returned 
              in original condition and packaging. Return shipping costs are the 
              responsibility of the buyer unless the item arrived damaged or defective.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              6. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on this website, including images, text, and designs, 
              is the property of STUDIODROP and protected by copyright law. 
              Purchase of an artwork grants you ownership of the physical piece 
              but not reproduction rights.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              7. Authenticity Guarantee
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All artworks sold through STUDIODROP are guaranteed authentic. 
              Original paintings and limited editions come with a Certificate 
              of Authenticity signed by the artist.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              STUDIODROP shall not be liable for any indirect, incidental, 
              special, or consequential damages arising from the use of our 
              services or products. Our liability is limited to the purchase 
              price of the product.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              9. Governing Law
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms shall be governed by and construed in accordance with 
              the laws of the State of New York, without regard to its conflict 
              of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-display text-xl font-semibold mb-4">
              10. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@studiodrop.com" className="text-foreground link-underline">
                legal@studiodrop.com
              </a>
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
