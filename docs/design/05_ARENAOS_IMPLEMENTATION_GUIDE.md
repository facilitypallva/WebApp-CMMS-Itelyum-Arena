# 05_ARENAOS_IMPLEMENTATION_GUIDE.md

Guida implementativa operativa per portare il redesign ArenaOS nella repo React/Vite/Tailwind/HeroUI.

Questo file raccoglie il Capitolo 7 del redesign.

Da usare insieme a:
- `01_ARENAOS_DESIGN_SYSTEM.md`
- `02_ARENAOS_APP_SHELL.md`
- `03_ARENAOS_CORE_SCREENS.md`
- `04_ARENAOS_SECONDARY_SCREENS.md`

Obiettivo:
- Implementare il redesign senza cambiare logica dati, route, ruoli, Supabase o schema DB.
- Procedere per step incrementali, mantenendo l’app funzionante dopo ogni step.
- Usare il design system come fonte di verità per UI, tokens, componenti e pattern.

---

1. Strategia di Implementazione
Principio guida
Ridisegna lo strato visivo senza toccare la logica. Hooks, route, query Supabase, schema DB, contesti auth, RLS rimangono invariati. Cambiamo: design tokens, componenti UI, layout, tipografia, palette, micro-interazioni.
Approccio: "Design system first, screens after"
1 Costruisci il design system come fondazione (tokens + componenti base + HeroUI provider).
2 Refactora App Shell (sidebar + header + layout) — è il container di tutto.
3 Refactora le pagine in ordine di criticità operativa (Dashboard  Assets  Work Orders  resto).
4 Public pages e pagine admin alla fine (meno frequentate).
5 QA finale + cleanup vecchi stili.
Vincoli operativi
 Non riscrivere hooks (useAssets, useWorkOrders, etc.). Possono richiedere micro-aggiustamenti per nuovi field UI ma la logica resta.
 Non cambiare API/contracts: i tipi in src/types/* restano invariati salvo aggiunte UI-only (es. computed displayLabel).
 Mantenere ProtectedRoute e logica permessi: solo cambia il rendering della UI, non la guard.
 Non rompere l'app durante implementazione: ogni step deve lasciare l'app funzionante (usare branch + PR incrementali).
Strategia di compatibilità durante migrazione
Durante la migrazione coesistono per qualche giorno:
 Vecchi componenti UI in src/components/ui/* (shadcn-style esistenti).
 Nuovi componenti basati su HeroUI in src/components/ui-v2/*.
Le pagine vengono migrate una alla volta a ui-v2. A migrazione completata: rimuovere ui-v2 rinominandolo ui e cancellare il vecchio.
Dark mode
Il brand kit Fase 1 è specifico per light mode. La sidebar è dark per design (parte del light mode). Il dark mode globale viene disabilitato in v1 del redesign — togglie nascosto o forzato a light. Decisione esplicita: l'app gira solo in light mode, dark mode rimandato a v2 con palette dedicata.

2. Ordine di Implementazione
Step 0 — Setup e fondazione (1 giornata)
 Setup HeroUI provider in src/App.tsx.
 Configurazione Tailwind 4 con tokens ArenaOS in src/index.css.
 Self-hosting Inter via @fontsource/inter o file locali.
 Creazione src/lib/tokens.ts con tutti i design tokens TypeScript.
 Creazione cartella src/components/ui-v2/ per nuovi componenti.
Step 1 — Design system base (2 giornate)
 Componenti primitivi: Button, Input, Select, Textarea, Badge (Chip wrapper), Card, Avatar, Switch, Checkbox, Tooltip.
 Componenti compositi: EmptyState, ErrorState, SkeletonRow, SavingIndicator, PageHeader.
 Storybook opzionale (consigliato) per validare componenti in isolamento.
Step 2 — App Shell (2 giornate)
 Sidebar rinnovata (dark, item compatti, indicator verde).
 Header rinnovato (search, theme toggle dummy, notifications).
 AppLayout aggiornato con grid + spacing.
 ProfileSheet migrato a Drawer destro.
 GlobalSearch come Popover con risultati raggruppati.
 NotificationsPanel come Popover.
Step 3 — Dashboard (1.5 giornate)
 DashboardPage refactor.
 KPI cards.
 Trend chart (Recharts con styling brand).
 Donut Stato Asset.
 Bar charts ticket.
 Tabella WO recenti (versione compatta).
 Alert operativi bar.
Step 4 — Assets (2 giornate)
 AssetsTable rinnovata.
 Toolbar filtri con chips.
 Drawer dettaglio asset (sostituisce modal).
 Modal crea/modifica asset.
 Bulk actions bar.
 Empty/error states.
Step 5 — Work Orders (2.5 giornate)
 WorkOrdersList con view toggle Tabella/Card.
 Status tabs.
 Toolbar filtri WO.
 Drawer dettaglio WO con timeline stepper.
 Modal crea/modifica WO.
 Card view alternativa.
Step 6 — Schermate rimanenti (3 giornate)
 Vehicles + Vehicle drawer + booking calendar.
 Schedule (calendario mese/settimana/lista).
 Tickets queue + ticket drawer.
 Rapportini view.
 Suppliers + Technicians (tab).
 Users management (admin).
 Audit log timeline.
 CDA Report layout standalone.
Step 7 — Pagine pubbliche (1 giornata)
 Login redesign.
 Reset password.
 Public ticket form.
 Public booking form.
Step 8 — Cleanup + QA (1 giornata)
 Rimuovi vecchi componenti src/components/ui/*.
 Rinomina ui-v2  ui.
 Rimuovi font Sora, JetBrains Mono, Geomanist (solo Inter).
 Rimuovi vecchi token CSS dal vecchio palette dark.
 QA completo (vedi §11).
 Build production + bundle analysis.
Totale stimato: ~16 giornate sviluppo (~3 settimane con 1 dev full-time, ~1.5 settimane con 2 dev).

3. File da Modificare
Configurazione
 package.json — aggiungere @heroui/react, @heroui/theme, framer-motion, @fontsource/inter (o equivalenti). Rimuovere font non usati.
 tailwind.config.ts (o tailwind.config.js) — plugin HeroUI, content paths, theme extension con tokens ArenaOS.
 src/index.css — riscrittura completa: rimuovi vecchi token dark, aggiungi tokens light brand kit, font Inter import.
 vite.config.ts — invariato (salvo eventuale alias path).
 tsconfig.json — invariato.
Entry e bootstrap
 src/main.tsx — invariato.
 src/App.tsx — wrap con HeroUIProvider, rimuovi ThemeProvider (o forza forcedTheme="light").
Layout (riscrittura completa)
 src/components/layout/AppLayout.tsx
 src/components/layout/Sidebar.tsx
 src/components/layout/Header.tsx
 src/components/profile/ProfileSheet.tsx
Auth (visual redesign, logica invariata)
 src/components/auth/LoginPage.tsx
 src/components/auth/ResetPasswordPage.tsx
Pagine moduli (refactor visual)
 src/components/dashboard/Dashboard.tsx
 src/components/dashboard/CdaReport.tsx
 src/components/assets/AssetsTable.tsx + correlati
 src/components/work-orders/WorkOrdersList.tsx + correlati
 src/components/ticketing/TicketsQueue.tsx
 src/components/ticketing/PublicTicketForm.tsx
 src/components/schedule/ScheduleView.tsx
 src/components/schedule/DragDropMotion.tsx
 src/components/vehicles/VehiclesPage.tsx + correlati
 src/components/vehicles/PublicBookingForm.tsx
 src/components/suppliers/SuppliersTable.tsx
 src/components/users/UsersManagement.tsx
 src/components/audit/AuditLogView.tsx
 src/components/rapportini/RapportiniView.tsx
UI base (sostituire o coesistere)
 src/components/ui/* — vecchi shadcn components: deprecare e sostituire con src/components/ui-v2/*.
Hooks (invariati)
 src/hooks/* — non toccare logica. Eventuali aggiunte sono UI-only (es. derived state per nuove visualizzazioni).
Tipi (invariati)
 src/types/* — non toccare. Aggiungere eventuali tipi UI-only in src/components/ui-v2/types.ts se necessari.
Lib (invariate)
 src/lib/supabase.ts, src/lib/auditLog.ts, src/lib/cacheEvents.ts, src/lib/resilientRequest.ts — non toccare.
 NUOVO: src/lib/tokens.ts — tokens TypeScript per uso programmatico.
 src/lib/utils.ts — eventuali helper UI nuovi (es. formatItalianDate, formatCurrency).
Asset
 src/assets/arenaos-logo-horizontal.svg — verificare che sia coerente con nuovo brand (mantenere se ok).
 src/assets/arenaos-logo-white.svg — usare in sidebar.
 Rimuovere public/fonts/GeomanistMedium.ttf se non più usato.

4. Componenti Base da Creare
Tutti i componenti vanno in src/components/ui-v2/. Sono wrapper o estensioni di HeroUI con styling brand pre-applicato.
Primitivi (wrapper HeroUI)

	Componente	File	Note
	Button	Button.tsx	Variants: primary, secondary, ghost, destructive, destructiveSolid, link. Sizes: sm, md, lg. Icon-only support.
	Input	Input.tsx	Wrapper HeroUI Input con startContent/endContent props per icone.
	Textarea	Textarea.tsx	Wrapper HeroUI Textarea.
	Select	Select.tsx	Wrapper HeroUI Select con custom render item.
	Autocomplete	Autocomplete.tsx	Wrapper HeroUI Autocomplete per asset/tecnico/fornitore selectors.
	DatePicker	DatePicker.tsx	Wrapper HeroUI DatePicker con locale italiano.
	Badge	Badge.tsx	Wrapper HeroUI Chip con variants: success, warning, error, neutral, info, infoDark, criticalSolid. Size sm/md. Support dot leading.
	StatusBadge	StatusBadge.tsx	Specialized badge per status WO/Asset/Ticket con dot leading e UPPERCASE.
	PriorityBadge	PriorityBadge.tsx	Specialized badge per priority (LOW/MEDIUM/HIGH/CRITICAL).
	TypeBadge	TypeBadge.tsx	Badge no-dot per type WO.
	Avatar	Avatar.tsx	Wrapper HeroUI Avatar con fallback iniziali calcolato.
	Card	Card.tsx	Variants: default, kpi, embedded, featured. Border default, no shadow.
	Switch	Switch.tsx	Wrapper HeroUI Switch verde brand.
	Checkbox	Checkbox.tsx	Wrapper HeroUI Checkbox verde brand.
	RadioGroup	RadioGroup.tsx	Wrapper HeroUI.
	Tooltip	Tooltip.tsx	Wrapper HeroUI Tooltip dark variant.
	Tabs	Tabs.tsx	Variants: underlined (drawer), solid (status tabs), bordered (segmented).
	Popover	Popover.tsx	Wrapper HeroUI Popover.
	Dropdown	Dropdown.tsx	Wrapper HeroUI Dropdown.
	Modal	Modal.tsx	Wrapper HeroUI Modal con sizes sm/md/lg.
	Drawer	Drawer.tsx	Wrapper HeroUI Drawer con placement right/left.
	Skeleton	Skeleton.tsx	Wrapper HeroUI Skeleton con shimmer brand.
	Spinner	Spinner.tsx	Wrapper HeroUI Spinner verde.
	Pagination	Pagination.tsx	Wrapper HeroUI Pagination.
	Progress	Progress.tsx	Wrapper HeroUI Progress (per route-change top bar).
	Compositi (custom non disponibili in HeroUI)
Componente	File	Note
	PageHeader	PageHeader.tsx	Container subheader con breadcrumb + title + subtitle + actions.
	Breadcrumbs	Breadcrumbs.tsx	Custom breadcrumbs con separator /, last segment bold.
	EmptyState	EmptyState.tsx	Layout standard con icon + title + description + CTA + secondary link.
	ErrorState	ErrorState.tsx	Variant error di EmptyState con icon AlertCircle.
	LoadingState	LoadingState.tsx	Skeleton scaffold per pagine.
	KpiCard	KpiCard.tsx	Card KPI con label uppercase + number tabular-nums + delta.
	AlertBar	AlertBar.tsx	Banner inline warning/critical con icon + content + CTA.
	Toolbar	Toolbar.tsx	Container filter chips + search + counter.
	FilterChip	FilterChip.tsx	Trigger filter dropdown con stato attivo/inattivo.
	ActiveFilterChip	ActiveFilterChip.tsx	Chip dark removibile per filtri attivi.
	BulkActionsBar	BulkActionsBar.tsx	Bar dark con count + actions per selezione multipla.
	SavingIndicator	SavingIndicator.tsx	Indicator footer drawer con stati idle/saving/saved/error.
	TimelineStepper	TimelineStepper.tsx	Stepper orizzontale per WO timeline (custom).
	AuditTimelineItem	AuditTimelineItem.tsx	Item lista audit log con icon colorato + chips action/entity.
	FileUploader	FileUploader.tsx	Drag&drop area + lista file (con react-dropzone).
	SignatureCanvas	SignatureCanvas.tsx	Canvas firma per public booking form.
	PasswordStrengthMeter	PasswordStrengthMeter.tsx	Bar segmentata + checklist requisiti.
	CategoryIcon	CategoryIcon.tsx	Container 32×32 con bg colore categoria + icona lucide-react.
	Helpers / utilities
File	Contenuto
	src/lib/tokens.ts	Export TS dei tokens per uso programmatico (es. colori in chart Recharts).
	src/lib/dateFormat.ts	formatItalianDate(date), formatRelativeDate(date), formatDateTime(date).
	src/lib/currency.ts	formatEuro(value) con formato italiano.
	src/lib/avatarFallback.ts	getInitials(name) per Avatar fallback.
	src/lib/badgeMaps.ts	Mapping enum  variant + label IT per Status/Priority/Type.

5. Theme Tokens
File src/index.css (sostituzione completa)
Struttura:
@import "tailwindcss";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";

@theme {
 /* Color tokens */
 --color-bg-app: #FAFAF9;
 --color-bg-surface: #F1EFE8;
 --color-bg-card: #FFFFFF;
 --color-bg-sidebar: #1C1B18;

 --color-text-primary: #1C1B18;
 --color-text-secondary: #5F5E5A;
 --color-text-muted: #888780;
 --color-text-on-dark: #FAFAF9;
 --color-text-on-dark-muted: #A8A6A0;

 --color-border-default: #E5E4DF;
 --color-border-strong: #D3D1C7;

 --color-primary: #2ECC71;
 --color-primary-hover: #27B463;
 --color-primary-pressed: #1F9651;
 --color-primary-dark-text: #0A3D1F;

 --color-success-bg: #EAFBF1;
 --color-success-text: #1A7A3C;
 --color-warning-bg: #FFF3E8;
 --color-warning-text: #A8531A;
 --color-warning-accent: #E8782A;
 --color-error-bg: #FFF0EE;
 --color-error-text: #A83228;
 --color-error-accent: #E24B4A;

 /* Font family */
 --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

 /* Radius scale */
 --radius-xs: 4px;
 --radius-sm: 6px;
 --radius-md: 8px;
 --radius-lg: 10px;
 --radius-xl: 12px;
 --radius-2xl: 16px;

 /* Shadow scale */
 --shadow-xs: 0 1px 2px 0 rgba(28, 27, 24, 0.04);
 --shadow-sm: 0 2px 4px 0 rgba(28, 27, 24, 0.05), 0 1px 2px 0 rgba(28, 27, 24, 0.04);
 --shadow-md: 0 4px 12px -2px rgba(28, 27, 24, 0.08), 0 2px 4px -2px rgba(28, 27, 24, 0.04);
 --shadow-lg: 0 12px 32px -8px rgba(28, 27, 24, 0.16), 0 4px 8px -4px rgba(28, 27, 24, 0.06);

 /* Focus rings */
 --shadow-focus-primary: 0 0 0 3px rgba(46, 204, 113, 0.20);
 --shadow-focus-error: 0 0 0 3px rgba(226, 75, 74, 0.20);

 /* Letter spacing */
 --tracking-tight: -0.02em;
 --tracking-snug: -0.01em;
 --tracking-normal: 0;
 --tracking-wide: 0.04em;
 --tracking-wider: 0.06em;
 --tracking-widest: 0.10em;
}

