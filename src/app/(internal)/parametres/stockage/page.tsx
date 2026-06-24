import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { StorageSettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function StorageSettingsPage() {
  const session = await auth();
  if (!session || !canManageUsers(session.user.role)) redirect("/dashboard");
  const settings = await getSettings();

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/parametres"
        className="inline-flex items-center gap-1 text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Paramètres
      </Link>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Stockage des fichiers</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Où sont stockés les documents uploadés (factures, BL, BAD, etc.). Local pour le dev,
          S3 (Backblaze, AWS, Cloudflare R2) pour la prod.
        </p>
      </div>

      <Card>
        <div className="p-5">
          <StorageSettingsForm
            initial={{
              storageDriver: settings.storageDriver,
              s3Endpoint: settings.s3Endpoint ?? "",
              s3Region: settings.s3Region ?? "",
              s3Bucket: settings.s3Bucket ?? "",
              s3AccessKeyId: settings.s3AccessKeyId ?? "",
              // secret jamais renvoyé au navigateur (write-only) : laisser vide = conserver
              s3SecretKey: "",
              s3PublicBaseUrl: settings.s3PublicBaseUrl ?? "",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
