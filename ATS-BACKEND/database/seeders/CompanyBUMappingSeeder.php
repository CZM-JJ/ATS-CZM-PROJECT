<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompanyBUMappingSeeder extends Seeder
{
    public function run(): void
    {
        $mappings = [
            'Kevin Mark Cardenas' => 'all',
            'Crysailare Rivera' => 'all',
            'Goddin Powell Felix' => ['CZM', 'TRRG', 'FRVG', 'Acro Petroleum', 'Riyonce'],
            'Raymond Chua' => ['Sapporo'],
            'Kate Regine Liongson' => ['TSW'],
            'Joanna Marie Enrile' => ['TRRG', 'FRVG'],
            'Jamzell Rollan' => ['T12', 'Acro Residences', 'Riyonce', 'Acro Ice', 'Dimes Sports', 'CWCKing Realty', 'Acro Petroleum', 'Basic Petroleum', 'CZM Logistics'],
        ];

        $allCompanies = [
            'CZM', 'TRRG', 'FRVG', 'Acro Petroleum', 'Riyonce', 'Sapporo', 'TSW', 
            'T12', 'Acro Residences', 'Acro Ice', 'Dimes Sports', 'CWCKing Realty', 
            'Basic Petroleum', 'CZM Logistics'
        ];

        foreach ($allCompanies as $name) {
            Company::firstOrCreate(['name' => $name]);
        }

        foreach ($mappings as $userName => $bus) {
            $user = User::where('name', 'like', '%' . $userName . '%')->first();
            if (!$user) {
                fwrite(STDERR, "User not found: $userName\n");
                continue;
            }

            if ($bus === 'all') {
                $user->companies()->sync(Company::all());
            } else {
                $companyIds = Company::whereIn('name', $bus)->pluck('id')->toArray();
                $user->companies()->sync($companyIds);
            }
        }
    }
}
