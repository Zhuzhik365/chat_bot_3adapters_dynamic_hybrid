#!/bin/sh
set -e

mkdir -p /app/data

if [ ! -e /app/data/db.sqlite3 ]; then
  touch /app/data/db.sqlite3
fi

rm -f /app/db.sqlite3
ln -s /app/data/db.sqlite3 /app/db.sqlite3

python manage.py migrate --noinput

exec python manage.py runserver 0.0.0.0:8000
