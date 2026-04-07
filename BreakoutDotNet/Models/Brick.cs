namespace BreakoutGame.Models;

public class Brick
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; } = GameConstants.BrickWidth;
    public double Height { get; set; } = GameConstants.BrickHeight;
    public BrickColor Color { get; set; }
    public int HitPoints { get; set; }
    public int MaxHitPoints { get; set; }
    public int PointsPerHit { get; set; }
    public int PointsOnBreak { get; set; }
    public bool IsDestroyed { get; set; }

    /// <summary>
    /// Damage ratio: 0 = full health, approaching 1 = nearly destroyed. Used for visual damage states.
    /// </summary>
    public double DamageRatio => MaxHitPoints > 1
        ? 1.0 - (double)HitPoints / MaxHitPoints
        : 0.0;

    public static Brick Create(BrickColor color, double x, double y)
    {
        var (hp, pointsPerHit, pointsOnBreak) = color switch
        {
            BrickColor.Green  => (1, 0, 10),
            BrickColor.Yellow => (1, 0, 20),
            BrickColor.Orange => (2, 10, 30),
            BrickColor.Red    => (2, 10, 50),
            BrickColor.Purple => (3, 10, 100),
            BrickColor.Silver => (4, 10, 200),
            _ => throw new ArgumentException($"Unknown brick color: {color}")
        };

        return new Brick
        {
            X = x,
            Y = y,
            Color = color,
            HitPoints = hp,
            MaxHitPoints = hp,
            PointsPerHit = pointsPerHit,
            PointsOnBreak = pointsOnBreak
        };
    }

    public void Hit()
    {
        if (IsDestroyed) return;
        HitPoints--;
        if (HitPoints <= 0)
            IsDestroyed = true;
    }
}
