/*
 * Author: Joseph Morris
 * Summary: Arrange Tiles Grid class test suite.
 * Last Modified: 07/17/2016 12:37
 */

var assert = require("assert"),
    arrangeTiles = require("../arrangeTiles.Grid.js");

describe("Arrange Tiles Grid", function() {

    var grid;

    beforeEach(function () {
        grid = new arrangeTiles.Grid(4);
    });

    it("creates a multi-dimensional array of specified size", function () {
        assert.equal(grid.getTiles().length, 4);
        assert.equal(grid.getTiles(true).length, 16); // Should be size^2
    });

    it("can set the state at the specified coordinates", function () {
        var previousVal;

        grid.setTileState(0, 0, 0);
        assert.equal(grid.getTiles(true)[0], 0);

        grid.setTileState(0, 1, 15);
        assert.equal(grid.getTiles(true)[1], 15);

        previousVal = grid.getTiles()[0][2];
        grid.setTileState(0, 2, 16);
        assert.equal(grid.getTiles(true)[2], previousVal);
    });

    it("can randomize its tile order", function () {
        var tileSum = 0,
            expectedSum = 120,
            gridTiles;

        grid.randomizeTiles();
        gridTiles = grid.getTiles(true);

        tileSum = gridTiles.reduce((x, y) => { return x + y });
        assert.equal(tileSum, expectedSum);


        assert.notEqual(gridTiles[0], gridTiles[1]);
        assert.notEqual(gridTiles[4], gridTiles[5]);
    });

    it("can determined if it is solved", function () {
        var tiles = grid.getTiles(),
            counter = 1;

        assert.equal(grid.isSolved(), false);

        for (var row = 0, rows = tiles.length; row < rows; row++) {
            for (var col = 0, cols = tiles.length; col < cols; col++) {
                if (counter < 16) {
                    grid.setTileState(row, col, counter);
                    counter++;
                }
            }
        }

        assert.equal(grid.isSolved(), true);
    });

    it("can locate the blank space in the grid", function () {
        grid.randomizeTiles();

        assert.notEqual(grid.getBlankCoords(), false);
    });

    it("can determine if a tile is able to move", function () {
        grid.randomizeTiles();

        var blankCoords = grid.getBlankCoords(),
            brow = blankCoords[0],
            bcol = blankCoords[1],
            swapState = grid.getTiles()[2][1];

        // Set blank to 2,1
        grid.setTileState(2, 1, 0);
        grid.setTileState(brow, bcol, swapState);

        // Should slide
        assert.equal(grid.canMoveTile(1, 1), true);
        assert.equal(grid.canMoveTile(3, 1), true);
        assert.equal(grid.canMoveTile(2, 0), true);
        assert.equal(grid.canMoveTile(2, 2), true);

        // Diagonal, should not slide
        assert.equal(grid.canMoveTile(1, 0), false);
    });

    it("can slide a tile into a blank space", function () {

        var gridTiles;

        grid.randomizeTiles();

        // Set out blank space
        grid.setTileState(2, 1, 0);

        // Now set the tiles surrounding that blank space
        grid.setTileState(1, 1, 1);
        grid.setTileState(3, 1, 2);
        grid.setTileState(2, 0, 3);
        grid.setTileState(2, 2, 4);

        assert.equal(grid.slideTile(1, 1), true);
        gridTiles = grid.getTiles();
        assert.equal(gridTiles[1][1], 0);
        assert.equal(gridTiles[2][1], 1);

        assert.equal(grid.slideTile(2, 0), false);
    });

});