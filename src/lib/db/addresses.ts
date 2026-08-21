import { prisma } from "@/lib/prisma";

export async function createAddress(data: {
  clerkUserId: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  pincode: string;
}) {
  return prisma.address.create({ data });
}
