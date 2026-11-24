import { isPostgresConfigured, pgPool, ensurePostgresReady } from "../config/db.js";
import { supabase, isSupabaseConfigured } from "../config/supabaseClient.js";
import { memoryStore, saveMemoryStore, DEFAULT_DATA } from "../config/memoryStore.js";

export const SettingsModel = {
  async getAll() {
    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const { rows } = await pgPool.query(
        "SELECT key, value FROM app_settings WHERE key IN ('profile', 'brandLogos', 'navIcons', 'socialMedia')"
      );
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      return {
        profile: {
          ...DEFAULT_DATA.settings.profile,
          ...(map.profile || {}),
        },
        brandLogos: map.brandLogos || {},
        navIcons: map.navIcons || {},
        socialMedia: Array.isArray(map.socialMedia)
          ? map.socialMedia
          : structuredClone(DEFAULT_DATA.settings.socialMedia),
      };
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["profile", "brandLogos", "navIcons", "socialMedia"]);
      if (!error && Array.isArray(data)) {
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
        return {
          profile: {
            ...DEFAULT_DATA.settings.profile,
            ...(map.profile || {}),
          },
          brandLogos: map.brandLogos || {},
          navIcons: map.navIcons || {},
          socialMedia: Array.isArray(map.socialMedia)
            ? map.socialMedia
            : structuredClone(DEFAULT_DATA.settings.socialMedia),
        };
      }
    }

    const curr = memoryStore.settings || structuredClone(DEFAULT_DATA.settings);
    return {
      profile: { ...DEFAULT_DATA.settings.profile, ...(curr.profile || {}) },
      brandLogos: curr.brandLogos || {},
      navIcons: curr.navIcons || {},
      socialMedia: Array.isArray(curr.socialMedia)
        ? curr.socialMedia
        : structuredClone(DEFAULT_DATA.settings.socialMedia),
    };
  },

  async update(payload = {}) {
    const current = await this.getAll();
    const nextProfile = payload.profile
      ? { ...current.profile, ...payload.profile }
      : current.profile;
    const nextBrandLogos =
      payload.brandLogos !== undefined ? payload.brandLogos : current.brandLogos;
    const nextNavIcons =
      payload.navIcons !== undefined ? payload.navIcons : current.navIcons;
    const nextSocialMedia = Array.isArray(payload.socialMedia)
      ? payload.socialMedia
      : current.socialMedia;

    const nextSettings = {
      profile: nextProfile,
      brandLogos: nextBrandLogos,
      navIcons: nextNavIcons,
      socialMedia: nextSocialMedia,
    };

    if (isPostgresConfigured) {
      await ensurePostgresReady();
      const entries = [
        ["profile", nextProfile],
        ["brandLogos", nextBrandLogos],
        ["navIcons", nextNavIcons],
        ["socialMedia", nextSocialMedia],
      ];
      for (const [k, v] of entries) {
        await pgPool.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ($1, $2::jsonb, now())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
          [k, JSON.stringify(v)]
        );
      }
      return nextSettings;
    }

    if (isSupabaseConfigured) {
      const nowIso = new Date().toISOString();
      const rows = [
        { key: "profile", value: nextProfile, updated_at: nowIso },
        { key: "brandLogos", value: nextBrandLogos, updated_at: nowIso },
        { key: "navIcons", value: nextNavIcons, updated_at: nowIso },
        { key: "socialMedia", value: nextSocialMedia, updated_at: nowIso },
      ];
      const { error } = await supabase
        .from("app_settings")
        .upsert(rows, { onConflict: "key" });
      if (error) throw error;
      return nextSettings;
    }

    memoryStore.settings = nextSettings;
    saveMemoryStore();
    return memoryStore.settings;
  },
};
