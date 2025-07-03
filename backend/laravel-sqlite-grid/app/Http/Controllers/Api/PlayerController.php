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
            Log::info('ss');
            $players = Player::orderBy('parentIndex')->get();
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
            // Bryntum sends new records in a 'data' array. We'll take the first one.
            $playerData = $request->input('data.0');

            // Exclude 'id' as the database will auto-generate it.
            unset($playerData['id']);

            // Assign the next parentIndex
            $playerData['parentIndex'] = Player::max('parentIndex') + 1;

            $player = Player::create($playerData);

            return response()->json([
                'success' => true,
                'data'    => [$player], // Bryntum Grid expects the created record back in an array
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Player could not be created.',
            ], 500);
        }
    }
    public function update(Request $request, Player $player)
    {
        try {
            $player->update($request->all());
            return response()->json([
                'success' => true,
                'data'    => [$player],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Player could not be updated.',
            ], 500);
        }
    }
    public function delete(Request $request)
    {
        try {
            // The AjaxStore sends deleted records as an object with an 'ids' property containing an array of the record IDs.
            $idsToDelete = $request->input('ids');
            Player::destroy($idsToDelete);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not delete selected player record(s).',
            ], 500);
        }
    }
    public function bulkUpdateOrder(Request $request)
    {
        try {
            $players = $request->all();

            DB::transaction(function () use ($players) {
                foreach ($players as $playerData) {
                    Player::where('id', $playerData['id'])->update(['parentIndex' => $playerData['parentIndex']]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Player order updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not update player order.',
            ], 500);
        }
    }
}
