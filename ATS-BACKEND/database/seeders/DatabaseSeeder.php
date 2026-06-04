<?php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);
        $this->call(CompanySeeder::class);

        User::updateOrCreate(
            ['email' => 'recruiter@example.com'],
            [
                'name' => 'Recruiter User',
                'role' => 'recruiter',
                'password' => bcrypt('Recruit@2026Secure!'),
            ]
        );

        $companyId = \App\Models\Company::inRandomOrder()->first()->id;

        Position::query()->create([
            'title' => 'Frontend Developer',
            'location' => 'On-site - Manila',
            'salary_min' => 35000,
            'salary_max' => 60000,
            'is_active' => true,
            'company_id' => $companyId,
        ]);

        Position::query()->create([
            'title' => 'Backend Developer',
            'location' => 'Hybrid - Cebu',
            'salary_min' => 40000,
            'salary_max' => 70000,
            'is_active' => true,
            'company_id' => $companyId,
        ]);

        Position::query()->create([
            'title' => 'HR Recruiter',
            'location' => 'Remote',
            'salary_min' => 30000,
            'salary_max' => 50000,
            'is_active' => true,
            'company_id' => $companyId,
        ]);

        // Seed 20 random positions
        $this->call(PositionSeeder::class);

        $this->call(ApplicantSeeder::class);
    }
}
