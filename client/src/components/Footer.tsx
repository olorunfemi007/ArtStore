import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-2">
            <h3 className="text-display text-2xl md:text-3xl font-semibold mb-4">
              STUDIODROP
            </h3>
            <p className="text-muted-foreground max-w-md leading-relaxed">
              Limited edition paintings and prints from a single vision. 
              Each piece is a meditation on form, space, and the traces we leave behind.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-6 tracking-wide">NAVIGATE</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/collections" className="text-muted-foreground hover:text-foreground transition-colors">
                Collections
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-6 tracking-wide">SUPPORT</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">
                Shipping & Returns
              </Link>
              <Link href="/authenticity" className="text-muted-foreground hover:text-foreground transition-colors">
                Authenticity
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} STUDIODROP. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
            <a href="#" className="hover:text-foreground transition-colors">Newsletter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
