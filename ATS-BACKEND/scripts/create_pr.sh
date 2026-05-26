git push -u origin $BRANCH

#!/bin/sh
set -e

# Script to create a branch with the deployment changes and push to origin.
# Run this from the repository root: ./scripts/create_pr.sh

BRANCH=feature/laravel-cloud-deploy
MSG="ci: add Laravel Cloud deployment entrypoint and GHCR publish workflow"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: must run inside a git repository root"
  exit 1
fi

git fetch origin

if git show-ref --verify --quiet refs/heads/$BRANCH; then
  echo "Branch $BRANCH already exists locally. Checking it out."
  git checkout $BRANCH
else
  git checkout -b $BRANCH
fi

git add Dockerfile entrypoint.sh .dockerignore README.md LARAVEL_CLOUD.md .github/workflows/publish-image.yml || true

if git diff --staged --quiet; then
  echo "No staged changes to commit. If you already committed, pushing branch..."
else
  git commit -m "$MSG"
fi

git push -u origin $BRANCH

# Try to build a PR URL
ORIGIN_URL=$(git config --get remote.origin.url || true)
if [ -n "$ORIGIN_URL" ]; then
  # Convert git@github.com:owner/repo.git -> https://github.com/owner/repo
  case "$ORIGIN_URL" in
    git@github.com:*)
      REPO_PATH=${ORIGIN_URL#git@github.com:}
      REPO_PATH=${REPO_PATH%.git}
      BASE_URL="https://github.com/$REPO_PATH"
      ;;
    https://github.com/*)
      REPO_PATH=${ORIGIN_URL#https://github.com/}
      REPO_PATH=${REPO_PATH%.git}
      BASE_URL="https://github.com/$REPO_PATH"
      ;;
    *)
      BASE_URL=""
      ;;
  esac
  if [ -n "$BASE_URL" ]; then
    echo "Open a PR: $BASE_URL/pull/new/$BRANCH"
  fi
fi

echo "Done."
