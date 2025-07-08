<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Event;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('../../example-json-data/scheduler/events.json');
        
        if (!file_exists($jsonPath)) {
            throw new \Exception("Events JSON file not found at: {$jsonPath}");
        }
        
        $eventsData = json_decode(file_get_contents($jsonPath), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON in events file: " . json_last_error_msg());
        }
        
        foreach ($eventsData as $event) {
            Event::create($event);
        }
    }
}