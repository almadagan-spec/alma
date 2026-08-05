export type ReservationLink =
  | { type: "tabit" | "ontopo" | "link"; label: string; href: string }
  | { type: "phone"; label: string; href: string }
  | { type: "none"; label: string; href: null };

/**
 * Best-effort detection: only catches restaurants where Google's "website"
 * field happens to point at (or mention) Tabit or Ontopo. Neither platform
 * exposes a directory we can query, so restaurants that use them but list a
 * different homepage on Google won't be detected — they'll fall back to
 * phone.
 */
function detectPlatform(website: string | null): "tabit" | "ontopo" | null {
  if (!website) return null;
  const lower = website.toLowerCase();
  if (lower.includes("tabit")) return "tabit";
  if (lower.includes("ontopo")) return "ontopo";
  return null;
}

export function getReservationLink(
  website: string | null,
  phone: string | null,
  manualUrl?: string | null,
): ReservationLink {
  if (manualUrl) {
    const manualPlatform = detectPlatform(manualUrl);
    if (manualPlatform === "tabit") {
      return { type: "tabit", label: "Reserve on Tabit", href: manualUrl };
    }
    if (manualPlatform === "ontopo") {
      return { type: "ontopo", label: "Reserve on Ontopo", href: manualUrl };
    }
    return { type: "link", label: "Reserve", href: manualUrl };
  }

  const platform = detectPlatform(website);

  if (platform === "tabit") {
    return { type: "tabit", label: "Reserve on Tabit", href: website! };
  }
  if (platform === "ontopo") {
    return { type: "ontopo", label: "Reserve on Ontopo", href: website! };
  }
  if (phone) {
    return { type: "phone", label: phone, href: `tel:${phone}` };
  }
  return { type: "none", label: "No reservation info found", href: null };
}
