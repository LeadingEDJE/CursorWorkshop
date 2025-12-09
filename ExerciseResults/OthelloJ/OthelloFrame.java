import javax.swing.*;
import java.awt.*;

/**
 * Main window for the Othello game.
 */
public class OthelloFrame extends JFrame {
    
    private final Board board;
    private final BoardPanel boardPanel;
    private final AIPlayer aiPlayer;
    
    private JLabel blackScoreLabel;
    private JLabel whiteScoreLabel;
    private final JLabel turnLabel;
    private final JLabel statusLabel;
    
    // Colors
    private static final Color BACKGROUND_COLOR = new Color(0x263238);
    private static final Color TEXT_COLOR = new Color(0xECEFF1);
    private static final Color ACCENT_COLOR = new Color(0x4CAF50);
    private static final Color SIDEBAR_COLOR = new Color(0x1A1A1A);  // Dark sidebar color

    /**
     * Creates the main game window.
     */
    public OthelloFrame() {
        super("Othello");
        
        // Initialize game components
        board = new Board();
        aiPlayer = new AIPlayer(Stone.BLACK);
        
        // Set up the frame
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setResizable(false);
        getContentPane().setBackground(BACKGROUND_COLOR);
        setLayout(new BorderLayout(10, 10));
        
        // Create the header panel with title and instructions
        JPanel headerPanel = createHeaderPanel();
        add(headerPanel, BorderLayout.NORTH);
        
        // Create the rules sidebar
        JPanel rulesPanel = createRulesPanel();
        add(rulesPanel, BorderLayout.WEST);
        
        // Create the board panel
        boardPanel = new BoardPanel(board);
        boardPanel.setMoveCallback(this::handlePlayerMove);
        
        // Wrap board in a panel with border
        JPanel boardWrapper = new JPanel(new FlowLayout(FlowLayout.CENTER, 0, 0));
        boardWrapper.setBackground(BACKGROUND_COLOR);
        boardWrapper.setBorder(BorderFactory.createEmptyBorder(0, 20, 0, 20));
        boardWrapper.add(boardPanel);
        add(boardWrapper, BorderLayout.CENTER);
        
        // Create the score panel
        JPanel scorePanel = createScorePanel();
        add(scorePanel, BorderLayout.EAST);
        
        // Create the status panel
        JPanel statusPanel = new JPanel();
        statusPanel.setBackground(BACKGROUND_COLOR);
        statusPanel.setBorder(BorderFactory.createEmptyBorder(10, 20, 20, 20));
        
        turnLabel = new JLabel("Black's turn (AI thinking...)");
        turnLabel.setForeground(TEXT_COLOR);
        turnLabel.setFont(new Font("Segoe UI", Font.BOLD, 14));
        statusPanel.add(turnLabel);
        
        statusLabel = new JLabel("");
        statusLabel.setForeground(ACCENT_COLOR);
        statusLabel.setFont(new Font("Segoe UI", Font.BOLD, 16));
        statusPanel.add(statusLabel);
        
        add(statusPanel, BorderLayout.SOUTH);
        
        pack();
        setLocationRelativeTo(null);
        
        // Update initial display
        updateDisplay();
        
        // White player goes first - no initial AI move needed
    }

