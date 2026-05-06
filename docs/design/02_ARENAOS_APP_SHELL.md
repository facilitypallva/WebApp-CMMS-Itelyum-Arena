# ArenaOS — App Shell

> Specifiche di Sidebar, Header, Layout, Profile Sheet, Global Search, Notifications. Container di tutte le pagine protette.

---

## Architettura generale

Tre regioni fisse:
- **Sidebar**: 248px desktop, fixed left, full-height, dark.
- **Header**: 60px alto, sticky top, sopra l'area contenuto, light.
- **Area contenuto**: scrollabile, padding 28px, background caldo.

**Grid root**: `grid-template-columns: 248px 1fr` desktop / `1fr` mobile (sidebar in drawer).
**Z-index scale**: sidebar 30, header 20, dropdown/popover 50, modal 60, toast 70.

---

## 1. Sidebar Desktop

### Layout
- **Width**: 248px fixed.
- **Height**: 100vh, sticky top.
- **Composizione verticale** (top → bottom):
  1. Logo block — 64px alto
  2. Navigation scroll area — flex-1, overflow-y auto
  3. Profile block — 64px alto, fixed bottom

### Dimensioni
- Logo: padding `20px 20px`, logo height 24px.
- Group label: padding `12px 16px 6px`, font 11px / 600 / 0.10em / UPPERCASE.
- Nav item: height 36px, padding `8px 12px`, margin orizzontale 8px → larghezza effettiva 232px.
- Gap tra item: 2px verticale.
- Gap tra gruppi: 16px.
- Profile block: padding `12px 12px`, 64px alto.

### Colori
- Background sidebar: `#1C1B18`.
- Testo item: `#FAFAF9`.
- Testo item secondario (group label): `#A8A6A0`.
- Hover bg: `rgba(250, 250, 249, 0.06)`.
- Active bg: `rgba(46, 204, 113, 0.10)`.
- Active text: `#FAFAF9` weight 600.
- Active indicator: barra verticale 3px × 16px, color `#2ECC71`, radius 2px, posizionata 0px da bordo sinistro item con margin-left: -8px (sporge dal padding del nav).
- Border bottom logo block: 1px solid `rgba(250, 250, 249, 0.06)`.
- Border top profile block: 1px solid `rgba(250, 250, 249, 0.06)`.
- Icona item: 18px, `#A8A6A0` default, `#FAFAF9` su hover/active.
- Counter badge (pillola con numero): bg `#2ECC71`, text `#0A3D1F`, font 11px / 700, padding `1px 6px`, radius 4px, allineato right.

### Struttura nav (gruppi)
1. **PANORAMICA** — Dashboard
2. **OPERATIVITÀ** — Scadenzario, Mezzi, Work Orders (espandibile → Rapportini), Tickets
3. **ANAGRAFICHE** — Asset, Fornitori
4. **AMMINISTRAZIONE** — Utenti, Audit Log

Item con sub-items (Work Orders → Rapportini):
- Chevron 14px right, color `#A8A6A0`, ruota 90° quando aperto.
- Sub-item: indented 36px da sinistra, height 32px, font 13px / 500.
- Bordo verticale leading sub-items: 1px solid `rgba(250, 250, 249, 0.10)` (guida visiva).

### Profile block (in basso sidebar)
- Layout: avatar 32px + 10px gap + nome/ruolo (verticale) + chevron-up 14px right.
- Avatar: 32×32, radius full, bg fallback `#5F5E5A`, iniziali `#FAFAF9` 12px / 600.
- Nome: 13px / 600 / `#FAFAF9`, truncate.
- Ruolo: 11px / 500 / `#A8A6A0`, truncate (es. "Admin", "Responsabile", "Tecnico", "Lettura").
- Hover: bg `rgba(250, 250, 249, 0.06)`, radius 8px.
- Click: apre `Profile Sheet`.

### Stati item
- **Default**: bg transparent, text `#FAFAF9`, icon `#A8A6A0`.
- **Hover**: bg `rgba(250, 250, 249, 0.06)`, icon `#FAFAF9`.
- **Active**: bg `rgba(46, 204, 113, 0.10)`, indicator left 3px verde, weight 600.
- **Focus visible** (tastiera): outline 2px `#2ECC71`, offset -2px.
- **Disabled** (es. ruolo non abilitato): nascosto, non disabilitato visualmente.

### Componenti HeroUI consigliati
- `Listbox` o struttura custom con `Button` ghost per item.
- `Accordion` (item="bordered" disabilitato) per gruppo Work Orders espandibile, oppure custom toggle.
- `Avatar` + `Tooltip` per profile block.
- `Badge` per counter (es. ticket non letti accanto a "Tickets").

### Comportamento UX
- Click item → naviga, active state immediato (no waiting fetch).
- Group espandibile: stato persistente in `localStorage` (`sidebar.expanded.workOrders`).
- Scroll independente del contenuto pagina.
- Active group label rimane `#A8A6A0` (non si colora il group quando un suo item è attivo).
- Doppio click su logo: ricarica/torna a Dashboard.
- Keyboard: `Tab` naviga sequenza item, `Enter` attiva, `↑/↓` navigation circolare.

### Microcopy
- Group labels (UPPERCASE): "PANORAMICA", "OPERATIVITÀ", "ANAGRAFICHE", "AMMINISTRAZIONE".
- Item label: "Dashboard", "Scadenzario", "Mezzi", "Work Orders", "Rapportini", "Tickets", "Asset", "Fornitori", "Utenti", "Audit Log".

### Errori da evitare
- ❌ Verde su tutto l'item attivo (sembra bottone): solo indicator 3px + tint bg leggera.
- ❌ Sidebar troppo larga (>260px): sottrae spazio operativo.
- ❌ Icone decorative o multicolor: lucide-react monocromatica.
- ❌ Group label cliccabile: solo etichetta, non interattivo.
- ❌ Mostrare voci a cui l'utente non ha accesso: nascondere, non disabilitare.
- ❌ Cambiare font dentro la sidebar: solo Inter.

