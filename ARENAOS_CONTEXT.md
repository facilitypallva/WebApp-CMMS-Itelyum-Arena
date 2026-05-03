# ArenaOS - fotografia funzionale e tecnica

Aggiornato al 1 maggio 2026. Questo documento serve come contesto rapido per un altro assistente AI: descrive come funziona oggi ArenaOS, quali sono le pagine, le logiche principali, l'identita grafica e i file chiave del progetto.

## Sintesi

ArenaOS e una web app CMMS per Itelyum Arena / Pallacanestro Varese. Gestisce asset impiantistici, scadenze manutentive, work order, ticket pubblici, fornitori, tecnici, rapportini allegati, audit log e utenti.

Stack principale:

- Frontend: React 19, TypeScript, Vite.
- Routing: `react-router-dom`.
- UI: Tailwind CSS 4, shadcn-style components locali, lucide-react, sonner, Recharts, motion.
- Backend dati: Supabase Auth, database Postgres, Storage e Edge Function.
- API serverless Vercel: notifiche email/ticket con Resend.
- Entry app: `src/main.tsx`, `src/App.tsx`.

## Come si avvia

- Dipendenze: `package.json`, `package-lock.json`.
- Dev server: `npm run dev`, Vite su `http://localhost:3000`.
- Build: `npm run build`.
- Type check/lint: `npm run lint`, esegue `tsc --noEmit`.
- Vercel SPA fallback: `vercel.json` riscrive tutte le route verso `index.html` e mantiene `/api/*`.

Variabili ambiente indicate in `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `EMAIL_ENABLED`
- `GEMINI_API_KEY`, presente come residuo/possibile integrazione AI, ma non emerge come logica centrale nelle pagine lette.

Non inserire segreti reali in questo file.

## Architettura applicativa

`src/App.tsx` definisce provider globali e route:

- `ThemeProvider` da `next-themes`.
- `AuthProvider` in `src/contexts/AuthContext.tsx`.
- `TooltipProvider` e `Toaster`.
- `BrowserRouter`.
- `ErrorBoundary`.
- Lazy loading delle pagine con `React.lazy` e `Suspense`.

Le route pubbliche sono:

- `/login`: login interno.
- `/reset-password`: reset password.
- `/report-issue`: form pubblico per segnalare un guasto.

Le route protette sono:

- `/`: Dashboard generale.
- `/reports/cda`: report stampabile/PDF per CDA, accessibile a `ADMIN` e `RESPONSABILE`.
- `/assets`: gestione asset.
- `/work-orders`: gestione work order.
- `/rapportini`: archivio allegati/rapportini dei work order.
- `/tickets`: coda ticket.
- `/schedule`: scadenzario manutenzioni.
- `/suppliers`: fornitori e tecnici.
- `/audit`: audit log, accessibile a `ADMIN` e `RESPONSABILE`.
- `/users`: gestione utenti, solo `ADMIN`.

Il layout protetto e in `src/components/layout/AppLayout.tsx`: sidebar fissa, header, ricerca globale per pagina e area contenuto.

## Autenticazione e ruoli

File centrali:

- `src/contexts/AuthContext.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/auth/LoginPage.tsx`
- `src/components/auth/ResetPasswordPage.tsx`
- `src/lib/authStorage.ts`
- `src/hooks/useProfiles.ts`
- `supabase/functions/admin-users/index.ts`

Ruoli applicativi definiti in `src/types/index.ts`:

- `ADMIN`
- `RESPONSABILE`
- `TECNICO`
- `LETTURA`

`AuthContext` legge la sessione Supabase, carica il profilo da `profiles`, calcola `role`, `isAdmin` e `isActive`, espone `signIn`, `signOut`, `resetPassword`, `updatePassword`, `refreshProfile`.

`ProtectedRoute`:

- rimanda a `/login` se non c'e sessione;
- rimanda a `/login` se il profilo non e attivo;
- blocca route solo admin;
- blocca route con `allowedRoles` se il ruolo non e ammesso.

La gestione utenti (`/users`) usa `useProfiles.ts`, che invoca la Supabase Edge Function `admin-users`. La funzione verifica che il chiamante sia admin, poi crea o aggiorna utenti Supabase Auth e record in `profiles`.

## Modello dati principale

Tipi principali in `src/types/index.ts`:

- `Facility`
- `Location`
- `Asset`
- `WorkOrder`
- `Ticket`
- `Technician`
- `Supplier`
- `UserProfile`
- `AppNotification`

Tabelle principali emerse da `supabase_schema.sql` e `import/bootstrap_supabase_schema.sql`:

- `facilities`
- `locations`
- `assets`
- `suppliers`
- `technicians`
- `profiles`
- `work_orders`
- `work_order_code_counters`
- `ticket_code_counters`
- `tickets`
- `notifications`
- `audit_log`

Storage Supabase usato:

- bucket `tickets`: foto caricate dal form pubblico ticket.
- bucket `rapportini`: allegati dei work order e archivio rapportini.
- bucket `avatars`: avatar profilo utente.

## Logiche database importanti

Gli script SQL in `import/bootstrap_supabase_schema.sql` e patch correlate contengono le logiche lato database:

- Generazione codici work order: `next_work_order_code`, `assign_work_order_code`, trigger `trg_work_orders_assign_code`.
- Generazione codici ticket: `next_ticket_code`, `assign_ticket_code`, trigger `trg_tickets_assign_code`.
- Creazione/sync profilo da utente Auth: `handle_auth_user_profile`.
- Blocco modifica stati finali dei work order: `prevent_terminal_work_order_status_change`.
- Calcolo stato asset: `set_asset_status`.
- Sincronizzazione asset dopo work order: `sync_asset_after_work_order`.
- RLS policy per lettura/scrittura autenticata e inserimento ticket pubblico.

## Layout e navigazione

File:

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/profile/ProfileSheet.tsx`

