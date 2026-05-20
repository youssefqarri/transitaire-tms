"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      title="Se déconnecter"
      className="size-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
    >
      <LogOut className="size-4" />
    </button>
  );
}
