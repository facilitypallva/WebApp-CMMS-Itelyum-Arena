# ArenaOS — Design System

> Brand kit, tokens, tipografia, componenti base. Fonte di verità per ogni decisione visiva nel prodotto.

---

## 1. Brand Personality

ArenaOS è il **sistema operativo della facility**. Non un gestionale generico, ma uno strumento professionale costruito attorno a chi gestisce arene sportive ad alta pressione.

**Tratti**:
- **Premium operativo** — senso di prodotto pagato, non di tool gratuito.
- **Caldo e umano** — superficie color carta/avorio invece del solito grigio freddo da SaaS.
- **Tecnico e diretto** — niente ornamenti, niente illustrazioni, niente gradienti decorativi.
- **Confidente** — gerarchie nette, peso tipografico forte, decisioni visive non timide.
- **Sport-tech** — verde acceso come unico segnale di energia e azione.
- **Compatto** — densità informativa alta ma sempre leggibile.

**Voce visiva**: "Strumento di lavoro che vale il prezzo. Stadio, non ufficio."

**Antipattern**: non è un consumer app, non è un dashboard analytics, non è uno strumento HR.

---

## 2. Visual Direction

- **Background app caldo color carta** (`#FAFAF9`), non bianco freddo, non grigio.
- **Sidebar dark profonda** (`#1C1B18`), quasi nera ma calda — contrasto netto con l'area contenuto.
- **Verde unico colore d'accento** — usato con parsimonia su CTA primarie, stati positivi e indicatori attivi. Mai decorativo.
- **Tipografia bold e compatta** — titoli a peso 700, tracking leggermente stretto, gerarchia chiarissima a colpo d'occhio.
- **Card flat con bordo sottile** — nessuna shadow pesante, nessun inner glow, nessun gradiente.
- **Border come strumento di gerarchia primario**, non shadow.
- **Density operativa**: padding contenuti 24/28px, righe tabella 44–48px, spacing interno componenti 12–16px.
- **Numeri grossi e neri** sui KPI — l'utente legge la cifra prima del label.
- **Colored accents su badge e stati**, mai su superfici grandi.

---

## 3. Palette — Ruolo Pratico

### Background & Surfaces

| Token | Hex | Ruolo |
|---|---|---|
| `bg-app` | `#FAFAF9` | Background principale dell'area contenuto. Più caldo del bianco, riduce fatica visiva. |
| `bg-surface` | `#F1EFE8` | Sezioni secondarie, subheader pagina, hover row tabella, sfondo gruppi filtri, callout informativi. |
| `bg-card` | `#FFFFFF` | Card, modali, drawer, dropdown, popover. Unica superficie pura bianca. |
| `bg-sidebar` | `#1C1B18` | Sidebar fissa. Stessa hex del testo principale per coerenza dark/light. |

### Testo

| Token | Hex | Ruolo |
|---|---|---|
| `text-primary` | `#1C1B18` | Tutti i testi principali, titoli, valori in tabella, KPI. **Mai** usare grigi al posto di questo per il body. |
| `text-secondary` | `#5F5E5A` | Label di contesto, descrizioni sotto titolo, metadata, breadcrumb. **Più scuro** del classico grigio dashboard per leggibilità. |
| `text-muted` | `#888780` | Placeholder, helper text, timestamp, contatori, testi disabilitati. |
| `text-on-dark` | `#FAFAF9` | Testo su sidebar e su superfici scure. |
| `text-on-dark-muted` | `#A8A6A0` | Testo secondario su sidebar (label gruppo, metadata utente). |

### Border

| Token | Hex | Ruolo |
|---|---|---|
| `border-default` | `#E5E4DF` | Bordo standard di card, input, divider tabelle, separatori. Sostituisce le shadow nella creazione di gerarchia. |
| `border-strong` | `#D3D1C7` | Bordo focus visibile, divider sezione importanti, bordo card selezionata, hover su input. |

### Primary Accent

