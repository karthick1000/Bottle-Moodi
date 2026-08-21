import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  { slug: "meter-podu",         title: "Meter Podu",           tamil: "மீட்டர் போடு",          tag: "SIGNBOARD", base: 499, sub: "For the auto ride you already lost." },
  { slug: "filter-coffee-only", title: "Filter Coffee Only",   tamil: "டிகிரி காபி",            tag: "OORU",      base: 599, sub: "A morning position, stated firmly." },
  { slug: "rendu-minute",       title: "Rendu Minute",         tamil: "ரெண்டு நிமிஷம்",         tag: "SLANG",     base: 399, sub: "The most elastic unit of Tamil time." },
  { slug: "vetti-time",         title: "Vetti Time",           tamil: "வெட்டி நேரம்",           tag: "SLANG",     base: 449, sub: "Doing nothing, professionally." },
  { slug: "bus-stand-blues",    title: "Bus Stand Blues",      tamil: "நிற்கும் இடம்",           tag: "NOSTALGIA", base: 699, sub: "Blue paint, red dust, one late bus." },
  { slug: "kadalai-podu",       title: "Kadalai Podu",         tamil: "கடலை போடு",             tag: "SLANG",     base: 449, sub: "Flirting, as described by peanuts." },
  { slug: "semma-scene",        title: "Semma Scene",          tamil: "செம்ம சீன்",              tag: "OORU",      base: 549, sub: "Said about anything, means everything." },
  { slug: "sapten-thoongiten",  title: "Sapten Thoongiten",    tamil: "சாப்டேன் தூங்கிட்டேன்",  tag: "NOSTALGIA", base: 599, sub: "A full life summarised in two verbs." },
  { slug: "ille-ille",          title: "Ille Ille",            tamil: "இல்லை இல்லை",            tag: "SIGNBOARD", base: 399, sub: "Denial, printed twice for emphasis." },
];

async function main() {
  console.log("Seeding products…");
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`Done — ${products.length} products seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
