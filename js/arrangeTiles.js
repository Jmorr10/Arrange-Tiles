/*
 * Author: Joseph Morris
 * Summary: Arrange Tiles Game class.
 * Last Modified: 07/17/2016 12:37
 */

var arrangeTiles = arrangeTiles || {};
arrangeTiles.Game = (function () {

    var runningTests = (typeof module !== "undefined" && module.exports != null);

    var STORAGE_PATH = "JRMSoftworks.BG.arrangeTiles",
        MIN_GRID_SIZE = 3,
        MAX_GRID_SIZE = 10,
        MIN_TILE_DIMEN = 44,
        MIN_SCREEN_WIDTH = 320,
        // Check CSS Media queries for this value (in px)
        FOOTER_DISAPPEARS_AT = 700;

    // Separates jQuery selectors from the code for ease of maintenance.
    var BOARD_ID = "#board",
        NUM_MOVES = "#game-num-moves",
        OPTIONS = "#options",
        GRID_SIZE_SELECTOR = "#grid-size-selector",
        CLEAR_ACHIEVEMENTS_CHECKED = "#clear-achievements:checked",
        ROW_TEMPLATE = "#row-template",
        COL_TEMPLATE = "#col-template",
        MODAL_GAME_OVER = "#game-over-modal",
        MODAL_NEW_BEST_TIME = "#modal-new-best-time",
        MODAL_TIME_TAKEN = "#modal-time-taken",
        MODAL_NEW_BEST_MOVES = "#modal-new-best-moves",
        MODAL_NUM_MOVES = "#modal-num-moves",
        MODAL_OPTIONS = "#options-modal",
        MODAL_HELP = "#help-modal";

    function generateDefaults(defaultVal) {
        var opt = {};
        for (var i = 3; i < 11; i++) {
            opt[i.toString()] = defaultVal;
        }
        return opt;
    }

    // Provides default values for the settings saved in local storage
    var defaults = {
        gridSize: 6,
        bestTime: generateDefaults(9999),
        bestMoves: generateDefaults(99999)
    };

    // Create commonly used jQuery objects for easy reference
    var board = $(BOARD_ID),
        numMoves = $(NUM_MOVES),
        rowTemplate = $(ROW_TEMPLATE),
        colTemplate = $(COL_TEMPLATE),
        gameOverTemplate = $(MODAL_GAME_OVER),
        newBestTimeTemplate = $(MODAL_NEW_BEST_TIME),
        timeTakenTemplate = $(MODAL_TIME_TAKEN),
        newBestMovesTemplate = $(MODAL_NEW_BEST_MOVES),
        numMovesTemplate = $(MODAL_NUM_MOVES),
        optionsTemplate = $(MODAL_OPTIONS),
        helpTemplate = $(MODAL_HELP);

    function globalInit() {
        //Listeners
        $(window).on("resize", function () {
            var width = board.width();
            board.height(width);
        });

        $("body").on("hidden.bs.modal", function (ev) {
            var el = $(ev.target);
            el.remove();
        });
    }

    // Declaration of the main game class.
    function arrangeTilesGame() {
        var currentSettings,
            grid,
            gridSize, // Convenience accessor
            gameTime,
            currentNumMoves,
            gridLocked = false; // prevents clicking during tile animations

        // Gets settings from localStorage. If not found, loads defaults
        // and saves those defaults to localStorage.
        function initSettings() {
            var settings,
                disabledSizes = getDisabledGridSizes();

            // Note to self: change to null to reset settings
            currentSettings = getSettings();
            settings = (currentSettings != null) ? currentSettings : defaults;

            if (settings === defaults) {
                saveSettings(defaults);
            } else {
                if (disabledSizes.indexOf(settings.gridSize) !== -1) {
                    settings.gridSize = defaults.gridSize;
                }
            }

            currentSettings = settings;
        }

        // Initializes the game by:
        //      1. Loading current settings
        //      2. Generating the board
        //      3. Initializing game variables
        // * Exposes function to public after declaration to allow private members to call without prefix.
        function reset() {
            initSettings();

            gridSize = currentSettings.gridSize;
            grid = new arrangeTiles.Grid(gridSize);
            initBoard();

            gameTime = {"start": 0, "end": 0};
            currentNumMoves = 0;

            numMoves.text("0");
        }
        this.reset = reset; // Expose to public

        // Generates the board given a size and adds event listeners
        function initBoard() {
            if (!runningTests) {
                var clickEvent = "click.arrangeTiles";

                generateBoard();

                board.removeClass('hidden')
                     .height(board.width())
                     .off(clickEvent)
                     .on(clickEvent, ".tile", tileClickHandler);
            }
        }

        // Generates board of given size and adds it to the DOM.
        function generateBoard() {
            var rows = $([]),
                gridTiles = grid.getTiles();

            for (var r = 0; r < gridSize; r++) {
                var rowTemp = rowTemplate[0].innerHTML.replace('#', r.toString()),
                    row = $([]).add(rowTemp);

                for (var c = 0; c < gridSize; c++) {
                    var tileNum = gridTiles[r][c],
                        colTemp,
                        col;

                    colTemp = colTemplate[0].innerHTML.replace(/@colNum/g, c.toString())
                                                      .replace(/@tileNum/, tileNum.toString());

                    col =  $([]).add(colTemp);


                    if (tileNum === 0) {
                        col.addClass("blank");
                    }

                    col.data("row", r)
                       .data("col", c);

                    row.first().append(col);
                }

                rows = rows.add(row);
            }

            board.empty()
                 .append(rows);
        }

        // Handles the tile click event.
        function tileClickHandler() {

            // Check to see if the grid is locked
            if (gridLocked) {
                return false; // Locked. Do nothing.
            } else {
                gridLocked = true;
            }

            var el = $(this),
                row = el.data("row"),
                col = el.data("col"),
                blankCoords = grid.getBlankCoords(),
                blankTile,
                gridResult = grid.slideTile(row, col);

            if (gridResult) {
                // Animate our tile swap
                blankTile = tileCoordsToJQuery(blankCoords[0], blankCoords[1]);
                swapTiles(el, blankTile);

                // Increment the move number and update the display
                currentNumMoves++;
                numMoves.text(currentNumMoves.toString());
            } else {
                gridLocked = false;
            }

            if (grid.isSolved()) {
                gameOver();
            }

            if (gameTime.start === 0) {
                // Only start the timer when the player's first move has been completed.
                runGameTimer();
            }
        }

        // Converts tile coords to the jQuery objects they represent
        function tileCoordsToJQuery(row, col) {
            var rowClass = ".row-" + row.toString(),
                colClass = ".col-" + col.toString();

            return $([rowClass, colClass].join(" "));
        }

        function swapTiles(clickedTile, blankTile) {
            var clickedOrder = clickedTile.css("order"),
                blankOrder = blankTile.css("order"),
                clickedOffset = clickedTile.offset(),
                blankOffset = blankTile.offset(),
                tileLength = clickedTile.width(),
                newX,
                newY,
                clickedAnim,
                blankAnim,
                animLength = 250;

            if (clickedOffset.left != blankOffset.left) {
                newX = (clickedOffset.left < blankOffset.left) ? tileLength : -tileLength;
            }

            if (clickedOffset.top != blankOffset.top) {
                newY = (clickedOffset.top < blankOffset.top) ? tileLength : -tileLength;
            }

            if (newX) {
                newX = newX.toString() + "px";
                clickedAnim = {"left": "+=" + newX};
                blankAnim = {"left": "-=" + newX}
            } else if (newY) {
                newY = newY.toString() + "px";
                clickedAnim = {"top": "+=" + newY};
                blankAnim = {"top": "-=" + newY}
            }

            clickedTile.animate(clickedAnim, {
                duration: animLength,
                queue: false,
                complete: function () {
                    clickedTile.css("order", blankOrder)
                               .css("left", "0px")
                               .css("top", "0px");
                }
            });
            blankTile.animate(blankAnim, {
                duration: animLength,
                queue: false,
                complete: function () {
                    if (newY) {
                        var swapParent = blankTile.parent();
                        blankTile.detach()
                                 .appendTo(clickedTile.parent());
                        clickedTile.detach()
                                   .appendTo(swapParent);
                    }

                    // Swap the orders in the flex layout in order to be able
                    // to reset the relative positions on the element
                    blankTile.css("order", clickedOrder)
                             .css("left", "0px")
                             .css("top", "0px");

                    // Swap the row/col data attached to the tiles
                    var swapRow = blankTile.data("row"),
                        swapCol = blankTile.data("col");

                    blankTile.data("row", clickedTile.data("row"))
                             .data("col", clickedTile.data("col"));

                    clickedTile.data("row", swapRow)
                               .data("col", swapCol);

                    // Update the classes of the tiles
                    blankTile.removeClass().addClass("tile blank col-" + blankTile.data("col").toString());
                    clickedTile.removeClass().addClass("tile col-" + swapCol.toString());

                    // All done. Unlock the grid.
                    gridLocked= false;
                }
            });
        }

        // Ends the game and checks for achievement conditions
        function gameOver() {
            runGameTimer(true);
            var timeTaken = getGameTimeElapsed(),
                currentBestTime = getBestTime(),
                currentBestMoves = getBestMoves(),
                newBestTime = false,
                newBestMoves = false;

            if (timeTaken < currentBestTime) {
                newBestTime = true;
                setBestTime(timeTaken);
            }

            if (currentNumMoves < currentBestMoves) {
                newBestMoves = true;
                setBestMoves(currentNumMoves);
            }

            // Save our progress if any stats changed
            if (newBestTime || newBestMoves) {
                saveSettings(currentSettings);
            }

            // Display solved dialogue
            showGameOverModal(timeTaken, newBestTime, newBestMoves);
        }

        // Creates our game over modal and adds appropriate content, then shows the modal.
        function showGameOverModal(timeTaken, newBestTime, newBestMoves) {
            var modal = fromTemplate(gameOverTemplate),
                modalBody = modal.find('.modal-body'),
                timeText = (newBestTime) ? fromTemplate(newBestTimeTemplate) : fromTemplate(timeTakenTemplate),
                movesText = (newBestMoves) ? fromTemplate(newBestMovesTemplate) : fromTemplate(numMovesTemplate);

            timeText.find(".time-taken")
                    .text(timeTaken.toString());

            movesText.find(".num-moves")
                     .text(currentNumMoves.toString());

            modalBody.append(timeText)
                     .append(movesText);

            $("body").append(modal);

            modal.modal({
                backdrop: 'static'
            });
            modal.modal('show');
        }

        // Convenience function that creates a jQuery object from a template
        function fromTemplate(jQTemplate) {
            return $([]).add(jQTemplate[0].innerHTML);
        }

        // Starts/Stops the game timer.
        function runGameTimer(stopTimer) {
            var key = (stopTimer) ? "end" : "start";
            gameTime[key] = Date.now();
        }

        // Calculates the time elapsed during the game.
        function getGameTimeElapsed() {
            return (gameTime.end - gameTime.start) / 1000;
        }

        function getBestTime() {
            return currentSettings.bestTime[currentSettings.gridSize.toString()];
        }

        function getBestMoves() {
            return currentSettings.bestMoves[currentSettings.gridSize.toString()];
        }

        function setBestTime(val) {
            currentSettings.bestTime[currentSettings.gridSize.toString()] = val;
        }

        function setBestMoves(val) {
            currentSettings.bestMoves[currentSettings.gridSize.toString()] = val;
        }

        function getSettings() {
            return JSON.parse(localStorage.getItem(STORAGE_PATH));
        }

        function saveSettings(settings) {
            if (settings) {
                localStorage.setItem(STORAGE_PATH, JSON.stringify(settings));
            }
        }

        this.showOptions = function showOptions() {
            var modal = fromTemplate(optionsTemplate),
                disabledSizes = getDisabledGridSizes();

            $("body").append(modal);
            modal.find("#grid-size-selector")
                 .val(currentSettings.gridSize.toString());

            if (disabledSizes.length !== 0) {
                modal.find("#grid-sizes-disabled")
                    .addClass("force-show");
            }

            for (i = MIN_GRID_SIZE; i <= MAX_GRID_SIZE; i++) {
                if (disabledSizes.indexOf(i) !== -1) {
                    modal.find("#grid" + i.toString())
                         .prop("disabled", "disabled")
                         .addClass("disabled alert-danger");
                }
            }

            modal.modal({
                backdrop: 'static'
            });
            modal.modal('show');
        };

        function getDisabledGridSizes() {
            var screenWidth = $(window).width(),
                screenHeight = $(window).height(),
                // Get available width OUTSIDE of the MIN_SCREEN_WIDTH
                widthIncreases = Math.floor((screenWidth - MIN_SCREEN_WIDTH) / MIN_TILE_DIMEN),
                // The percentage of the height occupied by the header and footer (in decimal form)
                screenHeightOccupied = (screenWidth >= FOOTER_DISAPPEARS_AT) ? 0.125 : 0.25,
                // Get the available height OUTSIDE of the grid (square, so you can just us MIN_SCREEN_WIDTH), while
                // also taking into account the header and footer (if applicable).
                heightIncreases = Math.floor(
                    ((screenHeight - MIN_SCREEN_WIDTH) - (screenHeight * screenHeightOccupied)) / MIN_TILE_DIMEN
                ),
                maxIncrease = Math.min(widthIncreases, heightIncreases),
                disabled = [];

            maxIncrease = (maxIncrease < 0) ? 0 : maxIncrease;

            for (var i = MIN_GRID_SIZE; i <= MAX_GRID_SIZE; i++) {
                if (!(i <= defaults.gridSize + maxIncrease)) {
                    disabled.push(i);
                }
            }

            return disabled;
        }

        this.applyOptions = function applyOptions() {
            var modal = $(OPTIONS),
                gridSizeSelected = $(GRID_SIZE_SELECTOR).val(),
                // The + operator before the variable returns a numeric representation of the variable
                gridSize = +gridSizeSelected || currentSettings.gridSize,
                clearAchievements = (modal.find(CLEAR_ACHIEVEMENTS_CHECKED).length > 0),
                resetNeeded = false;

            modal.modal('hide');

            if (gridSize !== currentSettings.gridSize) {
                currentSettings.gridSize = gridSize;
                resetNeeded = true;
            }

            if (clearAchievements) {
                currentSettings.bestTime = defaults.bestTime;
                currentSettings.bestMoves = defaults.bestMoves;
                resetNeeded = true;
            }

            if (resetNeeded) {
                saveSettings(currentSettings);
                reset();
            }
        };

        this.showHelp = function showHelp() {
            var modal = fromTemplate(helpTemplate);

            $("body").append(modal);

            modal.modal({
                backdrop: 'static'
            });
            modal.modal('show');
        };

        if (runningTests) {
            this.runGameTimer = runGameTimer;
            this.getGameTimeElapsed = getGameTimeElapsed;
            this.saveSettings = saveSettings;
            this.getSettings = getSettings;
        }

        reset();
    }

    // TODO: Remove for production!
    if (runningTests) {
        $ = function (val) { return val; };
        arrangeTiles.Grid = require('./arrangeTiles.Grid.js').Grid;
        numMoves = {'text': function () {}};
    }

    // TESTING PURPOSES ONLY
    if (runningTests)  {
        exports.Game = arrangeTilesGame;
    } else {
        // Only call global init in browser.
        globalInit();
    }

    return arrangeTilesGame;

})();