/* Base styles */
html, body {
 font-family: var(--font-sans);
 background: var(--color-bg-app);
 color: var(--color-text-primary);
 font-feature-settings: "cv11", "ss01", "ss03";
}

/* Tabular nums utility */
.tabular-nums {
 font-variant-numeric: tabular-nums;
}

/* Skeleton shimmer animation */
@keyframes shimmer {
 0% { background-position: -200% 0; }
 100% { background-position: 200% 0; }
}

.skeleton-shimmer {
 background: linear-gradient(90deg, var(--color-bg-surface) 0%, var(--color-border-default) 50%, var(--color-bg-surface) 100%);
 background-size: 200% 100%;
 animation: shimmer 1.5s ease-in-out infinite;
}

/* Pulse for status IN_PROGRESS dot */
@keyframes status-pulse {
 0%, 100% { transform: scale(1); opacity: 1; }
 50% { transform: scale(1.3); opacity: 0.6; }
}

.status-pulse {
 animation: status-pulse 1.5s ease-in-out infinite;
}
File src/lib/tokens.ts (mirror TypeScript)
export const tokens = {
 color: {
 bg: { app: "#FAFAF9", surface: "#F1EFE8", card: "#FFFFFF", sidebar: "#1C1B18" },
 text: { primary: "#1C1B18", secondary: "#5F5E5A", muted: "#888780", onDark: "#FAFAF9", onDarkMuted: "#A8A6A0" },
 border: { default: "#E5E4DF", strong: "#D3D1C7" },
 primary: { base: "#2ECC71", hover: "#27B463", pressed: "#1F9651", darkText: "#0A3D1F" },
 success: { bg: "#EAFBF1", text: "#1A7A3C" },
 warning: { bg: "#FFF3E8", text: "#A8531A", accent: "#E8782A" },
 error: { bg: "#FFF0EE", text: "#A83228", accent: "#E24B4A" },
 },
 // ... radius, shadow, spacing
} as const;
Usato per chart colors (Recharts), per inline styles dinamici, per badge color mapping.

