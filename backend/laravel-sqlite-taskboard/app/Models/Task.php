<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'eventColor',
        'description',
        'weight',
        'status',
        'prio',
    ];

    protected $casts = [
        'weight' => 'integer',
    ];

    public $timestamps = false;

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'taskId');
    }
}