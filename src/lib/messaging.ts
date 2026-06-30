import type { MessageChannel, MessageLang } from "@/generated/prisma/enums";
import { prisma } from "./db";
import { orgScope } from "./tenant";

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

export const LANG_LABELS: Record<MessageLang, string> = {
  FR: "Français",
  AR: "العربية",
  EN: "English",
};

/** Clés de templates utilisées par l'app. Si manquant en DB, on retombe sur les défauts ci-dessous. */
export const TEMPLATE_KEYS = {
  DOCS_MANQUANTS: "docs_manquants",
  DOCS_RECUS: "docs_recus",
  DOSSIER_OUVERT: "dossier_ouvert",
  ENREGISTRE_DOUANE: "enregistre_douane",
  VISITE_PROGRAMMEE: "visite_programmee",
  FICHE_LIQUIDATION: "fiche_liquidation",
  BAE_PRET: "bae_pret",
  DOSSIER_CLOTURE: "dossier_cloture",
} as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[keyof typeof TEMPLATE_KEYS];

/** Variables remplaçables : {{client.name}}, {{dossier.number}}, etc. */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | undefined | null>,
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

/** Charge un template depuis la DB ou retourne le défaut. */
export async function loadTemplate(
  key: TemplateKey,
  channel: MessageChannel,
  lang: MessageLang = "FR",
  orgId?: string | null,
): Promise<{ subject: string | null; body: string }> {
  // findFirst (et non findUnique sur la clé composite) pour pouvoir filtrer par org :
  // chaque org a son propre jeu de templates (isolation multi-tenant).
  const t = await prisma.messageTemplate.findFirst({
    where: { ...orgScope(orgId), key, channel, lang },
  });
  if (t && t.active && !t.deletedAt) {
    return { subject: t.subject, body: t.body };
  }
  return DEFAULT_TEMPLATES[lang]?.[key]?.[channel] ?? DEFAULT_TEMPLATES.FR[key][channel];
}

// ─── Templates par défaut (utilisés si rien en DB) ─────────────
type ChannelDefaults = Record<MessageChannel, { subject: string | null; body: string }>;
type LangDefaults = Record<TemplateKey, ChannelDefaults>;

