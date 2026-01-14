import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export function OrderConfirmation() {
  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-6 text-center"
      >
        <div className="flex justify-center mb-8">
          <CheckCircle className="w-16 h-16 text-foreground" strokeWidth={1} />
        </div>

        <h1 className="text-display text-3xl md:text-4xl font-semibold mb-4">
          ORDER CONFIRMED
        </h1>

        <p className="text-muted-foreground mb-8">
          Thank you for your purchase. You will receive an email confirmation shortly with your order details and tracking information.
        </p>

        <div className="border border-border p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">WHAT'S NEXT?</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>• Order confirmation email sent</li>
            <li>• We'll carefully prepare your artwork for shipping</li>
            <li>• Tracking details sent when shipped</li>
            <li>• Estimated delivery within 5-7 business days</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account">
            <span className="inline-flex items-center gap-2 border border-foreground px-6 py-3 text-sm tracking-wide hover:bg-foreground hover:text-background transition-colors" data-testid="link-view-orders">
              VIEW MY ORDERS
            </span>
          </Link>
          <Link href="/collections">
            <span className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm tracking-wide hover:opacity-90 transition-opacity" data-testid="link-continue-shopping">
              CONTINUE SHOPPING
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
