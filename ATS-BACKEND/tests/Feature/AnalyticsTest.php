<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create an admin user so perm:canViewAnalytics passes
        $this->user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($this->user);
    }

    public function test_get_pipeline_metrics(): void
    {
        Applicant::factory()->count(5)->create(['status' => 'applied']);
        Applicant::factory()->count(3)->create(['status' => 'screening']);
        Applicant::factory()->count(2)->create(['status' => 'interview']);
        Applicant::factory()->count(1)->create(['status' => 'hired']);

        $response = $this->getJson('/api/analytics/pipeline');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'applied' => 5,
                    'screening' => 3,
                    'interview' => 2,
                    'hired' => 1,
                    'total' => 11,
                ],
            ]);
    }

    public function test_get_pipeline_metrics_with_position_filter(): void
    {
        Applicant::factory()->count(5)->create(['position_applied_for' => 'Developer', 'status' => 'applied']);
        Applicant::factory()->count(2)->create(['position_applied_for' => 'Designer', 'status' => 'applied']);

        $response = $this->getJson('/api/analytics/pipeline?position=Developer');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total' => 5,
                    'applied' => 5,
                ],
            ]);
    }

    public function test_get_candidate_source_analytics(): void
    {
        Applicant::factory()->count(10)->create(['vacancy_source' => 'LinkedIn', 'status' => 'applied']);
        Applicant::factory()->count(2)->create(['vacancy_source' => 'LinkedIn', 'status' => 'hired']);
        Applicant::factory()->count(5)->create(['vacancy_source' => 'Indeed', 'status' => 'applied']);

        $response = $this->getJson('/api/analytics/sources');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertArrayHasKey('LinkedIn', $data);
        $this->assertEquals(12, $data['LinkedIn']['total']);
        $this->assertEquals(2, $data['LinkedIn']['hired']);
    }

    public function test_get_hiring_performance(): void
    {
        Applicant::factory()->count(10)->create(['status' => 'applied']);
        Applicant::factory()->count(4)->create(['status' => 'hired']);
        Applicant::factory()->count(2)->create(['status' => 'rejected']);

        $response = $this->getJson('/api/analytics/performance');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_applicants' => 16,
                    'hired' => 4,
                    'rejected' => 2,
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals(25.0, $data['hire_rate']); // 4/16 * 100
    }

    public function test_get_time_to_hire(): void
    {
        // Create hired applicants with different application dates
        Applicant::factory()->create([
            'status' => 'hired',
            'created_at' => now()->subDays(30),
            'updated_at' => now(),
        ]);

        Applicant::factory()->create([
            'status' => 'hired',
            'created_at' => now()->subDays(10),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/analytics/time-to-hire');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertEquals(2, $data['total_hired']);
        $this->assertGreaterThan(0, $data['average_days']);
    }

    public function test_get_comprehensive_dashboard(): void
    {
        Applicant::factory()->count(5)->create(['status' => 'applied']);
        Applicant::factory()->count(1)->create(['status' => 'hired']);

        $response = $this->getJson('/api/analytics/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'pipeline',
                    'candidate_sources',
                    'hiring_performance',
                    'time_to_hire',
                    'generated_at',
                ],
            ]);
    }

    public function test_get_analytics_by_date_range(): void
    {
        $startDate = now()->subDays(5)->format('Y-m-d');
        $endDate = now()->format('Y-m-d');

        Applicant::factory()->count(3)->create(['created_at' => now()]);
        Applicant::factory()->count(1)->create(['created_at' => now()->subDays(10)]);

        $response = $this->getJson("/api/analytics/date-range?start_date={$startDate}&end_date={$endDate}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $data = $response->json('data');
        $this->assertEquals(3, $data['total_applicants']);
    }

    public function test_date_range_validation(): void
    {
        $response = $this->getJson('/api/analytics/date-range');

        $response->assertStatus(422); // Unprocessable Entity
    }
}
