using Microsoft.JSInterop;

namespace BreakoutGame.Interop;

/// <summary>
/// Wraps IJSRuntime calls to the game.js ES module.
/// Manages the lifecycle of the canvas game loop.
/// </summary>
public sealed class GameInterop : IAsyncDisposable
{
    private readonly IJSRuntime _js;
    private IJSObjectReference? _module;

    public GameInterop(IJSRuntime js)
    {
        _js = js;
    }

    /// <summary>Imports the game.js ES module. Must be called after first render.</summary>
    public async Task InitializeAsync()
    {
        _module = await _js.InvokeAsync<IJSObjectReference>("import", "./js/game.js");
    }

    /// <summary>Sets up the canvas (HiDPI scaling) and starts the requestAnimationFrame loop.</summary>
    public async Task StartGameLoopAsync<T>(DotNetObjectReference<T> dotNetRef, string canvasId)
        where T : class
    {
        if (_module is null) throw new InvalidOperationException("Call InitializeAsync first.");
        await _module.InvokeVoidAsync("startLoop", canvasId, dotNetRef);
    }

    /// <summary>Cancels the requestAnimationFrame loop.</summary>
    public async Task StopGameLoopAsync()
    {
        if (_module is null) return;
        await _module.InvokeVoidAsync("stopLoop");
    }

    public async ValueTask DisposeAsync()
    {
        if (_module is not null)
        {
            try { await _module.InvokeVoidAsync("stopLoop"); }
            catch (JSDisconnectedException) { } // expected when page is navigating away
            catch (TaskCanceledException) { }
            await _module.DisposeAsync();
        }
    }
}