const TPL_FR: LangDefaults = {
  docs_manquants: {
    EMAIL: {
      subject: "Documents manquants — Dossier {{dossier.number}}{{dossier.refSuffix}}",
      body:
        "Bonjour {{client.contactName}},\n\n" +
        "Pour finaliser votre dossier {{dossier.number}}{{dossier.refSuffix}}, nous avons besoin des pièces suivantes :\n\n" +
        "{{missingList}}\n\n" +
        "Merci de nous les transmettre dans les meilleurs délais.\n\n" +
        "Cordialement,\n{{user.name}}\nTransit Multiservices",
    },
    WHATSAPP: {
      subject: null,
      body:
        "Bonjour {{client.contactName}}, pour avancer sur votre dossier *{{dossier.number}}*{{dossier.refSuffix}} il nous manque :\n\n{{missingList}}\n\nMerci.",
    },
  },
  docs_recus: {
    EMAIL: {
      subject: "Documents reçus — Dossier {{dossier.number}}{{dossier.refSuffix}}",
      body:
        "Bonjour {{client.contactName}},\n\nNous avons bien reçu les documents pour le dossier {{dossier.number}}{{dossier.refSuffix}}. Nous procédons aux prochaines étapes.\n\nCordialement,\n{{user.name}}\nTransit Multiservices",
    },
    WHATSAPP: {
      subject: null,
      body: "✅ Documents reçus pour le dossier *{{dossier.number}}*{{dossier.refSuffix}}. Nous procédons à la suite.",
    },
  },
  dossier_ouvert: {
    EMAIL: {
      subject: "Ouverture du dossier {{dossier.number}}{{dossier.refSuffix}}",
      body:
        "Bonjour {{client.contactName}},\n\nNous avons ouvert le dossier {{dossier.number}}{{dossier.refSuffix}} pour vos marchandises.\n\nVous pouvez en suivre l'avancement à tout moment depuis votre espace client.\n\nCordialement,\n{{user.name}}\nTransit Multiservices",
    },
    WHATSAPP: {
      subject: null,
      body: "Dossier *{{dossier.number}}*{{dossier.refSuffix}} ouvert. Suivi : {{portalUrl}}",
    },
  },
  enregistre_douane: {
    EMAIL: {
      subject: "DUM enregistrée — Dossier {{dossier.number}}{{dossier.refSuffix}}",
      body:
        "Bonjour,\n\nLa DUM {{dum.number}} a été enregistrée pour votre dossier {{dossier.number}}{{dossier.refSuffix}}.\n\nCordialement,\n{{user.name}}\nTransit Multiservices",
    },
    WHATSAPP: {
      subject: null,
      body: "DUM *{{dum.number}}* enregistrée pour le dossier {{dossier.number}}{{dossier.refSuffix}}.",
    },
  },
  visite_programmee: {
    EMAIL: {
      subject: "Visite douane programmée — {{dossier.number}}{{dossier.refSuffix}}",
      body:
        "Bonjour,\n\nLa visite douane de votre dossier {{dossier.number}}{{dossier.refSuffix}} est programmée le {{visitDate}}.\n\nCordialement,\n{{user.name}}\nTransit Multiservices",
    },
    WHATSAPP: {
      subject: null,
      body: "📅 Visite douane prévue le {{visitDate}} pour le dossier *{{dossier.number}}*{{dossier.refSuffix}}.",
    },
  },
  fiche_liquidation: {
    EMAIL: {
      subject: "Fiche de liquidation — Dossier {{dossier.number}}{{dossier.refSuffix}}",
      body:
        "Bonjour,\n\nVeuillez trouver ci-joint la fiche de liquidation et le ticket de paiement pour votre dossier {{dossier.number}}{{dossier.refSuffix}}.\n\nMerci d'effectuer le règlement et de nous transmettre la preuve afin que nous puissions lever la marchandise.\n\nCordialement,\n{{user.name}}\nTransit Multiservices",
    },
    WHATSAPP: {
      subject: null,
      body: "💳 Fiche de liquidation prête pour le dossier *{{dossier.number}}*{{dossier.refSuffix}}. Vérifiez votre email pour le détail.",
    },
  },
  bae_pret: {
    EMAIL: {
      subject: "Bon à enlever définitif — Dossier {{dossier.number}}{{dossier.refSuffix}}",
      body:
        "Bonjour,\n\nBonne nouvelle : le bon à enlever définitif est obtenu pour votre dossier {{dossier.number}}{{dossier.refSuffix}}. La marchandise peut être enlevée.\n\nCordialement,\n{{user.name}}\nTransit Multiservices",
    },
    WHATSAPP: {
      subject: null,
      body: "🎉 BAE définitif obtenu pour le dossier *{{dossier.number}}*{{dossier.refSuffix}}. Marchandise prête à enlever.",
    },
  },
  dossier_cloture: {
    EMAIL: {
      subject: "Dossier {{dossier.number}}{{dossier.refSuffix}} clôturé",
      body:
        "Bonjour,\n\nVotre dossier {{dossier.number}}{{dossier.refSuffix}} est clôturé. Merci de votre confiance.\n\nCordialement,\n{{user.name}}\nTransit Multiservices",
    },
    WHATSAPP: {
      subject: null,
      body: "✅ Dossier *{{dossier.number}}*{{dossier.refSuffix}} clôturé. Merci de votre confiance.",
    },
  },
};

const DEFAULT_TEMPLATES: Record<MessageLang, LangDefaults> = {
  FR: TPL_FR,
  // Pour AR / EN on retombera sur FR si rien en DB. À étoffer plus tard.
  AR: TPL_FR,
  EN: TPL_FR,
};