6. Configurazione Inter Self-hosted
Opzione A — @fontsource/inter (raccomandato per semplicità)
npm install @fontsource/inter
In src/index.css:
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";
Opzione B — File locali (controllo completo)
Scarica Inter Variable da rsms.me/inter e metti i file in public/fonts/inter/.
In src/index.css:
@font-face {
 font-family: "Inter";
 font-style: normal;
 font-weight: 100 900;
 font-display: swap;
 src: url("/fonts/inter/InterVariable.woff2") format("woff2-variations");
}
Verifica
// In console DevTools
document.fonts.check('600 14px Inter')
// Deve restituire true
Cleanup font esistenti

 Rimuovi import di Sora, Geomanist, JetBrains Mono dal vecchio CSS.
 Rimuovi file in public/fonts/GeomanistMedium.ttf.
 Rimuovi classi .arena-heading (Sora) — sostituire con classi Inter.

7. Mapping HeroUI Completo

	Elemento brand kit	Componente HeroUI	Custom config necessaria
	Button primary	Button color="primary"	Override theme: primary.DEFAULT = #2ECC71
	Button secondary	Button variant="bordered" color="default"	Border color custom
	Button ghost	Button variant="light"	OK default
	Button destructive	Button variant="bordered" color="danger"	OK
	Button destructive solid	Button color="danger"	OK
	Input	Input variant="bordered"	Override radius, focus ring
	Textarea	Textarea variant="bordered"	OK
	Select	Select variant="bordered"	OK
	Autocomplete	Autocomplete variant="bordered"	OK
	DatePicker	DatePicker	locale italiano import { I18nProvider } from "@react-aria/i18n"
	Badge	Chip variant="flat" + custom colors	Mapping color  status
	Avatar	Avatar	OK con name prop per iniziali
	Card	Card shadow="none"	Bordo via classNames
	Switch	Switch color="primary"	OK
	Checkbox	Checkbox color="primary"	OK
	RadioGroup	RadioGroup color="primary"	OK
	Tooltip	Tooltip color="foreground"	Bg dark custom
	Tabs underlined	Tabs variant="underlined" color="primary"	OK
	Tabs solid	Tabs variant="solid"	Custom bg dark
	Tabs bordered (segmented)	Tabs variant="bordered"	Custom
	Popover	Popover placement	OK
	Dropdown	Dropdown + DropdownMenu	OK
	Modal	Modal size + backdrop	Backdrop color custom
	Drawer	Drawer placement	OK
	Skeleton	Skeleton	Custom shimmer color
	Spinner	Spinner color="primary"	OK
	Pagination	Pagination	Custom colors
	Progress	Progress color="primary"	OK
	Breadcrumbs	Breadcrumbs separator="/"	Custom rendering
	Table	Table removeWrapper	Custom header bg, row height
	Accordion	Accordion	OK
	Toast	sonner (mantenere)	Theme custom toast
	Configurazione HeroUI Theme
In tailwind.config.ts:
import { heroui } from "@heroui/react";

export default {
 content: [
 "./src/**/*.{js,ts,jsx,tsx}",
 "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
 ],
 plugins: [
 heroui({
 themes: {
 light: {
 colors: {
 background: "#FAFAF9",
 foreground: "#1C1B18",
 primary: {
 DEFAULT: "#2ECC71",
 foreground: "#0A3D1F",
 50: "#EAFBF1",
 500: "#2ECC71",
 600: "#27B463",
 700: "#1F9651",
 },
 success: {
 DEFAULT: "#2ECC71",
 foreground: "#1A7A3C",
 50: "#EAFBF1",
 },
 warning: {
 DEFAULT: "#E8782A",
 foreground: "#A8531A",
 50: "#FFF3E8",
 },
 danger: {
 DEFAULT: "#E24B4A",
 foreground: "#A83228",
 50: "#FFF0EE",
 },
 default: {
 DEFAULT: "#F1EFE8",
 foreground: "#5F5E5A",
 },
 content1: "#FFFFFF",
 divider: "#E5E4DF",
 },
 layout: {
 radius: {
 small: "6px",
 medium: "8px",
 large: "10px",
 },
 fontSize: {
 tiny: "11px",
 small: "13px",
 medium: "14px",
 large: "16px",
 },
 },
 },
 },
 }),
 ],
};
In src/App.tsx:
import { HeroUIProvider } from "@heroui/react";

<HeroUIProvider>
 {/* resto app */}
</HeroUIProvider>