Sidebar:

- colore scuro `#0b1220`;
- logo ArenaOS bianco/invertito;
- sezioni: Dashboard, Asset, Work Orders, Rapportini, Tickets, Scadenzario, Fornitori, Audit Log, Utenti.
- Audit Log visibile solo ad `ADMIN` e `RESPONSABILE`.
- Utenti visibile solo ad `ADMIN`.
- Profilo utente in basso con ruolo e apertura `ProfileSheet`.

Header:

- mostra titolo pagina;
- ricerca globale cross-entity su asset, work order, ticket, fornitori e tecnici;
- pannello risultati raggruppati;
- notifiche da `useNotifications`;
- toggle tema light/dark.

## Identita grafica

Asset:

- `src/assets/arenaos-logo-horizontal.svg`
- `public/arenaos-logo-horizontal.svg`
- `src/assets/pallacanestro-varese-logo.png`
- `public/login-seats-bg.jpg`
- `public/login-arena-bg.webp`
- `public/favicon.svg`
- `public/favicon.png`

Stili globali in `src/index.css`:

- font body: Inter;
- font mono: JetBrains Mono;
- font heading: Sora;
- palette primaria: navy `#0b1220`, blue `#1e40af`, cyan `#06b6d4`, background `#f8fafc`;
- component utility principali: `.arena-card`, `.arena-kicker`, `.arena-heading`;
- login con immagine dei seggiolini, overlay chiaro e animazioni `login-light-sweep`, `login-ambient-glow`;
- supporto dark mode tramite variabili CSS e classi `.dark`.

Pattern UI:

- dashboard e pannelli interni usano card bianche, bordo slate chiaro e ombre leggere;
- badge colorati per stati e priorita;
- icone `lucide-react`;
- tabelle operative e dialog per CRUD;
- form pubblici piu morbidi e grandi, con card arrotondate e branding ArenaOS.

## Dashboard

File:

- `src/components/dashboard/Dashboard.tsx`
- `src/hooks/useDashboard.ts`
- `src/components/dashboard/CdaReport.tsx`

La dashboard calcola:

