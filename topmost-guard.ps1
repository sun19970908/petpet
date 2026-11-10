param([int]$PetPid = 0)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class PetTop {
  public delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);
  [DllImport("user32.dll")] public static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lp);
  public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowTextW(IntPtr hWnd, StringBuilder sb, int max);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassNameW(IntPtr hWnd, StringBuilder sb, int max);
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hWnd, int idx);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  // STRICT: only the pet app's own process (pid) may match; Chrome/Qoder use the same window class
  public static IntPtr Find(int pid) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((h, l) => {
      uint p; GetWindowThreadProcessId(h, out p);
      if (p != (uint)pid) return true;
      var c = new StringBuilder(256); GetClassNameW(h, c, 256);
      if (c.ToString() != "Chrome_WidgetWin_1") return true;
      var t = new StringBuilder(256); GetWindowTextW(h, t, 256);
      if (t.ToString().StartsWith("DeepSeek")) { found = h; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
  public static bool IsTop(IntPtr h) { return (GetWindowLong(h, -20) & 0x8) != 0; }
  public static void Raise(IntPtr h) { SetWindowPos(h, new IntPtr(-1), 0,0,0,0, 0x13); }
  public static string Title(IntPtr h) { var t = new StringBuilder(256); GetWindowTextW(h, t, 256); return t.ToString(); }
}
"@
# The cross-screen transparent window silently loses WS_EX_TOPMOST and Electron cannot restore it.
# Event hook (foreground change) + 50ms polling fallback re-apply it via Win32.
$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir 'topmost-guard.log'
function Log([string]$m) { Add-Content -Path $log -Value ((Get-Date).ToString('yyyy-MM-dd HH:mm:ss.fff') + ' ' + $m) }
$script:lastRaise = [DateTime]::MinValue
function EnsureTop([string]$why) {
  $h = [PetTop]::Find($PetPid)
  if ($h -eq [IntPtr]::Zero) { return }
  if ([PetTop]::IsTop($h)) { return }
  $fg = [PetTop]::GetForegroundWindow()
  [PetTop]::Raise($h)
  if (((Get-Date) - $script:lastRaise).TotalMilliseconds -gt 400) {
    Log ('restored (' + $why + ') fg="' + [PetTop]::Title($fg) + '" ok=' + [PetTop]::IsTop($h))
  }
  $script:lastRaise = Get-Date
}
if ($PetPid -le 0) { Log 'no pet pid given, guard exit'; exit 1 }
$onForeground = [PetTop+WinEventDelegate]{ param($hHook,$ev,$hwnd,$idObj,$idChild,$thr,$time) EnsureTop 'foreground' }
$hook = [PetTop]::SetWinEventHook(0x0003, 0x0003, [IntPtr]::Zero, $onForeground, 0, 0, 0)  # EVENT_SYSTEM_FOREGROUND, OUTOFCONTEXT
Log ('guard start pid=' + $PetPid + ' hook=' + $hook)
$miss = 0
while ($true) {
  [System.Windows.Forms.Application]::DoEvents()
  EnsureTop 'poll'
  $h = [PetTop]::Find($PetPid)
  if ($h -eq [IntPtr]::Zero) {
    $miss++
    if ($miss -ge 600) { Log 'pet window gone, guard exit'; break }
  } else { $miss = 0 }
  Start-Sleep -Milliseconds 50
}
