# Lockfile-Name (frei wählbar, aber eindeutig)
LOCKFILE="./craft-queue.lock"

# Nutze flock, um gleichzeitige Ausführung zu verhindern
/usr/bin/flock -n "$LOCKFILE" /usr/bin/php ../craft queue/run
