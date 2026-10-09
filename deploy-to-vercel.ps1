param(
    [Parameter(Mandatory=$true)]
    [string]$VercelToken
)

$ErrorActionPreference = "Stop"
$projectDir = "C:\Users\Likitha Reddy\.gemini\antigravity\scratch\storycraft-local"

Write-Host "Reading project files from $projectDir..." -ForegroundColor Cyan

$filesToUpload = @(
    @{
        file = "index.html"
        data = [System.IO.File]::ReadAllText("$projectDir\index.html", [System.Text.Encoding]::UTF8)
    },
    @{
        file = "vercel.json"
        data = [System.IO.File]::ReadAllText("$projectDir\vercel.json", [System.Text.Encoding]::UTF8)
    },
    @{
        file = "package.json"
        data = [System.IO.File]::ReadAllText("$projectDir\package.json", [System.Text.Encoding]::UTF8)
    }
)

$body = @{
    name = "storycraft-local"
    files = $filesToUpload
    projectSettings = @{
        framework = $null
    }
} | ConvertTo-Json -Depth 5

$headers = @{
    "Authorization" = "Bearer $VercelToken"
    "Content-Type"  = "application/json"
}

Write-Host "Deploying to Vercel REST API..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" -Method Post -Headers $headers -Body $body
    Write-Host "`nSUCCESS! Deployed to Vercel." -ForegroundColor Green
    Write-Host "Live URL: https://$($response.url)" -ForegroundColor Yellow
    Write-Host "Deployment ID: $($response.id)" -ForegroundColor Gray
    Write-Host "Status: $($response.readyState)" -ForegroundColor Gray
    return $response.url
} catch {
    Write-Error "Deployment failed: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
}
