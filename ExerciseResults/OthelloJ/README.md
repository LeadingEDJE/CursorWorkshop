# OthelloJ

A Java Swing implementation of the classic Othello (Reversi) board game.

## How to Play

Othello is a two-player strategy game played on an 8×8 board:

1. **Black** (AI) moves first
2. **White** (You) goes second
3. Place a stone to **outflank** opponent pieces (surround them horizontally, vertically, or diagonally)
4. Flanked pieces flip to your color
5. If you can't make a legal move, your turn is skipped
6. The game ends when the board is full or neither player can move
7. **Most stones wins!**

## Running the Game

### Compile
```bash
javac Stone.java Board.java AIPlayer.java BoardPanel.java OthelloFrame.java Main.java
```

### Run
```bash
java Main
```

## Running Tests

The project includes JUnit 5 unit tests for the core game logic.

### Download JUnit (one-time setup)
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/1.10.0/junit-platform-console-standalone-1.10.0.jar" -OutFile "junit-platform-console-standalone.jar"

# Linux/Mac
curl -O https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/1.10.0/junit-platform-console-standalone-1.10.0.jar
```

### Compile tests
```bash
javac -cp ".;junit-platform-console-standalone.jar" BoardTest.java
```

### Run tests
```bash
java -jar junit-platform-console-standalone.jar -cp . --scan-class-path
```

## Project Structure

| File | Description |
|------|-------------|
| `Stone.java` | Enum representing board cell states (EMPTY, BLACK, WHITE) |
| `Board.java` | Core game logic, move validation, and piece flipping |
| `AIPlayer.java` | Beginner-friendly AI using greedy strategy |
| `BoardPanel.java` | Swing panel that renders the green game board |
| `OthelloFrame.java` | Main window with score display and game controls |
| `Main.java` | Application entry point |
| `BoardTest.java` | JUnit 5 unit tests for game logic |

## Features

- Clean green board with traditional grid markings
- Visual indicators for valid moves
- Live score tracking
- Turn indicator
- Beginner-friendly AI that prioritizes corners but adds randomness
- New Game button to restart


