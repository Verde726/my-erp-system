# BOM Upload API Guide

## Endpoint

```
POST /api/upload/bom
```

## Description

Upload and process BOM (Bill of Materials) items from a CSV file. The endpoint handles validation, duplicate checking, and database insertion/updates within a transaction.

## Request

### Content Type
```
multipart/form-data
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | CSV file containing BOM items (max 10MB) |

### CSV Format

**Required Columns:**
- `partNumber` - Unique part identifier (alphanumeric + hyphens/underscores)
- `description` - Part description
- `quantityPerUnit` - Quantity per unit (positive number)
- `currentStock` - Current stock level (non-negative number)
- `unitCost` - Cost per unit (positive number)
- `supplier` - Supplier name
- `reorderPoint` - Reorder threshold (non-negative number)
- `leadTimeDays` - Lead time in days (1-365)
- `category` - Part category

**Optional Columns:**
- `safetyStock` - Safety stock level (defaults to 20% of reorder point)

### Example CSV

```csv
partNumber,description,quantityPerUnit,currentStock,unitCost,supplier,reorderPoint,leadTimeDays,category,safetyStock
BOLT-M5-100,M5 Bolt 100mm,1,500,0.15,FastenerCo,100,7,hardware,20
PLATE-STEEL-12,Steel Plate 12x12,1,200,12.50,SteelWorks Inc,50,14,raw_materials,10
WASHER-M5,M5 Washer,1,1000,0.05,FastenerCo,200,7,hardware,40
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Successfully processed 3 items",
  "data": {
    "totalRows": 3,
    "inserted": 2,
    "updated": 1,
    "failed": 0,
    "errors": [],
    "items": [
      {
        "id": "clx123abc...",
        "partNumber": "BOLT-M5-100",
        "description": "M5 Bolt 100mm",
        "quantityPerUnit": 1,
        "currentStock": 500,
        "unitCost": 0.15,
        "supplier": "FastenerCo",
        "reorderPoint": 100,
        "leadTimeDays": 7,
        "category": "hardware",
        "safetyStock": 20,
        "createdAt": "2024-11-20T10:00:00.000Z",
        "updatedAt": "2024-11-20T10:00:00.000Z"
      }
    ]
  }
}
```

### Error Response (400 Bad Request)

**Validation Errors:**
```json
{
  "success": false,
  "message": "Validation failed: 2 invalid row(s) found",
  "data": {
    "totalRows": 3,
    "inserted": 0,
    "updated": 0,
    "failed": 2,
    "errors": [
      {
        "row": 2,
        "field": "unitCost",
        "value": -5.00,
        "message": "Unit cost must be greater than 0",
        "severity": "error"
      },
      {
        "row": 3,
        "field": "partNumber",
        "value": "",
        "message": "Part number is required",
        "severity": "error"
      }
    ]
  }
}
```

**Duplicate Part Numbers:**
```json
{
  "success": false,
  "message": "Duplicate part numbers found in file",
  "data": {
    "totalRows": 5,
    "inserted": 0,
    "updated": 0,
    "failed": 5,
    "errors": [
      {
        "row": 0,
        "message": "Duplicate part numbers found: BOLT-M5-100, PLATE-STEEL-12",
        "severity": "error"
      }
    ]
  }
}
```

**Invalid File:**
```json
{
  "success": false,
  "message": "Invalid file type. Please upload a CSV file.",
  "data": {
    "totalRows": 0,
    "inserted": 0,
    "updated": 0,
    "failed": 0,
    "errors": [
      {
        "row": 0,
        "message": "Invalid file type. Please upload a CSV file.",
        "severity": "error"
      }
    ]
  }
}
```

### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Internal server error during upload",
  "data": {
    "totalRows": 0,
    "inserted": 0,
    "updated": 0,
    "failed": 0,
    "errors": [
      {
        "row": 0,
        "message": "Database connection failed",
        "severity": "error"
      }
    ]
  }
}
```

## Usage Examples

### JavaScript/TypeScript (Fetch API)

```typescript
async function uploadBomCSV(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('/api/upload/bom', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      console.log(`Success: ${result.message}`)
      console.log(`Inserted: ${result.data.inserted}`)
      console.log(`Updated: ${result.data.updated}`)
      console.log(`Failed: ${result.data.failed}`)

      if (result.data.items) {
        console.log('Items:', result.data.items)
      }
    } else {
      console.error(`Error: ${result.message}`)
      console.error('Errors:', result.data.errors)
    }

    return result
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}
```

### React Component

```typescript
'use client'

import { useState } from 'react'

export function BomUploadComponent() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/bom', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        alert(`Successfully uploaded! Inserted: ${data.data.inserted}, Updated: ${data.data.updated}`)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setResult({
        success: false,
        message: 'Upload failed',
        data: { errors: [{ row: 0, message: String(error) }] }
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 font-medium">Upload BOM CSV</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
          className="border rounded px-4 py-2"
        />
      </div>

      {uploading && (
        <div className="text-blue-600">Uploading...</div>
      )}

      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className="font-semibold mb-2">{result.message}</h3>
          {result.data && (
            <div className="text-sm space-y-1">
              <div>Total Rows: {result.data.totalRows}</div>
              <div>Inserted: {result.data.inserted}</div>
              <div>Updated: {result.data.updated}</div>
              <div>Failed: {result.data.failed}</div>
            </div>
          )}

          {result.data?.errors?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Errors:</h4>
              <ul className="space-y-1">
                {result.data.errors.map((error: any, idx: number) => (
                  <li key={idx} className="text-sm text-red-700">
                    Row {error.row}: {error.message}
                    {error.field && <span className="text-red-600"> (Field: {error.field})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### cURL

```bash
curl -X POST http://localhost:3000/api/upload/bom \
  -F "file=@bom_items.csv" \
  -H "Content-Type: multipart/form-data"
