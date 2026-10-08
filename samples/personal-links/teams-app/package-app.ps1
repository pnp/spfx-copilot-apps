param([switch]$Check)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem

$componentId = 'a90f8981-60cd-4b2f-a5cf-985475e943ac'
$appFolder = Join-Path $PSScriptRoot 'personalLinks'
$manifestPath = Join-Path $appFolder 'manifest.json'
$webPartManifestPath = Join-Path $PSScriptRoot '..\src\webparts\personalLinks\PersonalLinksWebPart.manifest.json'
$agentManifestPath = Join-Path $PSScriptRoot '..\copilot\manifest.json'
$agentColorPath = Join-Path $PSScriptRoot '..\copilot\color.png'
$agentOutlinePath = Join-Path $PSScriptRoot '..\copilot\outline.png'
$webPartIconPath = Join-Path $PSScriptRoot '..\assets\personal-links-webpart.png'

function New-RoundedPath(
    [single]$X,
    [single]$Y,
    [single]$Width,
    [single]$Height,
    [single]$Radius
) {
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = $Radius * 2
    $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
    $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
    $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Add-LinkRing(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [single]$X,
    [single]$Y
) {
    $path = New-RoundedPath $X $Y 82 42 21
    $matrix = [System.Drawing.Drawing2D.Matrix]::new()
    try {
        $matrix.RotateAt(-38, [System.Drawing.PointF]::new($X + 41, $Y + 21))
        $path.Transform($matrix)
        $Graphics.DrawPath($Pen, $path)
    } finally {
        $matrix.Dispose()
        $path.Dispose()
    }
}

function New-PersonalLinksIcon([int]$Size, [bool]$Outline) {
    $scale = 4
    $bitmap = [System.Drawing.Bitmap]::new($Size * $scale, $Size * $scale)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.ScaleTransform($Size * $scale / 192, $Size * $scale / 192)
        $graphics.Clear([System.Drawing.Color]::Transparent)

        if (-not $Outline) {
            $background = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
                [System.Drawing.Rectangle]::new(0, 0, 192, 192),
                [System.Drawing.ColorTranslator]::FromHtml('#11364F'),
                [System.Drawing.ColorTranslator]::FromHtml('#075FCE'),
                [single]55
            )
            $glow = [System.Drawing.SolidBrush]::new(
                [System.Drawing.Color]::FromArgb(22, 255, 255, 255)
            )
            try {
                $graphics.FillRectangle($background, 0, 0, 192, 192)
                $graphics.FillEllipse($glow, -70, 26, 220, 220)
            } finally {
                $background.Dispose()
                $glow.Dispose()
            }

            $segments = @(
                @{ X = 0; Color = '#075FCE' },
                @{ X = 48; Color = '#138A3D' },
                @{ X = 96; Color = '#B32687' },
                @{ X = 144; Color = '#D84F38' }
            )
            foreach ($segment in $segments) {
                $brush = [System.Drawing.SolidBrush]::new(
                    [System.Drawing.ColorTranslator]::FromHtml($segment.Color)
                )
                try { $graphics.FillRectangle($brush, $segment.X, 0, 48, 14) } finally { $brush.Dispose() }
            }
        }

        $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, 15)
        try {
            $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
            $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
            $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
            Add-LinkRing $graphics $pen 38 88
            Add-LinkRing $graphics $pen 72 62
        } finally {
            $pen.Dispose()
        }
    } finally {
        $graphics.Dispose()
    }

    $output = [System.Drawing.Bitmap]::new($Size, $Size)
    $resize = [System.Drawing.Graphics]::FromImage($output)
    $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
    $stream = [System.IO.MemoryStream]::new()
    try {
        $resize.Clear([System.Drawing.Color]::Transparent)
        $resize.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $resize.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $resize.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
        $resize.DrawImage(
            $bitmap,
            [System.Drawing.Rectangle]::new(0, 0, $Size, $Size),
            0,
            0,
            $bitmap.Width,
            $bitmap.Height,
            [System.Drawing.GraphicsUnit]::Pixel,
            $attributes
        )

        if ($Outline) {
            for ($y = 0; $y -lt $Size; $y++) {
                for ($x = 0; $x -lt $Size; $x++) {
                    $pixel = $output.GetPixel($x, $y)
                    if ($pixel.A -gt 0) {
                        $output.SetPixel(
                            $x,
                            $y,
                            [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255)
                        )
                    }
                }
            }
        }

        $output.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        return ,$stream.ToArray()
    } finally {
        $stream.Dispose()
        $attributes.Dispose()
        $resize.Dispose()
        $output.Dispose()
        $bitmap.Dispose()
    }
}

function Set-OrCheckBytes([string]$Path, [byte[]]$Expected) {
    if ($Check) {
        if (-not (Test-Path -LiteralPath $Path) -or
            [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($Path)) -cne
            [Convert]::ToBase64String($Expected)) {
            throw "Missing or stale generated image: $Path"
        }
        return
    }

    [System.IO.File]::WriteAllBytes($Path, $Expected)
}

