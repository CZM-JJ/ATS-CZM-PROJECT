<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Applicant;
use App\Models\Position;

return new class extends Migration
{
    public function up(): void
    {
        $applicants = Applicant::all();
        foreach ($applicants as $applicant) {
            $position = Position::where('title', $applicant->position_applied_for)->first();
            if ($position) {
                $applicant->update(['company_id' => $position->company_id]);
            }
        }
    }

    public function down(): void
    {
        Applicant::query()->update(['company_id' => null]);
    }
};
