#!/bin/sh
# Generates thumbnails directly against the database and upload volume,
# bypassing the app's admin API/JWT entirely. Meant to be run once, inside
# a pod that already has ffmpeg and the uploads PVC mounted (the running
# backend pod qualifies) after adding `postgresql-client` for psql.
#
# Usage: MEDIA_TYPE=VIDEO ./backfill-thumbnails.sh
#   MEDIA_TYPE   VIDEO or IMAGE (default: VIDEO)
#   UPLOAD_DIR   default: /home/uploads/  (must match app.upload.dir)
#   PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD: default to this project's
#     in-cluster postgres-service / media_storage_db / postgres / postgres

set -eu

MEDIA_TYPE="${MEDIA_TYPE:-VIDEO}"
UPLOAD_DIR="${UPLOAD_DIR:-/home/uploads/}"
export PGHOST="${PGHOST:-postgres-service}"
export PGPORT="${PGPORT:-5432}"
export PGDATABASE="${PGDATABASE:-media_storage_db}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

UPLOAD_DIR="${UPLOAD_DIR%/}/"
THUMB_DIR="${UPLOAD_DIR}thumbnails/"
mkdir -p "$THUMB_DIR"

ROWS_FILE="/tmp/thumbnail-backfill-rows.tsv"
psql -t -A -F "$(printf '\t')" -c \
  "SELECT id, file_path, stored_filename FROM media_files WHERE media_type = '${MEDIA_TYPE}' AND thumbnail_path IS NULL ORDER BY id" \
  > "$ROWS_FILE"

total=0
succeeded=0
failed=0

# Reading from a file (not a pipe) keeps the loop in the current shell so
# the counters below survive past the loop.
while IFS="$(printf '\t')" read -r id file_path stored_filename; do
  [ -z "$id" ] && continue
  total=$((total + 1))

  name_no_ext="${stored_filename%.*}"
  thumb_path="${THUMB_DIR}${name_no_ext}.jpg"

  if [ ! -f "$file_path" ]; then
    echo "[$id] SKIP - source file missing: $file_path"
    failed=$((failed + 1))
    continue
  fi

  if [ "$MEDIA_TYPE" = "VIDEO" ]; then
    SEEK_ARGS="-ss 1"
  else
    SEEK_ARGS=""
  fi

  # shellcheck disable=SC2086
  if ffmpeg -y $SEEK_ARGS -i "$file_path" -frames:v 1 -vf scale=320:-1 "$thumb_path" \
      >"/tmp/ffmpeg-$id.log" 2>&1 && [ -f "$thumb_path" ]; then
    psql -q -c "UPDATE media_files SET thumbnail_path = '${thumb_path}' WHERE id = ${id}"
    echo "[$id] OK -> $thumb_path"
    succeeded=$((succeeded + 1))
  else
    echo "[$id] FAILED - see /tmp/ffmpeg-$id.log"
    failed=$((failed + 1))
  fi
done < "$ROWS_FILE"

echo "Done: $succeeded/$total succeeded, $failed failed (media_type=$MEDIA_TYPE)."
