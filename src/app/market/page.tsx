"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { db, COLLECTIONS, MarketplaceListingDocument } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export default function MarketPage() {
  const [listings, setListings] = useState<MarketplaceListingDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const listingsQuery = query(
          collection(db, COLLECTIONS.marketplace_listings),
          where("status", "==", "active"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(listingsQuery);
        const items: MarketplaceListingDocument[] = snapshot.docs.map(
          (doc) => doc.data() as MarketplaceListingDocument
        );
        setListings(items);
      } catch (error) {
        console.error("Failed to fetch marketplace listings:", error);
        setFetchError("Unable to load listings right now. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const conditionBadgeClass = (condition: string) => {
    const normalized = condition?.toLowerCase() || "";
    if (normalized === "new" || normalized === "like new") {
      return "badge badge-cyan";
    }
    return "badge badge-purple";
  };

  return (
    <div className="relative min-h-screen pb-32">
      {/* Hero Header */}
      <section className="px-6 pt-12 pb-8 md:px-12 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-brand mb-4">
            Campus Marketplace
          </h1>
          <p className="text-base md:text-lg text-white/70 leading-relaxed mb-6">
            Secure peer-to-peer trading for verified IIT Bhilai students.
          </p>
          <Link href="/market/create">
            <NeonButton variant="solid-cyan" className="px-6 py-3">
              Sell an Item
            </NeonButton>
          </Link>
        </motion.div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-[#00E5FF]/30 border-t-[#00E5FF]"
          />
        </div>
      )}

      {/* Error State */}
      {!loading && fetchError && (
        <div className="px-6 md:px-12">
          <GlassCard variant="default" className="p-6 text-center">
            <p className="text-white/70">{fetchError}</p>
          </GlassCard>
        </div>
      )}

      {/* Empty State */}
      {!loading && !fetchError && listings.length === 0 && (
        <div className="px-6 md:px-12">
          <GlassCard variant="elevated" className="p-10 text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-2">
              No listings yet
            </h3>
            <p className="text-white/60 mb-6">
              Be the first to list an item and kickstart the campus marketplace.
            </p>
            <Link href="/market/create">
              <NeonButton variant="cyan" className="px-6 py-3">
                Create the First Listing
              </NeonButton>
            </Link>
          </GlassCard>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && !fetchError && listings.length > 0 && (
        <div className="px-6 md:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {listings.map((listing) => (
                <motion.div
                  key={listing.listingId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <GlassCard
                    variant="default"
                    hoverable
                    className="overflow-hidden flex flex-col h-full"
                  >
                    <div className="w-full h-44 -mx-5 -mt-5 mb-4 overflow-hidden">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#7C3AED]/40 via-[#00E5FF]/20 to-transparent flex items-center justify-center">
                          <span className="text-white/40 text-sm">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2 px-1">
                      <h3 className="text-lg font-semibold text-white leading-snug">
                        {listing.title}
                      </h3>
                      <span className={conditionBadgeClass(listing.condition)}>
                        {listing.condition}
                      </span>
                    </div>

                    {listing.aiSummary && (
                      <p className="text-sm text-white/60 italic mt-2 px-1 leading-relaxed line-clamp-3">
                        {listing.aiSummary}
                      </p>
                    )}

                    <div className="mt-auto pt-4 px-1">
                      <span className="text-xl font-bold text-[#00E5FF]">
                        ₹{listing.price.toFixed(2)}
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
