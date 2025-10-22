# Throughput Analytics System

## Overview

The Throughput Analytics System provides comprehensive production performance analysis, capacity planning, and bottleneck identification for data-driven manufacturing decisions.

## Features

### 1. **Statistical Throughput Analysis**
- Average production rates (units/hour, units/day)
- Standard deviation and variability metrics
- Trend detection (improving/declining/stable)
- Workstation performance comparison

### 2. **Capacity Prediction**
- Exponential Moving Average (EMA) forecasting
- Confidence intervals (±10%)
- Trend direction analysis
- Working days calculation

### 3. **Bottleneck Identification**
- Compare planned vs historical capacity
- Identify overloaded schedules
- Generate actionable recommendations
- Severity-based alerts

### 4. **OEE Calculations**
- Overall Equipment Effectiveness
- Availability, Performance, Quality metrics
- Workstation-level breakdown

### 5. **Daily Usage Rate**
- Material consumption analysis
- Reorder planning support

## API Endpoints

### GET /api/analytics/throughput

Query parameters determine the type of analysis:

#### 1. Throughput Metrics

```
GET /api/analytics/throughput?analysisType=metrics&productId=prod-123&startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "type": "metrics",
  "data": {
    "productId": "prod-123",
    "productName": "Widget A",
    "productSku": "WGT-A-001",
    "dateRange": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-31T23:59:59Z"
    },
    "totalUnitsProduced": 15000,
    "totalHoursWorked": 480,
    "averageUnitsPerHour": 31.25,
    "averageUnitsPerDay": 250,
    "averageEfficiency": 0.87,
    "averageDefectRate": 0.015,
    "standardDeviation": 12.5,
    "coefficientOfVariation": 0.05,
    "efficiencyTrend": "improving",
    "efficiencyChange": 7.2,
    "defectRateTrend": "improving",
    "defectRateChange": -12.5,
    "qualityRate": 0.985,
    "workstationMetrics": [
      {
        "workstationId": "WS-001",
        "unitsProduced": 8000,
        "hoursWorked": 240,
        "efficiency": 0.92,
        "defectRate": 0.01
      },
      {
        "workstationId": "WS-002",
        "unitsProduced": 7000,
        "hoursWorked": 240,
        "efficiency": 0.82,
        "defectRate": 0.02
      }
    ]
  }
}
```

#### 2. Capacity Prediction

```
GET /api/analytics/throughput?analysisType=prediction&productId=prod-123&futureDays=30
```

**Response:**
```json
{
  "type": "prediction",
  "data": {
    "productId": "prod-123",
    "productName": "Widget A",
    "predictionDays": 30,
    "historicalDataPoints": 30,
    "predictedDailyCapacity": 260,
    "predictedTotalCapacity": 5460,
    "confidenceLower": 234,
    "confidenceUpper": 286,
    "exponentialMovingAverage": 260,
    "simpleMovingAverage": 255,
    "trendDirection": "increasing",
    "trendStrength": 0.45,
    "workingDaysPerWeek": 5,
    "workingDaysInPrediction": 21,
    "hoursPerDay": 8,
    "warnings": []
  }
}
```

#### 3. Bottleneck Identification

```
GET /api/analytics/throughput?analysisType=bottlenecks&scheduleId=SCHED-001
```

**Response:**
```json
{
  "type": "bottlenecks",
  "data": {
    "scheduleId": "SCHED-001",
    "warningCount": 1,
    "warnings": [
      {
        "scheduleId": "SCHED-001",
        "productId": "prod-123",
        "productName": "Widget A",
        "workstationId": "WS-001",
        "plannedDailyRate": 350,
        "historicalDailyRate": 260,
        "capacityExceeded": 34.6,
        "shortfall": 450,
        "startDate": "2025-02-01T00:00:00Z",
        "endDate": "2025-02-05T00:00:00Z",
        "durationDays": 5,
        "severity": "warning",
        "recommendations": [
          "Reduce daily target to 260 units/day",
          "Consider process improvements to increase capacity by 35%",
          "Consider adding second shift to increase capacity"
        ]
      }
    ]
  }
}
```

#### 4. Production Efficiency (OEE)

