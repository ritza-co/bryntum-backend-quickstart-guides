using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GridApi.Data;
using GridApi.Models;

namespace GridApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class GridController : ControllerBase
    {
        private readonly GridContext _context;
        private readonly ILogger<GridController> _logger;

        public GridController(GridContext context, ILogger<GridController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("read")]
        public async Task<ActionResult<ReadResponse>> Read()
        {
            try
            {
                var players = await _context.Players.ToListAsync();

                _logger.LogInformation("Read {PlayerCount} players", players.Count);

                return Ok(new ReadResponse
                {
                    Success = true,
                    Data = players
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading players");
                return StatusCode(500, new ReadResponse
                {
                    Success = false,
                    Message = "Players data could not be read."
                });
            }
        }

        [HttpPost("create")]
        public async Task<ActionResult<ReadResponse>> Create([FromBody] CreateUpdateRequest request)
        {
            try
            {
                if (request.Data == null || request.Data.Count == 0)
                {
                    return BadRequest(new ReadResponse
                    {
                        Success = false,
                        Message = "No players data provided"
                    });
                }

                var createdPlayers = new List<Player>();

                foreach (var player in request.Data)
                {
                    // Reset Id to 0 for new players (will be auto-generated)
                    player.Id = 0;

                    _context.Players.Add(player);
                    await _context.SaveChangesAsync();

                    createdPlayers.Add(player);
                }

                _logger.LogInformation("Created {PlayerCount} players", createdPlayers.Count);

                return Ok(new ReadResponse
                {
                    Success = true,
                    Data = createdPlayers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating players");
                return StatusCode(500, new ReadResponse
                {
                    Success = false,
                    Message = "Players could not be created"
                });
            }
        }

        [HttpPatch("update")]
        public async Task<ActionResult<ReadResponse>> Update([FromBody] CreateUpdateRequest request)
        {
            try
            {
                if (request.Data == null || request.Data.Count == 0)
                {
                    return BadRequest(new ReadResponse
                    {
                        Success = false,
                        Message = "No players data provided"
                    });
                }

                var updatedPlayers = new List<Player>();

                foreach (var playerUpdate in request.Data)
                {
                    if (playerUpdate.Id <= 0)
                    {
                        continue;
                    }

                    var existingPlayer = await _context.Players.FindAsync(playerUpdate.Id);
                    if (existingPlayer == null)
                    {
                        return StatusCode(500, new ReadResponse
                        {
                            Success = false,
                            Message = $"Player with id {playerUpdate.Id} not found"
                        });
                    }

                    // Update all fields
                    if (playerUpdate.Name != null) existingPlayer.Name = playerUpdate.Name;
                    if (playerUpdate.City != null) existingPlayer.City = playerUpdate.City;
                    if (playerUpdate.Team != null) existingPlayer.Team = playerUpdate.Team;
                    existingPlayer.Score = playerUpdate.Score;
                    existingPlayer.PercentageWins = playerUpdate.PercentageWins;

                    await _context.SaveChangesAsync();
                    updatedPlayers.Add(existingPlayer);
                }

                _logger.LogInformation("Updated {PlayerCount} players", updatedPlayers.Count);

                return Ok(new ReadResponse
                {
                    Success = true,
                    Data = updatedPlayers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating players");
                return StatusCode(500, new ReadResponse
                {
                    Success = false,
                    Message = "Players could not be updated"
                });
            }
        }

        [HttpDelete("delete")]
        public async Task<ActionResult<DeleteResponse>> Delete([FromBody] DeleteRequest request)
        {
            try
            {
                if (request.Ids == null || request.Ids.Count == 0)
                {
                    return BadRequest(new DeleteResponse
                    {
                        Success = false,
                        Message = "No player ids provided"
                    });
                }

                var playersToDelete = await _context.Players
                    .Where(p => request.Ids.Contains(p.Id))
                    .ToListAsync();

                _context.Players.RemoveRange(playersToDelete);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted {PlayerCount} players", playersToDelete.Count);

                return Ok(new DeleteResponse
                {
                    Success = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting players");
                return StatusCode(500, new DeleteResponse
                {
                    Success = false,
                    Message = "Could not delete selected player record(s)"
                });
            }
        }
    }
}
