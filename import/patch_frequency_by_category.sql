-- Allinea le frequenze di manutenzione alla normativa reale.
-- Regola: antincendio (rivelazione + antincendio) → SEM | resto → ANN
--
-- Il trigger trg_assets_set_status ricalcola automaticamente lo status
-- di ogni asset al cambio di verification_frequency_days.
--
-- Per ripristinare: basta rieseguire con i valori precedenti per categoria.

BEGIN;

-- Verifica prima di applicare (esegui solo SELECT per controllare i conteggi)
-- SELECT category, verification_frequency_code, COUNT(*) AS n
-- FROM assets
-- GROUP BY category, verification_frequency_code
-- ORDER BY category, verification_frequency_code;

-- SEM (semestrale: 180 gg / 6 mesi)
-- Categorie: impianto antincendio completo
UPDATE assets
SET
    verification_frequency_code    = 'SEM',
    verification_frequency_days    = 180,
    verification_frequency_months  = 6,
    updated_at                     = NOW()
WHERE category IN ('Rivelazione incendi', 'Antincendio');

-- ANN (annuale: 360 gg / 12 mesi)
-- Categorie: meccanico, elettrico, TVCC
UPDATE assets
SET
    verification_frequency_code    = 'ANN',
    verification_frequency_days    = 360,
    verification_frequency_months  = 12,
    updated_at                     = NOW()
WHERE category IN ('Meccanico', 'Elettrico', 'TVCC');

-- Riepilogo post-applicazione
SELECT
    category,
    verification_frequency_code AS freq,
    COUNT(*)                    AS asset_count
FROM assets
GROUP BY category, verification_frequency_code
ORDER BY category, verification_frequency_code;

COMMIT;
