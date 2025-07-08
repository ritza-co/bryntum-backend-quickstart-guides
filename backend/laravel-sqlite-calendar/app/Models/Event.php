<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'startDate',
        'endDate',
        'allDay',
        'resourceId',
        'eventColor',
        'readOnly',
        'timeZone',
        'draggable',
        'resizable',
        'duration',
        'durationUnit',
        'exceptionDates',
        'recurrenceRule',
        'cls',
        'eventStyle',
        'iconCls',
        'style',
    ];

    protected $casts = [
        'allDay' => 'boolean',
        'readOnly' => 'boolean',
        'draggable' => 'boolean',
        'resizable' => 'string',
        'duration' => 'integer',
        'exceptionDates' => 'json',
    ];

    public $timestamps = false;

    public function resource()
    {
        return $this->belongsTo(Resource::class, 'resourceId');
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