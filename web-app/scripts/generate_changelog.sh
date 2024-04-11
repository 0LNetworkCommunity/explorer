#!/bin/bash

cd web-app/

git config --global user.name 'github-actions'
git config --global user.email 'github-actions@github.com'

git fetch --all

ADDED_ENTRIES=""
CHANGED_ENTRIES=""
REMOVED_ENTRIES=""

while IFS= read -r line; do
    case "$line" in
    "[+]"*) ADDED_ENTRIES+="- ${line:4}\n" ;;
    "[*]"*) CHANGED_ENTRIES+="- ${line:4}\n" ;;
    "[-]"*) REMOVED_ENTRIES+="- ${line:4}\n" ;;
    esac
done < <(git log --pretty=format:"%s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev)

CURRENT_DATE=$(date "+%Y-%m-%d")

if [ -f "CHANGELOG.md" ]; then
    LAST_VERSION=$(grep -oP "\[\K[0-9]+\.[0-9]+\.[0-9]+(?=\])" CHANGELOG.md | head -1)
else
    LAST_VERSION="0.0.0"
fi

IFS='.' read -ra VERSION <<< "$LAST_VERSION"
MAJOR=${VERSION[0]}
MINOR=${VERSION[1]}
PATCH=${VERSION[2]}

NEW_MINOR=$((MINOR+1))
NEW_VERSION="$MAJOR.$NEW_MINOR.0"

NEW_ENTRY="## [$NEW_VERSION] - $CURRENT_DATE\n\n### Added\n\n$ADDED_ENTRIES\n### Changed\n\n$CHANGED_ENTRIES\n### Removed\n\n$REMOVED_ENTRIES\n"

if [ -f "CHANGELOG.md" ]; then
    echo -e "$NEW_ENTRY$(cat CHANGELOG.md)" > TEMP_CHANGELOG.md
    mv TEMP_CHANGELOG.md CHANGELOG.md
else
    echo -e "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n$NEW_ENTRY" > CHANGELOG.md
fi

git add CHANGELOG.md
git commit -m "chore: update changelog"