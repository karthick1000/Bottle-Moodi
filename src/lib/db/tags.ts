import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

const TAG_SELECT = { id: true, label: true, position: true } as const;

/** Storefront chip order: explicit position first, then creation order. */
const TAG_ORDER = [{ position: "asc" as const }, { id: "asc" as const }];

async function _getAllTags() {
  return prisma.tag.findMany({ select: TAG_SELECT, orderBy: TAG_ORDER });
}

/**
 * Cached tag list for public pages. Invalidated by revalidateTag("tags") on
 * every tag mutation, and by "products" too — a poster's chip is part of the
 * product payload, so a rename has to bust both.
 */
export const getAllTags = unstable_cache(_getAllTags, ["tags-list"], {
  tags: ["tags"],
});

/** Uncached read — the admin console must always see what it just saved. */
export async function getAllTagsUncached() {
  return _getAllTags();
}

function bust() {
  revalidateTag("tags");
  // Products embed their tag's label, so their cache is stale too.
  revalidateTag("products");
}

export async function createTag(label: string) {
  // Append to the end of the chip row rather than colliding on position 0.
  const last = await prisma.tag.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const tag = await prisma.tag.create({
    data: { label, position: (last?.position ?? -1) + 1 },
    select: TAG_SELECT,
  });
  bust();
  return tag;
}

export async function updateTag(
  id: number,
  data: Partial<{ label: string; position: number }>
) {
  const tag = await prisma.tag.update({ where: { id }, data, select: TAG_SELECT });
  bust();
  return tag;
}

/**
 * Delete a tag. Posters carrying it are untagged (the FK is ON DELETE SET
 * NULL), never deleted — losing a chip must not lose the catalogue.
 */
export async function deleteTag(id: number): Promise<void> {
  await prisma.tag.delete({ where: { id } });
  bust();
}

/** How many posters carry this tag — shown before an admin deletes it. */
export async function countProductsWithTag(id: number): Promise<number> {
  return prisma.product.count({ where: { tagId: id } });
}
