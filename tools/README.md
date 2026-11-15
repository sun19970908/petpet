# ScreenCap

Windows-only screen capture helper used by `main/screen.js`.

`ScreenCap.cs` and `ScreenCap.exe` are first-party code under the repository's
root MIT License. The helper exists because Electron's `desktopCapturer` can
map the wrong monitor on multi-GPU/multi-display systems; it enumerates physical
monitors and captures the selected monitor rectangle with GDI.

## Build

Requires Windows .NET Framework 4.x:

```powershell
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
& $csc /nologo /target:winexe /out:ScreenCap.exe /r:System.Drawing.dll ScreenCap.cs
```

Run from this `tools` directory. The resulting `ScreenCap.exe` is loaded by
`main/screen.js`.

## Usage

```text
ScreenCap.exe list
ScreenCap.exe cap <outFile> <main|room|idx|device|x,y,w,h> [quality]
```
