# Refresh cache tagged with the tags "home" and "listing" every day at 5 am.
# https://putyourlightson.com/plugins/blitz#cron-jobs

# Absoluter Pfad zum Verzeichnis dieses Scripts – notwendig, weil Cron
# das Script mit dem Home-Verzeichnis als Working Directory ausführt.
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

/usr/bin/php "$SCRIPTDIR/../craft" blitz/cache/refresh-tagged home,listing
