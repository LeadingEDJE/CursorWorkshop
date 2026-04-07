namespace BreakoutGame.Models;

public class GameState
{
    public int Score { get; set; }
    public int Lives { get; set; } = GameConstants.StartingLives;
    public int Level { get; set; } = 1;
    public GameStatus Status { get; set; } = GameStatus.Title;

    public Ball Ball { get; set; } = new();
    public Paddle Paddle { get; set; } = new();
    public List<Brick> Bricks { get; set; } = new();
    public List<Particle> Particles { get; set; } = new();

    /// <summary>Used to track time remaining in LifeLost / LevelComplete delays.</summary>
    public double StateTimer { get; set; }

    /// <summary>Seconds elapsed since the current state was entered. Used for animations.</summary>
    public double StateElapsed { get; set; }

    /// <summary>Tracks whether a wall-bounce flash effect is active and how long to display it.</summary>
    public double WallFlashTimer { get; set; }

    /// <summary>Tracks whether a paddle hit pulse is active.</summary>
    public double PaddleFlashTimer { get; set; }

    public bool AllBricksCleared =>
        Bricks.Count == 0 || Bricks.All(b => b.IsDestroyed);
}