| Token | Hex | Ruolo |
|---|---|---|
| `primary` | `#2ECC71` | Bottone primario, link attivi, indicatore voce sidebar attiva, focus ring, progress bar, tab attiva, badge "attivo". **Singolo accento del prodotto**. |
| `primary-hover` | `#27B463` | Hover/active state del primary. |
| `primary-pressed` | `#1F9651` | Stato pressed/active. |
| `primary-dark-text` | `#0A3D1F` | Testo verde scuro su `success-bg` o su superfici chiare quando serve un'etichetta verde leggibile. **Non usare `#2ECC71` come testo su sfondo chiaro: troppo poco contrasto.** |

### Status — Success

| Token | Hex | Ruolo |
|---|---|---|
| `success-bg` | `#EAFBF1` | Background badge, riga tabella con stato "in regola", banner positivo. |
| `success-text` | `#1A7A3C` | Testo dentro badge success, icona success. |

### Status — Warning

| Token | Hex | Ruolo |
|---|---|---|
| `warning-bg` | `#FFF3E8` | Background badge "in scadenza", riga in attenzione, banner warning. |
| `warning-text` | `#A8531A` | Testo dentro badge warning, icona warning. |
| `warning-accent` | `#E8782A` | Indicatore puntiforme (dot), bordo focus warning, progress warning. |

### Status — Error

| Token | Hex | Ruolo |
|---|---|---|
| `error-bg` | `#FFF0EE` | Background badge "scaduto", riga critica, banner errore, alert distruttivi. |
| `error-text` | `#A83228` | Testo dentro badge error, icona error, validation message. |
| `error-accent` | `#E24B4A` | Indicatore puntiforme, bordo input invalido, bottone destructive. |

### Regola d'oro palette
Verde **solo** per: CTA primaria, stato attivo, success, indicatore "attivo ora". **Mai** verde decorativo, **mai** verde su grandi superfici, **mai** gradienti verdi. **Nessun blu nel prodotto**.

---

## 4. Tipografia

**Font globale**: `"Inter", ui-sans-serif, system-ui, sans-serif`
**Pesi disponibili**: 400, 500, 600, 700
**Feature settings consigliate**: `"cv11", "ss01", "ss03"` (per cifre tabellari più nitide), `"tnum"` su tabelle e KPI.

| Stile | Size | Line-height | Weight | Letter-spacing | Color | Uso |
|---|---|---|---|---|---|---|
| **Page Title** | 24px | 30px | 700 | -0.02em | `text-primary` | Titolo pagina nell'header (es. "Dashboard Generale", "Asset"). |
| **Section Title** | 16px | 22px | 700 | -0.01em | `text-primary` | Titolo di card o sezione. |
| **Card Title** | 14px | 20px | 600 | -0.005em | `text-primary` | Titolo card secondaria, sottosezione, label panel laterale. |
| **Subtitle / Caption** | 13px | 18px | 500 | 0 | `text-secondary` | Descrizione sotto Section Title. |
| **Table Header** | 11px | 16px | 600 | 0.06em | `text-muted` | Header tabella, **UPPERCASE**. |
| **Table Body** | 14px | 20px | 500 | 0 | `text-primary` | Celle tabella standard. |
| **Table Body Secondary** | 13px | 18px | 400 | 0 | `text-secondary` | Metadata/seconda riga in cella tabella. |
| **KPI Number** | 32px | 36px | 700 | -0.03em | `text-primary` | Cifra grande KPI. `font-variant-numeric: tabular-nums`. |
| **KPI Label** | 11px | 16px | 600 | 0.08em | `text-muted` | Label KPI sopra il numero, **UPPERCASE**. |
| **KPI Delta** | 12px | 16px | 600 | 0 | dipende stato | Variazione/trend sotto KPI. |
| **Body** | 14px | 20px | 400 | 0 | `text-primary` | Testo corrente nei form, descrizioni. |
| **Body Small** | 13px | 18px | 400 | 0 | `text-secondary` | Helper text, descrizione field. |
| **Badge Text** | 11px | 14px | 600 | 0.04em | dipende variant | Testo dentro badge stato, **UPPERCASE**. |
| **Button Text Default** | 14px | 20px | 600 | -0.005em | dipende variant | Bottone size md. |
| **Button Text Small** | 13px | 18px | 600 | 0 | dipende variant | Bottone size sm. |
| **Button Text Large** | 15px | 22px | 600 | -0.01em | dipende variant | CTA principali. |
| **Input Text** | 14px | 20px | 500 | 0 | `text-primary` | Valore digitato in input. |
| **Input Label** | 13px | 18px | 600 | 0 | `text-primary` | Label sopra input. |
| **Sidebar Group Label** | 11px | 16px | 600 | 0.10em | `text-on-dark-muted` | "PANORAMICA", "OPERATIVITÀ", **UPPERCASE**. |
| **Sidebar Item** | 13.5px | 18px | 500 | 0 | `text-on-dark` | Voce navigazione sidebar. |
| **Sidebar Item Active** | 13.5px | 18px | 600 | 0 | `text-on-dark` | Voce attiva. |
| **Breadcrumb** | 13px | 18px | 500 | 0 | `text-secondary` | Breadcrumb in header. Last segment in `text-primary` weight 600. |
| **Mono / Code** | 13px | 18px | 500 | 0 | `text-primary` | ID, codici WO, codici asset. **Per coerenza solo-Inter, usare `font-variant-numeric: tabular-nums` invece di mono**. |

