---
name: Go Live Checklist
about: Aufgaben vor dem Launch
labels: go-live
---
## Allgemein

### Funktion

- [ ] Formulare getestet
- [ ] Formularempfänger richtig gesetzt

### Sicherheit

- [ ] Projektspezifisches Admin-Passwort ist gesetzt

### Backend

- [ ] Pflichtfelder sind gesetzt
- [ ] Alle Asset Field Layouts haben ein Feld für einen Alt-Tag

### Code Qualität

- [ ] HTML Validierung ist durchgeführt

### Frontend

- [ ] Logo verlinkt auf Startseite

### Hosting

- [ ] SSL eingerichtet und 301 redirect von non-SSL auf SSL
- [ ] 301 redirect von www auf non-www
- [ ] HSTS ist activiert
- [ ] OSCP-Anheftung ist activeiert
- [ ] PHP memory limit ist `1024M` oder höher

### SEO

- [ ] Canonical Tags zwischen Sprachen sind angelegt
- [ ] Google Page Speed Test ist auf allen ausgeführt, Befunde als issues angelegt
- [ ] Google Page Speed issues sind umgesetzt
- [ ] Sitemap ist eingerichtet

### Sonstiges

- [ ] Favicon ist mit Realfavicon Generator angelegt
- [ ] 404-Seite ist angelegt
- [ ] Content-Security-Policy ist umgesetzt

### Suchmaschinen und Sichtbarkeit

- [ ] Alte Adressen haben neue Seite oder sind redirected
- [ ] Website ist in Google Search Console eingerichtet
- [ ] Sitemap ist in Google Search Console angegeben
- [ ] Google Analytics ist eingerichtet

## Craft CMS

### Erstinbetriebnahme auf staging/production

- [ ] Composer update auf neuste Version
- [ ] Asset Index ist bereinigt
- [ ] Ordner storage auf Hosting gelöscht
- [ ] Caches sind gelöscht
- [ ] Cronjobs sind angelegt

