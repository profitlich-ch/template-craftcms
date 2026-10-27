#!/usr/bin/env bash
# Erzeugt die .env aus dem 1Password-Environment des Projekts.
# Aufruf als pre-start-Hook in .ddev/config.yaml, mit der Environment-ID:
#   exec-host: .ddev/env-from-1password.sh <environment-id>
#
# Jedes Projekt hat ein eigenes Environment. Eine Kopie der Vorlage, die noch
# deren ID trägt, bricht hier ab, statt still die Werte der Vorlage zu lesen.

set -euo pipefail

VORLAGE_NAME='template-craftcms'
VORLAGE_ID='gbjxqx27vd6ulhaqkldw5qvf5q'

id="${1:-}"
projekt=$(sed -n 's/^name:[[:space:]]*//p' .ddev/config.yaml | head -n1)

if [ -z "$id" ]; then
    echo "Keine 1Password-Environment-ID übergeben (siehe pre-start-Hook in .ddev/config.yaml)." >&2
    exit 1
fi

if [ "$id" = "$VORLAGE_ID" ] && [ "$projekt" != "$VORLAGE_NAME" ]; then
    cat >&2 <<EOF
Das Projekt "$projekt" liest noch das 1Password-Environment der Vorlage.
Eigenes Environment in 1Password anlegen und seine ID im pre-start-Hook
in .ddev/config.yaml eintragen (Handbuch: Craft CMS › Projekt aufsetzen).
EOF
    exit 1
fi

# Erst in eine Zwischendatei: Scheitert op, bleibt die bisherige .env erhalten.
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
# op gibt die Werte ohne Anführungszeichen aus; phpdotenv bricht bei einem
# Leerzeichen im Wert ab. Einfache Anführungszeichen übernimmt es wörtlich.
quote='/^[A-Za-z_][A-Za-z0-9_]*=/ {
    i = index($0, "="); v = substr($0, i + 1)
    if (v ~ /[[:space:]]/ && v !~ /^["\047]/ && v !~ /\047/) $0 = substr($0, 1, i) "\047" v "\047"
}
{ print }'
if op environment read "$id" | awk "$quote" > "$tmp"; then
    mv "$tmp" .env
    trap - EXIT
elif [ -f .env ]; then
    # Etwa abgelehnte Freigabe in 1Password: mit der bisherigen .env weiterarbeiten
    echo "1Password nicht erreichbar – ddev startet mit der bisherigen .env." >&2
else
    echo "1Password nicht erreichbar und keine .env vorhanden – ddev kann Craft nicht starten." >&2
    exit 1
fi
