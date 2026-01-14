import { useState, useMemo } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { ArtworkCard } from '@/components/ArtworkCard';
import { useCollection, useCollectionArtworks } from '@/lib/hooks';

type SortOption = 'default' | 'price-asc' | 'price-desc';

export function CollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const { data: collection, isLoading: collectionLoading } = useCollection(slug);
  const { data: artworks, isLoading: artworksLoading } = useCollectionArtworks(slug);

  const isLoading = collectionLoading || artworksLoading;

  const sortedArtworks = useMemo(() => {
    if (!artworks) return [];
    
    return [...artworks].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [artworks, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">Loading collection...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Collection not found</p>
        <Link href="/collections">
          <a className="text-sm underline hover:text-muted-foreground" data-testid="link-back-collections">
            Back to collections
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {collection.heroImage && (
        <section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
          <img
            src={collection.heroImage}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </section>
      )}

      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/collections">
            <a className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6" data-testid="link-back-collections">
              <ChevronLeft className="w-4 h-4" />
              ALL COLLECTIONS
            </a>
          </Link>
          
          <h1 className="text-display text-4xl md:text-6xl font-semibold mb-4">
            {collection.name.toUpperCase()}
          </h1>
          
          {collection.description && (
            <p className="text-muted-foreground text-lg max-w-2xl">
              {collection.description}
            </p>
          )}
        </motion.div>
      </section>

      <section className="border-t border-b border-border sticky top-16 md:top-20 bg-background z-40">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between py-4">
            <span className="text-muted-foreground text-sm">
              {sortedArtworks.length} {sortedArtworks.length === 1 ? 'work' : 'works'}
            </span>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-transparent text-sm pr-6 cursor-pointer focus:outline-none"
                data-testid="select-sort"
              >
                <option value="default">Collection Order</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-12 md:py-16">
        {sortedArtworks.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">No works in this collection yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {sortedArtworks.map((artwork, index) => (
              <ArtworkCard key={artwork.id} artwork={artwork} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
