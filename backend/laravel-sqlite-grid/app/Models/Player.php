<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $city
 * @property string $team
 * @property float $score
 * @property float $percentageWins
 */

class Player extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'city',
        'team',
        'score',
        'percentageWins',
    ];

    protected $casts = [
        'score'          => 'float',
        'percentageWins' => 'float',
    ];
}
