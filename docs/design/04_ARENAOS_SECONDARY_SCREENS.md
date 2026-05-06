# 04_ARENAOS_SECONDARY_SCREENS.md

Specifiche hi-fi sintetiche per le schermate rimanenti di ArenaOS.

Questo file raccoglie il Capitolo 6 del redesign e copre:
- Vehicles / Mezzi
- Schedule / Scadenzario
- Tickets Queue
- Rapportini
- Suppliers / Technicians
- Users Management
- Audit Log
- CDA Report
- Public Ticket Form
- Public Vehicle Booking Form
- Reset Password

Da usare insieme a:
- `01_ARENAOS_DESIGN_SYSTEM.md`
- `02_ARENAOS_APP_SHELL.md`
- `03_ARENAOS_CORE_SCREENS.md`

Vincoli generali:
- Non inventare nuove feature fuori dal perimetro ArenaOS.
- Non modificare route, ruoli, logica dati, Supabase o schema DB.
- Usare lo stesso design system: Inter, palette landing, sidebar dark, content warm light, componenti HeroUI-style.

---

1. Vehicles / Mezzi /vehicles
1. Obiettivo UX
Permettere al facility manager di gestire la flotta di mezzi (auto, furgoni, mezzi sportivi) controllando in un'unica vista: disponibilità giornaliera, scadenze documentali (assicurazione, revisione, bollo, tagliando), manutenzioni, prenotazioni esterne (sharing con giocatori, staff). L'utente deve poter passare da "stato del mezzo" a "calendario settimanale" a "richieste pendenti" con un solo click.
2. Layout principale
 Subheader: title "Mezzi", subtitle "[N] veicoli · [N] disponibili oggi · [N] prenotazioni attive · [N] richieste in attesa".
 Page actions: "Esporta", "+ Nuovo Mezzo" (primary).
 KPI Row (4 card): "Disponibili oggi", "Prenotazioni oggi", "Scadenze entro 30 gg", "Richieste sharing in attesa".
 View toggle segmented: "Lista" (default) / "Calendario settimanale".
 Toolbar filtri: search "Cerca mezzo, targa, modello&" + filter chips (Stato, Tipo assegnazione, Disponibilità, Scadenze).
 Layout dual: tabella centrale 70% + sidebar destra 30% (320px) con due card stack: "Scadenze prossime" + "Richieste sharing".
3. Sezioni
Tabella Veicoli (default view):
 Colonne: Foto+Nome (icon container 40×40 con immagine veicolo o Car fallback) | Targa (tabular-nums) | Tipo (Auto/Furgone/Mezzo sport) | Assegnazione (Staff/Giocatore/Sharing badge) | Stato (badge colorato) | Prossima scadenza (data + tipo + relativo) | Azioni.
 Riga 64px, click  drawer dettaglio.
Stati veicolo (badge):
 " DISPONIBILE" (success, verde).
 " IN USO" (info dark).
 " MANUTENZIONE" (warning arancio).
 " FUORI SERVIZIO" (error rosso).
Calendario settimanale (view alternativa):
 Grid 7 col (lun-dom) × N righe (1 per veicolo).
 Cell mostra prenotazioni come blocchi colorati con orario + nome utente.
 Click cell vuota: nuova prenotazione.
 Click blocco: dettaglio prenotazione.
Sidebar destra:
 Card "Scadenze prossime": lista scadenze ordinate per data, ognuna con icon tipo (assicurazione/revisione/bollo/tagliando), data + relativo, link "Programma intervento".
 Card "Richieste sharing": lista richieste pending con avatar utente + data richiesta + 2 button "Approva" (primary sm) / "Rifiuta" (destructive ghost sm).
Drawer dettaglio veicolo:
 Hero block con foto veicolo grande (16:9 aspect ratio) + targa + modello + stato badge.
 Tabs: "Anagrafica" / "Scadenze" / "Manutenzioni" / "Prenotazioni" / "Storico assegnazioni".
 Tab Anagrafica: marca, modello, anno immatricolazione, targa, telaio, alimentazione, Km attuali, foto.
 Tab Scadenze: lista 4 scadenze tipiche con date + giorni rimanenti + CTA "Aggiorna" / "Programma rinnovo".
 Tab Manutenzioni: lista manutenzioni storiche + CTA "Pianifica manutenzione"  crea WO.
 Tab Prenotazioni: lista bookings + filter periodo.
Modal Crea/Modifica Mezzo:
 Sezioni: "ANAGRAFICA" (marca, modello, anno), "IDENTIFICAZIONE" (targa, telaio), "TECNICHE" (alimentazione, Km, posti), "ASSEGNAZIONE" (tipo + utente), "FOTO" (uploader).
4. Componenti HeroUI
Tabs (toggle view), Card, Table, Chip (stati), Drawer, Modal, DatePicker, Avatar, Image, FileUploader custom.
5. Stati principali
 Loading: skeleton tabella + skeleton sidebar cards.
 Empty totale: icon Car 40px, "Nessun mezzo registrato", CTA "Aggiungi il primo mezzo".
 Empty richieste sharing: card con icon Inbox muted, "Nessuna richiesta in attesa".
 Empty scadenze: card con icon CalendarCheck #1A7A3C, "Nessuna scadenza nei prossimi 30 giorni".
 Error: pattern standard "Impossibile caricare i mezzi".
6. Microcopy
 Title: "Mezzi". Subtitle: "[N] veicoli · [N] disponibili · [N] richieste in attesa".
 Filtri: "Stato", "Tipo", "Assegnazione", "Disponibilità".
 Stati badge: " DISPONIBILE" / " IN USO" / " MANUTENZIONE" / " FUORI SERVIZIO".
 Sidebar cards: "Scadenze prossime", "Richieste sharing in attesa".
 Booking actions: "Approva" / "Rifiuta".
 Empty: "Nessun mezzo registrato" / "Aggiungi il primo mezzo per iniziare a gestire la flotta."
7. Note responsive
 Sotto 1280px: sidebar destra collassa sotto la tabella.
 Mobile: tabella diventa lista card stacked, sidebar diventa due tab "Scadenze" / "Richieste".
 Calendario settimanale: scroll orizzontale obbligato, sticky col veicolo.
8. Errori da evitare
  Tabella senza foto veicolo (riconoscimento visivo critico per la flotta).
  Stato "manutenzione" indistinguibile da "fuori servizio": colori e label diversi.
  Calendario senza nome utente nei blocchi prenotazione.
  Richieste sharing senza azione 1-click (Approva/Rifiuta).
  Scadenze documenti come solo data senza giorni rimanenti.

