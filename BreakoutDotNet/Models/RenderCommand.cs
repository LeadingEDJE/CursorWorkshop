using System.Text.Json.Serialization;

namespace BreakoutGame.Models;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(ClearCanvasCommand), "clear")]
[JsonDerivedType(typeof(DrawRectCommand), "rect")]
[JsonDerivedType(typeof(DrawGradientRectCommand), "gradientRect")]
[JsonDerivedType(typeof(DrawCircleCommand), "circle")]
[JsonDerivedType(typeof(DrawTextCommand), "text")]
[JsonDerivedType(typeof(DrawParticleCommand), "particle")]
[JsonDerivedType(typeof(DrawOverlayCommand), "overlay")]
public abstract record RenderCommand;

public record ClearCanvasCommand : RenderCommand;

public record DrawRectCommand(
    double X,
    double Y,
    double Width,
    double Height,
    string Color,
    double CornerRadius = 0,
    string? GlowColor = null,
    double GlowBlur = 0,
    double Alpha = 1.0
) : RenderCommand;

public record DrawGradientRectCommand(
    double X,
    double Y,
    double Width,
    double Height,
    string Color1,
    string Color2,
    double CornerRadius = 0,
    string? GlowColor = null,
    double GlowBlur = 0
) : RenderCommand;

public record DrawCircleCommand(
    double X,
    double Y,
    double Radius,
    string Color,
    string? GlowColor = null,
    double GlowBlur = 0
) : RenderCommand;

public record DrawTextCommand(
    double X,
    double Y,
    string Text,
    string Font,
    string Color,
    string Align = "left",
    string Baseline = "top",
    string? ShadowColor = null,
    double ShadowBlur = 4
) : RenderCommand;

public record DrawParticleCommand(
    double X,
    double Y,
    double Radius,
    string Color,
    double Alpha
) : RenderCommand;

/// <summary>Semi-transparent full-canvas overlay for game-over / level-complete effects.</summary>
public record DrawOverlayCommand(
    string Color,
    double Alpha
) : RenderCommand;
