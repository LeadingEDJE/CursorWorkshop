import javax.swing.*;

/**
 * Entry point for the Othello game application.
 */
public class Main {
    
    /**
     * Main method - launches the Othello game.
     * @param args command line arguments (not used)
     */
    public static void main(String[] args) {
        // Set look and feel to system default for better appearance
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            // Fall back to default look and feel
        }
        
        // Launch the game on the Event Dispatch Thread
        SwingUtilities.invokeLater(() -> {
            OthelloFrame frame = new OthelloFrame();
            frame.setVisible(true);
        });
    }
}


