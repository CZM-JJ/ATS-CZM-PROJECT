<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Position;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PositionStatusTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($this->user);
    }

    public function test_store_accepts_status_alias_and_exposes_status_accessor(): void
    {
        $company = Company::create(['name' => 'Test Company']);

        $response = $this->postJson('/api/positions', [
            'title' => 'QA Engineer',
            'location' => 'Remote',
            'status' => 'active',
            'company_id' => $company->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('is_active', true)
            ->assertJsonPath('status', 'active');

        $this->assertDatabaseHas('positions', [
            'title' => 'QA Engineer',
            'location' => 'Remote',
            'is_active' => true,
        ]);
    }

    public function test_update_accepts_status_alias(): void
    {
        $company = Company::create(['name' => 'Test Company 2']);

        $position = Position::factory()->create([
            'company_id' => $company->id,
            'is_active' => true,
            'status' => 'active',
        ]);

        $response = $this->patchJson('/api/positions/'.$position->id, [
            'status' => 'inactive',
        ]);

        $response->assertOk()
            ->assertJsonPath('is_active', false)
            ->assertJsonPath('status', 'inactive');

        $this->assertDatabaseHas('positions', [
            'id' => $position->id,
            'is_active' => false,
        ]);
    }
}
