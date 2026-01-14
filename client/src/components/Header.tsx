import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ShoppingBag, Search, User, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onSearchClick: () => void;
}

function getStoreName(): string {
  try {
    const settings = localStorage.getItem('studiodrop_settings');
    if (settings) {
      return JSON.parse(settings).storeName || 'STUDIODROP';
    }
  } catch (e) {
    console.error('Failed to load store name:', e);
  }
  return 'STUDIODROP';
}

export function Header({ cartCount, onCartClick, onSearchClick }: HeaderProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState(getStoreName);
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      setStoreName(event.detail?.storeName || 'STUDIODROP');
    };
    window.addEventListener('storeSettingsUpdated', handleSettingsUpdate as EventListener);
    return () => window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate as EventListener);
  }, []);

  const navLinks = [
    { href: '/', label: 'HOME' },
    { href: '/collections', label: 'COLLECTIONS' },
    { href: '/about', label: 'ABOUT' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" data-testid="link-home">
              <span className="text-display text-xl md:text-2xl font-semibold tracking-tight">
                {storeName}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  <span
                    className={`text-sm tracking-wide link-underline transition-colors ${
                      location === link.href
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={onSearchClick}
                className="p-2 hover:bg-accent transition-colors"
                data-testid="button-search"
                aria-label="Search"
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {!isLoading && (
                isAuthenticated ? (
                  <div className="hidden md:flex items-center gap-2">
                    <Link href="/account">
                      <button
                        className="p-2 hover:bg-accent transition-colors"
                        data-testid="button-account"
                        aria-label="Account"
                      >
                        <User className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="p-2 hover:bg-accent transition-colors"
                      data-testid="button-logout"
                      aria-label="Logout"
                    >
                      <LogOut className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="hidden md:block"
                  >
                    <button
                      className="p-2 hover:bg-accent transition-colors"
                      data-testid="button-login"
                      aria-label="Login"
                    >
                      <LogIn className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </Link>
                )
              )}
              
              <button
                onClick={onCartClick}
                className="p-2 hover:bg-accent transition-colors relative"
                data-testid="button-cart"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 hover:bg-accent transition-colors md:hidden"
                data-testid="button-menu"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background md:hidden"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between mb-16">
                <span className="text-display text-xl font-semibold">{storeName}</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2"
                  data-testid="button-close-menu"
                >
                  <X className="w-6 h-6" strokeWidth={1.5} />
                </button>
              </div>

              <nav className="flex flex-col gap-8">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      data-testid={`link-mobile-${link.label.toLowerCase()}`}
                    >
                      <span className="text-display text-4xl font-medium">{link.label}</span>
                    </Link>
                  </motion.div>
                ))}
                {!isLoading && (isAuthenticated ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="text-display text-4xl font-medium">ACCOUNT</span>
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <button
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="text-display text-4xl font-medium text-muted-foreground"
                        data-testid="button-mobile-logout"
                      >
                        LOGOUT
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="text-display text-4xl font-medium">LOGIN</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto pt-12 border-t border-border">
                <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                  <Link href="/shipping" onClick={() => setMenuOpen(false)}>Shipping & Returns</Link>
                  <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
                  <Link href="/privacy" onClick={() => setMenuOpen(false)}>Privacy Policy</Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
