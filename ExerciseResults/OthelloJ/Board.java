import java.util.ArrayList;
import java.util.List;

/**
 * Represents the Othello game board and contains all game logic.
 */
public class Board {
    public static final int SIZE = 8;
    
    private final Stone[][] grid;
    private Stone currentPlayer;
    
    // Direction vectors for all 8 directions (horizontal, vertical, diagonal)
    private static final int[][] DIRECTIONS = {
        {-1, -1}, {-1, 0}, {-1, 1},
        {0, -1},           {0, 1},
        {1, -1},  {1, 0},  {1, 1}
    };

    /**
     * Creates a new board with the standard Othello starting position.
     */
    public Board() {
        grid = new Stone[SIZE][SIZE];
        initializeBoard();
    }

    /**
     * Creates a copy of an existing board.
     * @param other the board to copy
     */
    public Board(Board other) {
        grid = new Stone[SIZE][SIZE];
        for (int row = 0; row < SIZE; row++) {
            for (int col = 0; col < SIZE; col++) {
                grid[row][col] = other.grid[row][col];
            }
        }
        currentPlayer = other.currentPlayer;
    }

    /**
     * Initializes the board to the standard Othello starting position.
     */
    private void initializeBoard() {
        // Fill with empty stones
        for (int row = 0; row < SIZE; row++) {
            for (int col = 0; col < SIZE; col++) {
                grid[row][col] = Stone.EMPTY;
            }
        }
        
        // Set up the standard starting position (center 4 squares)
        grid[3][3] = Stone.WHITE;
        grid[3][4] = Stone.BLACK;
        grid[4][3] = Stone.BLACK;
        grid[4][4] = Stone.WHITE;
        
        // White moves first
        currentPlayer = Stone.WHITE;
    }

    /**
     * Gets the stone at the specified position.
     * @param row the row (0-7)
     * @param col the column (0-7)
     * @return the stone at that position
     */
    public Stone getStone(int row, int col) {
        if (!isValidPosition(row, col)) {
            throw new IllegalArgumentException("Invalid position: " + row + ", " + col);
        }
        return grid[row][col];
    }

    /**
     * Gets the current player.
     * @return the current player's stone color
     */
    public Stone getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * Checks if a position is within the board bounds.
     * @param row the row
     * @param col the column
     * @return true if the position is valid
     */
    public boolean isValidPosition(int row, int col) {
        return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
    }

    /**
     * Checks if a move is valid for the current player.
     * @param row the row to place the stone
     * @param col the column to place the stone
     * @return true if the move is valid
     */
    public boolean isValidMove(int row, int col) {
        return isValidMove(row, col, currentPlayer);
    }

    /**
     * Checks if a move is valid for a specific player.
     * @param row the row to place the stone
     * @param col the column to place the stone
     * @param player the player making the move
     * @return true if the move is valid
     */
    public boolean isValidMove(int row, int col, Stone player) {
        // Must be a valid position
        if (!isValidPosition(row, col)) {
            return false;
        }
        
        // Must be an empty cell
        if (grid[row][col] != Stone.EMPTY) {
            return false;
        }
        
        // Must flank at least one opponent piece
        return !getStonesToFlip(row, col, player).isEmpty();
    }

    /**
     * Gets all stones that would be flipped if a stone is placed at the given position.
     * @param row the row
     * @param col the column
     * @param player the player making the move
     * @return list of positions (as int arrays [row, col]) that would be flipped
     */
    public List<int[]> getStonesToFlip(int row, int col, Stone player) {
        List<int[]> allFlips = new ArrayList<>();
        Stone opponent = player.opposite();
        
        // Check all 8 directions
        for (int[] direction : DIRECTIONS) {
            List<int[]> flipsInDirection = new ArrayList<>();
            int r = row + direction[0];
            int c = col + direction[1];
            
            // Move along the direction while finding opponent pieces
            while (isValidPosition(r, c) && grid[r][c] == opponent) {
                flipsInDirection.add(new int[]{r, c});
                r += direction[0];
                c += direction[1];
            }
            
            // If we found opponent pieces and ended on our own piece, these are valid flips
            if (!flipsInDirection.isEmpty() && isValidPosition(r, c) && grid[r][c] == player) {
                allFlips.addAll(flipsInDirection);
            }
        }
        
        return allFlips;
    }

