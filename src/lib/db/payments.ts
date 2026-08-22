import { prisma } from "@/lib/prisma";

export async function createPayment({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  amountPaise,
  currency = "INR",
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amountPaise: number;
  currency?: string;
}) {
  return prisma.payment.create({
    data: { razorpayOrderId, razorpayPaymentId, razorpaySignature, amountPaise, currency },
  });
}
