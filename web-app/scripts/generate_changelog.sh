#!/bin/bash

cd web-app/

git config --global user.name 'github-actions'
git config --global user.email 'github-actions@github.com'

git fetch --all

# Generate the new changelog entries
git log --pretty=format:"- %s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev > NEW_CHANGES.md

# Prepend the new changes to the top of the existing CHANGELOG.md

# Check if CHANGELOG.md exists and prepend accordingly
if [ -f "CHANGELOG.md" ]; then
    echo -e "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n## [Unreleased]\n\n$(cat NEW_CHANGES.md)\n\n$(cat CHANGELOG.md)" > TEMP_CHANGELOG.md
    mv TEMP_CHANGELOG.md CHANGELOG.md
else
    echo -e "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n## [Unreleased]\n\n$(cat NEW_CHANGES.md)" > CHANGELOG.md
fi

# Clean up the temporary file
rm NEW_CHANGES.md

# Add and commit the updated CHANGELOG.md
git add CHANGELOG.md
git commit -m "chore: update changelog"
