import { NextResponse } from "next/server";

import { updateReservation, getReservationById } from "@/db/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, reservationId, status } = body;
    const targetId = bookingId || reservationId;

    if (!targetId) {
      return NextResponse.json({ error: "Missing bookingId or reservationId" }, { status: 400 });
    }

    const reservation = await getReservationById({ id: targetId });
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Update reservation hasCompletedPayment status
    const isSuccess = status === "succeeded" || status === "paid" || status === undefined; // default to true if mock webhook
    await updateReservation({
      id: targetId,
      hasCompletedPayment: isSuccess,
    });

    console.log(`[WEBHOOK SUCCESS] Payment processed for reservation/booking: ${targetId}`);

    return NextResponse.json({ success: true, message: "Payment status updated successfully" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
