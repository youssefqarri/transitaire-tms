"use client";

import NextTopLoader from "nextjs-toploader";

export function ProgressBar() {
  return (
    <NextTopLoader
      color="#0D1D46"
      height={3}
      showSpinner={false}
      shadow="0 0 8px #0D1D46, 0 0 4px #0D1D46"
      easing="ease"
      speed={250}
    />
  );
}
