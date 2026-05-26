<?php

namespace Database\Factories;

use App\Models\Position;
use Illuminate\Database\Eloquent\Factories\Factory;

class PositionFactory extends Factory
{
    protected $model = Position::class;

    public function definition(): array
    {
        $isActive = $this->faker->boolean(90);

        return [
            'title' => $this->faker->jobTitle(),
            'location' => $this->faker->randomElement(['On-site - Manila', 'Hybrid - Cebu', 'Remote']),
            'salary_min' => $this->faker->numberBetween(20000, 50000),
            'salary_max' => $this->faker->numberBetween(50001, 100000),
            'is_active' => $isActive,
            'status' => $isActive ? 'active' : 'inactive',
        ];
    }
}
