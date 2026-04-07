using BreakoutGame.Models;

namespace BreakoutGame.Services;

/// <summary>
/// Core game loop: owns all game state, drives physics, handles collisions, and manages the state machine.
/// JavaScript is only responsible for rendering output from <see cref="GetRenderCommands"/>.
/// </summary>
public class GameEngine
{
    private GameState _state = new();
    private static readonly Random _rng = new();

    public GameState State => _state;

    // ── Initialization ────────────────────────────────────────────────────────

    public void Initialize()
    {
        _state = new GameState();
        ResetPaddle();
        ResetBallOnPaddle();
    }

    // ── Main update tick ──────────────────────────────────────────────────────

    /// <summary>
    /// Advances the simulation by <paramref name="deltaTime"/> seconds.
    /// Delta time is capped at 50 ms to prevent tunneling after tab-away.
    /// </summary>
    public void Update(double deltaTime, InputState input)
    {
        // Note: the 50ms cap is applied inside UpdateBall only (prevents tunneling).
        // State timers and paddle movement use the full deltaTime.
        _state.StateElapsed += deltaTime;

        switch (_state.Status)
        {
            case GameStatus.Title:
                HandleTitleState(input);
                break;

            case GameStatus.ReadyToLaunch:
                UpdatePaddle(deltaTime, input);
                KeepBallOnPaddle();
                if (input.SpaceJustPressed)
                    LaunchBall();
                break;

            case GameStatus.Playing:
                UpdatePaddle(deltaTime, input);
                UpdateBall(deltaTime);
                UpdateParticles(deltaTime);
                UpdateEffectTimers(deltaTime);
                CheckBallLost();
                CheckLevelComplete();
                break;

            case GameStatus.LifeLost:
                _state.StateTimer -= deltaTime;
                if (_state.StateTimer <= 0)
                    TransitionAfterLifeLost();
                break;

            case GameStatus.LevelComplete:
                _state.StateTimer -= deltaTime;
                if (_state.StateTimer <= 0)
                    AdvanceToNextLevel();
                break;

            case GameStatus.GameOver:
                if (input.SpaceJustPressed)
                {
                    Initialize();
                    _state.Status = GameStatus.Title;
                    _state.StateElapsed = 0;
                }
                break;
        }
    }

    // ── State machine transitions ─────────────────────────────────────────────

    private void EnterState(GameStatus status)
    {
        _state.Status = status;
        _state.StateElapsed = 0;
    }

    private void HandleTitleState(InputState input)
    {
        if (input.SpaceJustPressed)
        {
            _state.Level = 1;
            _state.Score = 0;
            _state.Lives = GameConstants.StartingLives;
            _state.Bricks = LevelService.BuildBricks(_state.Level);
            ResetPaddle();
            ResetBallOnPaddle();
            EnterState(GameStatus.ReadyToLaunch);
        }
    }

    private void LaunchBall()
    {
        double speed = GameConstants.InitialBallSpeed *
                       Math.Pow(1 + GameConstants.BallSpeedIncreasePerLevel, _state.Level - 1);

        // Randomize angle: -30° to +30° from straight up
        double angleOffsetDeg = (_rng.NextDouble() * 60) - 30;
        double angleRad = (angleOffsetDeg * Math.PI) / 180.0;

        _state.Ball.VelocityX = speed * Math.Sin(angleRad);
        _state.Ball.VelocityY = -Math.Sqrt(speed * speed - _state.Ball.VelocityX * _state.Ball.VelocityX);
        EnterState(GameStatus.Playing);
    }

    private void CheckBallLost()
    {
        if (_state.Ball.Y - _state.Ball.Radius > GameConstants.CanvasHeight)
        {
            _state.Lives--;
            _state.StateTimer = GameConstants.LifeLostDelay;
            EnterState(_state.Lives <= 0 ? GameStatus.GameOver : GameStatus.LifeLost);
        }
    }

    private void CheckLevelComplete()
    {
        if (_state.AllBricksCleared && _state.Status == GameStatus.Playing)
        {
            _state.StateTimer = GameConstants.LevelCompleteDelay;
            _state.Ball.VelocityX = 0;
            _state.Ball.VelocityY = 0;
            EnterState(GameStatus.LevelComplete);
        }
    }

    private void TransitionAfterLifeLost()
    {
        ResetPaddle();
        ResetBallOnPaddle();
        EnterState(GameStatus.ReadyToLaunch);
    }

