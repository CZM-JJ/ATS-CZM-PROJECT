<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    private $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get pipeline metrics
     */
    public function getPipelineMetrics(Request $request)
    {
        try {
            $position = $request->query('position');
            $metrics = $this->analyticsService->getPipelineMetrics($position);

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'position_filter' => $position,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pipeline metrics: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get candidate source analytics
     */
    public function getCandidateSourceAnalytics(Request $request)
    {
        try {
            $analytics = $this->analyticsService->getCandidateSourceAnalytics();

            return response()->json([
                'success' => true,
                'data' => $analytics,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch source analytics: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get hiring performance metrics
     */
    public function getHiringPerformance(Request $request)
    {
        try {
            $position = $request->query('position');
            $metrics = $this->analyticsService->getHiringPerformance($position);

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'position_filter' => $position,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch hiring performance: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get time-to-hire metrics
     */
    public function getTimeToHire(Request $request)
    {
        try {
            $position = $request->query('position');
            $metrics = $this->analyticsService->getTimeToHireMetrics($position);

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'position_filter' => $position,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch time-to-hire metrics: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get comprehensive analytics dashboard
     */
    public function getDashboard(Request $request)
    {
        try {
            $position = $request->query('position');
            $analytics = $this->analyticsService->getComprehensiveAnalytics($position);

            return response()->json([
                'success' => true,
                'data' => $analytics,
                'position_filter' => $position,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard analytics: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get analytics by date range
     */
    public function getByDateRange(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        try {
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $position = $request->query('position');

            $analytics = $this->analyticsService->getAnalyticsByDateRange(
                $startDate,
                $endDate,
                $position
            );

            return response()->json([
                'success' => true,
                'data' => $analytics,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch date range analytics: '.$e->getMessage(),
            ], 500);
        }
    }
}
