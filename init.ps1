#requires -Version 5.1
# 首次运行初始化：补齐缺失文件，安装依赖，并在缺失时克隆角色仓库；不覆盖已有配置或角色。
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$playerRepo = 'https://github.com/livliv-dev/player.git'
$electronExe = Join-Path $root 'node_modules/electron/dist/electron.exe'
$characterRoot = Join-Path $root 'characters'
$characterP01 = Join-Path $characterRoot 'characters/p01'

function CopyIfMissing {
  param(
    [string]$srcRel,
    [string]$dstRel,
    [string]$label,
    [switch]$Directory
  )
  $src = Join-Path $root $srcRel
  $dst = Join-Path $root $dstRel
  if (-not (Test-Path -LiteralPath $src)) {
    throw "缺少初始化模板：$srcRel"
  }
  if (Test-Path -LiteralPath $dst) {
    Write-Host "[skip]   $label 已存在，不覆盖"
    return
  }
  if ($Directory) {
    Copy-Item -LiteralPath $src -Destination $dst -Recurse
  } else {
    Copy-Item -LiteralPath $src -Destination $dst
  }
  Write-Host "[create] $label"
}

function EnsureDirectory {
  param([string]$rel)
  $path = Join-Path $root $rel
  if (Test-Path -LiteralPath $path) {
    Write-Host "[skip]   $rel/ 已存在"
    return
  }
  New-Item -ItemType Directory -Path $path | Out-Null
  Write-Host "[create] $rel/"
}

function InstallDependencies {
  if (Test-Path -LiteralPath $electronExe) {
    Write-Host "[skip]   Electron 依赖已安装"
    return
  }
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if (-not $npm) {
    throw "找不到 npm，请先安装 Node.js。"
  }
  Write-Host "[run]    npm install"
  Push-Location $root
  try {
    & $npm.Source install
    if ($LASTEXITCODE -ne 0) {
      throw "npm install 失败，退出码：$LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
  if (-not (Test-Path -LiteralPath $electronExe)) {
    throw "npm install 完成，但未找到 node_modules/electron/dist/electron.exe。"
  }
  Write-Host "[done]   依赖安装完成"
}

function CloneCharacters {
  if (Test-Path -LiteralPath $characterP01) {
    Write-Host "[skip]   characters/characters/p01 已存在"
    return
  }
  if (Test-Path -LiteralPath $characterRoot) {
    Write-Host "[warn]   characters/ 已存在但缺少 characters/characters/p01；不覆盖现有目录。"
    return
  }
  $git = Get-Command git -ErrorAction SilentlyContinue
  $gitExe = $null
  if ($git) {
    $gitExe = $git.Source
  } else {
    $gitPath = 'C:\Program Files\Git\cmd\git.exe'
    if (Test-Path -LiteralPath $gitPath) {
      $gitExe = $gitPath
    }
  }
  if (-not $gitExe) {
    throw "找不到 git，请先安装 Git。"
  }

  $tmp = Join-Path $env:TEMP ("livliv-characters-" + [guid]::NewGuid().ToString('N'))
  $moved = $false
  Write-Host "[run]    git clone --depth 1 $playerRepo characters"
  try {
    & $gitExe clone --depth 1 $playerRepo $tmp
    if ($LASTEXITCODE -ne 0) {
      throw "git clone 失败，退出码：$LASTEXITCODE"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $tmp 'characters/p01'))) {
      throw "角色仓库中未找到 characters/p01。"
    }
    Move-Item -LiteralPath $tmp -Destination $characterRoot
    $moved = $true
  } finally {
    if (-not $moved -and (Test-Path -LiteralPath $tmp)) {
      Remove-Item -LiteralPath $tmp -Recurse -Force
    }
  }
  if (-not (Test-Path -LiteralPath $characterP01)) {
    throw "角色克隆完成，但未找到 characters/characters/p01。"
  }
  Write-Host "[done]   角色仓库已克隆到 characters/"
}

Write-Host "初始化 livliv-pet：$root"
Write-Host ""

CopyIfMissing 'pet_space.example' 'pet_space' 'pet_space/' -Directory
CopyIfMissing 'renderer/system-prompt.example.txt' 'renderer/system-prompt.txt' 'renderer/system-prompt.txt'
CopyIfMissing 'config.example.json' 'config.json' 'config.json'
CopyIfMissing 'llm.config.example.json' 'llm.config.json' 'llm.config.json'
CopyIfMissing 'tts.config.example.json' 'tts.config.json' 'tts.config.json'

EnsureDirectory 'logs'
EnsureDirectory 'history'

Write-Host ""
InstallDependencies
CloneCharacters

Write-Host ""
if (-not (Test-Path -LiteralPath $characterP01)) {
  Write-Host "[warn]   缺少角色资源 characters/characters/p01/，角色无法加载。"
}
if (-not (Test-Path -LiteralPath (Join-Path $root 'tools/ScreenCap.exe'))) {
  Write-Host "[warn]   tools/ScreenCap.exe 不存在，截图会回退到 Electron desktopCapturer。"
}
if (-not (Test-Path -LiteralPath (Join-Path $root 'voices'))) {
  Write-Host "[hint]   TTS 默认关闭；以后开启 TTS 时需要 voices/ 和 GPT-SoVITS。"
}

Write-Host ""
Write-Host "初始化完成。下一步："
Write-Host "  1. 编辑 config.json / llm.config.json / tts.config.json"
Write-Host "  2. llm.config.json 的 baseUrl 默认为空，配置端点后才能聊天"
Write-Host "  3. 运行 start-pet.bat"