**Regole tipografiche**:
- Mai `text-secondary` per body principale.
- Mai weight 400 sui titoli.
- Mai font diverso da Inter.
- Tutte le cifre in tabelle, KPI e date: `font-variant-numeric: tabular-nums`.

---

## 5. Spacing System

Scala basata su 4px, con valori operativi compatti.

| Token | Value | Uso tipico |
|---|---|---|
| `space-0` | 0px | Reset |
| `space-1` | 4px | Gap tra icona e testo dentro badge, micro-padding |
| `space-2` | 8px | Padding interno badge, gap tra label e input piccolo |
| `space-3` | 12px | Gap interno card secondarie, gap label/input |
| `space-4` | 16px | Padding standard interno componenti, gap form |
| `space-5` | 20px | Padding card interna (verticale) |
| `space-6` | 24px | Padding card interna (orizzontale), gap sezioni form |
| `space-7` | 28px | Padding contenuto pagina (desktop) |
| `space-8` | 32px | Gap tra sezioni di pagina, gap tra gruppi di KPI |
| `space-10` | 40px | Spacing tra macro-blocchi pagina |
| `space-12` | 48px | Margin top header sezione importante |

**Padding componenti chiave**:
- Card content: `24px 24px`, `20px 24px` se compatta.
- Page content: `28px` desktop, `20px` mobile.
- Sidebar item: `8px 12px`.
- Button md: `10px 16px`. Sm: `6px 12px`. Lg: `12px 20px`.
- Input md: `10px 14px`.
- Table cell: `12px 16px`.
- Modal content: `24px`. Header/footer: `20px 24px`.

**Gap tra elementi**:
- Form fields: 16px verticale.
- KPI cards in row: 16px.
- Card grid in dashboard: 20px.
- Section blocks: 32px.

---

## 6. Radius System

| Token | Value | Uso |
|---|---|---|
| `radius-xs` | 4px | Checkbox, indicatori puntiformi, dot leader |
| `radius-sm` | 6px | Badge, tag, chip piccoli |
| `radius-md` | 8px | Input, button default, dropdown item |
| `radius-lg` | 10px | Card, button large, panel laterale |
| `radius-xl` | 12px | Modal, drawer, dialog grandi, card KPI featured |
| `radius-2xl` | 16px | Solo componenti hero/marketing — **non usare nell'app interna** |
| `radius-full` | 9999px | Avatar, dot indicator, toggle switch |

**Default radius app interna**: `8–10px`. Il design non è "soft consumer", è "tool professionale".

---

## 7. Shadow System

ArenaOS usa **border come strumento primario di gerarchia**, le shadow sono sussidiarie e leggerissime.

| Token | Valore | Uso |
|---|---|---|
| `shadow-none` | none | Default per card statiche con border |
| `shadow-xs` | `0 1px 2px 0 rgba(28, 27, 24, 0.04)` | Card hover, dropdown chiuso |
| `shadow-sm` | `0 2px 4px 0 rgba(28, 27, 24, 0.05), 0 1px 2px 0 rgba(28, 27, 24, 0.04)` | Dropdown aperto, popover, tooltip |
| `shadow-md` | `0 4px 12px -2px rgba(28, 27, 24, 0.08), 0 2px 4px -2px rgba(28, 27, 24, 0.04)` | Modal, drawer overlay |
| `shadow-lg` | `0 12px 32px -8px rgba(28, 27, 24, 0.16), 0 4px 8px -4px rgba(28, 27, 24, 0.06)` | Modal large centered, command palette |
| `shadow-focus-primary` | `0 0 0 3px rgba(46, 204, 113, 0.20)` | Focus ring elementi primari |
| `shadow-focus-error` | `0 0 0 3px rgba(226, 75, 74, 0.20)` | Focus su input invalido |