8. Cosa Mantenere della Repo Attuale
Logica e infrastruttura (NON toccare)

 src/contexts/AuthContext.tsx — auth Supabase.
 src/components/auth/ProtectedRoute.tsx — guard route.
 src/lib/supabase.ts — client.
 src/lib/auditLog.ts — audit logger.
 src/lib/cacheEvents.ts — invalidation events.
 src/lib/resilientRequest.ts — retry logic.
 Tutti gli hooks in src/hooks/* (useAssets, useWorkOrders, useTickets, useVehicles, useVehicleBookings, useTechnicians, useSuppliers, useProfiles, useDashboard, useNotifications).
 Tutti i tipi in src/types/*.
 API routes in api/*.
 Schema Supabase + migrations in supabase/*.
 vite.config.ts, tsconfig.json, vercel.json.
Asset
 src/assets/arenaos-logo-horizontal.svg (verificare in light/dark).
 src/assets/arenaos-logo-white.svg (per sidebar).
 Logo Pallacanestro Varese (mantenere per pagine pubbliche e CDA report).
 Background images login (public/login-seats-bg.jpg, public/login-arena-bg.webp).
 Favicon.
Routing
 src/App.tsx lazy loading + route — invariata (solo update HeroUI provider wrapper).
 Tutti i path route /, /assets, /work-orders, etc.
Toast library
 sonner mantenuto per toast — applicare solo theme brand custom.
State management e fetching
 Pattern di cache custom (TTL 60s) — mantenere.
 Resilient request wrapper — mantenere.
Tooling
 ESLint, Prettier, TS configs — mantenere.
 Storybook (se presente) — mantenere e aggiornare con nuovi componenti.

9. Cosa Sostituire
Componenti UI legacy
 src/components/ui/* — tutti i componenti shadcn-style esistenti.
 Strategia: creare in parallelo src/components/ui-v2/* con HeroUI.
 Migrare pagine una alla volta a ui-v2.
 Al completamento: cancellare ui/, rinominare ui-v2/  ui/.
 Aggiornare imports in tutto il progetto.
CSS/Tokens legacy
 Sostituire src/index.css interamente:
 Vecchia palette dark (--arena-bg, #0f0f11, #15171c, etc.).
 Vecchi font Sora, Geomanist, JetBrains Mono.
 Vecchie classi .arena-heading, .arena-dark-dialog, etc.
Theme provider
 next-themes può essere mantenuto ma forzato a light (forcedTheme="light") o rimosso.
 Decisione raccomandata: rimuoverlo in v1 e reintrodurlo in v2 quando si farà dark mode.
Modal di dettaglio asset/WO
 Sostituire modal centrato con Drawer destro (decisione design Fase 4 e 5).
 Modal centrato resta per crea/modifica.
Bottoni primary blu
 Tutti i bg-blue-*, bg-indigo-* o classi simili nei componenti esistenti.
 Sostituire con color="primary" (HeroUI) che mappa a #2ECC71.
Layout dark dell'app
 Tutto il pattern dark globale dell'app interna.
 Sidebar resta dark (per design), ma content area e tutti i componenti diventano light.
Font
 Rimuovere Sora, Geomanist, JetBrains Mono da package.json, da CSS, da public/fonts/.

10. Rischi Principali
Rischio 1 — Migrazione UI rompe pagine durante il refactor
Mitigazione:
 Coesistenza ui + ui-v2 durante transizione.
 Migrazione pagina-per-pagina con PR atomiche.
 Test smoke per ogni route dopo ogni PR.
Rischio 2 — HeroUI v2 vs Tailwind 4 incompatibilità
Mitigazione:
 Verificare versioni compatibili al setup iniziale.
 HeroUI richiede Tailwind 3 al momento (verificare): se conflitto, downgrade a Tailwind 3 o usare HeroUI canary.
 Step 0 deve includere PoC funzionante con Tailwind + HeroUI prima di procedere.
Rischio 3 — Date picker italiano non funziona out-of-the-box
Mitigazione:
 Configurare @react-aria/i18n con locale it-IT.
 Test specifico su date picker in modal asset/WO.
Rischio 4 — Performance bundle (HeroUI + Recharts + Inter)
Mitigazione:
 Bundle analysis con vite-bundle-visualizer.
 Tree-shaking HeroUI: importare singoli componenti import { Button } from "@heroui/button" invece di @heroui/react.
 Lazy-load Recharts dove possibile (Dashboard, CDA report).
 Inter Variable file ~80kb gzip — accettabile.
Rischio 5 — Drawer + Modal conflitti z-index
Mitigazione:
 Z-index scale documentata in CSS: drawer 55, modal 60, toast 70.
 Test apertura modal sopra drawer (modifica asset da dettaglio).
Rischio 6 — Stati WO custom (timeline stepper) richiedono custom build
Mitigazione:
 HeroUI non ha Stepper nativo. Build custom con flex + circles + connectors.
 Componente TimelineStepper ben isolato in ui-v2/.
Rischio 7 — Recharts non rispetta token design system
Mitigazione:
 Passare colori da tokens.ts a Recharts via prop.
 Wrapper BrandedAreaChart, BrandedDonutChart in ui-v2/charts/.
 Custom Tooltip component con styling brand.
Rischio 8 — Print mode CDA report rotto
Mitigazione:
 Stili @media print dedicati dal giorno 1.
 Test stampa fisica + Print Preview (anteprima Chrome) prima di considerare CDA fatto.
 Opzione: usare react-to-print lib per controllo completo.
Rischio 9 — Italiano locale / format date / format euro inconsistente
Mitigazione:
 Helpers centralizzati in src/lib/dateFormat.ts e src/lib/currency.ts.
 ESLint rule custom (o code review) per vietare toLocaleString() inline e forzare uso helpers.
Rischio 10 — Permessi UI vs backend disallineati
Mitigazione:
 Mantenere useAuth() hook esistente per derive ruolo.
 UI nasconde elementi non permessi via if (role === 'ADMIN') come oggi.
 Backend RLS rimane fonte di verità: non rimuovere check server-side anche se UI nasconde.
Rischio 11 — File uploader (rapportini, foto ticket, foto veicoli) refactor
Mitigazione:
 Lib react-dropzone per drag&drop.
 Logica upload Supabase Storage invariata (riusare hook esistente).
 Componente FileUploader in ui-v2/ riutilizzato in 4 punti (Asset, WO, Ticket, Vehicle).
Rischio 12 — Sonner toast non rispetta brand
Mitigazione:
 Configurare <Toaster theme="light" toastOptions={{...}}> con classNames custom.
 Wrapper notifySuccess, notifyError in src/lib/notify.ts per coerenza.

11. Checklist QA
Visuale
 [ ] Inter caricato correttamente, no font fallback visibile.
 [ ] Background app #FAFAF9 su tutte le pagine protette.
 [ ] Sidebar dark #1C1B18 con item attivo verde.
 [ ] Nessun colore blu nell'app interna (ricerca regex blue|indigo|navy in CSS/JSX).
 [ ] Tutti i bottoni primary verdi #2ECC71.
 [ ] Border #E5E4DF come separatore primario, no shadow pesanti.
 [ ] KPI numbers in 32px / 700 / tabular-nums.
 [ ] Badge UPPERCASE 11px / 600 / tracked.
 [ ] Status dot leading sui badge status.
 [ ] Tabular-nums applicato su date, codici, KPI.
Funzionale (per pagina)
 [ ] Login: form funziona, error inline, redirect post-login OK.
 [ ] Reset password: token validation OK, password meter visibile, success state OK.
 [ ] Dashboard: KPI corretti, charts rendono, empty/loading/error state OK.
 [ ] Assets: tabella + drawer + modal create/edit + bulk actions + filtri.
 [ ] Work Orders: tabella + card view + drawer + timeline + modal + avanzamento stato.
 [ ] Tickets: lista + drawer + conversione in WO funziona.
 [ ] Vehicles: lista + calendar view + drawer + sidebar scadenze/booking.
 [ ] Schedule: calendar render + drag&drop + view toggle.
 [ ] Rapportini: accordion + preview + download.
 [ ] Suppliers/Technicians: tab + card grid + drawer + modal.
 [ ] Users: tabella + modal create/edit + permessi admin.
 [ ] Audit Log: timeline + filtri + export CSV.
 [ ] CDA Report: vista standalone + print preview OK + export PDF OK.
 [ ] Public ticket form: submit + foto upload + success state.
 [ ] Public booking form: submit + signature canvas + success state.
Responsive
 [ ] Desktop 1440px: tutto layout corretto.
 [ ] Desktop 1024px: sidebar fissa, content adattato.
 [ ] Tablet 7681023px: sidebar collapsed icon-only, page actions adatte.
 [ ] Mobile <768px: drawer sidebar, search collapsed, table  card view, page actions in overflow.
 [ ] Touch device: drag&drop signature funzionano.
Accessibilità
 [ ] Focus visible su tutti i bottoni/input (anello verde 3px).
 [ ] Aria-label su icon-only buttons.
 [ ] Keyboard navigation funzionante (Tab, Esc, Enter).
 [ ] Trap focus in modal/drawer.
 [ ] Skip-to-content link disponibile.
 [ ] Lighthouse accessibility score >90.
Performance
 [ ] First Contentful Paint <1.5s su 4G simulato.
 [ ] Bundle size: vendors <300kb gzip, app <200kb gzip.
 [ ] No layout shift su skeleton  content.
 [ ] Lazy loading route funziona.
Cross-browser
 [ ] Chrome desktop + Android.
 [ ] Safari desktop + iOS.
 [ ] Firefox desktop.
 [ ] Edge desktop.
Print
 [ ] CDA report stampa A4 corretta.
 [ ] No header/sidebar in stampa.
 [ ] Charts stampabili in B/N (no perdita info).
Dati
 [ ] Hooks invariati continuano a funzionare.
 [ ] Cache TTL 60s rispettata.
 [ ] RLS Supabase non aggirato.
 [ ] Audit log registra eventi correttamente.
Cleanup
 [ ] No vecchi componenti src/components/ui/* orfani.
 [ ] No vecchi font Sora/Geomanist/JetBrains.
 [ ] No classi .arena-dark-dialog o simili.
 [ ] No imports non usati.
 [ ] Lint pulito.
 [ ] Test esistenti passano.

12. Prompt Operativo Step 1 — Setup + Design System base
Per Claude Code / Cursor / agente coding
Sei un senior frontend engineer che lavora su ArenaOS, una React 19 + Vite + Tailwind 4 SPA per facility management di arene sportive.

CONTESTO
Stiamo implementando un redesign visivo completo. La logica (hooks, route, Supabase, RLS, types) NON cambia. Cambia solo il design system, i componenti UI, il layout e gli stili.

OBIETTIVO STEP 1
Setup foundation del nuovo design system ArenaOS:
1. Installare HeroUI + dipendenze.
2. Configurare Inter self-hosted via @fontsource/inter.
3. Creare design tokens in src/index.css e src/lib/tokens.ts.
4. Configurare HeroUIProvider in src/App.tsx.
5. Configurare tailwind.config con plugin HeroUI e tema custom.
6. Creare cartella src/components/ui-v2/ con i componenti primitivi base.

VINCOLI ASSOLUTI
- NON toccare src/hooks/*
- NON toccare src/types/*
- NON toccare src/lib/supabase.ts, auditLog.ts, cacheEvents.ts, resilientRequest.ts
- NON toccare src/contexts/AuthContext.tsx
- NON toccare api/* o supabase/*
- NON cambiare le route in App.tsx, solo wrappare con HeroUIProvider
- NON rimuovere ancora i vecchi componenti src/components/ui/* (coesisteranno temporaneamente)

DESIGN TOKENS (palette ArenaOS)
- bg-app: #FAFAF9, bg-surface: #F1EFE8, bg-card: #FFFFFF, bg-sidebar: #1C1B18
- text-primary: #1C1B18, text-secondary: #5F5E5A, text-muted: #888780
- text-on-dark: #FAFAF9, text-on-dark-muted: #A8A6A0
- border-default: #E5E4DF, border-strong: #D3D1C7
- primary: #2ECC71, primary-hover: #27B463, primary-pressed: #1F9651, primary-dark-text: #0A3D1F
- success-bg: #EAFBF1, success-text: #1A7A3C
- warning-bg: #FFF3E8, warning-text: #A8531A, warning-accent: #E8782A
- error-bg: #FFF0EE, error-text: #A83228, error-accent: #E24B4A

FONT
- Inter only, weights 400/500/600/700.
- font-feature-settings: "cv11", "ss01", "ss03".
- Tabular-nums utility class.

RADIUS
- xs 4, sm 6, md 8, lg 10, xl 12, 2xl 16.
- Default app interna 8-10px.

SHADOW
- xs, sm, md, lg + focus ring primary e error.
- Border è strumento gerarchico primario, shadow è sussidiaria.

TASK CONCRETI

1. INSTALLAZIONE DIPENDENZE
 - npm install @heroui/react framer-motion @fontsource/inter
 - Verifica compatibilità con Tailwind 4. Se HeroUI richiede Tailwind 3, segnalalo prima di procedere e proponi soluzione (downgrade vs canary).

2. SCRIVI src/index.css
 - Import Tailwind.
 - Import @fontsource/inter (400, 500, 600, 700).
 - @theme block con tutti i color tokens, font, radius, shadow, tracking.
 - Base styles html/body con font-sans, bg-app, color text-primary, font-feature-settings.
 - Utility .tabular-nums.
 - Keyframes shimmer e status-pulse + classi.
 - Rimuovi i vecchi token dark dell'app esistente.

3. SCRIVI src/lib/tokens.ts
 - Export const tokens con stessa struttura color/text/border/etc.
 - Tipato as const per inference precisa.
 - Esporta anche tokens.color, tokens.radius, tokens.shadow per import diretti.

4. AGGIORNA tailwind.config (.ts o .js)
 - Plugin heroui() con themes.light configurato come da specifica (vedi config esempio).
 - Content paths includono node_modules/@heroui/theme.
 - Rimuovi config dark mode se presente.

5. AGGIORNA src/App.tsx
 - Wrap l'app con <HeroUIProvider>.
 - Rimuovi (o forza light) ThemeProvider next-themes.
 - Mantieni AuthProvider, BrowserRouter, ErrorBoundary, Toaster, TooltipProvider esistenti.

6. CREA src/components/ui-v2/ con i seguenti componenti primitivi:
 Per ognuno: file .tsx con wrapper HeroUI + styling brand applicato.
 - Button.tsx (variants: primary, secondary, ghost, destructive, destructiveSolid, link; sizes sm/md/lg)
 - Input.tsx
 - Textarea.tsx
 - Select.tsx
 - Badge.tsx (variants success/warning/error/neutral/info/infoDark/criticalSolid; sm/md; dot prop)
 - Card.tsx (variants default/kpi/embedded/featured)
 - Avatar.tsx (con fallback iniziali via getInitials)
 - Switch.tsx
 - Checkbox.tsx
 - Tooltip.tsx
 - Skeleton.tsx (con shimmer animation)
 - Spinner.tsx

7. CREA src/lib/avatarFallback.ts
 - Funzione getInitials(name: string): string che ritorna max 2 caratteri uppercase.

8. CREA src/lib/dateFormat.ts
 - formatItalianDate(date: Date | string): "5 mag 2026"
 - formatRelativeDate(date): "5 min fa", "Oggi 14:32", "Ieri", "X gg fa", "tra X gg"
 - formatDateTime(date): "5 mag 2026 · 14:32"

9. CREA src/lib/currency.ts
 - formatEuro(value: number): "1.250,00 ¬"

10. CREA src/lib/badgeMaps.ts
 - Mapping per Asset status, WO status, WO priority, WO type, Ticket status: enum  { label, variant, dot } per Badge.

DELIVERABLE STEP 1
- App esistente continua a funzionare (vecchi UI non rotti).
- Inter caricato e visibile (verifica console: document.fonts.check('600 14px Inter') === true).
- Test smoke: importare e renderizzare un <Button variant="primary">Test</Button> da ui-v2 in una pagina qualsiasi e verificare colore verde #2ECC71.
- Token CSS variables disponibili in DevTools (verifica :root contiene --color-primary).
- Lint pulito.
- Build production OK.

OUTPUT ATTESO
Una serie di file modificati/creati pronti per commit, organizzati in PR singola "Step 1: Setup design system foundation".

Non procedere agli step successivi. Aspetta conferma di completamento.

13. Prompt Operativo Step 2 — App Shell
Per Claude Code / Cursor / agente coding
Sei un senior frontend engineer che lavora su ArenaOS. Il design system base (Step 1) è già implementato.

CONTESTO
Devi rifare l'App Shell di ArenaOS: sidebar, header, layout, profile sheet, global search, notifications panel. La logica (hooks, route, auth, Supabase) NON cambia, solo il rendering UI.

OBIETTIVO STEP 2
Refactorare i 5 componenti chiave dell'App Shell:
1. AppLayout (container)
2. Sidebar (dark, navigation, profile block)
3. Header (breadcrumb, search, theme toggle, notifications)
4. ProfileSheet (drawer destro)
5. GlobalSearch popover (con risultati raggruppati)
6. NotificationsPanel popover (con stati letti/non letti)

FILE DA MODIFICARE (refactor visual)
- src/components/layout/AppLayout.tsx
- src/components/layout/Sidebar.tsx
- src/components/layout/Header.tsx
- src/components/profile/ProfileSheet.tsx

VINCOLI ASSOLUTI
- NON toccare hooks (useAuth, useNotifications, useGlobalSearch).
- NON toccare logica route/redirect/permessi.
- NON cambiare Supabase queries.
- NON cambiare props pubblici contracts (tieni stessa interface se altri componenti li usano).
- USA i componenti ui-v2/ creati nello Step 1.

NUOVI COMPONENTI da creare in src/components/ui-v2/
- Tabs.tsx (variants: underlined, solid, bordered)
- Popover.tsx
- Dropdown.tsx
- Drawer.tsx
- Modal.tsx
- Pagination.tsx (per uso futuro)
- Progress.tsx (per top loading bar)
- Breadcrumbs.tsx (custom con separator /, last segment bold)
- PageHeader.tsx (subheader pagina con breadcrumb + title + subtitle + actions)

LAYOUT TARGET

SIDEBAR (248px fixed, dark #1C1B18, full-height)
- Logo block top 64px.
- Navigation scrollable middle, 4 gruppi:
 PANORAMICA: Dashboard
 OPERATIVITÀ: Scadenzario, Mezzi, Work Orders (espandibile  Rapportini), Tickets
 ANAGRAFICHE: Asset, Fornitori
 AMMINISTRAZIONE: Utenti, Audit Log
- Item: 36px alto, padding 8px 12px, hover bg rgba(250,250,249,0.06), active bg rgba(46,204,113,0.10) con barra verticale 3px verde left.
- Group label: 11px / 600 / 0.10em / UPPERCASE / #A8A6A0.
- Profile block bottom 64px: avatar 32 + nome + ruolo + chevron-up. Click  ProfileSheet.

HEADER (60px sticky)
- Background #FFFFFF, border-bottom #E5E4DF.
- Padding 0 28px desktop.
- Sinistra: Breadcrumb (component PageHeader passa info al header? no, breadcrumb sta nel content area sotto. Header mostra solo: hamburger mobile + spacer).
 Decisione: sposta breadcrumb DENTRO content area (sotto header), come da specifica Fase 2. Header desktop ha solo: hamburger mobile, spacer, search, theme toggle, notifications.
- Destra (gap 8px): GlobalSearch (320px), ThemeToggle (36×36 ghost, dummy), NotificationsButton (36×36 ghost con badge counter).

PROFILESHEET (drawer left 360px)
- Header 56px: title "Il tuo profilo" + close X.
- Avatar block centered 88px + caption "Clicca per cambiare foto" + role badge.
- Form: nome, email (disabled se policy).
- Action button "Salva modifiche" primary verde full-width.
- Footer fixed: link "Disconnetti" destructive con icon LogOut.

GLOBALSEARCH POPOVER
- Trigger: input 320px in header con placeholder "Cerca asset, ticket o WO&", shortcut chip K right.
- Aperto: dropdown 480px sotto, max-height 480px scroll.
- Header dropdown: "RICERCA GLOBALE" + count "X risultati".
- Risultati raggruppati: ASSET, WORK ORDER, TICKET, FORNITORI, TECNICI.
- Item: icon tipo + titolo + meta + chevron-right. Hover bg #F1EFE8. Selected (keyboard) bg #EAFBF1 + border-left 2px verde.
- Footer dropdown hint: " naviga ·  apri · esc chiudi".
- Match highlighting termine query: bg rgba(46,204,113,0.20) text #0A3D1F weight 700.
- Stati: empty (recenti), loading (3 skeleton row), no results (icon SearchX + "Nessun risultato per «query»").

NOTIFICATIONSPANEL POPOVER
- Trigger: bell button 36×36 con badge counter top-right.
- Aperto: popover 400px max-height 480px.
- Header: "NOTIFICHE" + "X non lette" + action "Segna tutte come lette".
- Item: dot non-letto + icon tipo + content (title + description + timestamp) + chevron-right.
- Letto: bg #FFFFFF, no dot, opacity 0.85.
- Non letto: bg rgba(46,204,113,0.04), dot verde, weight 600.
- Footer: link "Vedi tutte" centrato.
- Stati: empty (icon Bell muted + "Nessuna notifica · Tutto sotto controllo").

THEME TOGGLE
- 36×36 ghost button con icona Sun/Moon.
- Click in v1: toggle solo cosmetico (in realtà light forzato).
- Tooltip "Cambia tema".

KEYBOARD SHORTCUTS
- K / Ctrl+K: apri global search da qualunque punto.
- Esc: chiude popover/drawer/modal aperto.
- Implementa con useHotkeys o listener semplice in AppLayout.

DETTAGLI TECNICI
- AppLayout grid: 248px 1fr desktop, 1fr mobile.
- Sidebar mobile: <768px  drawer overlay con hamburger trigger nel header.
- Sidebar tablet: 768-1023px  collapsed icon-only 64px (tooltip on hover).
- Active nav item: usa NavLink di react-router-dom con className conditional.
- Persistenza sidebar collapsed state in localStorage key arenaos.sidebar.collapsed.
- Group "Work Orders" espandibile: stato in localStorage arenaos.sidebar.expanded.workOrders.

DELIVERABLE STEP 2
- App shell completamente rinnovata visivamente.
- Tutte le pagine continuano a renderizzare (anche se ancora con vecchio UI interno).
- Sidebar dark + content area light + header bianco visibili.
- Profile sheet apre come drawer destro con form funzionante.
- Global search apre con shortcut K.
- Notifications panel apre con counter funzionante.
- Theme toggle visibile (cosmetico, light forzato).
- Responsive: drawer mobile funziona <768px.

OUTPUT ATTESO
PR "Step 2: App Shell redesign" con file modificati e nuovi componenti ui-v2/.

Non procedere oltre. Aspetta conferma.

14. Prompt Operativo Step 3 — Dashboard + Assets + Work Orders
Per Claude Code / Cursor / agente coding
Sei un senior frontend engineer su ArenaOS. App Shell (Step 2) è completata.

CONTESTO
Devi refactorare le 3 pagine core del prodotto: Dashboard, Assets, Work Orders. Sono le più frequentate, devono incarnare il nuovo design system al meglio.

OBIETTIVO STEP 3
Refactor visivo di:
1. Dashboard (/)
2. Assets (/assets)
3. Work Orders (/work-orders)

FILE DA MODIFICARE
- src/components/dashboard/Dashboard.tsx
- src/components/assets/AssetsTable.tsx + correlati in src/components/assets/
- src/components/work-orders/WorkOrdersList.tsx + correlati in src/components/work-orders/

VINCOLI ASSOLUTI
- NON toccare useAssets, useWorkOrders, useDashboard, useTickets, useNotifications.
- NON cambiare le query Supabase.
- NON cambiare i tipi.
- USA componenti ui-v2/.

NUOVI COMPONENTI ui-v2/ DA CREARE
- KpiCard.tsx (label uppercase + number 32/700 tabular-nums + delta colorato + icon trailing)
- AlertBar.tsx (banner warning/critical inline con icon + content + CTA)
- Toolbar.tsx (container filter chips + search + counter)
- FilterChip.tsx (dropdown trigger button con stato attivo/inattivo)
- ActiveFilterChip.tsx (chip dark removibile)
- BulkActionsBar.tsx (bar dark slide-up con count + actions + close)
- StatusBadge.tsx (specialized Badge per asset/WO/ticket status)
- PriorityBadge.tsx (specialized per priority)
- TypeBadge.tsx (specialized per WO type, no dot)
- TimelineStepper.tsx (custom stepper orizzontale per WO timeline)
- SavingIndicator.tsx (idle/saving/saved/error con dot + label)
- EmptyState.tsx (icon in cerchio + title + description + CTA + secondary link)
- ErrorState.tsx (variant error)
- CategoryIcon.tsx (container 32×32 con bg + icon lucide-react per categoria asset)

CHARTS (Recharts wrappers in ui-v2/charts/)
- BrandedAreaChart.tsx (per Trend Manutenzioni)
- BrandedDonutChart.tsx (per Stato Asset)
- BrandedBarChart.tsx (per Ticket per categoria/ubicazione)
- ChartTooltip.tsx (custom tooltip card brand)
- ChartSkeleton.tsx (skeleton per chart loading)

TASK CONCRETI

DASHBOARD (/) — vedi Fase 3 spec
- Subheader: saluto contestuale + badge inline criticità + page actions Filtri/Esporta Report.
- Alert bar condizionale (warning/critical aggregato).
- KPI Row 5 cards: TOT ASSET, CONFORMITÀ, ASSET SCADUTI, WO IN CORSO, TICKET APERTI. Click  naviga al modulo filtrato.
- Analytics Row: Trend Manutenzioni (8 col area chart) + Stato Asset (4 col donut + legenda).
- Tickets Row: Categoria + Ubicazione (6+6 bar charts orizzontali).
- WO Recenti tabella full-width 8 righe.
- Stati: loading (skeleton structured), empty (onboarding card "Benvenuto su ArenaOS"), error (riprova).

ASSETS (/assets) — vedi Fase 4 spec
- Subheader: title "Asset" + subtitle "200 asset · 5 categorie · 139 scaduti" + actions "Esporta Excel"/"Scansiona QR"/"+ Nuovo asset".
- Toolbar: search "Cerca asset, marca, codice&" + 4 filter chips (Categoria, Ubicazione, Stato, Scadenza) + Reset + counter.
- Active filter chips dark removibili in riga 2 (condizionale).
- Tabella: 8 colonne (checkbox, ASSET con icon categoria + meta, CATEGORIA, UBICAZIONE, ULTIMA VERIFICA, PROSSIMA VERIFICA con relativo, STATO badge, AZIONI 3 icon).
- Riga 64px, click  drawer dettaglio.
- Drawer dettaglio (560px destro): header + hero + tab bar (Anagrafica/Manutenzione/WO collegati/Allegati) + footer.
- Modal crea/modifica (640px centrato): 5 sezioni UPPERCASE + helper coerenza seriale + validation + footer actions.
- Bulk actions bar quando 1 selezionato.
- Stati: empty totale (Benvenuto), empty filtri (reset), loading skeleton tabella.

WORK ORDERS (/work-orders) — vedi Fase 5 spec
- Subheader + view toggle Tabella/Card.
- Status tabs (Tutti/Da fare/In corso/Chiusi/Validati con count).
- Toolbar: search + 6 filter chips (Stato, Priorità, Tipo, Tecnico, Asset, Periodo, +Filtri avanzati).
- Tabella default: 9 colonne (checkbox, CODICE, INTERVENTO, TIPO, PRIORITÀ, STATO, ASSEGNATO con avatar, DATA, AZIONI).
- Card view alternativa: grid 3 col, card 360×280 con border-left 3px priority + header codice/priority + body title/meta/assegnatario + footer actions contestuali.
- Drawer dettaglio (720px destro): header + hero (3 badge) + Timeline stepper 6-step orizzontale + tab bar + footer.
- Timeline stepper: cerchi 28px, completato bg verde + check, attivo border verde + ring 4px rgba, pendente grigio. Connettori colorati progressivi. Click step  avanza con conferma.
- Modal crea/modifica (720px centrato): timeline integrata in alto (modifica only) + 5 sezioni form.
- Stati eccezionali (Sospeso/Abbandonato): banner inline + badge overlay sopra stepper, NON come step.
- Confirm destructive per Sospendi/Abbandona/Elimina con motivo textarea.

DETTAGLI IMPLEMENTATIVI

Filtri toolbar pattern (riusabile):
- FilterChip è button secondary sm con label + chevron-down. Stato attivo: border verde + bg success-bg.
- Multi-select: count chip "X selezionate" inline.
- Dropdown filter: header search interno (se >7 voci), checkbox/radio item con count asset/WO per voce, footer "Cancella"/"Applica" per multi.
- ActiveFilterChip dark con close X. Click chip  rimuove filtro. Link "Reset tutti i filtri" right.

Tabella pattern (riusabile):
- Header bg #FAFAF9 height 44px UPPERCASE.
- Riga 64px, hover bg #FAFAF9, selected bg #EAFBF1 + border-left 3px.
- Sortable columns con chevron updown.
- Default sort context-aware (asset: prossima verifica asc; WO: priority desc + data asc).

Drawer dettaglio pattern (riusabile):
- Width 560 (asset/ticket) o 720 (WO/vehicle).
- Header con icon container categoria + label + actions (overflow + edit + close).
- Hero block bg #FAFAF9 con badge + title + meta + (per WO) timeline.
- Tab bar underlined con count inline dove applicabile.
- Tab content padding 20 24, sezioni con label UPPERCASE muted, field row label sx + valore dx.
- Footer fixed: SavingIndicator left + actions (Chiudi + primary contestuale).

Modal crea/modifica pattern (riusabile):
- Width 640 (asset) o 720 (WO).
- Header title + subtitle + close.
- Body sezioni UPPERCASE + grid 2 col dove possibile + form fields.
- Footer: helper "I campi con * sono obbligatori" + Annulla + primary CTA.
- Submit: button con spinner + "Salvataggio&", on success toast + close, on error banner inline footer.

Recharts custom theming:
- AreaChart: stroke #2ECC71 2px, area gradient verticale rgba(46,204,113,0.12)  0.
- PieChart: cells colore status, innerRadius 68 outerRadius 80, gap 2°.
- BarChart orizzontale: bar bg #5F5E5A neutro, top item #1C1B18, track #F1EFE8.
- Tooltip custom: card bg #FFFFFF border #E5E4DF radius 8 padding 8 12.

DELIVERABLE STEP 3
- 3 pagine completamente rinnovate visivamente.
- Tutti i pattern (drawer, modal, toolbar, tabella, filtri) implementati e riusabili per le altre pagine.
- Charts coerenti col brand.
- Empty/loading/error states funzionanti.
- Hooks/data invariati.

OUTPUT ATTESO
PR "Step 3: Dashboard + Assets + Work Orders redesign".

Non procedere oltre.

15. Prompt Operativo Step 4 — Schermate rimanenti + cleanup
Per Claude Code / Cursor / agente coding
Sei un senior frontend engineer su ArenaOS. Step 1, 2, 3 sono completati.

CONTESTO
Devi refactorare le pagine rimanenti applicando i pattern già consolidati nello Step 3 (toolbar, drawer, modal, tabella, filtri). Poi cleanup finale: rimozione vecchi componenti UI e font.

OBIETTIVO STEP 4
1. Refactor visivo delle 8 pagine rimanenti.
2. Cleanup vecchi UI/font/CSS.
3. QA finale.

PAGINE DA REFACTORARE
1. Vehicles (/vehicles) + PublicBookingForm (/booking/:slug)
2. Schedule (/schedule)
3. Tickets Queue (/tickets) + PublicTicketForm (/report-issue)
4. Rapportini (/rapportini)
5. Suppliers (/suppliers)
6. Users Management (/users) — admin only
7. Audit Log (/audit) — admin/responsabile only
8. CDA Report (/reports/cda) — admin/responsabile only
9. Login + Reset Password (pagine auth pubbliche)

VINCOLI ASSOLUTI
- NON toccare hooks/data layer.
- NON cambiare logica route/permessi.
- USA pattern e componenti già creati negli step precedenti.

NUOVI COMPONENTI ui-v2/ DA CREARE (se non già esistenti)
- FileUploader.tsx (drag&drop area + lista file con react-dropzone)
- SignatureCanvas.tsx (canvas firma per public booking)
- PasswordStrengthMeter.tsx (bar segmentata + checklist requisiti)
- AuditTimelineItem.tsx (item timeline log con icon colorato + chips action/entity)
- VehicleStatusBadge.tsx (specialized per disponibile/in_uso/manutenzione/fuori_servizio)
- TicketStatusBadge.tsx (specialized per APERTO/IN_CARICO/IN_ATTESA/RISOLTO/CHIUSO)
- BookingApprovalCard.tsx (card richiesta sharing con approva/rifiuta)
- CalendarMonth.tsx (vista calendario mese custom o lib esterna stylized)
- CalendarWeek.tsx
- PublicLayout.tsx (top bar minimale + content centered + bg foto overlay)

TASK PER PAGINA

VEHICLES — vedi Fase 6 spec §1
- Subheader + KPI 4 card (Disponibili oggi, Prenotazioni oggi, Scadenze 30gg, Richieste sharing).
- View toggle Lista/Calendario settimanale.
- Tabella veicoli (foto+nome con icon Car fallback, targa tabular-nums, tipo, assegnazione, stato badge, prossima scadenza, azioni).
- Sidebar destra 320px: card Scadenze prossime + card Richieste sharing in attesa con approva/rifiuta.
- Drawer dettaglio: hero foto veicolo 16:9 + tabs Anagrafica/Scadenze/Manutenzioni/Prenotazioni/Storico.
- Modal crea/modifica con sezioni Anagrafica/Identificazione/Tecniche/Assegnazione/Foto.

PUBLIC BOOKING FORM — vedi Fase 6 spec §10
- PublicLayout con bg foto + card form 640px centered.
- Header con title + subtitle.
- Card "Veicolo richiesto" (preview embedded da slug URL).
- Sezioni: Dettagli viaggio / Richiedente / Motivazione / Conferma e firma.
- SignatureCanvas con cancel button.
- Privacy notice + CTA "Invia richiesta".
- Success state transformato con codice richiesta.

SCHEDULE — vedi Fase 6 spec §2
- Subheader + page actions.
- View toggle Mese (default) / Settimana / Lista.
- Calendario mese: grid 7×6, cella 120px alta, today border verde, eventi pill colorati per tipo, "+N altri" se overflow.
- Drag & drop tra giorni con feedback visivo verde.
- Sidebar destra 320px "Eventi del giorno" con lista WO + CTA "+ Pianifica intervento per [data]".
- Vista settimana: grid 7 col × ore 08-20, eventi posizionati per ora.
- Vista lista: tabella raggruppata per giorno.

TICKETS QUEUE — vedi Fase 6 spec §3
- Subheader + view toggle.
- Status tabs (Aperti/In carico/In attesa/Risolti/Chiusi).
- Toolbar filtri.
- Tabella ticket: codice + foto thumbnail 40×40 + titolo+desc + categoria + ubicazione + priorità + stato + segnalatore + data + azioni.
- Riga 72px (più alta per foto).
- Drawer dettaglio (560px): hero + tabs Dettagli (foto galleria + descrizione + segnalatore)/Cronologia/Conversione (CTA "Converti in WO ").
- Footer actions contestuali a stato.

PUBLIC TICKET FORM — vedi Fase 6 spec §9
- PublicLayout con bg foto + card form 560px.
- Header title + subtitle.
- Sezioni: Cosa è successo? (Categoria + Descrizione + Foto opzionale) / Dove? (Ubicazione + Note) / Chi sei? (Nome + Email + Telefono + Sei dipendente?).
- Privacy notice + CTA "Invia segnalazione".
- Success state con codice ticket prominente.

RAPPORTINI — vedi Fase 6 spec §4
- Subheader + action "Esporta tutto (ZIP)".
- Toolbar filtri.
- View toggle Per asset (default, accordion) / Lista cronologica.
- View "Per asset": Accordion gruppi (icon categoria + nome asset + count file + chevron). Body lista file con icon tipo + nome + size + WO collegato + data + actions.
- Modal preview file 80×80vw: PDF viewer (pdfjs) o image viewer.
- Empty: "Nessun rapportino allegato · I rapportini caricati nei WO appariranno qui automaticamente." (NO CTA, è view consultativa).

SUPPLIERS — vedi Fase 6 spec §5
- Subheader + action contestuale a tab attivo.
- Tab bar Fornitori/Tecnici (con count inline) — usa Tabs underlined.
- Toolbar filtri.
- Grid 3 col card 360×220 (fornitori) o 360×200 (tecnici).
- Card fornitore: icon Building2 + overflow + nome + servizio chip + count tecnici + telefono + email.
- Card tecnico: avatar + overflow + nome + ruolo + badge INTERNO/ESTERNO + (se esterno) chip fornitore associato + email.
- Drawer dettaglio: tab Anagrafica/Tecnici associati (per fornitore) o WO (per tecnico)/Disponibilità.
- Modal crea/modifica con sezioni dedicate.

USERS MANAGEMENT — vedi Fase 6 spec §6
- Solo admin (mantieni guard esistente).
- Subheader + action "+ Nuovo Utente".
- Toolbar filtri (Ruolo, Stato).
- Tabella: avatar+nome (label "Tu" se utente corrente) + email + ruolo badge + stato badge + ultimo accesso + creato + azioni.
- Riga 56px.
- Riga utente corrente: bg #EAFBF1 + border-left verde + label "Utente corrente".
- Modal crea/modifica con Anagrafica + Accesso (Ruolo + Stato) + Password iniziale (solo nuovo).
- Confirm destructive per disattiva/elimina (con check non si auto-disattivi).
- Action overflow: Modifica / Reinvia invito (se INVITATO) / Reset password / Disattiva-Attiva / Elimina.

AUDIT LOG — vedi Fase 6 spec §7
- Solo admin/responsabile (guard esistente).
- Subheader + action "Esporta CSV".
- Toolbar filtri (Azione, Entità, Utente, Periodo).
- Timeline lista (NON tabella): card container con sticky day header "Oggi · 5 maggio 2026 · 8 operazioni".
- AuditTimelineItem: icon container colorato 36 (verde creazione, arancio modifica, rosso eliminazione, neutro auth/state) + content (action chip + entity chip + entity name + meta data·utente) + chevron expand.
- Espandibile inline: diff vecchio/nuovo per modifica, payload per creazione, ultimi valori per eliminazione.

CDA REPORT — vedi Fase 6 spec §8
- Layout STANDALONE: NO sidebar, top bar 56px minimale (breadcrumb + Torna alla dashboard + Esporta PDF primary verde).
- Content centered max-width 880px (A4 ratio).
- Header report: logo + title 28/700 + subtitle + meta data esportazione/struttura.
- KPI block 4 card grandi (140px) con bg colorati tenui (success/error/warning per criticità).
- Sezioni: Stato asset (bar list) + Trend manutenzioni (bar list mensile) + Ticket categoria/ubicazione (2 card affiancate) + Interventi attivi (lista WO compatta) + Sintesi esecutiva (3 callout box con border-left colore + body con valori bold inline).
- Footer report con logo small + meta.
- @media print: rimuovi top bar, ottimizza A4, B/N safe.

LOGIN — vedi Fase 6 implicito da App Shell
- Layout pubblico con bg foto seggiolini.
- Card login centrata 480px.
- Logo ArenaOS + title "Accedi al pannello" + subtitle.
- Form: email + password + checkbox "Resta connesso" + link "Password dimenticata?".
- CTA "Accedi" primary verde full-width.
- Login error banner inline form.

RESET PASSWORD — vedi Fase 6 spec §11
- Layout pubblico stesso pattern Login.
- Card 480px con icon KeyRound + title + form nuova password + conferma.
- PasswordStrengthMeter sotto field nuova password (bar 4 segmenti + label + checklist requisiti).
- Validation match con error inline.
- Success state transformato + auto-redirect countdown.
- Token invalid state separato con CTA "Richiedi nuovo link".

CLEANUP FINALE
1. Migra tutti gli imports da src/components/ui/* a src/components/ui-v2/*.
2. Verifica nessun import vecchio rimasto (ricerca regex `from "@/components/ui/`).
3. Cancella src/components/ui/ legacy.
4. Rinomina src/components/ui-v2/  src/components/ui/.
5. Aggiorna tutti gli imports da ui-v2/ a ui/.
6. Rimuovi @fontsource per Sora, Geomanist, JetBrains Mono se installati.
7. Cancella public/fonts/GeomanistMedium.ttf.
8. Rimuovi classi CSS legacy (.arena-heading, .arena-dark-dialog, etc.) dal vecchio src/index.css se rimaste.
9. Rimuovi next-themes dal package.json se non usato.
10. ESLint --fix e rimuovi unused imports.
11. Bundle analysis con vite-bundle-visualizer, verifica size <500kb gzip totale.

QA FINALE (vedi checklist Fase 7 §11)
- Visiva: palette + font + bottoni + status + tabular-nums.
- Funzionale: ogni pagina ogni azione.
- Responsive: 1440/1024/768/480.
- Accessibilità: focus visible + aria-label + keyboard nav.
- Performance: FCP <1.5s + bundle size.
- Cross-browser: Chrome/Safari/Firefox/Edge.
- Print: CDA report A4.
- Cleanup: no dead code, no unused imports.

DELIVERABLE STEP 4
- Tutte le 11 schermate rimanenti completate.
- Cleanup completato.
- QA passato.
- Build production pulita.
- App ArenaOS 100% nel nuovo design system, light mode unico, Inter unico font, palette brand kit, sidebar dark + content warm light.

OUTPUT ATTESO
Multiple PR (consigliato 1 PR per pagina + 1 PR cleanup finale):
- "Step 4a: Vehicles + Public Booking"
- "Step 4b: Schedule"
- "Step 4c: Tickets + Public Ticket Form"
- "Step 4d: Rapportini"
- "Step 4e: Suppliers + Technicians"
- "Step 4f: Users Management"
- "Step 4g: Audit Log"
- "Step 4h: CDA Report"
- "Step 4i: Login + Reset Password"
- "Step 4j: Cleanup + QA"

Una volta completato Step 4, il redesign ArenaOS è production-ready.

Riepilogo finale
Il redesign ArenaOS è strutturato in 4 step di implementazione + setup iniziale, totale ~3 settimane di sviluppo full-time.
I 4 prompt operativi sopra sono pronti per essere passati a Claude Code, Cursor o qualsiasi agente di coding. Ogni prompt è autosufficiente, rispetta i vincoli, lavora step-by-step, e produce PR atomiche che lasciano l'app sempre funzionante.
Il design system è pensato per essere production-grade dal giorno 1: tokens TypeScript-typed, componenti riusabili, pattern consolidati per drawer/modal/toolbar/tabella, charts custom-themed, stati osservabili (loading/empty/error/saving) ovunque.
L'identità visiva ArenaOS è ora una opera coerente: light mode caldo color carta, sidebar dark profonda, verde brand come unico segnale di azione, Inter come voce tipografica unica, tabelle e card flat con border come gerarchia, stati colorati con misura chirurgica, density operativa alta ma sempre leggibile. Un tool che si fa scegliere ogni mattina perché non spreca tempo, e che si presenta a un consiglio di amministrazione con la stessa naturalezza con cui gestisce un guasto urgente alle 22:00 di un sabato di partita.


