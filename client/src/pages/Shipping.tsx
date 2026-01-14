import { motion } from 'framer-motion';
import { Truck, Package, Shield, Clock, Globe, ArrowRight } from 'lucide-react';

export function Shipping() {
  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24">
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <h1 className="text-display text-4xl md:text-5xl font-semibold mb-6">
            SHIPPING & RETURNS
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We take extraordinary care to ensure your artwork arrives safely. 
            Each piece is professionally packed and fully insured.
          </p>
        </motion.div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Truck className="w-8 h-8 mx-auto mb-4" />
              <h3 className="text-display text-lg font-semibold mb-2">FREE SHIPPING</h3>
              <p className="text-muted-foreground text-sm">
                Complimentary shipping on all orders over $5,000
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <Shield className="w-8 h-8 mx-auto mb-4" />
              <h3 className="text-display text-lg font-semibold mb-2">FULLY INSURED</h3>
              <p className="text-muted-foreground text-sm">
                Every shipment is insured for full value
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Globe className="w-8 h-8 mx-auto mb-4" />
              <h3 className="text-display text-lg font-semibold mb-2">WORLDWIDE</h3>
              <p className="text-muted-foreground text-sm">
                We ship to over 100 countries
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-card grain">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <h2 className="text-display text-2xl md:text-3xl font-semibold mb-12">
            SHIPPING RATES & TIMES
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 pr-8 text-sm font-medium">Region</th>
                  <th className="pb-4 pr-8 text-sm font-medium">Standard</th>
                  <th className="pb-4 pr-8 text-sm font-medium">Express</th>
                  <th className="pb-4 text-sm font-medium">Estimated Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-border">
                  <td className="py-4 pr-8">United States</td>
                  <td className="py-4 pr-8">$75</td>
                  <td className="py-4 pr-8">$150</td>
                  <td className="py-4 text-muted-foreground">3-7 business days</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 pr-8">Canada</td>
                  <td className="py-4 pr-8">$100</td>
                  <td className="py-4 pr-8">$200</td>
                  <td className="py-4 text-muted-foreground">5-10 business days</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 pr-8">Europe</td>
                  <td className="py-4 pr-8">$150</td>
                  <td className="py-4 pr-8">$300</td>
                  <td className="py-4 text-muted-foreground">7-14 business days</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 pr-8">Asia Pacific</td>
                  <td className="py-4 pr-8">$200</td>
                  <td className="py-4 pr-8">$400</td>
                  <td className="py-4 text-muted-foreground">10-21 business days</td>
                </tr>
                <tr>
                  <td className="py-4 pr-8">Rest of World</td>
                  <td className="py-4 pr-8">$250</td>
                  <td className="py-4 pr-8">Contact us</td>
                  <td className="py-4 text-muted-foreground">14-28 business days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            * Oversized artworks may require special shipping arrangements. 
            We will contact you if additional charges apply.
          </p>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <h2 className="text-display text-2xl md:text-3xl font-semibold mb-12">
          PACKAGING
        </h2>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <Package className="w-8 h-8 mb-4" />
            <h3 className="text-display text-lg font-semibold mb-4">
              Museum-Quality Crating
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Original paintings are professionally crated using museum-standard 
              materials. Each crate is custom-built to the exact dimensions of 
              the artwork, with internal padding and climate protection.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                Acid-free tissue and glassine wrapping
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                Foam corner protectors
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                Sturdy wooden crate construction
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                Fragile and orientation labels
              </li>
            </ul>
          </div>

          <div>
            <Clock className="w-8 h-8 mb-4" />
            <h3 className="text-display text-lg font-semibold mb-4">
              Processing Time
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Due to the care required in packaging fine art, please allow 
              3-5 business days for order processing before shipping.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                Prints: 2-3 business days
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                Original paintings: 3-5 business days
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-3 h-3" />
                Large/oversized works: 5-7 business days
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
          <h2 className="text-display text-2xl md:text-3xl font-semibold mb-12">
            RETURNS & EXCHANGES
          </h2>

          <div className="max-w-3xl space-y-8">
            <div>
              <h3 className="text-display font-semibold mb-3">14-Day Return Policy</h3>
              <p className="text-muted-foreground leading-relaxed">
                We want you to be completely satisfied with your purchase. If for 
                any reason you are not, you may return the artwork within 14 days 
                of delivery for a full refund of the purchase price.
              </p>
            </div>

            <div>
              <h3 className="text-display font-semibold mb-3">Return Conditions</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Artwork must be in original condition</li>
                <li>• Original packaging must be used for return shipping</li>
                <li>• Return shipping costs are the responsibility of the buyer</li>
                <li>• Refund will be processed within 5-7 business days of receipt</li>
              </ul>
            </div>

            <div>
              <h3 className="text-display font-semibold mb-3">Damaged Items</h3>
              <p className="text-muted-foreground leading-relaxed">
                In the rare event that your artwork arrives damaged, please contact 
                us within 48 hours of delivery with photos of the damage. We will 
                arrange for a replacement or full refund including shipping costs.
              </p>
            </div>

            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                For questions about shipping or returns, please contact us at{' '}
                <a href="mailto:hello@studiodrop.com" className="text-foreground link-underline">
                  hello@studiodrop.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