    private void AdvanceToNextLevel()
    {
        _state.Level++;
        _state.Bricks = LevelService.BuildBricks(_state.Level);
        _state.Particles.Clear();
        ResetPaddle();
        ResetBallOnPaddle();
        EnterState(GameStatus.ReadyToLaunch);
    }

    // ── Paddle movement ───────────────────────────────────────────────────────

    private void UpdatePaddle(double dt, InputState input)
    {
        var paddle = _state.Paddle;
        if (input.LeftPressed)
            paddle.X -= paddle.Speed * dt;
        if (input.RightPressed)
            paddle.X += paddle.Speed * dt;

        // Clamp to canvas edges
        paddle.X = Math.Clamp(paddle.X, 0, GameConstants.CanvasWidth - paddle.Width);
    }

    private void ResetPaddle()
    {
        _state.Paddle.Width = Paddle.DefaultWidth;
        _state.Paddle.Height = Paddle.DefaultHeight;
        _state.Paddle.Speed = Paddle.DefaultSpeed;
        _state.Paddle.X = (GameConstants.CanvasWidth - Paddle.DefaultWidth) / 2.0;
        _state.Paddle.Y = GameConstants.CanvasHeight - GameConstants.PaddleBottomOffset - Paddle.DefaultHeight;
    }

    private void KeepBallOnPaddle()
    {
        var ball = _state.Ball;
        var paddle = _state.Paddle;
        ball.X = paddle.CenterX;
        ball.Y = paddle.Y - ball.Radius;
    }

    private void ResetBallOnPaddle()
    {
        _state.Ball.Radius = Ball.DefaultRadius;
        _state.Ball.VelocityX = 0;
        _state.Ball.VelocityY = 0;
        KeepBallOnPaddle();
    }

    // ── Ball physics ──────────────────────────────────────────────────────────

    private void UpdateBall(double dt)
    {
        dt = Math.Min(dt, GameConstants.MaxDeltaTime); // cap only here to prevent tunneling
        var ball = _state.Ball;
        ball.X += ball.VelocityX * dt;
        ball.Y += ball.VelocityY * dt;

        ResolveWallCollisions(ball);
        ResolvePaddleCollision(ball);
        ResolveBrickCollisions(ball);
    }

    private void ResolveWallCollisions(Ball ball)
    {
        bool bounced = false;

        // Left wall
        if (ball.X - ball.Radius < 0)
        {
            ball.X = ball.Radius;
            ball.VelocityX = Math.Abs(ball.VelocityX);
            bounced = true;
        }
        // Right wall
        else if (ball.X + ball.Radius > GameConstants.CanvasWidth)
        {
            ball.X = GameConstants.CanvasWidth - ball.Radius;
            ball.VelocityX = -Math.Abs(ball.VelocityX);
            bounced = true;
        }

        // Top wall
        if (ball.Y - ball.Radius < 0)
        {
            ball.Y = ball.Radius;
            ball.VelocityY = Math.Abs(ball.VelocityY);
            bounced = true;
        }

        if (bounced)
            _state.WallFlashTimer = 0.1;
    }

    private void ResolvePaddleCollision(Ball ball)
    {
        var paddle = _state.Paddle;
        var result = CollisionService.CircleVsRect(
            ball.X, ball.Y, ball.Radius,
            paddle.X, paddle.Y, paddle.Width, paddle.Height);

        if (!result.Collided) return;

        // Variable angle based on where ball hits paddle (spec: ±60° from vertical at edges)
        double hitPos = (ball.X - paddle.X) / paddle.Width; // 0=left edge, 1=right edge
        double normalizedHit = hitPos * 2 - 1;              // -1 to +1
        double maxAngleDeg = 60.0;
        double angleDeg = normalizedHit * maxAngleDeg;
        double angleRad = angleDeg * Math.PI / 180.0;

        double speed = ball.Speed;
        ball.VelocityX = speed * Math.Sin(angleRad);
        ball.VelocityY = -Math.Abs(speed * Math.Cos(angleRad)); // always goes up

        // Push ball above paddle to prevent sticking
        ball.Y = paddle.Y - ball.Radius;

        _state.PaddleFlashTimer = 0.15;
    }

