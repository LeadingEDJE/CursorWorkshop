namespace BreakoutGame.Models;

public record InputState(
    bool LeftPressed,
    bool RightPressed,
    bool SpacePressed,
    bool SpaceJustPressed)
{
    public static readonly InputState Empty = new(false, false, false, false);
}
