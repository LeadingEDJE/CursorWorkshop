using BreakoutGame.Services;

namespace BreakoutGame.Tests.Services;

public class CollisionServiceTests
{
    // rect at (100, 100), 60x20
    private const double RX = 100, RY = 100, RW = 60, RH = 20;
    private const double R = 8; // ball radius

    // ── No-collision cases ─────────────────────────────────────────────────────

    [Fact]
    public void NoCollision_BallFarAbove()
    {
        var result = CollisionService.CircleVsRect(130, 50, R, RX, RY, RW, RH);
        Assert.False(result.Collided);
    }

    [Fact]
    public void NoCollision_BallFarBelow()
    {
        var result = CollisionService.CircleVsRect(130, 160, R, RX, RY, RW, RH);
        Assert.False(result.Collided);
    }

    [Fact]
    public void NoCollision_BallFarLeft()
    {
        var result = CollisionService.CircleVsRect(50, 110, R, RX, RY, RW, RH);
        Assert.False(result.Collided);
    }

    [Fact]
    public void NoCollision_BallFarRight()
    {
        var result = CollisionService.CircleVsRect(220, 110, R, RX, RY, RW, RH);
        Assert.False(result.Collided);
    }

    [Fact]
    public void NoCollision_BallExactlyTangentAbove()
    {
        // Ball touching the top edge exactly — center is exactly radius above
        var result = CollisionService.CircleVsRect(130, RY - R, R, RX, RY, RW, RH);
        Assert.False(result.Collided);
    }

    // ── Collision face detection ───────────────────────────────────────────────

    [Fact]
    public void Collision_FromTop_ReturnsTopFace()
    {
        // Ball moving down, just barely overlapping top edge
        double cy = RY - R + 1; // 1px overlap at top
        var result = CollisionService.CircleVsRect(130, cy, R, RX, RY, RW, RH);

        Assert.True(result.Collided);
        Assert.Equal(CollisionFace.Top, result.Face);
        Assert.Equal(0, result.NormalX);
        Assert.Equal(-1, result.NormalY);
    }

    [Fact]
    public void Collision_FromBottom_ReturnsBottomFace()
    {
        // Ball overlapping bottom edge
        double cy = RY + RH + R - 1;
        var result = CollisionService.CircleVsRect(130, cy, R, RX, RY, RW, RH);

        Assert.True(result.Collided);
        Assert.Equal(CollisionFace.Bottom, result.Face);
        Assert.Equal(0, result.NormalX);
        Assert.Equal(1, result.NormalY);
    }

    [Fact]
    public void Collision_FromLeft_ReturnsLeftFace()
    {
        // Ball barely inside left edge of a tall rect
        var result = CollisionService.CircleVsRect(RX - R + 1, RY + 100, R, RX, RY, RW, 200);

        Assert.True(result.Collided);
        Assert.Equal(CollisionFace.Left, result.Face);
        Assert.Equal(-1, result.NormalX);
        Assert.Equal(0, result.NormalY);
    }

    [Fact]
    public void Collision_FromRight_ReturnsRightFace()
    {
        // Ball barely inside right edge of a tall rect
        var result = CollisionService.CircleVsRect(RX + RW + R - 1, RY + 100, R, RX, RY, RW, 200);

        Assert.True(result.Collided);
        Assert.Equal(CollisionFace.Right, result.Face);
        Assert.Equal(1, result.NormalX);
        Assert.Equal(0, result.NormalY);
    }

    // ── Center-of-rect collision ───────────────────────────────────────────────

    [Fact]
    public void Collision_BallCenteredOnRect_Collides()
    {
        double cx = RX + RW / 2;
        double cy = RY + RH / 2;
        var result = CollisionService.CircleVsRect(cx, cy, R, RX, RY, RW, RH);

        Assert.True(result.Collided);
    }

    // ── Reflect helper ────────────────────────────────────────────────────────

    [Fact]
    public void Reflect_OffTopSurface_NegatesVertical()
    {
        // Ball moving downward (0, 1) bouncing off top (normal 0, -1) => (0, -1)
        var (vx, vy) = CollisionService.Reflect(0, 1, 0, -1);

        Assert.Equal(0, vx, precision: 9);
        Assert.Equal(-1, vy, precision: 9);
    }

    [Fact]
    public void Reflect_OffLeftSurface_NegatesHorizontal()
    {
        // Ball moving left (-1, 0) off left wall (normal -1, 0) => (1, 0)
        var (vx, vy) = CollisionService.Reflect(-1, 0, -1, 0);

        Assert.Equal(1, vx, precision: 9);
        Assert.Equal(0, vy, precision: 9);
    }

    [Fact]
    public void Reflect_DiagonalOffTopSurface_PreservesHorizontalComponent()
    {
        // Ball moving at 45° downward-right (1, 1) reflects off top (0, -1) => (1, -1)
        var (vx, vy) = CollisionService.Reflect(1, 1, 0, -1);

        Assert.Equal(1, vx, precision: 9);
        Assert.Equal(-1, vy, precision: 9);
    }

    [Fact]
    public void Reflect_PreservesSpeed()
    {
        double vx = 3, vy = 4;
        double speedBefore = Math.Sqrt(vx * vx + vy * vy);

        var (rvx, rvy) = CollisionService.Reflect(vx, vy, 0, -1);
        double speedAfter = Math.Sqrt(rvx * rvx + rvy * rvy);

        Assert.Equal(speedBefore, speedAfter, precision: 9);
    }
}
