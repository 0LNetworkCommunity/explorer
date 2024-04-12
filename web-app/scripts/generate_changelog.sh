#!/bin/bash

cd web-app/

git config --global user.name 'github-actions'
git config --global user.email 'github-actions@github.com'

git fetch --all

ADDED_ENTRIES=""
CHANGED_ENTRIES=""
REMOVED_ENTRIES=""

# Use jq to read the version number directly from package.json
if [ -f "package.json" ]; then
    LATEST_VERSION=$(jq -r '.version' package.json)
else
    echo "package.json not found. Exiting..."
    exit 1
fi

CURRENT_DATE=$(date "+%Y-%m-%d")

# Process git log entries and categorize them into Added, Changed, and Removed
while IFS= read -r commit; do
    case "$commit" in
    "[+]"*) ADDED_ENTRIES+="- ${commit:4}\n" ;;
    "[*]"*) CHANGED_ENTRIES+="- ${commit:4}\n" ;;
    "[-]"*) REMOVED_ENTRIES+="- ${commit:4}\n" ;;
    esac
done < <(git log --pretty=format:"%s" origin/develop...origin/main)

NEW_ENTRY="## [$LATEST_VERSION] - $CURRENT_DATE\n\n### Added\n\n$ADDED_ENTRIES\n### Changed\n\n$CHANGED_ENTRIES\n### Removed\n\n$REMOVED_ENTRIES\n"

# Prepend new changelog entries to the existing CHANGELOG.md, or create it if it doesn't exist
if [ -f "CHANGELOG.md" ]; then
    echo -e "$NEW_ENTRY$(cat CHANGELOG.md)" > TEMP_CHANGELOG.md
    mv TEMP_CHANGELOG.md CHANGELOG.md
else
    echo -e "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n$NEW_ENTRY" > CHANGELOG.md
fi

git add CHANGELOG.md
git commit -m "chore: update changelog"
git push origin main

# Tag the current commit with the latest version and push the tag to the remote repository
git tag -a "$LATEST_VERSION" -m "Release $LATEST_VERSION"
git push origin "$LATEST_VERSION"
