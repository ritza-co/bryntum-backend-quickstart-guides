<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Resource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CalendarController extends Controller
{
    public function load()
    {
        try {
            $events = Event::all();
            $resources = Resource::all();
            
            return response()->json([
                'events' => ['rows' => $events],
                'resources' => ['rows' => $resources],
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error loading the events and resources data.',
            ], 500);
        }
    }

    public function sync(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $requestId = $request->input('requestId');
                $events = $request->input('events');
                $resources = $request->input('resources');
                
                $response = ['requestId' => $requestId, 'success' => true];

                if ($resources) {
                    $rows = $this->applyTableChanges('resources', $resources);
                    if ($rows) {
                        $response['resources'] = ['rows' => $rows];
                    }
                }

                if ($events) {
                    $rows = $this->applyTableChanges('events', $events);
                    if ($rows) {
                        $response['events'] = ['rows' => $rows];
                    }
                }

                return response()->json($response);
            });
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'requestId' => $request->input('requestId'),
                'success' => false,
                'message' => 'There was an error syncing the data changes.',
            ], 500);
        }
    }

    private function applyTableChanges($table, $changes)
    {
        $rows = null;
        
        if (isset($changes['added'])) {
            $rows = $this->createOperation($changes['added'], $table);
        }
        
        if (isset($changes['updated'])) {
            $this->updateOperation($changes['updated'], $table);
        }
        
        if (isset($changes['removed'])) {
            $this->deleteOperation($changes['removed'], $table);
        }
        
        return $rows;
    }

    private function createOperation($added, $table)
    {
        $results = [];
        
        foreach ($added as $record) {
            $phantomId = $record['$PhantomId'] ?? null;
            unset($record['$PhantomId']);
            
            if ($table === 'events') {
                $event = Event::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $event->id];
            } elseif ($table === 'resources') {
                $resource = Resource::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $resource->id];
            }
        }
        
        return $results;
    }

    private function updateOperation($updated, $table)
    {
        foreach ($updated as $record) {
            $id = $record['id'];
            unset($record['id']);
            
            if ($table === 'events') {
                $fillableData = array_intersect_key($record, array_flip((new Event())->getFillable()));
                Event::where('id', $id)->update($fillableData);
            } elseif ($table === 'resources') {
                $fillableData = array_intersect_key($record, array_flip((new Resource())->getFillable()));
                Resource::where('id', $id)->update($fillableData);
            }
        }
    }

    private function deleteOperation($deleted, $table)
    {
        foreach ($deleted as $record) {
            $id = $record['id'];
            
            if ($table === 'events') {
                Event::where('id', $id)->delete();
            } elseif ($table === 'resources') {
                Resource::where('id', $id)->delete();
            }
        }
    }
}