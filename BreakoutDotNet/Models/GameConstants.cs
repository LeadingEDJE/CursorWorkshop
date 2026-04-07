namespace BreakoutGame.Models;

public static class GameConstants
{
    public const double CanvasWidth = 800.0;
    public const double CanvasHeight = 600.0;

    public const double BrickWidth = 60.0;
    public const double BrickHeight = 20.0;
    public const double BrickGap = 2.0;
    public const int MaxColumns = 12;
    public const double BrickAreaTop = 80.0;
    // Left offset to center 12 columns: (800 - 12*60 - 11*2) / 2 = 29px
    public const double BrickLeftOffset = (CanvasWidth - MaxColumns * BrickWidth - (MaxColumns - 1) * BrickGap) / 2.0;

    public const int StartingLives = 3;
    public const double InitialBallSpeed = 350.0;
    public const double BallSpeedIncreasePerLevel = 0.05;

    public const double PaddleBottomOffset = 30.0;

    public const double MaxDeltaTime = 0.050;
    public const double LifeLostDelay = 1.0;
    public const double LevelCompleteDelay = 2.0;
}