**Regola**: **mai** shadow su card di contenuto operativo statico. La gerarchia viene dal border (`#E5E4DF`) e dal background card bianco (`#FFFFFF`) che stacca dal background app caldo (`#FAFAF9`).

---

## 8. Button Styles

### Variants

**Primary** (azioni principali, CTA)
- Background: `#2ECC71`
- Text: `#0A3D1F`
- Border: none
- Hover: bg `#27B463`
- Active: bg `#1F9651`
- Focus: `shadow-focus-primary`
- Disabled: bg `#E5E4DF`, text `#888780`

**Secondary** (azioni neutre, default)
- Background: `#FFFFFF`
- Text: `#1C1B18`
- Border: 1px solid `#E5E4DF`
- Hover: bg `#F1EFE8`, border `#D3D1C7`
- Active: bg `#E5E4DF`
- Focus: `shadow-focus-primary` + border `#2ECC71`

**Ghost** (azioni terziarie, in toolbar)
- Background: transparent
- Text: `#1C1B18`
- Border: none
- Hover: bg `#F1EFE8`
- Active: bg `#E5E4DF`

**Destructive** (eliminazione, azioni distruttive)
- Background: `#FFFFFF`
- Text: `#A83228`
- Border: 1px solid `#FFF0EE`
- Hover: bg `#FFF0EE`, border `#E24B4A`, text `#A83228`
- Pressed: bg `#FFE2DE`

**Destructive Solid** (conferma in dialog distruttivi)
- Background: `#E24B4A`
- Text: `#FFFFFF`
- Hover: bg `#C93E3D`
- Focus: `shadow-focus-error`

**Link**
- Color: `#1A7A3C`
- Underline solo on hover
- Weight: 600

### Sizes

| Size | Height | Padding | Font | Icon size |
|---|---|---|---|---|
| sm | 32px | 6px 12px | 13px / 600 | 14px |
| md (default) | 36px | 10px 16px | 14px / 600 | 16px |
| lg | 44px | 12px 20px | 15px / 600 | 18px |
| icon-only sm | 32×32 | — | — | 16px |
| icon-only md | 36×36 | — | — | 18px |

### Stati comuni
- Border-radius: `8px` (md, sm), `10px` (lg).
- Transition: `background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease`.
- Loading: spinner `currentColor`, testo invariato (no shift), bottone disabilitato.
- Icon + label gap: 8px.

---

## 9. Card Styles

### Card Default
- Background: `#FFFFFF`
- Border: 1px solid `#E5E4DF`
- Radius: `10px`
- Shadow: none
- Padding: `24px`
- Hover (se interattiva): border `#D3D1C7`, `shadow-xs`

### Card Header (interna)
- Margin-bottom: 16px
- Title: Section Title o Card Title
- Subtitle: 13px / 500 / `text-secondary`
- Action area destra: ghost icon button 32×32

### Card KPI
- Padding: `20px 24px`
- Layout interno verticale:
  - Riga 1: KPI Label (uppercase, muted) + icona 18px allineata a destra
  - Riga 2 (margin-top 8px): KPI Number
  - Riga 3 (margin-top 4px, opzionale): KPI Delta con dot 6px colorato secondo stato
- Border: 1px solid `#E5E4DF`
- Background: `#FFFFFF`
- Hover: border `#D3D1C7`

### Card Featured (es. KPI critico, highlight)
- Background: `#FFFFFF`
- Border-left: 3px solid `#2ECC71` (o colore status appropriato)
- Border altri lati: 1px solid `#E5E4DF`
- Padding: `20px 24px`

### Card Section (raggruppa cards interne)
- Background: `#F1EFE8`
- Border: nessuno
- Radius: `12px`
- Padding: `20px`
- Cards interne: white su superficie carta — contrasto naturale.