$color = New-PersonalLinksIcon 192 $false
$outline = New-PersonalLinksIcon 32 $true
$webPartIcon = New-PersonalLinksIcon 96 $false

Set-OrCheckBytes (Join-Path $appFolder 'color.png') $color
Set-OrCheckBytes (Join-Path $appFolder 'outline.png') $outline
Set-OrCheckBytes $agentColorPath $color
Set-OrCheckBytes $agentOutlinePath $outline
Set-OrCheckBytes $webPartIconPath $webPartIcon

$expectedIconUrl = "data:image/png;base64,$([Convert]::ToBase64String($webPartIcon))"
$webPartManifest = Get-Content -LiteralPath $webPartManifestPath -Raw
$currentIconUrl = [regex]::Match($webPartManifest, '"iconImageUrl"\s*:\s*"([^"]+)"').Groups[1].Value
if ($Check) {
    if ($currentIconUrl -cne $expectedIconUrl) {
        throw "The web part icon data does not match the shared Personal Links artwork."
    }
} else {
    if (-not $currentIconUrl) {
        throw "Missing iconImageUrl in $webPartManifestPath"
    }
    $webPartManifest = $webPartManifest.Replace($currentIconUrl, $expectedIconUrl)
    Set-Content -LiteralPath $webPartManifestPath -Value $webPartManifest -Encoding utf8 -NoNewline
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$agentManifest = Get-Content -LiteralPath $agentManifestPath -Raw | ConvertFrom-Json
$webPartHosts = [regex]::Match(
    $webPartManifest,
    '"supportedHosts"\s*:\s*\[([^\]]+)\]'
).Groups[1].Value
$expectedUrl = "https://{teamSiteDomain}/_layouts/15/TeamsLogon.aspx?SPFX=true&dest=/_layouts/15/teamshostedapp.aspx%3Fteams%26personal%26componentId=$componentId%26forceLocale={locale}"

if ($webPartHosts -cmatch '"TeamsPersonalApp"' -or $webPartHosts -cmatch '"TeamsTab"') {
    throw 'The primary web part manifest must not generate a Teams package beside the Copilot agent.'
}
if ($manifest.id -cne $componentId -or
    $manifest.defaultInstallScope -cne 'personal' -or
    $manifest.staticTabs.Count -ne 1 -or
    $manifest.staticTabs[0].entityId -cne $componentId -or
    $manifest.staticTabs[0].contentUrl -cne $expectedUrl -or
    ($manifest.staticTabs[0].scopes -join ',') -cne 'personal' -or
    ($manifest.staticTabs[0].context -join ',') -cne 'personalTab' -or
    $manifest.icons.color -cne 'color.png' -or
    $manifest.icons.outline -cne 'outline.png' -or
    $manifest.accentColor -cne '#075FCE' -or
    $manifest.webApplicationInfo.id -cne '00000003-0000-0ff1-ce00-000000000000' -or
    $manifest.webApplicationInfo.resource -cne 'https://{teamSiteDomain}') {
    throw "Incorrect SPFx routing, personal scope, authentication, or branding in $manifestPath"
}
if ($agentManifest.icons.color -cne 'color.png' -or
    $agentManifest.icons.outline -cne 'outline.png' -or
    $agentManifest.accentColor -cne '#075FCE') {
    throw "The Copilot agent does not use the shared Personal Links branding."
}

$packagePath = Join-Path $appFolder 'TeamsSPFxApp.zip'
$packageFiles = @('manifest.json', 'color.png', 'outline.png')
if (-not $Check) {
    Compress-Archive -LiteralPath @(
        $packageFiles | ForEach-Object { Join-Path $appFolder $_ }
    ) -DestinationPath $packagePath -Force
}

$archive = [System.IO.Compression.ZipFile]::OpenRead($packagePath)
try {
    if ($archive.Entries.Count -ne 3) {
        throw "Expected exactly three root-level files in $packagePath"
    }
    foreach ($name in $packageFiles) {
        $entry = $archive.GetEntry($name)
        if ($null -eq $entry) {
            throw "Missing root-level $name in $packagePath"
        }
        $stream = $entry.Open()
        $content = [System.IO.MemoryStream]::new()
        try {
            $stream.CopyTo($content)
            if ([Convert]::ToBase64String($content.ToArray()) -cne
                [Convert]::ToBase64String(
                    [System.IO.File]::ReadAllBytes((Join-Path $appFolder $name))
                )) {
                throw "Stale $name in $packagePath"
            }
        } finally {
            $stream.Dispose()
            $content.Dispose()
        }
    }
} finally {
    $archive.Dispose()
}

Write-Host "Validated Personal Links agent/web-part branding and isolated Teams personal app package."
