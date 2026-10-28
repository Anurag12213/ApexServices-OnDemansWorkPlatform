# ===============================================================
# ApexServices Stop All Script (PowerShell)
# ===============================================================

Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "                 STOPPING ALL APEXSERVICES                     " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host ""

$ports = @(8080, 5173, 5174, 5175, 5176)

foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $pidToKill = $conn.OwningProcess
                Write-Host "Stopping PID $pidToKill listening on port $port..." -ForegroundColor Cyan
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        } else {
            Write-Host "Port $port is already clear." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Error checking port $port: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "   All ApexServices ports have been released and stopped!      " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