    private void ResolveBrickCollisions(Ball ball)
    {
        foreach (var brick in _state.Bricks)
        {
            if (brick.IsDestroyed) continue;

            var result = CollisionService.CircleVsRect(
                ball.X, ball.Y, ball.Radius,
                brick.X, brick.Y, brick.Width, brick.Height);

            if (!result.Collided) continue;

            // Reflect ball off the face that was hit
            (ball.VelocityX, ball.VelocityY) = CollisionService.Reflect(
                ball.VelocityX, ball.VelocityY,
                result.NormalX, result.NormalY);

            bool destroyed = ScoringService.ProcessHit(brick, _state);
            if (destroyed)
                SpawnParticles(brick);

            // Only resolve one brick per frame to avoid tunneling
            break;
        }
    }

    // ── Particles ─────────────────────────────────────────────────────────────

    private void SpawnParticles(Brick brick)
    {
        string color = brick.Color switch
        {
            BrickColor.Green  => "#4caf50",
            BrickColor.Yellow => "#ffeb3b",
            BrickColor.Orange => "#ff9800",
            BrickColor.Red    => "#f44336",
            BrickColor.Purple => "#9c27b0",
            BrickColor.Silver => "#90a4ae",
            _ => "#ffffff"
        };

        int count = _rng.Next(4, 9); // 4-8 particles
        double cx = brick.X + brick.Width / 2;
        double cy = brick.Y + brick.Height / 2;

        // Brief white flash (large, short-lived particle that quickly fades)
        _state.Particles.Add(new Particle
        {
            X = cx, Y = cy,
            VelocityX = 0, VelocityY = 0,
            Life = 0.12, MaxLife = 0.12,
            Color = "#ffffff",
            Radius = 18.0
        });

        // Colored debris particles
        for (int i = 0; i < count; i++)
        {
            double angle = _rng.NextDouble() * Math.PI * 2;
            double speed = 60 + _rng.NextDouble() * 120;
            _state.Particles.Add(new Particle
            {
                X = cx,
                Y = cy,
                VelocityX = Math.Cos(angle) * speed,
                VelocityY = Math.Sin(angle) * speed,
                Life = 0.3,
                MaxLife = 0.3,
                Color = color,
                Radius = 2 + _rng.NextDouble() * 2
            });
        }
    }

    private void UpdateParticles(double dt)
    {
        foreach (var p in _state.Particles)
            p.Update(dt);
        _state.Particles.RemoveAll(p => p.IsDead);
    }

    private void UpdateEffectTimers(double dt)
    {
        _state.WallFlashTimer = Math.Max(0, _state.WallFlashTimer - dt);
        _state.PaddleFlashTimer = Math.Max(0, _state.PaddleFlashTimer - dt);
    }

    // ── Render commands ───────────────────────────────────────────────────────

    /// <summary>
    /// Produces a list of draw commands representing the current frame.
    /// JavaScript executes these commands against the HTML5 canvas.
    /// </summary>
    public List<RenderCommand> GetRenderCommands()
    {
        var cmds = new List<RenderCommand>();
        cmds.Add(new ClearCanvasCommand());

        // Dark gradient background
        cmds.Add(new DrawGradientRectCommand(
            0, 0, GameConstants.CanvasWidth, GameConstants.CanvasHeight,
            "#0d0d1a", "#1a1a2e", 0));

        switch (_state.Status)
        {
            case GameStatus.Title:
                AddTitleCommands(cmds);
                break;

            case GameStatus.ReadyToLaunch:
                AddGameplayCommands(cmds);
                AddReadyToLaunchHint(cmds);
                break;

            case GameStatus.Playing:
            case GameStatus.LifeLost:
                AddGameplayCommands(cmds);
                if (_state.Status == GameStatus.LifeLost)
                    AddLifeLostOverlay(cmds);
                break;

            case GameStatus.LevelComplete:
                AddGameplayCommands(cmds);
                AddLevelCompleteOverlay(cmds);
                break;

            case GameStatus.GameOver:
                AddGameplayCommands(cmds);
                AddGameOverOverlay(cmds);
                break;
        }

        return cmds;
    }

    private void AddGameplayCommands(List<RenderCommand> cmds)
    {
        AddHud(cmds);
        AddBricks(cmds);
        AddPaddle(cmds);
        AddBall(cmds);
        AddParticles(cmds);

        if (_state.WallFlashTimer > 0)
            cmds.Add(new DrawOverlayCommand("#ffffff", _state.WallFlashTimer / 0.1 * 0.15));
    }

