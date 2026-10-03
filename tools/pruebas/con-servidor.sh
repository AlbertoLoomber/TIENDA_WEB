#!/usr/bin/env bash
# Levanta el sitio en el puerto 8765 mientras corre el comando dado, y lo apaga al terminar.
#   tools/pruebas/con-servidor.sh node tools/pruebas/todo.js
cd "$(dirname "$0")/../.." || exit 1
python3 -m http.server -d web 8765 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:8765/ && break; sleep 0.2; done
"$@"
