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

    protected $casts = [
        'eventId' => 'integer',
        'resourceId' => 'string',
    ];

    public $timestamps = false;

    public function task()
    {
        return $this->belongsTo(Task::class, 'eventId');
    }

    public function resource()
    {
        return $this->belongsTo(Resource::class, 'resourceId');
    }
}