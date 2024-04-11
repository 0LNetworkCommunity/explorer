#!/bin/bash

cd web-app/

git config --global user.name 'github-actions'
git config --global user.email 'github-actions@github.com'

git fetch --all

ADDED_ENTRIES=""
CHANGED_ENTRIES=""
REMOVED_ENTRIES=""

VERSION_PATTERN='^\[([0-9]+)\.([0-9]+)\.([0-9]+)\]'

VERSIONS=()
while IFS= read -r line; do
    if [[ $line =~ $VERSION_PATTERN ]]; then
        VERSIONS+=("${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.${BASH_REMATCH[3]}")
    fi
done < <(git log --pretty=format:"%s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev)


LATEST_VERSION="0.0.0"
for version in "${VERSIONS[@]}"; do
    if [[ "$version" > "$LATEST_VERSION" ]]; then
        LATEST_VERSION=$version
    fi
done

CURRENT_DATE=$(date "+%Y-%m-%d")


while IFS= read -r commit; do
    case "$commit" in
    "[+]"*) ADDED_ENTRIES+="- ${commit:4}\n" ;;
    "[*]"*) CHANGED_ENTRIES+="- ${commit:4}\n" ;;
    "[-]"*) REMOVED_ENTRIES+="- ${commit:4}\n" ;;
    esac
done < <(git log --pretty=format:"%s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev)


NEW_ENTRY="## [$LATEST_VERSION] - $CURRENT_DATE\n\n### Added\n\n$ADDED_ENTRIES\n### Changed\n\n$CHANGED_ENTRIES\n### Removed\n\n$REMOVED_ENTRIES\n"

if [ -f "CHANGELOG.md" ]; then
    echo -e "$NEW_ENTRY$(cat CHANGELOG.md)" > TEMP_CHANGELOG.md
    mv TEMP_CHANGELOG.md CHANGELOG.md
else
    echo -e "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n$NEW_ENTRY" > CHANGELOG.md
fi

git add CHANGELOG.md
git commit -m "chore: update changelog"