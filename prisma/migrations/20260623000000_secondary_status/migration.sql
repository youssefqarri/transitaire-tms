-- 2ᵉ statut parallèle « organismes de contrôle » (en plus du statut douane),
-- et voie de chaque entrée d'historique (DOUANE par défaut, ou CONTROLE).
ALTER TABLE "Dossier" ADD COLUMN "secondaryStatus" "DossierStatus";
ALTER TABLE "DossierStatusChange" ADD COLUMN "track" TEXT NOT NULL DEFAULT 'DOUANE';