---

## 2. Sidebar Mobile / Responsive

### Breakpoint
- Desktop: ≥ 1024px → sidebar fissa.
- Tablet: 768–1023px → sidebar collapsibile a 64px (icon-only).
- Mobile: < 768px → sidebar nascosta, drawer overlay.

### Sidebar collapsed (tablet)
- Width: 64px.
- Solo icone 20px centrate, no label.
- Tooltip on hover: nome item, posizione right, offset 8px, bg `#1C1B18`, text `#FAFAF9`, padding `6px 10px`, radius 6px, font 12px / 500.
- Group label: nascosto, sostituito da divider 1px `rgba(250, 250, 249, 0.06)` orizzontale margin 12px.
- Logo: solo simbolo (no wordmark), 28×28 centrato.
- Profile block: solo avatar 32px centrato, no nome/ruolo, click apre Profile Sheet.
- Active indicator: barra 3px left invariata.

### Sidebar drawer (mobile)
- Trigger: hamburger button 36×36 nel header sinistra (visibile solo < 768px).
- Drawer: 280px width, slide-in da sinistra, backdrop `rgba(28, 27, 24, 0.50)` con blur 4px.
- Contenuto identico alla sidebar desktop (full label).
- Close: backdrop click, `Esc`, swipe left, X button top-right del drawer (24×24).
- Animation: 200ms ease-out in, 150ms ease-in out.

### Componenti HeroUI consigliati
- `Drawer` con `placement="left"`.
- `Button` ghost icon 36×36 per trigger.
- `Tooltip` per icon-only state.

### Comportamento UX
- Click voce mobile drawer → naviga + chiude drawer.
- Stato `expanded/collapsed` ricordato in `localStorage` (per tablet).
- Su touch device: swipe right da bordo sinistro apre drawer.
- Drawer sopra header (z-index 50).

### Microcopy
- Hamburger aria-label: "Apri navigazione".
- Close button aria-label: "Chiudi navigazione".

### Errori da evitare
- ❌ Drawer stretto (<240px): label tagliate.
- ❌ Mantenere sidebar fissa < 1024px: sottrae troppo spazio.
- ❌ Tooltip che appaiono ritardati o senza contenuto in icon-only.

---

## 3. Header

### Layout
- **Height**: 60px fixed.
- **Position**: sticky top, full-width meno sidebar.
- **Background**: `#FFFFFF`.
- **Border-bottom**: 1px solid `#E5E4DF`.
- **Padding**: `0 28px` desktop, `0 16px` mobile.

### Composizione (left → right)
- **Sinistra (flex 0)**:
  - Mobile only: hamburger 36×36 ghost (margin-right 12px).
- **Centro/spacer (flex 1)**: spinge i blocchi.
- **Destra (flex 0, gap 8px)**:
  - Global Search (vedi sezione 7), 320px desktop, 36×36 icon button mobile.
  - Theme toggle 36×36 ghost (vedi sezione 10).
  - Notifications 36×36 ghost con badge counter (vedi sezione 8).

> **Nota**: Il breadcrumb sta nel content area sotto l'header (subheader pagina), non dentro l'header stesso.

### Dimensioni
- Tutti i ghost button: 36×36, radius 8px, icon 18px.
- Gap interno gruppo destro: 8px.

### Colori
- Background: `#FFFFFF`.
- Border-bottom: `#E5E4DF`.
- Icon button default: icon `#5F5E5A`, hover bg `#F1EFE8`, hover icon `#1C1B18`.
- Icon button con badge: badge bg `#E24B4A`, text `#FFFFFF`, position absolute top -2 right -2, min-size 16×16, padding `0 4px`, font 10px / 700, radius full, border 2px `#FFFFFF`.

### Stati
- Header sticky: nessuna shadow al top, solo border-bottom (la separazione è netta per design).
- Su scroll: invariato (no shrink, no shadow).
- Loading globale (route change): linea progress 2px verde in basso del header, animazione indeterminate.

### Componenti HeroUI consigliati
- `Navbar` come container.
- `Input` per search.
- `Button` ghost iconButton per actions.
- `Badge` (placement top-right) per counter notifications.

### Comportamento UX
- Header rimane visibile durante scroll contenuto.
- `Cmd/Ctrl+K` apre global search da qualunque punto.
- `Esc` chiude global search aperta.

### Microcopy
- Aria-label theme toggle: "Cambia tema".
- Aria-label notifiche: "Notifiche" (con count: "Notifiche, 3 non lette").

### Errori da evitare
- ❌ Header con ombra pesante: solo border-bottom.
- ❌ Mettere troppi elementi: max 4 azioni a destra (search, theme, notif, eventuale help).
- ❌ Page title nel header (no, sta nel content area sotto come subheader).
- ❌ Search a tutta larghezza desktop: deve restare 320px.

---

## 4. Area Contenuto

### Layout
- **Background**: `#FAFAF9`.
- **Padding**: `28px` desktop, `20px` tablet, `16px` mobile.
- **Max-width**: nessuno (full fluid). Per pagine narrative (es. report) il contenuto interno limita a `max-w-7xl` autonomamente.
- **Scroll**: y-axis interno alla content area, header e sidebar fissi.

### Struttura interna verticale
1. **Subheader pagina** (vedi 5 + 6) — block top dell'area, NON parte dell'header.
2. **Spacing 24px**.
3. **Contenuto pagina** (cards, tabelle, sezioni) — gap 24–32px tra macro-sezioni.

### Subheader pagina
- Padding bottom: 20px.
- Border-bottom: nessuno (separazione gestita da spacing).
- Layout: breadcrumb top + page title + page actions inline.

