// Marque « escale » — logos officiels (pictogramme à barres + accent teal).
// SVG inline : net en HiDPI, scalable via la hauteur (h-…), sans requête réseau,
// accessible. Géométrie d'origine conservée à l'identique (tracés repris tels quels
// du fichier du graphiste). Les couleurs de marque sont figées (bleu nuit #0D1D46,
// teal #1EB7AB) — un logo ne se thématise pas. Régler la TAILLE avec `className`
// (ex. `h-7 w-auto` ou `size-8`).

/** Pictogramme seul (carré arrondi) — favicon, espaces compacts. Ratio 1:1. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 94 94"
      className={className}
      role="img"
      aria-label="escale"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="94" height="94" rx="20" fill="#0D1D46" />
      <path d="M20.0923 32C20.0923 25.3726 25.4649 20 32.0923 20H73.9077V23.2308C73.9077 28.2013 69.8783 32.2308 64.9077 32.2308H20.0923V32Z" fill="#fff" />
      <path d="M20.0923 50.0154C20.0923 45.5971 23.674 42.0154 28.0923 42.0154H64.1231V46.2462C64.1231 50.6644 60.5414 54.2462 56.1231 54.2462H20.0923V50.0154Z" fill="#fff" />
      <path d="M20.0923 66.7692C20.0923 63.4555 22.7786 60.7692 26.0923 60.7692H49.4462V67C49.4462 70.3137 46.7599 73 43.4462 73H20.0923V66.7692Z" fill="#fff" />
      <rect x="57.6" y="60.7692" width="12.2308" height="12.2308" rx="2" fill="#1EB7AB" />
      <path d="M33.1385 32.2308C29.5325 32.2308 29.8769 35.8236 29.8769 37.1231H23.6983H20.0923V30.1923L23.2976 26.7269L66.5692 23.2615V32.2308H33.1385Z" fill="#fff" />
    </svg>
  );
}

/** Logo horizontal : servi DIRECTEMENT depuis le fichier du graphiste
 *  (public/logo.svg), sans conversion inline — version exacte garantie.
 *  Régler la TAILLE via className (ex. `h-7 w-auto`). */
export function LogoFull({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt="Escale" className={className} />
  );
}
