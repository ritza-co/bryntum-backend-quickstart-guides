<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $city
 * @property string $team
 * @property float    use HasFactory;
 $score
 * @property float $percentageWins
 * @property ?int $parentIndex
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
        'parentIndex',
    ];

    protected $casts = [
        'score'          => 'float',
        'percentageWins' => 'float',
        'parentIndex'    => 'integer',
    ];
}
