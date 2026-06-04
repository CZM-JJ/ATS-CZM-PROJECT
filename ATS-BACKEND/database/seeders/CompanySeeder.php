<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $allCompanies = [
            'CZM', 'TRRG', 'FRVG', 'Acro Petroleum', 'Riyonce', 'Sapporo', 'TSW',
            'T12', 'Acro Residences', 'Acro Ice', 'Dimes Sports', 'CWCKing Realty',
            'Basic Petroleum', 'CZM Logistics'
        ];

        foreach ($allCompanies as $name) {
            Company::firstOrCreate(['name' => $name]);
        }
    }
}
