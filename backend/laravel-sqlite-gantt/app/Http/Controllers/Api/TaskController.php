<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Dependency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    // Bryntum CrudManager load endpoint
    public function load()
    {
        try {
            $tasks = Task::orderBy('parentId', 'ASC')
                ->orderBy('parentIndex', 'ASC')
                ->get();
            $dependencies = Dependency::orderBy('id', 'ASC')->get();

            return response()->json([
                'success' => true,
                'requestId' => request()->header('X-Request-Id') ?? time(),
                'revision' => 1,
                'tasks' => [
                    'rows' => $tasks,
                    'total' => $tasks->count(),
                ],
                'dependencies' => [
                    'rows' => $dependencies,
                    'total' => $dependencies->count(),
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
                    'tasks' => ['rows' => []],
                    'dependencies' => ['rows' => []],
                ];

                $tasks = $request->input('tasks', []);

                // Handle added tasks - map phantom IDs to real IDs
                if (isset($tasks['added'])) {
                    foreach ($tasks['added'] as $task) {
                        $phantomId = $task['$PhantomId'] ?? null;
                        unset($task['$PhantomId']);

                        $newTask = Task::create($task);

                        // Return ID mapping for client to update phantom IDs
                        $mapping = ['id' => $newTask->id];
                        if ($phantomId) {
                            $mapping['$PhantomId'] = $phantomId;
                        }
                        $response['tasks']['rows'][] = $mapping;
                    }
                }

                // Handle updated tasks
                if (isset($tasks['updated'])) {
                    foreach ($tasks['updated'] as $task) {
                        $id = $task['id'];
                        unset($task['id']);

                        $existingTask = Task::find($id);
                        if ($existingTask) {
                            // Update only fields that were sent
                            $fillableData = array_intersect_key($task, array_flip((new Task())->getFillable()));

                            if (!empty($fillableData)) {
                                $existingTask->update($fillableData);
                            }
                        }
                    }
                }

                // Handle removed tasks
                if (isset($tasks['removed'])) {
                    foreach ($tasks['removed'] as $task) {
                        $existingTask = Task::find($task['id']);
                        if ($existingTask) {
                            $existingTask->delete();
                        }
                    }
                }

                // Process dependencies
                $dependencies = $request->input('dependencies', []);

                // Handle added dependencies
                if (isset($dependencies['added'])) {
                    foreach ($dependencies['added'] as $dep) {
                        $phantomId = $dep['$PhantomId'] ?? null;
                        unset($dep['$PhantomId']);

                        $newDep = Dependency::create($dep);

                        // Return ID mapping for client to update phantom IDs
                        $mapping = ['id' => $newDep->id];
                        if ($phantomId) {
                            $mapping['$PhantomId'] = $phantomId;
                        }
                        $response['dependencies']['rows'][] = $mapping;
                    }
                }

                // Handle updated dependencies
                if (isset($dependencies['updated'])) {
                    foreach ($dependencies['updated'] as $dep) {
                        $id = $dep['id'];
                        unset($dep['id']);

                        $existingDep = Dependency::find($id);
                        if ($existingDep) {
                            $fillableData = array_intersect_key($dep, array_flip((new Dependency())->getFillable()));

                            if (!empty($fillableData)) {
                                $existingDep->update($fillableData);
                            }
                        }
                    }
                }

                // Handle removed dependencies
                if (isset($dependencies['removed'])) {
                    foreach ($dependencies['removed'] as $dep) {
                        $existingDep = Dependency::find($dep['id']);
                        if ($existingDep) {
                            $existingDep->delete();
                        }
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