    private void AddHud(List<RenderCommand> cmds)
    {
        string font = "bold 18px 'Segoe UI', sans-serif";

        // Lives: upper-left
        cmds.Add(new DrawTextCommand(
            14, 10, $"Lives: {_state.Lives}", font, "#ffffff",
            "left", "top", "#000000", 4));

        // Score: upper-right
        cmds.Add(new DrawTextCommand(
            GameConstants.CanvasWidth - 14, 10,
            $"Score: {_state.Score:D5}", font, "#ffffff",
            "right", "top", "#000000", 4));

        // Level: upper-center
        cmds.Add(new DrawTextCommand(
            GameConstants.CanvasWidth / 2, 10,
            $"Level {_state.Level}", font, "#aaaaff",
            "center", "top", "#000000", 4));
    }

    private void AddBricks(List<RenderCommand> cmds)
    {
        foreach (var brick in _state.Bricks)
        {
            if (brick.IsDestroyed) continue;

            var (fillColor, glowColor) = GetBrickColors(brick);
            double alpha = 1.0 - brick.DamageRatio * 0.4; // dims as damaged

            cmds.Add(new DrawRectCommand(
                brick.X, brick.Y, brick.Width, brick.Height,
                fillColor, 3, glowColor, 6, alpha));
        }
    }

    private static (string fill, string glow) GetBrickColors(Brick brick)
    {
        return brick.Color switch
        {
            BrickColor.Green  => ("#4caf50", "#81c784"),
            BrickColor.Yellow => ("#ffeb3b", "#fff176"),
            BrickColor.Orange => ("#ff9800", "#ffb74d"),
            BrickColor.Red    => ("#f44336", "#ef9a9a"),
            BrickColor.Purple => ("#9c27b0", "#ce93d8"),
            BrickColor.Silver => ("#90a4ae", "#cfd8dc"),
            _ => ("#ffffff", "#ffffff")
        };
    }

    private void AddPaddle(List<RenderCommand> cmds)
    {
        var paddle = _state.Paddle;
        string glow = _state.PaddleFlashTimer > 0 ? "#ffffff" : "#00e5ff";
        double glowBlur = _state.PaddleFlashTimer > 0 ? 20 : 10;

        cmds.Add(new DrawGradientRectCommand(
            paddle.X, paddle.Y, paddle.Width, paddle.Height,
            "#00bcd4", "#0097a7", 7, glow, glowBlur));
    }

    private void AddBall(List<RenderCommand> cmds)
    {
        var ball = _state.Ball;
        cmds.Add(new DrawCircleCommand(
            ball.X, ball.Y, ball.Radius,
            "#ffffff", "#e0f7fa", 12));
    }

    private void AddParticles(List<RenderCommand> cmds)
    {
        foreach (var p in _state.Particles)
        {
            cmds.Add(new DrawParticleCommand(p.X, p.Y, p.Radius, p.Color, p.Alpha));
        }
    }

    private void AddReadyToLaunchHint(List<RenderCommand> cmds)
    {
        double cx = GameConstants.CanvasWidth / 2;
        double cy = GameConstants.CanvasHeight - 20;
        double pulse = 0.6 + 0.4 * Math.Abs(Math.Sin(_state.StateElapsed * 3.0));

        cmds.Add(new DrawTextCommand(cx, cy,
            "Press Space to Launch",
            "bold 18px 'Segoe UI', sans-serif",
            $"rgba(0,229,255,{pulse:F2})",
            "center", "bottom", "#000033", 6));
    }

    private void AddTitleCommands(List<RenderCommand> cmds)
    {
        double cx = GameConstants.CanvasWidth / 2;
        double cy = GameConstants.CanvasHeight / 2;

        // Title fades in over 0.5s
        double titleAlpha = Math.Min(1.0, _state.StateElapsed / 0.5);
        cmds.Add(new DrawTextCommand(cx, cy - 70, "BREAKOUT",
            "bold 72px 'Segoe UI', sans-serif",
            $"rgba(0,229,255,{titleAlpha:F2})",
            "center", "middle", "#001a33", 20 * titleAlpha));

        // Pulsing "Press Space" hint appears after 0.4s
        if (_state.StateElapsed > 0.4)
        {
            double pulse = 0.6 + 0.4 * Math.Abs(Math.Sin(_state.StateElapsed * 2.5));
            cmds.Add(new DrawTextCommand(cx, cy + 20, "Press Space to Start",
                "bold 22px 'Segoe UI', sans-serif",
                $"rgba(255,255,255,{pulse:F2})",
                "center", "middle", "#000000", 6));
        }
    }

