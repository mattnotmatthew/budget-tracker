# PowerShell script to organize project files

Write-Host "Organizing project files..." -ForegroundColor Green

# Create directories if they don't exist
$directories = @(
    "docs",
    "scripts", 
    "config",
    "tests",
    "temp",
    "archive"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Define file patterns and their destination folders
$filePatterns = @{
    # Documentation files
    "*.md" = "docs"
    "*.txt" = "docs"
    "*.pdf" = "docs"
    
    # Script files (except main build scripts)
    "*.ps1" = "scripts"
    "*.sh" = "scripts"
    "*.bat" = "scripts"
    "*.cmd" = "scripts"
    
    # Config files (keep essential ones in root)
    "*.ini" = "config"
    "*.conf" = "config"
    "*.cfg" = "config"
    "*.yaml" = "config" 
    "*.yml" = "config"
    
    # Test files
    "*test*" = "tests"
    "*spec*" = "tests"
    
    # Temporary files
    "*.tmp" = "temp"
    "*.temp" = "temp"
    "*.log" = "temp"
    "*.cache" = "temp"
    
    # Archive/backup files
    "*.bak" = "archive"
    "*.backup" = "archive"
    "*.old" = "archive"
}

# Essential files to keep in root (case-insensitive)
$essentialFiles = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html",
    ".gitignore",
    ".env",
    ".env.local",
    ".env.example",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "yarn.lock",
    "pnpm-lock.yaml",
    "webpack.config.js",
    "babel.config.js",
    "eslint.config.js",
    ".eslintrc.*",
    "prettier.config.js",
    ".prettierrc.*",
    "tailwind.config.js",
    "postcss.config.js"
)

# Get all files in root directory
$rootFiles = Get-ChildItem -Path . -File | Where-Object { $_.Name -notlike ".*" }

foreach ($file in $rootFiles) {
    $fileName = $file.Name
    $isEssential = $false
    
    # Check if file is essential (case-insensitive)
    foreach ($essential in $essentialFiles) {
        if ($fileName -like $essential) {
            $isEssential = $true
            break
        }
    }
    
    if ($isEssential) {
        Write-Host "Keeping essential file: $fileName" -ForegroundColor Cyan
        continue
    }
    
    # Find matching pattern and move file
    $moved = $false
    foreach ($pattern in $filePatterns.Keys) {
        if ($fileName -like $pattern) {
            $destination = $filePatterns[$pattern]
            $destinationPath = Join-Path $destination $fileName
            
            # Check if file already exists in destination
            if (Test-Path $destinationPath) {
                Write-Host "File already exists in destination: $destinationPath" -ForegroundColor Red
                $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
                $newName = "$($file.BaseName)_$timestamp$($file.Extension)"
                $destinationPath = Join-Path $destination $newName
                Write-Host "Renaming to: $newName" -ForegroundColor Yellow
            }
            
            Move-Item -Path $file.FullName -Destination $destinationPath
            Write-Host "Moved: $fileName -> $destination/" -ForegroundColor Green
            $moved = $true
            break
        }
    }
    
    if (!$moved) {
        Write-Host "No rule for: $fileName (keeping in root)" -ForegroundColor Gray
    }
}

# Special handling for specific files that might need custom logic
Write-Host "`nSpecial file handling..." -ForegroundColor Magenta

# Move any JSON files that aren't package.json or tsconfig.json
Get-ChildItem -Path . -File -Filter "*.json" | Where-Object { 
    $_.Name -notlike "package*.json" -and 
    $_.Name -notlike "tsconfig*.json" 
} | ForEach-Object {
    $destination = "config"
    if ($_.Name -like "*test*" -or $_.Name -like "*spec*") {
        $destination = "tests"
    }
    Move-Item -Path $_.FullName -Destination (Join-Path $destination $_.Name)
    Write-Host "Moved JSON: $($_.Name) -> $destination/" -ForegroundColor Green
}

# Clean up empty directories that might have been created
foreach ($dir in $directories) {
    if ((Get-ChildItem $dir -Force | Measure-Object).Count -eq 0) {
        Remove-Item $dir
        Write-Host "Removed empty directory: $dir" -ForegroundColor Gray
    }
}

Write-Host "`nProject organization complete!" -ForegroundColor Green
Write-Host "Essential files remain in root directory" -ForegroundColor Cyan
Write-Host "Check the organized folders and update your .gitignore if needed" -ForegroundColor Yellow