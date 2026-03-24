#!/usr/bin/env bash
set -euo pipefail

# Encrypt/decrypt app env files with OpenSSL.
# Defaults are scoped to apps/web in this repository.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/web"
PLAIN_ENV="$APP_DIR/.env.local"
ENCRYPTED_ENV="$APP_DIR/.env.encrypted"

usage() {
  cat <<'EOF'
Usage:
  tools/env-crypto.sh status
  tools/env-crypto.sh encrypt [plain_path] [encrypted_path]
  tools/env-crypto.sh decrypt [encrypted_path] [plain_path]
  tools/env-crypto.sh dev
  tools/env-crypto.sh clean

Passphrase:
  Set QCS_ENV_PASSPHRASE in your shell, or enter it when prompted.

Examples:
  tools/env-crypto.sh encrypt
  tools/env-crypto.sh decrypt
  tools/env-crypto.sh dev
EOF
}

require_openssl() {
  if ! command -v openssl >/dev/null 2>&1; then
    echo "error: openssl is required" >&2
    exit 1
  fi
}

read_passphrase() {
  if [[ -n "${QCS_ENV_PASSPHRASE:-}" ]]; then
    PASSPHRASE="$QCS_ENV_PASSPHRASE"
    return
  fi

  read -r -s -p "Enter env encryption passphrase: " PASSPHRASE
  echo
  if [[ -z "$PASSPHRASE" ]]; then
    echo "error: empty passphrase" >&2
    exit 1
  fi
}

encrypt_env() {
  local plain="${1:-$PLAIN_ENV}"
  local enc="${2:-$ENCRYPTED_ENV}"

  [[ -f "$plain" ]] || { echo "error: plaintext env not found: $plain" >&2; exit 1; }
  read_passphrase

  umask 077
  openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
    -in "$plain" -out "$enc" -pass "pass:$PASSPHRASE"

  echo "encrypted: $enc"
}

decrypt_env() {
  local enc="${1:-$ENCRYPTED_ENV}"
  local plain="${2:-$PLAIN_ENV}"

  [[ -f "$enc" ]] || { echo "error: encrypted env not found: $enc" >&2; exit 1; }
  read_passphrase

  umask 077
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
    -in "$enc" -out "$plain" -pass "pass:$PASSPHRASE"

  chmod 600 "$plain" || true
  echo "decrypted: $plain"
}

status_env() {
  if [[ -f "$ENCRYPTED_ENV" ]]; then
    echo "encrypted file present: $ENCRYPTED_ENV"
  else
    echo "encrypted file missing: $ENCRYPTED_ENV"
  fi

  if [[ -f "$PLAIN_ENV" ]]; then
    local count
    count="$(grep -Ec '^[A-Za-z_][A-Za-z0-9_]*=' "$PLAIN_ENV" || true)"
    echo "plaintext file present: $PLAIN_ENV (assignments=$count)"
  else
    echo "plaintext file absent: $PLAIN_ENV"
  fi
}

clean_env() {
  if [[ -f "$PLAIN_ENV" ]]; then
    rm -f "$PLAIN_ENV"
    echo "removed: $PLAIN_ENV"
  else
    echo "no plaintext file to remove"
  fi
}

dev_with_ephemeral_env() {
  require_openssl
  [[ -f "$ENCRYPTED_ENV" ]] || { echo "error: $ENCRYPTED_ENV not found" >&2; exit 1; }

  read_passphrase

  cleanup() {
    rm -f "$PLAIN_ENV"
  }
  trap cleanup EXIT INT TERM

  umask 077
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
    -in "$ENCRYPTED_ENV" -out "$PLAIN_ENV" -pass "pass:$PASSPHRASE"
  chmod 600 "$PLAIN_ENV" || true

  (
    cd "$APP_DIR"
    npm run dev
  )
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    status)
      status_env
      ;;
    encrypt)
      require_openssl
      encrypt_env "${2:-}" "${3:-}"
      ;;
    decrypt)
      require_openssl
      decrypt_env "${2:-}" "${3:-}"
      ;;
    dev)
      dev_with_ephemeral_env
      ;;
    clean)
      clean_env
      ;;
    -h|--help|help|"")
      usage
      ;;
    *)
      echo "error: unknown command: $cmd" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
