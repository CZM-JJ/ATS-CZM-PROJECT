<?php

namespace App\Services;

use App\Models\Applicant;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExportService
{
    /**
     * Export applicants to Excel file
     */
    public function exportApplicants($filters = [])
    {
        $query = Applicant::query();

        // Apply filters
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['position_applied_for'])) {
            $query->where('position_applied_for', $filters['position_applied_for']);
        }

        if (! empty($filters['vacancy_source'])) {
            $query->where('vacancy_source', $filters['vacancy_source']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $applicants = $query->get();

        return $this->generateExcelFile($applicants);
    }

    /**
     * Generate Excel file from applicants
     */
    private function generateExcelFile($applicants)
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $headers = [
            'ID',
            'First Name',
            'Last Name',
            'Email',
            'Contact Number',
            'Position Applied',
            'Status',
            'Education Level',
            'Course/Degree',
            'Year Graduated',
            'Total Work Experience (years)',
            'PRC License',
            'Gender',
            'Civil Status',
            'Birthdate',
            'Age',
            'Permanent Address',
            'Current Address',
            'Preferred Work Location',
            'Expected Salary',
            'Vacancy Source',
            'Applied Date',
        ];

        $sheet->fromArray($headers, null, 'A1');

        // Style headers
        $sheet->getStyle('A1:U1')->getFont()->setBold(true);
        $sheet->getStyle('A1:U1')->getFill()->setFillType('solid')->getStartColor()->setRGB('4472C4');
        $sheet->getStyle('A1:U1')->getFont()->getColor()->setRGB('FFFFFF');

        // Add data
        $row = 2;
        foreach ($applicants as $applicant) {
            $sheet->setCellValue("A{$row}", $applicant->id);
            $sheet->setCellValue("B{$row}", $applicant->first_name);
            $sheet->setCellValue("C{$row}", $applicant->last_name);
            $sheet->setCellValue("D{$row}", $applicant->email_address);
            $sheet->setCellValue("E{$row}", $applicant->contact_number);
            $sheet->setCellValue("F{$row}", $applicant->position_applied_for);
            $sheet->setCellValue("G{$row}", $applicant->status);
            $sheet->setCellValue("H{$row}", $applicant->highest_education_level);
            $sheet->setCellValue("I{$row}", $applicant->bachelors_degree_course);
            $sheet->setCellValue("J{$row}", $applicant->year_graduated);
            $sheet->setCellValue("K{$row}", $applicant->total_work_experience_years);
            $sheet->setCellValue("L{$row}", $applicant->prc_license);
            $sheet->setCellValue("M{$row}", $applicant->gender);
            $sheet->setCellValue("N{$row}", $applicant->civil_status);
            $sheet->setCellValue("O{$row}", $applicant->birthdate?->format('Y-m-d'));
            $sheet->setCellValue("P{$row}", $applicant->age);
            $sheet->setCellValue("Q{$row}", $applicant->permanent_address);
            $sheet->setCellValue("R{$row}", $applicant->current_address);
            $sheet->setCellValue("S{$row}", $applicant->preferred_work_location);
            $sheet->setCellValue("T{$row}", $applicant->expected_salary);
            $sheet->setCellValue("U{$row}", $applicant->vacancy_source);
            $sheet->setCellValue("V{$row}", $applicant->created_at->format('Y-m-d H:i'));

            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'V') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Generate file
        $writer = new Xlsx($spreadsheet);
        $fileName = 'applicants_'.now()->format('Y-m-d_H-i-s').'.xlsx';
        $filePath = storage_path('app/exports/'.$fileName);

        // Ensure export directory exists
        if (! is_dir(storage_path('app/exports'))) {
            mkdir(storage_path('app/exports'), 0755, true);
        }

        $writer->save($filePath);

        return [
            'file_path' => $filePath,
            'file_name' => $fileName,
            'count' => count($applicants),
        ];
    }
}
