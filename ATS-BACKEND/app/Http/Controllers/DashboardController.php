<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard overview with aggregated analytics.
     *
     * @return array<string, mixed>
     */
    public function overview(Request $request): array
    {
        $days = (int) $request->query('days', 0);
        $byStatus = $this->getByStatus($days);

        return [
            'total_applicants' => $this->getTotalCount($days),
            'recent_count' => $this->getRecentCount($days),
            'hire_rate' => $this->getHireRateFromStatus($byStatus, $days),
            'rejection_rate' => $this->getRejectionRateFromStatus($byStatus, $days),
            'avg_experience' => $this->getAverageExperience($days),
            'avg_salary' => $this->getAverageSalary($days),
            'by_status' => $byStatus,
            'by_position' => $this->getByPosition($days),
            'monthly_trend' => $this->getMonthlyTrend($days),
            'by_source' => $this->getBySource($days),
            'by_gender' => $this->getByGender($days),
            'by_education' => $this->getByEducation($days),
            'by_location' => $this->getByLocation($days),
        ];
    }

    /**
     * Build base query with optional date filter.
     */
    private function getBaseQuery(int $days): \Illuminate\Database\Eloquent\Builder
    {
        $query = Applicant::query();
        if ($days > 0) {
            $query->where('created_at', '>=', now()->subDays($days));
        }

        return $query;
    }

    private function getTotalCount(int $days): int
    {
        return $this->getBaseQuery($days)->count();
    }

    private function getRecentCount(int $days): int
    {
        $recentDays = $days > 0 ? min($days, 30) : 30;

        return Applicant::query()
            ->where('created_at', '>=', now()->subDays($recentDays))
            ->count();
    }

    private function getByStatus(int $days): \Illuminate\Database\Eloquent\Collection
    {
        return $this->getBaseQuery($days)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->orderBy('status')
            ->get();
    }

    private function getByPosition(int $days): \Illuminate\Database\Eloquent\Collection
    {
        return $this->getBaseQuery($days)
            ->select('position_applied_for', DB::raw('count(*) as total'))
            ->groupBy('position_applied_for')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get();
    }

    private function getMonthlyTrend(int $days): \Illuminate\Support\Collection
    {
        $trendMonths = $days > 0 ? max(1, (int) ceil($days / 30)) : 12;

        return Applicant::query()
            ->select('created_at')
            ->where('created_at', '>=', now()->subMonths($trendMonths)->startOfMonth())
            ->orderBy('created_at')
            ->get()
            ->groupBy(function ($row) {
                return $row->created_at->format('M Y');
            })
            ->map(function ($rows, $month) {
                return [
                    'month' => $month,
                    'total' => $rows->count(),
                ];
            })
            ->values();
    }

    private function getBySource(int $days): \Illuminate\Database\Eloquent\Collection
    {
        return $this->getBaseQuery($days)
            ->select('vacancy_source', DB::raw('count(*) as total'))
            ->whereNotNull('vacancy_source')
            ->where('vacancy_source', '!=', '')
            ->groupBy('vacancy_source')
            ->orderBy('total', 'desc')
            ->get();
    }

    private function getByGender(int $days): \Illuminate\Database\Eloquent\Collection
    {
        return $this->getBaseQuery($days)
            ->select('gender', DB::raw('count(*) as total'))
            ->whereNotNull('gender')
            ->groupBy('gender')
            ->get();
    }

    private function getByEducation(int $days): \Illuminate\Database\Eloquent\Collection
    {
        return $this->getBaseQuery($days)
            ->select('highest_education_level', DB::raw('count(*) as total'))
            ->whereNotNull('highest_education_level')
            ->groupBy('highest_education_level')
            ->orderBy('total', 'desc')
            ->get();
    }

    private function getByLocation(int $days): \Illuminate\Database\Eloquent\Collection
    {
        return $this->getBaseQuery($days)
            ->select('preferred_work_location', DB::raw('count(*) as total'))
            ->whereNotNull('preferred_work_location')
            ->where('preferred_work_location', '!=', '')
            ->groupBy('preferred_work_location')
            ->orderBy('total', 'desc')
            ->limit(8)
            ->get();
    }

    private function getHireRate(int $days): float
    {
        $total = $this->getTotalCount($days);
        $hired = $this->getByStatus($days)->where('status', 'hired')->first()?->total ?? 0;

        return $total > 0 ? round(($hired / $total) * 100, 1) : 0;
    }

    private function getHireRateFromStatus($byStatus, int $days): float
    {
        $total = $this->getTotalCount($days);
        $hired = $byStatus->where('status', 'hired')->first()?->total ?? 0;

        return $total > 0 ? round(($hired / $total) * 100, 1) : 0;
    }

    private function getRejectionRate(int $days): float
    {
        $total = $this->getTotalCount($days);
        $rejected = $this->getByStatus($days)->where('status', 'rejected')->first()?->total ?? 0;

        return $total > 0 ? round(($rejected / $total) * 100, 1) : 0;
    }

    private function getRejectionRateFromStatus($byStatus, int $days): float
    {
        $total = $this->getTotalCount($days);
        $rejected = $byStatus->where('status', 'rejected')->first()?->total ?? 0;

        return $total > 0 ? round(($rejected / $total) * 100, 1) : 0;
    }

    private function getAverageExperience(int $days): float
    {
        return round(
            $this->getBaseQuery($days)
                ->whereNotNull('total_work_experience_years')
                ->avg('total_work_experience_years') ?? 0,
            1
        );
    }

    private function getAverageSalary(int $days): float
    {
        return round(
            $this->getBaseQuery($days)
                ->whereNotNull('expected_salary')
                ->avg('expected_salary') ?? 0,
            0
        );
    }
}
