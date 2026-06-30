import { NextRequest, NextResponse } from "next/server";
import { adminDb, generateFirestoreId } from "@/lib/firebase-admin";
import { COLLECTIONS, CafeOrderDocument } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, items, totalAmount } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { success: false, message: "studentId is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "items must be a non-empty array." },
        { status: 400 }
      );
    }

    if (typeof totalAmount !== "number" || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "totalAmount must be a positive number." },
        { status: 400 }
      );
    }

    const orderId = generateFirestoreId();

    const orderDocument: CafeOrderDocument = {
      orderId,
      studentId,
      items,
      totalAmount,
      status: "pending",
      scheduledPickup: "ASAP",
      createdAt: Date.now(),
    };

    await adminDb
      .collection(COLLECTIONS.CAFE_ORDERS)
      .doc(orderId)
      .set(orderDocument);

    return NextResponse.json({ success: true, orderId }, { status: 200 });
  } catch (error) {
    console.error("Failed to place cafe order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to place order. Please try again." },
      { status: 500 }
    );
  }
}