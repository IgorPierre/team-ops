/** "Acme Labs, Inc." → "acme-labs-inc" */
export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** "Website redesign" → "WR", "Payments" → "PAY" */
export function projectKeyFrom(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const key = words.length > 1 ? words.map((w) => w[0]).join("") : (words[0] ?? "").slice(0, 4);
  return key.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
