<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Assignment;

class AssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('../../example-json-data/taskboard/assignments.json');
        
        if (!file_exists($jsonPath)) {
            throw new \Exception("Assignments JSON file not found at: {$jsonPath}");
        }
        
        $assignmentsData = json_decode(file_get_contents($jsonPath), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON in assignments file: " . json_last_error_msg());
        }
        
        foreach ($assignmentsData as $assignment) {
            Assignment::create($assignment);
        }
    }
}