    private void AddLevelCompleteOverlay(List<RenderCommand> cmds)
    {
        // Overlay fades in quickly
        double overlayAlpha = Math.Min(0.6, _state.StateElapsed * 3);
        cmds.Add(new DrawOverlayCommand("#000033", overlayAlpha));

        double cx = GameConstants.CanvasWidth / 2;
        double cy = GameConstants.CanvasHeight / 2;

        // Text scales in (ease-out) over first 400ms
        double animT = Math.Min(1.0, _state.StateElapsed / 0.4);
        // Ease-out: t^(1/3)
        double scale = Math.Pow(animT, 1.0 / 3.0);
        int fontSize = Math.Max(1, (int)(48 * scale));

        cmds.Add(new DrawTextCommand(cx, cy - 30, "LEVEL COMPLETE!",
            $"bold {fontSize}px 'Segoe UI', sans-serif", "#00e5ff",
            "center", "middle", "#001a33", 12 * scale));

        if (_state.StateElapsed > 0.3)
        {
            double scoreAlpha = Math.Min(1.0, (_state.StateElapsed - 0.3) / 0.2);
            cmds.Add(new DrawTextCommand(cx, cy + 30,
                $"Score: {_state.Score:D5}",
                "bold 24px 'Segoe UI', sans-serif",
                $"rgba(255,255,255,{scoreAlpha:F2})",
                "center", "middle", "#000000", 6));
        }
    }

    private void AddLifeLostOverlay(List<RenderCommand> cmds)
    {
        double alpha = Math.Min(0.5, _state.StateElapsed * 4);
        cmds.Add(new DrawOverlayCommand("#330000", alpha));

        double cx = GameConstants.CanvasWidth / 2;
        double cy = GameConstants.CanvasHeight / 2;

        if (_state.StateElapsed > 0.1 && _state.Lives > 0)
        {
            cmds.Add(new DrawTextCommand(cx, cy,
                $"Lives remaining: {_state.Lives}",
                "bold 28px 'Segoe UI', sans-serif", "#ff6666",
                "center", "middle", "#000000", 8));
        }
    }

    private void AddGameOverOverlay(List<RenderCommand> cmds)
    {
        // Fade in tint over 0.6s
        double tintAlpha = Math.Min(0.8, _state.StateElapsed / 0.6 * 0.8);
        cmds.Add(new DrawOverlayCommand("#200000", tintAlpha));

        double cx = GameConstants.CanvasWidth / 2;
        double cy = GameConstants.CanvasHeight / 2;

        // "GAME OVER" appears after 0.2s, fades in over 0.4s
        if (_state.StateElapsed > 0.2)
        {
            double headlineAlpha = Math.Min(1.0, (_state.StateElapsed - 0.2) / 0.4);
            cmds.Add(new DrawTextCommand(cx, cy - 50, "GAME OVER",
                "bold 64px 'Segoe UI', sans-serif",
                $"rgba(255,51,51,{headlineAlpha:F2})",
                "center", "middle", "#000000", 16 * headlineAlpha));
        }

        // Score appears after 0.5s
        if (_state.StateElapsed > 0.5)
        {
            double scoreAlpha = Math.Min(1.0, (_state.StateElapsed - 0.5) / 0.3);
            cmds.Add(new DrawTextCommand(cx, cy + 20,
                $"Final Score: {_state.Score:D5}",
                "bold 24px 'Segoe UI', sans-serif",
                $"rgba(255,255,255,{scoreAlpha:F2})",
                "center", "middle", "#000000", 6));
        }

        // "Press Space" prompt appears after 1s
        if (_state.StateElapsed > 1.0)
        {
            double pulse = 0.6 + 0.4 * Math.Abs(Math.Sin(_state.StateElapsed * 2.0));
            cmds.Add(new DrawTextCommand(cx, cy + 65, "Press Space to Restart",
                "bold 20px 'Segoe UI', sans-serif",
                $"rgba(170,170,170,{pulse:F2})",
                "center", "middle", "#000000", 4));
        }
    }
}
