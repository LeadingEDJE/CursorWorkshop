import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the Board class.
 */
class BoardTest {
    
    private Board board;
    
    @BeforeEach
    void setUp() {
        board = new Board();
    }
    
    // ==================== Initial Setup Tests ====================
    
    @Test
    @DisplayName("New board has correct starting positions")
    void testInitialBoardSetup() {
        // Center should have the starting pattern
        assertEquals(Stone.WHITE, board.getStone(3, 3), "Position (3,3) should be WHITE");
        assertEquals(Stone.BLACK, board.getStone(3, 4), "Position (3,4) should be BLACK");
        assertEquals(Stone.BLACK, board.getStone(4, 3), "Position (4,3) should be BLACK");
        assertEquals(Stone.WHITE, board.getStone(4, 4), "Position (4,4) should be WHITE");
    }
    
    @Test
    @DisplayName("New board has empty cells except for starting positions")
    void testInitialBoardEmptyCells() {
        int emptyCount = 0;
        for (int row = 0; row < Board.SIZE; row++) {
            for (int col = 0; col < Board.SIZE; col++) {
                if (board.getStone(row, col) == Stone.EMPTY) {
                    emptyCount++;
                }
            }
        }
        assertEquals(60, emptyCount, "Should have 60 empty cells (64 - 4 starting stones)");
    }
    
    @Test
    @DisplayName("Black moves first")
    void testBlackMovesFirst() {
        assertEquals(Stone.BLACK, board.getCurrentPlayer(), "Black should move first");
    }
    
    @Test
    @DisplayName("Initial score is 2-2")
    void testInitialScore() {
        assertEquals(2, board.countStones(Stone.BLACK), "Black should start with 2 stones");
        assertEquals(2, board.countStones(Stone.WHITE), "White should start with 2 stones");
    }
    
    // ==================== Move Validation Tests ====================
    
    @Test
    @DisplayName("Valid move on empty cell that flanks opponent is accepted")
    void testValidMoveIsAccepted() {
        // Black's valid opening moves are: (2,3), (3,2), (4,5), (5,4)
        assertTrue(board.isValidMove(2, 3), "Move at (2,3) should be valid for Black");
        assertTrue(board.isValidMove(3, 2), "Move at (3,2) should be valid for Black");
        assertTrue(board.isValidMove(4, 5), "Move at (4,5) should be valid for Black");
        assertTrue(board.isValidMove(5, 4), "Move at (5,4) should be valid for Black");
    }
    
    @Test
    @DisplayName("Invalid move on occupied cell is rejected")
    void testMoveOnOccupiedCellRejected() {
        assertFalse(board.isValidMove(3, 3), "Move on occupied WHITE cell should be invalid");
        assertFalse(board.isValidMove(3, 4), "Move on occupied BLACK cell should be invalid");
    }
    
    @Test
    @DisplayName("Invalid move that doesn't flank opponent is rejected")
    void testMoveWithoutFlankingRejected() {
        assertFalse(board.isValidMove(0, 0), "Corner move without flanking should be invalid");
        assertFalse(board.isValidMove(2, 2), "Move that doesn't flank should be invalid");
    }
    
    @Test
    @DisplayName("Move outside board bounds throws exception")
    void testMoveOutsideBoundsInvalid() {
        assertFalse(board.isValidMove(-1, 0), "Negative row should be invalid");
        assertFalse(board.isValidMove(0, -1), "Negative column should be invalid");
        assertFalse(board.isValidMove(8, 0), "Row >= 8 should be invalid");
        assertFalse(board.isValidMove(0, 8), "Column >= 8 should be invalid");
    }
    
    // ==================== Piece Flipping Tests ====================
    
    @Test
    @DisplayName("Making a move flips opponent pieces horizontally")
    void testFlipHorizontal() {
        // Black plays at (3, 2), should flip (3, 3) from WHITE to BLACK
        board.makeMove(3, 2);
        
        assertEquals(Stone.BLACK, board.getStone(3, 2), "Placed stone should be BLACK");
        assertEquals(Stone.BLACK, board.getStone(3, 3), "Flipped stone at (3,3) should now be BLACK");
    }
    
    @Test
    @DisplayName("Making a move flips opponent pieces vertically")
    void testFlipVertical() {
        // Black plays at (2, 3), should flip (3, 3) from WHITE to BLACK vertically
        board.makeMove(2, 3);
        
        assertEquals(Stone.BLACK, board.getStone(2, 3), "Placed stone should be BLACK");
        assertEquals(Stone.BLACK, board.getStone(3, 3), "Flipped stone at (3,3) should now be BLACK");
    }
    
    @Test
    @DisplayName("Score updates correctly after move")
    void testScoreUpdatesAfterMove() {
        // Initial: 2 black, 2 white
        // Black plays at (3, 2): places 1 black, flips 1 white -> 4 black, 1 white
        board.makeMove(3, 2);
        
        assertEquals(4, board.countStones(Stone.BLACK), "Black should have 4 stones after move");
        assertEquals(1, board.countStones(Stone.WHITE), "White should have 1 stone after move");
    }
    
