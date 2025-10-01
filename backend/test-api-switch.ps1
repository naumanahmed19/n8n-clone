# Test if Switch node is available in API response
# Get token from environment or use default

$token = $env:AUTH_TOKEN
if (-not $token) {
    Write-Host "No AUTH_TOKEN found in environment" -ForegroundColor Red
    Write-Host "Please set it with: Set AUTH_TOKEN variable" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or get it from your browser localStorage/cookies when logged in" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Checking for Switch node in API..." -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/node-types" -Method Get -Headers $headers
    
    if ($response.success) {
        $total = $response.pagination.total
        Write-Host "✅ API returned $total nodes" -ForegroundColor Green
        Write-Host ""
        
        # Find Switch node
        $switchNode = $response.data | Where-Object { $_.type -eq "switch" }
        
        if ($switchNode) {
            Write-Host "🎉 Switch node FOUND!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 Details:" -ForegroundColor Cyan
            Write-Host "  Type: $($switchNode.type)"
            Write-Host "  Display Name: $($switchNode.displayName)"
            Write-Host "  Name: $($switchNode.name)"
            Write-Host "  Group: $($switchNode.group -join ', ')"
            Write-Host "  Properties: $($switchNode.properties.Length)"
            Write-Host ""
            
            # Check for Outputs property
            $outputsProperty = $switchNode.properties | Where-Object { $_.name -eq "outputs" }
            if ($outputsProperty) {
                Write-Host "✅ Outputs property found!" -ForegroundColor Green
                Write-Host "  Type: $($outputsProperty.type)"
                Write-Host "  Component: $($outputsProperty.component)"
                Write-Host "  Multiple Values: $($outputsProperty.typeOptions.multipleValues)"
                Write-Host "  Button Text: $($outputsProperty.typeOptions.multipleValueButtonText)"
                
                if ($outputsProperty.componentProps.fields) {
                    Write-Host "  Nested Fields: $($outputsProperty.componentProps.fields.Length)"
                    $outputsProperty.componentProps.fields | ForEach-Object {
                        Write-Host "    - $($_.displayName) ($($_.name)) - $($_.type)"
                    }
                }
            }
        } else {
            Write-Host "❌ Switch node NOT FOUND in API response" -ForegroundColor Red
            Write-Host ""
            Write-Host "📋 Available nodes:" -ForegroundColor Yellow
            $response.data | Select-Object type, displayName | Format-Table -AutoSize
        }
    } else {
        Write-Host "❌ API request failed: $($response.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*UNAUTHORIZED*") {
        Write-Host ""
        Write-Host "Your token might be expired or invalid" -ForegroundColor Yellow
        Write-Host "Get a new token from your browser and set it" -ForegroundColor Yellow
    }
}