```

### Python (Requests)

```python
import requests

def upload_bom_csv(file_path):
    with open(file_path, 'rb') as file:
        files = {'file': file}
        response = requests.post(
            'http://localhost:3000/api/upload/bom',
            files=files
        )

        result = response.json()

        if result['success']:
            print(f"Success: {result['message']}")
            print(f"Inserted: {result['data']['inserted']}")
            print(f"Updated: {result['data']['updated']}")
        else:
            print(f"Error: {result['message']}")
            for error in result['data']['errors']:
                print(f"Row {error['row']}: {error['message']}")

        return result

# Usage
result = upload_bom_csv('bom_items.csv')
```

## Behavior Details

### Insert vs Update

The endpoint automatically determines whether to insert or update based on the `partNumber`:

- **Insert**: If `partNumber` does not exist in the database
- **Update**: If `partNumber` already exists in the database

This allows you to:
1. Upload new BOM items
2. Update existing BOM items
3. Mix both in the same file

### Safety Stock Calculation

If `safetyStock` is not provided in the CSV, it's automatically calculated as:

```
safetyStock = reorderPoint × 0.2  (20% of reorder point)
```

You can override this by providing `safetyStock` in the CSV.

### Transaction Safety

All database operations are performed within a transaction:
- If any row fails, the entire upload is rolled back
- Database remains in a consistent state
- Partial uploads are not possible

### Duplicate Handling

**Within File:**
- Duplicate `partNumber` values in the same CSV file are rejected
- The entire upload fails with a list of duplicates

**Against Database:**
- If `partNumber` exists in database, the row is updated
- No error is thrown for database duplicates (they're updated)

## Validation Rules

### Part Number
- Required
- Must be alphanumeric with hyphens/underscores only
- Maximum 50 characters
- Example: `BOLT-M5-100`, `PLATE_STEEL_12`

### Description
- Required
- Maximum 500 characters

### Quantity Per Unit
- Required
- Must be a positive number

### Current Stock
- Required
- Must be non-negative (≥ 0)

### Unit Cost
- Required
- Must be positive (> 0)
- Warning if > $100,000

### Supplier
- Required
- Maximum 200 characters

### Reorder Point
- Required
- Must be non-negative (≥ 0)

### Lead Time Days
- Required
- Must be a positive integer (1-365)

### Category
- Required
- Maximum 100 characters

### Safety Stock
- Optional
- Must be non-negative if provided
- Defaults to 20% of reorder point
- Should not exceed reorder point (warning if it does)

## Error Codes

| HTTP Status | Description |
|-------------|-------------|
| 200 | Success - All rows processed |
| 400 | Bad Request - Validation errors, invalid file, or duplicates |
| 500 | Server Error - Database or internal error |

## Rate Limiting

- Maximum file size: 10MB
- Files > 5MB use streaming parser
- No specific rate limit (handled by server configuration)

## Best Practices

1. **Download Template First**: Use `GET /api/upload/bom?action=template` to get template info
2. **Validate Locally**: Use the CSV parser utility client-side before uploading
3. **Handle Errors Gracefully**: Display row-specific errors to users
4. **Test with Small Files**: Start with a few rows to verify format
5. **Backup Before Updates**: If updating existing items, backup database first
6. **Use Transactions**: The endpoint uses transactions, but verify results
7. **Monitor File Size**: Large files take longer to process

## Security Considerations

- File type validation (CSV only)
- File size limits (10MB max)
- SQL injection protection via Prisma ORM
- No direct SQL queries
- Transaction rollback on errors
- Input validation via Zod schemas

## Performance

**Small Files (<100 rows):**
- Processing time: < 1 second
- Memory usage: Low

**Medium Files (100-1000 rows):**
- Processing time: 1-5 seconds
- Memory usage: Moderate

**Large Files (1000-10000 rows):**
- Processing time: 5-30 seconds
- Memory usage: Moderate (streaming enabled)

**Very Large Files (>10MB):**
- Not supported (increase limit if needed)

## Troubleshooting

### "Invalid file type"
- Ensure file has `.csv` extension
- Check MIME type is `text/csv`

### "Validation failed"
- Check error details for specific row/field issues
- Verify CSV format matches template
- Ensure all required fields are present

### "Duplicate part numbers found"
- Remove duplicate rows from CSV
- Or use separate uploads for duplicates

### "Database transaction failed"
- Check database connection
- Verify Prisma schema is up to date
- Check server logs for details

### Timeout on large files
- Reduce file size
- Split into multiple smaller files
- Increase server timeout settings

## Related Endpoints

- `GET /api/templates/bom` - Download CSV template
- `GET /api/bom-items` - List all BOM items
- `POST /api/bom-items` - Create single BOM item
- `PUT /api/bom-items/:id` - Update single BOM item
- `DELETE /api/bom-items/:id` - Delete BOM item
