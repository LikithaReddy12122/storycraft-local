$authFile = "$env:APPDATA\com.vercel.cli\Data\auth.json"
if (Test-Path $authFile) {
    $auth = Get-Content $authFile | ConvertFrom-Json
    $token = $auth.token
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $user = Invoke-RestMethod -Uri "https://api.vercel.com/v2/user" -Headers $headers
    Write-Host "LOGGED_IN_USER:$($user.user.username)"
    Write-Host "USER_EMAIL:$($user.user.email)"
} else {
    Write-Host "AUTH_FILE_NOT_FOUND"
}
