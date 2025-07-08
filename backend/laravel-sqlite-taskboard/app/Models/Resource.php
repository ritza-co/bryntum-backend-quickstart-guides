<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'name',
        'eventColor',
        'readOnly',
    ];

    protected $casts = [
        'readOnly' => 'boolean',
    ];

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';

    public function events()
    {
        return $this->hasMany(Event::class, 'resourceId');
    }
}