```
GET /api/analytics/throughput?analysisType=efficiency&workstationId=WS-001&startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "type": "efficiency",
  "data": {
    "dateRange": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-31T23:59:59Z"
    },
    "workstationId": "WS-001",
    "availability": 0.95,
    "performance": 0.88,
    "quality": 0.985,
    "oee": 0.823,
    "workstations": [
      {
        "workstationId": "WS-001",
        "availability": 0.95,
        "performance": 0.88,
        "quality": 0.985,
        "oee": 0.823,
        "totalHours": 228,
        "unitsProduced": 8000,
        "defectRate": 0.015
      }
    ],
    "totalUnitsProduced": 8000,
    "totalHoursWorked": 228,
    "totalDefects": 120,
    "overallDefectRate": 0.015
  }
}
```

#### 5. Daily Usage Rate

```
GET /api/analytics/throughput?analysisType=usage&partNumber=PART-001&days=30
```

**Response:**
```json
{
  "type": "usage",
  "data": {
    "partNumber": "PART-001",
    "lookbackDays": 30,
    "dailyUsageRate": 125.5
  }
}
```

## Library Functions

### 1. analyzeThroughput()

```typescript
import { analyzeThroughput } from '@/lib/throughput-analyzer'

const metrics = await analyzeThroughput(
  'prod-123',
  {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31')
  }
)

console.log(`Average production: ${metrics.averageUnitsPerDay} units/day`)
console.log(`Efficiency trend: ${metrics.efficiencyTrend}`)
console.log(`Quality rate: ${(metrics.qualityRate * 100).toFixed(1)}%`)
```

**Calculations:**

- **Average Units Per Hour** = Total Units / Total Hours
- **Average Units Per Day** = Units Per Hour × 8 hours
- **Standard Deviation**: Variability in daily production
- **Coefficient of Variation**: Normalized variability (σ/μ)
- **Efficiency Trend**: Compare first half vs second half
  - `improving` if second half > first half by >5%
  - `declining` if second half < first half by >5%
  - `stable` otherwise
- **Defect Rate Trend**: Same logic (improvement = decrease)

### 2. predictCapacity()

```typescript
import { predictCapacity } from '@/lib/throughput-analyzer'

const prediction = await predictCapacity('prod-123', 30)

console.log(`Predicted capacity: ${prediction.predictedDailyCapacity} units/day`)
console.log(`Trend: ${prediction.trendDirection}`)
console.log(`Confidence: ${prediction.confidenceLower} - ${prediction.confidenceUpper}`)
```

**Algorithm:**

1. **Get Historical Data**: Last 30-90 days
2. **Calculate Simple Moving Average (SMA)**:
   ```
   SMA = Σ(daily production) / n
   ```
3. **Calculate Exponential Moving Average (EMA)**:
   ```
   EMA[0] = daily production[0]
   EMA[t] = α × production[t] + (1 - α) × EMA[t-1]
   α = 0.3 (smoothing factor)
   ```
4. **Detect Trend**:
   ```
   First quarter avg vs Last quarter avg
   Change > 5% = increasing/decreasing
   Change ≤ 5% = stable
   ```
5. **Apply Trend Adjustment**:
   ```
   prediction = EMA × (1 + trend_change × 0.5)
   ```
6. **Confidence Interval**: ±10% of prediction
7. **Calculate Working Days**: Exclude weekends

### 3. identifyBottlenecks()

```typescript
import { identifyBottlenecks } from '@/lib/throughput-analyzer'

const warnings = await identifyBottlenecks('SCHED-001')

for (const warning of warnings) {
  console.log(`${warning.severity.toUpperCase()}: Capacity exceeded by ${warning.capacityExceeded}%`)
  console.log('Recommendations:')
  warning.recommendations.forEach(rec => console.log(`  - ${rec}`))
}
```

**Logic:**

1. Get production schedule
2. Calculate planned daily rate
3. Get historical throughput for same product/workstation
4. Calculate historical average daily rate
5. Compare planned vs historical:
   ```
   capacity_ratio = planned / historical

   if ratio > 1.5: severity = critical
   if ratio > 1.25: severity = warning
   if ratio > 1.1: severity = info
   ```
