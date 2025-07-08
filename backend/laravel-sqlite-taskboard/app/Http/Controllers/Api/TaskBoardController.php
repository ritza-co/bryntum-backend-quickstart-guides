<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Resource;
use App\Models\Assignment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TaskBoardController extends Controller
{
    public function load()
    {
        try {
            $assignments = Assignment::all();
            $tasks = Task::all();
            $resources = Resource::all();
            
            return response()->json([
                'assignments' => ['rows' => $assignments],
                'tasks' => ['rows' => $tasks],
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
                $tasks = $request->input('tasks');
                $resources = $request->input('resources');
                
                $response = ['requestId' => $requestId, 'success' => true];

                if ($resources) {
                    $rows = $this->applyTableChanges('resources', $resources);
                    if ($rows) {
                        $response['resources'] = ['rows' => $rows];
                    }
                }

                if ($tasks) {
                    $rows = $this->applyTableChanges('tasks', $tasks);
                    if ($rows) {
                        $response['tasks'] = ['rows' => $rows];
                    }
                }

                if ($assignments) {
                    $rows = $this->applyTableChanges('assignments', $assignments);
                    if ($rows) {
                        $response['assignments'] = ['rows' => $rows];
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
            
            if ($table === 'tasks') {
                $task = Task::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $task->id];
            } elseif ($table === 'resources') {
                $resource = Resource::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $resource->id];
            } elseif ($table === 'assignments') {
                $assignment = Assignment::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $assignment->id];
            }
        }
        
        return $results;
    }

    private function updateOperation($updated, $table)
    {
        foreach ($updated as $record) {
            $id = $record['id'];
            unset($record['id']);
            
            if ($table === 'tasks') {
                $fillableData = array_intersect_key($record, array_flip((new Task())->getFillable()));
                Task::where('id', $id)->update($fillableData);
            } elseif ($table === 'resources') {
                $fillableData = array_intersect_key($record, array_flip((new Resource())->getFillable()));
                Resource::where('id', $id)->update($fillableData);
            } elseif ($table === 'assignments') {
                $fillableData = array_intersect_key($record, array_flip((new Assignment())->getFillable()));
                Assignment::where('id', $id)->update($fillableData);
            }
        }
    }

    private function deleteOperation($deleted, $table)
    {
        foreach ($deleted as $record) {
            $id = $record['id'];
            
            if ($table === 'tasks') {
                Task::where('id', $id)->delete();
            } elseif ($table === 'resources') {
                Resource::where('id', $id)->delete();
            } elseif ($table === 'assignments') {
                Assignment::where('id', $id)->delete();
            }
        }
    }
}