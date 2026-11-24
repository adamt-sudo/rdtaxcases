#!/bin/bash
# The ONLY thing the GitHub deploy key can run on the server. It is installed once by the server's owner, as root, at
# /usr/local/bin/rdtaxcases-deploy (the deploy user can read and run it, not change it), and the key in
# /home/deploy/.ssh/authorized_keys is tied to it:
#
#   command="/usr/local/bin/rdtaxcases-deploy",restrict ssh-ed25519 AAAA... github-deploy
#
# so whatever command the key asks for, this script decides what happens. It knows three commands:
#
#   deploy <release-name> <sha256>   reads the built site (a .tar.gz) on standard input, checks its SHA-256, unpacks it as a new
#                                    release in /var/www/rdtaxcases-releases/<release-name>, checks it looks like the site, and
#                                    switches the "current" link to it (the live site changes in one atomic step)
#   rollback <release-name|previous> switches "current" to a release that is already on the server
#   list                             lists the releases, newest first, and says which one is live
#
# nginx keeps serving /var/www/rdtaxcases. That path is a link (made once, by root) to /var/www/rdtaxcases-releases/current, which
# is the link this script switches. The script writes only inside /var/www/rdtaxcases-releases. The newest 5 releases are kept.
set -euo pipefail
umask 022

REL=/var/www/rdtaxcases-releases
KEEP=5

fail() {
  echo "REFUSED: $*" >&2
  exit 1
}

# the command the key asked for, split on spaces (never run, only read)
read -r -a ARGS <<<"${SSH_ORIGINAL_COMMAND:-}"
CMD="${ARGS[0]:-}"

valid_name() { [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$ && "$1" != "current" ]]; }

# every release (a real folder, not a link, not hidden), newest first
releases() { find "$REL" -mindepth 1 -maxdepth 1 -type d ! -name '.*' -printf '%T@ %f\n' | sort -rn | cut -d' ' -f2-; }

current_name() { basename "$(readlink "$REL/current" 2>/dev/null || true)"; }

switch_to() {
  local name="$1"
  [ -d "$REL/$name" ] || fail "there is no release $name"
  ln -sfn "$REL/$name" "$REL/.current.new"
  mv -T "$REL/.current.new" "$REL/current" # one atomic step: the live site changes here
  echo "$(date -u +%FT%TZ) live: $name" >>"$REL/deploy.log"
}

prune() {
  local n=0 cur name
  cur="$(current_name)"
  while read -r name; do
    n=$((n + 1))
    if [ "$n" -le "$KEEP" ] || [ "$name" = "$cur" ]; then continue; fi
    rm -rf -- "${REL:?}/$name"
    echo "removed old release $name"
  done < <(releases)
}

case "$CMD" in
deploy)
  name="${ARGS[1]:-}"
  hash="${ARGS[2]:-}"
  valid_name "$name" || fail "the release name is not allowed"
  [[ "$hash" =~ ^[0-9a-f]{64}$ ]] || fail "the SHA-256 is missing or not valid"
  work="$(mktemp -d "$REL/.incoming.XXXXXX")"
  trap 'rm -rf "$work"' EXIT
  cat >"$work/site.tar.gz"
  echo "$hash  $work/site.tar.gz" | sha256sum -c --quiet - || fail "the file that arrived is not the file that was sent (SHA-256 differs)"
  mkdir "$work/site"
  tar -xzf "$work/site.tar.gz" -C "$work/site" --no-same-owner --no-same-permissions || fail "the package could not be unpacked"
  # it must look like the whole site, with the editor, and with the real login address
  for f in index.html 404.html sitemap.xml admin/index.html admin/config.yml; do
    [ -f "$work/site/$f" ] || fail "the package has no $f: this is not the built site"
  done
  if grep -q "REPLACE-WORKER" "$work/site/admin/config.yml"; then
    fail "the editor settings still have the placeholder login address"
  fi
  chmod -R go-w "$work/site"
  if [ -d "$REL/$name" ]; then
    echo "release $name is already on the server: switching to it"
  else
    mv "$work/site" "$REL/$name"
    touch "$REL/$name"
  fi
  switch_to "$name"
  prune
  echo "live: $name"
  ;;
rollback)
  name="${ARGS[1]:-}"
  if [ "$name" = "previous" ]; then
    cur="$(current_name)"
    name=""
    while read -r r; do
      if [ "$r" != "$cur" ]; then
        name="$r"
        break
      fi
    done < <(releases)
    [ -n "$name" ] || fail "there is no earlier release to go back to"
  fi
  valid_name "$name" || fail "the release name is not allowed"
  switch_to "$name"
  echo "live: $name"
  ;;
list)
  cur="$(current_name)"
  while read -r r; do
    if [ "$r" = "$cur" ]; then echo "$r   <- live now"; else echo "$r"; fi
  done < <(releases)
  ;;
*)
  fail "unknown command (this key can only run: deploy, rollback, list)"
  ;;
esac
