[CmdletBinding()]
param(
    [string] $ApiUrl = "http://127.0.0.1:8000/api/sensor-data",
    [string] $ApiKey = "buzzyhive-iot-key-2026",
    [string] $PayloadFile = "",
    [string] $DeviceId = "NODE-001",
    [int] $HiveId = 1,
    [int] $IntervalSeconds = 5,
    [int] $Iterations = 12,
    [switch] $PreviewOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-DefaultPayloads {
    param(
        [string] $ResolvedDeviceId,
        [int] $ResolvedHiveId
    )

    return @(
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 32.8
            humidity = 68
            mq2_value = 180
            mq3_value = 150
            mq5_value = 160
            mq135_value = 190
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 33.5
            humidity = 70
            mq2_value = 250
            mq3_value = 200
            mq5_value = 180
            mq135_value = 220
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 34.6
            humidity = 73
            mq2_value = 260
            mq3_value = 210
            mq5_value = 195
            mq135_value = 230
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 35.4
            humidity = 76
            mq2_value = 340
            mq3_value = 280
            mq5_value = 320
            mq135_value = 360
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 35.1
            humidity = 75
            mq2_value = 325
            mq3_value = 266
            mq5_value = 305
            mq135_value = 342
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 34.8
            humidity = 74
            mq2_value = 310
            mq3_value = 252
            mq5_value = 288
            mq135_value = 330
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 34.4
            humidity = 72
            mq2_value = 292
            mq3_value = 236
            mq5_value = 268
            mq135_value = 308
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 34.0
            humidity = 71
            mq2_value = 274
            mq3_value = 224
            mq5_value = 244
            mq135_value = 286
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 33.6
            humidity = 70
            mq2_value = 256
            mq3_value = 212
            mq5_value = 224
            mq135_value = 264
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 33.2
            humidity = 69
            mq2_value = 238
            mq3_value = 198
            mq5_value = 206
            mq135_value = 244
        },
        @{
            device_id = $ResolvedDeviceId
            hive_id = $ResolvedHiveId
            temp = 32.9
            humidity = 68
            mq2_value = 220
            mq3_value = 184
            mq5_value = 188
            mq135_value = 224
        }
    )
}

function Get-PayloadsFromFile {
    param(
        [string] $Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Payload file not found: $Path"
    }

    $rawJson = Get-Content -Raw -LiteralPath $Path
    $parsed = $rawJson | ConvertFrom-Json

    if ($parsed -isnot [System.Collections.IEnumerable] -or $parsed -is [string]) {
        throw "Payload file must contain a JSON array of payload objects."
    }

    $payloads = @($parsed)

    if ($payloads.Count -eq 0) {
        throw "Payload file does not contain any payloads."
    }

    return $payloads
}

function Assert-PayloadShape {
    param(
        [object] $Payload,
        [int] $Index
    )

    $requiredKeys = @(
        "device_id",
        "hive_id",
        "temp",
        "humidity",
        "mq2_value",
        "mq3_value",
        "mq5_value",
        "mq135_value"
    )

    foreach ($key in $requiredKeys) {
        if (-not ($Payload.PSObject.Properties.Name -contains $key)) {
            throw "Payload #$Index is missing required key '$key'."
        }
    }
}

if ($IntervalSeconds -lt 0) {
    throw "IntervalSeconds must be 0 or greater."
}

if ($Iterations -lt 1) {
    throw "Iterations must be at least 1."
}

$payloads = if ($PayloadFile) {
    Get-PayloadsFromFile -Path $PayloadFile
} else {
    Get-DefaultPayloads -ResolvedDeviceId $DeviceId -ResolvedHiveId $HiveId
}

for ($i = 0; $i -lt $payloads.Count; $i++) {
    Assert-PayloadShape -Payload $payloads[$i] -Index ($i + 1)
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
Write-Host "Payload count: $($payloads.Count)"

for ($iteration = 0; $iteration -lt $Iterations; $iteration++) {
    $payloadIndex = $iteration % $payloads.Count
    $payload = $payloads[$payloadIndex]
    $jsonBody = $payload | ConvertTo-Json -Depth 5

    Write-Host ""
    Write-Host ("[{0}/{1}] Payload #{2}" -f ($iteration + 1), $Iterations, ($payloadIndex + 1))
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
