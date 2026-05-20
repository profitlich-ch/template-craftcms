#!/usr/bin/bash

# Refresh expired cache every hour at 5 minutes past the hour.
# https://putyourlightson.com/plugins/blitz#cron-jobs

# Absoluter Pfad zum Verzeichnis dieses Scripts – notwendig, weil Cron
# das Script mit dem Home-Verzeichnis als Working Directory ausführt.
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

# Craft path
CRAFT_PATH="$SCRIPTDIR/../craft"

/usr/bin/php "$CRAFT_PATH" blitz/cache/refresh-expired