6. Calculate shortfall:
   ```
   shortfall = (planned - historical) × duration_days
   ```
7. Generate recommendations:
   - Extend timeline
   - Reduce daily target
   - Improve processes
   - Add shifts

### 4. getProductionEfficiency()

```typescript
import { getProductionEfficiency } from '@/lib/throughput-analyzer'

const efficiency = await getProductionEfficiency('WS-001', {
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31')
})

console.log(`OEE: ${(efficiency.oee * 100).toFixed(1)}%`)
console.log(`Availability: ${(efficiency.availability * 100).toFixed(1)}%`)
console.log(`Performance: ${(efficiency.performance * 100).toFixed(1)}%`)
console.log(`Quality: ${(efficiency.quality * 100).toFixed(1)}%`)
```

**OEE Calculation:**

```
Availability = Actual Hours Worked / Total Available Hours
Performance = Actual Production / Theoretical Production
Quality = Good Units / Total Units = 1 - Defect Rate
OEE = Availability × Performance × Quality
```

**World-Class Benchmarks:**
- OEE ≥ 85%: World-class
- OEE 60-85%: Good
- OEE < 60%: Needs improvement

### 5. calculateDailyUsageRate()

```typescript
import { calculateDailyUsageRate } from '@/lib/throughput-analyzer'

const usageRate = await calculateDailyUsageRate('PART-001', 30)

console.log(`Daily usage: ${usageRate.toFixed(1)} units/day`)
```

**Algorithm:**

1. Get completed production schedules from last N days
2. For each schedule:
   - Find BOM entry for part
   - Calculate: `parts_used = quantity_needed × units_produced`
3. Sum total parts used
4. Calculate: `daily_usage = total_used / days`

## Analytics Dashboard

### Location
`/analytics/throughput`

### Features

#### 1. Filters
- **Product selector**: Dropdown of all products
- **Date range**: Start and end date pickers
- **Auto-refresh**: Updates when filters change

#### 2. Metrics Cards
- Average Units/Hour
- Average Units/Day
- Efficiency Trend (with directional indicator)
- Quality Rate

#### 3. Production Summary
- Total units produced
- Total hours worked
- Standard deviation
- Data points

#### 4. Capacity Prediction Chart
- Bar chart with error bars (±10% confidence)
- Reference line showing current average
- 30-day forecast

#### 5. Workstation Comparison Table
- Sortable by any column
- Color-coded efficiency:
  - Green: ≥85%
  - Yellow: 70-85%
  - Red: <70%
- Shows units, hours, efficiency, defect rate

#### 6. Export Functionality
- Print report
- Download charts as images

## Statistical Methods

### Exponential Moving Average (EMA)

EMA gives more weight to recent data points:

```
EMA[t] = α × Value[t] + (1 - α) × EMA[t-1]
```

Where:
- α (alpha) = 0.3 (smoothing factor)
- Higher α = more responsive to recent changes
- Lower α = smoother, less reactive

### Trend Detection

```typescript
// Split data into first and second half
const midpoint = Math.floor(data.length / 2)
const firstHalf = data.slice(0, midpoint)
const secondHalf = data.slice(midpoint)

// Calculate averages
const firstAvg = mean(firstHalf)
const secondAvg = mean(secondHalf)

// Calculate change
const change = (secondAvg - firstAvg) / firstAvg

// Classify trend
if (change > 0.05) trend = 'improving'
else if (change < -0.05) trend = 'declining'
else trend = 'stable'
```

### Coefficient of Variation

Measures relative variability:

```
CV = σ / μ

Where:
  σ = standard deviation
  μ = mean
```

**Interpretation:**
- CV < 0.1: Low variability (consistent)
- CV 0.1-0.3: Moderate variability
- CV > 0.3: High variability (unpredictable)

## Use Cases

### 1. Capacity Planning

**Scenario**: Planning a new sales order

```typescript
// Get capacity prediction
const prediction = await predictCapacity('prod-123', 30)

// Check if we can fulfill 5000 units in 30 days
if (prediction.predictedTotalCapacity >= 5000) {
  console.log('✓ Capacity sufficient')
} else {
  const shortfall = 5000 - prediction.predictedTotalCapacity
  console.log(`✗ Short by ${shortfall} units`)
  console.log(`Need to increase daily capacity or extend timeline`)
}
```