---

## 10. Badge / Status System

Tutti i badge seguono lo stesso schema strutturale.

### Struttura
- Padding: `4px 8px` (default), `2px 6px` (compact)
- Radius: `6px`
- Font: 11px / 600 / 0.04em / UPPERCASE
- Inline-flex, gap 4px se con icona/dot
- Border: opzionale, 1px solid stesso color del testo a opacità bassa

### Variants

| Variant | Background | Text | Dot color | Uso |
|---|---|---|---|---|
| **Success** / In Regola / Attivo | `#EAFBF1` | `#1A7A3C` | `#2ECC71` | Asset in regola, WO completato, utente attivo |
| **Warning** / In Scadenza | `#FFF3E8` | `#A8531A` | `#E8782A` | Asset in scadenza, WO in attesa |
| **Error** / Scaduto / Critico | `#FFF0EE` | `#A83228` | `#E24B4A` | Asset scaduto, ticket urgente |
| **Neutral** / Default | `#F1EFE8` | `#5F5E5A` | `#888780` | Categoria, tag generico, stato neutro |
| **Info** / In Lavorazione | `#1C1B18` (solid) | `#FAFAF9` | `#2ECC71` | WO in corso, work in progress |
| **Outline** | `transparent` | `#1C1B18` | — | Tag categoria leggera con border `#E5E4DF` |

### Dot indicator (per status leggera, senza bg)
- Cerchio 8px + label
- Esempi tabella: `● In regola` (verde), `● In scadenza` (arancio), `● Scaduto` (rosso)

### Priority Badges
- Alta: bg `#FFF0EE`, text `#A83228`, label "ALTA"
- Media: bg `#FFF3E8`, text `#A8531A`, label "MEDIA"
- Bassa: bg `#F1EFE8`, text `#5F5E5A`, label "BASSA"
- Critica: bg `#A83228` solid, text `#FFFFFF`, label "CRITICA"

---

## 11. Input / Form Styles

### Input Field Default
- Height: 40px
- Padding: `10px 14px`
- Border: 1px solid `#E5E4DF`
- Radius: `8px`
- Background: `#FFFFFF`
- Font: 14px / 500 / `text-primary`
- Placeholder: `text-muted`
- Hover: border `#D3D1C7`
- Focus: border `#2ECC71`, `shadow-focus-primary`, no outline
- Disabled: bg `#F1EFE8`, text `text-muted`, cursor not-allowed
- Invalid: border `#E24B4A`, `shadow-focus-error` se focus

### Input con Icona Leading
- Padding-left: 40px
- Icon size: 16px, color `text-muted`, position absolute left 14px

### Label
- Display block, margin-bottom 6px
- Font: Input Label (13px / 600 / `text-primary`)
- Required: asterisco rosso `#E24B4A` con margin-left 2px

### Helper Text
- Font: 12px / 400 / `text-muted`
- Margin-top: 6px

### Error Message
- Font: 12px / 500 / `#A83228`
- Margin-top: 6px
- Icona warning 12px leading opzionale

### Textarea
- Min-height: 96px
- Padding: `12px 14px`
- Resize: vertical only

### Select / Dropdown
- Stessi stili input
- Chevron 16px right, color `text-muted`
- Menu: bg `#FFFFFF`, border `#E5E4DF`, radius `10px`, `shadow-sm`, padding 4px
- Item: padding `8px 12px`, radius `6px`, hover bg `#F1EFE8`, selected bg `#EAFBF1` text `#1A7A3C`

### Checkbox
- 16×16px, radius `4px`, border 1.5px solid `#D3D1C7`
- Checked: bg `#2ECC71`, border `#2ECC71`, check `#FFFFFF`
- Focus: `shadow-focus-primary`

### Radio
- 16×16px, full radius
- Stessi colori del checkbox

### Toggle / Switch
- 36×20px, full radius
- Off: bg `#D3D1C7`, knob `#FFFFFF`
- On: bg `#2ECC71`, knob `#FFFFFF`
- Knob 16×16, transition 150ms

