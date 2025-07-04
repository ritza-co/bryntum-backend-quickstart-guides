<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Player;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlayerController extends Controller
{
    public function read()
    {
        try {
            $players = Player::all();
            return response()->json([
                'success' => true,
                'data'    => $players,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Players data could not be read.',
            ], 500);
        }
    }

    public function create(Request $request)
    {
        try {
            $data = $request->input('data', []);

            // Perform all creates in a single transaction
            $createdPlayers = DB::transaction(function () use ($data) {
                $result = [];
                foreach ($data as $item) {
                    // Remove id from data as it will be auto-generated
                    unset($item['id']);
                    $player = Player::create($item);
                    $result[] = $player;
                }
                return $result;
            });

            return response()->json([
                'success' => true,
                'data'    => $createdPlayers,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Players could not be created',
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $data = $request->input('data', []);

            // Perform all updates in a single transaction
            $updatedPlayers = DB::transaction(function () use ($data) {
                $result = [];
                foreach ($data as $item) {
                    $id = $item['id'];
                    unset($item['id']);

                    $player = Player::findOrFail($id);
                    $player->update($item);
                    $result[] = $player;
                }
                return $result;
            });

            return response()->json([
                'success' => true,
                'data'    => $updatedPlayers,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Players could not be updated',
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        try {
            $ids = $request->input('ids', []);

            // Perform the delete operations in a single transaction
            DB::transaction(function () use ($ids) {
                Player::destroy($ids);
            });

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Could not delete selected player record(s)',
            ], 500);
        }
    }
}
