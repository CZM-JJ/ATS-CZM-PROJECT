<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;

class CompanyHRSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companiesData = [
            'CZM', 'TRRG', 'FRVG', 'Acro Petroleum', 'Riyonce',
            'Sapporo', 'TSW', 'T12', 'Acro Residences', 'Acro Ice',
            'Dimes Sports', 'CWCKing Realty', 'Basic Petroleum', 'CZM Logistics',
        ];

        $companies = [];
        foreach ($companiesData as $name) {
            $companies[$name] = Company::firstOrCreate(['name' => $name]);
        }

        $hrMappings = [
            'Kevin Mark Cardenas' => [
                'supports_all' => true,
                'bus' => [],
            ],
            'Crysailare Rivera' => [
                'supports_all' => true,
                'bus' => [],
            ],
            'Goddin Powell Felix' => [
                'supports_all' => false,
                'bus' => ['CZM', 'TRRG', 'FRVG', 'Acro Petroleum', 'Riyonce'],
            ],
            'Raymond Chua' => [
                'supports_all' => false,
                'bus' => ['Sapporo'],
            ],
            'Kate Regine Liongson' => [
                'supports_all' => false,
                'bus' => ['TSW'],
            ],
            'Joanna Marie Enrile' => [
                'supports_all' => false,
                'bus' => ['TRRG', 'FRVG'],
            ],
            'Jamzell Rollan' => [
                'supports_all' => false,
                'bus' => ['T12', 'Acro Residences', 'Riyonce', 'Acro Ice', 'Dimes Sports', 'CWCKing Realty', 'Acro Petroleum', 'Basic Petroleum', 'CZM Logistics'],
            ],
        ];

        foreach ($hrMappings as $name => $config) {
            // Generate email: lowercase, replace spaces with dots
            $email = strtolower(str_replace(' ', '.', $name)).'@czarkmak.com';

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => bcrypt('password'), // Default password: password
                    'role' => 'hr',
                ]
            );

            if (! $config['supports_all']) {
                $companyIds = [];
                foreach ($config['bus'] as $buName) {
                    if (isset($companies[$buName])) {
                        $companyIds[] = $companies[$buName]->id;
                    }
                }
                $user->companies()->sync($companyIds);
            }
        }

    }
}
