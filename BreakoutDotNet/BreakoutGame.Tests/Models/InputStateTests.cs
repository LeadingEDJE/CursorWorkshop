namespace BreakoutGame.Tests.Models;

public class InputStateTests
{
    [Fact]
    public void Empty_HasNoKeysPressed()
    {
        var input = InputState.Empty;

        Assert.False(input.LeftPressed);
        Assert.False(input.RightPressed);
        Assert.False(input.SpacePressed);
        Assert.False(input.SpaceJustPressed);
    }

    [Fact]
    public void CanCreateWithSpecificValues()
    {
        var input = new InputState(
            LeftPressed: true,
            RightPressed: false,
            SpacePressed: true,
            SpaceJustPressed: false);

        Assert.True(input.LeftPressed);
        Assert.False(input.RightPressed);
        Assert.True(input.SpacePressed);
        Assert.False(input.SpaceJustPressed);
    }

    [Fact]
    public void RecordEquality_SameValues_AreEqual()
    {
        var a = new InputState(true, false, true, false);
        var b = new InputState(true, false, true, false);

        Assert.Equal(a, b);
    }

    [Fact]
    public void RecordEquality_DifferentValues_AreNotEqual()
    {
        var a = new InputState(true, false, false, false);
        var b = new InputState(false, false, false, false);

        Assert.NotEqual(a, b);
    }
}
