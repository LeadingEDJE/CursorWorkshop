namespace BreakoutGame.Models;

public class Ball
{
    public const double DefaultRadius = 8.0;

    public double X { get; set; }
    public double Y { get; set; }
    public double VelocityX { get; set; }
    public double VelocityY { get; set; }
    public double Radius { get; set; } = DefaultRadius;

    public Ball() { }

    public Ball(double x, double y, double velocityX = 0, double velocityY = 0)
    {
        X = x;
        Y = y;
        VelocityX = velocityX;
        VelocityY = velocityY;
    }

    public double Speed => Math.Sqrt(VelocityX * VelocityX + VelocityY * VelocityY);
}
