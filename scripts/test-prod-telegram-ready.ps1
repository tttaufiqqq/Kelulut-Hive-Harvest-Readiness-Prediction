[CmdletBinding()]
param(
    [string] $AppUrl = "https://buzzyhive.urban-alert.com",
    [string] $TestSecret = "",
    [string] $DeviceId = "",
    [int] $HiveId = 0,
    [ValidateSet("full_pipeline", "synthetic_ready")]
    [string] $Mode = "synthetic_ready",
    [string] $MlUrl = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-MlUrl {
    param(
        [string] $ResolvedAppUrl,
        [string] $ExplicitMlUrl
    )

    if (-not [string]::IsNullOrWhiteSpace($ExplicitMlUrl)) {
        return $ExplicitMlUrl.TrimEnd('/')
    }

    $appUri = [Uri] $ResolvedAppUrl
    $resolvedHost = $appUri.Host

    if ($resolvedHost -in @('127.0.0.1', 'localhost', '::1')) {
        return "{0}://{1}:5000" -f $appUri.Scheme, $resolvedHost
    }

    return "{0}://ml.{1}" -f $appUri.Scheme, $resolvedHost
}

function ConvertFrom-JsonSafe {
    param([string] $Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    $normalizedText = $Text.Trim()
    if ($normalizedText.Length -gt 0 -and [int][char] $normalizedText[0] -eq 65279) {
        $normalizedText = $normalizedText.Substring(1)
    }

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

function Get-PropertyValue {
    param(
        $Object,
        [string] $PropertyName
    )

    if ($null -eq $Object) {
        return $null
    }

    if ($Object -is [System.Collections.IDictionary]) {
        if ($Object.Contains($PropertyName)) {
            return $Object[$PropertyName]
        }

        return $null
    }

    if ($Object -is [string]) {
        $trimmed = $Object.Trim()
        if ($trimmed.StartsWith("{") -or $trimmed.StartsWith("[")) {
            $parsed = ConvertFrom-JsonSafe -Text $trimmed
            if ($parsed -ne $Object) {
                return Get-PropertyValue -Object $parsed -PropertyName $PropertyName
            }
        }

        return $null
    }

    $property = $Object.PSObject.Properties[$PropertyName]
    if ($null -eq $property) {
        return $null
    }

    return $property.Value
}

function Invoke-JsonPost {
    param(
        [string] $Url,
        [hashtable] $Headers,
        [hashtable] $Payload
    )

    $jsonBody = $Payload | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-WebRequest `
            -Uri $Url `
            -Method Post `
            -Headers $Headers `
            -Body $jsonBody `
            -ContentType "application/json" `
            -UseBasicParsing `
            -TimeoutSec 25

        return [pscustomobject]@{
            StatusCode = [int] $response.StatusCode
            Body = ConvertFrom-JsonSafe -Text $response.Content
            RawBody = $response.Content
        }
    } catch {
        $exceptionMessage = Get-PropertyValue -Object $_.Exception -PropertyName "Message"

        if (-not $_.Exception.Response) {
            return [pscustomobject]@{
                StatusCode = 0
                Body = [pscustomobject]@{
                    message = "Request failed before an HTTP response was returned."
                    failure_reason = $(if ($exceptionMessage) { $exceptionMessage } else { [string] $_ })
                }
                RawBody = $null
            }
        }

        $statusCode = [int] $_.Exception.Response.StatusCode
        $errorDetailsMessage = Get-PropertyValue -Object $_.ErrorDetails -PropertyName "Message"
        $bodyText = if ($errorDetailsMessage) { $errorDetailsMessage } else { [string] $_ }

        return [pscustomobject]@{
            StatusCode = $statusCode
            Body = ConvertFrom-JsonSafe -Text $bodyText
            RawBody = $bodyText
        }
    }
}

function Get-FullPipelineCandidates {
    return @(
        @{
            name = "baseline_in_range"
            temp = 31.2
            humidity = 76.0
            mq2_value = 145
            mq3_value = 160
            mq5_value = 235
            mq135_value = 280
        },
        @{
            name = "warm_stable"
            temp = 31.8
            humidity = 74.8
            mq2_value = 148
            mq3_value = 165
            mq5_value = 229
            mq135_value = 274
        },
        @{
            name = "dry_clear"
            temp = 32.4
            humidity = 72.6
            mq2_value = 152
            mq3_value = 168
            mq5_value = 224
            mq135_value = 268
        }
    )
}

function Get-SyntheticPayload {
    return @{
        name = "synthetic_safe"
        temp = 33.0
        humidity = 74.0
        mq2_value = 180
        mq3_value = 170
        mq5_value = 240
        mq135_value = 285
    }
}

function Select-FullPipelinePayload {
    param([string] $ResolvedMlUrl)

    $headers = @{
        Accept = "application/json"
    }

    $candidates = Get-FullPipelineCandidates
    $fallback = $candidates[0]

    foreach ($candidate in $candidates) {
        try {
            $response = Invoke-JsonPost -Url "$ResolvedMlUrl/predict" -Headers $headers -Payload $candidate
        } catch {
            Write-Host ("WARN preflight unavailable at {0}; using fallback candidate {1}" -f $ResolvedMlUrl, $fallback.name) -ForegroundColor Yellow

            return [pscustomobject]@{
                Candidate = $fallback
                Preflight = "unavailable"
            }
        }

        $body = $response.Body
        if ($response.StatusCode -ne 200 -or -not $body) {
            continue
        }

        $readinessLevel = Get-ObjectValue -Object $body -PropertyName "readiness_level"
        $guardrailAction = Get-ObjectValue -Object $body -PropertyName "guardrail_action"

        if ($readinessLevel -eq "ready") {
            Write-Host ("PRECHECK candidate={0} readiness={1} guardrail={2}" -f $candidate.name, (Format-Value -Value $readinessLevel), (Format-Value -Value $guardrailAction)) -ForegroundColor Green

            return [pscustomobject]@{
                Candidate = $candidate
                Preflight = "matched_ready"
            }
        }

        Write-Host ("PRECHECK candidate={0} readiness={1} guardrail={2}" -f $candidate.name, (Format-Value -Value $readinessLevel), (Format-Value -Value $guardrailAction)) -ForegroundColor DarkYellow
    }

    Write-Host ("WARN no preflight candidate returned ready; using fallback candidate {0}" -f $fallback.name) -ForegroundColor Yellow

    return [pscustomobject]@{
        Candidate = $fallback
        Preflight = "no_ready_match"
    }
}

function Format-Value {
    param($Value)

    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string] $Value)) {
        return "-"
    }

    return [string] $Value
}

function Get-ObjectValue {
    param(
        $Object,
        [string] $PropertyName
    )

    return Get-PropertyValue -Object $Object -PropertyName $PropertyName
}

if ([string]::IsNullOrWhiteSpace($TestSecret)) {
    throw "TestSecret is required."
}

if ([string]::IsNullOrWhiteSpace($DeviceId)) {
    throw "DeviceId is required."
}

if ($HiveId -lt 1) {
    throw "HiveId must be 1 or greater."
}

$resolvedAppUrl = $AppUrl.TrimEnd('/')
$resolvedMlUrl = Resolve-MlUrl -ResolvedAppUrl $resolvedAppUrl -ExplicitMlUrl $MlUrl
$diagnosticUrl = "$resolvedAppUrl/api/internal/test-telegram-ready"

$selection = if ($Mode -eq "full_pipeline") {
    Select-FullPipelinePayload -ResolvedMlUrl $resolvedMlUrl
} else {
    [pscustomobject]@{
        Candidate = Get-SyntheticPayload
        Preflight = "forced_synthetic"
    }
}

$payload = [ordered]@{
    mode = $Mode
    device_id = $DeviceId
    hive_id = $HiveId
    temp = $selection.Candidate.temp
    humidity = $selection.Candidate.humidity
    mq2_value = $selection.Candidate.mq2_value
    mq3_value = $selection.Candidate.mq3_value
    mq5_value = $selection.Candidate.mq5_value
    mq135_value = $selection.Candidate.mq135_value
}

$headers = @{
    Accept = "application/json"
    "X-Test-Secret" = $TestSecret
}

$response = Invoke-JsonPost -Url $diagnosticUrl -Headers $headers -Payload $payload
$body = $response.Body
$passed = $response.StatusCode -eq 201

$summary = "{0} mode={1} http={2} sensor_log_id={3} prediction_id={4} readiness={5} source={6} queue={7}" -f `
    ($(if ($passed) { "PASS" } else { "FAIL" })), `
    $Mode, `
    $response.StatusCode, `
    (Format-Value -Value (Get-ObjectValue -Object $body -PropertyName "sensor_log_id")), `
    (Format-Value -Value (Get-ObjectValue -Object $body -PropertyName "prediction_id")), `
    (Format-Value -Value (Get-ObjectValue -Object $body -PropertyName "readiness_level")), `
    (Format-Value -Value (Get-ObjectValue -Object $body -PropertyName "prediction_source")), `
    (Format-Value -Value (Get-ObjectValue -Object $body -PropertyName "telegram_dispatch"))

Write-Host $summary -ForegroundColor ($(if ($passed) { "Green" } else { "Red" }))
Write-Host ("DETAIL mode={0} candidate={1} preflight={2} message={3}" -f $Mode, $selection.Candidate.name, $selection.Preflight, (Format-Value -Value (Get-ObjectValue -Object $body -PropertyName "message")))

$hasParsedSummaryFields = @(
    (Get-ObjectValue -Object $body -PropertyName "sensor_log_id"),
    (Get-ObjectValue -Object $body -PropertyName "prediction_id"),
    (Get-ObjectValue -Object $body -PropertyName "readiness_level"),
    (Get-ObjectValue -Object $body -PropertyName "prediction_source"),
    (Get-ObjectValue -Object $body -PropertyName "telegram_dispatch")
) | Where-Object { $null -ne $_ }
$hasParsedSummaryFields = @($hasParsedSummaryFields)

if ($response.RawBody -and $hasParsedSummaryFields.Count -eq 0) {
    Write-Host ("DETAIL raw_response={0}" -f $response.RawBody)
}

if (-not $passed -and (Get-ObjectValue -Object $body -PropertyName "failure_reason")) {
    Write-Host ("DETAIL failure_reason={0}" -f (Get-ObjectValue -Object $body -PropertyName "failure_reason")) -ForegroundColor Red
}

if (-not $passed) {
    exit 1
}
