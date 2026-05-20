"use client";

import dynamic from "next/dynamic";

const AppProgressBar = dynamic(
  () => import("next-nprogress-bar").then((m) => m.AppProgressBar),
  { ssr: false },
);

export function ProgressBar() {
  return (
    <AppProgressBar
      height="2.5px"
      color="#2563eb"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