### Search Input (header globale)
- Height: 36px
- Background: `#F1EFE8`
- Border: none
- Radius: `8px`
- Icon search 16px leading, color `text-muted`
- Placeholder: "Cerca asset, ticket o WO..."
- Focus: bg `#FFFFFF`, border 1px `#E5E4DF`, `shadow-focus-primary`
- Width: 320px desktop, 100% mobile

---

## 12. Table Styles

### Container
- Background: `#FFFFFF`
- Border: 1px solid `#E5E4DF`
- Radius: `10px`
- Overflow: hidden (per radius)
- No shadow

### Toolbar tabella (sopra header)
- Padding: `16px 20px`
- Border-bottom: 1px solid `#E5E4DF`
- Layout: search input left, filtri center, action button right
- Background: `#FFFFFF`

### Header row
- Background: `#FAFAF9`
- Border-bottom: 1px solid `#E5E4DF`
- Padding cell: `10px 16px`
- Font: Table Header (11px / 600 / 0.06em / `text-muted` / UPPERCASE)
- Sortable: cursor pointer, icona chevron 12px gap 4px, hover text `text-secondary`
- Sticky possibile per tabelle scrollabili

### Body row
- Height: 48px (default), 56px se cella ha 2 righe (titolo + meta), 64px per Asset/WO/Ticket dove la cella principale ha titolo + meta
- Padding cell: `12px 16px`
- Border-bottom: 1px solid `#E5E4DF` (ultima row no border)
- Background: `#FFFFFF`
- Hover: bg `#FAFAF9`
- Selected: bg `#EAFBF1` con border-left 3px solid `#2ECC71` (inset)

### Cell content
- Default: Table Body (14px / 500 / `text-primary`)
- Cella secondaria (titolo + sottotitolo):
  - Riga 1: 14px / 500 / `text-primary`
  - Riga 2: 12px / 400 / `text-muted`
- Cifre: `tabular-nums` allineate a destra
- ID/Codici: weight 500, color `text-primary` (no mono, ma `tabular-nums`)
- Avatar + nome: avatar 28px + 8px gap + testo

### Action cell
- Allineata a destra, width fissa 56–96px
- Ghost icon button 28–32px, "more" icon

### Empty / Loading row
- Spans full width
- Min-height: 200px
- Centro contenuto

### Pagination footer
- Padding: `12px 20px`
- Border-top: 1px solid `#E5E4DF`
- Layout: count info left, page controls right
- Background: `#FAFAF9`
- Font: 13px / 500 / `text-secondary`

---

## 13. Modal / Drawer Styles

### Modal (centered)
- Max-width: 560px (sm) / 720px (md) / 960px (lg)
- Background: `#FFFFFF`
- Border: 1px solid `#E5E4DF`
- Radius: `12px`
- Shadow: `shadow-lg`
- Overlay: `rgba(28, 27, 24, 0.50)` con `backdrop-filter: blur(4px)`

**Header**: Padding `20px 24px`, border-bottom 1px `#E5E4DF`. Title: Section Title (16px / 700). Close button: ghost 32×32 top-right. Subtitle opzionale: 13px / 500 / `text-secondary`.

**Body**: Padding `24px`. Background `#FFFFFF`. Scrollable se overflow.

**Footer**: Padding `16px 24px`. Border-top 1px `#E5E4DF`. Background `#FAFAF9`. Layout: secondary left/spacer, primary right. Gap bottoni 8px.

### Drawer (right side)
- Width: 480px (sm) / 600px (md) / 720px (lg) / 800px (xl)
- Background: `#FFFFFF`
- Border-left: 1px solid `#E5E4DF`
- Shadow: `shadow-md`
- Header/body/footer come modal
- Animation: slide-in-right 200ms ease-out

### Sheet (mobile / contestuale)
- Bottom sheet: width 100%, max-height 90vh
- Border-radius top: `16px`
- Drag handle: 32×4px bar `#D3D1C7` centrato top con margin 8px

---

## 14. Loading State

### Skeleton (preferred per layout known)
- Background: `#F1EFE8`
- Highlight gradient: `linear-gradient(90deg, #F1EFE8 0%, #E5E4DF 50%, #F1EFE8 100%)`
- Animation: shimmer 1.5s ease-in-out infinite
- Radius: stesso del componente che sostituisce
- Esempi:
  - Skeleton testo: height 14px, width variable (40–80%), radius 4px
  - Skeleton numero KPI: height 32px, width 80px, radius 6px
  - Skeleton card KPI: height 92px, width full, radius 10px
  - Skeleton row tabella: height 48–64px, divider standard

