#!/usr/bin/env bash
# Deploys the site. Run this from the project folder:  ./deploy.sh
# git push does NOT deploy this site. This script does.
set -euo pipefail

TARGET="${BITACHON_SSH:-root@srv811922.hstgr.cloud}"
REMOTE_DIR="/opt/bitachon-site"

cd "$(dirname "$0")"

echo "Building pages..."
python3 build-pages.py

echo "Uploading site..."
# Product photos live only on the server (uploaded through the admin), so never push
# local copies over them.
rsync -az --exclude '/assets/products/' public/ "$TARGET:$REMOTE_DIR/public/"

# server.js is the app itself, so upload it and always restart. The restart is cheap and
# unconditional on purpose: a conditional one can leave a new file running the old process
# if a restart ever fails. ponytail: sub-second blip beats tracking deployed-vs-running state.
rsync -az server.js "$TARGET:$REMOTE_DIR/server.js"
ssh "$TARGET" "pm2 restart bitachon-site" >/dev/null

# The restart takes a moment, so wait for the site to actually answer before saying it worked.
echo "Checking the site..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  code=$(curl -s -o /dev/null -w "%{http_code}" https://bitachonjudaica.com/shop.html || true)
  if [ "$code" = "200" ]; then
    echo ""
    echo "Done. Your changes are live at https://bitachonjudaica.com"
    echo "If you do not see them, hold Shift and press the reload button."
    exit 0
  fi
  sleep 2
done

echo ""
echo "WARNING: the site is not responding (last status: $code)."
echo "The files were uploaded. Check https://bitachonjudaica.com in a browser."
exit 1
