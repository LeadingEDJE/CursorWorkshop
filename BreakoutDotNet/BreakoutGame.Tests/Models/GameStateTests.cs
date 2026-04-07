namespace BreakoutGame.Tests.Models;

public class GameStateTests
{
    [Fact]
    public void Default_HasCorrectStartingValues()
    {
        var state = new GameState();

        Assert.Equal(0, state.Score);
        Assert.Equal(GameConstants.StartingLives, state.Lives);
        Assert.Equal(1, state.Level);
        Assert.Equal(GameStatus.Title, state.Status);
    }

    [Fact]
    public void Default_HasEmptyCollections()
    {
        var state = new GameState();

        Assert.NotNull(state.Bricks);
        Assert.Empty(state.Bricks);
        Assert.NotNull(state.Particles);
        Assert.Empty(state.Particles);
    }

    [Fact]
    public void Default_HasBallAndPaddle()
    {
        var state = new GameState();

        Assert.NotNull(state.Ball);
        Assert.NotNull(state.Paddle);
    }

    [Fact]
    public void AllBricksCleared_WithNoBricks_ReturnsTrue()
    {
        var state = new GameState();

        Assert.True(state.AllBricksCleared);
    }

    [Fact]
    public void AllBricksCleared_WithActiveBrick_ReturnsFalse()
    {
        var state = new GameState();
        state.Bricks.Add(Brick.Create(BrickColor.Green, 0, 0));

        Assert.False(state.AllBricksCleared);
    }

    [Fact]
    public void AllBricksCleared_WithAllDestroyedBricks_ReturnsTrue()
    {
        var state = new GameState();
        var brick = Brick.Create(BrickColor.Green, 0, 0);
        brick.Hit();
        state.Bricks.Add(brick);

        Assert.True(state.AllBricksCleared);
    }

    [Fact]
    public void AllBricksCleared_WithMixedBricks_ReturnsFalse()
    {
        var state = new GameState();
        var destroyed = Brick.Create(BrickColor.Green, 0, 0);
        destroyed.Hit();
        state.Bricks.Add(destroyed);
        state.Bricks.Add(Brick.Create(BrickColor.Yellow, 100, 0));

        Assert.False(state.AllBricksCleared);
    }

    [Fact]
    public void StartingLives_IsThree()
    {
        Assert.Equal(3, GameConstants.StartingLives);
    }
}
