<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'eventColor',
        'readOnly',
        'timeZone',
        'draggable',
        'resizable',
        'children',
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
        'startDate' => 'datetime:Y-m-d\TH:i:s',
        'endDate' => 'datetime:Y-m-d\TH:i:s',
        'allDay' => 'boolean',
        'readOnly' => 'boolean',
        'draggable' => 'boolean',
        'duration' => 'float',
        'exceptionDates' => 'json',
    ];

    public $timestamps = false;

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'eventId');
    }

    public function resources()
    {
        return $this->belongsToMany(Resource::class, 'assignments', 'eventId', 'resourceId');
    }

    protected function resizable(): Attribute
    {
        return Attribute::make(
            get: static function ($value) {
                if ($value === null) {
                    return null;
                }

                if (is_bool($value)) {
                    return $value;
                }

                if (is_numeric($value)) {
                    return (int) $value === 1;
                }

                $normalized = strtolower((string) $value);

                return match ($normalized) {
                    'true' => true,
                    'false' => false,
                    default => $value,
                };
            },
            set: static function ($value) {
                if (is_bool($value)) {
                    return $value ? 'true' : 'false';
                }

                return $value;
            }
        );
    }
}
