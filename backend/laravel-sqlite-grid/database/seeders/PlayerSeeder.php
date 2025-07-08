<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Player;

class PlayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('../../example-json-data/grid/players.json');
        
        if (!file_exists($jsonPath)) {
            throw new \Exception("Players JSON file not found at: {$jsonPath}");
        }
        
        $playersData = json_decode(file_get_contents($jsonPath), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Invalid JSON in players file: " . json_last_error_msg());
        }
        
        foreach ($playersData as $player) {
            Player::create($player);
        }
    }
}