- totale asset;
- conformita;
- asset scaduti;
- work order in corso;
- ticket aperti;
- trend work order chiusi negli ultimi 12 mesi;
- distribuzione stato asset;
- ticket per categoria;
- ticket per ubicazione;
- work order recenti/attivi.

`useDashboard` legge Supabase e mantiene cache client di 60 secondi. La cache viene invalidata da eventi su `work_orders`, `assets`, `tickets`.

`CdaReport` e una vista dedicata a stampa/PDF, con logo, metriche, barre e sezioni report. Usa `window.print()`.

## Asset

File:

- `src/components/assets/AssetsTable.tsx`
- `src/components/assets/AssetCategoryIcon.tsx`
- `src/hooks/useAssets.ts`
- `src/lib/assetUtils.ts`

Categorie asset:

- `Rivelazione incendi`
- `Antincendio`
- `Meccanico`
- `Elettrico`
- `TVCC`

Stati asset:

- `SCADUTO`
- `IN SCADENZA`
- `IN REGOLA`
- `IN LAVORAZIONE`

La logica stato lato frontend e in `calculateAssetStatus`:

- senza `last_verification`: `SCADUTO`;
- prossima verifica passata: `SCADUTO`;
- prossima verifica entro 30 giorni: `IN SCADENZA`;
- altrimenti: `IN REGOLA`.

La pagina Asset permette:

- ricerca globale e locale;
- filtro per stato, categoria, ubicazione, scadenza;
- creazione/modifica/eliminazione asset;
- dettaglio asset;
- parsing matricola in formato `CODICE-UBICAZIONE-###`, tramite `parseAssetSerial`;
- risoluzione ubicazione da codice seriale se necessario.

`useAssets`:

- legge `assets` con join `locations`;
- mantiene cache 60 secondi;
- invalida cache dashboard;
- scrive audit log per create/update/delete.

## Work Orders

File:

- `src/components/work-orders/WorkOrdersList.tsx`
- `src/hooks/useWorkOrders.ts`
- `src/lib/constants.ts`

Stati work order:

- `NEW`
- `PLANNED`
- `ASSIGNED`
- `IN_PROGRESS`
- `SUSPENDED`
- `CLOSED`
- `VALIDATED`
- `ABANDONED`

Tipi:

- `PROGRAMMED`
- `CORRECTIVE`
- `EXTRA`

Priorita:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Flusso stato principale:

`NEW` -> `PLANNED` -> `ASSIGNED` -> `IN_PROGRESS` -> `CLOSED` -> `VALIDATED`

Logiche pagina:

- lista filtrabile per ricerca e stato;
- dialog di creazione/modifica;
- timeline stato interattiva;
- avanzamento rapido stato;
- gestione tecnico e fornitore;
- se tecnico esterno, il fornitore viene auto-compilato dal tecnico;
- chiusura/validazione richiedono `executed_at`;
- stati finali `VALIDATED` e `ABANDONED` non sono modificabili;
- upload/download/delete file rapportini su bucket `rapportini`;
- collegamento da ticket: se arrivo da `/tickets` con `ticketDraft`, apre creazione WO correttivo e poi collega il ticket aggiornandolo a `IN_PROGRESS`.

`useWorkOrders`:

- legge `work_orders` con join asset, technician e supplier;
- cache 60 secondi;
- create/update/delete con audit log;
- invalidazione cache dashboard e asset.

## Rapportini

File:

- `src/components/rapportini/RapportiniView.tsx`

Vista archivio degli allegati caricati sui work order:

- legge work order con `report_files`;
- raggruppa per asset;
- dentro ogni asset mostra i work order;
- dentro ogni work order mostra i file;
- download tramite signed URL Supabase Storage;
- delete permesso solo a `ADMIN` e `RESPONSABILE`;
- dopo delete aggiorna anche `work_orders.report_files`.

## Ticketing

File:

- `src/components/ticketing/PublicTicketForm.tsx`
- `src/components/ticketing/TicketsQueue.tsx`
- `src/hooks/useTickets.ts`
- `api/ticket-notifications.ts`
- `api/send-notification.ts`

