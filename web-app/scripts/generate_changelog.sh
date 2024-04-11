#!/bin/bash

# Naviguer vers le dossier souhaité
cd web-app/

# Générer le changelog
git log --pretty=format:"- %s" feat/lei_changelog...feat/lei_changelog_dev > CHANGELOG.md

# Ajouter et commiter le changelog mis à jour
git add CHANGELOG.md
git commit -m "chore: update changelog"
