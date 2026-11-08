# Read-only HP2 recovery inventory. Run on HP2 Windows PowerShell.
# Never transmits data, opens archive contents, uploads files or prints secrets.
# Only lists file names and sizes. Do not run automatic repair from this script.
$ErrorActionPreference = "Continue"
Write-Host "=== HP2 backup drives (name, drive letter, capacity) ==="
Get-Volume | Where-Object { $_.DriveLetter } |
  Select-Object DriveLetter, FileSystemLabel, FileSystem, @{Name='SizeGB';Expression={[math]::Round($_.Size/1GB,1)}} |
  Format-Table -AutoSize

Write-Host "=== Known Food Safety backup folder inventories ==="
$dirs = @(
  "E:\FoodSafety-Mouse-Backup",
  "E:\HP2-BACKUP-2026-10-07",
  "F:\HP2-AUTO-RECOVERY",
  "G:\HP2-AUTO-RECOVERY",
  "$env:USERPROFILE\Desktop"
)
foreach($dir in $dirs){
  if(Test-Path -LiteralPath $dir){
    Write-Host ("DIR " + $dir)
    Get-ChildItem -LiteralPath $dir -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match 'foodsafety|openbeken|bk7231|backup|scanner|recovery|bridge|mosquitto|firmware' } |
      Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
  }
}
Write-Host "Complete: no files changed or sent. Do not paste private credential contents."
