<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('is_active');
        });

        // Sync existing data
        \DB::statement("UPDATE positions SET status = 'active' WHERE is_active = true");
        \DB::statement("UPDATE positions SET status = 'rejected' WHERE is_active = false");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
