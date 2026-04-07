namespace BreakoutGame.Models;

public class Paddle
{
    public const double DefaultWidth = 100.0;
    public const double DefaultHeight = 14.0;
    public const double DefaultSpeed = 500.0;

    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; } = DefaultWidth;
    public double Height { get; set; } = DefaultHeight;
    public double Speed { get; set; } = DefaultSpeed;

    public double Left => X;
    public double Right => X + Width;
    public double CenterX => X + Width / 2.0;

    public Paddle() { }

    public Paddle(double x, double y)
    {
        X = x;
        Y = y;
    }
}
