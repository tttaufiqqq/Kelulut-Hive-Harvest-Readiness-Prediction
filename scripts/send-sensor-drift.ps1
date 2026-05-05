[CmdletBinding()]
param(
    [string] $ApiUrl = "http://127.0.0.1:8000/api/sensor-data",
    [string] $ApiKey = "buzzyhive-iot-key-2026",
    [string] $DeviceId = "NODE-001",
    [int] $HiveId = 1,
    [int] $IntervalSeconds = 5,
    [int] $Iterations = 60,
    [double] $StartTemp = 33.5,
    [double] $StartHumidity = 70.0,
    [int] $StartMq2 = 250,
    [int] $StartMq3 = 200,
    [int] $StartMq5 = 180,
    [int] $StartMq135 = 220,
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

function Next-Drift {
    param(
        [System.Random] $Generator,
        [double] $CurrentValue,
        [double] $StepSize,
        [double] $Minimum,
        [double] $Maximum,
        [int] $Decimals = 1
    )

    $delta = (($Generator.NextDouble() * 2.0) - 1.0) * $StepSize
    $next = Clamp-Double -Value ($CurrentValue + $delta) -Minimum $Minimum -Maximum $Maximum

    return [Math]::Round($next, $Decimals)
}

function Next-DriftInt {
    param(
        [System.Random] $Generator,
        [int] $CurrentValue,
        [int] $StepSize,
        [int] $Minimum,
        [int] $Maximum
    )

    $delta = $Generator.Next((-1 * $StepSize), ($StepSize + 1))
    $next = Clamp-Int -Value ($CurrentValue + $delta) -Minimum $Minimum -Maximum $Maximum

    return $next
}

if ($IntervalSeconds -lt 0) {
    throw "IntervalSeconds must be 0 or greater."
}

if ($Iterations -lt 1) {
    throw "Iterations must be at least 1."
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

$state = [ordered]@{
    temp = [Math]::Round((Clamp-Double -Value $StartTemp -Minimum -10.0 -Maximum 60.0), 1)
    humidity = [Math]::Round((Clamp-Double -Value $StartHumidity -Minimum 0.0 -Maximum 100.0), 1)
    mq2_value = Clamp-Int -Value $StartMq2 -Minimum 0 -Maximum 4095
    mq3_value = Clamp-Int -Value $StartMq3 -Minimum 0 -Maximum 4095
    mq5_value = Clamp-Int -Value $StartMq5 -Minimum 0 -Maximum 4095
    mq135_value = Clamp-Int -Value $StartMq135 -Minimum 0 -Maximum 4095
}

Write-Host "API URL: $ApiUrl"
Write-Host "Interval: $IntervalSeconds second(s)"
Write-Host "Iterations: $Iterations"
Write-Host "Preview only: $PreviewOnly"
if ($PSBoundParameters.ContainsKey("RandomSeed")) {
    Write-Host "Random seed: $RandomSeed"
}

for ($iteration = 0; $iteration -lt $Iterations; $iteration++) {
    if ($iteration -gt 0) {
        $state.temp = Next-Drift -Generator $generator -CurrentValue $state.temp -StepSize 0.6 -Minimum -10.0 -Maximum 60.0
        $state.humidity = Next-Drift -Generator $generator -CurrentValue $state.humidity -StepSize 1.8 -Minimum 0.0 -Maximum 100.0
        $state.mq2_value = Next-DriftInt -Generator $generator -CurrentValue $state.mq2_value -StepSize 18 -Minimum 0 -Maximum 4095
        $state.mq3_value = Next-DriftInt -Generator $generator -CurrentValue $state.mq3_value -StepSize 14 -Minimum 0 -Maximum 4095
        $state.mq5_value = Next-DriftInt -Generator $generator -CurrentValue $state.mq5_value -StepSize 16 -Minimum 0 -Maximum 4095
        $state.mq135_value = Next-DriftInt -Generator $generator -CurrentValue $state.mq135_value -StepSize 20 -Minimum 0 -Maximum 4095
    }

    $payload = [ordered]@{
        device_id = $DeviceId
        hive_id = $HiveId
        temp = $state.temp
        humidity = $state.humidity
        mq2_value = $state.mq2_value
        mq3_value = $state.mq3_value
        mq5_value = $state.mq5_value
        mq135_value = $state.mq135_value
    }

    $jsonBody = $payload | ConvertTo-Json -Depth 5

    Write-Host ""
    Write-Host ("[{0}/{1}] Drift payload" -f ($iteration + 1), $Iterations)
    Write-Host $jsonBody

    if (-not $PreviewOnly) {
        try {
            $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Headers $headers -Body $jsonBody
            Write-Host ("Response: {0}" -f ($response | ConvertTo-Json -Compress))
        } catch {
            if ($_.Exception.Response) {
                $statusCode = [int] $_.Exception.Response.StatusCode
                Write-Host ("Request failed with HTTP {0}" -f $statusCode) -ForegroundColor Red
            }

            throw
        }
    }

    if ($iteration -lt ($Iterations - 1) -and $IntervalSeconds -gt 0) {
        Start-Sleep -Seconds $IntervalSeconds
    }
}
