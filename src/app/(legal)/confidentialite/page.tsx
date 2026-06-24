import type { Metadata } from "next";
import { LegalTitle, H2, H3, P, UL, Fill } from "../legal-prose";

export const metadata: Metadata = {
  title: "Confidentialité & protection des données",
  description:
    "Politique de confidentialité et de protection des données personnelles de la plateforme Escale, conforme à la loi 09-08.",
};

export default function ConfidentialitePage() {
  return (
    <article>
      <LegalTitle title="Politique de confidentialité" updated="24 juin 2026" />

      <P>
        La présente politique décrit la manière dont la plateforme <strong>Escale</strong>{" "}
        (accessible à l&apos;adresse app.escale.ma, ci-après « la Plateforme ») collecte, utilise,
        conserve et protège les données à caractère personnel de ses utilisateurs, conformément à la{" "}
        <strong>loi n° 09-08</strong>{" "}relative à la protection des personnes physiques à l&apos;égard
        du traitement des données à caractère personnel, à son décret d&apos;application n° 2-09-165,
        et aux délibérations de la <strong>Commission Nationale de contrôle de la protection des
        Données à caractère Personnel (CNDP)</strong>.
      </P>

      <H2>1. Responsable du traitement</H2>
      <P>
        Le responsable du traitement des données est{" "}
        <Fill>[RAISON SOCIALE DE L&apos;EXPLOITANT]</Fill>, société{" "}
        <Fill>[FORME JURIDIQUE]</Fill> au capital de <Fill>[CAPITAL]</Fill>, immatriculée au registre
        du commerce sous le n° <Fill>[N° RC]</Fill>, ICE <Fill>[N° ICE]</Fill>, dont le siège est sis{" "}
        <Fill>[ADRESSE COMPLÈTE]</Fill> (ci-après « l&apos;Exploitant »).
      </P>
      <P>
        Traitement déclaré / autorisé auprès de la CNDP sous la référence{" "}
        <Fill>[N° DE DÉCLARATION CNDP]</Fill>. Pour toute question relative à vos données, vous
        pouvez contacter le délégué/responsable à la protection des données à l&apos;adresse{" "}
        <Fill>[EMAIL DE CONTACT DPO]</Fill>.
      </P>

      <H2>2. Définitions</H2>
      <UL>
        <li>
          <strong>Donnée à caractère personnel</strong> : toute information se rapportant à une
          personne physique identifiée ou identifiable.
        </li>
        <li>
          <strong>Traitement</strong> : toute opération portant sur des données personnelles
          (collecte, enregistrement, conservation, consultation, communication, suppression…).
        </li>
        <li>
          <strong>Utilisateur</strong> : toute personne accédant à la Plateforme, qu&apos;elle soit
          collaborateur de l&apos;Exploitant (administration, exploitation, déclarant, comptabilité…)
          ou client disposant d&apos;un accès au portail.
        </li>
        <li>
          <strong>Personne concernée</strong> : la personne physique à laquelle se rapportent les
          données traitées.
        </li>
      </UL>

      <H2>3. Données collectées</H2>
      <P>La Plateforme est susceptible de traiter les catégories de données suivantes :</P>
      <UL>
        <li>
          <strong>Données d&apos;identification et de compte</strong> : nom, prénom, adresse e-mail,
          rôle, mot de passe (stocké sous forme chiffrée/hachée).
        </li>
        <li>
          <strong>Données de contact</strong> : adresse(s) e-mail, numéro de téléphone, numéro
          WhatsApp, coordonnées professionnelles.
        </li>
        <li>
          <strong>Données relatives à l&apos;activité de transit</strong> : informations sur les
          dossiers de dédouanement, références, numéros de DUM, déclarations, documents douaniers,
          montants, et coordonnées des clients et fournisseurs.
        </li>
        <li>
          <strong>Données de connexion et techniques</strong> : adresse IP, identifiant de session,
          journaux d&apos;audit (date, heure, action, navigateur), strictement nécessaires à la
          sécurité du service.
        </li>
      </UL>
      <P>
        La Plateforme ne collecte aucune donnée sensible au sens de l&apos;article 1er de la loi
        09-08 (origine raciale, opinions politiques, convictions religieuses, santé…).
      </P>

      <H2>4. Finalités du traitement</H2>
      <P>Les données sont traitées pour les finalités déterminées, explicites et légitimes suivantes :</P>
      <UL>
        <li>la création et la gestion des comptes et des accès ;</li>
        <li>la gestion des dossiers de transit et de dédouanement ;</li>
        <li>la communication avec les clients (notifications par e-mail et WhatsApp, demandes de documents) ;</li>
        <li>la facturation et le suivi comptable ;</li>
        <li>la sécurité de la Plateforme, la prévention de la fraude et la tenue d&apos;un journal d&apos;audit ;</li>
        <li>le respect des obligations légales et réglementaires (notamment en matière douanière, fiscale et comptable).</li>
      </UL>

      <H2>5. Base légale</H2>
      <P>Les traitements reposent, selon les cas, sur :</P>
      <UL>
        <li>l&apos;<strong>exécution d&apos;un contrat</strong> ou de mesures précontractuelles (prestation de transit) ;</li>
        <li>le <strong>respect d&apos;une obligation légale</strong> à laquelle l&apos;Exploitant est soumis ;</li>
        <li>l&apos;<strong>intérêt légitime</strong> de l&apos;Exploitant (sécurité, amélioration du service) ;</li>
        <li>le <strong>consentement</strong> de la personne concernée lorsqu&apos;il est requis.</li>
      </UL>

      <H2>6. Destinataires des données</H2>
      <P>
        Les données sont destinées aux services habilités de l&apos;Exploitant, en fonction de leur
        rôle et selon le principe du moindre privilège. Elles peuvent être communiquées :
      </P>
      <UL>
        <li>aux administrations compétentes (Administration des Douanes, organismes de contrôle, PortNet…) dans le cadre des formalités ;</li>
        <li>aux prestataires techniques strictement nécessaires au fonctionnement du service (hébergement, envoi d&apos;e-mails et de messages), agissant en qualité de sous-traitants et soumis à la confidentialité ;</li>
        <li>aux autorités judiciaires ou administratives sur réquisition légale.</li>
      </UL>
      <P>Les données ne font l&apos;objet d&apos;aucune cession ni commercialisation à des tiers.</P>

      <H2>7. Hébergement et localisation</H2>
      <P>
        Les données sont hébergées sur des serveurs dédiés exploités par l&apos;Exploitant. La
        localisation de l&apos;hébergement est <Fill>[PAYS / CENTRE D&apos;HÉBERGEMENT]</Fill>. Les
        accès aux serveurs sont restreints et journalisés.
      </P>

      <H2>8. Durée de conservation</H2>
      <P>
        Les données sont conservées pour la durée strictement nécessaire aux finalités poursuivies,
        puis archivées ou supprimées :
      </P>
      <UL>
        <li>données de compte : pour la durée de la relation, puis supprimées après désactivation ;</li>
        <li>dossiers, factures et documents : conservés conformément aux obligations légales de conservation (notamment l&apos;obligation comptable et fiscale de dix (10) ans) ;</li>
        <li>journaux de connexion et d&apos;audit : conservés pour une durée proportionnée aux besoins de sécurité.</li>
      </UL>

      <H2>9. Sécurité</H2>
      <P>
        L&apos;Exploitant met en œuvre les mesures techniques et organisationnelles appropriées pour
        préserver la sécurité et la confidentialité des données et empêcher qu&apos;elles soient
        déformées, endommagées ou que des tiers non autorisés y aient accès : chiffrement des accès
        (HTTPS), hachage des mots de passe, gestion des droits par rôle, journalisation des actions,
        chiffrement des secrets sensibles et sauvegardes régulières.
      </P>

      <H2>10. Cookies et traceurs</H2>
      <P>
        La Plateforme utilise uniquement des cookies strictement nécessaires à son fonctionnement
        (cookie de session d&apos;authentification, jeton anti-CSRF). Ces cookies ne servent pas à
        des fins publicitaires ou de profilage et ne nécessitent pas de consentement préalable. La
        Plateforme n&apos;utilise pas de traceurs tiers à des fins de marketing.
      </P>

      <H2>11. Transferts hors du Maroc</H2>
      <P>
        Tout transfert de données vers un pays étranger n&apos;est effectué que dans le respect des
        articles 43 et 44 de la loi 09-08 et, le cas échéant, après autorisation de la CNDP, vers des
        pays assurant un niveau de protection suffisant ou moyennant des garanties appropriées.
      </P>

      <H2>12. Vos droits</H2>
      <P>
        Conformément à la loi 09-08, toute personne concernée dispose des droits suivants sur ses
        données :
      </P>
      <UL>
        <li><strong>droit d&apos;accès</strong> : obtenir la confirmation que des données la concernant sont traitées et en obtenir communication ;</li>
        <li><strong>droit de rectification</strong> : faire rectifier, compléter ou mettre à jour des données inexactes ;</li>
        <li><strong>droit d&apos;opposition</strong> : s&apos;opposer, pour des motifs légitimes, au traitement de ses données ;</li>
        <li><strong>droit de suppression</strong> : faire effacer les données dont le traitement n&apos;est pas ou plus justifié.</li>
      </UL>
      <P>
        Ces droits peuvent être exercés à tout moment, sur justification d&apos;identité, en écrivant
        à <Fill>[EMAIL DE CONTACT DPO]</Fill> ou par courrier à l&apos;adresse du siège. Il sera
        répondu dans les délais légaux.
      </P>

      <H2>13. Réclamation auprès de la CNDP</H2>
      <P>
        Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous
        pouvez introduire une réclamation auprès de la Commission Nationale de contrôle de la
        protection des Données à caractère Personnel (CNDP) — www.cndp.ma.
      </P>

      <H2>14. Protection des mineurs</H2>
      <P>
        La Plateforme s&apos;adresse à des professionnels et n&apos;est pas destinée aux mineurs.
        Aucune donnée n&apos;est sciemment collectée auprès de personnes mineures.
      </P>

      <H2>15. Modifications</H2>
      <P>
        La présente politique peut être mise à jour pour tenir compte des évolutions légales ou du
        service. La version applicable est celle publiée sur la Plateforme, dont la date de dernière
        mise à jour figure en tête de page.
      </P>

      <H2>16. Contact</H2>
      <P>
        Pour toute question relative à la présente politique ou à vos données personnelles :{" "}
        <Fill>[EMAIL DE CONTACT]</Fill> — <Fill>[TÉLÉPHONE]</Fill> — <Fill>[ADRESSE POSTALE]</Fill>.
      </P>
    </article>
  );
}
