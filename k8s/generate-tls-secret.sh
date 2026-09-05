#!/bin/bash
# Generates a self-signed TLS cert for the frontend and creates the K8s secret.
# Required because Keycloak's AUTH_SESSION_ID cookie is always Secure+SameSite=None
# (by design, to support cross-origin/iframe SSO checks), so browsers refuse to
# store it over plain HTTP. This is intentionally NOT committed to git.
set -e

NAMESPACE="${1:-media-storage}"
IP="${2:-192.168.1.100}"
DIR="$(dirname "$0")/certs"

mkdir -p "$DIR"

MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout "$DIR/tls.key" \
  -out "$DIR/tls.crt" \
  -subj "/CN=$IP" \
  -addext "subjectAltName=IP:$IP,DNS:media-storage.$IP.nip.io,DNS:localhost"

kubectl create secret tls media-storage-tls \
  --cert="$DIR/tls.crt" \
  --key="$DIR/tls.key" \
  -n "$NAMESPACE" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "TLS secret 'media-storage-tls' created/updated in namespace '$NAMESPACE'."
echo "Cert/key saved locally at $DIR (gitignored, never commit these)."