### 2. Bottleneck Detection

**Scenario**: Validating a production schedule before execution

```typescript
// Create schedule
const schedule = await createSchedule({
  productId: 'prod-123',
  unitsPerDay: 350,
  duration: 5
})

// Check for bottlenecks
const warnings = await identifyBottlenecks(schedule.scheduleId)

if (warnings.length > 0) {
  console.log('⚠ Bottlenecks detected:')
  warnings.forEach(w => {
    console.log(`  - ${w.productName} at ${w.workstationId}`)
    console.log(`    Exceeds capacity by ${w.capacityExceeded.toFixed(1)}%`)
  })
}
```

### 3. Performance Monitoring

**Scenario**: Monthly performance review

```typescript
const efficiency = await getProductionEfficiency(undefined, {
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31')
})

console.log(`Overall OEE: ${(efficiency.oee * 100).toFixed(1)}%`)

// Identify underperforming workstations
const underperformers = efficiency.workstations.filter(
  ws => ws.oee < 0.6
)

if (underperformers.length > 0) {
  console.log('Workstations needing improvement:')
  underperformers.forEach(ws => {
    console.log(`  - ${ws.workstationId}: OEE ${(ws.oee * 100).toFixed(1)}%`)
  })
}
```

### 4. Inventory Reorder Planning

**Scenario**: Calculate reorder point based on actual usage

```typescript
const dailyUsage = await calculateDailyUsageRate('PART-001', 30)
const leadTime = 7 // days
const safetyStock = dailyUsage * 3 // 3 days buffer

const reorderPoint = (dailyUsage × leadTime) + safetyStock

console.log(`Reorder point: ${Math.ceil(reorderPoint)} units`)
console.log(`Based on ${dailyUsage.toFixed(1)} units/day average usage`)
```

## Data Requirements

### ThroughputData Table

The system requires populated `ThroughputData` records:

```typescript
await prisma.throughputData.create({
  data: {
    date: new Date(),
    productId: 'prod-123',
    unitsProduced: 250,
    hoursWorked: 8,
    defectRate: 0.02,
    workstationId: 'WS-001',
    efficiency: 0.85
  }
})
```

**Minimum requirements:**
- At least 7 days of data for basic analysis
- 30 days for accurate capacity prediction
- 90+ days for seasonal pattern detection

## Performance Considerations

### Query Optimization

```typescript
// ✅ GOOD - Use date range indexes
const data = await prisma.throughputData.findMany({
  where: {
    productId,
    date: {
      gte: startDate,
      lte: endDate
    }
  }
})

// ❌ BAD - Fetching all data and filtering in memory
const allData = await prisma.throughputData.findMany()
const filtered = allData.filter(d => d.productId === productId)
```

### Caching Recommendations

```typescript
// Cache predictions for 1 hour
const cacheKey = `prediction:${productId}:${days}`
let prediction = await cache.get(cacheKey)

if (!prediction) {
  prediction = await predictCapacity(productId, days)
  await cache.set(cacheKey, prediction, 3600) // 1 hour TTL
}
```

## Testing

See test examples in library functions. Key scenarios:

1. **Statistical accuracy**: Verify trend detection
2. **Edge cases**: No data, single data point
3. **Prediction bounds**: Confidence intervals
4. **OEE calculation**: Component multiplication
5. **Bottleneck thresholds**: Severity levels

## Future Enhancements

- [ ] Machine learning-based predictions
- [ ] Seasonal pattern detection (ARIMA models)
- [ ] Real-time dashboard updates (WebSocket)
- [ ] Anomaly detection for quality issues
- [ ] Multi-product capacity optimization
- [ ] Shift-level granularity
- [ ] Export to Excel/PDF with charts
- [ ] Email alerts for bottlenecks

## References

- **OEE Standard**: ISO 22400-2
- **Statistical Process Control**: NIST/SEMATECH e-Handbook
- **Exponential Smoothing**: Holt-Winters Method
- **World-Class OEE**: >85% (Lean Manufacturing benchmarks)
