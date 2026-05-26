# Excel Export & Analytics Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend/Client                           │
│                  (Vue.js, React, etc.)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP Requests
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     API Routes (api.php)                         │
├─────────────────────────────────────────────────────────────────┤
│  Export Routes                   Analytics Routes               │
│  ├─ /export/applicants          ├─ /analytics/pipeline          │
│  └─ /export/applicants/preview  ├─ /analytics/sources           │
│                                 ├─ /analytics/performance       │
│                                 ├─ /analytics/time-to-hire      │
│                                 ├─ /analytics/dashboard         │
│                                 └─ /analytics/date-range        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼──────────────┐           ┌─────────▼─────────────┐
│  ExportController    │           │ AnalyticsController   │
├──────────────────────┤           ├───────────────────────┤
│ exportApplicants()   │           │ getPipelineMetrics()  │
│ getExportPreview()   │           │ getCandidateSource()  │
└───────┬──────────────┘           │ getHiringPerf()       │
        │                          │ getTimeToHire()       │
        │                          │ getDashboard()        │
        │                          │ getByDateRange()      │
        │                          └─────────┬─────────────┘
        │                                    │
        └──────────────────┬─────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼──────────────┐           ┌─────────▼─────────────┐
│  ExportService       │           │ AnalyticsService      │
├──────────────────────┤           ├───────────────────────┤
│ exportApplicants()   │           │ getPipelineMetrics()  │
│ generateExcelFile()  │           │ getCandidateSource()  │
│                      │           │ getHiringPerf()       │
│ Uses:                │           │ getTimeToHire()       │
│ - PhpSpreadsheet     │           │ getComprehensive()    │
│ - Query Builders     │           │ getByDateRange()      │
│                      │           │                       │
│ Output: Excel Files  │           │ Uses:                 │
│ Location:            │           │ - Eloquent Queries    │
│ storage/app/exports/ │           │ - Database Helper     │
└───────┬──────────────┘           └─────────┬─────────────┘
        │                                    │
        │                Eloquent ORM        │
        └──────────────────┬─────────────────┘
                           │
                ┌──────────▼──────────┐
                │  Applicant Model    │
                ├─────────────────────┤
                │ Attributes:         │
                │ - first_name        │
                │ - email_address     │
                │ - status            │
                │ - position_applied  │
                │ - vacancy_source    │
                │ - created_at        │
                │ - updated_at        │
                └──────────┬──────────┘
                           │
                    Database Query
                           │
                ┌──────────▼──────────┐
                │   Database (MySQL)  │
                ├─────────────────────┤
                │ applicants table    │
                │ with indices on:    │
                │ - status            │
                │ - position_applied  │
                │ - vacancy_source    │
                │ - created_at        │
                └─────────────────────┘
```

---

## Request/Response Flow

### Export Flow
```
1. User clicks "Export" button
                │
2. Frontend calls: GET /api/export/applicants/preview?status=hired
                │
3. ExportController.getExportPreview()
   └─> Returns count of applicants to export
                │
4. User confirms export
                │
5. Frontend calls: GET /api/export/applicants?status=hired
                │
6. ExportController.exportApplicants()
   └─> ExportService.exportApplicants(filters)
       └─> Queries applicants with filters
       └─> Generates Excel file
       └─> Returns file download response
                │
7. Browser downloads applicants.xlsx file
```

### Analytics Flow
```
1. User navigates to Analytics Dashboard
                │
2. Frontend calls: GET /api/analytics/dashboard?position=Developer
                │
3. AnalyticsController.getDashboard()
   └─> AnalyticsService.getComprehensiveAnalytics()
       ├─> getPipelineMetrics()
       │   └─> Query applicants grouped by status
       ├─> getCandidateSourceAnalytics()
       │   └─> Query by vacancy_source with calculations
       ├─> getHiringPerformance()
       │   └─> Calculate KPIs
       ├─> getTimeToHireMetrics()
       │   └─> Calculate date differences for hired candidates
       └─> Returns combined JSON response
                │
4. Frontend displays charts and metrics
```

---

## Data Flow Diagram

### For Export
```
┌─────────────────────────────────────────────────────────────┐
│ Client Request with Filters:                                │
│ GET /api/export/applicants                                  │
│ ?status=hired&date_from=2024-01-01&date_to=2024-12-31     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ ExportController builds filter array                         │
│ {                                                           │
│   status: 'hired',                                          │
│   date_from: '2024-01-01',                                  │
│   date_to: '2024-12-31'                                     │
│ }                                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ ExportService.exportApplicants(filters)                     │
│ ├─ Applicant::query()                                       │
│ ├─ WHERE status = 'hired'                                   │
│ ├─ WHERE created_at >= '2024-01-01'                         │
│ ├─ WHERE created_at <= '2024-12-31'                         │
│ └─ get() → Collection of Applicants                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ generateExcelFile(applicants)                               │
│ ├─ Create Spreadsheet                                       │
│ ├─ Add Headers: ID, Name, Email, Status, etc.              │
│ ├─ Style Headers (blue background, white text)              │
│ ├─ Loop applicants and add rows                             │
│ ├─ Auto-size columns                                        │
│ └─ Save to storage/app/exports/applicants_*.xlsx            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ Return file download response                               │
│ ├─ File Path: storage/app/exports/applicants_*.xlsx         │
│ ├─ Content-Type: application/vnd.openxmlformats...          │
│ └─ Delete After Send: true                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ Browser Downloads File: applicants_2024-05-05_15-02-01.xlsx│
└─────────────────────────────────────────────────────────────┘
```

### For Analytics
```
┌──────────────────────────────────────────────────────────────┐
│ Client Request: GET /api/analytics/dashboard?position=Dev   │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│ AnalyticsController.getDashboard()                           │
│ ├─ Extract position filter: 'Developer'                      │
│ └─ Call AnalyticsService.getComprehensiveAnalytics(position) │
└────────────────────┬─────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐ ┌────────▼────┐ ┌───────▼────┐
│Pipeline │ │   Sources   │ │  Performance
└────┬────┘ └────────┬────┘ └───────┬────┘
     │               │               │
     │ SELECT status,│               │
     │ COUNT(*) FROM │               │
     │ applicants    │               │
     │ WHERE         │               │
     │ position_app. │               │
     │ = 'Developer' │               │
     │ GROUP BY      │               │
     │ status        │               │
     │               │               │
     └───────────────┼───────────────┘
                     │
     ┌───────────────┴───────────────┐
     │                               │
