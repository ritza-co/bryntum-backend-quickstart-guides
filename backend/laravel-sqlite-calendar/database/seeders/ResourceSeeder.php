<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Resource;

class ResourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('../../example-json-data/calendar/resources.json');
        
        if (!file_exists($jsonPath)) {
            throw new \Exception("Resources JSON file not found at: {$jsonPath}");
        }
        
        $resourcesData = json_decode(file_get_contents($jsonPath), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON in resources file: " . json_last_error_msg());
        }
        
        foreach ($resourcesData as $resource) {
            Resource::create($resource);
        }
    }
}