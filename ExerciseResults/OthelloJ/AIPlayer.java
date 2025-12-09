import java.util.List;
import java.util.Random;

/**
 * AI player for Othello with a beginner-friendly difficulty level.
 * Uses a simple greedy strategy with corner preference.
 */
public class AIPlayer {
    
    private final Stone color;
    private final Random random;
    
    // Corner positions are the most valuable
    private static final int[][] CORNERS = {{0, 0}, {0, 7}, {7, 0}, {7, 7}};
    
    // Positions adjacent to corners are dangerous (can give opponent corner access)
    private static final int[][] DANGER_ZONES = {
        {0, 1}, {1, 0}, {1, 1},           // Near top-left corner
        {0, 6}, {1, 6}, {1, 7},           // Near top-right corner
        {6, 0}, {6, 1}, {7, 1},           // Near bottom-left corner
        {6, 6}, {6, 7}, {7, 6}            // Near bottom-right corner
    };

    /**
     * Creates a new AI player.
     * @param color the stone color this AI plays
     */
    public AIPlayer(Stone color) {
        this.color = color;
        this.random = new Random();
    }

    /**
     * Gets the color this AI plays.
     * @return the AI's stone color
     */
    public Stone getColor() {
        return color;
    }

    /**
     * Chooses the best move for the AI using a simple greedy strategy.
     * @param board the current board state
     * @return the chosen move as [row, col], or null if no valid moves
     */
    public int[] chooseMove(Board board) {
        List<int[]> validMoves = board.getValidMoves(color);
        
        if (validMoves.isEmpty()) {
            return null;
        }
        
        // Strategy 1: Always take a corner if available
        for (int[] move : validMoves) {
            if (isCorner(move[0], move[1])) {
                return move;
            }
        }
        
        // Strategy 2: Avoid danger zones unless they're the only option
        List<int[]> safeMoves = validMoves.stream()
            .filter(move -> !isDangerZone(move[0], move[1]))
            .toList();
        
        List<int[]> movesToConsider = safeMoves.isEmpty() ? validMoves : safeMoves;
        
        // Strategy 3: Among safe moves, prefer ones that flip more pieces
        // But add some randomness to keep it beginner-friendly
        int[] bestMove = null;
        int bestScore = -1;
        
        for (int[] move : movesToConsider) {
            int flips = board.getStonesToFlip(move[0], move[1], color).size();
            
            // Add some randomness: sometimes pick a slightly worse move
            int adjustedScore = flips + random.nextInt(3);
            
            if (adjustedScore > bestScore) {
                bestScore = adjustedScore;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    /**
     * Checks if a position is a corner.
     * @param row the row
     * @param col the column
     * @return true if it's a corner position
     */
    private boolean isCorner(int row, int col) {
        for (int[] corner : CORNERS) {
            if (corner[0] == row && corner[1] == col) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a position is in a danger zone (adjacent to a corner).
     * @param row the row
     * @param col the column
     * @return true if it's a dangerous position
     */
    private boolean isDangerZone(int row, int col) {
        for (int[] danger : DANGER_ZONES) {
            if (danger[0] == row && danger[1] == col) {
                return true;
            }
        }
        return false;
    }
}


