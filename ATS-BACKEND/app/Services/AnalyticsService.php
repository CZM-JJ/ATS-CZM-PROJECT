<?php

namespace App\Services;

use App\Models\Applicant;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Get pipeline metrics (candidates by status)
     */
    public function getPipelineMetrics($positionFilter = null)
    {
        $query = Applicant::query();

        if ($positionFilter) {
            $query->where('position_applied_for', $positionFilter);
        }

        $pipeline = $query->groupBy('status')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->get()
            ->keyBy('status');

        return [
            'applied' => $pipeline['applied']->count ?? 0,
            'screening' => $pipeline['screening']->count ?? 0,
            'interview' => $pipeline['interview']->count ?? 0,
            'offer' => $pipeline['offer']->count ?? 0,
            'hired' => $pipeline['hired']->count ?? 0,
            'rejected' => $pipeline['rejected']->count ?? 0,
            'total' => Applicant::when($positionFilter, function ($q) use ($positionFilter) {
                return $q->where('position_applied_for', $positionFilter);
            })->count(),
        ];
    }

    /**
     * Get candidate source analytics
     */
    public function getCandidateSourceAnalytics()
    {
        $sources = Applicant::groupBy('vacancy_source')
            ->select('vacancy_source', DB::raw('COUNT(*) as total'))
            ->get();

        $sourceData = [];
        foreach ($sources as $source) {
            $sourceData[$source->vacancy_source] = [
                'total' => $source->total,
                'hired' => Applicant::where('vacancy_source', $source->vacancy_source)
                    ->where('status', 'hired')
                    ->count(),
                'rejected' => Applicant::where('vacancy_source', $source->vacancy_source)
                    ->where('status', 'rejected')
                    ->count(),
            ];
        }

        // Add conversion rates
        foreach ($sourceData as $source => $data) {
            $sourceData[$source]['hired_rate'] = $data['total'] > 0
                ? round(($data['hired'] / $data['total']) * 100, 2)
                : 0;
            $sourceData[$source]['rejection_rate'] = $data['total'] > 0
                ? round(($data['rejected'] / $data['total']) * 100, 2)
                : 0;
        }

        return $sourceData;
    }

    /**
     * Get hiring performance metrics
     */
    public function getHiringPerformance($positionFilter = null)
    {
        $base = Applicant::query();

        if ($positionFilter) {
            $base->where('position_applied_for', $positionFilter);
        }

        $total = (clone $base)->count();
        $hired = (clone $base)->where('status', 'hired')->count();
        $rejected = (clone $base)->where('status', 'rejected')->count();
        $inPipeline = (clone $base)
            ->whereIn('status', ['applied', 'screening', 'interview', 'offer'])
            ->count();

        return [
            'total_applicants' => $total,
            'hired' => $hired,
            'rejected' => $rejected,
            'in_pipeline' => $inPipeline,
            'hire_rate' => $total > 0 ? round(($hired / $total) * 100, 2) : 0,
            'rejection_rate' => $total > 0 ? round(($rejected / $total) * 100, 2) : 0,
            'conversion_rate' => ($hired + $rejected) > 0 ? round(($hired / ($hired + $rejected)) * 100, 2) : 0,
        ];
    }

    /**
     * Get time-to-hire metrics
     */
    public function getTimeToHireMetrics($positionFilter = null)
    {
        $query = Applicant::where('status', 'hired');

        if ($positionFilter) {
            $query->where('position_applied_for', $positionFilter);
        }

        $hiredApplicants = $query->get();

        if ($hiredApplicants->isEmpty()) {
            return [
                'average_days' => 0,
                'fastest_hire_days' => 0,
                'slowest_hire_days' => 0,
                'total_hired' => 0,
            ];
        }

        $daysToHire = $hiredApplicants->map(function ($applicant) {
            return $applicant->created_at->diffInDays($applicant->updated_at);
        });

        return [
            'average_days' => round($daysToHire->avg(), 1),
            'fastest_hire_days' => $daysToHire->min(),
            'slowest_hire_days' => $daysToHire->max(),
            'total_hired' => $hiredApplicants->count(),
            'median_days' => round($daysToHire->median(), 1),
        ];
    }

    /**
     * Get all analytics at once
     */
    public function getComprehensiveAnalytics($positionFilter = null)
    {
        return [
            'pipeline' => $this->getPipelineMetrics($positionFilter),
            'candidate_sources' => $this->getCandidateSourceAnalytics(),
            'hiring_performance' => $this->getHiringPerformance($positionFilter),
            'time_to_hire' => $this->getTimeToHireMetrics($positionFilter),
            'generated_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Get analytics by date range
     */
    public function getAnalyticsByDateRange($startDate, $endDate, $positionFilter = null)
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $query = Applicant::whereBetween('created_at', [$start, $end]);

        if ($positionFilter) {
            $query->where('position_applied_for', $positionFilter);
        }

        $applicants = $query->get();

        $pipeline = $applicants->groupBy('status')->map->count();

        $sources = $applicants->groupBy('vacancy_source');
        $sourceData = [];
        foreach ($sources as $source => $data) {
            $sourceData[$source] = [
                'total' => $data->count(),
                'hired' => $data->where('status', 'hired')->count(),
            ];
        }

        return [
            'date_range' => "{$startDate} to {$endDate}",
            'total_applicants' => $applicants->count(),
            'pipeline' => $pipeline->toArray(),
            'sources' => $sourceData,
        ];
    }
}
