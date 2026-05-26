<?php

namespace App\Http\Controllers;

use App\Services\ExportService;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    private $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Export applicants to Excel
     *
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function exportApplicants(Request $request)
    {
        try {
            $filters = [
                'status' => $request->query('status'),
                'position_applied_for' => $request->query('position'),
                'vacancy_source' => $request->query('source'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
            ];

            $result = $this->exportService->exportApplicants($filters);

            return response()
                ->download(
                    $result['file_path'],
                    $result['file_name'],
                    ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
                )
                ->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Export failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get export template/preview
     */
    public function getExportPreview(Request $request)
    {
        try {
            $filters = [
                'status' => $request->query('status'),
                'position_applied_for' => $request->query('position'),
                'vacancy_source' => $request->query('source'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
            ];

            // Get count of applicants that would be exported
            $query = \App\Models\Applicant::query();

            if (! empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }
            if (! empty($filters['position_applied_for'])) {
                $query->where('position_applied_for', $filters['position_applied_for']);
            }
            if (! empty($filters['vacancy_source'])) {
                $query->where('vacancy_source', $filters['vacancy_source']);
            }
            if (! empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }
            if (! empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            $count = $query->count();

            return response()->json([
                'success' => true,
                'applicants_count' => $count,
                'filters_applied' => array_filter($filters),
                'message' => "{$count} applicants will be exported",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get export preview: '.$e->getMessage(),
            ], 500);
        }
    }
}
