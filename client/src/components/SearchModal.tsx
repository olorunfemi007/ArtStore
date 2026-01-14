import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Link } from 'wouter';
import { artworks, formatPrice } from '@/lib/mockData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length > 1
    ? artworks.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.medium.toLowerCase().includes(query.toLowerCase()) ||
          a.styleTags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm"
        >
          <div className="max-w-3xl mx-auto px-6 py-24">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-display text-2xl font-medium">SEARCH</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent transition-colors"
                data-testid="button-close-search"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>

            <div className="relative mb-12">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artworks, mediums, styles..."
                className="w-full bg-transparent border-b-2 border-border focus:border-foreground pl-10 pb-4 text-2xl outline-none transition-colors placeholder:text-muted-foreground"
                data-testid="input-search"
              />
            </div>

            {query.length > 1 && (
              <div>
                <p className="text-sm text-muted-foreground mb-6">
                  {results.length} {results.length === 1 ? 'result' : 'results'}
                </p>

                {results.length > 0 ? (
                  <div className="space-y-6">
                    {results.map((artwork) => (
                      <Link
                        key={artwork.id}
                        href={`/artwork/${artwork.id}`}
                        onClick={onClose}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-6 p-4 hover:bg-accent transition-colors cursor-pointer"
                          data-testid={`search-result-${artwork.id}`}
                        >
                          <div className="w-20 h-24 bg-muted overflow-hidden flex-shrink-0">
                            <img
                              src={artwork.image}
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-display font-medium">{artwork.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {artwork.medium}, {artwork.year}
                            </p>
                            <p className="text-sm mt-2">{formatPrice(artwork.price)}</p>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No artworks found</p>
                )}
              </div>
            )}

            {query.length === 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">POPULAR SEARCHES</p>
                <div className="flex flex-wrap gap-2">
                  {['Abstract', 'Minimalist', 'Oil', 'Limited Edition', 'Large Scale'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 border border-border hover:bg-accent transition-colors text-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
