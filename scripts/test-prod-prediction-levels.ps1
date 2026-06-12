[CmdletBinding()]
param(
    [string] $AppUrl = "https://buzzyhive.urban-alert.com",
    [string] $MlUrl = "https://ml.buzzyhive.urban-alert.com",
    [string] $TestSecret = "",
    [string] $DeviceId = "NODE-001",
    [int] $HiveId = 1,
    [int] $IntervalSeconds = 3,
    [int] $MaxRandomCandidates = 160,
    [int] $RandomSeed = 42,
    [switch] $PreviewOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertFrom-JsonSafe {
    param([string] $Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    $normalizedText = $Text.Trim()

    try {
        $convertFromJson = Get-Command ConvertFrom-Json
        if ($convertFromJson.Parameters.ContainsKey("Depth")) {
            return $normalizedText | ConvertFrom-Json -Depth 10
        }

        return $normalizedText | ConvertFrom-Json
    } catch {
        return $normalizedText
    }
}

function Invoke-JsonPost {
    param(
        [string] $Url,
        [hashtable] $Headers,
        [hashtable] $Payload
    )

    $jsonBody = $Payload | ConvertTo-Json -Depth 10 -Compress

    $tempFile = [System.IO.Path]::GetTempFileName()

    try {
        [System.IO.File]::WriteAllText($tempFile, $jsonBody, [System.Text.UTF8Encoding]::new($false))

        $curlArgs = @(
            '-sS',
            '-m', '25',
            '-X', 'POST',
            $Url,
            '-H', 'Content-Type: application/json',
            '-w', "`n__CODE__%{http_code}",
            '--data-binary', "@$tempFile"
        )

        foreach ($headerName in $Headers.Keys) {
            if ($headerName -eq 'Content-Type') {
                continue
            }

            $curlArgs += '-H'
            $curlArgs += ('{0}: {1}' -f $headerName, $Headers[$headerName])
        }

        $rawResult = & curl.exe @curlArgs 2>&1
        $exitCode = $LASTEXITCODE
        $joinedResult = ($rawResult -join [Environment]::NewLine)

        if ($exitCode -ne 0 -and $joinedResult -notmatch '__CODE__') {
            throw ("curl failed for {0}: {1}" -f $Url, $joinedResult)
        }

        $parts = $joinedResult -split "__CODE__", 2
        $bodyText = $parts[0].Trim()
        $statusCode = if ($parts.Count -gt 1) { [int] $parts[1].Trim() } else { 0 }

        return [pscustomobject]@{
            StatusCode = $statusCode
            Body = ConvertFrom-JsonSafe -Text $bodyText
            RawBody = $bodyText
        }
    } finally {
        if (Test-Path -LiteralPath $tempFile) {
            Remove-Item -LiteralPath $tempFile -Force
        }
    }
}

function Get-CuratedCandidates {
    return @(
        [pscustomobject]@{ name = "nr_1"; temp = 30.8; humidity = 80.0; mq2_value = 100; mq3_value = 85;  mq5_value = 105; mq135_value = 130 },
        [pscustomobject]@{ name = "nr_2"; temp = 31.2; humidity = 78.4; mq2_value = 120; mq3_value = 95;  mq5_value = 110; mq135_value = 140 },
        [pscustomobject]@{ name = "nr_3"; temp = 31.7; humidity = 77.0; mq2_value = 132; mq3_value = 108; mq5_value = 126; mq135_value = 158 },
        [pscustomobject]@{ name = "ap_1"; temp = 32.1; humidity = 75.5; mq2_value = 145; mq3_value = 120; mq5_value = 145; mq135_value = 175 },
        [pscustomobject]@{ name = "ap_2"; temp = 32.6; humidity = 74.1; mq2_value = 162; mq3_value = 136; mq5_value = 162; mq135_value = 195 },
        [pscustomobject]@{ name = "ap_3"; temp = 33.0; humidity = 72.9; mq2_value = 178; mq3_value = 150; mq5_value = 178; mq135_value = 214 },
        [pscustomobject]@{ name = "near_1"; temp = 33.4; humidity = 71.6; mq2_value = 194; mq3_value = 166; mq5_value = 198; mq135_value = 232 },
        [pscustomobject]@{ name = "near_2"; temp = 33.8; humidity = 70.4; mq2_value = 212; mq3_value = 180; mq5_value = 216; mq135_value = 248 },
        [pscustomobject]@{ name = "near_3"; temp = 34.2; humidity = 69.2; mq2_value = 228; mq3_value = 194; mq5_value = 232; mq135_value = 264 },
        [pscustomobject]@{ name = "ready_1"; temp = 31.2; humidity = 76.0; mq2_value = 145; mq3_value = 160; mq5_value = 235; mq135_value = 280 },
        [pscustomobject]@{ name = "ready_2"; temp = 31.8; humidity = 74.8; mq2_value = 148; mq3_value = 165; mq5_value = 229; mq135_value = 274 },
        [pscustomobject]@{ name = "ready_3"; temp = 32.4; humidity = 72.6; mq2_value = 152; mq3_value = 168; mq5_value = 224; mq135_value = 268 }
    )
}

function Get-RandomCandidates {
    param(
        [System.Random] $Generator,
        [int] $Count
    )

    $candidates = @()

    for ($i = 0; $i -lt $Count; $i++) {
        $temp = [Math]::Round(30.5 + ($Generator.NextDouble() * 5.2), 1)
        $humidity = [Math]::Round(65.0 + ($Generator.NextDouble() * 15.0), 1)
        $mq2 = [int] [Math]::Round(95 + ($Generator.NextDouble() * 235))
        $mq3 = [int] [Math]::Round(80 + ($Generator.NextDouble() * 190))
        $mq5 = [int] [Math]::Round(100 + ($Generator.NextDouble() * 240))
        $mq135 = [int] [Math]::Round(125 + ($Generator.NextDouble() * 255))

        $candidates += [pscustomobject]@{
            name = "rand_$($i + 1)"
            temp = $temp
            humidity = $humidity
            mq2_value = $mq2
            mq3_value = $mq3
            mq5_value = $mq5
            mq135_value = $mq135
        }
    }

    return $candidates
}

function Test-Candidate {
    param(
        [string] $BaseUrl,
        [object] $Candidate
    )

    $payload = @{
        temp = $Candidate.temp
        humidity = $Candidate.humidity
        mq2_value = $Candidate.mq2_value
        mq3_value = $Candidate.mq3_value
        mq5_value = $Candidate.mq5_value
        mq135_value = $Candidate.mq135_value
    }

    return Invoke-JsonPost `
        -Url "$($BaseUrl.TrimEnd('/'))/predict" `
        -Headers @{ Accept = "application/json" } `
        -Payload $payload
}

function Send-DiagnosticPayload {
    param(
        [string] $BaseUrl,
        [string] $ResolvedTestSecret,
        [string] $ResolvedDeviceId,
        [int] $ResolvedHiveId,
        [object] $Candidate
    )

    $payload = [ordered]@{
        mode = "full_pipeline"
        device_id = $ResolvedDeviceId
        hive_id = $ResolvedHiveId
        temp = $Candidate.temp
        humidity = $Candidate.humidity
        mq2_value = $Candidate.mq2_value
        mq3_value = $Candidate.mq3_value
        mq5_value = $Candidate.mq5_value
        mq135_value = $Candidate.mq135_value
    }

    return Invoke-JsonPost `
        -Url "$($BaseUrl.TrimEnd('/'))/api/internal/test-telegram-ready" `
        -Headers @{
            Accept = "application/json"
            "X-Test-Secret" = $ResolvedTestSecret
        } `
        -Payload $payload
}

$levels = @("not_ready", "approaching", "nearly_ready", "ready")
$matches = @{}
$generator = [System.Random]::new($RandomSeed)
$candidates = @()
$candidates += Get-CuratedCandidates
$candidates += Get-RandomCandidates -Generator $generator -Count $MaxRandomCandidates

Write-Host "App URL: $AppUrl"
Write-Host "ML URL: $MlUrl"
Write-Host "Device: $DeviceId"
Write-Host "Hive ID: $HiveId"
Write-Host "Preview only: $PreviewOnly"
Write-Host "Candidate count: $($candidates.Count)"

if (-not $PreviewOnly -and [string]::IsNullOrWhiteSpace($TestSecret)) {
    throw "TestSecret is required unless PreviewOnly is used."
}

foreach ($candidate in $candidates) {
    if ((@($levels | Where-Object { -not $matches.ContainsKey($_) })).Count -eq 0) {
        break
    }

    $probe = Test-Candidate -BaseUrl $MlUrl -Candidate $candidate

    if ($probe.StatusCode -ne 200 -or $null -eq $probe.Body) {
        continue
    }

    $readinessLevel = [string] $probe.Body.readiness_level

    Write-Host ("PRECHECK {0} -> readiness={1} warning_state={2}" -f $candidate.name, $readinessLevel, $probe.Body.warning_state)

    if ($levels -contains $readinessLevel -and -not $matches.ContainsKey($readinessLevel)) {
        $matches[$readinessLevel] = @{
            candidate = $candidate
            probe = $probe.Body
        }
    }
}

$missing = @($levels | Where-Object { -not $matches.ContainsKey($_) })

if ($missing.Count -gt 0) {
    throw "Could not find live ML candidates for: $($missing -join ', ')"
}

Write-Host ""
Write-Host "Matched candidates:" -ForegroundColor Cyan

foreach ($level in $levels) {
    $match = $matches[$level]
    $candidate = $match.candidate
    Write-Host ("  {0} <- {1} temp={2} humidity={3} mq2={4} mq3={5} mq5={6} mq135={7}" -f `
        $level, `
        $candidate.name, `
        $candidate.temp, `
        $candidate.humidity, `
        $candidate.mq2_value, `
        $candidate.mq3_value, `
        $candidate.mq5_value, `
        $candidate.mq135_value)
}

if ($PreviewOnly) {
    exit 0
}

Write-Host ""
Write-Host "Sending live diagnostic payloads..." -ForegroundColor Cyan

foreach ($level in $levels) {
    $match = $matches[$level]
    $candidate = $match.candidate
    $response = Send-DiagnosticPayload `
        -BaseUrl $AppUrl `
        -ResolvedTestSecret $TestSecret `
        -ResolvedDeviceId $DeviceId `
        -ResolvedHiveId $HiveId `
        -Candidate $candidate

    if ($response.StatusCode -notin @(201, 409)) {
        throw "Diagnostic run for level [$level] failed with HTTP $($response.StatusCode). Response: $($response.RawBody)"
    }

    Write-Host ("RUN {0} -> http={1} readiness={2} telegram={3} prediction_id={4}" -f `
        $level, `
        $response.StatusCode, `
        $response.Body.readiness_level, `
        $response.Body.telegram_dispatch, `
        $response.Body.prediction_id) -ForegroundColor Green

    if ($level -in @("nearly_ready", "ready")) {
        Write-Host ("NOTE {0} should follow the existing Telegram path." -f $level) -ForegroundColor Yellow
    }

    if ($level -ne $levels[-1] -and $IntervalSeconds -gt 0) {
        Start-Sleep -Seconds $IntervalSeconds
    }
}

Write-Host ""
Write-Host "Live prediction UI test payloads completed." -ForegroundColor Green
