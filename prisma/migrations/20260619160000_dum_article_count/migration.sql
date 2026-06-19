-- Nombre d'articles de la DUM (point 3 cliente) : sert au supplément « feuillet »
-- du tarif syndical (>4 / >8 / >12 articles). Repris automatiquement dans le
-- calculateur d'honoraires de la facture.

ALTER TABLE "DUM" ADD COLUMN "articleCount" INTEGER;
