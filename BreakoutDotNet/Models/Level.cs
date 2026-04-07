namespace BreakoutGame.Models;

/// <summary>
/// Defines a level's brick layout. Null entries in the grid represent empty cells.
/// Grid is indexed as [row, column].
/// </summary>
public record Level(int LevelNumber, BrickColor?[,] Grid)
{
    public int Rows => Grid.GetLength(0);
    public int Columns => Grid.GetLength(1);
}