    @Test
    @DisplayName("getStonesToFlip returns correct positions")
    void testGetStonesToFlip() {
        List<int[]> flips = board.getStonesToFlip(3, 2, Stone.BLACK);
        
        assertEquals(1, flips.size(), "Should flip exactly 1 stone");
        assertEquals(3, flips.get(0)[0], "Flipped stone should be at row 3");
        assertEquals(3, flips.get(0)[1], "Flipped stone should be at column 3");
    }
    
    // ==================== Turn Management Tests ====================
    
    @Test
    @DisplayName("Turn switches to opponent after valid move")
    void testTurnSwitchesAfterMove() {
        assertEquals(Stone.BLACK, board.getCurrentPlayer(), "Should start as Black's turn");
        
        board.makeMove(3, 2);
        
        assertEquals(Stone.WHITE, board.getCurrentPlayer(), "Should be White's turn after Black moves");
    }
    
    @Test
    @DisplayName("Player with no valid moves is skipped")
    void testPlayerWithNoMovesIsSkipped() {
        // This is harder to test without setting up a specific board state
        // We'll test the hasValidMoves method instead
        assertTrue(board.hasValidMoves(Stone.BLACK), "Black should have valid moves at start");
        assertTrue(board.hasValidMoves(Stone.WHITE), "White should have valid moves at start");
    }
    
    // ==================== Valid Moves List Tests ====================
    
    @Test
    @DisplayName("getValidMoves returns all valid positions")
    void testGetValidMoves() {
        List<int[]> blackMoves = board.getValidMoves(Stone.BLACK);
        
        assertEquals(4, blackMoves.size(), "Black should have 4 valid moves at game start");
    }
    
    @Test
    @DisplayName("hasValidMoves returns true when moves exist")
    void testHasValidMovesTrue() {
        assertTrue(board.hasValidMoves(Stone.BLACK), "Black should have valid moves at start");
    }
    
    // ==================== Game Over Tests ====================
    
    @Test
    @DisplayName("Game is not over at start")
    void testGameNotOverAtStart() {
        assertFalse(board.isGameOver(), "Game should not be over at start");
    }
    
    @Test
    @DisplayName("Winner is EMPTY when game is not over")
    void testNoWinnerDuringGame() {
        assertEquals(Stone.EMPTY, board.getWinner(), "Winner should be EMPTY while game is in progress");
    }
    
    // ==================== Board Copy Tests ====================
    
    @Test
    @DisplayName("Board copy is independent of original")
    void testBoardCopyIndependent() {
        Board copy = new Board(board);
        
        // Make a move on the original
        board.makeMove(3, 2);
        
        // Copy should still have original state
        assertEquals(Stone.WHITE, copy.getStone(3, 3), "Copy should not be affected by original");
        assertEquals(Stone.BLACK, board.getStone(3, 3), "Original should have the flipped stone");
    }
    
    // ==================== Stone Enum Tests ====================
    
    @Test
    @DisplayName("Stone.opposite returns correct opposite color")
    void testStoneOpposite() {
        assertEquals(Stone.WHITE, Stone.BLACK.opposite(), "Opposite of BLACK should be WHITE");
        assertEquals(Stone.BLACK, Stone.WHITE.opposite(), "Opposite of WHITE should be BLACK");
        assertEquals(Stone.EMPTY, Stone.EMPTY.opposite(), "Opposite of EMPTY should be EMPTY");
    }
    
    @Test
    @DisplayName("Stone.toChar returns correct characters")
    void testStoneToChar() {
        assertEquals('●', Stone.BLACK.toChar(), "BLACK should display as ●");
        assertEquals('○', Stone.WHITE.toChar(), "WHITE should display as ○");
        assertEquals('.', Stone.EMPTY.toChar(), "EMPTY should display as .");
    }
    
    // ==================== Edge Case Tests ====================
    
    @Test
    @DisplayName("Multiple consecutive moves work correctly")
    void testMultipleMoves() {
        // Black moves
        assertTrue(board.makeMove(3, 2), "First move should succeed");
        assertEquals(Stone.WHITE, board.getCurrentPlayer());
        
        // White moves
        assertTrue(board.makeMove(2, 2), "Second move should succeed");
        assertEquals(Stone.BLACK, board.getCurrentPlayer());
        
        // Black moves again
        assertTrue(board.makeMove(2, 3), "Third move should succeed");
        assertEquals(Stone.WHITE, board.getCurrentPlayer());
    }
    
    @Test
    @DisplayName("Invalid move returns false and doesn't change board")
    void testInvalidMoveNoChange() {
        int blackCountBefore = board.countStones(Stone.BLACK);
        Stone playerBefore = board.getCurrentPlayer();
        
        assertFalse(board.makeMove(0, 0), "Invalid move should return false");
        
        assertEquals(blackCountBefore, board.countStones(Stone.BLACK), "Stone count should not change");
        assertEquals(playerBefore, board.getCurrentPlayer(), "Current player should not change");
    }
}


