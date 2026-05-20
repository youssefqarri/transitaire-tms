"use client";

import NextTopLoader from "nextjs-toploader";

export function ProgressBar() {
  return (
    <NextTopLoader
      color="#2563eb"
      height={3}
      showSpinner={false}
      shadow="0 0 8px #2563eb, 0 0 4px #2563eb"
      easing="ease"
      speed={250}
    />
  );
}
