<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $name = env('SEED_ADMIN_NAME', 'Admin User');
        $email = env('SEED_ADMIN_EMAIL', 'admin@example.com');
        $password = env('SEED_ADMIN_PASSWORD', 'password');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'role' => 'admin',
                'password' => Hash::make($password),
            ]
        );
    }
}