┌────▼────────────┐  ┌──────────────▼──┐
│ Time to Hire    │  │ Generate Response
└────┬────────────┘  └──────────────┬──┘
     │                              │
     │ SELECT AVG(DATEDIFF(...))     │ {
     │ FROM applicants              │   "success": true,
     │ WHERE status = 'hired'        │   "data": {
     │ AND position...              │     "pipeline": {...},
     │                              │     "sources": {...},
     │                              │     "performance": {...},
     │                              │     "time_to_hire": {...}
     │                              │   },
     │                              │   "generated_at": "..."
     │                              │ }
     │                              │
     └──────────────┬───────────────┘
                    │
             Return to Client
```

---

## Database Queries Reference

### Export Query Pattern
```sql
SELECT * FROM applicants
WHERE status = ? 
  AND position_applied_for = ?
  AND vacancy_source = ?
  AND created_at >= ?
  AND created_at <= ?
ORDER BY created_at DESC;
```

### Pipeline Query Pattern
```sql
SELECT status, COUNT(*) as count
FROM applicants
WHERE position_applied_for = ?
GROUP BY status;
```

### Source Analytics Query Pattern
```sql
SELECT vacancy_source, COUNT(*) as total
FROM applicants
GROUP BY vacancy_source;

SELECT COUNT(*) FROM applicants
WHERE vacancy_source = ? AND status = 'hired';

SELECT COUNT(*) FROM applicants
WHERE vacancy_source = ? AND status = 'rejected';
```

### Time to Hire Query Pattern
```sql
SELECT AVG(DATEDIFF(day, created_at, updated_at)) as avg_days
FROM applicants
WHERE status = 'hired' AND position_applied_for = ?;
```

---

## File Organization

```
app/
├── Services/
│   ├── ExportService.php          ← Excel generation
│   └── AnalyticsService.php       ← Analytics calculations
└── Http/
    └── Controllers/
        ├── ExportController.php   ← Export API endpoints
        └── AnalyticsController.php ← Analytics API endpoints

routes/
└── api.php                         ← All new routes registered here

tests/
└── Feature/
    ├── ExportTest.php            ← Export feature tests
    └── AnalyticsTest.php         ← Analytics feature tests

storage/
└── app/
    └── exports/                   ← Temporary Excel files stored here
        └── applicants_*.xlsx

config/
└── (no changes)
```

---

## Security Model

```
┌─────────────────────────────────────────┐
│        Client Request                   │
│   with Bearer Token                     │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │ Auth Check  │
        │ (Sanctum)   │
        └──────┬──────┘
               │
        ┌──────▼───────────┐
        │ Permission Check │
        │ canViewAnalytics │
        └──────┬───────────┘
               │
        ┌──────▼──────────┐
        │ Route Handler   │
        │ & Controller    │
        └──────┬──────────┘
               │
        ┌──────▼─────────┐
        │ Service Layer  │
        │ (Calculation)  │
        └──────┬─────────┘
               │
        ┌──────▼────────────┐
        │ Query Database    │
        │ (Filtered Data)   │
        └──────┬────────────┘
               │
        ┌──────▼──────────────┐
        │ Response Generated  │
        │ & Sent to Client    │
        └─────────────────────┘
```

---

## Performance Considerations

### Query Optimization
- Database queries use filtering at the query level (not in PHP)
- Indexes recommended on: `status`, `position_applied_for`, `vacancy_source`, `created_at`
- Date range queries use indexed timestamps

### Caching Opportunities (Future)
- Cache analytics results for 5-10 minutes
- Invalidate cache on applicant status updates
- Use Redis for cache storage

### File Management
- Excel files deleted after download (no disk accumulation)
- Large exports (~10K rows) take 5-10 seconds
- File size: ~1MB per 1000 records

---

## Integration Checklist

- [x] PhpSpreadsheet installed
- [x] Services created and tested
- [x] Controllers created and tested
- [x] Routes registered
- [x] Documentation created
- [x] Test suite included
- [ ] Frontend integration (Next step)
- [ ] Production deployment (Next step)
- [ ] Caching implementation (Optional enhancement)
