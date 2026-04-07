using BreakoutGame.Services;

namespace BreakoutGame.Tests.Services;

public class ScoringServiceTests
{
    private static GameState NewState() => new() { Score = 0 };

    // ── OnBrickHit ─────────────────────────────────────────────────────────────

    [Theory]
    [InlineData(BrickColor.Orange, 10)]
    [InlineData(BrickColor.Red,    10)]
    [InlineData(BrickColor.Purple, 10)]
    [InlineData(BrickColor.Silver, 10)]
    public void OnBrickHit_MultiHpBrick_AwardsPointsPerHit(BrickColor color, int expected)
    {
        var state = NewState();
        var brick = Brick.Create(color, 0, 0);

        ScoringService.OnBrickHit(brick, state);

        Assert.Equal(expected, state.Score);
    }

    [Theory]
    [InlineData(BrickColor.Green)]
    [InlineData(BrickColor.Yellow)]
    public void OnBrickHit_SingleHpBrick_AwardsZeroPoints(BrickColor color)
    {
        var state = NewState();
        var brick = Brick.Create(color, 0, 0);

        ScoringService.OnBrickHit(brick, state);

        Assert.Equal(0, state.Score);
    }

    // ── OnBrickDestroyed ───────────────────────────────────────────────────────

    [Theory]
    [InlineData(BrickColor.Green,  10)]
    [InlineData(BrickColor.Yellow, 20)]
    [InlineData(BrickColor.Orange, 30)]
    [InlineData(BrickColor.Red,    50)]
    [InlineData(BrickColor.Purple, 100)]
    [InlineData(BrickColor.Silver, 200)]
    public void OnBrickDestroyed_AwardsCorrectPointsOnBreak(BrickColor color, int expectedPoints)
    {
        var state = NewState();
        var brick = Brick.Create(color, 0, 0);

        ScoringService.OnBrickDestroyed(brick, state);

        Assert.Equal(expectedPoints, state.Score);
    }

    // ── ProcessHit ─────────────────────────────────────────────────────────────

    [Fact]
    public void ProcessHit_GreenBrick_DestroysAndAwardsTenPoints()
    {
        var state = NewState();
        var brick = Brick.Create(BrickColor.Green, 0, 0);

        bool destroyed = ScoringService.ProcessHit(brick, state);

        Assert.True(destroyed);
        Assert.True(brick.IsDestroyed);
        Assert.Equal(10, state.Score);
    }

    [Fact]
    public void ProcessHit_OrangeBrick_FirstHit_AwardsTenPointsNotDestroyed()
    {
        var state = NewState();
        var brick = Brick.Create(BrickColor.Orange, 0, 0); // 2 HP

        bool destroyed = ScoringService.ProcessHit(brick, state);

        Assert.False(destroyed);
        Assert.False(brick.IsDestroyed);
        Assert.Equal(10, state.Score); // PointsPerHit
    }

    [Fact]
    public void ProcessHit_OrangeBrick_SecondHit_AwardsBreakPoints()
    {
        var state = NewState();
        var brick = Brick.Create(BrickColor.Orange, 0, 0);
        ScoringService.ProcessHit(brick, state); // first hit: +10
        state.Score = 0; // reset to test second hit in isolation

        bool destroyed = ScoringService.ProcessHit(brick, state);

        Assert.True(destroyed);
        Assert.Equal(30, state.Score); // PointsOnBreak
    }

    [Fact]
    public void ProcessHit_SilverBrick_FullDestruction_AccumulatesAllPoints()
    {
        var state = NewState();
        var brick = Brick.Create(BrickColor.Silver, 0, 0); // 4 HP, +10 per hit, +200 on break

        ScoringService.ProcessHit(brick, state); // hit 1: +10
        ScoringService.ProcessHit(brick, state); // hit 2: +10
        ScoringService.ProcessHit(brick, state); // hit 3: +10
        ScoringService.ProcessHit(brick, state); // hit 4: +200 (destroyed)

        // 3 * 10 (per-hit) + 200 (on break) = 230
        Assert.Equal(230, state.Score);
        Assert.True(brick.IsDestroyed);
    }

    [Fact]
    public void ProcessHit_AlreadyDestroyedBrick_AwardsNoPoints()
    {
        var state = NewState();
        var brick = Brick.Create(BrickColor.Green, 0, 0);
        brick.Hit(); // destroy it manually

        bool destroyed = ScoringService.ProcessHit(brick, state);

        Assert.False(destroyed);
        Assert.Equal(0, state.Score);
    }

    [Fact]
    public void ProcessHit_AccumulatesScoreCorrectly()
    {
        var state = NewState();
        var green  = Brick.Create(BrickColor.Green, 0, 0);
        var yellow = Brick.Create(BrickColor.Yellow, 0, 0);

        ScoringService.ProcessHit(green, state);
        ScoringService.ProcessHit(yellow, state);

        Assert.Equal(30, state.Score); // 10 + 20
    }
}
