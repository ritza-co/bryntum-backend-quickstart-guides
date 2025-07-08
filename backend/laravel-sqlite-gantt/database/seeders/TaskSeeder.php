<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Task;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('../../example-json-data/gantt/tasks.json');
        
        if (!file_exists($jsonPath)) {
            throw new \Exception("Tasks JSON file not found at: {$jsonPath}");
        }
        
        $tasksData = json_decode(file_get_contents($jsonPath), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON in tasks file: " . json_last_error_msg());
        }
        
        foreach ($tasksData as $task) {
            Task::create($task);
        }
    }
}