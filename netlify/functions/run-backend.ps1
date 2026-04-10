$mp = [System.Environment]::GetEnvironmentVariable("PATH","Machine")
$up = [System.Environment]::GetEnvironmentVariable("PATH","User")
$env:PATH = $mp + ";" + $up
$env:DATABASE_URL = "postgresql://neondb_owner:npg_mwRWqp8COBk2@ep-lucky-fire-a1fp6l8q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
Set-Location "C:\Users\Administrator\.qclaw\workspace\agent-fa90ed19\donation-platform\netlify\functions"
node api.js 2>&1
Write-Host "EXIT: $LASTEXITCODE"
