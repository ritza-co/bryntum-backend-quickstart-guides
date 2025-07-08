<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    // Bryntum CrudManager load endpoint
    public function load()
    {
        try {
            $tasks = Task::orderBy('id', 'ASC')->get();
            
            return response()->json([
                'success' => true,
                'requestId' => request()->header('X-Request-Id') ?? time(),
                'revision' => 1,
                'tasks' => [
                    'rows' => $tasks,
                    'total' => $tasks->count(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Bryntum CrudManager sync endpoint
    public function sync(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $response = [
                    'success' => true,
                    'requestId' => $request->input('requestId') ?? time(),
                    'revision' => ($request->input('revision') ?? 0) + 1,
                    'tasks' => ['rows' => [], 'added' => [], 'updated' => [], 'removed' => []],
                ];

                $tasks = $request->input('tasks', []);

                // Handle added tasks - map phantom IDs to real IDs
                if (isset($tasks['added'])) {
                    foreach ($tasks['added'] as $task) {
                        $phantomId = $task['$PhantomId'] ?? null;
                        unset($task['$PhantomId']);
                        
                        $newTask = Task::create($task);
                        
                        // Return both phantom ID and real ID for client mapping
                        $taskData = $newTask->toArray();
                        if ($phantomId) {
                            $taskData['$PhantomId'] = $phantomId;
                        }
                        $response['tasks']['rows'][] = $taskData;
                    }
                }

                // Handle updated tasks
                if (isset($tasks['updated'])) {
                    foreach ($tasks['updated'] as $task) {
                        $id = $task['id'];
                        unset($task['id']);
                        
                        // Filter to only include fillable fields
                        $fillableData = array_intersect_key($task, array_flip((new Task())->getFillable()));
                        
                        // Only update if there are fillable fields to update
                        if (!empty($fillableData)) {
                            Task::where('id', $id)->update($fillableData);
                        }
                    }
                }

                // Handle removed tasks
                if (isset($tasks['removed'])) {
                    foreach ($tasks['removed'] as $task) {
                        Task::where('id', $task['id'])->delete();
                    }
                }

                return response()->json($response);
            });
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}