2. Schedule / Scadenzario /schedule
1. Obiettivo UX
Vista calendario manutentivo. Il facility manager pianifica visualmente gli interventi nel tempo, vede quando scadono le verifiche degli asset, sposta WO con drag-and-drop, identifica sovraccarichi nel team. Risposta a "cosa succede questo mese" e "cosa rischia di slittare".
2. Layout principale
 Subheader: title "Scadenzario", subtitle "[N] interventi pianificati questo mese · [N] in ritardo".
 Page actions: "Esporta", "+ Nuovo Intervento" (apre modal Crea WO precompilato con data corrente).
 View toggle segmented: "Mese" (default) / "Settimana" / "Lista".
 Toolbar filtri: search + filtri (Categoria asset, Tipo WO, Tecnico, Fornitore, Stato).
 Calendario centrale: 90% width.
 Sidebar destra 320px: "Eventi del giorno" (lista WO del giorno selezionato).
3. Sezioni
Calendario mese (vista default):
 Header mese: "Maggio 2026" (24/700) + nav 9 : + "Oggi" button.
 Day-of-week header: 7 col (Lun-Dom) bg #FAFAF9, label 11/600 UPPERCASE muted.
 Grid 7×6: ogni cella è un giorno.
 Cella giorno:
 Width flex, height 120px.
 Bg #FFFFFF, border #E5E4DF.
 Today: border #2ECC71 2px + ring 4px rgba.
 Out-of-month: bg #FAFAF9, opacity 0.5.
 Top: numero giorno (14/600) + count badge "[N] eventi" se >0.
 Body: max 3 eventi visualizzati come pill (bg colore tipo + label troncato), "+N altri" se overflow.
 Drag & drop event tra giorni: feedback visivo (ghost + drop zone highlight verde).
Calendario settimana:
 Grid 7 col × N righe orarie (08:0020:00).
 Eventi posizionati per ora di inizio + durata.
Lista:
 Tabella con colonne: Data | Ora | Intervento | Asset | Tecnico | Stato | Azioni.
 Raggruppata per giorno con header "Lunedì 5 maggio 2026 · 4 interventi".
Sidebar "Eventi del giorno":
 Header: data selezionata "Lunedì 5 mag" + count.
 Lista eventi: pattern coerente con WO list (codice + titolo + asset + stato + tecnico).
 Click evento: drawer dettaglio WO (riusa quello di Fase 5).
 CTA bottom: "+ Pianifica intervento per [data]".
4. Componenti HeroUI
Tabs (view toggle), Card, Button, DatePicker, Drawer, Tooltip (eventi su pill), libreria calendar custom (no Calendar HeroUI completo) — usare react-day-picker o @fullcalendar/react con styling brand custom.
5. Stati principali
 Loading: skeleton calendar grid (celle skeleton) + skeleton sidebar.
 Empty mese: calendario renderizzato vuoto, badge "Nessun intervento questo mese · [+ Pianifica]" centrato sotto.
 Empty giorno selezionato: sidebar con icon CalendarOff muted, "Nessun intervento il [data]", CTA "+ Pianifica".
 Error: pattern standard.
6. Microcopy
 Title: "Scadenzario".
 Subtitle: "[N] interventi pianificati questo mese · [N] in ritardo".
 Nav: "9" / ":" / "Oggi".
 Empty mese: "Nessun intervento questo mese".
 Empty giorno: "Nessun intervento il [giorno data]".
 CTA giorno: "+ Pianifica intervento".
 Tooltip pill evento: "[Codice WO] · [Titolo] · [Stato]".
7. Note responsive
 Sotto 1024px: vista mese diventa scroll orizzontale OR fallback a vista lista.
 Mobile: solo vista "Lista", sidebar sotto.
8. Errori da evitare
  Calendario senza colore evento per tipo WO: difficile distinguere programmati da correttivi.
  Drag & drop senza feedback visivo (drop zone non evidenziata).
  Cella giorno con eventi piccolissimi illeggibili: minimum 20px alto pill.
  Mancanza di "Oggi" button per tornare velocemente alla data corrente.
  Eventi cliccabili senza tooltip preview: utente deve vedere subito di cosa si tratta.

3. Tickets Queue /tickets
1. Obiettivo UX
Coda delle segnalazioni pubbliche. Il responsabile riceve i ticket, li valuta, li prende in carico, li converte in Work Order o li chiude. Vista che premia velocità di triage: ordinabile per urgenza, filtrabile per categoria/stato, conversione 1-click in WO.
2. Layout principale
 Subheader: title "Tickets", subtitle "[N] aperti · [N] in carico · [N] chiusi questa settimana".
 Page actions: "Esporta", view toggle "Tabella / Card".
 Status tabs (come WO): "Aperti / In carico / Chiusi / Tutti".
 Toolbar filtri: search + filter chips (Categoria, Ubicazione, Priorità, Periodo).
 Vista default: tabella.
3. Sezioni
Tabella tickets (default):
 Colonne: Codice (TKT-2026-042) | Foto allegata mini (40×40 thumbnail o icon Image fallback) | Titolo + descrizione (line-clamp 2) | Categoria badge | Ubicazione | Priorità badge | Stato badge | Segnalato da (nome + email contact muted) | Data | Azioni.
 Riga 72px (più alta per descrizione 2 righe + foto thumbnail).
 Click riga  drawer dettaglio.
Stati ticket:
 " APERTO" (warning arancio) — appena creato, non ancora preso in carico.
 " IN CARICO" (info dark) — assegnato a responsabile.
 " IN ATTESA" (neutral) — bloccato per info aggiuntive.
 " RISOLTO" (success verde) — convertito in WO o gestito direttamente.
 " CHIUSO" (success deep) — verificato e archiviato.
Categorie ticket (mappate da riepilogo): Elettrico, Idraulico, HVAC/Climatizzazione, Illuminazione, Sicurezza/Antincendio, Strutturale/Edile, Informatica/IT, Pulizia/Igiene, Attrezzature sportive, Altro.
Drawer dettaglio ticket (560px):
 Header: codice + creato il + status badge.
 Hero: titolo + categoria + ubicazione + priorità.
 Tab "Dettagli": descrizione completa, foto allegate (galleria thumbnail click-to-zoom), info segnalatore (nome, email, telefono).
 Tab "Cronologia": timeline azioni (creato, preso in carico, etc.).
 Tab "Conversione": se non già convertito, CTA grande "Converti in Work Order " che apre modal Crea WO precompilato (asset suggerito da ubicazione, descrizione precompilata da ticket).
 Footer: actions contestuali a stato:
 APERTO: "Prendi in carico" (primary) / "Chiudi senza azione" (ghost destructive).
 IN CARICO: "Converti in WO" (primary) / "Metti in attesa" / "Risolvi direttamente".
 IN ATTESA: "Riprendi" / "Chiudi".
 RISOLTO: "Verifica e chiudi" (primary).
 CHIUSO: read-only.
4. Componenti HeroUI
Tabs, Card, Table, Chip, Drawer, Modal, Avatar, Image (thumbnail), Button.
5. Stati principali
 Loading: skeleton tabella + status tabs skeleton.
 Empty totale: icon MessageSquareWarning 40px, "Nessun ticket ancora", subtitle "Le segnalazioni dei ticket pubblici appariranno qui."
 Empty status (es. "In carico" tab vuoto): "Nessun ticket in carico al momento."
 Error: standard.
