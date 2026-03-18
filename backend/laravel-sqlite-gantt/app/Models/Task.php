<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'startDate',
        'endDate',
        'duration',
        'percentDone',
        'parentId',
        'expanded',
        'rollup',
        'manuallyScheduled',
        'parentIndex',
        'effort',
    ];

    protected $casts = [
        'startDate' => 'datetime',
        'endDate' => 'datetime',
        'duration' => 'float',
        'percentDone' => 'float',
        'parentId' => 'integer',
        'expanded' => 'boolean',
        'rollup' => 'boolean',
        'manuallyScheduled' => 'boolean',
        'parentIndex' => 'integer',
        'effort' => 'integer',
    ];

    public $timestamps = false;

    // Define parent-child relationships
    public function children()
    {
        return $this->hasMany(Task::class, 'parentId');
    }

    public function parent()
    {
        return $this->belongsTo(Task::class, 'parentId');
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s.000\Z');
    }

    public function toArray()
    {
        $array = parent::toArray();
        
        if (isset($array['startDate']) && $array['startDate']) {
            $array['startDate'] = \Carbon\Carbon::parse($array['startDate'])->utc()->format('Y-m-d\TH:i:s.000\Z');
        }
        
        if (isset($array['endDate']) && $array['endDate']) {
            $array['endDate'] = \Carbon\Carbon::parse($array['endDate'])->utc()->format('Y-m-d\TH:i:s.000\Z');
        }
        
        return $array;
    }
}