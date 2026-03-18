<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dependency extends Model
{
    use HasFactory;

    protected $fillable = [
        'fromEvent',
        'toEvent',
        'type',
        'cls',
        'lag',
        'lagUnit',
        'active',
        'fromSide',
        'toSide',
    ];

    protected $casts = [
        'fromEvent' => 'integer',
        'toEvent' => 'integer',
        'type' => 'integer',
        'lag' => 'float',
        'active' => 'boolean',
    ];

    public $timestamps = false;
}
