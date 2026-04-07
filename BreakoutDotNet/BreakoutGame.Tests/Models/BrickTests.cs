namespace BreakoutGame.Tests.Models;

public class BrickTests
{
    [Theory]
    [InlineData(BrickColor.Green,  1, 0,  10)]
    [InlineData(BrickColor.Yellow, 1, 0,  20)]
    [InlineData(BrickColor.Orange, 2, 10, 30)]
    [InlineData(BrickColor.Red,    2, 10, 50)]
    [InlineData(BrickColor.Purple, 3, 10, 100)]
    [InlineData(BrickColor.Silver, 4, 10, 200)]
    public void Create_SetsCorrectStatsForColor(
        BrickColor color, int expectedHp, int expectedPointsPerHit, int expectedPointsOnBreak)
    {
        var brick = Brick.Create(color, 0, 0);

        Assert.Equal(expectedHp, brick.HitPoints);
        Assert.Equal(expectedHp, brick.MaxHitPoints);
        Assert.Equal(expectedPointsPerHit, brick.PointsPerHit);
        Assert.Equal(expectedPointsOnBreak, brick.PointsOnBreak);
    }

    [Fact]
    public void Create_SetsCorrectPosition()
    {
        var brick = Brick.Create(BrickColor.Green, 42.5, 99.0);

        Assert.Equal(42.5, brick.X);
        Assert.Equal(99.0, brick.Y);
    }

    [Fact]
    public void Create_SetsCorrectDimensions()
    {
        var brick = Brick.Create(BrickColor.Green, 0, 0);

        Assert.Equal(GameConstants.BrickWidth, brick.Width);
        Assert.Equal(GameConstants.BrickHeight, brick.Height);
    }

    [Theory]
    [InlineData(BrickColor.Green)]
    [InlineData(BrickColor.Yellow)]
    [InlineData(BrickColor.Orange)]
    [InlineData(BrickColor.Red)]
    [InlineData(BrickColor.Purple)]
    [InlineData(BrickColor.Silver)]
    public void Create_SetsCorrectColor(BrickColor color)
    {
        var brick = Brick.Create(color, 0, 0);
        Assert.Equal(color, brick.Color);
    }

    [Fact]
    public void Create_BrickIsNotDestroyed()
    {
        var brick = Brick.Create(BrickColor.Silver, 0, 0);
        Assert.False(brick.IsDestroyed);
    }

    [Fact]
    public void Hit_SingleHpBrick_Destroys()
    {
        var brick = Brick.Create(BrickColor.Green, 0, 0);

        brick.Hit();

        Assert.True(brick.IsDestroyed);
        Assert.Equal(0, brick.HitPoints);
    }

    [Fact]
    public void Hit_MultiHpBrick_ReducesHpByOne()
    {
        var brick = Brick.Create(BrickColor.Orange, 0, 0); // 2 HP

        brick.Hit();

        Assert.Equal(1, brick.HitPoints);
        Assert.False(brick.IsDestroyed);
    }

    [Fact]
    public void Hit_MultiHpBrick_TwiceDestroys()
    {
        var brick = Brick.Create(BrickColor.Orange, 0, 0); // 2 HP

        brick.Hit();
        brick.Hit();

        Assert.True(brick.IsDestroyed);
        Assert.Equal(0, brick.HitPoints);
    }

    [Fact]
    public void Hit_DestroyedBrick_DoesNotChangeHp()
    {
        var brick = Brick.Create(BrickColor.Green, 0, 0);
        brick.Hit(); // destroy it

        brick.Hit(); // should have no effect

        Assert.True(brick.IsDestroyed);
        Assert.Equal(0, brick.HitPoints);
    }

    [Fact]
    public void DamageRatio_SingleHpBrick_IsAlwaysZero()
    {
        var brick = Brick.Create(BrickColor.Green, 0, 0);

        Assert.Equal(0.0, brick.DamageRatio);
    }

    [Fact]
    public void DamageRatio_MultiHpBrickFullHealth_IsZero()
    {
        var brick = Brick.Create(BrickColor.Silver, 0, 0); // 4 HP

        Assert.Equal(0.0, brick.DamageRatio);
    }

    [Fact]
    public void DamageRatio_MultiHpBrickHalfHealth_IsHalf()
    {
        var brick = Brick.Create(BrickColor.Silver, 0, 0); // 4 HP
        brick.Hit();
        brick.Hit(); // now 2/4 HP = 50% damage

        Assert.Equal(0.5, brick.DamageRatio, precision: 5);
    }
}
