import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ArtworkCard } from '@/components/ArtworkCard';
import { DropHero } from '@/components/DropHero';
import { useArtworks, useDrops } from '@/lib/hooks';
import { formatPrice } from '@/lib/mockData';
import { getDropStatus } from '@/lib/dropUtils';

interface HomeProps {
  onAddToCart: (artwork: any) => void;
}

export function Home({ onAddToCart }: HomeProps) {
  const { data: artworks, isLoading: artworksLoading } = useArtworks();
  const { data: drops, isLoading: dropsLoading } = useDrops();

  const featuredDrop = drops?.find(d => {
    if (!d.featured) return false;
    const status = getDropStatus(d);
    return status === 'active' || status === 'scheduled';
  });
  const newWorks = artworks?.filter(a => !a.soldOut).slice(0, 4) || [];
  const featuredArtwork = artworks?.find(a => a.featured) || artworks?.[0];

  if (artworksLoading || dropsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!featuredArtwork && !featuredDrop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No artworks available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {featuredDrop ? (
        <DropHero drop={featuredDrop} artworks={artworks} />
      ) : (
        <section className="relative h-screen flex items-end">
          <div className="absolute inset-0">
            <img
              src={featuredArtwork?.image || ''}
              alt="Featured artwork"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-10 max-w-[1800px] mx-auto px-6 md:px-12 pb-16 md:pb-24 w-full"
          >
            <div className="max-w-2xl">
              <h1 className="text-display text-4xl md:text-6xl lg:text-7xl font-semibold leading-[0.95] mb-4">
                WINTER 2024
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
                New works exploring absence and presence
              </p>
              <Link href="/collections">
                <button
                  className="bg-foreground text-background px-8 py-4 text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center gap-3"
                  data-testid="button-view-collection"
                >
                  VIEW COLLECTIONS
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </section>
      )}

      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-display text-3xl md:text-4xl font-semibold">NEW WORKS</h2>
            <p className="text-muted-foreground mt-2">Latest additions to the collection</p>
          </div>
          <Link href="/collections" className="hidden md:block">
            <span className="text-sm link-underline">View All</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {newWorks.map((artwork, index) => (
            <ArtworkCard key={artwork.id} artwork={artwork} index={index} />
          ))}
        </div>
      </section>

      {featuredArtwork && (
        <section className="bg-card grain">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-24 md:py-32">
            <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={featuredArtwork.image}
                    alt={featuredArtwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col"
              >
                <span className="text-xs tracking-widest text-muted-foreground mb-4">FEATURED</span>
                <h2 className="text-display text-3xl md:text-5xl font-semibold mb-4">
                  {featuredArtwork.title}
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {featuredArtwork.description}
                </p>
                <div className="space-y-2 mb-8">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Medium:</span> {featuredArtwork.medium}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Dimensions:</span>{' '}
                    {featuredArtwork.height} × {featuredArtwork.width} {featuredArtwork.unit}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Year:</span> {featuredArtwork.year}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-display text-2xl font-medium">
                    {formatPrice(featuredArtwork.price)}
                  </span>
                  <button
                    onClick={() => onAddToCart(featuredArtwork)}
                    className="bg-foreground text-background px-6 py-3 text-sm tracking-wide hover:opacity-90 transition-opacity"
                    data-testid={`button-add-to-cart-${featuredArtwork.id}`}
                  >
                    ADD TO CART
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-display text-3xl md:text-5xl font-semibold mb-6">
            ONE ARTIST.<br />ONE VISION.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Every piece in this collection represents a singular artistic journey. 
            No reproductions. No compromises. Each work arrives with a certificate 
            of authenticity and is carefully packaged for safe delivery worldwide.
          </p>
          <Link href="/about">
            <span className="text-sm link-underline">LEARN MORE ABOUT THE ARTIST</span>
          </Link>
        </motion.div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-display text-2xl md:text-3xl font-semibold">150+</p>
              <p className="text-sm text-muted-foreground mt-1">Works Created</p>
            </div>
            <div>
              <p className="text-display text-2xl md:text-3xl font-semibold">47</p>
              <p className="text-sm text-muted-foreground mt-1">Countries Shipped</p>
            </div>
            <div>
              <p className="text-display text-2xl md:text-3xl font-semibold">100%</p>
              <p className="text-sm text-muted-foreground mt-1">Authenticated</p>
            </div>
            <div>
              <p className="text-display text-2xl md:text-3xl font-semibold">2015</p>
              <p className="text-sm text-muted-foreground mt-1">Est.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