### Spinner
- Size: 16px (inline button), 20px (default), 32px (page)
- Color: `currentColor` (eredita dal contesto)
- Animation: rotate 600ms linear infinite
- Stroke-width 2px, dash array 60/30

### Page Loading
- Centro pagina, spinner 32px + label "Caricamento..." (13px / 500 / `text-secondary`) gap 12px

### Inline Loading (tabella, lista)
- Riga skeleton replicata 5–8 volte
- Placeholder visibile finché dati non arrivano

---

## 15. Empty State

### Layout
- Centro contenuto, padding verticale 48–64px
- Max-width contenuto: 360px

### Composizione
- **Icona**: 40×40px, color `text-muted`, in cerchio 64×64 bg `#F1EFE8` radius full
- **Titolo**: 16px / 700 / `text-primary`, margin-top 16px
- **Descrizione**: 14px / 400 / `text-secondary`, margin-top 6px, text-align center
- **CTA**: button primary md, margin-top 20px
- **Link secondario** (opzionale): 13px / 500 / `text-muted` / underline on hover, margin-top 12px

### Esempi copy
- Tabella vuota: "Nessun work order al momento — Crea il primo per iniziare a tracciare gli interventi." + CTA "Crea Work Order"
- Risultati ricerca: "Nessun risultato per «termine» — Prova con altri filtri o controlla l'ortografia."
- Sezione vuota dashboard: "Non ci sono dati ancora — I trend appariranno dopo il primo mese di operatività."

### Empty leggero (in cella tabella o piccoli spazi)
- Solo dash em (—) in `text-muted`
- O stringa neutra: "Nessun dato" 13px / 400 / `text-muted`

---

## 16. Error State

### Page-level error
- Stesso layout empty state, ma:
- Icona in cerchio bg `#FFF0EE`, color `#A83228`
- Titolo: "Qualcosa non ha funzionato" o specifico
- Descrizione: messaggio errore + suggerimento azione
- CTA: button secondary "Riprova" + button ghost "Contatta supporto"

### Inline error (toast/banner)
- Banner: bg `#FFF0EE`, border-left 3px solid `#E24B4A`, padding `12px 16px`, radius `8px`
- Icona alert 16px `#A83228` leading
- Testo: 13px / 500 / `#A83228`
- Close icon 16px ghost button right
- Multi-line: descrizione 13px / 400 / `#A83228` opacity 0.85

### Toast (sonner-style)
- Width: 360px
- Background: `#FFFFFF`
- Border: 1px solid `#E5E4DF`
- Border-left: 3px solid colore status
- Padding: `12px 16px`
- Shadow: `shadow-md`
- Title: 14px / 600 / `text-primary`
- Description: 13px / 400 / `text-secondary`
- Position: bottom-right desktop, top mobile
- Auto-dismiss: 5s default

### Field error
- Vedi sezione Input — border `#E24B4A`, message sotto field

---

## 17. Saving State

### Auto-save indicator (header form, drawer)
- Position: footer drawer, allineato sinistra
- Layout: dot 6px + label 12px / 500 / `text-secondary`
- Stati:
  - **Idle**: dot `#D3D1C7`, label "Tutte le modifiche salvate"
  - **Saving**: spinner 12px `text-secondary`, label "Salvataggio..."
  - **Saved**: dot `#2ECC71`, label "Salvato · ora" (timestamp aggiornato)
  - **Error**: dot `#E24B4A`, label "Errore salvataggio · Riprova", link inline

### Submit button saving
- Bottone primary in stato disabilitato
- Spinner 16px leading + testo "Salvataggio..." (sostituisce "Salva")
- Width fissa per evitare layout shift

### Optimistic update con rollback
- Riga tabella aggiornata immediatamente con opacity 0.7 + dot saving
- Su success: opacity 1 + dot success per 1.5s, poi nessun indicatore
- Su error: rollback + toast error

### Bulk action saving
- Banner top-of-table: bg `#FAFAF9`, border `#E5E4DF`, padding `10px 16px`
- "Aggiornamento di N elementi..." + spinner 14px

