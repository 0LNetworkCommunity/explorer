#!/bin/bash

cd web-app/

git config --global user.name 'Nom de l’Auteur'
git config --global user.email 'email@exemple.com'

git fetch --all

git log --pretty=format:"- %s" origin/feat/lei_changelog...origin/feat/lei_changelog_dev > CHANGELOG.md

git add CHANGELOG.md
git commit -m "chore: update changelog"