Form pubblico `/report-issue`:

- non richiede login;
- raccoglie nome, email, ubicazione, categoria problema, descrizione, eventuale foto;
- valida foto immagine e max 10 MB;
- carica foto su bucket `tickets`;
- inserisce record in `tickets` con stato `OPEN`;
- riceve codice generato da trigger DB;
- chiama `/api/ticket-notifications`.

Categorie problema in `src/lib/constants.ts`:

- Elettrico
- Idraulico
- HVAC / Climatizzazione
- Illuminazione
- Sicurezza / Antincendio
- Strutturale / Edile
- Informatica / IT
- Pulizia / Igiene
- Attrezzature sportive
- Altro

Coda ticket `/tickets`:

- filtra per `OPEN`, `IN_PROGRESS`, `CLOSED`, oppure tutti;
- mostra reporter, email, descrizione, categoria, ubicazione, asset, foto, work order collegato;
- azioni: prendi in carico, chiudi, riapri, elimina;
- "Prendi in carico" naviga a `/work-orders` passando uno stato route `ticketDraft`, che precompila un nuovo work order.

API `/api/ticket-notifications`:

- usa Supabase service role;
- legge profili `RESPONSABILE` attivi;
- crea notifiche in tabella `notifications`;
- se `RESEND_API_KEY` presente, invia email ai responsabili e conferma al segnalatore.

API `/api/send-notification`:

- invio email semplice per asset in scadenza;
- parte solo se `EMAIL_ENABLED === 'true'`.

## Scadenzario

File:

- `src/components/schedule/ScheduleView.tsx`

Logica:

- costruisce un calendario mensile;
- calcola ricorrenze manutentive da `last_verification` + `verification_frequency_days`;
- mostra asset scaduti, in scadenza, pianificati e in corso;
- se un asset ha gia un work order attivo con `planned_date`, lo mostra come pianificato/in corso invece che come semplice scadenza;
- consente creazione work order programmati;
- consente drag/planning di eventi su date;
- filtro per fornitore;
- cambio fornitore su work order pianificati/in corso;
- link/navigazione verso work order specifici.

## Fornitori e tecnici

File:

- `src/components/suppliers/SuppliersTable.tsx`
- `src/hooks/useSuppliers.ts`
- `src/hooks/useTechnicians.ts`

Pagina a tab:

- tab fornitori;
- tab tecnici.

Fornitori:

- nome;
- categoria;
- contatti `phone` e `email` in `contact_info`.

Tecnici:

- nome;
- email;
- specializzazione;
- tipo `INTERNAL` o `EXTERNAL`;
- se `EXTERNAL`, collegamento obbligatorio a fornitore.

La ricerca globale filtra sia fornitori sia tecnici.

## Utenti

File:

- `src/components/users/UsersManagement.tsx`
- `src/hooks/useProfiles.ts`
- `supabase/functions/admin-users/index.ts`

Solo admin. Funzioni:

- lista profili;
- ricerca per nome, email, ruolo;
- creazione utente con password temporanea;
- modifica nome/email/ruolo/stato;
- attivazione/disattivazione;
- refresh lista.

La funzione server `admin-users` usa Supabase Admin API con service role e sincronizza `profiles`.

## Audit log

File:

- `src/components/audit/AuditLogView.tsx`
- `src/lib/auditLog.ts`

Registra create/update/delete per asset e work order, e dove implementato anche altre entita. La pagina:

- legge gli ultimi 200 record da `audit_log`;
- risolve nomi utenti da `profiles`;
- mostra azione, tipo entita, identificativo e data;
- esporta CSV con nome `audit-log-yyyy-MM-dd.csv`.

## Notifiche

File:

- `src/hooks/useNotifications.ts`
- `api/ticket-notifications.ts`

Le notifiche interne sono record in `notifications`. Il ticket pubblico crea notifiche per i responsabili attivi. L'header mostra conteggio non lette e permette di marcare come lette.

