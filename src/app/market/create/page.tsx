"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const CONDITIONS = ["New", "Like New", "Good", "Fair"] as const;

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [condition, setCondition] = useState<string>("Good");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-[#00E5FF]/30 border-t-[#00E5FF]"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <GlassCard variant="elevated" className="p-10 text-center max-w-md">
          <h2 className="text-xl font-semibold text-white mb-2">
            Sign in required
          </h2>
          <p className="text-white/60 mb-6">
            Please sign in with your @iitbhilai.ac.in account to list an item
            for sale.
          </p>
          <Link href="/market">
            <NeonButton variant="cyan" className="px-6 py-3">
              Back to Market
            </NeonButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !price) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let aiSummary = "";

      try {
        const summarizeResponse = await fetch("/api/market/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description }),
        });

        if (summarizeResponse.ok) {
          const summarizeData = await summarizeResponse.json();
          aiSummary = summarizeData.aiSummary || "";
        }
      } catch (summaryError) {
        console.error("Failed to generate AI summary:", summaryError);
      }

      await addDoc(collection(db, "marketplace_listings"), {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        condition,
        imageUrl: imageUrl.trim(),
        aiSummary,
        status: "active",
        sellerId: user.uid,
        createdAt: serverTimestamp(),
      });

      router.push("/market");
    } catch (error) {
      console.error("Failed to create listing:", error);
      setSubmitError("Failed to create listing. Please try again.");
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "bg-white/5 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all w-full mb-4";

  return (
    <div className="min-h-screen px-6 py-12 md:px-12 md:py-16">
      <Link
        href="/market"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
      >
        <span>&larr;</span>
        <span>Back to Market</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gradient-brand mb-2">
          Sell an Item
        </h1>
        <p className="text-white/60 mb-8">
          List your item for fellow IIT Bhilai students to discover.
        </p>

        <GlassCard variant="elevated" className="p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-white/70 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Casio FX-991ES Calculator"
              className={inputClassName}
              required
            />

            <label className="block text-sm text-white/70 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item's condition, usage, and any included accessories..."
              rows={4}
              className={inputClassName}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500"
                  min="0"
                  step="0.01"
                  className={inputClassName}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={inputClassName}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c} className="bg-black">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="block text-sm text-white/70 mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={inputClassName}
            />

            {submitError && (
              <p className="text-sm text-red-400 mb-4 text-center">
                {submitError}
              </p>
            )}

            <NeonButton
              variant="solid-cyan"
              className="w-full py-3 mt-2"
              isLoading={isSubmitting}
              loadingLabel="Creating Listing..."
            >
              Post Item
            </NeonButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
