# GitHub Wiki Setup and Sync Guide

A comprehensive guide for setting up and maintaining your Budget Tracker documentation in GitHub's wiki system.

## 📖 Table of Contents

1. [GitHub Wiki Overview](#github-wiki-overview)
2. [Initial Wiki Setup](#initial-wiki-setup)
3. [Cloning and Local Setup](#cloning-and-local-setup)
4. [Documentation Migration](#documentation-migration)
5. [Automated Sync Scripts](#automated-sync-scripts)
6. [Wiki Management](#wiki-management)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## GitHub Wiki Overview

### What is GitHub Wiki?

GitHub Wiki is a built-in documentation system that provides:

- **Separate Git Repository**: Wiki content is stored in a separate `.wiki` repository
- **Markdown Support**: Full Markdown formatting with GitHub flavored extensions
- **Web Interface**: Built-in web editor for quick updates
- **Version Control**: Full Git history and branching capabilities
- **Integration**: Seamless integration with your main repository

### Benefits for Documentation

- **Centralized Documentation**: All docs in one searchable location
- **Easy Access**: Direct links from your repository
- **Collaborative Editing**: Team members can contribute easily
- **Professional Appearance**: Clean, GitHub-styled presentation
- **SEO Friendly**: Indexed by search engines

---

## Initial Wiki Setup

### Step 1: Enable Wiki for Your Repository

1. **Navigate to Repository Settings**:

   ```
   https://github.com/[username]/[repository-name]/settings
   ```

2. **Enable Wiki Feature**:

   - Scroll down to "Features" section
   - Check the "Wikis" checkbox
   - Click "Save changes"

3. **Verify Wiki Access**:
   - Go to your repository main page
   - Click the "Wiki" tab (should now be visible)
   - Click "Create the first page" if prompted

### Step 2: Create Initial Wiki Structure

1. **Create Home Page**:

   ```markdown
   # Budget Tracker Documentation

   Welcome to the comprehensive documentation for the Budget vs Actual Tracker 2025.

   ## Quick Navigation

   - [[User Guide]] - Complete user manual
   - [[Technical Guide]] - Developer documentation
   - [[Application Features]] - Feature reference
   - [[Development Workflow]] - Developer setup guide

   ## Getting Started

   For new users, start with the [[User Guide]].
   For developers, begin with the [[Development Workflow]].
   ```

2. **Save the Home Page**:
   - Enter content in the web editor
   - Add commit message: "Initial wiki setup"
   - Click "Save Page"

---

## Cloning and Local Setup

### Step 3: Clone Wiki Repository

1. **Get Wiki Clone URL**:

   ```bash
   # Your wiki repository URL will be:
   https://github.com/[username]/[repository-name].wiki.git
   ```

2. **Clone Wiki Locally**:

   ```bash
   # Navigate to your projects directory
   cd /path/to/your/projects

   # Clone the wiki repository
   git clone https://github.com/[username]/[repository-name].wiki.git
   cd [repository-name].wiki
   ```

3. **Verify Clone**:

   ```bash
   # List files (should see Home.md)
   ls -la

   # Check git status
   git status

   # View remote configuration
   git remote -v
   ```

### Step 4: Set Up Local Development

1. **Configure Git (if not already done)**:

   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```

2. **Create Development Branch (Optional)**:
   ```bash
   git checkout -b documentation-update
   ```

---

## Documentation Migration

### Step 5: Copy Documentation Files

1. **Copy Files from Main Repository**:

   ```bash
   # From your main repository docs folder to wiki folder
   cp /path/to/budget-tracker/docs/USER_GUIDE.md ./User-Guide.md
   cp /path/to/budget-tracker/docs/TECHNICAL_GUIDE.md ./Technical-Guide.md
   cp /path/to/budget-tracker/docs/APPLICATION_FEATURES.md ./Application-Features.md
   cp /path/to/budget-tracker/docs/DEVELOPMENT_WORKFLOW.md ./Development-Workflow.md
   cp /path/to/budget-tracker/docs/DOCUMENTATION_INDEX.md ./Documentation-Index.md
   ```

2. **Convert File Names for Wiki**:
   GitHub Wiki requires specific naming conventions:
   ```bash
   # Wiki pages use hyphens instead of underscores
   # Spaces become hyphens
   # Example: "USER_GUIDE.md" becomes "User-Guide.md"
   ```

### Step 6: Update Internal Links

1. **Convert Markdown Links**:

   ```bash
   # Original format in docs:
   [User Guide](./USER_GUIDE.md)

   # Wiki format:
   [[User Guide]]
   # or
   [[User-Guide|User Guide]]
   ```

2. **Update Cross-References**:

   ```bash
   # Find and replace relative paths
   # Replace: ./docs/
   # With: (empty - wiki pages are in root)

   # Replace: .md extensions
   # With: (empty - wiki links don't need extensions)
   ```

### Step 7: Create Wiki Navigation

1. **Create Sidebar (\_Sidebar.md)**:

   ```markdown
   ## Documentation

   ### Main Guides

   - [[User Guide]]
   - [[Technical Guide]]
   - [[Application Features]]
   - [[Development Workflow]]

   ### Quick Reference

   - [[Documentation Index]]
   - [[Feature Matrix|Application Features#feature-matrix]]
   - [[API Reference|Technical Guide#api-reference]]

   ### Planning Features

   - [[2026 Planning Overview|Planning-Overview]]
   - [[Implementation Status|Planning-Status]]
   ```

2. **Create Footer (\_Footer.md)**:
   ```markdown
   ---

   **Budget Tracker 2025** | [Main Repository](https://github.com/[username]/[repository-name]) | Last Updated: June 2025
   ```

---

## Automated Sync Scripts

### Step 8: Create Sync Scripts

1. **Create sync-to-wiki.sh**:

   ```bash
   #!/bin/bash

   # Budget Tracker Documentation Sync Script
   # Syncs documentation from main repo to wiki

   MAIN_REPO_PATH="/path/to/budget-tracker"
   WIKI_REPO_PATH="/path/to/budget-tracker.wiki"

   echo "🔄 Syncing documentation to wiki..."

   # Function to convert filename for wiki
   convert_filename() {
       echo "$1" | sed 's/_/-/g' | sed 's/\.md$//'
   }

   # Copy and rename files
   cp "$MAIN_REPO_PATH/docs/USER_GUIDE.md" "$WIKI_REPO_PATH/User-Guide.md"
   cp "$MAIN_REPO_PATH/docs/TECHNICAL_GUIDE.md" "$WIKI_REPO_PATH/Technical-Guide.md"
   cp "$MAIN_REPO_PATH/docs/APPLICATION_FEATURES.md" "$WIKI_REPO_PATH/Application-Features.md"
   cp "$MAIN_REPO_PATH/docs/DEVELOPMENT_WORKFLOW.md" "$WIKI_REPO_PATH/Development-Workflow.md"
   cp "$MAIN_REPO_PATH/docs/DOCUMENTATION_INDEX.md" "$WIKI_REPO_PATH/Documentation-Index.md"

   # Navigate to wiki directory
   cd "$WIKI_REPO_PATH"

   # Convert internal links
   for file in *.md; do
       if [ -f "$file" ]; then
           # Convert relative links to wiki links
           sed -i 's|\](./docs/|\]\[\[|g' "$file"
           sed -i 's|\.md)|]]|g' "$file"
           sed -i 's|\[Documentation Index\](./DOCUMENTATION_INDEX.md)|\[\[Documentation-Index\|Documentation Index\]\]|g' "$file"
       fi
   done

   # Add and commit changes
   git add .
   git commit -m "📚 Update documentation - $(date '+%Y-%m-%d %H:%M:%S')"
   git push origin master

   echo "✅ Documentation sync complete!"
   ```

2. **Make Script Executable**:

   ```bash
   chmod +x sync-to-wiki.sh
   ```

3. **Create PowerShell Version (Windows)**:

   ```powershell
   # sync-to-wiki.ps1
   param(
       [string]$MainRepoPath = "C:\Users\OrienteMP\projects\budgetvsactual\budget-tracker",
       [string]$WikiRepoPath = "C:\Users\OrienteMP\projects\budgetvsactual\budget-tracker.wiki"
   )

   Write-Host "🔄 Syncing documentation to wiki..." -ForegroundColor Blue

   # Copy files with wiki naming convention
   Copy-Item "$MainRepoPath\docs\USER_GUIDE.md" "$WikiRepoPath\User-Guide.md" -Force
   Copy-Item "$MainRepoPath\docs\TECHNICAL_GUIDE.md" "$WikiRepoPath\Technical-Guide.md" -Force
   Copy-Item "$MainRepoPath\docs\APPLICATION_FEATURES.md" "$WikiRepoPath\Application-Features.md" -Force
   Copy-Item "$MainRepoPath\docs\DEVELOPMENT_WORKFLOW.md" "$WikiRepoPath\Development-Workflow.md" -Force
   Copy-Item "$MainRepoPath\docs\DOCUMENTATION_INDEX.md" "$WikiRepoPath\Documentation-Index.md" -Force

   # Navigate to wiki directory
   Set-Location $WikiRepoPath

   # Convert internal links (basic replacement)
   Get-ChildItem *.md | ForEach-Object {
       $content = Get-Content $_.FullName -Raw
       $content = $content -replace '\]\(\./docs/', ']][['
       $content = $content -replace '\.md\)', ']]'
       Set-Content $_.FullName $content
   }

   # Git operations
   git add .
   git commit -m "📚 Update documentation - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
   git push origin master

   Write-Host "✅ Documentation sync complete!" -ForegroundColor Green
   ```

---

## Wiki Management

### Step 9: Regular Maintenance

1. **Daily Sync Process**:

   ```bash
   # Quick sync command
   ./sync-to-wiki.sh

   # Or manually:
   cd /path/to/wiki
   git pull origin master  # Get latest changes
   # Make updates
   git add .
   git commit -m "Update documentation"
   git push origin master
   ```

2. **Branch Management**:

   ```bash
   # Create feature branch for major updates
   git checkout -b feature/major-update

   # Make changes, then merge
   git checkout master
   git merge feature/major-update
   git push origin master
   ```

### Step 10: Wiki Configuration

1. **Wiki Settings** (via GitHub web interface):

   - Navigate to Wiki tab
   - Click "Edit" on any page
   - Use the gear icon for wiki settings
   - Configure:
     - Public/Private access
     - Edit permissions
     - Page order

2. **Create Wiki Templates**:

   ```markdown
   <!-- _templates/feature-page.md -->

   # Feature Name

   **Status**: ✅ Production Ready | 🚧 In Development | 📋 Planned

   ## Overview

   [Brief description]

   ## Key Capabilities

   - Capability 1
   - Capability 2

   ## Usage

   [How to use this feature]

   ## Technical Details

   [Implementation notes]

   ## Related Pages

   - [[Related Page 1]]
   - [[Related Page 2]]
   ```

---

## Best Practices

### Documentation Standards

1. **Consistent Naming**:

   ```
   ✅ Good: User-Guide.md, Technical-Guide.md
   ❌ Avoid: user_guide.md, Technical Guide.md
   ```

2. **Link Conventions**:

   ```markdown
   # Internal wiki links

   [[Page Name]]
   [[Page-Name|Display Text]]

   # External links

   [Main Repository](https://github.com/username/repo)
   ```

3. **Page Structure**:

   ```markdown
   # Page Title

   Brief description of the page content.

   ## Table of Contents

   - [Section 1](#section-1)
   - [Section 2](#section-2)

   ## Content sections...

   ---

   **Related**: [[Other Page]] | **Updated**: Month Year
   ```

### Sync Workflow

1. **Before Major Updates**:

   ```bash
   # Pull latest wiki changes
   cd /path/to/wiki
   git pull origin master

   # Create backup branch
   git checkout -b backup-$(date +%Y%m%d)
   git checkout master
   ```

2. **After Updates**:
   ```bash
   # Test links and formatting
   # Review changes in GitHub
   # Update any broken references
   ```

### Team Collaboration

1. **Wiki Edit Permissions**:

   - Repository collaborators can edit wiki
   - Consider creating wiki-specific guidelines
   - Use commit messages to track changes

2. **Review Process**:
   ```bash
   # For major changes, use pull requests on main repo
   # Then sync to wiki after approval
   ./sync-to-wiki.sh
   ```

---

## Troubleshooting

### Common Issues

1. **Wiki Clone Issues**:

   ```bash
   # Error: Repository not found
   # Solution: Ensure wiki is enabled in repository settings

   # Error: Permission denied
   # Solution: Check GitHub authentication
   git config --global credential.helper store
   ```

2. **Link Conversion Problems**:

   ```bash
   # Manual link fixing
   grep -r "\](\./" *.md  # Find unconverted links
   # Manually update or enhance sync script
   ```

3. **Sync Script Failures**:

   ```bash
   # Check file paths
   ls -la /path/to/main/repo/docs/
   ls -la /path/to/wiki/repo/

   # Verify git status
   git status
   git remote -v
   ```

### Advanced Troubleshooting

1. **Wiki History Issues**:

   ```bash
   # View wiki commit history
   git log --oneline

   # Revert problematic commit
   git revert <commit-hash>
   git push origin master
   ```

2. **Large File Issues**:
   ```bash
   # Wiki repos have size limits
   # Use .gitignore for large files
   echo "*.pdf" >> .gitignore
   echo "*.png" >> .gitignore  # Consider image optimization
   ```

---

## Quick Start Commands

### One-Time Setup

```bash
# 1. Enable wiki in GitHub repository settings
# 2. Clone wiki repository
git clone https://github.com/[username]/[repository-name].wiki.git
cd [repository-name].wiki

# 3. Copy documentation files
cp /path/to/main/repo/docs/*.md ./

# 4. Rename files for wiki convention
mv USER_GUIDE.md User-Guide.md
mv TECHNICAL_GUIDE.md Technical-Guide.md
mv APPLICATION_FEATURES.md Application-Features.md
mv DEVELOPMENT_WORKFLOW.md Development-Workflow.md

# 5. Initial commit
git add .
git commit -m "📚 Initial documentation import"
git push origin master
```

### Regular Updates

```bash
# Quick sync
cd /path/to/wiki
git pull origin master
# Copy updated files from main repo
git add .
git commit -m "📚 Update documentation - $(date)"
git push origin master
```

---

## Automation Options

### GitHub Actions (Advanced)

1. **Create .github/workflows/sync-wiki.yml** (in main repository):

   ```yaml
   name: Sync Documentation to Wiki

   on:
     push:
       paths:
         - "docs/**"
     workflow_dispatch:

   jobs:
     sync-wiki:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout main repo
           uses: actions/checkout@v3

         - name: Checkout wiki
           uses: actions/checkout@v3
           with:
             repository: ${{ github.repository }}.wiki
             path: wiki
             token: ${{ secrets.GITHUB_TOKEN }}

         - name: Copy and convert files
           run: |
             cp docs/USER_GUIDE.md wiki/User-Guide.md
             cp docs/TECHNICAL_GUIDE.md wiki/Technical-Guide.md
             cp docs/APPLICATION_FEATURES.md wiki/Application-Features.md
             # Add link conversion logic here

         - name: Commit and push to wiki
           run: |
             cd wiki
             git config user.name github-actions
             git config user.email github-actions@github.com
             git add .
             git commit -m "Auto-sync documentation from main repo" || exit 0
             git push
   ```

### Local Automation

1. **Add to package.json**:

   ```json
   {
     "scripts": {
       "sync-wiki": "./scripts/sync-to-wiki.sh",
       "wiki-dev": "cd ../budget-tracker.wiki && git pull && code ."
     }
   }
   ```

2. **Git Hooks**:
   ```bash
   # .git/hooks/post-commit
   #!/bin/bash
   if git diff --name-only HEAD~1 | grep -q "^docs/"; then
     echo "Documentation changed, consider syncing to wiki"
     echo "Run: npm run sync-wiki"
   fi
   ```

---

## Conclusion

Your GitHub Wiki is now set up to house comprehensive documentation for the Budget Tracker application. The wiki provides a professional, searchable, and collaborative documentation platform that integrates seamlessly with your repository.

**Next Steps**:

1. Set up the initial wiki pages
2. Configure sync scripts for your environment
3. Train team members on wiki contribution process
4. Establish regular sync schedule

**Maintenance**:

- Sync documentation after major feature updates
- Review and update links regularly
- Monitor wiki access and usage
- Keep sync scripts updated

---

**Last Updated**: June 2025  
**Version**: 1.0  
**Compatible**: GitHub Wiki, GitHub Enterprise
