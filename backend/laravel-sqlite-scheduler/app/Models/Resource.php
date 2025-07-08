<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'eventColor',
        'readOnly',
    ];

    protected $casts = [
        'readOnly' => 'boolean',
    ];

    public $timestamps = false;

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'resourceId');
    }

    public function events()
    {
        return $this->belongsToMany(Event::class, 'assignments', 'resourceId', 'eventId');
    }
}