<?php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\Position;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ApplicantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks to truncate safely
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Applicant::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $positions = Position::all();

        if ($positions->isEmpty()) {
            $this->command->warn('No positions found. Please run PositionSeeder first.');
            return;
        }

        foreach ($positions as $position) {
            // Create 3-7 applicants per position to make it look realistic
            $count = rand(3, 7);

            for ($i = 0; $i < $count; $i++) {
                Applicant::factory()->create([
                    'position_applied_for' => $position->title,
                    'company_id' => $position->company_id,
                ]);
            }
        }

        $this->command->info('Successfully seeded applicants linked to positions.');
    }
}
