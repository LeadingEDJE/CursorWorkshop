using BreakoutGame.Models;

namespace BreakoutGame.Services;

/// <summary>
/// Handles score updates when bricks are hit or destroyed.
/// </summary>
public static class ScoringService
{
    /// <summary>
    /// Called when a multi-HP brick survives a hit (HP > 0 after hit).
    /// Awards PointsPerHit if any.
    /// </summary>
    public static void OnBrickHit(Brick brick, GameState state)
    {
        if (brick.PointsPerHit > 0)
            state.Score += brick.PointsPerHit;
    }

    /// <summary>
    /// Called when a brick's HP drops to zero (it was just destroyed).
    /// Awards PointsOnBreak.
    /// </summary>
    public static void OnBrickDestroyed(Brick brick, GameState state)
    {
        state.Score += brick.PointsOnBreak;
    }

    /// <summary>
    /// Processes a brick hit: reduces HP, awards points, returns whether the brick was destroyed.
    /// </summary>
    public static bool ProcessHit(Brick brick, GameState state)
    {
        if (brick.IsDestroyed) return false;

        int hpBefore = brick.HitPoints;
        brick.Hit();

        if (brick.IsDestroyed)
        {
            OnBrickDestroyed(brick, state);
            return true;
        }
        else
        {
            OnBrickHit(brick, state);
            return false;
        }
    }
}