    /**
     * Creates the header panel with title and instructions.
     */
    private JPanel createHeaderPanel() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(BACKGROUND_COLOR);
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 10, 20));
        
        JLabel titleLabel = new JLabel("OTHELLO");
        titleLabel.setForeground(ACCENT_COLOR);
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 28));
        titleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        panel.add(titleLabel);
        
        panel.add(Box.createVerticalStrut(10));
        
        JLabel instructionLabel = new JLabel(
            "<html><center>Place stones to outflank your opponent.<br>" +
            "Surrounded pieces flip to your color!</center></html>"
        );
        instructionLabel.setForeground(TEXT_COLOR);
        instructionLabel.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        instructionLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        panel.add(instructionLabel);
        
        return panel;
    }

    /**
     * Creates the rules sidebar panel with game instructions.
     */
    private JPanel createRulesPanel() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(SIDEBAR_COLOR);
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        panel.setPreferredSize(new Dimension(250, 0));
        
        JLabel rulesTitle = new JLabel("HOW TO PLAY");
        rulesTitle.setForeground(ACCENT_COLOR);
        rulesTitle.setFont(new Font("Segoe UI", Font.BOLD, 18));
        rulesTitle.setAlignmentX(Component.CENTER_ALIGNMENT);
        panel.add(rulesTitle);
        
        panel.add(Box.createVerticalStrut(20));
        
        // Rules content
        String[] rules = {
            "<html><div style='text-align: left;'>" +
            "<b>Objective:</b><br>" +
            "Capture more pieces than your opponent by the end of the game.<br><br>" +
            
            "<b>Gameplay:</b><br>" +
            "• Players take turns placing stones<br>" +
            "• You can only place a stone where it will outflank (surround) at least one opponent piece<br>" +
            "• Outflanked pieces are flipped to your color<br>" +
            "• Valid moves are shown as light green circles<br><br>" +
            
            "<b>Outflanking:</b><br>" +
            "A piece outflanks opponent pieces when:<br>" +
            "• Your new piece forms a line (horizontal, vertical, or diagonal)<br>" +
            "• The line contains one or more opponent pieces<br>" +
            "• The line ends with another of your pieces<br><br>" +
            
            "<b>Turn Skipping:</b><br>" +
            "If you have no valid moves, your turn is skipped. The game ends when neither player can move.<br><br>" +
            
            "<b>Winning:</b><br>" +
            "The player with the most pieces at the end wins!" +
            "</div></html>"
        };
        
        JLabel rulesText = new JLabel(rules[0]);
        rulesText.setForeground(TEXT_COLOR);
        rulesText.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        rulesText.setAlignmentX(Component.LEFT_ALIGNMENT);
        panel.add(rulesText);
        
        panel.add(Box.createVerticalGlue());
        
        return panel;
    }

    /**
     * Creates the score panel showing both players' scores.
     */
    private JPanel createScorePanel() {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(BACKGROUND_COLOR);
        panel.setBorder(BorderFactory.createEmptyBorder(20, 10, 20, 20));
        
        JLabel scoreTitle = new JLabel("SCORE");
        scoreTitle.setForeground(ACCENT_COLOR);
        scoreTitle.setFont(new Font("Segoe UI", Font.BOLD, 16));
        scoreTitle.setAlignmentX(Component.CENTER_ALIGNMENT);
        panel.add(scoreTitle);
        
        panel.add(Box.createVerticalStrut(20));
        
        // Black score (AI)
        JPanel blackPanel = createScoreRow("● Black (AI)", "2");
        panel.add(blackPanel);
        // Get the score label from the black panel
        blackScoreLabel = (JLabel) blackPanel.getComponent(1);
        
        panel.add(Box.createVerticalStrut(15));
        
        // White score (Player)
        JPanel whitePanel = createScoreRow("○ White (You)", "2");
        panel.add(whitePanel);
        // Get the score label from the white panel
        whiteScoreLabel = (JLabel) whitePanel.getComponent(1);
        
        panel.add(Box.createVerticalGlue());
        
        // New Game button
        JButton newGameButton = new JButton("New Game");
        newGameButton.setFont(new Font("Segoe UI", Font.BOLD, 12));
        newGameButton.setBackground(ACCENT_COLOR);
        newGameButton.setForeground(Color.WHITE);
        newGameButton.setFocusPainted(false);
        newGameButton.setBorderPainted(false);
        newGameButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        newGameButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        newGameButton.addActionListener(e -> resetGame());
        panel.add(newGameButton);
        
        return panel;
    }

    /**
     * Creates a row for displaying a player's score.
     */
    private JPanel createScoreRow(String label, String initialScore) {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(BACKGROUND_COLOR);
        panel.setAlignmentX(Component.CENTER_ALIGNMENT);
        
        JLabel nameLabel = new JLabel(label);
        nameLabel.setForeground(TEXT_COLOR);
        nameLabel.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        nameLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        panel.add(nameLabel);
        
        JLabel scoreLabel = new JLabel(initialScore);
        scoreLabel.setForeground(TEXT_COLOR);
        scoreLabel.setFont(new Font("Segoe UI", Font.BOLD, 36));
        scoreLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        panel.add(scoreLabel);
        
        return panel;
    }

    /**
     * Handles a move attempt by the human player.
     */
    private void handlePlayerMove(int row, int col) {
        // Only process if it's the player's turn (White)
        if (board.getCurrentPlayer() != Stone.WHITE) {
            return;
        }
        
        // Try to make the move
        if (board.makeMove(row, col)) {
            updateDisplay();
            
            // Check if game is over
            if (board.isGameOver()) {
                showGameOver();
                return;
            }
            
            // Let AI make its move
            if (board.getCurrentPlayer() == Stone.BLACK) {
                boardPanel.setInputEnabled(false);
                
                // Small delay for AI move to feel more natural
                Timer timer = new Timer(500, e -> makeAIMove());
                timer.setRepeats(false);
                timer.start();
            }
        }
    }

    /**
     * Makes a move for the AI player.
     */
    private void makeAIMove() {
        if (board.getCurrentPlayer() != Stone.BLACK) {
            boardPanel.setInputEnabled(true);
            return;
        }
        
        turnLabel.setText("Black's turn (AI thinking...)");
        
        int[] move = aiPlayer.chooseMove(board);
        
        if (move != null) {
            // Small delay before making the move
            Timer timer = new Timer(300, e -> {
                board.makeMove(move[0], move[1]);
                updateDisplay();
                
                if (board.isGameOver()) {
                    showGameOver();
                } else if (board.getCurrentPlayer() == Stone.BLACK) {
                    // AI goes again (player was skipped)
                    Timer nextTimer = new Timer(500, ev -> makeAIMove());
                    nextTimer.setRepeats(false);
                    nextTimer.start();
                } else {
                    boardPanel.setInputEnabled(true);
                }
            });
            timer.setRepeats(false);
            timer.start();
        } else {
            // AI has no moves
            updateDisplay();
            if (board.isGameOver()) {
                showGameOver();
            } else {
                boardPanel.setInputEnabled(true);
            }
        }
    }

    /**
     * Updates the display (scores, turn indicator, board).
     */
    private void updateDisplay() {
        // Update scores
        int blackCount = board.countStones(Stone.BLACK);
        int whiteCount = board.countStones(Stone.WHITE);
        
        blackScoreLabel.setText(String.valueOf(blackCount));
        whiteScoreLabel.setText(String.valueOf(whiteCount));
        
        // Update turn indicator
        if (!board.isGameOver()) {
            if (board.getCurrentPlayer() == Stone.WHITE) {
                turnLabel.setText("Your turn (White) - Click to place a stone");
            } else {
                turnLabel.setText("Black's turn (AI thinking...)");
            }
            statusLabel.setText("");
        }
        
        // Refresh the board
        boardPanel.repaint();
    }

    /**
     * Shows the game over message.
     */
    private void showGameOver() {
        boardPanel.setInputEnabled(false);
        
        int blackCount = board.countStones(Stone.BLACK);
        int whiteCount = board.countStones(Stone.WHITE);
        
        Stone winner = board.getWinner();
        String message;
        
        if (winner == Stone.WHITE) {
            message = "You win! 🎉";
            turnLabel.setText("Game Over - You win!");
        } else if (winner == Stone.BLACK) {
            message = "AI wins!";
            turnLabel.setText("Game Over - AI wins!");
        } else {
            message = "It's a tie!";
            turnLabel.setText("Game Over - It's a tie!");
        }
        
        statusLabel.setText(message + " (Black: " + blackCount + " | White: " + whiteCount + ")");
    }

    /**
     * Resets the game to start a new game.
     */
    private void resetGame() {
        // Create a new board
        Board newBoard = new Board();
        
        // Update references
        try {
            java.lang.reflect.Field boardField = getClass().getDeclaredField("board");
            boardField.setAccessible(true);
            boardField.set(this, newBoard);
        } catch (Exception e) {
            // Fallback: just start fresh
        }
        
        // Recreate the frame (simpler approach)
        dispose();
        OthelloFrame newFrame = new OthelloFrame();
        newFrame.setVisible(true);
    }
}

