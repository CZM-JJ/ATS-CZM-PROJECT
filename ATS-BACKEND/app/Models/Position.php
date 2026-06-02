<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'location',
        'salary_min',
        'salary_max',
        'is_active',
        'company_id',
        'status',
    ];

    protected $appends = [];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function scopeForUser($query, $user)
    {
        if ($user->role === 'admin') {
            return $query;
        }

        return $query->whereIn('company_id', $user->companies()->pluck('companies.id'));
    }
}
