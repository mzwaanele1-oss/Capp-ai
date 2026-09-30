#!/usr/bin/env bash
# CAPP AI - GitHub Push & Compilation Helper Script
# This script initializes the git repository, commits the project, and pushes to your GitHub repo.

set -e

echo "🚀 Preparing CAPP AI for GitHub Push & Compilation..."

# 1. Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: git is not installed. Please install git."
    exit 1
fi

# 2. Ask for GitHub Remote URL if not provided as argument
GITHUB_REPO_URL="$1"

if [ -z "$GITHUB_REPO_URL" ]; then
    echo "Enter your GitHub Repository URL (e.g. https://github.com/USERNAME/capp-ai.git):"
    read -r GITHUB_REPO_URL
fi

if [ -z "$GITHUB_REPO_URL" ]; then
    echo "❌ Error: GitHub Repository URL cannot be empty."
    exit 1
fi

# 3. Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing new git repository..."
    git init
    git branch -M main
fi

# 4. Configure remote
if git remote | grep -q 'origin'; then
    echo "🔄 Updating existing 'origin' remote..."
    git remote set-url origin "$GITHUB_REPO_URL"
else
    echo "🔗 Adding 'origin' remote..."
    git remote add origin "$GITHUB_REPO_URL"
fi

# 5. Stage files according to .gitignore
echo "📦 Staging files for commit..."
git add .

# 6. Commit
echo "💾 Creating commit..."
git commit -m "feat: complete CAPP AI with GitHub Actions compilation workflows" || echo "No new changes to commit."

# 7. Push to GitHub
echo "⬆️ Pushing to GitHub (main branch)..."
git push -u origin main

echo ""
echo "🎉 SUCCESS! Your code has been pushed to GitHub."
echo "⚡ GitHub Actions will now automatically compile your app:"
echo "   - Web Build Workflow: .github/workflows/compile-app.yml"
echo "   - Android APK Workflow: .github/workflows/compile-android-apk.yml"
echo "   - GitHub Pages: .github/workflows/deploy-github-pages.yml"
echo ""
echo "Go to https://github.com/$(echo "$GITHUB_REPO_URL" | sed -e 's/.*github.com[:\/]//' -e 's/\.git$//')/actions to view live compilation builds!"
