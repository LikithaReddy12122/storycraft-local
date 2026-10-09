$gitDir = "C:\Users\Likitha Reddy\.tools\mingit\cmd"
$ghExe = "C:\Users\Likitha Reddy\.tools\gh\gh.exe"
$env:Path = "$gitDir;$env:Path"

Set-Location "C:\Users\scratch\storycraft-local"
& $ghExe auth setup-git

& "$gitDir\git.exe" add -A
& "$gitDir\git.exe" status --short
& "$gitDir\git.exe" commit -m "feat: activate full AI Travel Assistant mode with Express backend, Google Gemini API integration, and verified database RAG"
& "$gitDir\git.exe" push origin main
Write-Host "Pushed changes to GitHub repository!"
