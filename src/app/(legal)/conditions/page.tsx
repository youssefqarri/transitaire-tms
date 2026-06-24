import type { Metadata } from "next";
import { LegalTitle, H2, P, UL, Fill } from "../legal-prose";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Conditions générales d'utilisation de la plateforme Escale (gestion de transit et de dédouanement).",
};

export default function ConditionsPage() {
  return (
    <article>
      <LegalTitle title="Conditions générales d'utilisation" updated="24 juin 2026" />

      <P>
        Les présentes conditions générales d&apos;utilisation (ci-après « CGU ») régissent
        l&apos;accès et l&apos;usage de la plateforme <strong>Escale</strong> (accessible à
        l&apos;adresse app.escale.ma, ci-après « la Plateforme »), solution de gestion de transit et
        de dédouanement. Toute utilisation de la Plateforme implique l&apos;acceptation pleine et
        entière des présentes CGU.
      </P>

      <H2>1. Objet</H2>
      <P>
        Les CGU ont pour objet de définir les modalités de mise à disposition de la Plateforme et les
        conditions d&apos;utilisation par les utilisateurs habilités (collaborateurs de
        l&apos;Exploitant et clients disposant d&apos;un accès au portail).
      </P>

      <H2>2. Mentions légales / Éditeur</H2>
      <P>
        La Plateforme est éditée et exploitée par <Fill>[RAISON SOCIALE DE L&apos;EXPLOITANT]</Fill>,
        société <Fill>[FORME JURIDIQUE]</Fill> au capital de <Fill>[CAPITAL]</Fill>, immatriculée au
        registre du commerce sous le n° <Fill>[N° RC]</Fill>, ICE <Fill>[N° ICE]</Fill>, dont le siège
        est sis <Fill>[ADRESSE COMPLÈTE]</Fill>. Directeur de la publication :{" "}
        <Fill>[NOM DU DIRECTEUR]</Fill>. Contact : <Fill>[EMAIL]</Fill> — <Fill>[TÉLÉPHONE]</Fill>.
      </P>

      <H2>3. Définitions</H2>
      <UL>
        <li><strong>Plateforme</strong> : le service en ligne Escale et l&apos;ensemble de ses fonctionnalités.</li>
        <li><strong>Exploitant</strong> : la société éditrice et exploitante de la Plateforme.</li>
        <li><strong>Utilisateur</strong> : toute personne disposant d&apos;un compte d&apos;accès, quel que soit son rôle.</li>
        <li><strong>Client</strong> : donneur d&apos;ordre disposant, le cas échéant, d&apos;un accès au portail.</li>
        <li><strong>Contenu</strong> : les données, documents et informations saisis ou déposés sur la Plateforme.</li>
      </UL>

      <H2>4. Acceptation et opposabilité</H2>
      <P>
        L&apos;accès à la Plateforme vaut acceptation sans réserve des présentes CGU. Si
        l&apos;utilisateur n&apos;accepte pas les CGU, il doit renoncer à l&apos;usage de la
        Plateforme. Les CGU applicables sont celles en vigueur au moment de la connexion.
      </P>

      <H2>5. Accès au service et comptes</H2>
      <UL>
        <li>L&apos;accès est réservé aux utilisateurs disposant d&apos;identifiants personnels fournis par l&apos;Exploitant.</li>
        <li>Chaque utilisateur est responsable de la confidentialité de ses identifiants et de toute action effectuée sous son compte.</li>
        <li>L&apos;utilisateur s&apos;engage à signaler sans délai tout usage non autorisé de son compte.</li>
        <li>L&apos;Exploitant peut créer, suspendre ou désactiver des comptes, notamment ceux des personnes ne faisant plus partie de l&apos;organisation.</li>
      </UL>

      <H2>6. Description du service</H2>
      <P>
        La Plateforme permet notamment la gestion des dossiers de transit, le suivi des statuts et des
        formalités douanières, la gestion documentaire, la communication avec les clients, ainsi que
        la facturation. L&apos;Exploitant peut faire évoluer les fonctionnalités à tout moment afin
        d&apos;améliorer le service.
      </P>

      <H2>7. Obligations de l&apos;utilisateur</H2>
      <P>L&apos;utilisateur s&apos;engage à :</P>
      <UL>
        <li>utiliser la Plateforme conformément à sa destination professionnelle et à la réglementation en vigueur ;</li>
        <li>fournir des informations exactes et les tenir à jour ;</li>
        <li>ne pas porter atteinte à la sécurité ou à l&apos;intégrité de la Plateforme (intrusion, contournement des droits, surcharge, rétro-ingénierie) ;</li>
        <li>ne déposer aucun contenu illicite, frauduleux ou portant atteinte aux droits de tiers ;</li>
        <li>respecter la confidentialité des données auxquelles il accède dans le cadre de son rôle.</li>
      </UL>

      <H2>8. Disponibilité et maintenance</H2>
      <P>
        L&apos;Exploitant s&apos;efforce d&apos;assurer la disponibilité de la Plateforme mais ne
        garantit pas un fonctionnement ininterrompu. L&apos;accès peut être suspendu temporairement
        pour maintenance, mise à jour ou pour des raisons de sécurité, sans que cela n&apos;ouvre
        droit à indemnité.
      </P>

      <H2>9. Propriété intellectuelle</H2>
      <P>
        La Plateforme, sa structure, ses codes, sa charte graphique, ses logos et marques sont la
        propriété exclusive de l&apos;Exploitant ou de ses concédants et sont protégés par le droit de
        la propriété intellectuelle. Aucune reproduction, représentation ou exploitation, totale ou
        partielle, n&apos;est autorisée sans accord écrit préalable. Les données et documents déposés
        par les utilisateurs demeurent leur propriété ; ils concèdent à l&apos;Exploitant les droits
        d&apos;hébergement et de traitement nécessaires à la fourniture du service.
      </P>

      <H2>10. Données à caractère personnel</H2>
      <P>
        Le traitement des données personnelles est décrit dans la{" "}
        <a href="/confidentialite" className="text-[var(--color-accent)] hover:underline underline-offset-2">
          Politique de confidentialité
        </a>
        , conforme à la loi 09-08, qui fait partie intégrante des présentes CGU.
      </P>

      <H2>11. Responsabilité</H2>
      <P>
        La Plateforme est un outil de gestion. L&apos;Exploitant ne saurait être tenu responsable des
        décisions prises par les utilisateurs sur la base des informations qu&apos;elle contient, ni
        de l&apos;exactitude des données saisies par les utilisateurs. L&apos;Exploitant ne répond pas
        des dommages indirects (perte d&apos;exploitation, perte de données imputable à
        l&apos;utilisateur, préjudice commercial). La responsabilité de l&apos;Exploitant, si elle est
        engagée, est limitée au préjudice direct et prévisible.
      </P>

      <H2>12. Suspension et résiliation</H2>
      <P>
        En cas de manquement aux présentes CGU, l&apos;Exploitant peut suspendre ou supprimer
        l&apos;accès de l&apos;utilisateur concerné, sans préavis en cas d&apos;atteinte à la
        sécurité. La cessation de la relation n&apos;affecte pas les obligations de conservation
        légale des données.
      </P>

      <H2>13. Force majeure</H2>
      <P>
        La responsabilité de l&apos;Exploitant ne saurait être engagée en cas d&apos;inexécution due
        à un événement de force majeure au sens du droit marocain (notamment défaillance des réseaux,
        des fournisseurs d&apos;hébergement, catastrophe, décision administrative).
      </P>

      <H2>14. Modification des CGU</H2>
      <P>
        L&apos;Exploitant se réserve le droit de modifier les présentes CGU à tout moment. La version
        applicable est celle publiée sur la Plateforme, dont la date de dernière mise à jour figure en
        tête de page. La poursuite de l&apos;utilisation vaut acceptation des CGU modifiées.
      </P>

      <H2>15. Droit applicable et juridiction</H2>
      <P>
        Les présentes CGU sont régies par le <strong>droit marocain</strong>. À défaut de résolution
        amiable, tout litige relatif à leur interprétation ou à leur exécution sera soumis à la
        compétence exclusive des tribunaux compétents de <Fill>[VILLE]</Fill>.
      </P>

      <H2>16. Contact</H2>
      <P>
        Pour toute question relative aux présentes CGU : <Fill>[EMAIL DE CONTACT]</Fill> —{" "}
        <Fill>[TÉLÉPHONE]</Fill> — <Fill>[ADRESSE POSTALE]</Fill>.
      </P>
    </article>
  );
}