    /**
     * Makes a move for the current player.
     * @param row the row to place the stone
     * @param col the column to place the stone
     * @return true if the move was successful
     */
    public boolean makeMove(int row, int col) {
        if (!isValidMove(row, col)) {
            return false;
        }
        
        // Place the stone
        grid[row][col] = currentPlayer;
        
        // Flip all captured stones
        List<int[]> flips = getStonesToFlip(row, col, currentPlayer);
        for (int[] pos : flips) {
            grid[pos[0]][pos[1]] = currentPlayer;
        }
        
        // Switch to the next player
        switchPlayer();
        
        return true;
    }

    /**
     * Switches to the next player, handling turn skipping if necessary.
     */
    private void switchPlayer() {
        Stone nextPlayer = currentPlayer.opposite();
        
        // Check if next player has any valid moves
        if (hasValidMoves(nextPlayer)) {
            currentPlayer = nextPlayer;
        } else if (hasValidMoves(currentPlayer)) {
            // Next player has no moves, current player goes again
            // currentPlayer stays the same
        } else {
            // Neither player has moves - game is over
            currentPlayer = nextPlayer; // Still switch for display purposes
        }
    }

    /**
     * Checks if a player has any valid moves.
     * @param player the player to check
     * @return true if the player has at least one valid move
     */
    public boolean hasValidMoves(Stone player) {
        for (int row = 0; row < SIZE; row++) {
            for (int col = 0; col < SIZE; col++) {
                if (isValidMove(row, col, player)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Gets all valid moves for a player.
     * @param player the player
     * @return list of valid move positions as int arrays [row, col]
     */
    public List<int[]> getValidMoves(Stone player) {
        List<int[]> moves = new ArrayList<>();
        for (int row = 0; row < SIZE; row++) {
            for (int col = 0; col < SIZE; col++) {
                if (isValidMove(row, col, player)) {
                    moves.add(new int[]{row, col});
                }
            }
        }
        return moves;
    }

    /**
     * Counts the stones for a specific player.
     * @param player the player
     * @return the number of stones of that color on the board
     */
    public int countStones(Stone player) {
        int count = 0;
        for (int row = 0; row < SIZE; row++) {
            for (int col = 0; col < SIZE; col++) {
                if (grid[row][col] == player) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Checks if the game is over.
     * @return true if neither player can make a move
     */
    public boolean isGameOver() {
        return !hasValidMoves(Stone.BLACK) && !hasValidMoves(Stone.WHITE);
    }

    /**
     * Gets the winner of the game.
     * @return BLACK if black wins, WHITE if white wins, EMPTY if tie or game not over
     */
    public Stone getWinner() {
        if (!isGameOver()) {
            return Stone.EMPTY;
        }
        
        int blackCount = countStones(Stone.BLACK);
        int whiteCount = countStones(Stone.WHITE);
        
        if (blackCount > whiteCount) {
            return Stone.BLACK;
        } else if (whiteCount > blackCount) {
            return Stone.WHITE;
        } else {
            return Stone.EMPTY; // Tie
        }
    }

    /**
     * Returns a string representation of the board.
     * @return the board as a string
     */
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("  0 1 2 3 4 5 6 7\n");
        for (int row = 0; row < SIZE; row++) {
            sb.append(row).append(" ");
            for (int col = 0; col < SIZE; col++) {
                sb.append(grid[row][col].toChar()).append(" ");
            }
            sb.append("\n");
        }
        return sb.toString();
    }
}

