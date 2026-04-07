using BreakoutGame.Models;

namespace BreakoutGame.Services;

/// <summary>
/// Builds brick layouts for each level. Level numbers cycle after 5 with increasing difficulty.
/// Grid entries use null for empty cells.
/// </summary>
public static class LevelService
{
    private static readonly BrickColor? N = null; // shorthand for null/empty

    // ── Level grid definitions (null = empty cell) ────────────────────────────

    private static readonly BrickColor?[,] Level1Grid = {
        // 3 rows of green and yellow — easy introduction
        { N, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, N },
        { BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green },
        { N, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, BrickColor.Green,  BrickColor.Yellow, N },
    };

    private static readonly BrickColor?[,] Level2Grid = {
        // 5 rows: introduces orange
        { BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow },
        { BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green  },
        { BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange },
        { BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green  },
        { BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow },
    };

    private static readonly BrickColor?[,] Level3Grid = {
        // 6 rows: chevron/diamond pattern using Green through Red
        { N,                 N,                 N,                 N,                 BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    N,                 N,                 N,                 N                 },
        { N,                 N,                 BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, N,                 N                 },
        { N,                 BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, N                 },
        { BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green  },
        { N,                 BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, N                 },
        { N,                 N,                 BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, N,                 N                 },
    };

    private static readonly BrickColor?[,] Level4Grid = {
        // 8 rows with purple bricks and pattern gaps
        { BrickColor.Purple, N,                 BrickColor.Red,    BrickColor.Red,    N,                 BrickColor.Purple, BrickColor.Purple, N,                 BrickColor.Red,    BrickColor.Red,    N,                 BrickColor.Purple },
        { BrickColor.Purple, BrickColor.Purple, BrickColor.Red,    BrickColor.Red,    BrickColor.Orange, BrickColor.Purple, BrickColor.Purple, BrickColor.Orange, BrickColor.Red,    BrickColor.Red,    BrickColor.Purple, BrickColor.Purple },
        { BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange },
        { BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow },
        { BrickColor.Green,  N,                 BrickColor.Green,  N,                 BrickColor.Green,  N,                 BrickColor.Green,  N,                 BrickColor.Green,  N,                 BrickColor.Green,  N                 },
        { N,                 BrickColor.Yellow, N,                 BrickColor.Yellow, N,                 BrickColor.Yellow, N,                 BrickColor.Yellow, N,                 BrickColor.Yellow, N,                 BrickColor.Yellow },
        { BrickColor.Orange, BrickColor.Orange, N,                 N,                 BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, N,                 N,                 BrickColor.Orange, BrickColor.Orange },
        { BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple },
    };

    private static readonly BrickColor?[,] Level5Grid = {
        // 8 rows: silver row at top, all colors featured densely
        { BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver, BrickColor.Silver },
        { BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple, BrickColor.Purple },
        { BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red,    BrickColor.Red    },
        { BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange, BrickColor.Orange },
        { BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow, BrickColor.Yellow },
        { BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green,  BrickColor.Green  },
        { BrickColor.Orange, BrickColor.Purple, BrickColor.Orange, BrickColor.Purple, BrickColor.Orange, BrickColor.Purple, BrickColor.Orange, BrickColor.Purple, BrickColor.Orange, BrickColor.Purple, BrickColor.Orange, BrickColor.Purple },
        { BrickColor.Red,    BrickColor.Silver, BrickColor.Red,    BrickColor.Silver, BrickColor.Red,    BrickColor.Silver, BrickColor.Red,    BrickColor.Silver, BrickColor.Red,    BrickColor.Silver, BrickColor.Red,    BrickColor.Silver },
    };

    // ── Public API ────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns the Level definition for the given level number.
    /// Levels > 5 cycle with the same patterns (level 6 = level 1, etc.).
    /// </summary>
    public static Level GetLevel(int levelNumber)
    {
        int cycle = ((levelNumber - 1) % 5) + 1;
        var grid = cycle switch
        {
            1 => Level1Grid,
            2 => Level2Grid,
            3 => Level3Grid,
            4 => Level4Grid,
            5 => Level5Grid,
            _ => Level1Grid
        };
        return new Level(levelNumber, grid);
    }

    /// <summary>
    /// Builds a flat list of Brick objects with world positions for the given level number.
    /// </summary>
    public static List<Brick> BuildBricks(int levelNumber)
    {
        var level = GetLevel(levelNumber);
        var bricks = new List<Brick>();

        for (int row = 0; row < level.Rows; row++)
        {
            for (int col = 0; col < level.Columns; col++)
            {
                var color = level.Grid[row, col];
                if (color is null) continue;

                double x = GameConstants.BrickLeftOffset + col * (GameConstants.BrickWidth + GameConstants.BrickGap);
                double y = GameConstants.BrickAreaTop + row * (GameConstants.BrickHeight + GameConstants.BrickGap);

                bricks.Add(Brick.Create(color.Value, x, y));
            }
        }

        return bricks;
    }
}
