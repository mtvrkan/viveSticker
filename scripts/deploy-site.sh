#!/usr/bin/env bash
# Builds the site into the gh-pages branch, which GitHub Pages serves at sticker.vivepdf.com.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
branch="gh-pages"
push=0

for arg in "$@"; do
  case "$arg" in
    --push) push=1 ;;
    *) echo "usage: scripts/deploy-site.sh [--push]" >&2; exit 2 ;;
  esac
done

if [ -n "$(git -C "$root" status --porcelain)" ]; then
  echo "There are uncommitted changes; commit them first so the published site matches a commit." >&2
  exit 1
fi

pnpm --dir "$root" install --frozen-lockfile
# The site is served from the domain root (static/CNAME), so no base path.
BASE_PATH='' pnpm --dir "$root" build
touch "$root/build/.nojekyll"

source_sha="$(git -C "$root" rev-parse --short HEAD)"
work="$(mktemp -d "${TMPDIR:-/tmp}/vivesticker-site.XXXXXX")"
cleanup() {
  git -C "$root" worktree remove --force "$work" >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

git -C "$root" fetch origin "$branch" >/dev/null 2>&1 || true
if git -C "$root" show-ref --verify --quiet "refs/heads/$branch"; then
  git -C "$root" worktree add "$work" "$branch"
elif git -C "$root" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
  git -C "$root" worktree add -b "$branch" "$work" "origin/$branch"
else
  git -C "$root" worktree add --detach "$work"
  git -C "$work" checkout --orphan "$branch"
fi

# Replace everything except the worktree's .git file with the fresh build.
git -C "$work" rm -rf --quiet --ignore-unmatch .
find "$work" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$root/build/." "$work/"

git -C "$work" add --all
if git -C "$work" diff --cached --quiet; then
  echo "The published site is already up to date with $source_sha."
else
  git -C "$work" commit --quiet -m "Publish the website from $source_sha"
  echo "Committed the site from $source_sha to $branch."
fi

if [ "$push" -eq 1 ]; then
  git -C "$root" push origin "$branch"
else
  echo "Not pushed. Run with --push to publish $branch to GitHub Pages."
fi
