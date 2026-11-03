/** Static goddess catalog for Content Builder character blocks. */
export type Goddess = { id: string; name: string; images: string[] };

export const GODDESSES: Goddess[] = [
  { id: "athena", name: "Athena", images: ["athena.webp"] },
  { id: "bastet", name: "Bastet", images: ["bastet.webp"] },
  { id: "artemis", name: "Artemis", images: ["artemis.webp"] },
];

export function goddessImageUrl(file: string) {
  return `/goddesses/${file}`;
}

export function goddessPortrait(goddess: Goddess) {
  return goddess.images[0] ? goddessImageUrl(goddess.images[0]) : "";
}
