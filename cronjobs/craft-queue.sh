# Absoluter Pfad zum Verzeichnis dieses Scripts – notwendig, weil Cron
# das Script mit dem Home-Verzeichnis als Working Directory ausführt,
# nicht mit dem Verzeichnis des Scripts selbst.
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

# Lockfile-Name – verhindert, dass mehrere Instanzen gleichzeitig laufen
LOCKFILE="$SCRIPTDIR/craft-queue.lock"

# Nutze flock, um gleichzeitige Ausführung zu verhindern
/usr/bin/flock -n "$LOCKFILE" /usr/bin/php "$SCRIPTDIR/../craft" queue/run