## Cache, resilienza e audit

File:

- `src/lib/cacheEvents.ts`
- `src/lib/resilientRequest.ts`
- `src/lib/auditLog.ts`

Pattern:

- hooks principali hanno cache in memoria con TTL.
- `emitCacheInvalidated` e `onCacheInvalidated` coordinano invalidazioni tra moduli.
- `runResilientRequest` applica timeout e retry singolo.
- `withRequestTimeout` usa `AbortSignal`.
- `logAudit` inserisce record in `audit_log` senza bloccare il flusso UI.

## Mappa file rapida

Entry e configurazione:

- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `vite.config.ts`
- `vercel.json`
- `package.json`
- `tsconfig.json`
- `components.json`

UI base:

- `src/components/ui/*`
- `src/index.css`
- `src/lib/utils.ts`

Layout:

- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`

Auth:

- `src/contexts/AuthContext.tsx`
- `src/components/auth/LoginPage.tsx`
- `src/components/auth/ResetPasswordPage.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/lib/authStorage.ts`

Pagine operative:

- `src/components/dashboard/Dashboard.tsx`
- `src/components/dashboard/CdaReport.tsx`
- `src/components/assets/AssetsTable.tsx`
- `src/components/work-orders/WorkOrdersList.tsx`
- `src/components/rapportini/RapportiniView.tsx`
- `src/components/ticketing/PublicTicketForm.tsx`
- `src/components/ticketing/TicketsQueue.tsx`
- `src/components/schedule/ScheduleView.tsx`
- `src/components/suppliers/SuppliersTable.tsx`
- `src/components/audit/AuditLogView.tsx`
- `src/components/users/UsersManagement.tsx`
- `src/components/profile/ProfileSheet.tsx`

Hooks dati:

- `src/hooks/useAssets.ts`
- `src/hooks/useWorkOrders.ts`
- `src/hooks/useTickets.ts`
- `src/hooks/useDashboard.ts`
- `src/hooks/useLocations.ts`
- `src/hooks/useSuppliers.ts`
- `src/hooks/useTechnicians.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/useProfiles.ts`

Librerie interne:

- `src/lib/supabase.ts`
- `src/lib/assetUtils.ts`
- `src/lib/constants.ts`
- `src/lib/cacheEvents.ts`
- `src/lib/resilientRequest.ts`
- `src/lib/auditLog.ts`
- `src/lib/resend.ts`

API e backend:

- `api/ticket-notifications.ts`
- `api/send-notification.ts`
- `supabase/functions/admin-users/index.ts`
- `supabase/functions/admin-users/config.toml`

Database/import:

- `supabase_schema.sql`
- `import/bootstrap_supabase_schema.sql`
- `import/patch_asset_maintenance_logic.sql`
- `import/patch_ticket_workflow.sql`
- `import/patch_notifications.sql`
- `import/patch_ticket_management_policies.sql`
- `import/patch_public_ticket_locations.sql`
- `import/patch_frequency_by_category.sql`
- `import/patch_performance_indexes.sql`
- `import/generated_assets_import.sql`
- `import/generated_assets_preview.json`
- `scripts/prepare_asset_import.py`

Seed/demo:

- `supabase/seed/fake_assets_200.csv`
- `supabase/seed/import_fake_assets.sql`
- `supabase/seed/seed_demo_locations.sql`

## Nota per Claude

Quando lavori su ArenaOS:

- preferisci mantenere i pattern esistenti: hooks per dati, dialog locali per CRUD, toast `sonner`, componenti `src/components/ui`, icone lucide;
- rispetta ruoli e route protette;
- evita di introdurre nuove librerie se il pattern esistente basta;
- per modifiche dati usa i hook esistenti, cosi restano cache, audit e invalidazioni;
- per UI mantieni identita ArenaOS: navy/cyan/blue, card operative leggere, font Inter/Sora, badge stato coerenti;
- non cambiare schema DB senza aggiornare anche tipi TypeScript, hooks e documento SQL/patch relativo.