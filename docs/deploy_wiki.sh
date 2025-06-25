#!/bin/bash

# Budget Tracker Documentation Sync Script
# Syncs documentation from main repo to wiki

MAIN_REPO_PATH="C:\Users\OrienteMP\projects\budgetvsactual\budget-tracker"
WIKI_REPO_PATH="C:\Users\OrienteMP\projects\budgetvsactual\budget-tracker.wiki"

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