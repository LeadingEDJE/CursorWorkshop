import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.List;
import java.util.function.BiConsumer;

/**
 * Swing panel that renders the Othello game board.
 */
public class BoardPanel extends JPanel {
    
    private static final int CELL_SIZE = 60;
    private static final int BOARD_SIZE = Board.SIZE * CELL_SIZE;
    private static final int STONE_PADDING = 5;
    
    // Colors
    private static final Color BOARD_COLOR = new Color(0x2E7D32);  // Forest green
    private static final Color GRID_COLOR = new Color(0x1B5E20);   // Darker green for lines
    private static final Color VALID_MOVE_COLOR = new Color(255, 255, 255, 60);  // Semi-transparent white
    private static final Color BLACK_STONE = new Color(0x212121);
    private static final Color WHITE_STONE = new Color(0xFAFAFA);
    private static final Color STONE_BORDER = new Color(0x424242);
    
    private Board board;
    private BiConsumer<Integer, Integer> moveCallback;
    private boolean inputEnabled = true;
    
    /**
     * Creates a new board panel.
     * @param board the game board to display
     */
    public BoardPanel(Board board) {
        this.board = board;
        
        setPreferredSize(new Dimension(BOARD_SIZE, BOARD_SIZE));
        setBackground(BOARD_COLOR);
        
        // Add mouse listener for player moves
        addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (inputEnabled && moveCallback != null) {
                    int col = e.getX() / CELL_SIZE;
                    int row = e.getY() / CELL_SIZE;
                    
                    if (row >= 0 && row < Board.SIZE && col >= 0 && col < Board.SIZE) {
                        moveCallback.accept(row, col);
                    }
                }
            }
        });
    }

    /**
     * Sets the callback for when a player clicks a cell.
     * @param callback function that receives (row, col) of the clicked cell
     */
    public void setMoveCallback(BiConsumer<Integer, Integer> callback) {
        this.moveCallback = callback;
    }

    /**
     * Sets whether player input is enabled.
     * @param enabled true to enable input
     */
    public void setInputEnabled(boolean enabled) {
        this.inputEnabled = enabled;
    }

    /**
     * Updates the board reference and repaints.
     * @param board the new board state
     */
    public void setBoard(Board board) {
        this.board = board;
        repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        
        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        // Draw the grid
        drawGrid(g2d);
        
        // Draw valid moves for current player (if it's the human's turn)
        if (inputEnabled && board.getCurrentPlayer() == Stone.WHITE) {
            drawValidMoves(g2d);
        }
        
        // Draw the stones
        drawStones(g2d);
    }

    /**
     * Draws the grid lines.
     */
    private void drawGrid(Graphics2D g2d) {
        g2d.setColor(GRID_COLOR);
        g2d.setStroke(new BasicStroke(2));
        
        // Vertical lines
        for (int i = 0; i <= Board.SIZE; i++) {
            int x = i * CELL_SIZE;
            g2d.drawLine(x, 0, x, BOARD_SIZE);
        }
        
        // Horizontal lines
        for (int i = 0; i <= Board.SIZE; i++) {
            int y = i * CELL_SIZE;
            g2d.drawLine(0, y, BOARD_SIZE, y);
        }
        
        // Draw small circles at the four star points (traditional board markers)
        int[] starPoints = {2, 6};
        int dotSize = 8;
        for (int row : starPoints) {
            for (int col : starPoints) {
                int x = col * CELL_SIZE - dotSize / 2;
                int y = row * CELL_SIZE - dotSize / 2;
                g2d.fillOval(x, y, dotSize, dotSize);
            }
        }
    }

    /**
     * Draws indicators for valid moves.
     */
    private void drawValidMoves(Graphics2D g2d) {
        List<int[]> validMoves = board.getValidMoves(board.getCurrentPlayer());
        
        g2d.setColor(VALID_MOVE_COLOR);
        int indicatorSize = CELL_SIZE - STONE_PADDING * 4;
        
        for (int[] move : validMoves) {
            int x = move[1] * CELL_SIZE + (CELL_SIZE - indicatorSize) / 2;
            int y = move[0] * CELL_SIZE + (CELL_SIZE - indicatorSize) / 2;
            g2d.fillOval(x, y, indicatorSize, indicatorSize);
        }
    }

    /**
     * Draws all the stones on the board.
     */
    private void drawStones(Graphics2D g2d) {
        int stoneSize = CELL_SIZE - STONE_PADDING * 2;
        
        for (int row = 0; row < Board.SIZE; row++) {
            for (int col = 0; col < Board.SIZE; col++) {
                Stone stone = board.getStone(row, col);
                
                if (stone != Stone.EMPTY) {
                    int x = col * CELL_SIZE + STONE_PADDING;
                    int y = row * CELL_SIZE + STONE_PADDING;
                    
                    // Draw the stone
                    Color stoneColor = (stone == Stone.BLACK) ? BLACK_STONE : WHITE_STONE;
                    g2d.setColor(stoneColor);
                    g2d.fillOval(x, y, stoneSize, stoneSize);
                    
                    // Draw border
                    g2d.setColor(STONE_BORDER);
                    g2d.setStroke(new BasicStroke(1.5f));
                    g2d.drawOval(x, y, stoneSize, stoneSize);
                    
                    // Add subtle gradient/highlight effect
                    if (stone == Stone.WHITE) {
                        g2d.setColor(new Color(255, 255, 255, 100));
                        g2d.fillOval(x + 5, y + 5, stoneSize / 3, stoneSize / 3);
                    } else {
                        g2d.setColor(new Color(100, 100, 100, 80));
                        g2d.fillOval(x + 5, y + 5, stoneSize / 3, stoneSize / 3);
                    }
                }
            }
        }
    }
}


