<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dependency extends Model
{
    use HasFactory;

    protected $fillable = [
        'from',
        'to',
        'fromSide',
        'toSide',
        'cls',
        'lag',
        'lagUnit',
    ];

    protected $casts = [
        'from' => 'integer',
        'to' => 'integer',
        'lag' => 'float',
    ];

    public $timestamps = false;

    public function fromEvent()
    {
        return $this->belongsTo(Event::class, 'from');
    }

    public function toEvent()
    {
        return $this->belongsTo(Event::class, 'to');
    }
}