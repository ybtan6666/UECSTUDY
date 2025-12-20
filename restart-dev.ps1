# Complete restart script for Windows PowerShell
Write-Host "🛑 Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "🧹 Clearing caches..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Caches cleared" -ForegroundColor Green

Write-Host "🔧 Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✅ Prisma client regenerated" -ForegroundColor Green

Write-Host "🚀 Starting dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Ready! Now try signing in with:" -ForegroundColor Green
Write-Host "   Email: student1@uec.com" -ForegroundColor Cyan
Write-Host "   Password: student123" -ForegroundColor Cyan
Write-Host ""
npm run dev

