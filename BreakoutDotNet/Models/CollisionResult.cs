namespace BreakoutGame.Models;

public enum CollisionFace
{
    None,
    Top,
    Bottom,
    Left,
    Right
}

public record CollisionResult(bool Collided, CollisionFace Face, double NormalX, double NormalY)
{
    public static readonly CollisionResult NoCollision = new(false, CollisionFace.None, 0, 0);
}
