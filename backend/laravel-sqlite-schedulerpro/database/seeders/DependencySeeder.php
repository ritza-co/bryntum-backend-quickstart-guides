<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Dependency;

class DependencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('../../example-json-data/schedulerpro/dependencies.json');
        
        if (!file_exists($jsonPath)) {
            throw new \Exception("Dependencies JSON file not found at: {$jsonPath}");
        }
        
        $dependenciesData = json_decode(file_get_contents($jsonPath), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON in dependencies file: " . json_last_error_msg());
        }
        
        foreach ($dependenciesData as $dependency) {
            Dependency::create($dependency);
        }
    }
}