6. Microcopy
 Title: "Tickets". Subtitle: "[N] aperti · [N] in carico · [N] chiusi questa settimana".
 Status tabs: "Tutti / Aperti / In carico / In attesa / Risolti / Chiusi".
 CTA conversione: "Converti in Work Order ".
 Action takeover: "Prendi in carico".
 Toast: "Ticket preso in carico" / "Ticket convertito in WO-[N]" / "Ticket chiuso".
 Empty: "Nessun ticket ancora" / "Le segnalazioni dei ticket pubblici appariranno qui."
7. Note responsive
 Mobile: card view obbligatoria, ogni card mostra foto thumbnail + titolo + meta.
8. Errori da evitare
  Foto allegata non mostrata in tabella: critica per triage rapido.
  Conversione in WO sepolta in overflow: deve essere CTA prominente.
  Mancanza di info segnalatore (chi ha aperto): perde tracciabilità.
  Stati troppi e simili (Aperto/In carico/In attesa/Risolto/Chiuso): label distinte e dot colorati distinti.
  Categorie senza icone visive: lista lunga difficile da scansionare.

4. Rapportini /rapportini
1. Obiettivo UX
Archivio di tutti gli allegati caricati sui Work Order, raggruppati per asset e intervento. Il responsabile ricerca un documento ("la scheda dell'estintore CR2 dell'anno scorso"), filtra per asset, scarica o apre. È una vista di consultazione documentale, non transazionale.
2. Layout principale
 Subheader: title "Rapportini", subtitle "[N] file · [N] interventi documentati · [N] asset coperti".
 Page actions: "Esporta tutto (ZIP)" (button secondary).
 Toolbar filtri: search "Cerca per nome file, asset, codice WO&" + filter chips (Categoria asset, Ubicazione, Periodo, Tipo file PDF/JPG/PNG).
 View toggle: "Per asset" (default, raggruppato) / "Lista cronologica".
3. Sezioni
View "Per asset" (default):
 Lista accordion: ogni asset è un gruppo collassabile.
 Header gruppo (clickable):
 Layout: icon container 32×32 (categoria color) + nome asset 14/600 + meta seriale 12/500 muted + count file "12 rapportini" + chevron expand.
 Padding 12px 16px, border-bottom #E5E4DF.
 Body gruppo (espanso):
 Lista file: ogni file è un row.
 Row: icon tipo 24px (PDF, JPG) + nome file 13/500 + size 12/400 muted + WO collegato (link "WO-[N] " 12/600 verde) + data upload 12/500 muted + actions (Eye preview, Download, MoreHorizontal).
 Padding 10px 24px (indent).
View "Lista cronologica":
 Tabella con colonne: Data upload | File (icon + nome) | WO collegato | Asset | Caricato da | Azioni.
 Sortable per data desc default.
Modal preview file:
 Modal grande 80vw × 80vh.
 PDF: viewer integrato (embed iframe o pdfjs).
 IMG: image viewer con zoom/pan.
 Header: nome file + meta + close X.
 Footer: "Download" / "Vai al WO" / "Vai all'Asset".
4. Componenti HeroUI
Accordion (per gruppi asset), Card, Table, Modal, Image, Button, lib esterna per PDF viewer (pdf.js).
5. Stati principali
 Loading: skeleton accordion (5 gruppi skeleton, ognuno con header + 3 row skeleton).
 Empty totale: icon FolderArchive 40px in cerchio #F1EFE8, "Nessun rapportino allegato", subtitle "I rapportini caricati nei Work Order appariranno qui automaticamente.", NO CTA (il rapportino si crea via WO, non qui).
 Empty filtri: "Nessun risultato per i filtri attivi".
 Error: standard.
6. Microcopy
 Title: "Rapportini".
 Subtitle: "[N] file · [N] interventi documentati · [N] asset coperti".
 Search placeholder: "Cerca per nome file, asset, codice WO&"
 Empty title: "Nessun rapportino allegato".
 Empty desc: "I rapportini caricati nei Work Order appariranno qui automaticamente."
 Action labels: "Anteprima" / "Scarica" / "Vai al WO" / "Vai all'Asset" / "Elimina" (solo ruoli gestionali).
7. Note responsive
 Mobile: accordion mantenuto, file row stack verticale invece di tabellare.
8. Errori da evitare
  Empty state attuale ("Nessun rapportino allegato" centrato senza icona contestuale): manca icona + struttura standard.
  Mancanza di link "Vai al WO" dal singolo file: l'utente perde contesto.
  Download senza preview: PDF e immagini devono essere visualizzabili in app.
  View "Per asset" senza count file: gruppo difficile da gerarchizzare.
  Cancellazione disponibile a tutti i ruoli: deve essere ristretta come da specs (LETTURA/TECNICO non possono).

5. Suppliers / Technicians /suppliers
1. Obiettivo UX
Vista anagrafica organizzata in due tab. Tab "Fornitori" mostra aziende esterne (con servizi, contatti, contratti). Tab "Tecnici" mostra persone (interne INTERNAL o esterne EXTERNAL con riferimento al fornitore).
2. Layout principale
 Subheader: title "Fornitori e Tecnici", subtitle "[N] fornitori · [N] tecnici · [N] interni · [N] esterni".
 Page actions: dipendono da tab attivo:
 Tab Fornitori: "Esporta", "+ Nuovo Fornitore" (primary).
 Tab Tecnici: "Esporta", "+ Nuovo Tecnico" (primary).
 Tab bar inline (sotto subheader): "Fornitori (N)" / "Tecnici (N)".
 Toolbar filtri: search + filter chips.
 Vista default: grid card 3 col (è quello che ha senso qui — entità con identità visiva).
3. Sezioni
Tab "Fornitori":
 Filter chips: Servizio (categoria asset coperta), Stato (Attivo/Inattivo), Tecnici associati (con/senza).
 Card fornitore (360×220px, grid 3 col gap 20):
 Header card: icon container 40×40 con icona Building2 su bg #F1EFE8 left + overflow MoreHorizontal 32×32 right.
 Body: nome 14/600 + servizio chip (sm neutral con dot tipo) + count tecnici "[N] tecnici" inline + telefono + email.
 Click card  drawer dettaglio.
Tab "Tecnici":
 Filter chips: Tipo (Interno/Esterno), Specializzazione, Fornitore (per esterni).
 Card tecnico (360×200px):
 Header: avatar 40×40 con iniziali fallback + overflow.
 Body: nome 14/600 + ruolo/specializzazione 12/500 muted + badge "INTERNO" / "ESTERNO".
 Per esterno: chip fornitore associato con icon Building2 (clickable  naviga al fornitore).
 Email contact.
Drawer dettaglio fornitore:
 Header: icon + nome + actions.
 Tabs: "Anagrafica" / "Tecnici associati ([N])" / "Work Order ([N])" / "Documenti".
 Tab Anagrafica: P.IVA, indirizzo, telefono, email, sito web, referente, servizi offerti (categorie asset coperte).
 Tab Tecnici: lista tecnici associati con avatar + nome + email.
 Tab WO: lista WO assegnati a questo fornitore (storico).
 Tab Documenti: contratti, certificazioni, etc.
