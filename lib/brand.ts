const color = process.env.NEXT_PUBLIC_BRAND_COLOR;
export const brand = {
  name: process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Humanity Grid",
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE?.trim() || "Connect Resources. Empower Humanity.",
  color: color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#137f68",
};
