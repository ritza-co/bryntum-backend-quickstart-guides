<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Assignment;
use Illuminate\Support\Facades\File;

class AssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('../../example-json-data/scheduler/assignments.json');
        
        if (File::exists($jsonPath)) {
            $assignmentsData = json_decode(File::get($jsonPath), true);
            
            foreach ($assignmentsData as $assignmentData) {
                Assignment::create($assignmentData);
            }
        }
    }
}