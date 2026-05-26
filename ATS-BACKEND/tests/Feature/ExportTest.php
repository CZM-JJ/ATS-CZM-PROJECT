<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create an admin user so perm:canViewAnalytics passes
        $this->user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($this->user);
    }

    public function test_export_preview_without_filters(): void
    {
        Applicant::factory()->count(5)->create();

        $response = $this->getJson('/api/export/applicants/preview');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'applicants_count' => 5,
            ]);
    }

    public function test_export_preview_with_status_filter(): void
    {
        Applicant::factory()->count(3)->create(['status' => 'applied']);
        Applicant::factory()->count(2)->create(['status' => 'hired']);

        $response = $this->getJson('/api/export/applicants/preview?status=applied');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'applicants_count' => 3,
            ]);
    }

    public function test_export_applicants_returns_file(): void
    {
        Applicant::factory()->count(3)->create();

        $response = $this->get('/api/export/applicants');

        $response->assertStatus(200)
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_export_with_date_range_filter(): void
    {
        $dateFrom = now()->subDays(5)->format('Y-m-d');
        $dateTo = now()->format('Y-m-d');

        Applicant::factory()->count(2)->create(['created_at' => now()]);
        Applicant::factory()->count(1)->create(['created_at' => now()->subDays(10)]);

        $response = $this->getJson("/api/export/applicants/preview?date_from={$dateFrom}&date_to={$dateTo}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'applicants_count' => 2,
            ]);
    }
}
