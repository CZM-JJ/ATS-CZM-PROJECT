<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'position_applied_for' => $this->position_applied_for,
            'last_name' => $this->last_name,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'permanent_address' => $this->permanent_address,
            'current_address' => $this->current_address,
            'gender' => $this->gender,
            'civil_status' => $this->civil_status,
            'birthdate' => $this->birthdate,
            'age' => $this->age,
            'highest_education_level' => $this->highest_education_level,
            'bachelors_degree_course' => $this->bachelors_degree_course,
            'year_graduated' => $this->year_graduated,
            'last_school_attended' => $this->last_school_attended,
            'prc_license' => $this->prc_license,
            'total_work_experience_years' => $this->total_work_experience_years,
            'contact_number' => $this->contact_number,
            'email_address' => $this->email_address,
            'expected_salary' => $this->expected_salary,
            'preferred_work_location' => $this->preferred_work_location,
            'cv_path' => $this->cv_path,
            'vacancy_source' => $this->vacancy_source,
            'status' => $this->status,
            'updated_by' => $this->updated_by,
            'updated_by_name' => $this->whenLoaded('updatedBy', $this->updated_by_name),
            'company_id' => $this->company_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