---

## 18. Regole Visive da Seguire

1. **Una sola azione primaria per schermata.** Verde è raro, deve guidare l'occhio.
2. **Border prima di shadow.** L'app interna è flat per design.
3. **Numeri grandi, label piccoli.** I KPI devono leggersi a 2 metri di distanza.
4. **Sidebar sempre dark, area lavoro sempre chiara.** Mai contaminare i due mondi.
5. **Background app caldo (`#FAFAF9`), card bianche pure (`#FFFFFF`).** Il contrasto naturale crea gerarchia senza shadow.
6. **Testo primario nero/quasi-nero (`#1C1B18`).** Mai grigio per body principale.
7. **Density operativa**: padding pagina 28px, righe tabella 44–64px, card 24px.
8. **Tabelle sono il cuore del prodotto.** Devono essere ordinate, nitide, scansionabili.
9. **Status colorati solo dove serve decidere**: badge, dot, banner. Mai su superfici larghe.
10. **Verde come segno di "azione completata o disponibile"**, mai come decorazione.
11. **Tipografia bold sui titoli (700)**, normale sul body (400–500). Gerarchia per peso, non per colore.
12. **Uppercase + tracking aperto solo per**: KPI label, table header, badge text, sidebar group label. Mai sui titoli di pagina.
13. **Tabular nums ovunque ci siano cifre comparabili**: KPI, tabelle, date, valute.
14. **Spacing coerente con scala 4px.** Niente valori arbitrari.
15. **Radius 8–10px è il default app**, 12px solo per modal/drawer. Niente "soft" radius da consumer.
16. **Focus visibile sempre.** Anello verde 3px su tutti gli elementi interattivi.
17. **Empty state mai "vuoto vuoto"**: sempre icona, titolo, descrizione, CTA.
18. **Ogni stato osservabile**: loading, saving, error, success. Nessuna azione "muta".

---

## 19. Errori Visivi da Evitare

1. ❌ **Blu come primary** (resta dell'attuale palette navy — bandire).
2. ❌ **Verde brillante usato decorativamente** su sfondi grandi, gradienti, hero overlay.
3. ❌ **Background bianco freddo (`#FFFFFF`) per l'area app**: deve essere caldo (`#FAFAF9`).
4. ❌ **Grigio chiaro (`#888780`+) per il body text**: troppo poco contrasto, sembra disabilitato.
5. ❌ **Card con shadow pesanti**: tradisce il tono "professional flat".
6. ❌ **Border-radius sopra 12px** nell'app interna: smorza la sensazione tecnica.
7. ❌ **Multipli font** (Inter + Sora + Geomanist): solo Inter.
8. ❌ **Titoli sottili (weight 400/500)**: sembrano consumer app o blog.
9. ❌ **Padding generoso da landing page** (40–60px) nelle viste operative: l'utente perde densità.
10. ❌ **Stati colorati su superfici grandi** (riga tabella tutta verde): troppo rumore.
11. ❌ **Icone decorative random**: ogni icona deve avere significato funzionale, lucide-react coerente.
12. ❌ **Colored backgrounds su KPI cards** (es. card verde per "ok", rossa per "scaduto"): perde leggibilità e sembra pop.
13. ❌ **Mix di radius nella stessa schermata** (button 4px + card 16px): scegliere e mantenere.
14. ❌ **Loading "spinning page" centrale** quando la struttura è prevedibile: usare skeleton.
15. ❌ **Empty state con solo "Nessun dato"** senza guidance: ogni vuoto deve suggerire azione.
16. ❌ **Sidebar grigia o neutra**: deve essere dark profonda (`#1C1B18`) per coerenza con identità.
17. ❌ **Testo on-dark con grigio chiaro `#888`**: troppo basso contrasto, usare `#FAFAF9` o `#A8A6A0`.
18. ❌ **Bottone "Accedi" blu** come nel login attuale: bandire blu in tutto il prodotto.
19. ❌ **Numeri KPI in weight medio**: devono essere 700 e grossi, sono il dato chiave.
20. ❌ **Animazioni eccessive** (bounce, scale grandi, gradients animati): stop a 120–200ms ease, niente fronzoli.
