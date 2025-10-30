Write-Host 'Monitoring deployment at https://www.healthextent.ai...'
Write-Host ''

$maxAttempts = 20
$attempt = 0
$deployed = $false

while ($attempt -lt $maxAttempts -and -not $deployed) {
    $attempt++
    Write-Host "Attempt $attempt of $maxAttempts..." -ForegroundColor Cyan

    try {
        $response = Invoke-WebRequest -Uri 'https://www.healthextent.ai' -UseBasicParsing -TimeoutSec 10
        $content = $response.Content

        # Check if it's still the Azure placeholder page
        if ($content -match 'static-apps/v4/main.css') {
            Write-Host '  Status: Still showing Azure placeholder page' -ForegroundColor Yellow
        } elseif ($content -match 'root' -or $content -match 'react' -or $content -match 'vite') {
            Write-Host '  Status: React app is LIVE!' -ForegroundColor Green
            Write-Host ''
            Write-Host 'Deployment complete! Your app is now accessible at:' -ForegroundColor Green
            Write-Host '  - https://www.healthextent.ai' -ForegroundColor Green
            Write-Host '  - https://healthextent.ai' -ForegroundColor Green
            $deployed = $true
            break
        } else {
            Write-Host '  Status: Page content changed, checking...' -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    if (-not $deployed) {
        Write-Host '  Waiting 15 seconds before next check...' -ForegroundColor Gray
        Write-Host ''
        Start-Sleep -Seconds 15
    }
}

if (-not $deployed) {
    Write-Host 'Timeout reached after 5 minutes.' -ForegroundColor Red
    Write-Host 'Check GitHub Actions for build status:' -ForegroundColor Yellow
    Write-Host '  https://github.com/ealmetes/HealthExtent-webclient/actions' -ForegroundColor Cyan
    exit 1
}