Drawer dettaglio tecnico:
 Header: avatar grande + nome + actions.
 Tabs: "Anagrafica" / "Work Order ([N])" / "Disponibilità".
 Tab Anagrafica: nome, ruolo, specializzazione, telefono, email, tipo (interno/esterno), fornitore associato (se esterno).
 Tab WO: WO assegnati (in corso e storico).
Modal Crea/Modifica Fornitore:
 Sezioni: "ANAGRAFICA AZIENDALE" (ragione sociale, P.IVA, indirizzo) / "CONTATTI" (telefono, email, sito, referente) / "SERVIZI" (multi-select categorie) / "NOTE".
Modal Crea/Modifica Tecnico:
 Sezioni: "ANAGRAFICA" (nome, cognome, ruolo) / "CONTATTI" (email, telefono) / "TIPO" (radio Interno/Esterno + se esterno: fornitore associato required) / "SPECIALIZZAZIONI" (multi-select).
4. Componenti HeroUI
Tabs (Fornitori/Tecnici), Card, Avatar, Chip (badge tipo), Drawer, Modal, Select, Autocomplete (fornitore associato), Button.
5. Stati principali
 Loading: skeleton grid (9 card skeleton).
 Empty Fornitori: icon Building2 40px, "Nessun fornitore registrato", CTA "+ Nuovo Fornitore".
 Empty Tecnici: icon Users 40px, "Nessun tecnico registrato", CTA "+ Nuovo Tecnico".
 Empty filtri: "Nessun risultato per i filtri attivi", CTA "Reset filtri".
 Error: standard.
6. Microcopy
 Title: "Fornitori e Tecnici".
 Subtitle: "[N fornitori] fornitori · [N tecnici] tecnici · [N interni] interni · [N esterni] esterni".
 Tab labels: "Fornitori ([N])" / "Tecnici ([N])".
 Badge tipo tecnico: "INTERNO" (bg success light, text success) / "ESTERNO" (bg neutral, text secondary).
 CTA: "+ Nuovo Fornitore" / "+ Nuovo Tecnico".
 Modal subtitle: "Compila i dati per registrare il [fornitore/tecnico]".
7. Note responsive
 Tablet: grid 2 col.
 Mobile: grid 1 col, card più compatte.
8. Errori da evitare
  Tab toggle implementato come segmented dark senza chiarezza visiva (come screenshot attuale, sembra una pillola): meglio Tabs underlined come Drawer.
  Card fornitore senza count tecnici: relazione critica nascosta.
  Card tecnico senza badge Interno/Esterno: distinzione chiave.
  Tecnico esterno senza link al fornitore: rompe la relazione.
  Email/telefono in formato "raw": usare icon mail/phone leading + testo cliccabile (mailto:/tel:).
  Card icona container troppo grande (40+): deve restare equilibrata 40×40.

6. Users Management /users
1. Obiettivo UX
Solo admin. Gestire utenti interni della piattaforma: creare, modificare, attivare/disattivare, cambiare ruolo. Vista compatta tabellare. È una pagina amministrativa, non operativa: density alta, focus su precisione e audit trail.
2. Layout principale
 Subheader: title "Gestione Utenti", subtitle "[N] utenti totali · [N] attivi · [N] admin".
 Page actions: "Esporta", "+ Nuovo Utente" (primary).
 Toolbar filtri: search "Cerca per nome, email o ruolo&" + filter chips (Ruolo, Stato).
3. Sezioni
Tabella utenti:
 Colonne: Avatar+Nome | Email | Ruolo (badge) | Stato (badge attivo/disattivo) | Ultimo accesso | Creato | Azioni.
 Riga 56px (più compatta perché vista admin).
 Click riga  drawer dettaglio (in alternativa modal modifica diretta).
Badge ruolo:
 "ADMIN" — bg #A83228, text #FFFFFF (variante destructive solid per max evidenza autorità).
 "RESPONSABILE" — bg #1C1B18, text #FAFAF9 (info dark).
 "TECNICO" — bg #EAFBF1, text #1A7A3C (success).
 "LETTURA" — bg #F1EFE8, text #5F5E5A (neutral).
Badge stato:
 " ATTIVO" — success.
 " DISATTIVO" — error tenue.
 " INVITATO" — warning (utente creato ma non ha ancora accesso effettivo).