### Componenti HeroUI consigliati
- Wrapper `<main>` semantico.
- Per layout interni dei moduli: combinazione di `Card`, `Divider`, `Spacer`.

### Stati
- **Loading** intero modulo: vedi sezione 11.
- **Empty** modulo: vedi sezione 12.
- **Error** modulo: vedi sezione 13.

### Comportamento UX
- Scroll position: resettato a 0 su navigazione tra pagine.
- Su back browser: scroll position ripristinata se possibile.
- Padding superiore costante (no varia per pagine).

### Errori da evitare
- ❌ Background bianco pieno: deve essere `#FAFAF9` per dare warmth.
- ❌ Padding diverso tra pagine: coerenza assoluta.
- ❌ Page title dentro l'header sticky: diventa inutile.
- ❌ Doppio scroll annidato (header pagina sticky DENTRO area contenuto): solo un scroll container.

---

## 5. Breadcrumb

### Layout
- Position: top dell'area contenuto, sopra page title.
- Margin-bottom: 8px.
- Inline-flex, gap 6px, font 13px / 500.

### Composizione segmenti
- Segmento intermedio: `text-secondary` (`#5F5E5A`), clickable, hover `text-primary`.
- Separatore: `/` carattere, color `#888780`, padding orizzontale 4px, peso 400.
- Last segment: `text-primary` (`#1C1B18`), weight 600, non cliccabile.
- Max 3 livelli visibili: oltre, collassa con "..." cliccabile che mostra dropdown segmenti omessi.

### Esempi
- `Panoramica / Dashboard Generale`
- `Operatività / Work Orders / WO-2024-0142`
- `Anagrafiche / Asset / Pulsante allarme PL1 066`

### Stati
- Hover segmento intermedio: text `#1C1B18`, no underline.
- Focus tastiera: outline 2px `#2ECC71` offset 2px, radius 4px.

### Componenti HeroUI consigliati
- `Breadcrumbs` di HeroUI con custom separator.

### Comportamento UX
- Click segmento intermedio → naviga al livello.
- Click last segment: noop.
- Mobile (< 640px): mostrare solo ultimi 2 segmenti (parent + current).

### Microcopy
- Sezioni allineate alla sidebar: "Panoramica", "Operatività", "Anagrafiche", "Amministrazione".
- Pagine: usare nome reale modulo come segmento intermedio (non "Dashboard Generale" se è anche il last).

### Errori da evitare
- ❌ Breadcrumb a singolo livello (es. solo "Dashboard"): in quel caso ometterlo del tutto.
- ❌ Last segment cliccabile: confonde, è la pagina corrente.
- ❌ Separatore "›" o ">": usare "/" che è più tecnico/neutro.
- ❌ Caps o weight bold sui breadcrumb: tono troppo forte, è metadata.

---

## 6. Page Title

### Layout
- Subito sotto breadcrumb, margin-top 4px.
- Riga flex con: titolo a sinistra, badge contestuale opzionale, page actions a destra.
- Font: Page Title (24px / 700 / -0.02em / `text-primary`).

### Composizione
- **Titolo** (es. "Dashboard Generale", "Asset", "Work Orders").
- **Badge contestuale opzionale** (inline accanto al titolo, gap 12px): es. "139 asset scaduti" badge error, oppure "3 nuovi" badge success. Font 11px / 600 / UPPERCASE.
- **Subtitle opzionale** (riga sotto, margin-top 4px): 14px / 500 / `text-secondary`.
- **Page actions destra** (gap 8px):
  - Action secondary (es. "Filtri", "Esporta CSV"): button secondary md.
  - Action primary (es. "Crea Work Order", "Nuovo Asset"): button primary md.

### Layout responsive
- Desktop: tutto in una riga.
- Tablet: titolo a riga propria, actions sotto.
- Mobile: titolo + subtitle + actions in colonna, actions full-width stacked se più di una.

### Stati
- **Saving** in pagina editor: indicator inline accanto a titolo (vedi sezione 14).
- **Read-only** mode: badge "Sola lettura" neutral inline.

### Componenti HeroUI consigliati
- Layout custom con flex.
- `Chip` o `Badge` HeroUI per badge contestuale.
- `Button` per actions.

### Comportamento UX
- Titolo si aggiorna con tab title del browser: `[Page] · ArenaOS`.
- Su pagine dettaglio: titolo è il nome dell'entità (es. "WO-2024-0142 — Sostituzione pompa caldaia"), breadcrumb chiarisce il contesto.

### Microcopy esempi
- Dashboard: "Dashboard Generale" / subtitle "Buongiorno [Nome] — panoramica operativa di oggi".
- Asset: "Asset" / subtitle "200 asset · 139 scaduti · 61 in regola".
- Work Orders: "Work Orders" / subtitle "12 in corso · 3 in attesa · 240 chiusi quest'anno".

### Errori da evitare
- ❌ Titolo + sottotitolo separati da troppo spazio: max 4px.
- ❌ Page actions disposte sopra il titolo: convenzione è destra-stessa-riga.
- ❌ Subtitle decorativo che ripete il titolo: deve aggiungere informazione.
- ❌ Badge contestuale con colori diversi dal sistema status (es. blu): solo success/warning/error/neutral.

---

## 7. Global Search — Chiusa / Aperta

### Stato chiuso
- **Posizione**: header destra, prima dei ghost button.
- **Layout**: input pillola.
- **Dimensioni**: 320px × 36px desktop. Mobile: solo icona 36×36 (apre full-screen modal).
- **Background**: `#F1EFE8`.
- **Border**: nessuno.
- **Radius**: 8px.
- **Padding**: `8px 14px 8px 38px` (icon leading).
- **Icon**: search 16px, color `#888780`, position absolute left 14px.
- **Placeholder**: "Cerca asset, ticket o WO..." color `#888780`, font 14px / 500.
- **Right hint**: shortcut chip `⌘K` (mac) / `Ctrl K` (windows): bg `#FFFFFF`, border `#E5E4DF`, padding `2px 6px`, radius 4px, font 11px / 600 / `#5F5E5A`, position absolute right 8px.
- **Hover**: bg `#FFFFFF`, border 1px `#E5E4DF`.
- **Focus**: bg `#FFFFFF`, border 1px `#E5E4DF`, `shadow-focus-primary`.

