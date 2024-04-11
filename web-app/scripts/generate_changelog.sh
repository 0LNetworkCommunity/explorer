#!/bin/bash

cd web-app/

git config --global user.name 'github-actions'
git config --global user.email 'github-actions@github.com'

git fetch --all

# Generate the new changelog entries
git log --pretty=format:"- %s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev > NEW_CHANGES.md

ADDED=$(git log --pretty=format:"%s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev | grep '^\[+\]' | sed 's/^\[+\] //')
CHANGED=$(git log --pretty=format:"%s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev | grep '^\[\*\]' | sed 's/^\[\*\] //')
REMOVED=$(git log --pretty=format:"%s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev | grep '^\[-\]' | sed 's/^\[-\] //')

CURRENT_DATE=$(date "+%Y-%m-%d")

# Extract the latest version of the CHANGELOG.md file, if it exists
if [ -f "CHANGELOG.md" ]; then
    LAST_VERSION=$(grep -oP "\[\K[0-9]+\.[0-9]+\.[0-9]+(?=\])" CHANGELOG.md | head -1)
else
    LAST_VERSION="0.0.0"
fi

# Breakdown the version into major, minor and patch versions
IFS='.' read -ra VERSION <<< "$LAST_VERSION"
MAJOR=${VERSION[0]}
MINOR=${VERSION[1]}
PATCH=${VERSION[2]}

NEW_MINOR=$((MINOR+1))
NEW_VERSION="$MAJOR.$NEW_MINOR.0"


NEW_ENTRY="## [$NEW_VERSION] - $CURRENT_DATE\n\n### Added\n\n$ADDED\n\n### Changed\n\n$CHANGED\n\n### Removed\n\n$REMOVED\n"

if [ -f "CHANGELOG.md" ]; then
    echo -e "$NEW_ENTRY\n$(cat CHANGELOG.md)" > TEMP_CHANGELOG.md
    mv TEMP_CHANGELOG.md CHANGELOG.md
else
    echo -e "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n$NEW_ENTRY" > CHANGELOG.md
fi

rm NEW_CHANGES.md

git add CHANGELOG.md
git commit -m "chore: update changelog"