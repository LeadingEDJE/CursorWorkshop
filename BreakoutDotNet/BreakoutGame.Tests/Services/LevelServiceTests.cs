using BreakoutGame.Services;

namespace BreakoutGame.Tests.Services;

public class LevelServiceTests
{
    // ── Level content validation ───────────────────────────────────────────────

    [Fact]
    public void Level1_ContainsOnlyGreenAndYellowBricks()
    {
        var bricks = LevelService.BuildBricks(1);

        Assert.NotEmpty(bricks);
        Assert.All(bricks, b =>
            Assert.True(b.Color == BrickColor.Green || b.Color == BrickColor.Yellow,
                $"Level 1 should only have Green/Yellow bricks, but found {b.Color}"));
    }

    [Fact]
    public void Level1_HasThreeRows()
    {
        var level = LevelService.GetLevel(1);
        Assert.Equal(3, level.Rows);
    }

    [Fact]
    public void Level2_HasFiveRows()
    {
        var level = LevelService.GetLevel(2);
        Assert.Equal(5, level.Rows);
    }

    [Fact]
    public void Level2_ContainsOrangeBricks()
    {
        var bricks = LevelService.BuildBricks(2);
        Assert.Contains(bricks, b => b.Color == BrickColor.Orange);
    }

    [Fact]
    public void Level5_HasSilverBricksInTopRow()
    {
        var bricks = LevelService.BuildBricks(5);
        double topRowY = GameConstants.BrickAreaTop;
        var topRowBricks = bricks.Where(b => Math.Abs(b.Y - topRowY) < 1.0).ToList();

        Assert.NotEmpty(topRowBricks);
        Assert.All(topRowBricks, b => Assert.Equal(BrickColor.Silver, b.Color));
    }

    // ── Position/bounds validation ─────────────────────────────────────────────

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void BricksForLevel_AreWithinCanvasBounds(int levelNumber)
    {
        var bricks = LevelService.BuildBricks(levelNumber);

        Assert.All(bricks, b =>
        {
            Assert.True(b.X >= 0, $"Brick X={b.X} is off-screen left");
            Assert.True(b.X + b.Width <= GameConstants.CanvasWidth,
                $"Brick right edge {b.X + b.Width} exceeds canvas width");
            Assert.True(b.Y >= 0, $"Brick Y={b.Y} is off-screen top");
            Assert.True(b.Y + b.Height <= GameConstants.CanvasHeight / 2,
                $"Brick Y={b.Y} extends below the midpoint — check layout");
        });
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void BricksForLevel_HaveNoOverlaps(int levelNumber)
    {
        var bricks = LevelService.BuildBricks(levelNumber);

        for (int i = 0; i < bricks.Count; i++)
        {
            for (int j = i + 1; j < bricks.Count; j++)
            {
                var a = bricks[i];
                var b = bricks[j];
                bool overlapX = a.X < b.X + b.Width && a.X + a.Width > b.X;
                bool overlapY = a.Y < b.Y + b.Height && a.Y + a.Height > b.Y;
                Assert.False(overlapX && overlapY,
                    $"Level {levelNumber}: brick at ({a.X},{a.Y}) overlaps brick at ({b.X},{b.Y})");
            }
        }
    }

    // ── Level cycling ─────────────────────────────────────────────────────────

    [Fact]
    public void GetLevel_LevelSix_CyclesToPatternOfLevelOne()
    {
        var level1 = LevelService.GetLevel(1);
        var level6 = LevelService.GetLevel(6);

        Assert.Equal(level1.Rows, level6.Rows);
        Assert.Equal(level1.Columns, level6.Columns);
        Assert.Equal(6, level6.LevelNumber);
    }

    [Fact]
    public void GetLevel_LevelTen_CyclesToPatternOfLevelFive()
    {
        var level5  = LevelService.GetLevel(5);
        var level10 = LevelService.GetLevel(10);

        Assert.Equal(level5.Rows, level10.Rows);
        Assert.Equal(level5.Columns, level10.Columns);
    }

    // ── Brick positions are deterministic ─────────────────────────────────────

    [Fact]
    public void BuildBricks_ReturnsDeterministicPositions()
    {
        var run1 = LevelService.BuildBricks(1);
        var run2 = LevelService.BuildBricks(1);

        Assert.Equal(run1.Count, run2.Count);
        for (int i = 0; i < run1.Count; i++)
        {
            Assert.Equal(run1[i].X, run2[i].X);
            Assert.Equal(run1[i].Y, run2[i].Y);
            Assert.Equal(run1[i].Color, run2[i].Color);
        }
    }

    [Fact]
    public void BuildBricks_UsesCorrectLeftOffset()
    {
        var bricks = LevelService.BuildBricks(1);
        double minX = bricks.Min(b => b.X);

        Assert.Equal(GameConstants.BrickLeftOffset, minX, precision: 5);
    }

    [Fact]
    public void BuildBricks_UsesCorrectTopOffset()
    {
        var bricks = LevelService.BuildBricks(1);
        double minY = bricks.Min(b => b.Y);

        Assert.Equal(GameConstants.BrickAreaTop, minY, precision: 5);
    }

    [Fact]
    public void AllLevels_HaveBricks()
    {
        for (int i = 1; i <= 10; i++)
        {
            var bricks = LevelService.BuildBricks(i);
            Assert.NotEmpty(bricks);
        }
    }
}
