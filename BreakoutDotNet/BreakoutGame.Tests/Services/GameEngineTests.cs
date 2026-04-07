namespace BreakoutGame.Tests.Services;

public class GameEngineTests
{
    private static InputState NoInput  => InputState.Empty;
    private static InputState SpacePress => new(false, false, true, true);
    private static InputState LeftHeld  => new(true, false, false, false);
    private static InputState RightHeld => new(false, true, false, false);

    private static GameEngine CreateEngine()
    {
        var engine = new GameEngine();
        engine.Initialize();
        return engine;
    }

    private static GameEngine StartPlaying()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress); // Title -> ReadyToLaunch
        engine.Update(0, SpacePress); // ReadyToLaunch -> Playing
        return engine;
    }

    // ── Initialization ────────────────────────────────────────────────────────

    [Fact]
    public void Initialize_SetsStatusToTitle()
    {
        var engine = CreateEngine();
        Assert.Equal(GameStatus.Title, engine.State.Status);
    }

    [Fact]
    public void Initialize_SetsDefaultLives()
    {
        var engine = CreateEngine();
        Assert.Equal(GameConstants.StartingLives, engine.State.Lives);
    }

    [Fact]
    public void Initialize_SetsScoreToZero()
    {
        var engine = CreateEngine();
        Assert.Equal(0, engine.State.Score);
    }

    // ── State machine: Title ──────────────────────────────────────────────────

    [Fact]
    public void Title_SpacePressed_TransitionsToReadyToLaunch()
    {
        var engine = CreateEngine();

        engine.Update(0, SpacePress);

        Assert.Equal(GameStatus.ReadyToLaunch, engine.State.Status);
    }

    [Fact]
    public void Title_SpaceNotPressed_RemainsTitle()
    {
        var engine = CreateEngine();

        engine.Update(0.016, NoInput);

        Assert.Equal(GameStatus.Title, engine.State.Status);
    }

    [Fact]
    public void Title_ToReadyToLaunch_LoadsBricksForLevel1()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress);

        Assert.Equal(1, engine.State.Level);
        Assert.NotEmpty(engine.State.Bricks);
    }

    // ── State machine: ReadyToLaunch ──────────────────────────────────────────

    [Fact]
    public void ReadyToLaunch_SpacePressed_TransitionsToPlaying()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress); // -> ReadyToLaunch

        engine.Update(0, SpacePress); // -> Playing

        Assert.Equal(GameStatus.Playing, engine.State.Status);
    }

    [Fact]
    public void ReadyToLaunch_BallHasNoVelocity()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress);

        Assert.Equal(0, engine.State.Ball.VelocityX);
        Assert.Equal(0, engine.State.Ball.VelocityY);
    }

    [Fact]
    public void ReadyToLaunch_BallSitsOnPaddle()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress);

        var ball = engine.State.Ball;
        var paddle = engine.State.Paddle;
        Assert.Equal(paddle.CenterX, ball.X, precision: 5);
        Assert.Equal(paddle.Y - ball.Radius, ball.Y, precision: 5);
    }

    // ── State machine: Playing -> LifeLost ────────────────────────────────────

    [Fact]
    public void Playing_BallBelowCanvas_TransitionsToLifeLost()
    {
        var engine = StartPlaying();
        engine.State.Ball.Y = GameConstants.CanvasHeight + 50; // well below

        engine.Update(0.016, NoInput);

        Assert.Equal(GameStatus.LifeLost, engine.State.Status);
    }

    [Fact]
    public void Playing_BallBelowCanvas_DecrementsLives()
    {
        var engine = StartPlaying();
        engine.State.Ball.Y = GameConstants.CanvasHeight + 50;

        engine.Update(0.016, NoInput);

        Assert.Equal(GameConstants.StartingLives - 1, engine.State.Lives);
    }

    [Fact]
    public void LifeLost_AfterDelay_TransitionsToReadyToLaunch()
    {
        var engine = StartPlaying();
        engine.State.Ball.Y = GameConstants.CanvasHeight + 50;
        engine.Update(0.016, NoInput); // -> LifeLost

        engine.Update(GameConstants.LifeLostDelay + 0.1, NoInput); // skip past delay

        Assert.Equal(GameStatus.ReadyToLaunch, engine.State.Status);
    }

    [Fact]
    public void LifeLost_ZeroLives_TransitionsToGameOver()
    {
        var engine = StartPlaying();
        engine.State.Lives = 1; // last life
        engine.State.Ball.Y = GameConstants.CanvasHeight + 50;

        engine.Update(0.016, NoInput);

        Assert.Equal(GameStatus.GameOver, engine.State.Status);
    }

    // ── State machine: Playing -> LevelComplete ───────────────────────────────

    [Fact]
    public void Playing_AllBricksDestroyed_TransitionsToLevelComplete()
    {
        var engine = StartPlaying();
        foreach (var brick in engine.State.Bricks)
            brick.Hit(); // destroy all with one hit (green bricks)

        engine.Update(0.016, NoInput);

        Assert.Equal(GameStatus.LevelComplete, engine.State.Status);
    }

    [Fact]
    public void LevelComplete_AfterDelay_AdvancesLevel()
    {
        var engine = StartPlaying();
        foreach (var brick in engine.State.Bricks)
            brick.Hit();
        engine.Update(0.016, NoInput); // -> LevelComplete

        engine.Update(GameConstants.LevelCompleteDelay + 0.1, NoInput); // skip delay

        Assert.Equal(2, engine.State.Level);
        Assert.Equal(GameStatus.ReadyToLaunch, engine.State.Status);
    }

    [Fact]
    public void LevelComplete_AfterDelay_LoadsNewBricks()
    {
        var engine = StartPlaying();
        foreach (var brick in engine.State.Bricks)
            brick.Hit();
        engine.Update(0.016, NoInput);

        engine.Update(GameConstants.LevelCompleteDelay + 0.1, NoInput);

        Assert.NotEmpty(engine.State.Bricks);
        Assert.All(engine.State.Bricks, b => Assert.False(b.IsDestroyed));
    }

    // ── State machine: GameOver -> Title ──────────────────────────────────────

    [Fact]
    public void GameOver_SpacePressed_TransitionsToTitle()
    {
        var engine = StartPlaying();
        engine.State.Lives = 0;
        engine.State.Status = GameStatus.GameOver;

        engine.Update(0, SpacePress);

        Assert.Equal(GameStatus.Title, engine.State.Status);
    }

    // ── Paddle movement ───────────────────────────────────────────────────────

    [Fact]
    public void Paddle_MovesLeft_WhenLeftHeld()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress); // ReadyToLaunch
        double initialX = engine.State.Paddle.X;

        engine.Update(0.1, LeftHeld);

        Assert.True(engine.State.Paddle.X < initialX);
    }

    [Fact]
    public void Paddle_MovesRight_WhenRightHeld()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress);
        double initialX = engine.State.Paddle.X;

        engine.Update(0.1, RightHeld);

        Assert.True(engine.State.Paddle.X > initialX);
    }

    [Fact]
    public void Paddle_ClampsToLeftEdge()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress);
        engine.State.Paddle.X = 5; // near left edge

        // Force past left edge
        engine.Update(0.1, LeftHeld); // moves left by 50px -> clamps to 0
        engine.Update(0.1, LeftHeld);

        Assert.Equal(0, engine.State.Paddle.X);
    }

    [Fact]
    public void Paddle_ClampsToRightEdge()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress);
        double maxX = GameConstants.CanvasWidth - engine.State.Paddle.Width;
        engine.State.Paddle.X = maxX - 5;

        engine.Update(0.1, RightHeld);
        engine.Update(0.1, RightHeld);

        Assert.Equal(maxX, engine.State.Paddle.X, precision: 5);
    }

    [Fact]
    public void Paddle_SpeedIsCorrect()
    {
        var engine = CreateEngine();
        engine.Update(0, SpacePress);
        engine.State.Paddle.X = 400; // center

        engine.Update(0.1, RightHeld);

        double expected = 400 + Paddle.DefaultSpeed * 0.1;
        Assert.Equal(expected, engine.State.Paddle.X, precision: 5);
    }

    // ── Ball physics ──────────────────────────────────────────────────────────

    [Fact]
    public void Ball_ReflectsOffLeftWall()
    {
        var engine = StartPlaying();
        var ball = engine.State.Ball;
        ball.X = 10;
        ball.VelocityX = -200;
        ball.VelocityY = -200;

        engine.Update(0.016, NoInput);

        Assert.True(ball.VelocityX > 0, "Ball should bounce rightward off left wall");
        Assert.True(ball.X >= ball.Radius, "Ball should not be embedded in left wall");
    }

    [Fact]
    public void Ball_ReflectsOffRightWall()
    {
        var engine = StartPlaying();
        var ball = engine.State.Ball;
        ball.X = GameConstants.CanvasWidth - 10;
        ball.VelocityX = 200;
        ball.VelocityY = -200;

        engine.Update(0.016, NoInput);

        Assert.True(ball.VelocityX < 0, "Ball should bounce leftward off right wall");
    }

    [Fact]
    public void Ball_ReflectsOffTopWall()
    {
        var engine = StartPlaying();
        var ball = engine.State.Ball;
        ball.X = 400;
        ball.Y = 5;
        ball.VelocityX = 0;
        ball.VelocityY = -200;

        engine.Update(0.016, NoInput);

        Assert.True(ball.VelocityY > 0, "Ball should bounce downward off top wall");
    }

    [Fact]
    public void Ball_DoesNotPassThroughLeftWall()
    {
        var engine = StartPlaying();
        var ball = engine.State.Ball;
        ball.X = 2;
        ball.VelocityX = -500;
        ball.VelocityY = 0;

        engine.Update(0.016, NoInput);

        Assert.True(ball.X >= ball.Radius);
    }

    [Fact]
    public void DeltaTime_CappedAt50ms()
    {
        var engine = StartPlaying();
        var ball = engine.State.Ball;
        ball.X = 400;
        ball.Y = 300;
        double vy = -300;
        ball.VelocityX = 0;
        ball.VelocityY = vy;

        engine.Update(1.0, NoInput); // 1 second — should be capped to 50ms

        // With 50ms cap: ball moves vy * 0.05 = -15 px max (ignoring wall bounces)
        // Without cap: ball moves vy * 1.0 = -300 px
        // We just verify it didn't teleport far
        Assert.True(Math.Abs(ball.Y - 300) < 200,
            "Delta time should be capped; ball should not have teleported across the canvas");
    }

    // ── Render commands ───────────────────────────────────────────────────────

    [Fact]
    public void GetRenderCommands_ReturnsNonEmptyList()
    {
        var engine = CreateEngine();
        var cmds = engine.GetRenderCommands();

        Assert.NotEmpty(cmds);
    }

    [Fact]
    public void GetRenderCommands_FirstCommandIsClear()
    {
        var engine = CreateEngine();
        var cmds = engine.GetRenderCommands();

        Assert.IsType<ClearCanvasCommand>(cmds[0]);
    }

    [Fact]
    public void GetRenderCommands_PlayingState_IncludesBricks()
    {
        var engine = StartPlaying();
        var cmds = engine.GetRenderCommands();

        Assert.Contains(cmds, c => c is DrawRectCommand);
    }
}
