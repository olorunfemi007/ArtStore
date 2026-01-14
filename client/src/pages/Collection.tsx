import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, ChevronDown } from 'lucide-react';
import { ArtworkCard } from '@/components/ArtworkCard';
import { useArtworks } from '@/lib/hooks';

type SortOption = 'newest' | 'price-asc' | 'price-desc';
type FilterType = 'all' | 'original' | 'limited' | 'open';

export function Collection() {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: artworks, isLoading } = useArtworks();

  const filteredArtworks = useMemo(() => {
    if (!artworks) return [];
    
    return artworks
      .filter((a) => filterType === 'all' || a.type === filterType)
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          default:
            return b.year - a.year;
        }
      });
  }, [artworks, filterType, sortBy]);

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-display text-4xl md:text-6xl font-semibold mb-4">
            COLLECTION
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Explore the complete body of work. From original paintings to limited edition prints, 
            each piece carries its own story.
          </p>
        </motion.div>
      </section>

      <section className="border-t border-b border-border sticky top-16 md:top-20 bg-background z-40">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm hover:text-muted-foreground transition-colors"
                data-testid="button-toggle-filters"
              >
                <Filter className="w-4 h-4" />
                FILTER
              </button>
              <span className="text-muted-foreground text-sm ml-4">
                {filteredArtworks.length} {filteredArtworks.length === 1 ? 'work' : 'works'}
              </span>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-transparent text-sm pr-6 cursor-pointer focus:outline-none"
                data-testid="select-sort"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border py-4"
            >
              <div className="flex flex-wrap gap-2">
                {(['all', 'original', 'limited', 'open'] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      filterType === type
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:border-foreground'
                    }`}
                    data-testid={`button-filter-${type}`}
                  >
                    {type === 'all' ? 'ALL' : type === 'original' ? 'ORIGINALS' : type === 'limited' ? 'LIMITED PRINTS' : 'OPEN EDITIONS'}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-12 md:py-16">
        {isLoading ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">Loading collection...</p>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">No works match your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredArtworks.map((artwork, index) => (
              <ArtworkCard key={artwork.id} artwork={artwork} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
