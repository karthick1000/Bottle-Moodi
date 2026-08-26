import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SHIPPING_DEFAULTS, type ShippingRule } from "@/lib/data";

/** Editable homepage content. Defaults are used until the admin saves. */
export const SETTING_DEFAULTS = {
  tagline:        "Bottle Moodi — Mood-க்கு ஏத்த Design",
  headline:       "NORMAL IS NOT OUR SIZE",
  strip:          "NOW SHOWING · POSTERS · CHENNAI",
  studioPhotoUrl: "",
  teeMockupUrl:   "",
  toteMockupUrl:  "",
  // Delivery. Stored as strings like every other setting; read back through
  // getShippingRule below, which is the only thing that should parse them.
  shippingFee:       String(SHIPPING_DEFAULTS.fee),
  freeShippingAbove: String(SHIPPING_DEFAULTS.freeAbove),
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

function isSettingKey(k: string): k is SettingKey {
  return (SETTING_KEYS as string[]).includes(k);
}

async function _getSettings(): Promise<Settings> {
  const rows = await prisma.siteSetting.findMany();
  const out: Settings = { ...SETTING_DEFAULTS };
  for (const { key, value } of rows) {
    if (isSettingKey(key)) out[key] = value;
  }
  return out;
}

/** Cached read for public pages. Busted by saveSettings below. */
export const getSettings = unstable_cache(_getSettings, ["site-settings"], {
  tags: ["settings"],
});

/** Uncached read — the admin console must always see what it just saved. */
export async function getSettingsUncached(): Promise<Settings> {
  return _getSettings();
}

/**
 * The delivery rule as numbers. A malformed or negative stored value falls
 * back to the default rather than charging a nonsense amount.
 */
export function shippingRuleFrom(settings: Settings): ShippingRule {
  const num = (raw: string, fallback: number) => {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    fee:       num(settings.shippingFee, SHIPPING_DEFAULTS.fee),
    freeAbove: num(settings.freeShippingAbove, SHIPPING_DEFAULTS.freeAbove),
  };
}

/** Cached delivery rule for the storefront and the order-writing routes. */
export async function getShippingRule(): Promise<ShippingRule> {
  return shippingRuleFrom(await getSettings());
}

/**
 * Upsert the given keys. Unknown keys are ignored rather than stored, so a
 * malformed request can't grow the table with junk rows.
 */
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const entries = Object.entries(patch).filter(
    (e): e is [SettingKey, string] => isSettingKey(e[0]) && typeof e[1] === "string"
  );

  if (entries.length > 0) {
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where:  { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    revalidateTag("settings");
  }

  return _getSettings();
}
