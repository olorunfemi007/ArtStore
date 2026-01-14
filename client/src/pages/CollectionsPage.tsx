import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useCollections, useCollectionArtworks } from '@/lib/hooks';
import type { Collection } from '@shared/schema';

function CollectionCard({ collection, index }: { collection: Collection; index: number }) {
  const { data: artworks } = useCollectionArtworks(collection.id);
  const artworkCount = artworks?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link href={`/collection/${collection.slug}`}>
        <a className="group block" data-testid={`card-collection-${collection.slug}`}>
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-16 md:w-24 md:h-20 group-hover:scale-105 transition-transform duration-200">
              <div 
                className="absolute top-0 left-[10%] right-[10%] h-[15%] rounded-t-sm"
                style={{
                  background: 'linear-gradient(180deg, #7ab8f5 0%, #5ba3e8 100%)',
                }}
              />
              <div 
                className="absolute top-[10%] inset-x-0 bottom-0 rounded-sm shadow-md"
                style={{
                  background: 'linear-gradient(180deg, #5ba3e8 0%, #4a93d8 50%, #3d82c7 100%)',
                }}
              />
              <div 
                className="absolute top-[15%] left-[5%] right-[5%] h-[2px] rounded-full opacity-40"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, #fff 50%, transparent 100%)',
                }}
              />
            </div>
            
            <div className="mt-2 text-center">
              <h3 className="text-display text-xs md:text-sm font-medium tracking-tight text-foreground group-hover:text-muted-foreground transition-colors truncate max-w-[100px] md:max-w-[120px]">
                {collection.name}
              </h3>
              <p className="text-muted-foreground text-[10px] mt-0.5">
                {artworkCount} {artworkCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        </a>
      </Link>
    </motion.div>
  );
}

export function CollectionsPage() {
  const { data: collections, isLoading: collectionsLoading } = useCollections();

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-display text-4xl md:text-6xl font-semibold mb-4">
            COLLECTIONS
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Curated groups of works exploring different themes, styles, and stories.
          </p>
        </motion.div>
      </section>

      <section className="max-w-[1800px] mx-auto px-6 md:px-12 py-12 md:py-16">
        {collectionsLoading ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">Loading collections...</p>
          </div>
        ) : !collections || collections.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">No collections yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {collections.map((collection, index) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                index={index}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
