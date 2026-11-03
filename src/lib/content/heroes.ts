/** Static hero catalog for Content Builder character blocks (no live Supabase). */
export type Hero = { id: string; name: string; images: string[] };

export const HEROES: Hero[] = [
  { id: "achilles", name: "Achilles", images: ["achilles.webp"] },
  { id: "adam", name: "Adam", images: ["adam.webp"] },
  { id: "cleopatra", name: "Cleopatra", images: ["cleopatra.webp"] },
  { id: "joan-of-arc", name: "Joan of Arc", images: ["joan-of-arc.webp"] },
  { id: "caesar", name: "Caesar", images: ["caesar.webp"] },
];

export function heroImageUrl(file: string) {
  return `/heroes/${file}`;
}

export function heroPortrait(hero: Hero) {
  return hero.images[0] ? heroImageUrl(hero.images[0]) : "";
}
