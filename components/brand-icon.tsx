import Image from "next/image";

/**
 * Icône de marque Clair Vision (œil bleu) ou Clair Audition (oreille verte).
 * Chaque logo a son propre fichier PNG (512×512, fond transparent) :
 *   /public/images/logos/clair-vision.png
 *   /public/images/logos/clair-audition.png
 */
type Brand = "vision" | "audition";

export function BrandIcon({
  brand,
  size = 32,
  className = "",
}: {
  brand: Brand;
  size?: number;
  className?: string;
}) {
  const src = brand === "vision"
    ? "/images/logos/clair-vision.png"
    : "/images/logos/clair-audition.png";
  const alt = brand === "vision" ? "Clair Vision" : "Clair Audition";

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className}`}
      style={{ width: size, height: size }}
      priority={size > 200}
    />
  );
}
