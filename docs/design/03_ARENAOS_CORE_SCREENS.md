# 03_ARENAOS_CORE_SCREENS.md

Specifiche hi-fi operative per le schermate core di ArenaOS.

Questo file raccoglie i Capitoli 3, 4 e 5 del redesign:
- Dashboard
- Assets
- Work Orders

Da usare insieme a:
- `01_ARENAOS_DESIGN_SYSTEM.md`
- `02_ARENAOS_APP_SHELL.md`

Vincoli generali:
- Non modificare logica dati, route, ruoli, Supabase o schema DB.
- Usare Inter, palette ArenaOS, App Shell premium e componenti HeroUI-style già definiti.
- Mantenere layout SaaS B2B compatto, caldo, tecnico e non generico.

---

## Dashboard

1. Layout Desktop 1440px
Grid e dimensioni reali
 Viewport: 1440px.
 Sidebar: 248px (fissa).
 Content area: 1192px.
 Padding contenuto: 28px  larghezza utile: 1136px.
 Grid base interno: 12 colonne, gap 20px  ogni colonna  77px (più gap).
Layout verticale (top  bottom)

 HEADER (60px) — sticky, breadcrumb + search + theme + notifications

 CONTENT AREA (padding 28px, bg #FAFAF9)

  Subheader pagina
  Breadcrumb: Panoramica / Dashboard Generale
   Page title row
   Buongiorno Manuel [139 ASSET SCADUTI badge error] [Filtri][Esporta Report]
   Subtitle: Lunedì 5 maggio 2026 · panoramica operativa di oggi

 [spacing 28px]

  ALERT OPERATIVI BAR (se presenti, full-width)
  [] 139 asset scaduti · 12 WO in ritardo · 4 ticket urgenti
  [Mostra dettagli ]

 [spacing 24px]

  KPI ROW (grid 5 col equal)
  [TOT ASSET] [CONFORMITÀ] [ASSET SCADUTI] [WO IN CORSO] [TICKET]
  200 30.5% 139 1 0
  +12 mese  -8.2 pp  +24 mese invariato -2 oggi

 [spacing 28px]

  ANALYTICS ROW (grid 8 + 4)
   Trend Manutenzioni   Stato Asset
   WO chiusi · ultimi 12 mesi   Distribuzione
   [LineChart con area-fill verde]   [Donut chart]
   Lug Ago Set Ott Nov Dic Gen Feb Mar...    In Regola 61
      In Scad. 0
      Scaduto 139

 [spacing 28px]

  TICKETS ROW (grid 6 + 6)
   Ticket per Categoria   Ticket per Ubicazione
   Anomalie più frequenti   Aree più colpite
   [Bar chart orizzontale]   [Bar chart orizzontale]
   Elettrico  24   Campo gioco  18
   HVAC  18   Tribuna nord  14
   Idraulico  14   Spogliatoi  10

 [spacing 28px]

  WORK ORDERS RECENTI (full-width)
  Work Orders recenti [Vedi tutti ]
  Ultimi 8 interventi creati o aggiornati

   [tabella compatta 8 righe]

 [spacing 32px bottom]

Dimensioni indicative blocchi
 Subheader: 8896px alto (breadcrumb 18 + 4 gap + title 30 + 4 + subtitle 18 + 16 padding-bottom).
 Alert bar: 56px alto, full-width, condizionale.
 KPI row: 5 card uguali 220×112px (gap 16px  5×220 + 4×16 = 1164px  si adattano leggermente perché il contenitore ha 1136px utili: card effettiva ~218px).
 Trend Manutenzioni card: ~752px × 320px (8 col).
 Stato Asset card: ~364px × 320px (4 col).
 Ticket Categoria + Ubicazione: ~558px × 360px ciascuna (6 col).
 Work Orders recenti: full-width × ~ 560px (header + 8 row × 56px).

2. Gerarchia contenuti
L'utente arriva alla dashboard e deve cogliere in 3 secondi lo stato operativo. Ordine di lettura:
1 Saluto + alert sintetico (subheader): contesto immediato, rileva criticità con badge inline.
2 Alert operativi bar (se attivi): ciò che richiede attenzione oggi. Massima priorità visiva.
3 KPI row: 5 numeri grandi, posizione fissa di "termometro" del prodotto.
4 Analytics: trend (storico) + distribuzione stato asset (snapshot). Risponde a "come stiamo andando".
5 Tickets: dove e su cosa nascono i problemi. Risponde a "dove agire".
6 Work Orders recenti: cosa sta succedendo concretamente in questo momento.
Principio: la dashboard è uno strumento decisionale, non un report. Ogni sezione deve permettere di decidere o navigare, mai solo "guardare".

3. Sezioni della pagina
3.1 Subheader pagina
Layout:
 Breadcrumb riga top: Panoramica / Dashboard Generale.
 Page title: "Buongiorno Manuel" (24px / 700 / -0.02em / text-primary) — saluto contestualizzato per orario (Buongiorno < 13:00, Buon pomeriggio 1318, Buonasera > 18).
 Badge inline accanto al saluto (gap 12px), condizionale: se assetScaduti > 0  badge error: "139 ASSET SCADUTI" (font 11px / 600 / 0.04em / UPPERCASE, bg #FFF0EE, text #A83228, padding 4px 8px, radius 6px). Click  naviga a /assets?filter=scaduto.
 Subtitle: "Lunedì 5 maggio 2026 · panoramica operativa di oggi" (14px / 500 / text-secondary).
 Page actions destra (gap 8px):
 Filtri (button secondary md, icon SlidersHorizontal 16px leading): apre popover con filtro periodo (Oggi / Ultimi 7 giorni / Ultimi 30 giorni / Mese corrente / Anno corrente / Custom).
 Esporta Report (button primary md, icon FileDown 16px leading): genera PDF report CDA (vista esistente).
Comportamento:
 Periodo selezionato influenza KPI + Trend + Tickets (non Stato Asset, che è snapshot).
 Default: "Mese corrente".
 Periodo persistente in URL query string ?period=current_month.
 Click "Esporta Report"  modal di conferma con preview metadata + download PDF.
Microcopy:
 Saluto: "Buongiorno [Nome]" / "Buon pomeriggio [Nome]" / "Buonasera [Nome]".
 Subtitle pattern: "[Giorno] [data completa] · panoramica operativa di [periodo]".
 Periodo default subtitle: "panoramica operativa di oggi".
 Badge condizionale: "[N] ASSET SCADUTI" / "[N] WO IN RITARDO" / "[N] TICKET URGENTI" — mostra solo il più critico (priorità: scaduti  ritardo  urgenti).

3.2 Alert Operativi Bar (condizionale)
Visibile solo se almeno una metrica critica supera soglia. Una sola riga, focused, azionabile.
Layout:
 Full-width.
 Background: #FFF3E8 (warning bg).
 Border: 1px solid #F5D9B8 (warning border calcolato — derivato da warning text con opacità).
 Border-left: 3px solid #E8782A (warning accent).
 Radius: 10px.
 Padding: 14px 20px.
 Layout interno: icon AlertTriangle 18px #A8531A (left) + content (flex 1, gap 4px) + CTA (right).
Content:
 Title: 14px / 600 / #A8531A. Es. "Richiede attenzione".
 Description: 13px / 500 / #A8531A opacity 0.85. Aggregazione conta: "139 asset scaduti · 12 work order in ritardo · 4 ticket urgenti".
 Separatore tra item: · color #A8531A opacity 0.5.
CTA:
 Link "Mostra dettagli " 13px / 600 / #A8531A underline on hover. Apre drawer "Centro alert" (fuori scope dashboard, navigato a vista dedicata o popover).
Stati:
 Critical (asset scaduti > 100 OR ticket urgenti > 5): variante error — bg #FFF0EE, border-left #E24B4A, text #A83228, icon AlertCircle.
 Warning (default per altre soglie): variante warning come sopra.
 Hidden (nessun alert attivo): bar non renderizzata.
Comportamento:
 Dismissibile: NO. È sempre presente quando attiva, è un dato operativo, non una notifica.
 Soglie configurabili lato admin (futuro), default ragionevoli.
Errori da evitare:
  Bar sempre visibile anche con tutto a zero: rumore inutile.
  Multipli alert sovrapposti: aggregare in una sola bar.
  Colore verde nella bar: alert non sono mai "ok".

3.3 KPI Row
5 card uguali in riga, allineate a grid-template-columns: repeat(5, 1fr) con gap 16px.
Card KPI standard:
 Width: 1fr (218px).
 Height: 112px.
 Padding: 20px 24px.
 Background: #FFFFFF.
 Border: 1px solid #E5E4DF.
 Radius: 10px.
 Hover (interattiva): border #D3D1C7, cursor pointer, shadow-xs.
 Click: naviga al modulo correlato con filtro applicato.
Layout interno:

 TOT ASSET [icon 18px]

 200

  +12 vs mese scorso

 Riga 1 (top): Label uppercase + icona contestuale destra.
 Label: 11px / 600 / 0.08em / UPPERCASE / text-muted.
 Icona: 18px, color text-secondary, no bg colorato.
 Riga 2 (margin-top 8px): KPI Number 32px / 700 / -0.03em / text-primary con tabular-nums.
 Riga 3 (margin-top 4px): Delta inline.
 Dot 6px + arrow 12px + valore + label.
 Font: 12px / 600.
 Variante up positivo: arrow , color #1A7A3C. Es. " +12 vs mese scorso".
 Variante down positivo: arrow , color #1A7A3C (es. "ticket aperti diminuiti" è positivo!). Logica per-KPI.
 Variante up negativo: arrow , color #A83228.
 Variante down negativo: arrow , color #A83228.
 Variante invariato: trattino , color text-muted, label "invariato".
Le 5 KPI:

	#	Label	Value source	Icon	Delta logic	Click destination
	1	TOT ASSET	assets.count()	Boxes	up = positivo (più asset gestiti)	/assets
	2	CONFORMITÀ	% in regola / totale	ShieldCheck	up = positivo, mostrato come 30.5%	/assets?filter=in_regola
	3	ASSET SCADUTI	assets.where(status=SCADUTO).count()	AlertTriangle (color #A8531A)	up = negativo, down = positivo	/assets?filter=scaduto
	4	WO IN CORSO	work_orders.where(status=IN_CORSO).count()	Wrench	up = neutro	/work-orders?status=in_corso
	5	TICKET APERTI	tickets.where(status=OPEN).count()	MessageSquareWarning	up = negativo, down = positivo	/tickets?status=open
	KPI Featured (caso speciale):

 Se ASSET SCADUTI > 0: card #3 ha border-left: 3px solid #E24B4A come visual hint critico (mantiene gli altri border standard).
 Se WO IN CORSO > 0 ma nessuno in ritardo: nessun trattamento speciale.
Stati:
 Loading: skeleton (vedi §6).
 Empty per nuovo tenant (es. nessun asset ancora caricato): KPI mostrano 0, delta nascosto, eventualmente CTA inline solo per #1: "Inizia caricando i tuoi asset " (link primary).
 Error per singolo KPI: card mostra "—" come valore, icon AlertCircle 12px inline al label, tooltip "Errore caricamento, riprova".
Componenti HeroUI: Card + layout custom; Tooltip per delta su hover.
Microcopy:
 Labels: "TOT ASSET", "CONFORMITÀ", "ASSET SCADUTI", "WO IN CORSO", "TICKET APERTI".
 Delta tooltips on hover: "Differenza rispetto a [periodo precedente]".
Errori da evitare:
  Card colorate per stato (verde/rosso piene): perde leggibilità del numero.
  KPI senza delta: l'utente vuole sapere "sta migliorando o peggiorando".
  Delta con segno +/- ambiguo (è positivo o negativo?): usare colore + freccia per chiarezza semantica.
  KPI non cliccabili: ogni card è una porta a un modulo filtrato.

3.4 Analytics Row — Trend Manutenzioni + Stato Asset
3.4.1 Trend Manutenzioni (8 col, ~752px × 320px)
Card standard: bg #FFFFFF, border #E5E4DF, radius 10px, padding 24px.
Header card:
 Title: "Trend Manutenzioni" (16px / 700 / text-primary).
 Subtitle: "WO chiusi · ultimi 12 mesi" (13px / 500 / text-secondary, margin-top 2px).
 Right: toggle segmented "12M / 6M / 3M" — segmented control 28px alto, bg #F1EFE8, item attivo bg #FFFFFF border #E5E4DF, font 12px / 600.
Chart:
 Tipo: Line chart con area fill, single serie.
 Linea: 2px stroke #2ECC71.
 Area fill: gradient verticale da rgba(46, 204, 113, 0.12) (top) a rgba(46, 204, 113, 0) (bottom).
 Punti: 4px circle #2ECC71, visibili solo on hover del punto.
 Asse X (mesi): label 11px / 500 / text-muted, padding-top 12px, divisore tick 0.5px #E5E4DF.
 Asse Y: nascosto. Tooltip sostituisce numeri assoluti.
 Grid: orizzontale dashed 1px #E5E4DF ogni 25%, no grid verticale.
 Hover: tooltip card bg #FFFFFF border #E5E4DF shadow-sm radius 8px padding 8px 12px:
 Riga 1: mese (es. "Marzo 2026") 12px / 600 / text-primary.
 Riga 2: "[N] WO chiusi" 13px / 500 / text-primary con dot 6px verde leading.
 Crosshair: linea verticale dashed 1px #D3D1C7 su mese hover.
Footer chart (margin-top 16px, opzionale):
 Riepilogo inline: "Totale 12 mesi: 240 WO · Media mensile: 20" (12px / 500 / text-secondary, valori bold text-primary).
Stati:
 Loading: skeleton card con header reale + area chart placeholder (rect 200px alto bg #F1EFE8 shimmer).
 Empty: card content sostituito da empty state inline:
 Icona LineChart 32px in cerchio #F1EFE8 56×56.
 Title: "Nessun dato disponibile" (14px / 600).
 Description: "I trend appariranno dopo il primo work order chiuso." (13px / 500 / text-secondary).
 Error: banner inline (vedi §8) con "Riprova".
Componenti HeroUI / Recharts:
 Card HeroUI come container.
 Recharts AreaChart + CartesianGrid + Tooltip per il grafico.
 HeroUI Tabs o ToggleGroup per segmented 12M/6M/3M.
3.4.2 Stato Asset (4 col, ~364px × 320px)
Card standard (stessi token).
Header card:
 Title: "Stato Asset" (16px / 700).
 Subtitle: "Distribuzione operativa" (13px / 500 / text-secondary).
 Right: icona BarChart3 ghost 32×32 (azione "vedi dettaglio modulo asset" — naviga a /assets).
Chart:
 Tipo: Donut chart.
 Diametro: 160px, stroke 24px, gap tra segmenti 2°.
 Segmenti:
 In Regola: #2ECC71.
 In Scadenza: #E8782A.
 Scaduto: #E24B4A.
 Centro donut: numero totale grande (24px / 700 / text-primary con tabular-nums) + label "TOTALE" sotto (10px / 600 / 0.10em / UPPERCASE / text-muted).
 Hover segmento: leggera espansione 2px outward + tooltip.
Legenda inline destra del donut (layout flex):
 Lista 3 righe.
 Per riga: dot 8px (radius full) colorato + label + count + percentuale.
 Riga: padding 6px 0, border-bottom 1px #F1EFE8 (ultima senza).
 Layout per riga: [dot] [label flex-1] [count tabular-nums].
 Label: 13px / 500 / text-primary. Es. "In Regola".
 Count: 14px / 700 / text-primary tabular-nums allineato right.
 Hover riga: bg #FAFAF9, evidenzia segmento corrispondente nel donut.
 Click riga: naviga a /assets?filter=[stato].
Stati:
 Loading: skeleton donut (cerchio bg #F1EFE8 160×160) + 3 skeleton row legenda.
 Empty (zero asset): empty state inline come Trend.
 Error: banner inline.
Componenti: Recharts PieChart con innerRadius=68 outerRadius=80 + legenda custom.
Microcopy comune:
 Labels segmenti: "In Regola", "In Scadenza", "Scaduto".
Errori da evitare:
  Donut con percentuali sopra ogni segmento: rumoroso, leggenda è sufficiente.
  Legenda sotto il chart in colonna: meno leggibile in 4 col.
  Rosso pieno per "scaduto" su grandi superfici: usare solo come segmento donut, non come fill della card.

3.5 Tickets Row — Categoria + Ubicazione
Due card uguali, grid 6+6, gap 20px.
3.5.1 Ticket per Categoria (6 col, ~558px × 360px)
Card standard.
Header:
 Title: "Ticket per Categoria" (16px / 700).
 Subtitle: "Anomalie più frequenti" (13px / 500 / text-secondary).
 Right: icona Tags ghost 32×32.
Chart:
 Tipo: Horizontal bar chart, top 57 categorie.
 Layout per riga (height 32px, gap verticale 8px):
 Label sinistra (width 140px): 13px / 500 / text-primary. Es. "Elettrico", "HVAC / Climatizzazione".
 Bar (flex 1): height 8px, radius 4px, bg track #F1EFE8. Fill bar bg #5F5E5A (neutro) a width proporzionale al max.
 Count destra (width 40px, align right): 14px / 600 / text-primary tabular-nums.
 Riga top: bar fill bg #1C1B18 (più scuro per highlight della categoria principale).
 Hover riga: bg #FAFAF9 (esteso row), bar fill leggera evidenza.
 Click riga: naviga /tickets?category=[id].
Footer:
 Link "Vedi tutti i ticket " (13px / 600 / #1A7A3C), centrato bottom card.
3.5.2 Ticket per Ubicazione (6 col, ~558px × 360px)
Identico pattern, dati diversi:
 Title: "Ticket per Ubicazione".
 Subtitle: "Aree più colpite".
 Icon: MapPin.
 Bars: stesso pattern, label es. "Campo gioco", "Tribuna nord", "Spogliatoi visitatori", "Hall ingresso".
 Click riga: naviga /tickets?location=[id].
Stati comuni (entrambe):
 Loading: 5 skeleton row con stessa altezza.
 Empty:
 Icon contestuale 32px in cerchio #F1EFE8 56×56.
 Title: "Nessun ticket categorizzato" / "Nessun ticket per ubicazione".
 Description: "I dati appariranno con i primi ticket inseriti."
 Error: banner inline.
Componenti: Recharts BarChart orientation=horizontal, oppure custom bar implementation con divs (più semplice e performante per pochi dati).
Microcopy:
 Title: "Ticket per Categoria" / "Ticket per Ubicazione".
 Subtitle: "Anomalie più frequenti" / "Aree più colpite".
 Footer link: "Vedi tutti i ticket ".
Errori da evitare:
  Pie chart per categorie con 7+ voci: bar chart molto più leggibile.
  Colori diversi per ogni bar (rainbow): usare un solo colore neutro + bar top scura.
  Bar troppo spesse (>16px): il dato chiaro è il count, non la barra.
  Mostrare tutte le categorie con count basso: top 57 + "+ N altre" se overflow.

3.6 Work Orders recenti (full-width)
Tabella compatta con i 8 WO più recenti per updated_at desc.
Card container:
 Background: #FFFFFF.
 Border: 1px solid #E5E4DF.
 Radius: 10px.
 Padding: 0 (la tabella riempie il bordo).
Header card:
 Padding: 20px 24px.
 Border-bottom: 1px solid #E5E4DF.
 Layout: title+subtitle left, actions right.
 Title: "Work Orders recenti" (16px / 700).
 Subtitle: "Ultimi 8 interventi creati o aggiornati" (13px / 500 / text-secondary, margin-top 2px).
 Actions destra (gap 8px):
 Filter chip "Stato" (button secondary sm con chevron-down): apre dropdown filtri rapidi (Tutti, In corso, Pianificati, Completati).
 Link "Vedi tutti " (button ghost sm, font 13px / 600 / text-primary, icon ArrowRight 14px trailing).
Tabella header row:
 Bg #FAFAF9, border-bottom #E5E4DF.
 Padding cell: 10px 16px.
 Font: Table Header (11px / 600 / 0.06em / UPPERCASE / text-muted).
Colonne:

	Colonna	Width	Allineamento	Contenuto
	CODICE	120px	left	"WO-2026-0142" 13px / 600 tabular-nums
	INTERVENTO	flex (300px+)	left	Riga 1 titolo 14px/500 + Riga 2 asset+ubicazione 12px/400 muted
	ASSEGNATO A	200px	left	Avatar 24px + nome 13px/500 + ruolo 11px/500 muted (riga 2)
	PRIORITÀ	100px	center	Badge priority
	STATO	140px	center	Badge stato
	AGGIORNATO	140px	right	"5 min fa" / "Oggi 14:32" / "Ieri" 13px/500 muted, tooltip on hover con timestamp completo
	Body row:

 Height 56px.
 Padding cell: 12px 16px.
 Border-bottom: 1px solid #E5E4DF (ultima senza).
 Bg #FFFFFF, hover #FAFAF9.
 Click riga: naviga a /work-orders/[id].
Badge stato (variant per status):
 "PIANIFICATO": neutral (bg #F1EFE8 text #5F5E5A).
 "ASSEGNATO": info (bg #1C1B18 text #FAFAF9).
 "IN CORSO": warning (bg #FFF3E8 text #A8531A) con dot 6px #E8782A.
 "COMPLETATO": success (bg #EAFBF1 text #1A7A3C) con dot 6px #2ECC71.
 "ANNULLATO": neutral con strikethrough opzionale.
Badge priority:
 "ALTA": bg #FFF0EE, text #A83228.
 "MEDIA": bg #FFF3E8, text #A8531A.
 "BASSA": bg #F1EFE8, text #5F5E5A.
Footer card (opzionale):
 Padding: 12px 24px.
 Border-top: 1px solid #E5E4DF.
 Bg #FAFAF9.
 Layout: count "8 di 142" (13px / 500 / text-secondary) + link "Vedi tutti i 142 work orders " (13px / 600 / #1A7A3C).
Stati:
 Loading: header tabella reale + 5 skeleton row 56px alto.
 Empty: padding 64px verticale, layout empty standard:
 Icon Wrench 40px cerchio #F1EFE8.
 Title: "Nessun work order ancora".
 Description: "Crea il primo intervento per iniziare a tracciare la manutenzione."
 CTA primary md: "Crea Work Order".
 Error: banner inline come §8.
Componenti HeroUI:
 Card container.
 Table HeroUI per la tabella (con removeWrapper se serve eliminare bordo doppio).
 Avatar per assegnatario.
 Chip HeroUI per badge.
 Dropdown per filter chip stato.
Microcopy:
 Title: "Work Orders recenti".
 Subtitle: "Ultimi 8 interventi creati o aggiornati".
 Filter label: "Stato".
 Link bottom: "Vedi tutti i [N] work orders ".
 Empty CTA: "Crea Work Order".
Errori da evitare:
  Mostrare tutti i campi del WO (costo, fornitore, data scadenza, ecc.): sovraccarico cognitivo. La tabella è "preview", il dettaglio è in /work-orders.
  Righe alte 80px+: l'utente vuole scansionare 8 elementi rapidamente.
  Badge stato con colori non da sistema (es. blu): solo i 45 status definiti.
  Avatar senza fallback: usare iniziali se mancante.
  Codice WO in font mono: usare Inter tabular-nums (regola Fase 1).

4. Comportamento responsive

	Breakpoint	KPI Row	Analytics Row	Tickets Row	WO Recenti
	1280px	5 col equal	8+4	6+6	full-width tabella completa
	10241279px	5 col equal (più stretti)	8+4	6+6	full-width tabella, "AGGIORNATO" può comprimersi
	7681023px	3 col + 2 col (riga 2)	12 (Trend full)  12 (Stato Asset full)	12+12 stack	tabella scrollabile orizzontale; colonna "ASSEGNATO A" diventa avatar+tooltip
	480767px	2 col  1 col KPI per riga	12 stack	12 stack	card-based: ogni WO diventa card stacked anziché riga tabella
	<480px	1 col KPI per riga, height ridotta a 96px	12 stack	12 stack	card-based
	Variazioni mobile (< 768px)

 Subheader: page actions Filtri e Esporta collassano in ["""] overflow menu (button ghost icon).
 Alert bar: testo description su 2 righe, CTA "Mostra dettagli" sotto.
 KPI: card height 96px, KPI Number 28px (invece di 32), label 11px invariato.
 Trend Manutenzioni: chart altezza ridotta 200px, segmented 12M/6M/3M nascosto (default 6M).
 Ticket bars: label troncata a 80px max-width con tooltip.
 WO recenti: ogni item come card individuale 16px padding, layout:
 Riga 1: codice + badge stato right.
 Riga 2: titolo intervento.
 Riga 3: asset+ubicazione muted.
 Riga 4: avatar 20px + nome + dot + timestamp.

5. Componenti HeroUI consigliati

	Elemento dashboard	Componenti HeroUI/altri
	Subheader page title	Layout custom + Chip (badge inline)
	Filtri popover	Popover + RadioGroup per periodo
	Esporta Report button	Button primary md
	Alert operativi bar	Layout custom (no Alert HeroUI nativo che ha look diverso) — div con bg, border, icon lucide-react
	KPI card	Card + layout interno custom + Tooltip su delta
	Trend Manutenzioni	Card + Recharts AreaChart + Tabs per 12M/6M/3M
	Stato Asset donut	Card + Recharts PieChart + lista custom legenda
	Ticket Categoria/Ubicazione	Card + bar chart custom (div-based) o Recharts BarChart
	WO recenti tabella	Card + Table HeroUI con custom cell renderers
	Badge stato/priority	Chip HeroUI con colori custom da brand kit
	Avatar in tabella	Avatar HeroUI con fallback iniziali
	Filter chip stato	Dropdown + Button secondary sm
	Link "Vedi tutti"	Button ghost sm
	Empty state inline	Layout custom con icon lucide-react
	Skeleton loading	Skeleton HeroUI
	Error banner	Layout custom (variante destructive)

6. Stato Loading
Loading globale dashboard (al primo mount)
Strategia: skeleton-driven, non spinner full-page. La struttura si vede subito, solo i dati riempiono progressivamente.
Subheader:

 Skeleton breadcrumb: 2 rect 60px × 14px gap 8px.
 Skeleton page title: rect 280px × 30px.
 Skeleton subtitle: rect 360px × 18px.
 Page actions: skeleton 2 button (rect 100×36px).
Alert bar: nascosta in loading (renderizzata solo dopo data fetch valido).
KPI Row: 5 skeleton card 218×112:
 Skeleton label: rect 80×12.
 Skeleton number: rect 100×32 margin-top 8.
 Skeleton delta: rect 140×14 margin-top 4.
Trend card: skeleton header (title 200×20 + subtitle 180×14) + skeleton chart area (full width × 200px height bg #F1EFE8 shimmer).
Stato Asset card: skeleton donut (cerchio 160×160 bg #F1EFE8) + 3 skeleton row legenda.
Tickets cards: 5 skeleton bar row per card (label 100×14 + bar 100%×8 + count 30×14).
WO recenti: header reale (no skeleton) + 5 skeleton row 56px alto con cell skeleton mock.
Loading parziale (refetch sezione)
 Solo la sezione che si aggiorna mostra skeleton overlay (opacity 0.5 sul contenuto + spinner 20px centro).
 Polling silenzioso: nessun visual feedback, dati si aggiornano in place.
Min visibile
 Skeleton min 300ms per evitare flicker.
 Spinner per refetch < 500ms: nascosto se risposta è rapida.

7. Stato Empty
Empty totale (nuovo tenant, zero dati ovunque)
Non si mostra una dashboard standard. Si mostra uno stato di onboarding:
Layout:
 Card centrale max-width 560px, centrata verticalmente in content area.
 Padding 48px 32px.
 Bg #FFFFFF, border #E5E4DF, radius 12px.
 Icona Sparkles 40px in cerchio #EAFBF1 64×64 (var success).
 Title: "Benvenuto su ArenaOS" (20px / 700 / text-primary).
 Description: "Inizia caricando i tuoi asset per popolare la dashboard. Bastano pochi minuti per vedere i primi dati operativi." (14px / 400 / text-secondary).
 Lista 3 step inline (gap 12px verticale, font 13px / 500):
 ` Carica i tuoi asset  /assets
 a Pianifica le prime manutenzioni  /schedule
 b Configura tecnici e fornitori  /suppliers
 CTA primary md: "Inizia da Asset" (icon ArrowRight trailing).
 Link secondario "Importa da Excel" (link primary).
Empty parziale (alcune sezioni vuote, altre no)
Ogni sezione gestisce empty inline indipendentemente (vedi specifiche per blocco).
Esempio combinato:
 KPI mostrano numeri reali (anche zero).
 Trend Manutenzioni: "Nessun WO chiuso ancora — chiudi il primo intervento per vedere il trend".
 Stato Asset: empty se asset.count == 0.
 Tickets: empty separato per categoria/ubicazione.
 WO recenti: empty con CTA "Crea Work Order".

8. Stato Error
Error globale (dashboard non si carica)
Layout: simile empty totale ma variante error.
 Container centrato max-w 560px, padding 48px 32px.
 Icona AlertCircle 40px cerchio #FFF0EE 64×64.
 Title: "Non riusciamo a caricare la dashboard" (18px / 700).
 Description: "C'è stato un problema di connessione. Riprova tra un momento o contatta il supporto se persiste." (14px / 400 / text-secondary).
 CTA primary: "Riprova" (button md).
 CTA secondary link: "Contatta supporto".
Error parziale (singola sezione fallisce)
Banner inline dentro la card:
 Mostra header card normalmente.
 Body card sostituito da:
 Padding 32px 24px.
 Layout center.
 Icon AlertCircle 24px #A83228.
 Text 13px / 500 / #A83228: "Impossibile caricare i dati".
 Link inline 13px / 600 / #1A7A3C: "Riprova".
Error transient (toast)
 Toast top-right 360px.
 Bg #FFFFFF, border #E5E4DF, border-left 3px #E24B4A, shadow-md.
 Icon AlertCircle 16px #A83228.
 Title: "Errore aggiornamento dashboard".
 Description: "Riprova tra qualche secondo.".
 Auto-dismiss 5s.
Error parziale per KPI (degradato)
Singolo KPI può fallire senza compromettere il resto:
 Card mostra "—" come valore (24px / 700 / text-muted, no tabular-nums).
 Riga delta sostituita da: icon AlertCircle 12px + "Errore" 12px / 500 / text-muted.
 Tooltip on hover: "Errore caricamento, clicca per riprovare".
 Click card: triggera retry singolo KPI.

9. Microcopy titoli e sezioni
Subheader
 Saluto: "Buongiorno [Nome]" / "Buon pomeriggio [Nome]" / "Buonasera [Nome]".
 Subtitle pattern: "[Giorno] [data completa] · panoramica operativa di [periodo]".
 Badge inline: "[N] ASSET SCADUTI" / "[N] WO IN RITARDO" / "[N] TICKET URGENTI".
Alert bar
 Title warning: "Richiede attenzione".
 Title critical: "Situazione critica".
 Description: aggregata, separata da " · ".
 CTA: "Mostra dettagli ".
KPI
 Labels (UPPERCASE): "TOT ASSET", "CONFORMITÀ", "ASSET SCADUTI", "WO IN CORSO", "TICKET APERTI".
 Delta tooltip: "Differenza rispetto a [mese precedente / settimana precedente / etc.]".
Trend Manutenzioni
 Title: "Trend Manutenzioni".
 Subtitle: "WO chiusi · ultimi 12 mesi".
 Toggle periodo: "12M / 6M / 3M".
 Tooltip chart: "[Mese Anno]" + "[N] WO chiusi".
 Footer: "Totale [periodo]: [N] WO · Media mensile: [N]".
Stato Asset
 Title: "Stato Asset".
 Subtitle: "Distribuzione operativa".
 Centro donut label: "TOTALE".
 Legenda labels: "In Regola", "In Scadenza", "Scaduto".
Ticket Categoria
 Title: "Ticket per Categoria".
 Subtitle: "Anomalie più frequenti".
 Footer link: "Vedi tutti i ticket ".
Ticket Ubicazione
 Title: "Ticket per Ubicazione".
 Subtitle: "Aree più colpite".
 Footer link: "Vedi tutti i ticket ".
Work Orders recenti
 Title: "Work Orders recenti".
 Subtitle: "Ultimi 8 interventi creati o aggiornati".
 Header tabella: "CODICE", "INTERVENTO", "ASSEGNATO A", "PRIORITÀ", "STATO", "AGGIORNATO".
 Filter button: "Stato".
 Footer count: "8 di [N]".
 Footer link: "Vedi tutti i [N] work orders ".
Empty / Error
 Empty totale title: "Benvenuto su ArenaOS".
 Empty totale desc: "Inizia caricando i tuoi asset per popolare la dashboard."
 Empty Trend: "Nessun dato disponibile" / "I trend appariranno dopo il primo work order chiuso."
 Empty WO recenti: "Nessun work order ancora" / "Crea il primo intervento per iniziare a tracciare la manutenzione."
 Error globale title: "Non riusciamo a caricare la dashboard".
 Error globale desc: "C'è stato un problema di connessione. Riprova tra un momento o contatta il supporto se persiste."

10. Descrizione visiva dettagliata
L'utente atterra sulla dashboard e percepisce un'interfaccia calda ma operativa: il background color carta (#FAFAF9) tiene tutto fuori dalla freddezza tipica del SaaS, mentre la sidebar dark (#1C1B18) ancora il prodotto in identità tecnica.
In alto, il saluto personalizzato in 24px bold non è decorazione: è contestuale e immediato (Buongiorno Manuel). Accanto, un badge rosso inline quantifica subito la criticità dominante (139 ASSET SCADUTI). Non c'è ambiguità su cosa richiede attenzione.
Sotto, se ci sono criticità aggregate, una bar arancione con border-left netto elenca le metriche fuori soglia in una sola riga lineare. È visibile solo quando serve, sparisce quando tutto è in regola — la dashboard non grida mai senza motivo.
La riga KPI è la spina dorsale: 5 card bianche su sfondo carta, con border sottile color avorio. I numeri sono grandi, neri, in 32px bold con tabular-nums — leggibili a un metro. Sotto ogni numero, un delta colorato (verde se positivo per il KPI, rosso se negativo) racconta la direzione. La card "ASSET SCADUTI" ha un border-left 3px rosso discreto: senza essere invasiva, segnala criticità. Tutto il resto è neutro.
A seguire, la fila analytics: a sinistra il trend manutenzioni con un'area chart verde tenue su griglia leggera dashed — la linea ha solo punti visibili on-hover, perché il valore reale lo dà il tooltip, non la decorazione. A destra, il donut stato asset con tre segmenti (verde, arancione, rosso) e una legenda nitida con conteggi tabular-nums. Il centro del donut mostra il totale assoluto.
Più sotto, due bar chart orizzontali gemelli per ticket per categoria e ubicazione. Bar in grigio scuro per la prima posizione, neutre per le successive — niente arcobaleno, niente decorazione. Il dato è il count, la barra serve solo per la magnitudine.
In fondo, la tabella WO recenti è il vero cuore operativo: 8 righe, 6 colonne, badge stato e priority colorati ma piccoli, avatar 24px per chi ha l'intervento in carico. Riga 56px, hover bg #FAFAF9, click  dettaglio. Niente ornamenti, ma ogni cella ha il suo peso visivo: codice in semi-bold, intervento in regular con metadata muted, timestamp relativo con tooltip esatto.
L'intera pagina respira — spacing 28px tra sezioni, gap 20px nelle grid — ma resta densa: ogni pixel ha funzione. È la differenza tra una landing che cerca di vendersi e un tool che si fa scegliere ogni mattina perché non spreca tempo dell'utente.
I colori caldi non sono morbidezza consumer — sono qualità di prodotto pagato. Il verde appare solo dove serve decisione: la CTA primaria "Esporta Report", il dot dello stato attivo nei badge, il segmento "In Regola" del donut, il bordo focus degli input. Tutto il resto è bianco, carta, neri profondi, e tre status colors usati con misura chirurgica.

11. Tabella sintetica "elemento  componente HeroUI"

	Elemento	Componente HeroUI	Note implementative
	Container pagina	<main> semantico	Padding 28px, bg #FAFAF9
	Breadcrumb	Breadcrumbs	Custom separator /, last segment bold
	Page title	<h1> custom	24px / 700 / -0.02em
	Title badge	Chip	Variant custom error/warning
	Page actions	Button secondary + primary	Size md, gap 8px
	Alert bar	Layout custom div	No Alert HeroUI (look diverso), usare div con border-left
	KPI card	Card HeroUI	Padding 20px 24px, layout flex column
	KPI delta	Tooltip su trigger	Tooltip "vs periodo precedente"
	Trend chart card	Card + Recharts	<AreaChart> con <Area> + gradient
	Trend toggle 12M/6M/3M	Tabs HeroUI variant="bordered" size sm	O ToggleGroup se disponibile
	Donut chart	Card + Recharts <PieChart>	innerRadius 68, outerRadius 80
	Donut legenda	Lista custom	<ul> con flex layout, hover state
	Bar chart Ticket	Custom div-based bar	Più semplice di Recharts per pochi dati
	WO recenti table	Table HeroUI	removeWrapper per gestire bordo card esterno
	Avatar in tabella	Avatar HeroUI size sm	Fallback con iniziali
	Badge stato/priority	Chip HeroUI size sm	Custom colors via classNames prop
	Filter dropdown	Dropdown + DropdownMenu	Trigger Button secondary sm
	Skeleton loading	Skeleton HeroUI	Mantiene shape del componente che sostituisce
	Empty state	Layout custom	Icon lucide-react + Card per onboarding
	Error banner	Layout custom	Border-left 3px error, no Alert HeroUI
	Toast error/success	Toast (sonner già adottato)	Mantenere libreria esistente, applicare token brand
	Tooltip chart	Custom Recharts <Tooltip content>	Card 8px 12px, font 12px / 600 + 13px / 500

12. Errori visivi da evitare

1  Card KPI con sfondo colorato per stato (verde per "ok", rosso per "scaduto"): perde leggibilità del numero, sembra pop-art. Usare bg bianco + border-left 3px solo come accent discreto.
2  Numeri KPI in weight 500 o 600: devono essere 700. Sono il dato chiave, devono dominare.
3  Mostrare delta come +12 senza contesto: serve "vs mese scorso" o tooltip con vs [periodo]. Senza riferimento il numero è arbitrario.
4  Trend chart con linea spessa 4px e punti grossi su tutti i mesi: la chart deve essere elegante, quasi sussurrata. 2px line, punti solo on hover.
5  Donut con percentuali stampate sopra i segmenti: visualmente rumoroso. La legenda con count assoluto + percentuale (opzionale, accanto al count) è sufficiente.
6  Bar chart Ticket con colori diversi per ogni voce (rainbow): un solo grigio scuro neutro + bar #1 più scura. Il dato è il count, non la categoria.
7  Tabella WO recenti con tutte le colonne possibili (costo, fornitore, scadenza, allegati count): è un riepilogo, non la vista completa. 6 colonne max.
8  Avatar 3240px nella tabella: row 56px non lo sostiene visivamente. Avatar 24px + nome.
9  Hover row con shadow o transform: solo bg color change a #FAFAF9. Niente scale, niente lift.
10  Badge stato in font normale 14px: deve essere 11px / 600 / UPPERCASE / tracked, è un tag.
11  "Vedi tutti" come bottone primary verde: è un link contestuale, deve essere ghost o link text.
12  Card senza title block ma solo chart: ogni card ha titolo + subtitle + (eventuale) icon action a destra. Strutture coerenti.
13  Spacing inconsistente tra sezioni: alcune 24px, altre 32px. Decidere e mantenere — qui è 28px tra macro-sezioni, 24px tra card affini, 1620px gap interni.
14  Subheader con "Welcome to your dashboard": è gergo SaaS US, ArenaOS è italiano, professionale, contestuale ("Buongiorno [Nome]" + data reale).
15  Loading con spinner full-screen: skeleton deve riflettere la struttura. Solo onSubmit form usa spinner.
16  Empty state senza CTA: ogni stato vuoto deve guidare l'utente a un'azione concreta.
17  Alert bar sempre presente con "Tutto ok": la bar esiste solo per criticità reali, sennò è rumore.
18  Chart in dark mode su dashboard light: tutti i chart usano i token light.
19  KPI con icona colorata grossa decorativa (es. cerchio verde 40px con check): l'icona è 18px monocromatica text-secondary. Il numero è il dato, non l'icona.
20  Tooltip chart con bg trasparente o blur senza border: usare card piena bianca con border #E5E4DF e shadow-sm. Leggibilità sopra estetica.
21  Date in formato 2026-05-05: usare formato italiano leggibile "5 mag 2026" o "Lunedì 5 maggio 2026" per subtitle.
22  Filtri come tabs sempre visibili: usare popover/dropdown per non sottrarre spazio verticale alla dashboard.
23  WO recenti con righe alternate (zebra): un solo bg bianco + border-bottom è più pulito. Zebra appartiene a tabelle data-heavy.
24  Badge "ASSET SCADUTI" inline senza link: ogni badge contestuale è cliccabile e naviga al filtro corrispondente. Affordance chiara.
25  Mix di tabular-nums e proportional nei KPI: tutte le cifre numeriche della dashboard usano tabular-nums per allineamento e leggibilità.

Dashboard completata. Pronto per FASE 4 — Assets quando vuoi.


---

## Assets

1. Layout Desktop 1440px
Spazio disponibile
 Sidebar: 248px fissa.
 Content area: 1192px, padding 28px  larghezza utile 1136px.
Layout verticale

 HEADER (60px) — sticky

 CONTENT AREA (padding 28px, bg #FAFAF9)

  Subheader pagina
  Breadcrumb: Anagrafiche / Asset
   Title row
   Asset [Esporta Excel][Scansiona QR][+ Nuovo asset]
   200 asset · 5 categorie · 139 scaduti

 [spacing 24px]

  TOOLBAR FILTRI (sticky in scroll)
  [ Cerca asset, marca, codice&] [Categoria][Ubicazione][Stato]
  [Scadenza ] [+ Filtri avanzati] [ Reset] 150 di 200
   active filters chips: Categoria: Antincendio × · Stato: Scaduto ×

 [spacing 16px]

  TABELLA ASSET

   ASSET CATEGORIA UBICAZIONE ULTIMA PROSSIMA STATO AZIONI

   [icon] Centrale rilevazione CR2 146
   Honeywell · IQ8Quad · CEN-CR2-146
   Rivelazione incendi Corridoio 2 24 lug 2025 &
   ...

  Footer: 150 di 200 [9 1 2 3 4 :] [50 per pagina ]

 [spacing 32px bottom]

Dimensioni indicative
 Subheader: 9296px alto.
 Toolbar filtri: 64px (singola riga) + 40px (riga active chips condizionale) = 64104px.
 Tabella: header 44px + N righe 64px + footer 56px.
 Riga tabella: 64px (asset cell con titolo+meta su due righe richiede più altezza di 48px standard).

2. Toolbar Filtri
Layout
 Container: card bianca #FFFFFF, border #E5E4DF, radius 10px, no shadow.
 Sticky position: top: 60px (sotto header) durante scroll della tabella, con shadow-xs quando sticky.
 Padding: 12px 16px.
 Layout interno: due righe potenziali (sempre visibile prima riga, condizionale seconda).
Riga 1 — Search + Filter chips (height 40px, gap 8px)
Search input (flex, max-width 360px):
 Height 40px, padding 10px 14px 10px 38px.
 Bg #FFFFFF, border 1px #E5E4DF, radius 8px.
 Icon Search 16px text-muted left 14px abs.
 Placeholder: "Cerca asset, marca, codice&"
 Right side hint chip (opzionale): F (filtro veloce).
 Focus: border #2ECC71, shadow-focus-primary.
Filter chips (gap 8px, flex-wrap su risoluzioni strette):
 Categoria (dropdown trigger button secondary sm) — label "Categoria" o "Categoria: Antincendio" se selezionata.
 Ubicazione (dropdown).
 Stato (dropdown).
 Scadenza (dropdown).
 Filtri aggiuntivi — popover "+ Filtri avanzati" (icona SlidersHorizontal leading) per: Marca, Modello, Frequenza verifica, Data installazione (range), Avere allegati / WO collegati.
 Reset (button ghost sm con icona RotateCcw 14px) — visibile solo se 1 filtro attivo. Label: "Reset".
Right side (margin-left auto):
 Counter "150 di 200" (13px / 500 / text-secondary).
 Visibile sempre.
Filter chip trigger (button secondary sm)
 Height 32px, padding 6px 10px.
 Bg #FFFFFF, border 1px #E5E4DF, radius 8px.
 Layout interno: label + chevron-down 14px text-muted.
 Font 13px / 600 / text-primary.
 Hover: border #D3D1C7, bg #F1EFE8.
 Stato attivo (filtro selezionato):
 Border 1px #2ECC71.
 Bg #EAFBF1.
 Text #0A3D1F.
 Label diventa "Categoria · Antincendio" (separatore ·).
 Multi-select attivo: label "Categoria · 2 selezionate", count chip inline 11px / 700 in pillola verde.
Filter dropdown menu
 Width: 280px (Categoria/Stato), 320px (Ubicazione, Scadenza), 480px (Filtri avanzati).
 Background #FFFFFF, border 1px #E5E4DF, radius 10px, shadow-md.
 Padding 8px.
 Margin-top 6px (gap dal trigger).
Header dropdown (search interno per Ubicazione, opzionale):
 Padding 8px 8px 6px.
 Border-bottom 1px #F1EFE8.
 Search input mini per filtrare opzioni se >7 voci.
Item dropdown:
 Padding 8px 12px, radius 6px.
 Layout: checkbox 16px (multi-select) o radio (single) + label flex-1 + count opzionale right.
 Font 14px / 500 / text-primary.
 Count: 12px / 500 / text-muted tabular-nums.
 Hover: bg #F1EFE8.
 Selected: bg #EAFBF1, text #0A3D1F, weight 600, check 16px #2ECC71 left.
Footer dropdown (opzionale per multi-select):
 Padding 8px 12px.
 Border-top 1px #F1EFE8.
 Layout: link "Cancella" left (12px / 500 / text-muted) + button primary sm "Applica" right.
Filtri specifici
Categoria (multi-select, 5 voci):
 Icona contestuale per ogni categoria 16px leading:
 Rivelazione incendi: BellRing #A8531A.
 Antincendio: Flame #A83228.
 Meccanico: Cog #5F5E5A.
 Elettrico: Zap #A8531A.
 TVCC: Camera #5F5E5A.
 Count asset per categoria a destra.
Ubicazione (multi-select, ricerca interna):
 Icon MapPin 14px leading per ogni voce.
 Ricerca interna se >7 ubicazioni.
 Count asset per ubicazione a destra.
Stato (multi-select, 4 voci):
 Dot 8px colorato leading (verde/arancio/rosso/blu-scuro per "in lavorazione").
 Voci: "In Regola", "In Scadenza", "Scaduto", "In Lavorazione".
 Count asset per stato a destra.
Scadenza (single-select, preset rapidi + custom):
 Voci: "Tutte", "Scadute", "Entro 7 giorni", "Entro 30 giorni", "Entro 90 giorni", "Quest'anno", "Range personalizzato&".
 "Range personalizzato" apre date range picker.
Riga 2 — Active Filters Chips (condizionale, height 40px)
Visibile solo quando 1 filtro attivo. Border-top 1px #F1EFE8, padding-top 8px.
Active chip:
 Bg #1C1B18, text #FAFAF9.
 Padding 4px 8px 4px 10px.
 Radius 6px.
 Font 12px / 600.
 Layout: label "Categoria: Antincendio" + close X 12px #A8A6A0 (right, click rimuove filtro).
 Hover su chip: bg #2D2C28.
 Hover su X: text #FAFAF9.
Esempi etichette:
 "Categoria: Antincendio"
 "Categoria: Antincendio +2"
 "Stato: Scaduto"
 "Ubicazione: Corridoio 2"
 "Scadenza: Entro 30 giorni"
A destra: link "Reset tutti i filtri" (13px / 600 / #A83228 underline on hover).
Stati toolbar
 Idle: stato base.
 Sticky on scroll: top: 60px, shadow-xs aggiunta per stacco dal contenuto sotto.
 Loading filtri (refetch dropdown counts): leggera opacity 0.7 sul chip durante refresh.
 Filtri salvati (futuro out-of-scope): in alto a destra "Vista salvata: [Nome] " come quick switch.
Microcopy
 Search placeholder: "Cerca asset, marca, codice&"
 Filter labels: "Categoria", "Ubicazione", "Stato", "Scadenza", "+ Filtri avanzati", "Reset".
 Reset confirmation tooltip: "Rimuove tutti i filtri attivi".
 Counter pattern: "[Range visibile] di [Totale]".
 Empty filter dropdown (nessuna opzione): "Nessuna [categoria/ubicazione/...] disponibile".
Errori da evitare
  Filtri come tabs sempre fissi: occupano spazio verticale per niente.
  Search input full-width: deve restare 360px max per lasciare spazio ai filtri.
  Filtro stato come dropdown senza dot colorato: l'utente deve riconoscere lo stato a colpo d'occhio.
  Active filter chips senza X di rimozione: rimozione filtro deve essere a 1 click.
  Multi-select senza count chips selezionati: l'utente non sa quanti applicati senza riaprire.
  Reset come ghost button piccolissimo nascosto: deve essere visibile quando ha senso.

3. Tabella
Container
 Card bianca #FFFFFF, border 1px #E5E4DF, radius 10px.
 Overflow hidden per radius su angoli.
 No shadow.
 Margin-top 16px da toolbar.
Header tabella
 Bg #FAFAF9, border-bottom 1px #E5E4DF.
 Height 44px.
 Padding cell: 10px 16px.
 Font: Table Header (11px / 600 / 0.06em / UPPERCASE / text-muted).
Colonne (1136px contenitore - 32px padding card = ~1104px utili)

	#	Colonna	Width	Allineamento	Contenuto
	1	Checkbox bulk	44px	center	checkbox 16px
	2	ASSET	320px (flex)	left	icon + nome + meta
	3	CATEGORIA	160px	left	label + icon contestuale
	4	UBICAZIONE	160px	left	icon MapPin + label
	5	ULTIMA VERIFICA	120px	left	data 13px / 500
	6	PROSSIMA VERIFICA	140px	left	data + relative
	7	STATO	140px	center	badge stato
	8	AZIONI	96px	right	3 icon button
	Total  1180px  con scroll-x graceful sotto 1280px.
Riga tabella

 Height 64px (cella ASSET ha 2 righe contenuto, le altre 1).
 Padding cell: 12px 16px.
 Border-bottom 1px #E5E4DF (ultima senza).
 Bg #FFFFFF, hover #FAFAF9.
 Selected (checkbox attivo): bg #EAFBF1, border-left 3px solid #2ECC71 inset.
 Click riga: apre Drawer dettaglio asset.
 Click checkbox: toggle selezione, no apertura drawer.
 Click icona azione: stop propagation.
Cell content per colonna
Checkbox:
 Standard 16×16, brand kit Fase 1.
 Header tabella: checkbox "select all visible".
 Indeterminate state se selezione parziale.
ASSET (cella 320px, layout custom):
 Layout flex: icon 32×32 left + content right (gap 12px).
 Icon container: 32×32, radius 8px, bg colore tenue per categoria + icona 16px:
 Rivelazione incendi: bg #FFF3E8, icon BellRing #A8531A.
 Antincendio: bg #FFF0EE, icon Flame #A83228.
 Meccanico: bg #F1EFE8, icon Cog #5F5E5A.
 Elettrico: bg #FFF3E8, icon Zap #A8531A.
 TVCC: bg #F1EFE8, icon Camera #5F5E5A.
 Content:
 Riga 1: nome asset 14px / 600 / text-primary. Es. "Centrale rilevazione CR2 146".
 Riga 2: meta 12px / 500 / text-muted con separator ·. Es. "Honeywell · IQ8Quad · CEN-CR2-146".
CATEGORIA (cella 160px):
 Layout: icon contestuale 14px text-secondary + label 13px / 500 / text-primary.
 Solo nome categoria, no badge bg colorato (l'icona della cella ASSET già visualizza la categoria in colore).
UBICAZIONE (cella 160px):
 Icon MapPin 14px text-muted + label 13px / 500 / text-primary (gap 6px).
ULTIMA VERIFICA (cella 120px):
 Data 13px / 500 / text-primary tabular-nums. Formato "24 lug 2025".
 Tooltip on hover: data + ora completa "24 luglio 2025 · 14:30".
PROSSIMA VERIFICA (cella 140px, 2 righe):
 Riga 1: data 13px / 600 / colore dipende stato:
 Scaduto: #A83228.
 In scadenza (entro 30 gg): #A8531A.
 Futura: text-primary.
 Riga 2: relativo 11px / 500:
 Scaduto: "[N] gg fa" color #A83228.
 In scadenza: "tra [N] gg" color #A8531A.
 Futura: "tra [N] gg" color text-muted.
STATO (cella 140px, center):
 Badge specifico (vedi §4).
AZIONI (cella 96px, right):
 3 icon button ghost 28×28, gap 4px:
 Eye 16px  apri dettaglio (alternativa al click riga).
 Pencil 16px  modifica diretta.
 MoreHorizontal 16px  dropdown overflow:
 "Crea Work Order" (Wrench 14px) — pre-popolato con asset corrente.
 "Pianifica verifica" (Calendar 14px) — apre scadenzario filtrato.
 "Genera QR Code" (QrCode 14px) — apre dialog QR per stampa etichetta.
 "Visualizza WO collegati" (ListChecks 14px) — naviga /work-orders?asset=[id].
 Divider.
 "Duplica asset" (Copy 14px).
 "Elimina" (Trash2 14px) — destructive variant, color #A83228.
Footer tabella
 Padding 12px 20px.
 Border-top 1px #E5E4DF.
 Bg #FAFAF9.
 Layout flex: count info left, pagination center, page-size selector right.
 Font 13px / 500 / text-secondary.
Count info: "150 di 200 asset".
Pagination:
 Bottoni 32×32 ghost: 9 precedente, numeri pagina (1N con & collapse se >7), : successiva.
 Pagina attiva: bg #1C1B18, text #FAFAF9, weight 700.
 Disabilitato: opacity 0.4, cursor not-allowed.
Page size selector: dropdown "50 per pagina ", opzioni 25/50/100/200.
Bulk actions bar (condizionale)
Quando 1 asset selezionato, sostituisce temporaneamente il footer tabella (slide-up 200ms).
 Bg #1C1B18, text #FAFAF9.
 Padding 12px 20px.
 Layout: count "[N] selezionati" left + actions right + close X right.
 Actions (button ghost dark variant):
 "Pianifica verifica" (icon Calendar).
 "Crea Work Order" (icon Wrench).
 "Esporta selezionati" (icon Download).
 "Cambia stato" (dropdown).
 "Elimina" (button destructive solid sm).
 Close X 18px #A8A6A0 right: deseleziona tutti.
Stati riga
 Default: bg white.
 Hover: bg #FAFAF9, cursor pointer.
 Selected: bg #EAFBF1, border-left 3px verde inset.
 In lavorazione (asset con WO attivo): leading icon ASSET ha dot 8px verde overlay top-right (radius full, border 2px white).
 Asset critico (scaduto): nessun bg riga colorato (sarebbe troppo invasivo). Solo il badge stato + colore data prossima verifica trasmettono l'urgenza.
Sortable columns
 Header colonne sortable: cursor pointer + chevron 12px right (gap 4px).
 Asc: chevron up #1C1B18.
 Desc: chevron down #1C1B18.
 Default unsorted: chevron updown muted.
 Sortable: ASSET (nome), CATEGORIA, UBICAZIONE, ULTIMA VERIFICA, PROSSIMA VERIFICA, STATO.
 Default sort: PROSSIMA VERIFICA asc (più urgenti in cima).
Scroll behavior
 Tabella verticale: scroll esteso pagina (no scroll annidato).
 Header tabella diventa sticky top: 60px + 64px (toolbar) = 124px durante scroll.
 Su scroll orizzontale (sotto 1280px breakpoint): solo l'area tabella scrolla, prime due colonne (checkbox + ASSET) sticky left.
Errori da evitare
  Riga 48px standard: la cella ASSET con due righe testo richiede 64px per respiro.
  Badge stato grosso 40px: chip 11px UPPERCASE è sufficiente.
  Codice asset (CEN-CR2-146) in font monospace: usare Inter tabular-nums (regola Fase 1).
  Mostrare colonna "Marca" come separata: meta riga 2 cella ASSET basta.
  Azioni come kebab (3 puntini) unico: 3 azioni più frequenti dirette + overflow per il resto.
  Pagination senza "X per pagina": utenti con liste lunghe vogliono customizzare.
  Bulk actions bar persistente vuota: appare solo on selection.

4. Badge / Status System Specifico Asset
4 stati definiti: SCADUTO, IN SCADENZA, IN REGOLA, IN LAVORAZIONE.
Anatomia badge tabella
 Padding 4px 8px.
 Radius 6px.
 Font 11px / 600 / 0.04em / UPPERCASE.
 Inline-flex, gap 5px (dot + label).
 Border 1px solid del color text con opacity 0 (invisibile, ma struttura coerente).
Variants
SCADUTO (asset oltre data prossima verifica):
 Bg #FFF0EE.
 Text #A83228.
 Dot 6px #E24B4A.
 Label: " SCADUTO".
 Tooltip on hover: "Verifica scaduta da [N] giorni".
IN SCADENZA (entro 30 giorni dalla prossima verifica):
 Bg #FFF3E8.
 Text #A8531A.
 Dot 6px #E8782A.
 Label: " IN SCADENZA".
 Tooltip: "Verifica tra [N] giorni".
IN REGOLA (verifica futura > 30 giorni):
 Bg #EAFBF1.
 Text #1A7A3C.
 Dot 6px #2ECC71.
 Label: " IN REGOLA".
 Tooltip: "Prossima verifica il [data]".
IN LAVORAZIONE (asset con WO attivo collegato):
 Bg #1C1B18.
 Text #FAFAF9.
 Dot 6px #2ECC71 (verde anche su dark per coerenza accent).
 Label: " IN LAVORAZIONE".
 Tooltip: "Work order [WO-CODE] in corso".
Anatomia badge dettaglio (drawer/modal)
Versione larger per dettaglio asset (drawer):
 Padding 6px 12px.
 Font 12px / 700 / 0.06em / UPPERCASE.
 Radius 6px.
 Layout: dot 8px + label.
Soglie temporali (giorni alla prossima verifica)

	Giorni alla prossima verifica	Stato
	< 0 (passata)	SCADUTO
	030	IN SCADENZA
	> 30	IN REGOLA
	(Override) WO attivo collegato	IN LAVORAZIONE
	IN LAVORAZIONE ha precedenza sugli altri stati: se l'asset ha un WO IN_CORSO collegato, lo stato è IN LAVORAZIONE indipendentemente dalla scadenza.
Filter dropdown stato

 Item dropdown mostra dot 10px + label + count asset.
 Selezione multipla.
Errori da evitare
  Stati senza dot leading: il dot rinforza la lettura status a colpo d'occhio.
  "IN LAVORAZIONE" in verde brillante come success: deve essere distinguibile (variant info dark).
  Tooltip generico "Stato: SCADUTO": deve quantificare ("scaduta da 105 giorni").
  Mix di label inglese/italiano: tutto italiano coerente.

5. Drawer Dettaglio Asset
Layout
 Drawer destro NON modal centrato (lo screenshot attuale mostra modal — questo è il salto qualitativo: drawer più appropriato per consultare e tornare alla lista).
 Width: 560px desktop, 100% mobile.
 Height: 100vh.
 Bg #FFFFFF, border-left 1px #E5E4DF, shadow-md.
 Animation: slide-in-right 200ms ease-out.
 Backdrop: rgba(28, 27, 24, 0.40) blur 4px.
Composizione verticale

 HEADER (72px)
 [icon-32] Dettaglio Asset [] [] []
 CEN-CR2-146

 HERO BLOCK (140px)
 [ SCADUTO badge large]
 Centrale rilevazione CR2 146
 Honeywell · IQ8Quad

  Prossima verifica
  20 gen 2026 · 105 gg fa

 TAB BAR (44px)
 [Anagrafica] [Manutenzione] [WO collegati] [Allegati]

 TAB CONTENT (scrollabile, padding 20px 24px)

 — Tab "Anagrafica" (default) —
  Identificazione
  Nome Centrale rilevazione CR2 146
  Categoria  Rivelazione incendi
  Marca / Modello Honeywell · IQ8Quad
  Seriale CEN-CR2-146

  Posizione
  Ubicazione  Corridoio 2
  Edificio Itelyum Arena
  Piano T (terra)

  Dati storici
  Data installazione 12 mar 2023
  Età operativa 3 anni 2 mesi
  Frequenza verifica 180 giorni

 FOOTER (72px)
 [Saving indicator] [Chiudi] [Modifica asset]

Header drawer (72px)
 Padding 16px 24px.
 Border-bottom 1px #E5E4DF.
 Layout: icon container 32×32 (categoria color) + content (label "Dettaglio Asset" 12px UPPERCASE muted + codice 14px / 600 / text-primary) + actions right.
 Actions right (gap 4px):
 Overflow MoreHorizontal 32×32 ghost (azioni: Duplica, Genera QR, Esporta scheda PDF, Elimina).
 Edit Pencil 32×32 ghost (apre modal modifica).
 Close X 32×32 ghost.
Hero block (140px)
 Padding 20px 24px.
 Bg #FAFAF9.
 Border-bottom 1px #E5E4DF.
 Layout verticale, gap 8px:
 Riga 1: badge stato large variant.
 Riga 2: nome asset Section Title (16px / 700 / text-primary).
 Riga 3: marca · modello (13px / 500 / text-secondary).
 Riga 4 — Card prossima verifica:
 Bg #FFFFFF, border 1px #E5E4DF, radius 8px, padding 12px 16px.
 Layout flex: label "Prossima verifica" 11px / 600 UPPERCASE muted left + valore right.
 Valore: "20 gen 2026 · 105 gg fa" (13px / 600 / colore stato).
Tab bar (44px)
 Padding 0 24px.
 Border-bottom 1px #E5E4DF.
 Tabs underline style:
 Item: padding 12px 16px, font 13px / 600 / text-secondary.
 Active: text text-primary, border-bottom 2px #2ECC71 (inset, allineato al border della tab bar).
 Hover: text text-primary.
 Tabs: Anagrafica, Manutenzione, WO collegati (count badge inline), Allegati (count badge inline).
Tab content "Anagrafica" (default)
Padding 20px 24px.
Pattern field row (per ogni voce):
 Layout grid 2 colonne: label 40% / valore 60%.
 Padding 10px 0.
 Border-bottom 1px #F1EFE8 (ultima del gruppo senza).
 Label: 13px / 500 / text-secondary.
 Valore: 13px / 600 / text-primary, allineato right (formato a colonna).
Con il design rinnovato proporrei layout left-aligned con label sopra valore, più leggibile:
Pattern field row v2 (preferito):
 Layout flex justify-between gap 16px.
 Label: 13px / 500 / text-secondary, width 40%.
 Valore: 13px / 600 / text-primary allineato right, max-width 60%.
 Padding 12px 0.
 Border-bottom 1px #F1EFE8.
Sezioni grouping:
 Section header: padding 0 0 8px, label 11px / 700 / 0.08em / UPPERCASE / text-muted. Es. "IDENTIFICAZIONE", "POSIZIONE", "DATI STORICI".
 Margin-top tra sezioni: 24px.
Field icon contestuali:
 Categoria: icon contestuale gap 6px leading.
 Ubicazione: icon MapPin 14px text-muted leading.
 Date: nessuna icon.
Tab content "Manutenzione"
 Section "STORICO VERIFICHE" (lista timeline):
 Card timeline item: bg #FFFFFF, border-left 2px verde se completata o muted se pianificata.
 Padding 12px 16px.
 Layout: data 12px / 600 + descrizione 13px / 500 + stato badge sm.
 Section "PROSSIMA VERIFICA":
 Mostra data + WO pianificato se esiste, CTA "Pianifica verifica" se manca.
Tab content "WO collegati"
 Lista compatta WO collegati a questo asset.
 Pattern simile a tabella WO recenti dashboard ma layout card stacked.
 Header lista: count + filter sm "Stato".
 Item card: codice WO + titolo + stato + data ultimo aggiornamento.
 Click: apre WO drawer (out of scope qui).
 Empty: "Nessun work order collegato — Crea il primo WO per iniziare a tracciare gli interventi su questo asset". CTA "Crea Work Order".
Tab content "Allegati"
 Lista file: icon tipo + nome + size + data upload + download/delete.
 Drag & drop area top: "Trascina qui i file o [seleziona dal computer]".
 Tipi supportati: PDF, JPG, PNG, DOCX (max 10MB).
Footer drawer (72px)
 Padding 16px 24px.
 Border-top 1px #E5E4DF.
 Bg #FAFAF9.
 Layout: saving indicator left + actions right.
 Saving indicator (vedi sezione 14 Fase 2): "Tutte le modifiche salvate" / "Salvataggio..." / etc.
 Actions: button secondary md "Chiudi" + button primary md "Modifica asset".
Comportamento UX
 Apertura: click riga tabella  drawer slide-in.
 Tab switch: contenuto tab ricaricato se necessario, scroll-to-top tab.
 Click "Modifica asset": apre Modal modifica (vedi §6) sopra il drawer.
 Click overflow  Elimina: conferma destructive dialog (vedi §6).
 Esc / click backdrop / X  chiude drawer.
 Tab default: "Anagrafica".
 URL deep-link: /assets/[id] apre drawer al refresh.
Componenti HeroUI
 Drawer placement="right".
 Tabs HeroUI variant="underlined".
 Card interna per gruppi field.
 Chip per badge stato.
 Button ghost icon header actions.
 Dropdown per overflow menu.
Microcopy
 Header label: "Dettaglio Asset".
 Hero card label: "PROSSIMA VERIFICA".
 Tab labels: "Anagrafica", "Manutenzione", "WO collegati", "Allegati".
 Section labels: "IDENTIFICAZIONE", "POSIZIONE", "DATI STORICI", "STORICO VERIFICHE", "PROSSIMA VERIFICA".
 Footer button: "Chiudi" / "Modifica asset".
Errori da evitare
  Modal centrato 720×480 con tutte le info impilate verticalmente: scarsa leggibilità.
  Drawer senza gerarchia (solo lista key-value piatta): serve grouping per sezioni.
  Tab senza count quando applicabile (WO collegati, Allegati): meno scoperta.
  Hero block senza badge stato visibile: lo stato è il dato chiave del dettaglio.
  "Modifica" come tab dentro al drawer: meglio modal dedicato per evitare ambiguità (modifica vs read).
  Footer senza chiara primary action: utente non sa cosa fare dopo aver letto.

6. Modal Crea / Modifica Asset
Stesso pattern per Crea e Modifica. Differenza: titolo, valori prefilled, CTA label.
Layout
 Modal centrato (NON drawer, perché flusso transazionale, focus task).
 Width: 640px desktop, 100% mobile.
 Max-height: 85vh con scroll interno se necessario.
 Bg #FFFFFF, border 1px #E5E4DF, radius 12px, shadow-lg.
 Backdrop: rgba(28, 27, 24, 0.50) blur 4px.
 Animation: scale 0.96  1 + fade 200ms ease-out.
Header (64px)
 Padding 20px 24px.
 Border-bottom 1px #E5E4DF.
 Layout: title left + close X right.
 Title: "Nuovo Asset" / "Modifica Asset" (16px / 700 / text-primary).
 Subtitle opzionale: "Compila i campi obbligatori per registrare l'asset" / "Aggiorna i dati dell'asset selezionato" (13px / 500 / text-secondary, margin-top 2px).
 Close X: ghost 32×32, icon X 18px.
Body (padding 24px)
Layout: form sezionato in due colonne dove possibile (12 col grid interna gap 16px).
Sezione "DENOMINAZIONE" (full-width)
 Label sezione (11px / 700 UPPERCASE muted) margin-bottom 12px.
 Field "Nome" full-width:
 Label "Nome" + required asterisco rosso.
 Input default md, placeholder "Es. Centrale rilevazione CR2 146".
 Helper text "Nome univoco identificativo per l'asset".
Sezione "CLASSIFICAZIONE" (2 col)
Margin-top 20px.
 Label sezione UPPERCASE.
 Grid 2 col gap 16px:
 Categoria (col 6): Select dropdown con icone categoria leading nelle option, required.
 Ubicazione (col 6): Select dropdown con icona MapPin, required, ricerca interna se >7 voci.
Sezione "IDENTIFICAZIONE TECNICA" (2 col)
 Grid 2 col:
 Marca (col 6): Input.
 Modello (col 6): Input.
 Numero seriale (col 6): Input, required.
 Frequenza verifica (giorni) (col 6): Input number con stepper, required, min 1, default 180.
Helper inline sotto numero seriale (callout):
 Padding 8px 12px, bg #FAFAF9, border 1px #E5E4DF, radius 6px, margin-top 8px.
 Layout: 3 righe info (font 11px / 500 / text-secondary):
 "Sigla apparato: CEN"
 "Codice ubicazione: CR2"
 "Progressivo: 146"
 Validation message inline (font 12px / 500):
 Verde #1A7A3C con dot leading se coerenti: " Seriale e ubicazione sono coerenti."
 Arancione #A8531A con icon warning se non coerenti: " Il seriale non sembra coerente con la categoria/ubicazione selezionata."
Sezione "DATE" (2 col)
 Grid 2 col:
 Data installazione (col 6): Date picker.
 Ultima verifica (col 6): Date picker.
Sezione "ALLEGATI" (full-width, opzionale, solo modifica)
Per la modifica, sezione collassabile per gestire allegati esistenti senza appesantire il form.
Footer (72px)
 Padding 16px 24px.
 Border-top 1px #E5E4DF.
 Bg #FAFAF9.
 Layout: helper left + actions right.
Helper left (12px / 500 / text-muted):
 "I campi con * sono obbligatori".
Actions right (gap 8px):
 Button secondary md "Annulla".
 Button primary md "Crea asset" / "Salva modifiche":
 Icon Save 16px leading (preferito a icona dischetto retro, usare Check o niente).
 Stato saving: spinner + "Salvataggio...".
 Disabled se form invalido.
Validazione
 Inline validation: on blur del field, debounce 300ms.
 Messaggio errore sotto field, font 12px / 500 / #A83228 con icon AlertCircle 12px leading.
 Border field error: #E24B4A.
Regole base:
 Nome: min 3 char, required.
 Categoria, Ubicazione: required.
 Seriale: required, pattern alfanumerico + trattini, unicità verificata async.
 Frequenza: number positivo, required.
 Date installazione: not future.
 Ultima verifica: not future,  data installazione.
Stato saving
 Submit click  button disabled + spinner + "Salvataggio...".
 Modal stays open durante save.
 On success:
 Toast top-right "Asset creato" / "Asset aggiornato".
 Modal chiude con animation 200ms.
 Tabella aggiorna con nuovo asset highlighted (bg #EAFBF1 2 sec poi fade).
 On error:
 Banner inline footer modal (sopra actions): bg #FFF0EE, border-left 3px #E24B4A, padding 10px 12px, radius 6px.
 Icon AlertCircle 14px #A83228 + text 12px / 500 / #A83228: "Errore salvataggio: [messaggio]".
 Modal stays open.
Conferma elimina (destructive dialog)
 Modal piccolo 480px width.
 Header: title "Eliminare l'asset?" + close X.
 Body padding 24px:
 Icon AlertTriangle 24px #A83228 in cerchio #FFF0EE 48×48 left.
 Content right:
 Title: "Eliminare 'Centrale rilevazione CR2 146'?" (14px / 600 / text-primary).
 Description: "Questa azione è permanente. I work order collegati e i rapportini verranno conservati ma non saranno più associati all'asset." (13px / 500 / text-secondary).
 Footer:
 "Annulla" secondary.
 "Elimina asset" destructive solid primary (bg #E24B4A, text #FFFFFF, hover #C93E3D).
Componenti HeroUI
 Modal HeroUI.
 Form con custom layout.
 Input per text fields.
 Select HeroUI per Categoria, Ubicazione.
 Input type=number con stepper.
 DatePicker HeroUI.
 Button per actions.
 Helper callout: layout custom (no Alert HeroUI).
Microcopy
 Title nuovo: "Nuovo Asset".
 Title modifica: "Modifica Asset".
 Title elimina: "Eliminare l'asset?"
 Subtitle nuovo: "Compila i campi obbligatori per registrare l'asset".
 Subtitle modifica: "Aggiorna i dati dell'asset selezionato".
 Section labels: "DENOMINAZIONE", "CLASSIFICAZIONE", "IDENTIFICAZIONE TECNICA", "DATE", "ALLEGATI".
 Required helper: "I campi con * sono obbligatori".
 Validation coerenza: " Seriale e ubicazione sono coerenti." / " Il seriale non sembra coerente."
 CTA crea: "Crea asset".
 CTA modifica: "Salva modifiche".
 CTA elimina: "Elimina asset".
 Toast success: "Asset creato" / "Asset aggiornato" / "Asset eliminato".
 Toast error: "Errore salvataggio".
Errori da evitare
  Bottone primary blu "Salva" come nello screenshot attuale: deve essere verde #2ECC71 brand.
  Form a single colonna estesa verticalmente: usa 2 colonne per ridurre altezza.
  Sezioni senza label UPPERCASE: form senza guidance visiva è cognitivamente più costoso.
  Validazione solo on submit: feedback inline on blur è UX standard.
  Helper callout coerenza con tono tecnico oscuro ("Pattern matched"): linguaggio user-friendly.
  Conferma elimina senza nome asset: "Sicuro?" generico è ambiguo.
  Date picker custom non accessibile: usare DatePicker HeroUI nativo.
  Modal max-height senza scroll: form grandi diventano illegibili.

7. Empty / Loading / Error States
Loading
Loading totale pagina (initial mount):
 Subheader skeleton (title rect 100×30, subtitle rect 220×16, action buttons skeleton).
 Toolbar skeleton: search rect 360×40 + 4 chip skeleton 80120×32 + counter skeleton.
 Tabella skeleton: header reale + 8 skeleton row 64px alti, padding cell con rect placeholder per ogni colonna.
Loading parziale (filtro applicato, ricerca):
 Tabella overlay opacity 0.5 + spinner 24px centrato.
 Counter aggiorna real-time.
Loading singolo asset (drawer/modal):
 Drawer header reale + skeleton tab bar + tab content skeleton (8 field row skeleton).
Empty
Empty totale (nessun asset registrato):
 Container centrato in area contenuto, padding verticale 96px.
 Icon Boxes 40px in cerchio #F1EFE8 64×64.
 Title: "Nessun asset registrato" (16px / 700).
 Description: "Inizia caricando i tuoi asset per attivare la gestione manutentiva. Puoi creare asset uno per volta o importare da Excel." (14px / 400 / text-secondary, max-w 420px center).
 CTA primary md: "Crea il primo asset" (icon Plus leading).
 Link secondario: "Importa da Excel" (link #1A7A3C 13px / 600).
Empty filtri (filtri attivi, nessun risultato):
 Container in area contenuto sotto la tabella card (NON dentro la tabella, cosi i filtri restano visibili e modificabili).
 Padding 64px verticale.
 Icon SearchX 32px in cerchio #F1EFE8 56×56.
 Title: "Nessun asset trovato" (14px / 600).
 Description: "I filtri attivi non hanno restituito risultati. Prova a rimuoverne alcuni o a cambiare la ricerca." (13px / 500 / text-secondary).
 CTA secondary md: "Reset filtri".
Empty bulk action:
 Quando "Esporta selezionati" senza selezione: tooltip su button "Seleziona almeno un asset".
Error
Error totale (caricamento fallito):
 Container centrato, padding 64px.
 Icon AlertCircle 40px cerchio #FFF0EE 64×64.
 Title: "Impossibile caricare gli asset" (16px / 700).
 Description: "C'è stato un problema di connessione. Riprova o contatta il supporto se il problema persiste." (14px / 400 / text-secondary).
 CTA primary md: "Riprova".
 Link secondary: "Contatta supporto".
Error riga tabella (singola riga fallita aggiornamento):
 Riga mantiene last known state.
 Toast top-right error: "Errore aggiornamento asset [nome]. Riprova."
Error save modal:
 Banner inline footer modal (vedi §6).
Error transient API:
 Toast top-right 360px:
 "Errore connessione" + "Riprova tra qualche secondo".
 Auto-dismiss 5s.
Saving
 Footer drawer: indicator inline (vedi Fase 2 §14).
 Modal submit: button con spinner (vedi §6 sopra).
 Bulk action: progress modal "Aggiornamento di [N] asset..." con progress bar percentuale.

8. Componenti HeroUI Consigliati

	Elemento	HeroUI / altro
	Page wrapper	semantic <main>
	Subheader / breadcrumb	layout custom + Breadcrumbs HeroUI
	Title actions	Button (secondary, primary)
	Toolbar container	Card HeroUI
	Search input	Input con icon prop
	Filter dropdown	Dropdown + DropdownMenu HeroUI o Popover + custom listbox
	Filter chip trigger	Button secondary sm
	Active filter chip	Chip HeroUI variant="solid" custom dark
	Reset filtri link	Link HeroUI
	Tabella container	Table HeroUI
	Cell ASSET con icon	layout custom in TableCell
	Badge stato	Chip HeroUI custom colors
	Action icons riga	Button ghost icon + Dropdown overflow
	Pagination	Pagination HeroUI
	Page size selector	Select HeroUI sm
	Bulk actions bar	layout custom (no Toolbar nativo)
	Drawer dettaglio	Drawer HeroUI placement="right"
	Drawer tabs	Tabs HeroUI variant="underlined"
	Field row dettaglio	layout custom
	Modal crea/modifica	Modal HeroUI
	Form fields	Input, Select, DatePicker, HeroUI
	Helper callout coerenza	div custom (no Alert HeroUI)
	Confirm delete	Modal HeroUI piccolo
	Toast	sonner (esistente)
	Skeleton	Skeleton HeroUI
	Tooltip	Tooltip HeroUI

9. Microcopy
Subheader

 Title: "Asset"
 Subtitle pattern: "[Total] asset · [N categorie] categorie · [N scaduti] scaduti"
 Page actions: "Esporta Excel" / "Scansiona QR" / "+ Nuovo asset"
Toolbar
 Search placeholder: "Cerca asset, marca, codice&"
 Filtri: "Categoria", "Ubicazione", "Stato", "Scadenza", "+ Filtri avanzati"
 Reset: "Reset"
 Counter: "[Range] di [Totale]"
Filter dropdowns
 Multi-select count label: "[Filtro] · [N] selezionate"
 Single value label: "[Filtro] · [Valore]"
 Multi-select footer: "Cancella" / "Applica"
Active chips
 "Categoria: Antincendio" / "Stato: Scaduto" / "Ubicazione: Corridoio 2"
 Reset all: "Reset tutti i filtri"
Tabella
 Headers: "ASSET", "CATEGORIA", "UBICAZIONE", "ULTIMA VERIFICA", "PROSSIMA VERIFICA", "STATO", "AZIONI"
 Sort tooltip: "Ordina per [colonna]"
 Row click hint tooltip: "Clicca per dettaglio"
Bulk
 "[N] selezionati" / "[N] selezionato"
 Actions: "Pianifica verifica", "Crea Work Order", "Esporta selezionati", "Cambia stato", "Elimina"
 Confirm bulk delete: "Eliminare [N] asset?"
Action overflow per riga
 "Crea Work Order"
 "Pianifica verifica"
 "Genera QR Code"
 "Visualizza WO collegati"
 "Duplica asset"
 "Elimina"
Drawer
 Header label: "Dettaglio Asset"
 Tabs: "Anagrafica", "Manutenzione", "WO collegati ([N])", "Allegati ([N])"
 Section labels: "IDENTIFICAZIONE", "POSIZIONE", "DATI STORICI", "STORICO VERIFICHE"
 Field labels: "Nome", "Categoria", "Marca / Modello", "Seriale", "Ubicazione", "Edificio", "Piano", "Data installazione", "Età operativa", "Frequenza verifica"
 Actions: "Chiudi" / "Modifica asset"
Modal crea/modifica
 Title: "Nuovo Asset" / "Modifica Asset"
 Subtitle nuovo: "Compila i campi obbligatori per registrare l'asset"
 Subtitle modifica: "Aggiorna i dati dell'asset selezionato"
 Sections: "DENOMINAZIONE", "CLASSIFICAZIONE", "IDENTIFICAZIONE TECNICA", "DATE", "ALLEGATI"
 Helper coerenza positivo: " Seriale e ubicazione sono coerenti."
 Helper coerenza warning: " Il seriale non sembra coerente con categoria/ubicazione."
 Required hint: "I campi con * sono obbligatori"
 CTA: "Annulla" / "Crea asset" / "Salva modifiche"
Toast
 Success crea: "Asset creato"
 Success modifica: "Asset aggiornato"
 Success elimina: "Asset eliminato"
 Success bulk: "[N] asset aggiornati"
 Error: "Errore salvataggio. Riprova."
Confirm elimina
 Title: "Eliminare l'asset?"
 Asset specifico: "Eliminare '[Nome asset]'?"
 Description: "Questa azione è permanente. I work order collegati e i rapportini verranno conservati ma non saranno più associati all'asset."
 CTA: "Annulla" / "Elimina asset"
Empty / Error
 Empty totale title: "Nessun asset registrato"
 Empty totale desc: "Inizia caricando i tuoi asset per attivare la gestione manutentiva."
 Empty totale CTA: "Crea il primo asset" / "Importa da Excel"
 Empty filtri title: "Nessun asset trovato"
 Empty filtri desc: "I filtri attivi non hanno restituito risultati."
 Empty filtri CTA: "Reset filtri"
 Error title: "Impossibile caricare gli asset"
 Error desc: "C'è stato un problema di connessione. Riprova o contatta il supporto."
 Error CTA: "Riprova" / "Contatta supporto"

10. Descrizione Visiva Dettagliata
L'utente atterra sulla pagina Asset e percepisce una struttura densa ma respirabile. La sidebar dark a sinistra ancora il contesto; nel content area, su sfondo carta #FAFAF9, il subheader presenta semplicemente "Asset" in 24px bold seguito da un sottotitolo metadata che quantifica il dataset ("200 asset · 5 categorie · 139 scaduti"). Sulla destra, tre azioni allineate: due secondarie (Esporta Excel, Scansiona QR) e una primaria verde (+ Nuovo asset). La gerarchia verde/secondario è netta a colpo d'occhio.
Sotto, una toolbar bianca con border avorio raggruppa tutta la logica di filtraggio in un singolo blocco coerente. La search bar a sinistra (max 360px) ha placeholder "Cerca asset, marca, codice&" con icona search 16px #888780. Subito dopo, quattro filter chips (Categoria, Ubicazione, Stato, Scadenza) — bianchi con border quando inattivi, bordo verde + bg #EAFBF1 quando hanno una selezione attiva, con il valore visibile inline. A destra il counter "150 di 200" sempre presente per orientamento.
Quando l'utente applica un filtro, una seconda riga di chip dark appare sotto la toolbar: [Categoria: Antincendio ×] [Stato: Scaduto ×], ognuna rimuovibile con un click. A destra di questa riga, il link "Reset tutti i filtri" in rosso scuro #A83228 per chiusura rapida.
La tabella sotto è una card bianca con border avorio, radius 10px. Header bg #FAFAF9 con label UPPERCASE 11px tracked #888780, righe alternate solo per hover (#FAFAF9), bg base bianco. Ogni riga è alta 64px perché la cella ASSET contiene su due righe il nome (14px / 600) e i metadata (12px / 500 muted: "Honeywell · IQ8Quad · CEN-CR2-146"). Sulla sinistra di ogni riga, un container icon 32×32 con bg colore tenue per categoria e icon lucide-react 16px (rosso per antincendio, arancio per elettrico/rivelazione incendi, neutro per meccanico/TVCC) — l'unica concessione cromatica, per identificazione rapida.
La colonna PROSSIMA VERIFICA è il punto di tensione: data + relativa (20 gen 2026 / 105 gg fa) con colore che racconta lo stato — rosso scuro #A83228 per scaduto, arancione #A8531A per in scadenza, neutro per futuro. La colonna STATO rinforza con un badge UPPERCASE compatto (11px / 600 / 0.04em) con dot leading colorato e bg tenue (rosa per scaduto, arancio per scadenza, verde per regola, dark per in lavorazione).
Le azioni a destra sono 3 ghost icon button (28×28): occhio per dettaglio, matita per modifica, kebab per overflow. Il footer tabella mostra count, pagination centrale con pagina attiva bg dark e page-size selector a destra.
Click su una riga apre un drawer da destra (560px) invece di un modal centrato — scelta deliberata per mantenere la lista visibile in transparency dietro il backdrop, e permettere consultazione rapida senza perdere il contesto. Il drawer ha header con icon categoria + codice asset + actions (overflow, edit, close), un hero block beige #FAFAF9 con badge stato large + nome asset + brand-modello + card "PROSSIMA VERIFICA" inline, e una tab bar underline con 4 sezioni (Anagrafica, Manutenzione, WO collegati con count, Allegati con count). Tab Anagrafica è default, organizzata in 3 sottosezioni con label UPPERCASE muted ("IDENTIFICAZIONE", "POSIZIONE", "DATI STORICI") e field row con label sinistra muted + valore destra bold.
Click su "Modifica asset" apre un modal centrato (640px) sopra il drawer — separazione semantica chiara: drawer = consultazione, modal = transazione. Il modal è organizzato in 5 sezioni con label UPPERCASE (Denominazione, Classificazione, Identificazione tecnica, Date, Allegati) con grid 2 colonne dove possibile. Sotto il numero seriale, un callout neutro mostra la decomposizione del codice (sigla, codice ubicazione, progressivo) e un validation message verde inline ("Seriale e ubicazione sono coerenti") che diventa arancione se la coerenza fallisce. Footer modal con CTA primary verde "Salva modifiche" e secondary "Annulla", più un helper "I campi con * sono obbligatori" a sinistra.
L'intera pagina respira la stessa logica: bianco su carta, border al posto di shadow, verde solo dove conta (CTA primaria, stato in regola, focus ring, dot di stato), status colorati esclusivamente nei punti di decisione (badge, data prossima verifica, callout coerenza) — mai su grandi superfici. La densità è alta, ma ogni elemento ha gerarchia tipografica precisa e spacing coerente. È un tool che non si fa notare, ma che gestisce 200 asset con la stessa naturalezza con cui ne gestirebbe 20.

11. Tabella sintetica "elemento  componente HeroUI"

	Elemento	Componente
	Page wrapper	<main>
	Breadcrumbs	Breadcrumbs HeroUI
	Page title	<h1> custom 24/700
	Subtitle	<p> custom 14/500
	Page action buttons	Button (secondary md, primary md)
	Toolbar container	Card HeroUI no shadow
	Search input	Input con startContent icon
	Filter chip trigger	Button secondary sm + Dropdown
	Filter dropdown menu	DropdownMenu HeroUI
	Filter checkbox item	DropdownItem con Checkbox HeroUI
	Active filter chip	Chip HeroUI variant="solid" custom dark
	Reset link	Link HeroUI
	Tabella	Table HeroUI con removeWrapper
	Asset cell custom	layout custom dentro TableCell
	Categoria icon container	<div> con bg color + lucide-react icon
	Stato badge	Chip HeroUI custom colors
	Action icon buttons	Button ghost iconOnly
	Action overflow	Dropdown + Button ghost icon
	Pagination	Pagination HeroUI variant="bordered"
	Page size select	Select HeroUI size sm
	Bulk actions bar	layout custom div <div> con bg dark
	Drawer	Drawer HeroUI placement="right"
	Drawer tabs	Tabs HeroUI variant="underlined"
	Drawer field row	layout custom flex
	Modal	Modal HeroUI
	Form section label	<h3> custom 11/700 UPPERCASE
	Form fields	Input, Select, DatePicker HeroUI
	Coerenza helper callout	<div> custom
	Saving indicator	<div> custom + Spinner HeroUI
	Confirm delete modal	Modal HeroUI piccolo
	Skeleton	Skeleton HeroUI
	Tooltip	Tooltip HeroUI
	Empty state	layout custom
	Error state	layout custom
	Toast	sonner (esistente)

12. Errori Visivi da Evitare

1  Bottone "Nuovo asset" blu come nello screenshot attuale — deve essere primary verde #2ECC71. Il blu va completamente rimosso dal prodotto.
2  Riga tabella troppo bassa (48px) — la cella ASSET con due righe testo richiede 64px per leggibilità.
3  Mostrare codice asset (CEN-CR2-146) in font monospace — usare Inter con tabular-nums. Mantenere font unico.
4  Badge stato senza dot leading — il dot rinforza la lettura status a colpo d'occhio.
5  Filter chip generico "Categoria" quando un filtro è attivo: deve mostrare valore selezionato Categoria · Antincendio.
6  Active filter chips solo sotto la toolbar senza X di rimozione — ogni chip deve essere rimovibile a 1 click.
7  Modal centrato per dettaglio asset — drawer destro è più appropriato per consultazione rapida (lo screenshot attuale usa modal: questo è il salto da fare).
8  Modal modifica con bottone primary blu — verde brand.
9  Form a singola colonna estesa verticalmente — usare grid 2 col dove possibile per ridurre altezza modal.
10  Helper callout coerenza con tono tecnico oscuro — linguaggio user-friendly, non error code.
11  Validazione solo on submit — feedback inline on blur è UX standard.
12  Conferma elimina senza nome asset — "Sicuro?" generico è ambiguo. Includere il nome.
13  Bulk actions bar persistente vuota — appare solo on selection.
14  Tabella senza checkbox per bulk — operazioni bulk sono critiche per gestire 200+ asset.
15  Pagination senza page-size selector — utenti con liste lunghe vogliono customizzare la densità.
16  Header tabella senza sort indicator — l'utente deve sapere che le colonne sono ordinabili.
17  Default sort per "ASSET" alfabetico — default più utile è PROSSIMA VERIFICA asc (più urgenti in cima, supporta il workflow operativo).
18  Hover row con shadow o transform — solo bg color change. Niente movimento.
19  Bulk action "Elimina" come ghost in mezzo agli altri — deve essere destructive solid alla fine, separata da divider o margin.
20  Drawer dettaglio senza tab bar — la complessità asset (anagrafica + manutenzione + WO + allegati) richiede separazione verticale.
21  Tabs drawer come solid filled — underlined style è più appropriato per consultazione, meno rumore visivo.
22  Hero block drawer sullo stesso bg del content — il #FAFAF9 separa visivamente l'identità asset dal dettaglio.
23  Badge "IN LAVORAZIONE" in verde brillante come success — deve essere variant info dark per distinguerlo da "IN REGOLA".
24  Empty state con solo "Nessun asset" — sempre titolo + descrizione + CTA azionabile.
25  Filtri come tabs sempre fissi — tabs occupano spazio verticale e suggeriscono navigazione, non filtraggio. Dropdown è la scelta corretta.
26  Sticky toolbar senza shadow on scroll — l'utente perde il senso di stacco. Aggiungere shadow-xs quando attivo sticky.
27  Mix di formati data — sempre "DD MMM YYYY" italiano (es. "20 gen 2026"). Mai numerico ambiguo.
28  Icona azione Eye (visualizza) ridondante con click su riga — mantenerla per accessibilità + utenti tastiera, ma è ridondante per mouse. Ok mantenerla, è coerenza.
29  Modal crea senza sezioni — form lungo senza grouping label è cognitivamente costoso.
30  Filter "Scadenza" come date range solo custom — preset rapidi (Entro 7 gg, Entro 30 gg, Scadute) coprono 90% dei casi.

Pagina Assets completata. Pronto per FASE 5 — Work Orders quando vuoi.


---

## Work Orders

1. Layout Desktop 1440px
Architettura: Tabella + Card View toggle
Lo screenshot attuale mostra una vista a card 3-column. È funzionale per un'arena con pochi WO concomitanti, ma diventa difficile da scansionare quando crescono. La soluzione: vista doppia a switch, default tabella (per coerenza con Asset e per density operativa), card view come opzione.
Spazio disponibile
 Sidebar 248px + content 1192px - padding 28px = 1136px utili.
Layout verticale

 HEADER (60px) — sticky

 CONTENT AREA (padding 28px, bg #FAFAF9)

  Subheader pagina
  Breadcrumb: Operatività / Work Orders
   Title row
   Work Orders [Esporta] [ Tabella  Card] [+ Nuovo WO]
   16 ordini · 3 in corso · 8 pianificati · 4 chiusi questa settimana

 [spacing 20px]

  STATUS TABS BAR (segmented)
  [Tutti 16] [Da fare 8] [In corso 3] [Chiusi 4] [Validati 1]

 [spacing 16px]

  TOOLBAR FILTRI
  [ Cerca intervento&] [Stato][Priorità][Tipo][Tecnico][Asset]
  [Periodo ] [+ Filtri avanzati] [ Reset] 120 di 16
   chips: Stato: Pianificato × · Priorità: Alta ×

 [spacing 16px]

  TABELLA WORK ORDERS (modalità default)
  CODICE INTERVENTO TIPO ASSET PRIORITÀ STATO ASSEGNATO DATA AZIONI

  ...
  Footer: 120 di 16 [pagination] [20 per pagina]

 [spacing 32px bottom]

Dimensioni indicative blocchi
 Subheader: 9296px alto.
 Status tabs bar: 44px alto.
 Toolbar filtri: 64px (singola riga) + 40px riga active chips.
 Tabella: header 44px + N righe 64px + footer 56px.
 Card view (alternativa): grid 3 col, gap 20px, card 360×280px (altezza variabile in base a contenuti).

2. Toolbar Filtri
Pattern coerente con Fase 4 Asset, con filtri specifici per WO.
Container
 Card #FFFFFF, border #E5E4DF, radius 10px.
 Sticky top: 60px durante scroll, shadow-xs quando sticky.
 Padding 12px 16px.
Riga 1 (40px)
Search input (flex, max-width 360px):
 Placeholder: "Cerca intervento, codice, asset&"
Filter chips (gap 8px, button secondary sm):
 Stato (multi-select, 8 voci con dot colorato leading).
 Priorità (multi-select, 4 voci con dot colorato).
 Tipo (multi-select, 3 voci: Programmato, Correttivo, Extra).
 Tecnico (multi-select con search, opzione "Non assegnato" come voce dedicata).
 Asset (single-select con search, mostra anche categoria asset accanto al nome).
 Periodo (single-select preset: Oggi / Questa settimana / Mese corrente / Range custom...).
 + Filtri avanzati (popover): Fornitore, Range costi (min/max ¬), Solo con allegati, Solo con ticket collegato, Solo in ritardo.
 Reset (visibile se 1 attivo).
Right side: counter "120 di 16" (13px / 500 / text-secondary).
Riga 2 — Active filter chips (condizionale, height 40px)
Stesso pattern di Fase 4: chip dark #1C1B18 con label "Filtro: Valore" e X di rimozione. A destra "Reset tutti i filtri".
Stati toolbar
 Idle, sticky on scroll, loading filtri, filtri salvati (out of scope v1).
Microcopy
 Search: "Cerca intervento, codice, asset&"
 Filtri: "Stato", "Priorità", "Tipo", "Tecnico", "Asset", "Periodo", "+ Filtri avanzati", "Reset"
 Tecnico opzione speciale: "Non assegnato" (in cima alla lista, separata da divider).
 Counter: "[Range] di [Totale]"
Errori da evitare
  Singolo dropdown "Stato" che mostra solo stati binari (aperto/chiuso): tutti gli 8 stati distinti devono essere filtrabili.
  Filtro "Asset" come solo testo libero: deve essere selettore con search (asset = relazione 1:1 critica).
  Filtri senza counts: l'utente non sa quanti WO per stato/priorità senza applicare.

3. Tabella / Lista
View toggle (in subheader page actions)
Segmented control 32px alto:
 Bg #F1EFE8, border 1px #E5E4DF, radius 8px, padding 2px.
 Item: padding 4px 12px, font 13px / 600.
 Item attivo: bg #FFFFFF, border 1px #D3D1C7, text #1C1B18.
 Item inattivo: text #5F5E5A, no bg.
 Icone leading: Table2 14px (Tabella), LayoutGrid 14px (Card).
 Default: Tabella.
 Persistenza in localStorage: wo.viewMode.
Status tabs bar (pre-toolbar)
Filtro veloce per stato aggregato. Sopra la toolbar, ridotto cognitive load.
Layout:
 Container: card bianca #FFFFFF, border #E5E4DF, radius 10px, padding 4px.
 Tabs inline-flex.
 Item: padding 8px 16px, radius 6px, font 13px / 600.
 Item inattivo: text #5F5E5A, hover bg #F1EFE8.
 Item attivo: bg #1C1B18, text #FAFAF9.
 Count inline: chip 11px / 700 con bg rgba(250,250,249,0.20) se attivo, bg #F1EFE8 se inattivo.
Tabs:
 "Tutti" (totale)
 "Da fare" (NEW + PLANNED + ASSIGNED)
 "In corso" (IN_PROGRESS + SUSPENDED)
 "Chiusi" (CLOSED)
 "Validati" (VALIDATED)
 "Abbandonati" (ABANDONED) — solo se count > 0
Click tab: applica filtro stato corrispondente, sostituisce i chip stato attivi nella toolbar.
Tabella (default view)
Container
 Card bianca, border #E5E4DF, radius 10px, no shadow.
Header tabella
 Bg #FAFAF9, border-bottom 1px #E5E4DF.
 Height 44px.
 Padding cell: 10px 16px.
 Font: Table Header (11px / 600 / 0.06em / UPPERCASE / text-muted).
Colonne (1136px - padding card 32px = ~1104px utili)

	#	Colonna	Width	Allineamento	Contenuto
	1	Checkbox	44px	center	checkbox 16px
	2	CODICE	110px	left	"WO-26016" 13px / 600 tabular-nums
	3	INTERVENTO	flex (300px+)	left	titolo + meta asset
	4	TIPO	110px	left	badge type sm
	5	PRIORITÀ	100px	center	badge priority sm
	6	STATO	140px	center	badge status
	7	ASSEGNATO	180px	left	avatar + nome o "Non assegnato"
	8	DATA	130px	left	data + relativo
	9	AZIONI	96px	right	3 icon button
	Total  1110px  graceful scroll-x sotto 1280px.
Riga tabella

 Height 64px.
 Padding cell: 12px 16px.
 Border-bottom 1px #E5E4DF.
 Bg #FFFFFF, hover #FAFAF9.
 Selected (checkbox): bg #EAFBF1, border-left 3px #2ECC71 inset.
 Click riga: apre Drawer dettaglio WO.
Cell content
CODICE:
 "WO-26016" (13px / 600 / text-primary tabular-nums).
 Tooltip on hover: data creazione completa.
INTERVENTO:
 Riga 1: titolo intervento 14px / 600 / text-primary. Es. "Manutenzione pianificata — Pulsante allarme PL1 066".
 Riga 2: meta 12px / 500 / text-muted. Es. "Pulsante allarme PL1 066 · Rivelazione incendi · Corridoio 2".
 Truncate con tooltip se overflow.
TIPO (badge type sm):
 "PROGRAMMATO" (neutral): bg #F1EFE8, text #5F5E5A, dot 6px #888780.
 "CORRETTIVO" (warning): bg #FFF3E8, text #A8531A, dot 6px #E8782A.
 "EXTRA" (info): bg #1C1B18, text #FAFAF9, dot 6px #2ECC71.
PRIORITÀ (badge priority sm):
 "BASSA": bg #F1EFE8, text #5F5E5A, dot #888780.
 "MEDIA": bg #FFF3E8, text #A8531A, dot #E8782A.
 "ALTA": bg #FFF0EE, text #A83228, dot #E24B4A.
 "CRITICA": bg #A83228, text #FFFFFF, dot #FFFFFF. Variant solid per max evidenza.
STATO (badge status, vedi §7).
ASSEGNATO:
 Caso assegnato:
 Avatar 24×24 + content (gap 8px).
 Riga 1: nome 13px / 500 / text-primary. Es. "Marco Rossi".
 Riga 2: ruolo 11px / 500 / text-muted. Es. "Tecnico interno" o "Fornitore: Acme S.r.l."
 Caso non assegnato:
 Cerchio 24×24 con border dashed 1.5px #D3D1C7, no fill, icon User 12px #888780 centrato.
 Label "Non assegnato" 13px / 500 / text-muted (italic opzionale).
DATA:
 Riga 1: data principale 13px / 500 / text-primary tabular-nums. Logica:
 Se IN_PROGRESS: "Avviato 5 mag" + "ore HH:mm" sotto.
 Se PLANNED/ASSIGNED: "Pianificato 9 lug 2026" + relativo "tra X gg" sotto.
 Se CLOSED/VALIDATED: "Chiuso 5 mag" + relativo "X gg fa" sotto.
 Se in ritardo (data pianificata < oggi e non chiuso): data colore #A83228 + "X gg di ritardo" sotto in #A83228.
 Riga 2: relativo 11px / 500 / text-muted.
AZIONI:
 3 icon button ghost 28×28:
 Eye 16px  apri dettaglio (default click riga).
 PlayCircle / CheckCircle / Pencil 16px contestuale a stato (azione rapida principale).
 MoreHorizontal 16px  dropdown:
 "Apri dettaglio".
 "Modifica" (Pencil).
 "Avanza stato " (mostra prossimo stato se applicabile).
 "Sospendi" (se attivo).
 "Riassegna" (UserRoundCog).
 "Allega rapportino" (Paperclip).
 "Collega ticket" (Link2).
 Divider.
 "Duplica WO" (Copy).
 "Stampa scheda" (Printer).
 Divider.
 "Annulla / Abbandona" (XCircle destructive #A83228).
Default sort
 Priorità desc (Critica  Alta  Media  Bassa)  secondary sort Data pianificata asc.
 L'utente può cambiare sort (column header sortable).
Footer
Identico a Asset Fase 4.

Card View (alternativa)
Grid 3 col gap 20px, card 360×280px (altezza variabile).
Card layout:
 Bg #FFFFFF, border 1px #E5E4DF, radius 10px, padding 0 (header con padding interno).
 Border-left 3px colore priorità (criticità visiva immediata):
 BASSA: #D3D1C7 (neutro tenue).
 MEDIA: #E8782A.
 ALTA: #E24B4A.
 CRITICA: #A83228 (più scuro per max evidenza).
 Hover card: shadow-xs, border #D3D1C7.
Header card (padding 16px 20px, border-bottom #F1EFE8):
 Layout flex: codice WO tabular-nums 12px / 600 / text-secondary left + badge priority sm right.
Body card (padding 16px 20px):
 Title intervento: 14px / 600 / text-primary, line-clamp 2.
 Meta sotto: asset · categoria 12px / 500 / text-muted margin-top 4px, line-clamp 1.
 Margin-top 16px:
 Riga assegnatario: avatar 28px + nome + meta (creato data) — pattern coerente con tabella.
 Stato badge inline sopra o accanto.
Date row (padding 12px 20px, border-top #F1EFE8):
 Layout flex: icon Calendar 14px + data + relativo (left) + link "Apri scheda " (right).
Footer card actions (padding 12px 20px, border-top #E5E4DF, bg #FAFAF9):
 Layout flex gap 8px, max 3 azioni rapide button sm contestuali a stato:
 PLANNED  "Prendi in carico" (primary), "Chiudi" (ghost), "Sospendi" (destructive ghost).
 ASSIGNED  "Avvia" (primary), "Chiudi", "Sospendi".
 IN_PROGRESS  "Completa" (primary), "Sospendi" (destructive ghost).
 SUSPENDED  "Riprendi" (primary), "Annulla".
 CLOSED  "Valida" (primary), "Riapri" (ghost).
Errori da evitare card view:
  Card senza border-left priorità: priorità è il dato chiave, deve essere immediatamente visibile.
  Bottoni primary blu nel footer card (come screenshot attuale): verde brand.
  "Sospendi" come link rosso senza distinzione visiva chiara: usare button ghost destructive.
  Card alte 320px+ con whitespace inutile: padding controllato, contenuto compatto.

4. Timeline Stato
Stati WO (8 totali)

	Stato	Label IT	Colore	Significato
	NEW	Nuovo	#5F5E5A (neutro)	Creato, non ancora pianificato
	PLANNED	Pianificato	#A8531A warning	Data fissata, da assegnare
	ASSIGNED	Assegnato	#1A7A3C info	Tecnico/fornitore assegnato
	IN_PROGRESS	In corso	#A8531A con dot animato	Lavorazione attiva
	SUSPENDED	Sospeso	#A83228 warning-error	Bloccato, ripristinabile
	CLOSED	Chiuso	#1A7A3C success	Completato, in attesa validazione
	VALIDATED	Validato	#0A3D1F deep success	Verificato e archiviato
	ABANDONED	Abbandonato	#5F5E5A neutro	Non più rilevante, archiviato
	Timeline stepper (nel drawer/modal dettaglio)
Layout orizzontale (stepper a step circolari + connettori):
`
Nuovo Pianif. Assegn. In Corso Chiuso Validato
[completato] [completato] [attivo] [pendente] [pendente] [pendente]
Step:

 Cerchio 28×28, border 2px.
 Numero 12px / 700 al centro.
 Label sotto: 11px / 600 / 0.04em / UPPERCASE, margin-top 8px.
 Stati step:
 Completato: bg #2ECC71, border #2ECC71, numero #FFFFFF (in realtà icon Check 14px).
 Attivo (corrente): bg #FFFFFF, border #2ECC71 2px, numero #1A7A3C weight 700, ring 4px rgba(46,204,113,0.20) esterno.
 Pendente: bg #FFFFFF, border #D3D1C7 1.5px, numero #888780 weight 600.
 Connettore tra step:
 Linea orizzontale 2px height, width flex.
 Colore #2ECC71 se step precedente completato, altrimenti #E5E4DF.
 Label step:
 Completato/Attivo: text #1C1B18 weight 600.
 Pendente: text #888780 weight 500.
Stepper limita a 6 step visibili del flusso primario: Nuovo  Pianificato  Assegnato  In Corso  Chiuso  Validato.
Stati eccezionali (Sospeso, Abbandonato) non sono nello stepper:
 Se SUSPENDED: stepper resta sullo step precedente (ultimo completato), un badge giallo "SOSPESO" appare overlay sopra lo stepper, e una banner inline sotto: "WO sospeso il [data] da [utente]. Motivo: [testo]. [Riprendi]".
 Se ABANDONED: stepper grayscale (tutto opacity 0.5), badge "ABBANDONATO" overlay top-right, banner: "WO abbandonato il [data]. Motivo: [testo]."
Header timeline (sopra stepper)
 Layout flex: title left + actions right.
 Title: "Timeline Intervento" (16px / 700 / text-primary).
 Subtitle: "Clicca uno stato per aggiornare rapidamente il WO." (13px / 500 / text-secondary, margin-top 2px).
 Actions right (gap 8px):
 Quick actions contestuali a stato corrente:
 Da PLANNED: "Sospendi" (destructive ghost sm), "Annulla" (destructive ghost sm), "Avanza a Assegnato" (primary sm).
 Da ASSIGNED: "Sospendi", "Avanza a In Corso" (primary).
 Da IN_PROGRESS: "Sospendi", "Chiudi" (primary).
 Da SUSPENDED: "Riprendi" (primary), "Annulla" (destructive).
 Da CLOSED: "Riapri" (ghost), "Valida" (primary).
 Da VALIDATED: "Archiviato" (read-only, no actions).
Comportamento step click:
 Se step  stato corrente: noop o tooltip "Già completato".
 Se step = stato successivo possibile: click avanza (con conferma se richiede dati mancanti, es. per CLOSED servono data esecuzione effettiva).
 Se step > stato successivo: disabled, tooltip "Completa prima [step intermedio]".
Tooltip per step:
 Completato: "Completato il [data] da [utente]".
 Attivo: "Stato attuale".
 Pendente cliccabile: "Avanza a [stato]".
 Pendente bloccato: "Completa prima [step intermedio]".
Errori da evitare timeline
  Stati eccezionali (Sospeso/Abbandonato) inline come step nel flusso lineare: confonde la sequenza canonica.
  Step cliccabili che bypassano stati intermedi senza warning.
  Mancanza di feedback visivo sullo step "attivo" (deve avere ring 4px verde rgba esterno).
  Connettori uniformi senza distinzione completato/pendente.
  Quick actions "Sospendi"/"Abbandona" troppo prominenti vicino a "Avanza": rischio click errato. Usare ghost destructive separato da primary.

5. Drawer Dettaglio Work Order
Layout
 Drawer destro 720px (più ampio di Asset 560px perché il WO ha più contenuto: timeline + sezioni multiple + allegati).
 Bg #FFFFFF, border-left #E5E4DF, shadow-md.
 Animation slide-in-right 200ms.
 Backdrop rgba(28,27,24,0.40) blur 4px.
Composizione verticale

 HEADER (72px)
 [icon-32] Dettaglio Work Order [] [ Modifica] []
 WO-26016 · creato 2 mag

 HERO BLOCK (160px)
 [ PIANIFICATO badge large] [ MEDIA] [PROGRAMMATO]
 Manutenzione pianificata — Pulsante allarme PL1 066
 Pulsante allarme PL1 066 · Rivelazione incendi · Corridoio 2

 TIMELINE BLOCK (128px)
 Timeline Intervento [Sospendi][Avanza ]
 `

 TAB BAR (44px)
 [Dettagli][Tecnico & Costi][Date][Allegati 0][Ticket collegato 1]

 TAB CONTENT (scrollabile, padding 20px 24px)

 — Tab "Dettagli" (default) —
  INTERVENTO
  Tipo Programmato
  Priorità Media
  Stato Pianificato
  Descrizione Manutenzione pianificata — Pulsante allarme

  ASSET COLLEGATO
  [icon] Pulsante allarme PL1 066
  Rivelazione incendi · Corridoio 2 · DET-PL1-066
  Stato asset:  IN REGOLA [Apri scheda asset ]

 FOOTER (72px)
 [Saving indicator] [Chiudi] [Avanza a Assegnato ]

Header drawer (72px)
 Padding 16px 24px.
 Border-bottom 1px #E5E4DF.
 Layout: icon container 32×32 (categoria asset color) + content + actions right.
 Content:
 Label "Dettaglio Work Order" 11px / 600 UPPERCASE muted.
 Codice + meta: "WO-26016 · creato 2 mag" (14px / 600 / text-primary).
 Actions: overflow MoreHorizontal + Modifica Pencil + Close X (32×32 ghost).
Hero block (160px)
 Padding 20px 24px.
 Bg #FAFAF9, border-bottom 1px #E5E4DF.
 Layout verticale, gap 8px:
 Riga 1: 3 badge inline (gap 6px): Stato large + Priorità + Tipo.
 Riga 2: titolo intervento Section Title (16px / 700 / text-primary).
 Riga 3: meta asset (13px / 500 / text-secondary). Es. "Pulsante allarme PL1 066 · Rivelazione incendi · Corridoio 2".
Timeline block (128px)
 Padding 16px 24px.
 Border-bottom 1px #E5E4DF.
 Bg #FFFFFF.
 Vedi §4 Timeline Stato per anatomia interna.
Tab bar (44px)
 Padding 0 24px.
 Border-bottom 1px #E5E4DF.
 Tabs underline come Fase 4 (Asset).
 Tabs:
 Dettagli (default).
 Tecnico & Costi.
 Date.
 Allegati (count badge inline, es. "Allegati 2").
 Ticket collegato (count badge inline, mostrato solo se >0).
Tab content "Dettagli"
Sezione "INTERVENTO" (label UPPERCASE 11/700):
 Field row: Tipo, Priorità, Stato, Descrizione.
 Pattern: label sx 40% + valore dx 60% allineato right (stesso pattern Fase 4).
 "Descrizione" è full-width sotto le altre se lunga: label sopra, valore in box bianco con padding.
Sezione "ASSET COLLEGATO":
 Card embedded #FFFFFF border #E5E4DF radius 8px padding 16px.
 Layout: icon container 32×32 + content + link.
 Content:
 Riga 1: nome asset 14px / 600 + status dot (es.  IN REGOLA inline).
 Riga 2: meta categoria · ubicazione · seriale 12px / 500 muted.
 Link "Apri scheda asset " (13px / 600 / #1A7A3C) right o footer card.
Sezione "TICKET ORIGINE" (condizionale, se WO nato da ticket):
 Card embedded simile.
 "Ticket TKT-2026-042 · Anomalia segnalata da [Utente] il [data]".
 Link "Apri ticket ".
Tab content "Tecnico & Costi"
Sezione "TECNICO ASSEGNATO":
 Card embedded.
 Avatar 40px + content:
 Nome 14px / 600.
 Ruolo 12px / 500 muted (es. "Tecnico interno" o "Esterno").
 Contatto 12px / 500: email + telefono.
 Link "Riassegna" (13px / 600 muted) o "Assegna" se vuoto.
Sezione "FORNITORE" (condizionale):
 Card embedded.
 Logo/icona 32px + nome fornitore + contatto referente + link scheda fornitore.
Sezione "COSTI":
 Field row pattern:
 Costo previsto: ¬ (formato italiano "1.250,00 ¬").
 Costo effettivo: ¬ (compilabile a chiusura).
 Materiali utilizzati: campo testuale o lista.
 Ore lavorative: numero (HH:mm).
Sezione "RAPPORTINO INTERVENTO":
 Toggle "Rapportino consegnato" (switch HeroUI).
 Quando attivo: file uploader + lista allegati.
Tab content "Date"
Field rows:
 Data creazione (read-only, automatica).
 Data pianificata (date picker).
 Data concordata con il fornitore (date picker, opzionale).
 Data inizio effettivo (timestamp, popolato all'avvio).
 Data esecuzione effettiva (date picker, required per chiudere il WO — helper text spiega).
 Data chiusura (read-only, automatica al CLOSED).
 Data validazione (read-only).
Helper inline sotto "Data esecuzione effettiva":
 12px / 500 / text-secondary: "Obbligatoria per chiudere il WO. La prossima scadenza dell'asset sarà calcolata da questa data."
Indicatore ritardo (se data pianificata < oggi e WO aperto):
 Banner inline sopra le date: bg #FFF0EE, border-left 3px #E24B4A, padding 10px 12px, radius 6px.
 Icon Clock 14px #A83228 + text 13px / 600 / #A83228: "WO in ritardo di [N] giorni rispetto alla data pianificata."
Tab content "Allegati"
 Drag & drop area top: bordered dashed #D3D1C7, padding 32px, bg #FAFAF9.
 Icon UploadCloud 32px text-muted centrato.
 Text "Trascina qui i file o [seleziona dal computer]" (14px / 500).
 Subtext "Formati accettati: PDF, JPG, PNG · Max 10MB per file" (12px / 500 / muted).
 Lista file caricati:
 Item: icon tipo 24px + content (nome + size + data upload) + actions (download, elimina).
 Padding 12px 16px, border-bottom #F1EFE8.
Tab content "Ticket collegato"
 Mostra ticket di origine in card embedded (se presente).
 Pattern simile a "Asset collegato" in tab Dettagli.
Footer drawer (72px)
 Padding 16px 24px.
 Border-top 1px #E5E4DF.
 Bg #FAFAF9.
 Layout: saving indicator left + actions right.
 Actions:
 Button secondary md "Chiudi".
 Button primary md "Avanza a [next state] " (icon ArrowRight trailing).
 Se stato finale (VALIDATED/ABANDONED): solo "Chiudi" (no avanzamento possibile).
Comportamento UX
 Apertura: click riga tabella o card  drawer slide-in.
 Tab default: Dettagli.
 URL deep-link: /work-orders/[id].
 Avanzamento stato dal footer o dal stepper inline (timeline).
 Modifica completa via icon Pencil header  apre Modal modifica (vedi §6).
 Esc / X / backdrop chiude drawer.
Componenti HeroUI
 Drawer placement="right".
 Tabs underlined.
 Cards embedded interne Card no shadow.
 Avatar per tecnico/utente.
 Button per actions.
 Switch per rapportino consegnato.
 File uploader: layout custom (no FileUpload HeroUI nativo, usare lib esterna o build).
Microcopy
 Header label: "Dettaglio Work Order".
 Codice + creato: "WO-[N] · creato [data]".
 Tab labels: "Dettagli", "Tecnico & Costi", "Date", "Allegati ([N])", "Ticket collegato ([N])".
 Section labels: "INTERVENTO", "ASSET COLLEGATO", "TICKET ORIGINE", "TECNICO ASSEGNATO", "FORNITORE", "COSTI", "RAPPORTINO INTERVENTO".
 Field labels: "Tipo", "Priorità", "Stato", "Descrizione", "Asset", "Ticket origine", "Tecnico", "Fornitore", "Costo previsto", "Costo effettivo", "Materiali", "Ore lavorative", "Data creazione", "Data pianificata", "Data concordata", "Data inizio effettivo", "Data esecuzione effettiva", "Data chiusura", "Data validazione".
 Footer button: "Chiudi" / "Avanza a [Pianificato/Assegnato/In Corso/Chiuso/Validato]".
Errori da evitare
  Drawer 560px troppo stretto per WO complessi: 720px è più adeguato.
  Modal centrato come nello screenshot attuale: drawer più appropriato per consultazione + avanzamento.
  Mancanza di hero block visibile con stato/priorità/tipo: tre badge devono essere immediatamente visibili.
  Timeline nascosta in tab: deve essere always-on subito sotto hero.
  Footer senza primary action contestuale a stato: l'utente non sa cosa fare dopo aver letto.
  Tab "Allegati" senza count: meno scoperta.
  Banner ritardo decorativo o nascosto: deve essere prominente quando rilevante.

6. Modal Crea / Modifica Work Order
Stesso modal pattern di Asset (Fase 4), differente contenuto.
Layout
 Modal centrato 720px width (più ampio di Asset 640px).
 Max-height 88vh, scroll interno.
 Bg #FFFFFF, border #E5E4DF, radius 12px, shadow-lg.
Header (64px)
 Title: "Nuovo Ordine di Lavoro" / "Modifica Ordine di Lavoro".
 Subtitle: "Compila i campi per pianificare l'intervento" / "Aggiorna i dati dell'ordine di lavoro".
 Close X.
Body (padding 24px, scroll interno)
Solo per "Modifica": Timeline integrata in alto (vedi §4)
Block timeline 128px alto con stepper + actions, identico a quello del drawer.
Sezione "INTERVENTO"
 Asset (full-width): Search Select con preview.
 Trigger: input con icon search trailing.
 Selected state: card embedded mostra:
 Icon 24px categoria + nome 14/600 + meta seriale, ubicazione 12/500 muted.
 X right per rimuovere selezione.
 Search dropdown: ricerca asset per nome/codice/seriale.
 Required.
 Tipo (col 4 di 12): Select dropdown (Programmato / Correttivo / Extra). Required. Default "Programmato".
 Priorità (col 4): Select con dot colorato leading per ogni opzione. Required. Default "Media".
 Stato (col 4): Select. Solo in modifica (in creazione default "Pianificato"). Mostra solo gli stati raggiungibili dallo stato attuale.
 Descrizione (full-width): Textarea, min-height 96px. Required. Placeholder "Descrivi l'intervento da svolgere o la richiesta del ticket".
Sezione "DATE"
 Data pianificata (col 6): Date picker. Required.
 Data concordata con il fornitore (col 6): Date picker. Opzionale. Helper text 12/500 muted: "La data in cui hai fissato l'intervento".
 Data esecuzione effettiva (col 6): Date picker. Visibile solo in modifica. Helper text: "Obbligatoria per chiudere il WO · la prossima scadenza sarà calcolata da questa data".
Sezione "TECNICO, FORNITORE E COSTI"
 Tecnico (col 6): Select con search. Opzione speciale "Nessuno" o "Non assegnato" in cima. Mostra avatar + nome + ruolo nelle option.
 Fornitore (col 6): Select con search. Opzione "Nessuno" in cima.
 Costo previsto (¬) (col 6): Number input con formato italiano (1.250,00). Step 0.01.
 Costo effettivo (¬) (col 6): Number input. Visibile solo in modifica.
Sezione "RAPPORTINO E ALLEGATI"
 Toggle "Rapportino di intervento consegnato" (switch + label).
 File uploader area + lista file (vedi §5 tab Allegati per pattern).
Sezione "TICKET COLLEGATO" (condizionale, solo modifica o se nato da ticket)
 Card embedded con dettagli ticket origine.
 Link "Cambia ticket collegato" o "Rimuovi collegamento".
Footer (72px)
 Padding 16px 24px, border-top #E5E4DF, bg #FAFAF9.
 Helper left: "I campi con * sono obbligatori".
 Actions right (gap 8px):
 Button secondary md "Annulla".
 Button primary md "Crea WO" / "Salva modifiche" (icon Save/Check opzionale leading).
Validazione
 Asset: required.
 Tipo, Priorità: required.
 Descrizione: min 10 char, required.
 Data pianificata: required,  oggi (eccetto modifica con data passata già esistente).
 Data esecuzione effettiva: required SOLO per stato CLOSED.
 Costo effettivo: required SOLO per stato CLOSED se policy lo richiede.
 Tecnico OR Fornitore: almeno uno per passare a ASSIGNED.
Stati avanzamento dal modal (modifica)
 Click "Salva modifiche"  salva campi senza cambiare stato.
 Click su step timeline  cambio stato + salva.
 Click "Avanza a [next] " footer  cambio stato + salva (se applicabile).
Stato saving / errore
Stesso pattern Asset Fase 4 (toast + banner inline + button stato saving).
Microcopy
 Title creazione: "Nuovo Ordine di Lavoro".
 Title modifica: "Modifica Ordine di Lavoro".
 Subtitle creazione: "Compila i campi per pianificare l'intervento".
 Subtitle modifica: "Aggiorna i dati dell'ordine di lavoro".
 Sections: "INTERVENTO", "DATE", "TECNICO, FORNITORE E COSTI", "RAPPORTINO E ALLEGATI", "TICKET COLLEGATO".
 Helper data esecuzione: "Obbligatoria per chiudere il WO · la prossima scadenza sarà calcolata da questa data".
 Helper data concordata: "La data in cui hai fissato l'intervento".
 Helper required: "I campi con * sono obbligatori".
 Toggle: "Rapportino di intervento consegnato".
 Empty allegati: "Nessun file allegato · formati accettati: PDF, JPG, PNG".
 CTA: "Annulla" / "Crea WO" / "Salva modifiche".
Errori da evitare
  Bottoni primary blu (screenshot attuale): verde brand #2ECC71.
  Modal sproporzionato (640 troppo stretto, 900+ troppo largo): 720px è il sweet spot.
  Asset come campo libero: deve essere search-select strutturato.
  Tipo/Priorità/Stato come radio inline: dropdown è più scalabile.
  Mancanza helper text sulla "Data esecuzione effettiva": utente non sa che è critica.
  Stati selezionabili tutti senza vincoli: solo gli stati raggiungibili dovrebbero essere mostrati.
  Sezione "TIMELINE" nel modal di creazione: timeline ha senso solo in modifica.

7. Badge Status / Priority / Type
Status badges (8 stati)
Anatomia: padding 4px 8px, radius 6px, font 11px / 600 / 0.04em / UPPERCASE, dot 6px leading.

	Stato	bg	text	dot	Note
	NEW " NUOVO"	#F1EFE8	#5F5E5A	#888780	Neutro
	PLANNED " PIANIFICATO"	#FFF3E8	#A8531A	#E8782A	Warning tenue
	ASSIGNED " ASSEGNATO"	#1C1B18	#FAFAF9	#2ECC71	Info dark
	IN_PROGRESS " IN CORSO"	#FFF3E8	#A8531A	#E8782A (animato pulse)	Warning + animation
	SUSPENDED " SOSPESO"	#FFF0EE	#A83228	#E24B4A	Error
	CLOSED " CHIUSO"	#EAFBF1	#1A7A3C	#2ECC71	Success
	VALIDATED " VALIDATO"	#0A3D1F	#FAFAF9	#2ECC71	Success deep solid
	ABANDONED " ABBANDONATO"	#F1EFE8	#888780	#888780	Neutro disabled (italic opzionale o strikethrough)
	Animazione "IN_PROGRESS":

 Dot pulse: scale 1  1.3  1, opacity 1  0.6  1, durata 1.5s ease-in-out infinite.
 Solo nel badge IN_PROGRESS, sottile.
Priority badges (4 livelli)

	Priorità	bg	text	dot	Note
	LOW " BASSA"	#F1EFE8	#5F5E5A	#888780	Neutro
	MEDIUM " MEDIA"	#FFF3E8	#A8531A	#E8782A	Warning
	HIGH " ALTA"	#FFF0EE	#A83228	#E24B4A	Error
	CRITICAL " CRITICA"	#A83228 (solid)	#FFFFFF	#FFFFFF	Solid intense
	Type badges (3 tipi)
Tipo	bg	text	dot	Note
	PROGRAMMED "PROGRAMMATO"	#F1EFE8	#5F5E5A	nessuno	Neutro flat
	CORRECTIVE "CORRETTIVO"	#FFF3E8	#A8531A	nessuno	Warning flat
	EXTRA "EXTRA"	#1C1B18	#FAFAF9	nessuno	Info dark flat
	I type badges non hanno dot: distinguibili da status/priority per assenza dot, mantenimento UPPERCASE label, stesso pattern padding.
Variants di dimensione
Size sm (default tabella, card):

 Padding 4px 8px, font 11px / 600 / 0.04em.
Size md (drawer hero, modal timeline):
 Padding 6px 12px, font 12px / 700 / 0.06em.
Size solid critical (priority CRITICA):
 Stesso padding md, ma bg #A83228 text #FFFFFF weight 700.
Errori da evitare
  Stati uguali a Asset (Asset SCADUTO usa stesso pattern di WO SUSPENDED): coerenza globale del sistema, ma WO SUSPENDED dovrebbe essere distinguibile per contesto. Soluzione: contesto della tabella (header colonna "STATO" + categoria pagina) elimina ambiguità.
  Animazione pulse su tutti i badge: solo IN_PROGRESS (azione viva).
  Type badge con dot: creerebbe confusione con priority.
  Priority CRITICA come outline: deve essere solid per max visibilità.
  Mancanza di tooltip sui badge: tooltip deve mostrare info aggiuntiva (data ultimo cambio stato, motivo sospensione, etc.).

8. Empty / Loading / Error States
Loading
Loading totale pagina:
 Subheader skeleton.
 Status tabs skeleton (5 chip skeleton).
 Toolbar skeleton (search + 6 chip skeleton + counter skeleton).
 Tabella skeleton: header reale + 8 skeleton row 64px.
Loading parziale (filtro/ricerca):
 Tabella overlay opacity 0.5 + spinner 24px centrato.
Loading drawer:
 Drawer header skeleton + hero skeleton + timeline skeleton stepper + tab content skeleton.
Loading modal save:
 Button con spinner + "Salvataggio..." (vedi pattern Fase 4).
Empty
Empty totale (nessun WO):
 Container centrato in content area, padding 96px verticale.
 Icon Wrench 40px in cerchio #F1EFE8 64×64.
 Title: "Nessun work order ancora" (16px / 700).
 Description: "Crea il primo intervento per iniziare a tracciare la manutenzione dei tuoi asset. Puoi crearlo manualmente o convertendolo da un ticket esistente." (14px / 400 / text-secondary, max-w 480px center).
 CTA primary: "Crea Work Order" (icon Plus leading).
 Link secondario: "Visualizza ticket aperti" (link #1A7A3C).
Empty status tab:
 Es. "In corso" tab senza WO IN_PROGRESS:
 Icon Coffee 32px in cerchio #F1EFE8 56×56 (variante semantica: nessun lavoro attivo = pausa).
 Title: "Nessun work order in corso".
 Description: "Tutto sotto controllo! Quando un tecnico avvia un intervento apparirà qui."
Empty filtri:
 Pattern coerente con Fase 4 Asset.
 Title "Nessun work order trovato".
 Description "I filtri attivi non hanno restituito risultati."
 CTA secondary "Reset filtri".
Empty allegati nel drawer:
 Solo padding 24px verticale dentro tab Allegati.
 Icon Paperclip 24px muted.
 Text "Nessun allegato. Trascina qui i file o seleziona dal computer." (13px / 500 / text-secondary).
Error
Error totale:
 Pattern Fase 4.
 Title "Impossibile caricare i work orders".
 Description "C'è stato un problema di connessione. Riprova o contatta il supporto."
 CTA "Riprova" + link "Contatta supporto".
Error avanzamento stato:
 Toast top-right: "Impossibile avanzare lo stato. [motivo]." con link "Riprova".
 Esempi motivi:
 "Compila la data di esecuzione effettiva per chiudere il WO."
 "Assegna un tecnico o un fornitore per passare a Assegnato."
 "Errore di connessione."
Error save:
 Banner inline footer modal/drawer (pattern Fase 4).
Error transient:
 Toast top-right standard.
Saving
 Footer drawer: indicator inline (Fase 2 §14).
 Modal submit: button con spinner.
 Bulk action: progress modal con percentuale.
 Avanzamento stato singolo: micro-feedback inline sullo step (spinner sostituisce numero per 200ms, poi check).

9. Componenti HeroUI Consigliati

	Elemento	HeroUI
	Page wrapper	<main>
	Subheader / breadcrumb	layout custom + Breadcrumbs
	View toggle (table/card)	Tabs o RadioGroup con custom render (segmented style)
	Status tabs bar	Tabs HeroUI variant="solid" custom dark
	Status tab count chip	Chip HeroUI sm
	Toolbar	Card
	Search input	Input con icon
	Filter dropdowns	Dropdown + DropdownMenu
	Filter chip trigger	Button secondary sm
	Active filter chips	Chip solid dark
	Tabella	Table HeroUI
	Card view (alternativa)	Card HeroUI con border-left custom
	Status/Priority/Type badges	Chip HeroUI custom colors
	Avatar tecnico	Avatar
	Action icon buttons	Button ghost icon
	Action overflow	Dropdown
	Pagination	Pagination
	Page size select	Select sm
	Bulk actions bar	layout custom
	Drawer	Drawer placement="right" width 720
	Drawer tabs	Tabs underlined
	Timeline stepper	layout custom (no Stepper HeroUI nativo affidabile, costruirlo con <div> + flex)
	Modal	Modal
	Form fields	Input, Select, Textarea, DatePicker, Switch
	Asset selector	Autocomplete HeroUI o Select con search
	Tecnico/Fornitore selector	Autocomplete
	File uploader	layout custom (lib esterna come react-dropzone)
	Confirm action modal	Modal piccolo
	Toast	sonner esistente
	Skeleton	Skeleton
	Tooltip	Tooltip

10. Microcopy
Subheader

 Title: "Work Orders".
 Subtitle pattern: "[Tot] ordini · [N in corso] in corso · [N pianificati] pianificati · [N chiusi] chiusi questa settimana".
 Page actions: "Esporta" / view toggle "Tabella" "Card" / "+ Nuovo WO".
Status tabs
 "Tutti", "Da fare", "In corso", "Chiusi", "Validati", "Abbandonati".
Toolbar filtri
 Search: "Cerca intervento, codice, asset&"
 Filtri: "Stato", "Priorità", "Tipo", "Tecnico", "Asset", "Periodo", "+ Filtri avanzati", "Reset".
 Tecnico opzione speciale: "Non assegnato".
 Counter: "[Range] di [Tot]".
Tabella header
 "CODICE", "INTERVENTO", "TIPO", "PRIORITÀ", "STATO", "ASSEGNATO", "DATA", "AZIONI".
 Empty assegnatario inline: "Non assegnato".
Card view
 Header: codice WO WO-26016.
 Footer actions contestuali:
 "Prendi in carico" (PLANNED  ASSIGNED se utente è tecnico).
 "Avvia" (ASSIGNED  IN_PROGRESS).
 "Completa" (IN_PROGRESS  CLOSED).
 "Riprendi" (SUSPENDED  previous).
 "Valida" (CLOSED  VALIDATED).
 "Riapri" (CLOSED  previous).
 "Sospendi", "Annulla", "Apri scheda".
Bulk actions
 "[N] selezionati".
 Actions: "Assegna a tecnico", "Cambia stato", "Cambia priorità", "Esporta selezionati", "Elimina".
Timeline
 Title: "Timeline Intervento".
 Subtitle: "Clicca uno stato per aggiornare rapidamente il WO."
 Steps: "Nuovo", "Pianificato", "Assegnato", "In Corso", "Chiuso", "Validato".
 Quick actions: "Sospendi", "Abbandona", "Avanza a [next state]", "Riprendi", "Riapri", "Valida".
 Tooltip step completato: "Completato il [data] da [utente]".
 Tooltip step attivo: "Stato attuale".
 Tooltip step disponibile: "Avanza a [stato]".
 Tooltip step bloccato: "Completa prima [step intermedio]".
Drawer
 Header label: "Dettaglio Work Order".
 Header meta: "WO-[N] · creato [data]".
 Tab labels: "Dettagli", "Tecnico & Costi", "Date", "Allegati ([N])", "Ticket collegato ([N])".
 Section labels: "INTERVENTO", "ASSET COLLEGATO", "TICKET ORIGINE", "TECNICO ASSEGNATO", "FORNITORE", "COSTI", "RAPPORTINO INTERVENTO".
 Banner ritardo: "WO in ritardo di [N] giorni rispetto alla data pianificata."
 Banner sospeso: "WO sospeso il [data] da [utente]. Motivo: [testo]. [Riprendi]".
 Banner abbandonato: "WO abbandonato il [data]. Motivo: [testo]."
 Footer button: "Chiudi" / "Avanza a [stato] ".
 Asset link: "Apri scheda asset ".
 Ticket link: "Apri ticket ".
Modal crea/modifica
 Title nuovo: "Nuovo Ordine di Lavoro".
 Title modifica: "Modifica Ordine di Lavoro".
 Subtitle nuovo: "Compila i campi per pianificare l'intervento".
 Subtitle modifica: "Aggiorna i dati dell'ordine di lavoro".
 Sections: "INTERVENTO", "DATE", "TECNICO, FORNITORE E COSTI", "RAPPORTINO E ALLEGATI", "TICKET COLLEGATO".
 Field "Asset" placeholder: "Cerca un asset...".
 Field "Tecnico" placeholder: "Seleziona un tecnico...".
 Field "Tecnico" empty option: "Nessuno".
 Field "Fornitore" placeholder: "Seleziona un fornitore...".
 Field "Descrizione" placeholder: "Descrivi l'intervento da svolgere o la richiesta del ticket".
 Helper data esecuzione: "Obbligatoria per chiudere il WO · la prossima scadenza sarà calcolata da questa data".
 Helper data concordata: "La data in cui hai fissato l'intervento".
 Helper required: "I campi con * sono obbligatori".
 Toggle rapportino: "Rapportino di intervento consegnato".
 Empty allegati: "Nessun file allegato · formati accettati: PDF, JPG, PNG".
 Drag & drop: "Trascina qui i file o [seleziona dal computer]".
 File subtext: "Formati accettati: PDF, JPG, PNG · Max 10MB per file".
 CTA: "Annulla" / "Crea WO" / "Salva modifiche".
Toast
 Success crea: "Work order creato".
 Success modifica: "Work order aggiornato".
 Success avanzamento: "WO avanzato a [stato]".
 Success chiusura: "WO chiuso · scadenza asset aggiornata".
 Success validazione: "WO validato e archiviato".
 Success sospensione: "WO sospeso".
 Success bulk: "[N] WO aggiornati".
 Error: "Errore salvataggio. Riprova."
Conferma destructive
 Sospendi: "Sospendere il WO?" / "Il lavoro sarà bloccato finché non lo riprendi. Motivo (opzionale): [textarea]". CTA: "Annulla" / "Sospendi".
 Abbandona: "Abbandonare il WO?" / "Questa azione non è reversibile. Il WO sarà archiviato come abbandonato. Motivo: [textarea required]." CTA: "Annulla" / "Abbandona".
 Elimina (solo NEW non chiusi): "Eliminare il WO [codice]?" / "L'azione è permanente." CTA: "Annulla" / "Elimina WO".
Empty / Error
 Empty totale title: "Nessun work order ancora".
 Empty totale desc: "Crea il primo intervento per iniziare a tracciare la manutenzione."
 Empty status "In corso": "Nessun work order in corso" / "Tutto sotto controllo! Quando un tecnico avvia un intervento apparirà qui."
 Empty filtri: "Nessun work order trovato" / "I filtri attivi non hanno restituito risultati."
 Error totale: "Impossibile caricare i work orders" / "Riprova o contatta il supporto."

11. Descrizione Visiva Dettagliata
L'utente entra nella pagina Work Orders e percepisce subito una gerarchia operativa più densa rispetto a Asset. Il subheader presenta "Work Orders" in 24/700 con un sottotitolo che sintetizza lo stato del sistema in una riga ("16 ordini · 3 in corso · 8 pianificati · 4 chiusi questa settimana") — l'utente ha un pulse check immediato. Sulla destra, oltre alle azioni standard ("Esporta", "+ Nuovo WO"), un segmented control permette di switchare tra Tabella (default, density operativa) e Card (vista visiva, più adatta a smartphone o per chi gestisce pochi WO).
Sotto il subheader, una tab bar dark raggruppa gli stati in 5 segmenti aggregati: "Tutti / Da fare / In corso / Chiusi / Validati", ognuno con un count chip inline. Il tab attivo ha bg nero #1C1B18 con text bianco, gli altri sono grigio neutro su sfondo trasparente. È un filtro veloce di livello superiore che precede la toolbar di ricerca.
La toolbar filtri sotto è coerente con quella di Asset (Fase 4): search input bianca con icon search, una serie di filter chips (Stato, Priorità, Tipo, Tecnico, Asset, Periodo, Filtri avanzati, Reset), counter a destra. Quando un filtro è attivo, il chip diventa verde (bg #EAFBF1, border #2ECC71, text #0A3D1F) e la riga 2 mostra i chip dark scuri rimovibili.
La tabella è il centro della pagina. Card bianca, border avorio, radius 10. Header #FAFAF9 con label UPPERCASE 11/700. Righe 64px (la cella INTERVENTO ha titolo + meta su due righe). Le colonne raccontano il WO in una sola riga: codice WO-26016 in tabular-nums, intervento titolato + meta asset, badge type ("PROGRAMMATO" neutro / "CORRETTIVO" arancione / "EXTRA" dark), badge priority ("BASSA" / "MEDIA" / "ALTA" / "CRITICA" — quest'ultima in solid dark red #A83228 per maximum visibility), badge status (8 stati distinti con dot leading), assegnatario con avatar 24px o "Non assegnato" con cerchio dashed, data con relativo sotto.
Le azioni a destra sono 3 ghost icon button: occhio, azione contestuale (play/check/edit a seconda dello stato), kebab overflow. L'azione contestuale è un piccolo trick UX: invece di mostrare sempre lo stesso "edit", mostra la prossima azione probabile per quel WO ("Prendi in carico" se PLANNED, "Completa" se IN_PROGRESS), riducendo il path di click.
Per cambio vista a Card, la griglia 3 colonne mostra card 360px width con border-left 3px colore priorità — istantaneamente visibile la criticità anche senza badge. Header card mostra codice + priority. Body con titolo + meta + assegnatario. Footer card con 3 azioni rapide button sm (es. "Avvia" primary verde, "Chiudi", "Sospendi"). Il blu del bottone "Avvia" dello screenshot attuale diventa verde brand #2ECC71 — il blu è completamente bandito dal prodotto.
Click su una riga (o card) apre un drawer destro 720px (più ampio di Asset perché il contenuto è più articolato). Il drawer ha 4 blocchi visibili sopra il fold:
1 Header con icon categoria asset + codice WO + meta creazione + actions.
2 Hero block bg #FAFAF9 con 3 badge inline (Stato + Priorità + Tipo) + titolo intervento + meta asset.
3 Timeline block con stepper orizzontale 6-step (Nuovo  Pianificato  Assegnato  In Corso  Chiuso  Validato): cerchi 28px, completati con bg verde + check, attivo con border verde 2px + ring rgba esterno, pendenti grigi. I connettori tra step si colorano verdi man mano che si avanza. Click su uno step pendente avanza il WO (con eventuale modal di conferma se servono dati). Sopra a destra dello stepper ci sono 2-3 quick action contestuali: "Sospendi" / "Abbandona" / "Avanza a [next] ".
4 Tab bar underline: Dettagli / Tecnico & Costi / Date / Allegati (count) / Ticket collegato (condizionale).
Le tab content seguono il pattern Asset: section label UPPERCASE muted, field rows con label sx + valore dx, card embedded per relazioni (asset collegato, tecnico, fornitore, ticket). La tab "Date" è critica: include un banner inline rosso #FFF0EE con icon Clock se il WO è in ritardo. La tab "Allegati" ha drag & drop dashed area + lista file con icon + size + actions.
Il footer drawer mostra saving indicator a sinistra e 2 azioni a destra: "Chiudi" secondary + "Avanza a [stato] " primary verde (l'azione di avanzamento è quasi sempre la primary contestuale del workflow).
Click su "Modifica" apre un modal 720px con timeline integrata in alto + sezioni form ("INTERVENTO", "DATE", "TECNICO, FORNITORE E COSTI", "RAPPORTINO E ALLEGATI", "TICKET COLLEGATO"). Il selettore Asset è un autocomplete con preview embedded della scheda asset — appena selezionato, una card mini mostra icon + nome + meta. Il selettore Tecnico mostra opzione "Nessuno" in cima separata da divider, poi la lista con avatar + nome + ruolo. La data esecuzione effettiva ha helper text esplicativo: "Obbligatoria per chiudere il WO · la prossima scadenza sarà calcolata da questa data."
Nel modal di Modifica, lo stepper della timeline sopra le sezioni form permette doppia modalità di avanzamento: o si compila tutto + click "Salva" (che mantiene lo stato), o si clicca direttamente uno step della timeline (che salva + avanza). Questa dualità è critica per la velocità operativa di un facility manager.
Stati eccezionali (Sospeso, Abbandonato) NON sono nello stepper lineare: appaiono come banner inline + badge overlay sopra lo stepper, mantenendo coerente la rappresentazione del workflow primario. Quando un WO è SUSPENDED, lo stepper mostra l'ultimo stato completato + ring giallo + banner "WO sospeso il [data] da [utente]. Motivo: [testo]. [Riprendi]".
Tutto il sistema rispetta la grammatica visiva dell'app: bianco su carta, border come gerarchia, verde solo dove decide, status colors come segnali e mai come decorazione, tabular-nums per cifre comparabili, densità calibrata (riga 64, padding 24, gap 16-20). La pagina Work Orders è il centro operativo del prodotto — la più frequentata, la più tornita, e progettata per gestire 16 WO con la stessa naturalezza con cui ne gestirebbe 200.

12. Tabella sintetica "elemento  componente HeroUI"

	Elemento	Componente
	Page wrapper	<main>
	Breadcrumbs	Breadcrumbs
	Page title	<h1> 24/700
	View toggle (table/card)	layout custom segmented (Tabs o RadioGroup)
	Status tabs bar	Tabs HeroUI variant solid custom
	Toolbar	Card
	Search input	Input con icon
	Filter chip trigger	Button secondary sm + Dropdown
	Active filter chip	Chip solid dark
	Tabella	Table HeroUI
	Card grid (alt view)	<div> grid + Card HeroUI
	Card border-left priority	inline style borderLeft: 3px solid
	Status badge	Chip HeroUI custom
	Priority badge	Chip HeroUI custom (CRITICA solid)
	Type badge	Chip HeroUI custom no-dot
	Avatar tecnico	Avatar
	Action icon buttons	Button ghost icon
	Action overflow	Dropdown
	Pagination	Pagination
	Bulk actions bar	layout custom
	Drawer	Drawer placement="right" width 720px
	Drawer header	layout custom
	Drawer hero	<div> con bg #FAFAF9
	Timeline stepper	layout custom (flex + circles + connectors)
	Timeline quick actions	Button (primary sm + ghost destructive sm)
	Drawer tabs	Tabs variant="underlined"
	Field row	layout custom
	Card embedded (asset/ticket/tecnico)	Card HeroUI
	Modal	Modal 720px
	Form fields	Input, Textarea, Select, DatePicker, Switch
	Asset autocomplete	Autocomplete HeroUI
	Tecnico/Fornitore	Autocomplete
	File uploader	layout custom + react-dropzone
	Banner ritardo/sospeso	<div> custom con bg + border-left
	Confirm modal	Modal piccolo
	Toast	sonner esistente
	Skeleton	Skeleton
	Tooltip	Tooltip

13. Errori Visivi da Evitare

1  Bottoni primary blu in card view e modal (screenshot attuale): tutto deve essere verde brand #2ECC71. Il blu è bandito.
2  "Sospendi" come link rosso nudo senza contenitore: deve essere ghost destructive button visivamente distinguibile.
3  Card view senza border-left priorità: la priorità è il dato chiave per scansionare 16+ WO, deve essere visibile a colpo d'occhio.
4  Modal centrato per dettaglio: drawer destro 720px è più appropriato per workflow consultativo + avanzamento iterativo.
5  Timeline come tab nascosta: deve essere always-on subito sotto hero block.
6  Stati eccezionali Sospeso/Abbandonato come step nello stepper lineare: rompe la sequenza canonica. Trattarli come overlay + banner.
7  Stepper con tutti gli step cliccabili senza vincoli: solo gli step adiacenti raggiungibili devono essere actionable, gli altri tooltip "Completa prima [step intermedio]".
8  Data colonna senza formato relativo "X gg fa": utenti operativi pensano in tempo relativo, non assoluto.
9  Riga in ritardo senza segnale visivo: la data colorata #A83228 + label "X gg di ritardo" è critica.
10  Assegnatario "Non assegnato" come testo grigio piatto: deve avere un cerchio dashed visivamente distinto, è uno stato actionable (manca il tecnico).
11  Priority CRITICA come outline o variant tenue: deve essere solid dark red #A83228 con text bianco — emergenza.
12  Type badge con dot leading: confuso con priority/status. Type è flat senza dot.
13  Animazione pulse su tutti i badge: solo IN_PROGRESS dot ha pulse animation (azione viva).
14  Header tabella senza sort indicator: utenti vogliono sort by priority, by date, by status.
15  Default sort alfabetico per CODICE: default sort utile è Priority desc + Data pianificata asc (urgenze in cima).
16  Checkbox bulk e bulk action bar mancanti: gestire 50+ WO senza bulk è impossibile.
17  Modal di creazione con timeline inutile: timeline ha senso solo in modifica.
18  Stati dropdown nel modal mostrano tutti gli 8 stati senza filtraggio: solo gli stati raggiungibili dallo stato attuale.
19  "Data esecuzione effettiva" senza helper text esplicativo: utenti non sanno che è il trigger del ricalcolo scadenza asset.
20  File uploader senza drag & drop area: workflow obsoleto. Drag & drop è lo standard.
21  Tab "Allegati 0" sempre visibile con count zero: ok mostrarla sempre per scoperta, ma il count "0" deve essere muted, non error.
22  Tab "Ticket collegato" sempre visibile: mostrare solo se almeno 1 ticket collegato (count > 0).
23  Quick actions timeline con label tecniche ("transition to ASSIGNED"): linguaggio operativo italiano ("Avanza a Assegnato").
24  Banner ritardo decorativo o nascosto in tab "Date": deve essere prominente, sempre visibile in hero o sotto timeline quando applicabile.
25  Card view footer con 5+ azioni inline: max 3 azioni rapide, il resto in overflow kebab.
26  Status tabs senza count: l'utente non sa quanti WO per categoria senza navigare.
27  Drawer footer senza primary action contestuale: l'avanzamento di stato è il primary action più frequente, deve essere sempre presente.
28  Mancanza di feedback su avanzamento step (click step  no visual feedback): step deve mostrare spinner per 200ms poi transizionare a completed.
29  Modal "Sospendi"/"Abbandona" senza textarea motivo: la motivazione è documentazione operativa, deve essere capturata.
30  Costo in formato "1250.00" decimale point: usare formato italiano "1.250,00 ¬" — è tool italiano per utenti italiani.
31  Asset autocomplete con preview solo testo dopo selezione: card embedded con icon categoria + meta è UX migliore (conferma visiva).
32  Filtro Tecnico "Non assegnato" sparso nella lista alfabetica: deve essere voce dedicata in cima separata da divider.
33  Mancanza tooltip sui badge status nei tabella: tooltip deve mostrare timestamp + utente che ha fatto l'ultimo cambio stato.
34  Icona azione "Edit" come Pencil su tutti gli stati: usare icona contestuale (Play per avviare, Check per chiudere, Clock per sospendere).
35  Badge VALIDATED come success normale: variant deep success #0A3D1F solid per distinguere da CLOSED.
