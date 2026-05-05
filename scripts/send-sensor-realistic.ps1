[CmdletBinding()]
param(
    [string] $ApiUrl = "http://127.0.0.1:8000/api/sensor-data",
    [string] $ApiKey = "buzzyhive-iot-key-2026",
    [string] $DeviceId = "NODE-001",
    [int] $HiveId = 1,
    [int] $IntervalSeconds = 5,
    [int] $Iterations = 36,
    [double] $BaseTemp = 32.8,
    [double] $BaseHumidity = 74.0,
    [int] $BaseMq2 = 205,
    [int] $BaseMq3 = 165,
    [int] $BaseMq5 = 178,
    [int] $BaseMq135 = 225,
    [int] $DisturbanceEvery = 9,
    [switch] $PreviewOnly,
    [int] $RandomSeed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Clamp-Double {
    param(
        [double] $Value,
        [double] $Minimum,
        [double] $Maximum
    )

    return [Math]::Min([Math]::Max($Value, $Minimum), $Maximum)
}

function Clamp-Int {
    param(
        [int] $Value,
        [int] $Minimum,
        [int] $Maximum
    )

    return [Math]::Min([Math]::Max($Value, $Minimum), $Maximum)
}

function Get-Noise {
    param(
        [System.Random] $Generator,
        [double] $Amplitude
    )

    return (($Generator.NextDouble() * 2.0) - 1.0) * $Amplitude
}

function Invoke-SensorPost {
    param(
        [string] $ResolvedApiUrl,
        [hashtable] $ResolvedHeaders,
        [hashtable] $Payload
    )

    $jsonBody = $Payload | ConvertTo-Json -Depth 5

    try {
        $response = Invoke-RestMethod `
            -Uri $ResolvedApiUrl `
            -Method Post `
            -Headers $ResolvedHeaders `
            -Body $jsonBody

        Write-Host ("Response: {0}" -f ($response | ConvertTo-Json -Compress))
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int] $_.Exception.Response.StatusCode
            Write-Host ("Request failed with HTTP {0}" -f $statusCode) -ForegroundColor Red
        }

        throw
    }
}

if ($IntervalSeconds -lt 0) {
    throw "IntervalSeconds must be 0 or greater."
}

if ($Iterations -lt 1) {
    throw "Iterations must be at least 1."
}

if ($DisturbanceEvery -lt 0) {
    throw "DisturbanceEvery must be 0 or greater."
}

$generator = if ($PSBoundParameters.ContainsKey("RandomSeed")) {
    [System.Random]::new($RandomSeed)
} else {
    [System.Random]::new()
}

$headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
    "X-API-Key" = $ApiKey
}

Write-Host "API URL: $ApiUrl"
Write-Host "Interval: $IntervalSeconds second(s)"
Write-Host "Iterations: $Iterations"
Write-Host "Preview only: $PreviewOnly"
Write-Host "Disturbance every: $DisturbanceEvery iteration(s)"
if ($PSBoundParameters.ContainsKey("RandomSeed")) {
    Write-Host "Random seed: $RandomSeed"
}

for ($iteration = 0; $iteration -lt $Iterations; $iteration++) {
    $position = if ($Iterations -eq 1) {
        0.0
    } else {
        $iteration / [Math]::Max(($Iterations - 1), 1)
    }

    $cycleRadians = $position * [Math]::PI * 2.0
    $subCycleRadians = $position * [Math]::PI * 6.0

    $disturbanceActive = $DisturbanceEvery -gt 0 -and $iteration -gt 0 -and (($iteration + 1) % $DisturbanceEvery -eq 0)
    $disturbanceFactor = if ($disturbanceActive) { 1.0 } else { 0.0 }

    $temp = $BaseTemp +
        ([Math]::Sin($cycleRadians) * 1.1) +
        ([Math]::Sin($subCycleRadians) * 0.35) +
        (Get-Noise -Generator $generator -Amplitude 0.25) +
        ($disturbanceFactor * 0.8)
    $temp = [Math]::Round((Clamp-Double -Value $temp -Minimum -10.0 -Maximum 60.0), 1)

    $humidity = $BaseHumidity +
        ([Math]::Cos($cycleRadians) * 4.2) -
        (($temp - $BaseTemp) * 2.3) +
        (Get-Noise -Generator $generator -Amplitude 1.2) -
        ($disturbanceFactor * 3.0)
    $humidity = [Math]::Round((Clamp-Double -Value $humidity -Minimum 0.0 -Maximum 100.0), 1)

    $gasShift = (($temp - $BaseTemp) * 8.5) + (($BaseHumidity - $humidity) * 1.5)
    $disturbanceGasBoost = if ($disturbanceActive) {
        35 + $generator.Next(0, 26)
    } else {
        0
    }

    $mq2 = [int] [Math]::Round($BaseMq2 + $gasShift + (Get-Noise -Generator $generator -Amplitude 10) + $disturbanceGasBoost)
    $mq3 = [int] [Math]::Round($BaseMq3 + ($gasShift * 0.78) + (Get-Noise -Generator $generator -Amplitude 8) + [Math]::Round($disturbanceGasBoost * 0.75))
    $mq5 = [int] [Math]::Round($BaseMq5 + ($gasShift * 0.88) + (Get-Noise -Generator $generator -Amplitude 9) + [Math]::Round($disturbanceGasBoost * 0.82))
    $mq135 = [int] [Math]::Round($BaseMq135 + ($gasShift * 1.05) + (Get-Noise -Generator $generator -Amplitude 12) + [Math]::Round($disturbanceGasBoost * 1.12))

    $payload = [ordered]@{
        device_id = $DeviceId
        hive_id = $HiveId
        temp = $temp
        humidity = $humidity
        mq2_value = Clamp-Int -Value $mq2 -Minimum 0 -Maximum 4095
        mq3_value = Clamp-Int -Value $mq3 -Minimum 0 -Maximum 4095
        mq5_value = Clamp-Int -Value $mq5 -Minimum 0 -Maximum 4095
        mq135_value = Clamp-Int -Value $mq135 -Minimum 0 -Maximum 4095
    }

    Write-Host ""
    Write-Host ("[{0}/{1}] Realistic payload{2}" -f ($iteration + 1), $Iterations, ($(if ($disturbanceActive) { " (disturbance)" } else { "" }))) -ForegroundColor Yellow
    Write-Host ($payload | ConvertTo-Json -Depth 5)

    if (-not $PreviewOnly) {
        Invoke-SensorPost -ResolvedApiUrl $ApiUrl -ResolvedHeaders $headers -Payload $payload
    }

    if ($iteration -lt ($Iterations - 1) -and $IntervalSeconds -gt 0) {
        Start-Sleep -Seconds $IntervalSeconds
    }
}
