import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Truck, Shield, Package } from 'lucide-react';
import { formatPrice } from '@/lib/mockData';
import { useArtwork, useArtworks } from '@/lib/hooks';
import { ArtworkCard } from '@/components/ArtworkCard';

interface ArtworkDetailProps {
  onAddToCart: (artwork: any) => void;
}

export function ArtworkDetail({ onAddToCart }: ArtworkDetailProps) {
  const { id } = useParams<{ id: string }>();
  const { data: artwork, isLoading } = useArtwork(id);
  const { data: allArtworks } = useArtworks();
  const [addedToCart, setAddedToCart] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-display text-2xl mb-4">Artwork not found</h1>
          <Link href="/collections">
            <span className="link-underline">Back to Collections</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    onAddToCart(artwork);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const relatedWorks = (allArtworks || [])
    .filter((a) => a.id !== artwork.id && !a.soldOut)
    .slice(0, 4);

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-8">
        <Link href="/collections">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </span>
        </Link>
      </div>

      <section className="max-w-[1800px] mx-auto px-6 md:px-12 pb-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="aspect-[3/4] bg-muted overflow-hidden"
          >
            <img
              src={artwork.image}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs tracking-widest text-muted-foreground uppercase">
                {artwork.type === 'original' ? 'Original' : artwork.type === 'limited' ? 'Limited Edition' : 'Open Edition'}
              </span>
              {artwork.soldOut && (
                <span className="text-xs tracking-widest bg-muted px-2 py-1">SOLD</span>
              )}
            </div>

            <h1 className="text-display text-3xl md:text-5xl font-semibold mb-2">
              {artwork.title}
            </h1>
            <p className="text-muted-foreground mb-8">{artwork.year}</p>

            <p className="text-lg leading-relaxed mb-8">{artwork.description}</p>

            <div className="grid grid-cols-2 gap-6 mb-8 py-8 border-t border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Medium</p>
                <p className="text-sm">{artwork.medium}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Surface</p>
                <p className="text-sm">{artwork.surface}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Dimensions</p>
                <p className="text-sm">
                  {artwork.height} × {artwork.width}
                  {artwork.depth && ` × ${artwork.depth}`} {artwork.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Framing</p>
                <p className="text-sm">
                  {artwork.framed ? artwork.frameDetails || 'Framed' : 'Unframed'}
                </p>
              </div>
              {artwork.type === 'limited' && artwork.editionSize && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Edition</p>
                  <p className="text-sm">
                    {artwork.editionRemaining} of {artwork.editionSize} remaining
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {artwork.styleTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs border border-border px-3 py-1.5"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-display text-3xl font-semibold">
                {formatPrice(artwork.price)}
              </span>
              {artwork.compareAtPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(artwork.compareAtPrice)}
                </span>
              )}
            </div>

            {artwork.soldOut ? (
              <button
                className="w-full bg-muted text-muted-foreground py-4 text-sm tracking-wide cursor-not-allowed mb-6"
                disabled
              >
                SOLD OUT
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className={`w-full py-4 text-sm tracking-wide transition-all mb-6 flex items-center justify-center gap-2 ${
                  addedToCart
                    ? 'bg-green-900 text-white'
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
                data-testid={`button-add-to-cart-${artwork.id}`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    ADDED TO CART
                  </>
                ) : (
                  'ADD TO CART'
                )}
              </button>
            )}

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-muted-foreground">Worldwide delivery, fully insured</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Certificate of Authenticity</p>
                  <p className="text-muted-foreground">Signed and numbered by the artist</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Museum-Quality Packaging</p>
                  <p className="text-muted-foreground">Custom crating for safe delivery</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {relatedWorks.length > 0 && (
        <section className="border-t border-border">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-24">
            <h2 className="text-display text-2xl md:text-3xl font-semibold mb-12">
              YOU MAY ALSO LIKE
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {relatedWorks.map((work, index) => (
                <ArtworkCard key={work.id} artwork={work} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
