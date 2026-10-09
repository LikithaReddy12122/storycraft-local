$src = "C:\Users\scratch\storycraft-local"
$dest = "C:\Users\Likitha Reddy\.gemini\antigravity\scratch\storycraft-local"

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

Copy-Item -Path "$src\*" -Destination $dest -Recurse -Force -Exclude "node_modules", ".git"
Write-Host "Folders synchronized successfully!"
