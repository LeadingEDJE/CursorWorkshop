/**
 * Represents the state of a cell on the Othello board.
 */
public enum Stone {
    EMPTY,
    BLACK,
    WHITE;

    /**
     * Returns the opposite stone color.
     * @return WHITE if this is BLACK, BLACK if this is WHITE, EMPTY if this is EMPTY
     */
    public Stone opposite() {
        return switch (this) {
            case BLACK -> WHITE;
            case WHITE -> BLACK;
            case EMPTY -> EMPTY;
        };
    }

    /**
     * Returns a display character for the stone.
     * @return '●' for BLACK, '○' for WHITE, '.' for EMPTY
     */
    public char toChar() {
        return switch (this) {
            case BLACK -> '●';
            case WHITE -> '○';
            case EMPTY -> '.';
        };
    }
}


