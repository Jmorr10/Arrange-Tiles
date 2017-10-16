/*
 * Author: Joseph Morris
 * Summary: Arrange Tiles Grid class. Used as the internal grid representation for the game.
 * Last Modified: 07/17/2016 12:37
 */

var arrangeTiles  = arrangeTiles || {};
arrangeTiles.Grid = (function() {

    var runningTests = (typeof module !== "undefined" && module.exports != null);

    function Grid(size) {

        var gridSize = size,
            tiles = new Array(gridSize),
            maxGridIdx = gridSize - 1,
            STATE_EMPTY = 0;

        // Fill each row with a column of zeroes.
        for (var i = 0; i < gridSize; i++) {
            tiles[i] = [];
            for (var j = 0; j < gridSize; j++) {
                tiles[i][j] = STATE_EMPTY;
            }
        }

        randomizeTiles();

        // Returns the tiles array.
        // If flatten, the multi-dimensional array will be flattened into a single array
        function getTiles (flatten) {
            return (flatten) ? [].concat.apply([], tiles) : tiles;
        }
        this.getTiles = getTiles; // Expose to public

        // Sets the state of a tile in the tiles array
        // row, col = index of tile to change
        // state = 0 to (gridSize - 1)
        // States: 0 = empty
        function setTileState (row, col, state) {
            if (row < gridSize &&
                col < gridSize &&
                state >= STATE_EMPTY &&
                state < (gridSize * gridSize)) {
                tiles[row][col] = state;
            }
        }

        // Randomly numbers the tiles in the grid
        function randomizeTiles() {
            var grid = [];

            for (var i = 0, j = Math.pow(gridSize, 2); i < j; i++) {
                grid.push(i);
            }

            // Randomize array
            grid.sort(function () { return 0.5 - Math.random() });

            // Step through the tiles array and assign a number to each tile
            for (var row = 0, rows = gridSize; row < rows; row++) {
                for (var col = 0, cols = gridSize; col < cols; col++) {
                    setTileState(row, col, grid.pop());
                }
            }
        }

        // Slides a tile into a blank space
        // Returns true or false, depending on whether the operation was successful or not.
        this.slideTile = function (row, col) {

            if (canMoveTile(row, col)) {
                var swapCoords = getSwapCoords(row, col);
                if (swapCoords) {
                    var swapState = tiles[row][col];
                    setTileState(row, col, 0);
                    setTileState(swapCoords[0], swapCoords[1], swapState);

                    return true;
                }
            }

            return false;
        };

        // Get the coords of the blank space relative to the tile to slide,
        // otherwise returns false
        function getSwapCoords (row, col) {

            var coords = false,
                up = (row - 1 >= 0) ? row - 1 : false,
                down = (row + 1 <= maxGridIdx) ? row + 1 : false,
                left = (col - 1 >= 0) ? col - 1: false,
                right = (col + 1 <= maxGridIdx) ? col + 1 : false;

            coords = (coords) ? coords : (up !== false && tiles[up][col] === 0) ? [up, col] : false;
            coords = (coords) ? coords : (down !== false && tiles[down][col] === 0) ? [down, col] : false;
            coords = (coords) ? coords : (left !== false && tiles[row][left] === 0) ? [row, left] : false;
            coords = (coords) ? coords : (right !== false && tiles[row][right] === 0) ? [row, right] : false;

            return coords;
        }


        // Check to see if the tile at the specified coordinates can slide
        function canMoveTile (row, col) {

            var up = (row - 1 >= 0) ? row - 1 : false,
                down = (row + 1 <= maxGridIdx) ? row + 1 : false,
                left = (col - 1 >= 0) ? col - 1: false,
                right = (col + 1 <= maxGridIdx) ? col + 1 : false,
                canMove = false;

            canMove = (canMove) ? canMove : (up !== false && tiles[up][col] === 0);
            canMove = (canMove) ? canMove : (down !== false && tiles[down][col] === 0);
            canMove = (canMove) ? canMove : (left !== false && tiles[row][left] === 0);
            canMove = (canMove) ? canMove : (right !== false && tiles[row][right] === 0);

            return canMove;
        }

        this.getBlankCoords = function () {
            for (var row = 0, rows = gridSize; row < rows; row++) {
                for (var col = 0, cols = gridSize; col < cols; col++) {
                    if (tiles[row][col] === 0) {
                        return [row, col];
                    }
                }
            }

            return false;
        };

        this.canMoveTile = canMoveTile; // Expose to public

        // Checks to see if the grid is solved.
        // Solved = contains exactly gridSize number of queens
        this.isSolved = function () {
            var tileStates = getTiles(true),
                solved = true;

            // Get rid of the last element, which should be zero
            tileStates.pop();

            for (var i = 0, j = tileStates.length - 1; i < j; i++) {
                if (tileStates[i + 1] !== tileStates[i] + 1) {
                    solved = false;
                    break;
                }
            }

            return solved;
        };

        // TESTING PURPOSES ONLY
        if (runningTests) {
            // The presence of these things indicates testing
            this.getTiles = getTiles;
            this.setTileState = setTileState;
            this.randomizeTiles = randomizeTiles;
        }
    }

    if (runningTests) {
        exports.Grid = Grid;
    }

    return Grid;
})();



