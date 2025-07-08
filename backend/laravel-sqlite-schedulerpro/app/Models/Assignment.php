<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'eventId',
        'resourceId',
    ];

    public $timestamps = false;

    public function event()
    {
        return $this->belongsTo(Event::class, 'eventId');
    }

    public function resource()
    {
        return $this->belongsTo(Resource::class, 'resourceId');
    }
}