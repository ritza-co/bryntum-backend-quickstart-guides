<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Resource;
use App\Models\Assignment;
use App\Models\Dependency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchedulerProController extends Controller
{
    public function load()
    {
        try {
            $assignments = Assignment::all();
            $dependencies = Dependency::all();
            $events = Event::all();
            $resources = Resource::all();
            
            return response()->json([
                'assignments' => ['rows' => $assignments],
                'dependencies' => ['rows' => $dependencies],
                'events' => ['rows' => $events],
                'resources' => ['rows' => $resources],
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error loading the data.',
            ], 500);
        }
    }

    public function sync(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $requestId = $request->input('requestId');
                $assignments = $request->input('assignments');
                $dependencies = $request->input('dependencies');
                $events = $request->input('events');
                $resources = $request->input('resources');
                
                $response = ['requestId' => $requestId, 'success' => true];
                $eventMapping = [];

                if ($resources) {
                    $rows = $this->applyTableChanges('resources', $resources);
                    if ($rows) {
                        $response['resources'] = ['rows' => $rows];
                    }
                }

                if ($events) {
                    $rows = $this->applyTableChanges('events', $events);
                    if ($rows) {
                        if (isset($events['added'])) {
                            foreach ($rows as $row) {
                                $eventMapping[$row['$PhantomId']] = $row['id'];
                            }
                        }
                        $response['events'] = ['rows' => $rows];
                    }
                }

                if ($assignments) {
                    if ($events && isset($events['added'])) {
                        foreach ($assignments['added'] as &$assignment) {
                            if (isset($eventMapping[$assignment['eventId']])) {
                                $assignment['eventId'] = $eventMapping[$assignment['eventId']];
                            }
                        }
                    }
                    $rows = $this->applyTableChanges('assignments', $assignments);
                    if ($rows) {
                        $response['assignments'] = ['rows' => $rows];
                    }
                }

                if ($dependencies) {
                    $rows = $this->applyTableChanges('dependencies', $dependencies);
                    if ($rows) {
                        $response['dependencies'] = ['rows' => $rows];
                    }
                }

                return response()->json($response);
            });
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'requestId' => $request->input('requestId'),
                'success' => false,
                'message' => 'There was an error syncing the data changes: ' . $e->getMessage(),
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
            } elseif ($table === 'assignments') {
                $assignment = Assignment::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $assignment->id];
            } elseif ($table === 'dependencies') {
                $dependency = Dependency::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $dependency->id];
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
            } elseif ($table === 'assignments') {
                $fillableData = array_intersect_key($record, array_flip((new Assignment())->getFillable()));
                Assignment::where('id', $id)->update($fillableData);
            } elseif ($table === 'dependencies') {
                $fillableData = array_intersect_key($record, array_flip((new Dependency())->getFillable()));
                Dependency::where('id', $id)->update($fillableData);
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
            } elseif ($table === 'assignments') {
                Assignment::where('id', $id)->delete();
            } elseif ($table === 'dependencies') {
                Dependency::where('id', $id)->delete();
            }
        }
    }
}