Riga "utente corrente" (l'utente loggato si vede in tabella):
 Background #EAFBF1, border-left 3px verde inset.
 Label inline "Tu" o "Utente corrente" (badge sm neutro accanto al nome).
 Nessuna possibilità di disattivare se stesso.
Modal Nuovo/Modifica Utente:
 Sezioni: "ANAGRAFICA" (Nome completo + Email) / "ACCESSO" (Ruolo dropdown + Stato dropdown active/disabled) / "PASSWORD INIZIALE" (solo per nuovo).
 Validazione email univoca.
 Helper text password: "L'utente potrà cambiarla al primo accesso. Min 8 caratteri."
Action overflow per riga:
 "Modifica" (Pencil)
 "Reinvia invito" (Mail) — se stato INVITATO
 "Reset password" (Key)
 Divider
 "Disattiva" / "Attiva" (toggle)
 "Elimina" (destructive, solo se non è utente corrente)
4. Componenti HeroUI
Table, Avatar, Chip (ruolo + stato), Modal, Input, Select, Switch, Button, Dropdown.
5. Stati principali
 Loading: skeleton tabella.
 Empty totale: caso edge, dovrebbe esserci almeno l'admin. Mostra "Nessun altro utente" + CTA "Invita un utente".
 Empty filtri: "Nessun utente trovato".
 Error: standard.
6. Microcopy
 Title: "Gestione Utenti".
 Subtitle: "[N] utenti totali · [N] attivi · [N] admin".
 Search: "Cerca per nome, email o ruolo&"
 Modal title nuovo: "Nuovo Utente".
 Modal title modifica: "Modifica Utente".
 Helper password: "L'utente potrà cambiarla al primo accesso. Min 8 caratteri."
 Confirm disattiva: "Disattivare l'utente '[Nome]'?" / "L'utente non potrà più accedere ad ArenaOS finché non verrà riattivato."
 Confirm elimina: "Eliminare l'utente '[Nome]'?" / "Questa azione è permanente. I record creati dall'utente saranno conservati ma non saranno più associati a un account attivo."
 Toast: "Utente creato · Email di invito inviata" / "Utente aggiornato" / "Utente disattivato" / "Password reset inviata via email".
7. Note responsive
 Mobile: card view forzata. Ogni card mostra avatar + nome + ruolo + stato.
8. Errori da evitare
  Bottone primary blu modal "Salva" (come screenshot attuale): verde brand #2ECC71.
  Mancanza di distinzione "utente corrente": se admin si modifica per errore stato/ruolo perde accesso.
  Disattivazione di se stesso possibile: deve essere bloccata UI + backend.
  Password temporanea visibile in chiaro nel modal senza warning: deve essere strength meter + helper text.
  Mancanza "Reinvia invito" per utenti INVITATO: workflow incompleto.
  Badge ruolo come testo plain (come screenshot attuale "Lettura" senza distinzione visiva forte): deve essere chip evidente.
  Stato attivo/disattivo come solo testo: serve dot colorato per scansione.

7. Audit Log /audit
1. Obiettivo UX
Solo admin/responsabile. Storico di tutte le operazioni rilevanti: creazione, modifica, eliminazione di asset, WO, ticket, utenti. Vista cronologica scrollabile, filtri per tipo azione/entità/utente/periodo. Deve essere consultabile, non editabile (read-only).
2. Layout principale
 Subheader: title "Audit Log", subtitle "[N] operazioni registrate · ultime 90 giorni".
 Page actions: "Esporta CSV" (button secondary primary).
 Toolbar filtri: search + filter chips (Azione, Entità, Utente, Periodo).
 Vista: timeline lista (no tabella standard, è cronologia operativa).
3. Sezioni
Timeline lista:
 Container card bianca, border #E5E4DF, radius 10px.
 Lista item raggruppati per giorno (sticky day header bg #FAFAF9 con label "Oggi · 5 maggio 2026" 13/600 + count "8 operazioni" muted).
Item audit:
 Padding 14px 20px, border-bottom #F1EFE8.
 Layout flex gap 12px:
 Icon container 36×36 colorato per tipo azione:
 Creazione: bg #EAFBF1, icon Plus #1A7A3C.
 Modifica: bg #FFF3E8, icon Pencil #A8531A.
 Eliminazione: bg #FFF0EE, icon Trash2 #A83228.
 Login/Auth: bg #F1EFE8, icon LogIn #5F5E5A.
 Cambio stato: bg #FFF3E8, icon RefreshCw #A8531A.
 Content:
 Riga 1: Action chip + Entity chip + entity name. Pattern: "[Eliminazione chip] [ASSET chip] prova 2".
 Action chip: padding 2px 8px, radius 4px, bg colore tipo azione bg, text colore tipo, font 11/700 UPPERCASE.
 Entity chip: padding 2px 8px, radius 4px, bg #F1EFE8, text #5F5E5A, font 11/700 UPPERCASE.
 Entity name: 14/600 text-primary.
 Riga 2 (meta): "[data · ora] · [utente]" 12/500 text-muted.
 Right (espandibile):
 Chevron-down 14px ghost button — espande dettaglio diff.
Dettaglio diff espanso (accordion):
 Card embedded #FAFAF9 border #E5E4DF radius 6px padding 12px.
 Mostra cambio campo per campo:
 "Nome: ~~Vecchio valore~~  Nuovo valore" (vecchio strikethrough rosso, nuovo bold verde).
 Solo per Modifica.
 Per Creazione: mostra payload creato.
 Per Eliminazione: mostra ultimi valori prima eliminazione.
4. Componenti HeroUI
Card, Accordion (per espandere diff), Button, Chip, DatePicker (filtro periodo), Select (filtri).
5. Stati principali
 Loading: skeleton lista (8 item skeleton).
 Empty totale: icon History 40px, "Nessuna operazione registrata", "Le azioni di creazione, modifica ed eliminazione appariranno qui."
 Empty filtri: "Nessuna operazione per i filtri attivi".
 Error: standard.
6. Microcopy
 Title: "Audit Log".
 Subtitle: "[N] operazioni registrate · ultime 90 giorni".
 Day header pattern: "Oggi · [data]" / "Ieri · [data]" / "[Giorno data]".
 Action labels: "Creazione" / "Modifica" / "Eliminazione" / "Login" / "Cambio stato" / "Approvazione".
 Entity labels: "ASSET" / "WORK ORDER" / "TICKET" / "USER" / "VEHICLE" / "SUPPLIER" / "TECHNICIAN".
 Meta pattern: "[Ora] · [Nome utente]".
 Empty title: "Nessuna operazione registrata".
 Empty desc: "Le azioni di creazione, modifica ed eliminazione appariranno qui."
 Export tooltip: "Esporta gli ultimi [N] record in formato CSV".
7. Note responsive
 Mobile: layout invariato, padding ridotto, chevron espandi sempre visibile.
8. Errori da evitare
  Tabella troppo strutturata per quello che è una cronologia: timeline lista è più appropriata.
  Mancanza di icone colorate per tipo azione: impossibile scansionare (eliminazioni vs creazioni).
  Diff non visibile o nascosto in modal: deve essere espandibile inline.
  Day grouping mancante: 1000+ record senza separatori sono illeggibili.
  Export CSV come button piccolissimo: deve essere primary action visibile.
  Mancanza di filtro "Utente": admin spesso vuole vedere "cosa ha fatto Mario".
  Audit log editabile: deve essere strict read-only.

8. CDA Report /reports/cda
1. Obiettivo UX
Vista direzionale stampabile e esportabile in PDF. Si presenta al consiglio di amministrazione: stato impianti, conformità, criticità, sintesi esecutiva. Richiede typography e layout da documento ufficiale, non da dashboard interattiva. Deve essere bello stampato.
2. Layout principale
 Layout completamente diverso dalle altre pagine: NO sidebar visibile (full-width content), header minimalista.
 Top bar fissa 56px:
 Left: Breadcrumb "Report" + subtitle "Vista dedicata alla stampa e all'esportazione PDF" (12/500 muted).
 Right: button secondary " Torna alla dashboard" + button primary "Esporta PDF" (icon FileDown leading).
 Content area centrato max-width 880px (formato A4 ratio), padding 32px.
 Bg #FAFAF9 esterno, content card bianca.
3. Sezioni
Header report (card bianca top):
 Logo arenaOS 32px alto + wordmark.
 Title: "Report manutenzione impianti" (28/700, margin-top 16).
 Subtitle: "Documento sintetico con stato manutentivo, criticità aperte e trend operativi della piattaforma." (14/500 muted).
 Right column meta:
 "Data esportazione: [data] alle [ora]" (icon Calendar 14px leading).
 "Struttura: Itelyum Arena - Varese" (icon Building2 14px leading).
KPI block (4 card 1 riga):
 Card più grande del solito: padding 24×24px, height 140px.
 "Tot Asset" 200 / "Conformità" 30.5% / "Asset Scaduti" 139 / "WO In Corso" 1.
 Background card differenti tenui per attirare l'occhio (variante "stampa-friendly"):
 Tot Asset: bg #FFFFFF.
 Conformità: bg #EAFBF1 (success tenue).
 Asset Scaduti: bg #FFF0EE (error tenue).
 WO In Corso: bg #FFF3E8 (warning tenue).
Section "Stato asset" (card bianca):
 Title 18/700 + subtitle "Distribuzione sintetica dello stato manutentivo del patrimonio impiantistico." (13/500 muted).
 Bar list: per ogni stato (In Regola, In Scadenza, Scaduto):
 Layout: label sx + bar centrale (height 8px, radius 4) + count dx.
 Colore bar: verde / arancione / rosso.
Section "Trend manutenzioni" (card bianca):
 Title + subtitle "Work order chiusi negli ultimi 12 mesi.".
 Lista mesi (Giu, Lug, Ago, ..., Mag) con bar orizzontale + count.
 Variante più report-like rispetto al chart line della dashboard (più stampabile, più leggibile in B/N).
Section "Ticket per categoria" + "Ticket per ubicazione" (2 card affiancate):
 Bar chart orizzontali (come dashboard ma stampabili).
 Empty: "Nessun dato disponibile" centrato muted.
Section "Interventi attivi" (card bianca):
 Title + subtitle "Ultimi work order aperti o in lavorazione.".
 Lista compatta WO: codice + stato chip + titolo + asset + data creazione.
Section "Sintesi esecutiva" (card bianca, layout testuale):
 Title + subtitle "Messaggi chiave per lettura rapida del report.".
 3 box callout:
 "Conformità impianti" — body con valori chiave bold inline. Es. "Il parco asset registra una conformità del 30.5%, con 139 asset scaduti e 0 in scadenza."
 "Carico operativo" — "Sono presenti 1 work order in corso e 0 ticket aperti da monitorare."
 "Aree critiche" — "Le segnalazioni si concentrano soprattutto su [categoria] e nell'area [ubicazione]."
 Box callout style: bg #FFFFFF, border 1px #E5E4DF, border-left 3px (verde/arancio/rosso secondo gravità), radius 8px, padding 16px 20px.
Footer report:
 Padding 24px 0.
 Border-top 1px #E5E4DF.
 Layout flex: logo small + "ArenaOS · Documento generato il [data]" 12/500 muted.
 Page number per print: "Pagina [N] di [N]".
4. Componenti HeroUI
Card, Button, layout custom (è essenzialmente un documento, non un'app).
5. Stati principali
 Loading: skeleton page (header skeleton + 4 KPI skeleton + sezioni skeleton).
 Print mode: stili @media print con padding ridotti, no shadow, colori safe per stampa B/N (con fallback grayscale).
 Error: "Impossibile generare il report" + "Riprova" / "Torna alla dashboard".
6. Microcopy
 Title pagina: "Report".
 Subtitle pagina: "Vista dedicata alla stampa e all'esportazione PDF".
 CTA: " Torna alla dashboard" / "Esporta PDF".
 Title report: "Report manutenzione impianti".
 Subtitle report: "Documento sintetico con stato manutentivo, criticità aperte e trend operativi della piattaforma."
 Section titles: "Stato asset" / "Trend manutenzioni" / "Ticket per categoria" / "Ticket per ubicazione" / "Interventi attivi" / "Sintesi esecutiva".
 Sintesi callout titles: "Conformità impianti" / "Carico operativo" / "Aree critiche".
 Footer: "ArenaOS · Documento generato il [data]".
7. Note responsive
 Mobile: report sempre fixed width 880px max ma scalato. Stampa rimane priorità.
 Print: ottimizzato A4, no header bar, no actions, solo report.
8. Errori da evitare
  Layout identico alle altre pagine (sidebar visibile, header complesso): è una vista report, deve sembrare un documento.
  Bottone "Esporta PDF" blu (screenshot attuale): deve essere primary verde brand.
  Empty data come solo "Nessun dato disponibile" senza icon: il report deve restare presentabile anche con dati zero.
  Chart line interattivo: in un report deve essere bar list più stampabile.
  Numeri KPI piccoli: per un documento direzionale devono essere imponenti (3240px).
  Sintesi esecutiva senza highlight su numeri chiave: deve essere "scannable" in 30 secondi.
  Mancanza di logo/branding header: è un documento ufficiale, deve avere identità visiva forte.
  Print non testato: layout che sembra ok a schermo ma rotto in stampa = scarsa qualità.

9. Public Ticket Form /report-issue
1. Obiettivo UX
Pagina pubblica accessibile senza login. Un utente esterno (collaboratore, atleta, staff non amministrativo) segnala un problema. Deve essere semplice, veloce, mobile-first, con tono guidato e accogliente. Crea un ticket OPEN che notifica i responsabili.
2. Layout principale
 Layout pubblico (no sidebar, no header app): completamente diverso.
 Top bar pubblica 64px:
 Logo ArenaOS sinistra + wordmark.
 Right: link "Hai un account? [Accedi]" (12/500 muted con link primary verde).
 Content centrato max-width 560px, padding 24px.
 Background: foto sfondo arena con overlay scuro rgba(28,27,24,0.50) blur 8px (scelta più premium che background piatto). Mobile: bg #FAFAF9 flat.
 Card form bianca centrata, radius 16px, shadow-md.
3. Sezioni
Header card form:
 Padding 32px 32px 16px.
 Title: "Segnala un problema" (24/700 / text-primary).
 Subtitle: "Compila il form per aprire un ticket. I responsabili dell'arena saranno notificati immediatamente." (14/400 / text-secondary).
Body form (padding 0 32px 24px):
Sezione "Cosa è successo?":
 Field "Categoria del problema" — Select with icon for each category.
 Field "Descrizione" — Textarea, min-height 120px, placeholder "Descrivi cosa hai notato. Più dettagli ci dai, più velocemente possiamo intervenire."
 Field "Foto (opzionale)" — Drag&drop area + icona Camera, "Aggiungi foto del problema (max 5MB)".
Sezione "Dove?":
 Field "Ubicazione" — Select with icon MapPin per ogni ubicazione (precaricate da database).
 Helper text: "Indica con la massima precisione la zona dell'arena."
 Optional field "Note posizione" — Input text.
Sezione "Chi sei?":
 Field "Nome" — Input, required.
 Field "Email" — Input, required (per ricevere conferma e aggiornamenti).
 Field "Telefono (opzionale)" — Input.
 Field "Sei un dipendente/collaboratore?" — RadioGroup Sì/No.
Footer card form:
 Padding 16px 32px 32px.
 Border-top #E5E4DF.
 Bg #FAFAF9.
 Privacy notice: 12/500 text-muted. Es. "I tuoi dati saranno usati esclusivamente per gestire questa segnalazione. [Privacy policy]" (link primary verde).
 CTA primary md full-width: "Invia segnalazione" (icon Send trailing).
Stato success (post submit):
 Card si trasforma in success state:
 Icon CheckCircle 56px in cerchio #EAFBF1 88×88 centrato.
 Title: "Segnalazione inviata" (24/700).
 Description: "Abbiamo ricevuto la tua segnalazione. Codice ticket: TKT-2026-042. I responsabili dell'arena ti contatteranno via email." (14/400).
 Code chip large: "TKT-2026-042" in card centrata bg #FAFAF9 border #E5E4DF font 18/700 tabular-nums.
 CTA secondary: "Invia un'altra segnalazione" (link).
4. Componenti HeroUI
Card, Input, Textarea, Select (con icon), RadioGroup, Button, file uploader custom.
5. Stati principali
 Idle (form vuoto): default.
 Validating: feedback inline on blur.
 Submitting: button con spinner + "Invio in corso...", form fields disabled.
 Success: card transformata (vedi sopra).
 Error submit: banner rosso top form "Impossibile inviare. Riprova tra un momento o contatta direttamente [email contatto]."
6. Microcopy
 Top link: "Hai un account? Accedi"
 Title: "Segnala un problema".
 Subtitle: "Compila il form per aprire un ticket. I responsabili dell'arena saranno notificati immediatamente."
 Section titles: "Cosa è successo?" / "Dove?" / "Chi sei?".
 Field labels: "Categoria del problema" / "Descrizione" / "Foto (opzionale)" / "Ubicazione" / "Note posizione" / "Nome" / "Email" / "Telefono (opzionale)".
 Description placeholder: "Descrivi cosa hai notato. Più dettagli ci dai, più velocemente possiamo intervenire."
 Helper ubicazione: "Indica con la massima precisione la zona dell'arena."
 Privacy: "I tuoi dati saranno usati esclusivamente per gestire questa segnalazione. [Privacy policy]"
 CTA: "Invia segnalazione".
 Submitting: "Invio in corso...".
 Success title: "Segnalazione inviata".
 Success desc: "Abbiamo ricevuto la tua segnalazione. Codice ticket: [CODICE]. I responsabili dell'arena ti contatteranno via email."
 Success secondary: "Invia un'altra segnalazione".
7. Note responsive
 Mobile: bg piatto #FAFAF9 (no foto), card form full-width margin 16px, padding ridotto.
 Tablet: foto sfondo + card centered come desktop.
8. Errori da evitare
  Form troppo lungo (15+ field): max 8 field essenziali.
  Stato success come toast e redirect: deve essere card transformata con codice ticket prominente.
  Logo Pallacanestro Varese troppo grande nell'header: ArenaOS è il prodotto, branding cliente in footer.
  Mancanza di privacy notice: GDPR critical.
  Foto upload limitato a tipi non immagine: deve accettare solo JPG/PNG/HEIC.
  Categoria "Altro" come unica opzione visibile: deve avere lista pre-popolata user-friendly.
  Email non required: senza email non si può notificare l'utente.
  Bottone "Invia" generico: usare "Invia segnalazione" più specifico.
  CTA blu come nello stile precedente: verde brand.

10. Public Vehicle Booking Form /booking/:slug
1. Obiettivo UX
Pagina pubblica per richiedere prenotazione mezzo (sharing). Il giocatore o staff prenota un veicolo specificando viaggio, motivazione, firma digitale. Crea richiesta pending che il facility manager approverà/rifiuterà.
2. Layout principale
 Layout pubblico stesso pattern Public Ticket Form.
 Top bar 64px con logo ArenaOS.
 Content centered max-width 640px, padding 24px.
 Background: foto sfondo veicoli con overlay (mobile flat).
 Card form bianca radius 16px shadow-md.
3. Sezioni
Header form:
 Title: "Richiesta prenotazione mezzo" (24/700).
 Subtitle: "Compila la richiesta per prenotare un veicolo della flotta. La conferma arriverà via email." (14/400 muted).
Card "Veicolo richiesto" (preview embedded, dato dal slug URL):
 Card embedded con foto veicolo (16:9 ratio mini 96×54) + nome + targa + tipo.
 Es. "Volkswagen Caddy · TARGA AB123CD · Furgone".
Sezione "Dettagli viaggio":
 Field "Data e ora partenza" — DateTime picker, required.
 Field "Data e ora rientro" — DateTime picker, required.
 Field "Destinazione" — Input, required, placeholder "Es. PalaSport Milano".
 Field "Tipo trasporto" — Select (Allenamento / Trasferta / Visita medica / Eventi / Altro).
Sezione "Richiedente":
 Field "Nome" — required.
 Field "Cognome" — required.
 Field "Ruolo" — Select (Giocatore / Staff tecnico / Staff amministrativo / Altro).
 Field "Email" — required.
 Field "Telefono" — required (per contatto urgente).
Sezione "Motivazione":
 Textarea "Descrivi il motivo della richiesta" — required, min 20 caratteri.
 Helper text: "Le richieste con motivazione chiara sono approvate più rapidamente."
Sezione "Conferma e firma":
 Checkbox "Confermo di essere autorizzato a guidare il veicolo richiesto e di possedere patente valida".
 Checkbox "Mi assumo la responsabilità del corretto utilizzo del mezzo".
 Firma digitale animata: canvas per disegnare firma con touch/mouse.
 Container: 100% × 160px, border dashed #D3D1C7 1.5px, radius 10px, bg #FAFAF9.
 Placeholder centro: "Firma qui sopra" (14/500 muted).
 Bottoni below: "Cancella" ghost (icon Eraser).
 Validation: firma richiesta, conta che almeno N tratti siano stati fatti.
Footer form:
 Privacy notice + link.
 CTA primary md full-width: "Invia richiesta" (icon Send trailing).
Stato success:
 Card transformata con icon checkmark + title + codice richiesta + description "La richiesta è stata inviata al facility manager. Riceverai un'email entro 24h con la risposta."
4. Componenti HeroUI
Card, Input, Textarea, Select, DatePicker (datetime), Checkbox, Button, custom SignatureCanvas (lib esterna react-signature-canvas).
5. Stati principali
 Idle, Validating, Submitting, Success, Error (pattern coerente).
6. Microcopy
 Title: "Richiesta prenotazione mezzo".
 Subtitle: "Compila la richiesta per prenotare un veicolo della flotta. La conferma arriverà via email."
 Section titles: "Veicolo richiesto" / "Dettagli viaggio" / "Richiedente" / "Motivazione" / "Conferma e firma".
 Helper motivazione: "Le richieste con motivazione chiara sono approvate più rapidamente."
 Checkbox 1: "Confermo di essere autorizzato a guidare il veicolo richiesto e di possedere patente valida".
 Checkbox 2: "Mi assumo la responsabilità del corretto utilizzo del mezzo".
 Firma placeholder: "Firma qui sopra".
 Firma button: "Cancella".
 CTA: "Invia richiesta".
 Success title: "Richiesta inviata".
 Success desc: "La richiesta è stata inviata al facility manager. Riceverai un'email entro 24h con la risposta."
7. Note responsive
 Mobile: firma canvas height 200px (più spazio per dito).
 DateTime picker: nativo su mobile per UX migliore.
8. Errori da evitare
  Firma come campo testuale ("Scrivi il tuo nome"): deve essere canvas reale.
  Mancanza di conferma autorizzazione guida: rischio legale.
  Form troppo corto senza motivazione: il facility manager ha bisogno di context per approvare.
  Mancanza di codice richiesta nel success: utente non può tracciare.
  Stato veicolo "in manutenzione" non gestito: se mezzo non disponibile mostrare warning prima del form.
  Slug URL invalido: pagina deve mostrare "Veicolo non trovato" + "Torna alla home".

11. Reset Password /reset-password
1. Obiettivo UX
Pagina pubblica accessibile via email link. L'utente reimposta la password con strength meter chiaro e conferma. Flusso minimo, premium, sicuro.
2. Layout principale
 Layout pubblico stesso pattern di Login.
 Background: foto sfondo arena con overlay scuro (coerente con login).
 Top bar minimale: solo logo ArenaOS centrato.
 Card centrata 480px width, radius 16px, shadow-lg.
3. Sezioni
Stato "Token valido — set new password" (caso 90%):
Header card:
 Padding 32px 32px 16px.
 Icon KeyRound 32px in cerchio #EAFBF1 56×56.
 Title: "Reimposta la password" (24/700).
 Subtitle: "Crea una nuova password per il tuo account." (14/400 muted).
Body form (padding 0 32px 24px):
 Field "Nuova password" — Input type=password, required.
 Show/hide toggle eye icon.
 Strength meter sotto il field:
 Bar segmentata 4 segmenti, gap 4px, height 4px, radius full.
 Colori progressivi: vuoto #E5E4DF / 1 segmento #E24B4A (debole) / 2 #E8782A (media) / 3 #A8531A (buona) / 4 #2ECC71 (forte).
 Label dinamica sotto: "Debole" / "Media" / "Buona" / "Forte" 12/600 colore corrispondente.
 Helper requisiti checklist (collassabile):
 "Almeno 8 caratteri" — check icon verde se ok, dot grigio altrimenti.
 "Almeno 1 maiuscola"
 "Almeno 1 numero"
 "Almeno 1 carattere speciale"
 Field "Conferma nuova password" — Input type=password, required.
 Validation match con primo field, error inline "Le password non coincidono".
Footer card:
 Padding 16px 32px 32px, bg #FAFAF9, border-top #E5E4DF.
 CTA primary md full-width: "Aggiorna password" (icon Check trailing).
 Link below: "Torna al login" (link primary verde 13/600).
Stato "Success":
 Card transformata:
 Icon CheckCircle 56px in cerchio #EAFBF1 88×88.
 Title: "Password aggiornata" (24/700).
 Description: "La tua password è stata reimpostata con successo. Ora puoi accedere con le nuove credenziali." (14/400).
 CTA primary md: "Vai al login" (link verde primary).
 Auto-redirect dopo 3s con countdown "Reindirizzamento in 3...".
Stato "Token scaduto/invalido":
 Icon AlertCircle 56px in cerchio #FFF0EE 88×88.
 Title: "Link non valido" (24/700).
 Description: "Il link di reset password non è valido o è scaduto. Richiedi un nuovo link per reimpostare la password." (14/400).
 CTA primary md: "Richiedi nuovo link" (link a /forgot-password).
 Link secondary: "Torna al login".
Stato "Loading token validation":
 Spinner 32px centrato + "Verifica link in corso..." 14/500 muted.
4. Componenti HeroUI
Card, Input (con endContent icon eye toggle), Button, custom strength meter.
5. Stati principali
 Token validation loading.
 Token valid: form attivo.
 Token invalid: error state.
 Submitting: button con spinner.
 Success: card transformata.
 Error submit: banner inline form.
6. Microcopy
 Title: "Reimposta la password".
 Subtitle: "Crea una nuova password per il tuo account."
 Field labels: "Nuova password" / "Conferma nuova password".
 Strength labels: "Debole" / "Media" / "Buona" / "Forte".
 Requisiti: "Almeno 8 caratteri" / "Almeno 1 maiuscola" / "Almeno 1 numero" / "Almeno 1 carattere speciale".
 Match error: "Le password non coincidono".
 CTA: "Aggiorna password".
 Back link: "Torna al login".
 Success title: "Password aggiornata".
 Success desc: "La tua password è stata reimpostata con successo. Ora puoi accedere con le nuove credenziali."
 Success CTA: "Vai al login".
 Token invalid title: "Link non valido".
 Token invalid desc: "Il link di reset password non è valido o è scaduto. Richiedi un nuovo link per reimpostare la password."
 Token invalid CTA: "Richiedi nuovo link".
 Loading: "Verifica link in corso...".
 Auto-redirect: "Reindirizzamento in [N]...".
7. Note responsive
 Mobile: card full-width margin 16px, padding ridotto a 24px lateral.
 Touch device: input password con tasti tastiera dedicata.
8. Errori da evitare
  Mancanza di strength meter visivo: utente non sa se la password è abbastanza robusta.
  Validation match passwords solo on submit: deve essere inline.
  Show/hide password senza toggle eye: standard moderno.
  CTA "Reset" generico: usare "Aggiorna password" più chiaro.
  Auto-redirect senza countdown visibile: utente confuso.
  Token invalid senza CTA "Richiedi nuovo link": dead end.
  Form senza link "Torna al login": utente bloccato se token errato.
  Strength meter solo testo senza bar visiva: meno immediato.

Riepilogo coerenza globale
Tutte le 11 schermate condividono:
Token visivi:
 Inter unico font.
 Background #FAFAF9, sidebar #1C1B18, card #FFFFFF, border #E5E4DF, accent verde #2ECC71.
 Status colors esclusivamente nei badge e segnali.
 Border come gerarchia primaria, shadow minima.
 Tabular-nums per cifre comparabili.
Pattern strutturali:
 Subheader (breadcrumb + page title + subtitle metadata + page actions).
 Toolbar con search + filter chips + counter (per liste).
 Tabella o grid con righe 5664px, badge UPPERCASE 11/600.
 Drawer 560720px per dettaglio + tabs underlined.
 Modal 480720px per crea/modifica con sezioni UPPERCASE.
 Empty states con icon in cerchio + title + desc + CTA.
 Loading skeleton-driven.
 Toast top-right per feedback transient.
Pagine pubbliche:
 Layout dedicato (no sidebar, top bar minimal, card centered, foto sfondo overlay).
 Tone più morbido, più guidato, più premium nel padding.
 Stato success transformato (no toast).
Pagine admin (/users, /audit, /reports/cda):
 Density più alta, focus su precisione e read-only.
 Audit log ha pattern timeline custom.
 CDA report ha layout completamente standalone (documento, non app).
Bottoni primary: sempre verde brand #2ECC71. Nessun blu nel prodotto.
Errori globali da evitare:
  Mantenere pattern blu da screenshot attuali (login, modali users management, CDA export).
  Toggle Fornitori/Tecnici implementato come segmented dark: usare Tabs underlined coerenti con Drawer.
  Empty states minimali "Nessun [X]" senza struttura standard.
  Status badge senza dot colorato leading.
  Mancanza di counts inline nei filter chips multi-select.
  Overflow menu kebab unico per tutte le azioni: 13 azioni dirette + overflow per il resto.
