import { prisma } from "@/lib/prisma";

export async function subscribeEmail(
  email: string
): Promise<{ alreadySubscribed: boolean }> {
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) return { alreadySubscribed: true };

  await prisma.newsletterSubscriber.create({ data: { email } });
  return { alreadySubscribed: false };
}

export async function getSubscribers() {
  return prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
}
