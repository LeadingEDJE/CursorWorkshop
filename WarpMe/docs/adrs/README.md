# Architectural Decision Records (ADRs)

This directory contains Architectural Decision Records (ADRs) for the WarpMe Starship Simulator project.

## What are ADRs?

ADRs document important architectural decisions made during the project's development. Each ADR captures:
- **Context**: The situation and constraints that led to the decision
- **Decision**: What was decided
- **Consequences**: The positive and negative outcomes of the decision

## ADR Index

| ID | Title | Status |
|----|-------|--------|
| [0001](0001-use-vanilla-javascript.md) | Use Vanilla JavaScript Instead of a Framework | Accepted |
| [0002](0002-singleton-pattern-for-core-modules.md) | Use Singleton Pattern for Core Modules | Accepted |
| [0003](0003-fixed-timestep-simulation.md) | Implement Fixed Timestep Simulation Loop | Accepted |
| [0004](0004-event-driven-architecture.md) | Use Event-Driven Architecture for State Changes | Accepted |
| [0005](0005-canvas-rendering.md) | Use Canvas API for Rendering | Accepted |
| [0006](0006-native-es-modules.md) | Use Native ES Modules Without Build Step | Accepted |
| [0007](0007-procedural-audio.md) | Use Procedural Audio Generation | Accepted |
| [0008](0008-standardized-station-interface.md) | Standardize Station Interface Pattern | Accepted |
| [0009](0009-centralized-state-management.md) | Centralize State in Single GameState Object | Accepted |
| [0010](0010-homing-torpedo-behavior.md) | Implement Homing Torpedo Behavior | Accepted |
| [0011](0011-per-ship-command-waypoints.md) | Per-Ship Command Waypoints for Fleet Coordination | Accepted |
| [0012](0012-weapons-and-ordnance-system.md) | Weapons and Ordnance System Overview | Accepted |
| [0013](0013-nuke-ordnance-behavior.md) | Nuke Ordnance Behavior (Proximity Detonation and Splash Damage) | Accepted |
| [0014](0014-ship-status-visual-system.md) | Ship Status Visual System (Shields, Damage, Particles, Status Bars) | Accepted |
| [0015](0015-target-status-tactical-sidebar.md) | Target Status Display in Tactical Sidebar | Accepted |
| [0016](0016-helm-autopilot-system.md) | Helm Autopilot System | Accepted |

## Adding New ADRs

When making a significant architectural decision:

1. Create a new file: `00XX-short-title.md`
2. Use the template below
3. Update this README with the new ADR entry
4. Use sequential numbering

### ADR Template

```markdown
# ADR-XXXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[Describe the situation and constraints]

## Decision
[Describe the decision made]

## Consequences

### Positive
- [List positive outcomes]

### Negative
- [List negative outcomes]

### Mitigations
- [How we address the negatives]
```

## Status Definitions

- **Proposed**: Decision is under consideration
- **Accepted**: Decision has been made and implemented
- **Deprecated**: Decision is no longer in effect
- **Superseded**: Decision has been replaced by a newer ADR
