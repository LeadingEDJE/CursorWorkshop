namespace BreakoutGame.Models;

public class Particle
{
    public double X { get; set; }
    public double Y { get; set; }
    public double VelocityX { get; set; }
    public double VelocityY { get; set; }
    public double Life { get; set; }       // remaining lifetime in seconds
    public double MaxLife { get; set; } = 0.3;
    public string Color { get; set; } = "#ffffff";
    public double Radius { get; set; } = 3.0;

    public double Alpha => MaxLife > 0 ? Life / MaxLife : 0;
    public bool IsDead => Life <= 0;

    public void Update(double deltaTime)
    {
        X += VelocityX * deltaTime;
        Y += VelocityY * deltaTime;
        Life = Math.Max(0, Life - deltaTime);
    }
}
