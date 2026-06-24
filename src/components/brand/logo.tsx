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

/** Logo horizontal : pictogramme + mot « escale » (logo corrigé). Ratio ≈ 5.09:1. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 21.16 4.16"
      className={className}
      role="img"
      aria-label="escale"
      xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M0,.84C0,.42.34.09.75.09h3.39v.38c0,.31-.25.56-.56.56H0v-.19Z" fill="#0d1d46"/>
        <path d="M0,2.28c0-.28.22-.5.5-.5h2.88v.44c0,.28-.22.5-.5.5H0v-.44Z" fill="#0d1d46"/>
        <path d="M0,3.6c0-.21.17-.38.38-.38h1.88v.56c0,.21-.17.38-.38.38H0v-.56Z" fill="#0d1d46"/>
        <path d="M3.35,3.22h0c.26,0,.47.21.47.47h0c0,.26-.21.47-.47.47h0c-.26,0-.47-.21-.47-.47h0c0-.26.21-.47.47-.47Z" fill="#1eb7ab"/>
        <path d="M1,1.03c-.28,0-.25.28-.25.38h-.75v-.57l.04-.12,3.5-.03.04.34s-2.58,0-2.58,0Z" fill="#0d1d46"/>
        <g>
          <path d="M8.08,2.58h-2.1c.07.39.4.64.87.64.3,0,.54-.1.73-.29l.34.39c-.24.29-.62.44-1.08.44-.9,0-1.48-.58-1.48-1.37s.59-1.37,1.38-1.37,1.35.55,1.35,1.38c0,.05,0,.12,0,.19ZM5.98,2.16h1.52c-.05-.39-.35-.65-.76-.65s-.7.26-.76.65Z" fill="#0d1d46"/>
          <path d="M8.38,3.45l.24-.47c.23.15.6.26.93.26.4,0,.56-.11.56-.29,0-.51-1.65-.03-1.65-1.1,0-.51.46-.84,1.18-.84.36,0,.76.08,1,.23l-.24.48c-.25-.15-.51-.2-.77-.2-.38,0-.56.12-.56.3,0,.54,1.65.06,1.65,1.11,0,.5-.46.83-1.21.83-.45,0-.89-.13-1.13-.3Z" fill="#0d1d46"/>
          <path d="M11.04,2.38c0-.8.6-1.37,1.45-1.37.52,0,.94.22,1.14.62l-.48.28c-.16-.26-.4-.37-.67-.37-.46,0-.81.32-.81.84s.35.84.81.84c.26,0,.5-.12.67-.37l.48.28c-.21.4-.62.63-1.14.63-.85,0-1.45-.57-1.45-1.37Z" fill="#0d1d46"/>
          <path d="M16.4,2.15v1.57h-.59v-.33c-.15.23-.44.36-.84.36-.61,0-1-.34-1-.8s.3-.8,1.11-.8h.69v-.04c0-.37-.22-.58-.67-.58-.3,0-.61.1-.81.27l-.25-.46c.29-.22.7-.33,1.13-.33.77,0,1.22.37,1.22,1.14ZM15.78,2.88v-.31h-.65c-.42,0-.54.16-.54.35,0,.23.19.37.51.37s.57-.14.68-.42Z" fill="#0d1d46"/>
          <path d="M17.2,0h.63v3.71h-.63V0Z" fill="#0d1d46"/>
          <path d="M21.15,2.58h-2.1c.08.39.4.64.87.64.3,0,.54-.1.73-.29l.34.39c-.24.29-.62.44-1.08.44-.9,0-1.48-.58-1.48-1.37s.58-1.37,1.38-1.37,1.35.55,1.35,1.38c0,.05,0,.12,0,.19ZM19.05,2.16h1.52c-.05-.39-.35-.65-.76-.65s-.7.26-.76.65Z" fill="#0d1d46"/>
        </g>
    </svg>
  );
}
