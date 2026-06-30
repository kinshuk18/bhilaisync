"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { db, COLLECTIONS, CafeMenuItemDocument, CafeOrderItem } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import CartDrawer from "@/components/cafe/CartDrawer";

export default function CafePage() {
  const [menuItems, setMenuItems] = useState<CafeMenuItemDocument[]>([]);
  const [cart, setCart] = useState<CafeOrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const snapshot = await getDocs(collection(db, COLLECTIONS.CAFE_MENU));
        const items: CafeMenuItemDocument[] = snapshot.docs.map(
          (doc) => doc.data() as CafeMenuItemDocument
        );
        setMenuItems(items);
      } catch (error) {
        console.error("Failed to fetch cafe menu:", error);
        setFetchError("Unable to load the menu right now. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const groupedMenu = useMemo(() => {
    const groups: Record<string, CafeMenuItemDocument[]> = {};
    for (const item of menuItems) {
      const category = item.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    }
    return groups;
  }, [menuItems]);

  const cartTotals = useMemo(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    return { totalItems, totalPrice };
  }, [cart]);

  const addToCart = (item: CafeMenuItemDocument) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (cartItem) => cartItem.itemId === item.itemId
      );

      if (existingIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + 1,
        };
        return updatedCart;
      }

      const newCartItem: CafeOrderItem = {
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: 1,
      };
      return [...prevCart, newCartItem];
    });
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
            Smart Tech Café
          </h1>
          <p className="text-base md:text-lg text-white/70 leading-relaxed">
            Skip the line, not the coffee. Browse the menu, order ahead, and
            pick up your food the moment it&apos;s ready — no waiting required.
          </p>
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
      {!loading && !fetchError && menuItems.length === 0 && (
        <div className="px-6 md:px-12">
          <GlassCard variant="default" className="p-8 text-center">
            <p className="text-white/70">
              The café menu is empty right now. Check back soon!
            </p>
          </GlassCard>
        </div>
      )}

      {/* Menu Grid */}
      {!loading && !fetchError && menuItems.length > 0 && (
        <div className="px-6 md:px-12 space-y-12">
          {Object.entries(groupedMenu).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-2xl font-semibold text-white mb-5">
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {items.map((item) => (
                  <GlassCard
                    key={item.itemId}
                    variant="default"
                    hoverable
                    className="p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          {item.name}
                        </h3>
                        {!item.isAvailable && (
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/50 whitespace-nowrap">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/60 mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-5">
                      <span className="text-xl font-bold text-[#00E5FF]">
                        ₹{item.price.toFixed(2)}
                      </span>
                      <NeonButton
                        variant="cyan"
                        className="px-4 py-2 text-sm"
                        onClick={() => addToCart(item)}
                        isLoading={false}
                        disabled={!item.isAvailable}
                      >
                        Add to Cart
                      </NeonButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Floating View Cart Button */}
      <AnimatePresence>
        {cartTotals.totalItems > 0 && !isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] md:w-auto"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="glass-panel-cyan w-full md:w-auto flex items-center justify-between md:justify-start gap-6 px-6 py-4 rounded-2xl shadow-lg shadow-[#00E5FF]/10"
            >
              <span className="flex items-center gap-2 text-white font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00E5FF] text-black text-xs font-bold">
                  {cartTotals.totalItems}
                </span>
                View Cart
              </span>
              <span className="text-[#00E5FF] font-bold">
                ₹{cartTotals.totalPrice.toFixed(2)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
      />
    </div>
  );
}