[CmdletBinding()]
param(
    [string] $AppUrl = "https://buzzyhive.urban-alert.com",
    [string] $MlUrl = "https://ml.buzzyhive.urban-alert.com",
    [string] $ApiKey = "",
    [string] $DeviceId = "",
    [int] $HiveId = 0,
    [switch] $SkipMlPredict,
    [switch] $SkipSensorIngest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Section {
    param([string] $Title)

    Write-Host ""
    Write-Host ("=== {0} ===" -f $Title) -ForegroundColor Cyan
}

function Assert-StatusCode {
    param(
        [int] $StatusCode,
        [int[]] $Allowed,
        [string] $Context
    )

    if ($Allowed -notcontains $StatusCode) {
        throw "$Context returned HTTP $StatusCode. Expected one of: $($Allowed -join ', ')"
    }
}

function Invoke-JsonGet {
    param([string] $Url)

    return Invoke-RestMethod -Uri $Url -Method Get -Headers @{ Accept = 'application/json' } -TimeoutSec 20
}

function Invoke-RawGet {
    param([string] $Url)

    return Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 20
}

function Test-LaravelHealth {
    param([string] $BaseUrl)

    Write-Section "Laravel health"

    $upUrl = "$($BaseUrl.TrimEnd('/'))/up"
    $loginUrl = "$($BaseUrl.TrimEnd('/'))/login"

    $upResponse = Invoke-RawGet -Url $upUrl
    Assert-StatusCode -StatusCode $upResponse.StatusCode -Allowed @(200) -Context $upUrl
    Write-Host ("PASS {0} -> HTTP {1}" -f $upUrl, $upResponse.StatusCode) -ForegroundColor Green

    $loginResponse = Invoke-RawGet -Url $loginUrl
    Assert-StatusCode -StatusCode $loginResponse.StatusCode -Allowed @(200) -Context $loginUrl
    Write-Host ("PASS {0} -> HTTP {1}" -f $loginUrl, $loginResponse.StatusCode) -ForegroundColor Green
}

function Test-MlHealth {
    param([string] $BaseUrl)

    Write-Section "ML health"

    $healthUrl = "$($BaseUrl.TrimEnd('/'))/health"
    $health = Invoke-JsonGet -Url $healthUrl

    if ($health.status -ne "ok") {
        throw "$healthUrl returned unexpected status: $($health.status)"
    }

    Write-Host ("PASS {0} -> status={1}" -f $healthUrl, $health.status) -ForegroundColor Green
}

function Test-MlPredict {
    param([string] $BaseUrl)

    Write-Section "ML predict"

    $predictUrl = "$($BaseUrl.TrimEnd('/'))/predict"
    $payload = @{
        mq2_value = 120
        mq3_value = 95
        mq5_value = 110
        mq135_value = 140
        temp = 31.2
        humidity = 78.4
    }

    $response = Invoke-RestMethod `
        -Uri $predictUrl `
        -Method Post `
        -Headers @{
            Accept = 'application/json'
            'Content-Type' = 'application/json'
        } `
        -Body ($payload | ConvertTo-Json -Depth 5) `
        -TimeoutSec 20

    $requiredKeys = @(
        "readiness_level",
        "hri_value",
        "confidence_score",
        "warning_state",
        "guardrail_action",
        "out_of_distribution",
        "prediction_warning"
    )

    foreach ($key in $requiredKeys) {
        if (-not ($response.PSObject.Properties.Name -contains $key)) {
            $receivedKeys = $response.PSObject.Properties.Name | Sort-Object
            throw "$predictUrl response is missing required key '$key'. Received keys: $($receivedKeys -join ', '). This usually means the production ML app is still on an older response contract."
        }
    }

    Write-Host ("PASS {0} -> readiness={1}, warning_state={2}" -f $predictUrl, $response.readiness_level, $response.warning_state) -ForegroundColor Green
}

function Test-SensorIngest {
    param(
        [string] $BaseUrl,
        [string] $ResolvedApiKey,
        [string] $ResolvedDeviceId,
        [int] $ResolvedHiveId
    )

    Write-Section "Sensor ingest"

    if ([string]::IsNullOrWhiteSpace($ResolvedApiKey)) {
        throw "ApiKey is required for the sensor ingest test."
    }

    if ([string]::IsNullOrWhiteSpace($ResolvedDeviceId)) {
        throw "DeviceId is required for the sensor ingest test."
    }

    if ($ResolvedHiveId -lt 1) {
        throw "HiveId must be 1 or greater for the sensor ingest test."
    }

    $sensorUrl = "$($BaseUrl.TrimEnd('/'))/api/sensor-data"
    $payload = @{
        device_id = $ResolvedDeviceId
        hive_id = $ResolvedHiveId
        temp = 33.2
        humidity = 71.0
        mq2_value = 240
        mq3_value = 190
        mq5_value = 205
        mq135_value = 225
    }

    $response = Invoke-RestMethod `
        -Uri $sensorUrl `
        -Method Post `
        -Headers @{
            Accept = 'application/json'
            'Content-Type' = 'application/json'
            'X-API-Key' = $ResolvedApiKey
        } `
        -Body ($payload | ConvertTo-Json -Depth 5) `
        -TimeoutSec 20

    if ($response.status -ne "ok") {
        throw "$sensorUrl returned unexpected status: $($response.status)"
    }

    Write-Host ("PASS {0} -> status={1}" -f $sensorUrl, $response.status) -ForegroundColor Green
}

Write-Host "App URL: $AppUrl"
Write-Host "ML URL: $MlUrl"
Write-Host ("Run ML predict test: {0}" -f (-not $SkipMlPredict))
Write-Host ("Run sensor ingest test: {0}" -f (-not $SkipSensorIngest))

Test-LaravelHealth -BaseUrl $AppUrl
Test-MlHealth -BaseUrl $MlUrl

if (-not $SkipMlPredict) {
    Test-MlPredict -BaseUrl $MlUrl
}

if (-not $SkipSensorIngest) {
    Test-SensorIngest `
        -BaseUrl $AppUrl `
        -ResolvedApiKey $ApiKey `
        -ResolvedDeviceId $DeviceId `
        -ResolvedHiveId $HiveId
}

Write-Host ""
Write-Host "All requested production smoke checks passed." -ForegroundColor Green
