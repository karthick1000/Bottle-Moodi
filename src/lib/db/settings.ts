import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Editable homepage content. Defaults are used until the admin saves. */
export const SETTING_DEFAULTS = {
  tagline:        "Bottle Moodi — Mood-க்கு ஏத்த Design",
  headline:       "NORMAL IS NOT OUR SIZE",
  strip:          "NOW SHOWING · POSTERS · CHENNAI",
  studioPhotoUrl: "",
  teeMockupUrl:   "",
  toteMockupUrl:  "",
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