### Stato aperto (search active con risultati)
- **Posizione**: il search input rimane in posizione (trasformato in `#FFFFFF` con border `#E5E4DF`), il dropdown risultati appare sotto.
- **Dropdown risultati**:
  - Width: 480px (desktop), allineato right del input.
  - Background: `#FFFFFF`.
  - Border: 1px solid `#E5E4DF`.
  - Radius: 10px.
  - Shadow: `shadow-md`.
  - Padding interno: 8px.
  - Margin-top: 8px (gap dall'input).
  - Max-height: 480px, scroll interno.
- **Header dropdown**:
  - Padding: `8px 12px`.
  - Layout: "RICERCA GLOBALE" left (font 11px / 700 / 0.10em / UPPERCASE / `#888780`) + count "X risultati" right (font 11px / 500 / `#888780`).
  - Border-bottom: 1px solid `#E5E4DF`.
- **Gruppo risultati** (raggruppato per tipo):
  - Group label: padding `12px 12px 6px`, font 11px / 700 / 0.08em / UPPERCASE / `#5F5E5A`. Esempi: "ASSET", "WORK ORDER", "TICKET", "FORNITORI", "TECNICI".
  - Counter inline al group label (es. "ASSET · 12"): tono `#888780`.
- **Item risultato**:
  - Padding: `10px 12px`.
  - Radius: 8px.
  - Layout: icona tipo 16px (left) + content (riga 1: titolo, riga 2: meta) + chevron-right 14px (right, color `#888780`).
  - Titolo: 14px / 600 / `#1C1B18`.
  - Meta: 12px / 500 / `#5F5E5A`. Pattern: "[Tipologia] — [Nome esteso] · [STATO]".
  - Match highlighting: termine cercato in `bg-rgba(46,204,113,0.20) / text-#0A3D1F` weight 700.
  - Hover: bg `#F1EFE8`.
  - Focus tastiera (selected): bg `#EAFBF1`, border-left 2px `#2ECC71` (inset).
- **Footer dropdown** (opzionale):
  - Padding: `10px 12px`.
  - Border-top: 1px solid `#E5E4DF`.
  - Hint shortcuts: "↑↓ naviga · ↵ apri · esc chiudi", font 11px / 500 / `#888780`.

### Stati search
- **Empty (input vuoto, dropdown aperto)**: mostra "Ricerche recenti" (max 5) con stesso pattern item, oppure "Inizia a digitare per cercare".
- **Loading (digitazione in corso)**: dropdown mostra 3 skeleton row item.
- **No results**: stato vuoto centrato, padding 32px:
  - Icona search 32px in cerchio bg `#F1EFE8` 56×56.
  - Title: "Nessun risultato per «[query]»" (14px / 600).
  - Description: "Prova con altri termini o controlla l'ortografia." (13px / 500 / `text-secondary`).
- **Error (search fallita)**: vedi sezione 13.

### Componenti HeroUI consigliati
- `Input` per il campo.
- `Modal` o `Popover` placement="bottom-end" per il dropdown (preferire popover per non bloccare).
- Mobile: `Modal` fullscreen con search dentro.
- `Listbox` per risultati con keyboard navigation.

### Comportamento UX
- Apertura: focus input apre dropdown (anche con input vuoto, mostra recenti).
- Chiusura: click fuori, `Esc`, blur input se vuoto.
- Debounce digitazione: 200ms prima di lanciare search.
- Min query length: 2 caratteri.
- Keyboard: `↑/↓` naviga risultati, `↵` apre selezionato, `Tab` esce, `Esc` chiude.
- Click risultato: naviga alla pagina corretta (asset → /assets?focus=ID, WO → /work-orders/ID, ecc.) e applica filtro/highlight.
- Recenti: salvate in `localStorage` (max 10), click "Cancella" header gruppo.
- Mobile: tap icon search → modal full-screen, input in alto, lista sotto, X chiude.

### Microcopy
- Placeholder: "Cerca asset, ticket o WO..."
- Group labels: "ASSET", "WORK ORDER", "TICKET", "FORNITORI", "TECNICI".
- Empty: "Inizia a digitare per cercare".
- No results title: "Nessun risultato per «[query]»".
- No results desc: "Prova con altri termini o controlla l'ortografia."
- Footer hint: "↑↓ naviga · ↵ apri · esc chiudi".
- Recenti header: "RICERCHE RECENTI".

### Errori da evitare
- ❌ Search modale enorme stile Spotlight: sproporzionato per un CMMS.
- ❌ Risultati non raggruppati: l'utente non distingue WO da ticket.
- ❌ Group label senza count: l'utente non sa quanti totali per tipo.
- ❌ Match highlighting con colore decorativo (giallo): solo verde tinta primary.
- ❌ Dropdown senza max-height: cresce infinito su molti risultati.
- ❌ Niente shortcut hint: utenti power devono poter usare `⌘K`.

---

## 8. Notifications Panel — Chiuso / Aperto

### Stato chiuso (icon button in header)
- **Bottone**: 36×36 ghost, icona bell 18px `#5F5E5A`.
- **Badge counter**: position top-right -2/-2, min-size 16×16, padding `0 4px`, bg `#E24B4A`, text `#FFFFFF`, font 10px / 700, radius full, border 2px `#FFFFFF`. Mostra `99+` se conteggio > 99.
- **Stato pulsante**: se notifiche non lette, leggera animazione bell shake al mount (200ms, una volta).

### Stato aperto (popover)
- **Trigger**: click sul bottone bell.
- **Container**:
  - Width: 400px desktop, 100% mobile (drawer dal basso).
  - Background: `#FFFFFF`.
  - Border: 1px solid `#E5E4DF`.
  - Radius: 10px.
  - Shadow: `shadow-md`.
  - Margin-top: 8px (gap dal trigger).
  - Position: anchor right del trigger.
  - Max-height: 480px.
- **Header**:
  - Padding: `12px 16px`.
  - Border-bottom: 1px solid `#E5E4DF`.
  - Layout: "NOTIFICHE" left (11px / 700 / 0.10em / UPPERCASE / `#888780`) + counter "X non lette" right (11px / 500 / `#888780`).
  - Action right (se non lette > 0): link "Segna tutte come lette" 12px / 600 / `#1A7A3C`.
- **Body**:
  - Padding: 0.
  - Scroll interno.
  - Lista notifiche.
- **Footer** (opzionale):
  - Padding: `10px 16px`.
  - Border-top: 1px solid `#E5E4DF`.
  - Layout: link "Vedi tutte" centrato, 13px / 600 / `#1A7A3C`, naviga a `/notifications` se esiste.

### Item notifica
- Padding: `12px 16px`.
- Border-bottom: 1px solid `#F1EFE8` (più tenue di quello card).
- Layout: dot non-letto (left, 6px, color `#2ECC71`, posizione assoluta left 6px top 18px) + icona tipo 16px + content + timestamp + chevron right.
- Letto/non letto:
  - **Non letto**: bg leggera `rgba(46, 204, 113, 0.04)`, dot verde visibile, titolo weight 600.
  - **Letto**: bg `#FFFFFF`, no dot, titolo weight 500, opacity 0.85.
- Content:
  - Riga 1 (title): 13px / 600 (non letto) o 500 (letto) / `#1C1B18`. Es. "Nuovo ticket: Guasto luce parcheggio nord".
  - Riga 2 (description): 12px / 400 / `#5F5E5A`, max 2 righe, line-clamp 2.
  - Riga 3 (timestamp): 11px / 500 / `#888780`. Es. "5 min fa", "Oggi · 14:32", "Ieri".
- Hover: bg `#FAFAF9`.
- Click: marca come letta + naviga al contesto (ticket, WO, asset).

### Tipi notifica e icone
- Ticket: `Ticket` icon, color `#A83228` se nuovo/urgente.
- WO: `Wrench` icon, color `#A8531A` se assegnato.
- Asset: `AlertTriangle` icon, color `#A83228` se scaduto, `#A8531A` se in scadenza.
- Mezzo/booking: `Car` icon, color `#5F5E5A`.
- Sistema: `Info` icon, color `#5F5E5A`.

### Stati
- **Vuoto**: padding 48px verticale.
  - Icona bell 32px in cerchio bg `#F1EFE8` 56×56.
  - Title: "Nessuna notifica" (14px / 600).
  - Description: "Tutto sotto controllo. Le novità appariranno qui." (13px / 500 / `text-secondary`).
- **Loading**: 3 skeleton item con stessi padding/altezza.
- **Error**: banner inline (vedi sezione 13) con "Riprova" link.

### Componenti HeroUI consigliati
- `Popover` placement="bottom-end".
- `Listbox` per item con `Listbox.Item` divisori.
- `Button` icon + `Badge` overlap.
- Mobile: `Drawer` placement="bottom" con stesso contenuto.

### Comportamento UX
- Click bell: apre popover, recupera notifiche se cache stale.
- Click item: marca singola come letta + naviga.
- Click "Segna tutte come lette": tutte → letta, dot scompaiono, counter va a 0.
- Polling: ogni 60s in foreground per nuovo conteggio.
- New notification: counter aggiornato, leggera animazione shake bell (200ms).
- Cmd/Ctrl+Shift+N: apre/chiude pannello (opzionale).
- `Esc` chiude.

### Microcopy
- Header: "NOTIFICHE" + "X non lette".
- Action: "Segna tutte come lette".
- Footer: "Vedi tutte".
- Empty title: "Nessuna notifica".
- Empty desc: "Tutto sotto controllo. Le novità appariranno qui."
- Timestamp formati: "Adesso", "X min fa", "X ore fa", "Oggi · HH:mm", "Ieri", "DD MMM".

### Errori da evitare
- ❌ Notifiche con immagini/preview: troppa rumorosità per CMMS.
- ❌ Mostrare tutte indistintamente lette+non lette senza distinzione visiva chiara.
- ❌ Counter > 99 mostrato come "127": sempre "99+".
- ❌ Auto-marca-come-letta all'apertura: l'utente deve agire (click item o "tutte come lette").
- ❌ Pannello senza max-height: cresce infinito.
- ❌ Animazioni esplosive di nuova notifica: solo subtle shake una volta.

---

## 9. Profile Sheet

### Layout
- Tipologia: **Drawer left**, NON modal centrato.
- Width: 360px desktop, 100% mobile.
- Height: 100vh.
- Background: `#FFFFFF`.
- Border-right: 1px solid `#E5E4DF`.
- Shadow: `shadow-md`.
- Animation: slide-in da sinistra 200ms ease-out.
- Backdrop: `rgba(28, 27, 24, 0.40)` con blur 4px.

### Composizione verticale
1. **Header sheet** — 56px alto:
   - Padding: `16px 20px`.
   - Border-bottom: 1px solid `#E5E4DF`.
   - Layout: Title "Il tuo profilo" (16px / 700 / `text-primary`) left + close X 32×32 ghost right.
2. **Avatar block** — 160px alto:
   - Padding: `24px 20px`.
   - Centrato.
   - Avatar 88×88, radius full, bg `#5F5E5A` fallback con iniziali 28px / 700 `#FAFAF9`. Border 2px `#E5E4DF` per stacco.
   - Hover overlay: bg `rgba(28, 27, 24, 0.40)` + camera icon 20px `#FAFAF9` centrato.
   - Caption sotto: "Clicca per cambiare foto" 12px / 500 / `text-muted`, margin-top 8px.
   - Role badge sotto caption: chip uppercase 11px / 600 (es. "ADMIN" badge neutral, oppure colore per ruolo).
3. **Form block** — flex 1, padding `8px 20px`:
   - Field "Nome completo" — Input default + label.
   - Field "Email" — Input default + label, **disabled** se email non modificabile (lettura).
   - Spazio tra field: 16px.
   - Helper text per email se disabled: "L'email è gestita dall'amministratore."
4. **Action block** — padding `16px 20px`:
   - Bottone primary md full-width: "Salva modifiche".
   - Stato disabled: se nessun campo modificato.
   - Stato saving: spinner + "Salvataggio...".
5. **Footer block** — fixed bottom, 56px alto:
   - Padding: `16px 20px`.
   - Border-top: 1px solid `#E5E4DF`.
   - Background: `#FAFAF9`.
   - Layout: link button con icona logout 16px + label "Disconnetti", color `#A83228`, font 13px / 600. Hover bg `#FFF0EE`, padding `8px 12px`, radius 6px.

### Stati ruolo (badge)
- ADMIN: badge bg `#1C1B18`, text `#FAFAF9` (info variant).
- RESPONSABILE: badge neutral.
- TECNICO: badge bg `#EAFBF1`, text `#1A7A3C`.
- LETTURA: badge bg `#F1EFE8`, text `#5F5E5A`.

### Componenti HeroUI consigliati
- `Drawer` placement="left".
- `Avatar` con fallback iniziali.
- `Input` per nome/email.
- `Button` primary per save, ghost destructive per logout.
- `Chip` per ruolo.

### Comportamento UX
- Apertura: click profile block in sidebar.
- Chiusura: backdrop, X, `Esc`, success di salvataggio (auto-close opzionale dopo 800ms).
- Field dirty tracking: button "Salva" disabled finché form pristine.
- Upload avatar: click avatar → file picker → preview immediato → save su click "Salva modifiche".
- Logout: conferma minimale (toast con undo? no — confirm dialog inline rapido).
- Email cambiata da admin altrove: refresh sheet o mostrare warning "L'email è cambiata, ricarica" se necessario.

### Microcopy
- Title sheet: "Il tuo profilo".
- Avatar caption: "Clicca per cambiare foto".
- Avatar uploading: "Caricamento immagine...".
- Field labels: "Nome completo", "Email".
- Email helper se disabled: "L'email è gestita dall'amministratore."
- Save button default: "Salva modifiche".
- Save button saving: "Salvataggio...".
- Save success toast: "Profilo aggiornato".
- Logout button: "Disconnetti".
- Logout confirm: "Sei sicuro di voler uscire?" → CTA "Disconnetti" (destructive).

### Errori da evitare
- ❌ Profile come modal centrato: meglio drawer per coerenza con altri side panel.
- ❌ Avatar gigante che spinge tutto sotto la fold: max 88px.
- ❌ Save button blu (come nello screenshot attuale): deve essere verde primary.
- ❌ Logout in basso senza separazione: necessita footer dedicato per evitare click accidentali.
- ❌ Cambio password DENTRO al sheet: usare flusso reset password dedicato linkato.
- ❌ Mostrare campo email come editabile se non lo è: stato disabled chiaro.

---

## 10. Toggle Light/Dark

### Layout
- Bottone 36×36 ghost in header (gruppo destro).
- Icona: `Sun` 18px in dark mode → "passa a light", `Moon` 18px in light mode → "passa a dark".
- Color: `#5F5E5A` default, hover `#1C1B18` su bg `#F1EFE8`.

### Stati visivi
- **Light mode** (default ArenaOS): icona `Moon`, suggestiva del passaggio inverso.
- **Dark mode**: icona `Sun`.
- Transition: icon swap con fade 150ms (no rotation).

### Comportamento UX
- Click → toggle istantaneo, animazione background app + sidebar in 200ms ease.
- Persistenza: `localStorage` key `arenaos.theme`, valori `light` / `dark` / `system`.
- Default: `system` (segue OS preference). Override su click: switch a opposto attuale.
- Long press (mobile) o right-click (desktop): apre menu con 3 opzioni: "Sistema", "Chiaro", "Scuro" (dropdown).

### Note tema dark per ArenaOS
- Brand kit è specifico per **light mode**. Il dark mode è pianificato ma fuori scope di v1.
- In dark mode, il toggle deve esistere come affordance ma può temporaneamente risultare in stato "in arrivo" o forzato a light. Decisione operativa: in v1, il toggle commuta solo tra "Light" e "System" (light forzato).

### Componenti HeroUI consigliati
- `Button` ghost icon.
- `Tooltip` con label "Cambia tema".

### Microcopy
- Tooltip: "Cambia tema".
- Aria-label: "Cambia tema, attualmente [chiaro/scuro]".

### Errori da evitare
- ❌ Esporre dark mode senza che sia completamente designato: stato peggiore della UX.
- ❌ Toggle senza persistenza: ogni reload torna a default.
- ❌ Animazione di transizione brutale (es. flash): cross-fade 200ms.
- ❌ Cambiare tema senza sincronizzare la sidebar (resta dark sempre, by design).

---

## 11. Loading State (App Shell)

### Tipi di loading nello shell

**A. App boot (initial mount)**
- Full-screen.
- Logo ArenaOS centrato (40px alto).
- Spinner 24px sotto, color `#2ECC71`, gap 16px.
- Background `#FAFAF9`.
- Min visibile 200ms (evita flash).

**B. Route change loading**
- Top progress bar 2px in fondo all'header, color `#2ECC71`.
- Animazione: indeterminate, slide left → right con larghezza variabile, 1s loop.
- Visibile solo se route impiega >300ms a montare.

**C. Sidebar loading (raro, es. permessi cambiati)**
- Skeleton item: 36px altezza, bg `rgba(250,250,249,0.06)`, radius 8px, margin 8px orizzontale.
- 6 skeleton in successione.

**D. Header search loading**: vedi sezione 7.

**E. Header notifications loading**: vedi sezione 8.

**F. Content area loading**
- Page-level skeleton: combina skeleton di subheader (titolo + actions) + skeleton card grid + skeleton tabella.
- Skeleton match struttura attesa (no spinner centrale).

### Componenti HeroUI consigliati
- `Skeleton` con animation.
- `Spinner` per fallback dove skeleton non applicabile.
- `Progress` indeterminate per top bar.

### Comportamento UX
- Skeleton sempre preferito a spinner se layout è prevedibile.
- Skeleton min visibile 300ms per evitare flicker su connessioni veloci.
- Spinner solo per azioni non strutturate (button, polling).

### Errori da evitare
- ❌ Spinner full-screen blocca l'utente per route veloci: solo top bar.
- ❌ Skeleton senza shimmer: sembra layout rotto.
- ❌ Mismatch skeleton vs contenuto reale: fa "saltare" il layout.

---

## 12. Empty State (App Shell)

### Tipologie nello shell

**A. Sidebar — utente senza permessi su nessuna sezione**
- Caso edge raro. Mostrare in area contenuto:
  - Icona lock 40px in cerchio `#F1EFE8` 64×64.
  - Title: "Nessuna sezione disponibile" (16px / 700).
  - Description: "Contatta l'amministratore per ottenere l'accesso." (14px / 400 / `text-secondary`).
  - CTA: "Contatta supporto" (button secondary md).

**B. Search — nessun risultato**: vedi sezione 7.

**C. Notifications — nessuna notifica**: vedi sezione 8.

**D. Profile Sheet — campi minimi (nuovo utente)**
- Nessun avatar: cerchio fallback con iniziali primarie.
- Caption: "Aggiungi una foto profilo" (link primary).

### Layout standard empty state (riutilizzato in modulo)
- Container centrato, max-width 360px, padding verticale 64px.
- Icona 40px in cerchio bg `#F1EFE8` 64×64 (radius full).
- Title 16px / 700 / `text-primary`, margin-top 16px.
- Description 14px / 400 / `text-secondary`, margin-top 6px, text-align center.
- CTA button md primary (se applicabile), margin-top 20px.
- Link secondario opzionale 13px / 500 / `text-muted` margin-top 12px.

### Componenti HeroUI consigliati
- Layout custom (non c'è `EmptyState` nativo HeroUI).
- `Button` per CTA.

### Comportamento UX
- Empty state sempre azionabile: deve dare un next step.
- Non mostrare empty state durante loading (priorità: loading → empty se vuoto reale → error se fallito).

### Microcopy
- Tutti i copy positivi/orientativi, mai negativi puri.
- Esempio: "Tutto sotto controllo" invece di "Nessuna notifica".

### Errori da evitare
- ❌ Empty con solo "Nessun dato": sempre titolo + descrizione + CTA.
- ❌ Icone tristi / decorative emoji: lucide-react neutrale.
- ❌ Empty layout diverso tra sezioni: usare lo stesso pattern ovunque.

---

## 13. Error State (App Shell)

### Tipologie nello shell

**A. Boot error (app non si avvia)**
- Full-screen.
- Logo grayscale.
- Icona `AlertCircle` 40px color `#A83228` in cerchio `#FFF0EE` 64×64.
- Title: "Qualcosa non ha funzionato" (16px / 700).
- Description: "Non riusciamo a caricare ArenaOS. Controlla la connessione o riprova." (14px / 400 / `text-secondary`).
- CTA primary: "Ricarica pagina" (full button md).
- CTA secondary link: "Contatta supporto" (text link primary).

**B. Route error / 404 / 403**
- In area contenuto, layout empty state ma:
- Icona `AlertTriangle` 40px color `#A83228` in cerchio `#FFF0EE` 64×64.
- Title 404: "Pagina non trovata".
- Title 403: "Accesso non autorizzato".
- Description 404: "La pagina che cerchi non esiste o è stata spostata."
- Description 403: "Non hai i permessi per visualizzare questa sezione."
- CTA: "Torna alla dashboard" (button secondary md).

**C. API error globale (toast)**
- Toast top-right desktop, top mobile.
- Width 360px.
- Background `#FFFFFF`, border 1px `#E5E4DF`, border-left 3px solid `#E24B4A`, radius 8px, shadow-md.
- Padding `12px 16px`.
- Layout: icon `AlertCircle` 16px `#A83228` left + content + close X 16px right.
- Title 14px / 600 / `text-primary`. Es. "Errore di connessione".
- Description 13px / 400 / `text-secondary`. Es. "Riprova tra un momento."
- Action opzionale: link "Riprova" 13px / 600 / `#1A7A3C`.
- Auto-dismiss: 6s default; con action, 10s.

**D. Search/notifications error**
- Banner inline dentro popover:
- Bg `#FFF0EE`, border-left 3px `#E24B4A`, padding `10px 12px`, radius 8px.
- Icon `AlertCircle` 14px `#A83228` + text 13px / 500 `#A83228`: "Impossibile caricare".
- Action inline: "Riprova" link 13px / 600 / `#1A7A3C`.

**E. Profile Sheet save error**
- Inline sotto bottone "Salva modifiche":
- Bg `#FFF0EE`, padding `8px 12px`, radius 6px.
- Icon `AlertCircle` 14px `#A83228` + text 12px / 500 / `#A83228`: "Errore salvataggio. Riprova."

### Componenti HeroUI consigliati
- `Toast` (sonner-style già adottato dall'app).
- Layout custom per banner inline.
- `Button` secondary/primary per CTA recovery.

### Comportamento UX
- Errori sempre ricuperabili: ogni error state deve avere un'azione (Riprova, Ricarica, Torna a, Contatta).
- Errori transient (network): toast con "Riprova".
- Errori permanenti (404, 403): pagina dedicata.
- Mai più di 1 toast errore simultaneo per stessa azione (deduplicate).

### Microcopy patterns
- "Qualcosa non ha funzionato" — generico.
- "Non riusciamo a caricare [X]" — specifico modulo.
- "Errore di connessione" — network.
- "Sessione scaduta. Effettua di nuovo l'accesso." — auth.
- "Riprova" — sempre come azione primaria recovery.
- "Contatta supporto" — fallback link.

### Errori da evitare
- ❌ Error state senza azione: utente bloccato.
- ❌ Toast errore stack infiniti: deduplicare.
- ❌ Error message tecnico ("500 Internal Server Error" raw): tradurre in human language.
- ❌ Errore senza distinguere transient da permanent: usare retry diverso.
- ❌ Error toast verde / icone neutre: usa i colori error chiari.

---

## 14. Saving State (App Shell)

### Tipologie

**A. Profile Sheet saving**
- Bottone "Salva modifiche" → disabilitato + spinner 16px leading + label "Salvataggio...".
- Width fissa per evitare layout shift.
- Su success: bottone torna a "Salva modifiche" (disabled, form pristine), toast top-right "Profilo aggiornato" (success variant), drawer rimane aperto o chiude dopo 800ms (decisione: chiude).

**B. Route change con form dirty (warning)**
- Modal di conferma:
  - Title: "Hai modifiche non salvate".
  - Description: "Se esci ora, le modifiche andranno perse."
  - CTA destructive: "Esci senza salvare".
  - CTA primary: "Continua a modificare".

**C. Inline saving indicator (es. drawer/form persistente)**
- Position: footer drawer/form, allineato sinistra.
- Layout: dot 6px + label 12px / 500 / `text-secondary`.
- Stati:
  - **Idle**: dot `#D3D1C7`, label "Tutte le modifiche salvate".
  - **Saving**: spinner 12px `text-secondary`, label "Salvataggio...".
  - **Saved**: dot `#2ECC71`, label "Salvato · ora" (timestamp `HH:mm`).
  - **Error**: dot `#E24B4A`, label "Errore salvataggio · Riprova" (link inline).

**D. Toast success (post-save)**
- Width 360px.
- Bg `#FFFFFF`, border 1px `#E5E4DF`, border-left 3px solid `#2ECC71`, radius 8px, shadow-md.
- Icon `CheckCircle` 16px `#1A7A3C` + content.
- Title 14px / 600 `text-primary`. Es. "Profilo aggiornato".
- Description opzionale 13px / 400 `text-secondary`.
- Auto-dismiss: 4s.

**E. Optimistic update**
- Modifica applicata immediatamente in UI con opacity 0.7 + dot saving inline.
- Su success: opacity 1, dot success per 1.5s poi rimosso.
- Su error: rollback con shake 200ms + toast error.

### Componenti HeroUI consigliati
- `Button` con `isLoading` prop nativo.
- `Toast` per feedback.
- `Modal` per warning unsaved changes.

### Comportamento UX
- Saving state sempre osservabile: l'utente non deve mai chiedersi "ha salvato?".
- Disabilitare azioni concorrenti durante save (no doppio click).
- Network slow (>2s): mostrare progress più esplicito (toast "Salvataggio in corso...").
- Network failure: rollback ottimistico + retry suggerito.

### Microcopy
- Saving: "Salvataggio...".
- Saved: "Salvato · [HH:mm]" oppure "Tutte le modifiche salvate".
- Save error: "Errore salvataggio" + link "Riprova".
- Toast success: "[Entità] aggiornato" / "Modifiche salvate".
- Unsaved changes warning: "Hai modifiche non salvate".

### Errori da evitare
- ❌ Pulsante che sparisce durante save: causa layout shift.
- ❌ Saving senza feedback visivo: utente cerca conferma.
- ❌ Toast "Salvato!" + check rumoroso: success deve essere subtle.
- ❌ Stato "Saved" permanente: dopo 3s tornare a idle.
- ❌ Optimistic update senza rollback: dati incongruenti.

---

## Riepilogo cross-section

**Z-index dell'app shell** (dal basso):
- Content area: 0
- Sidebar / Header: 20–30
- Popover / Dropdown (search, notifications): 50
- Drawer (profile sheet, sidebar mobile): 55
- Modal: 60
- Toast: 70

**Animazioni globali**:
- Drawer slide-in: 200ms ease-out.
- Popover fade+slide: 150ms ease-out.
- Toast slide+fade: 200ms ease-out.
- Theme switch: 200ms ease.
- Skeleton shimmer: 1.5s ease-in-out infinite.

**Keyboard shortcuts**:
- `⌘K` / `Ctrl K`: apri global search.
- `Esc`: chiudi popover/drawer/modal attivo (priorità: ultimo aperto).
- `⌘B` / `Ctrl B`: toggle sidebar collapsed (tablet/desktop).
- `?`: apre help shortcuts overlay (futura, non in scope ora).

**Accessibilità**:
- Tutti i bottoni con aria-label dove icona-only.
- Focus visible primary (`#2ECC71`) sempre visibile.
- Skip-to-content link 1° tab (visibile solo on focus).
- Trap focus in drawer/modal aperti.
- Esc chiude sempre l'overlay top.
