using BreakoutGame.Models;

namespace BreakoutGame.Services;

/// <summary>
/// Circle-vs-AABB (Axis-Aligned Bounding Box) collision detection.
/// All methods are pure static functions with no side effects.
/// </summary>
public static class CollisionService
{
    /// <summary>
    /// Tests whether a circle overlaps a rectangle and, if so, returns the collision face
    /// (top/bottom/left/right) and outward-pointing normal.
    /// </summary>
    /// <param name="cx">Circle center X</param>
    /// <param name="cy">Circle center Y</param>
    /// <param name="radius">Circle radius</param>
    /// <param name="rx">Rect left edge</param>
    /// <param name="ry">Rect top edge</param>
    /// <param name="rw">Rect width</param>
    /// <param name="rh">Rect height</param>
    public static CollisionResult CircleVsRect(
        double cx, double cy, double radius,
        double rx, double ry, double rw, double rh)
    {
        // Find the nearest point on the rect to the circle center
        double nearestX = Math.Clamp(cx, rx, rx + rw);
        double nearestY = Math.Clamp(cy, ry, ry + rh);

        double dx = cx - nearestX;
        double dy = cy - nearestY;
        double distSq = dx * dx + dy * dy;

        if (distSq >= radius * radius)
            return CollisionResult.NoCollision;

        // Determine which face was hit
        // The face with the smallest penetration depth determines the normal.
        double overlapLeft   = (cx + radius) - rx;
        double overlapRight  = (rx + rw) - (cx - radius);
        double overlapTop    = (cy + radius) - ry;
        double overlapBottom = (ry + rh) - (cy - radius);

        double minOverlap = Math.Min(Math.Min(overlapLeft, overlapRight),
                                     Math.Min(overlapTop, overlapBottom));

        if (minOverlap == overlapTop)
            return new CollisionResult(true, CollisionFace.Top, 0, -1);
        if (minOverlap == overlapBottom)
            return new CollisionResult(true, CollisionFace.Bottom, 0, 1);
        if (minOverlap == overlapLeft)
            return new CollisionResult(true, CollisionFace.Left, -1, 0);

        // overlapRight
        return new CollisionResult(true, CollisionFace.Right, 1, 0);
    }

    /// <summary>
    /// Reflects a velocity vector off a surface with the given normal.
    /// </summary>
    public static (double vx, double vy) Reflect(double vx, double vy, double nx, double ny)
    {
        // v' = v - 2(v·n)n
        double dot = vx * nx + vy * ny;
        return (vx - 2 * dot * nx, vy - 2 * dot * ny);
    }
}
