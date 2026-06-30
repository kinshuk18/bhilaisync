"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import NeonButton from "../ui/NeonButton";
import { CafeOrderItem } from "@/lib/firebase";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CafeOrderItem[];
  setCart: React.Dispatch<React.SetStateAction<CafeOrderItem[]>>;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  setCart,
}: CartDrawerProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      const updatedCart = prevCart
        .map((item) => {
          if (item.itemId === itemId) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
      return updatedCart;
    });
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("Please sign in to place an order.");
      return;
    }

    if (cart.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      const response = await fetch("/api/cafe/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: user.uid,
          items: cart,
          totalAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Failed to place order. Please try again."
        );
      }

      alert("Order placed successfully!");
      setCart([]);
      onClose();
    } catch (error) {
      console.error("Failed to place order:", error);
      setOrderError(
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-surface-1/90 backdrop-blur-xl border-l border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Your Cart</h2>
              <button
                onClick={onClose}
                aria-label="Close cart"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-white/50">Your cart is empty.</p>
                  <p className="text-white/30 text-sm mt-1">
                    Add some items from the menu to get started.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li
                      key={item.itemId}
                      className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-sm text-white/50">
                          ₹{item.price.toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.itemId, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-white font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.itemId, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-[#00E5FF]/20 hover:bg-[#00E5FF]/30 text-[#00E5FF] transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-white font-semibold w-16 text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {orderError && (
                <p className="mt-4 text-sm text-red-400 text-center">
                  {orderError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-white/10 bg-black/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/70 text-base">Total Amount</span>
                <span className="text-2xl font-bold text-[#00E5FF]">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
              <NeonButton
                variant="solid-cyan"
                className="w-full py-3"
                onClick={handlePlaceOrder}
                isLoading={isSubmitting}
                loadingLabel="Placing Order..."
                disabled={cart.length === 0}
              >
                Place Order
              </NeonButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}