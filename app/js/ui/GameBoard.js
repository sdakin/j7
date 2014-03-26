define(["ui/Cell"], function(Cell)
{
    "use strict";

    function GameBoard() {
        this.$ui = $(".newBoard");
        this.cells = [[], [], []];

        var boardPos = this.$ui.position(), loc = {};
        for (var i = 0 ; i < 3 ; i++) {
            for (var j = 0 ; j < 7 ; j++) {
                var val = (2 - i) * 7 + j + 1;
                var newCell = new Cell(val);
                this.cells[2 - i][j] = newCell;
                this.$ui.append(newCell.$ui);
                loc.top = boardPos.top + (i * 45) + 1;
                loc.left = boardPos.left + (j * 45) + 1;
                newCell.$ui.offset(loc);
            }
        }
    }

    GameBoard.prototype.clearBoard = function() {
        this.cells.forEach(function(cellRow) {
            cellRow.forEach(function(cell) {
                cell.reset();
            });
        });
    };

    GameBoard.prototype.getCell = function(val) {
        var $result = null;
        if (val > 0 && val <= 21) {
            var row = Math.floor((val - 1) / 7), col = (val - 1) % 7;
            $result = this.cells[row][col];
        }
        return $result;
    };

    GameBoard.prototype.clearValidCells = function() {
        var $validCells = $(".cellMarker.valid-Cell");
        $validCells.css("background-image", "");
        $validCells.removeClass("valid-cell");
    };

    GameBoard.prototype.playCell = function(val) {
        var cell = this.getCell(val);
        if (cell)
            cell.setPlayed();
    };

    GameBoard.prototype.setBonusCell = function(val) {
        var cell = this.getCell(val);
        if (cell)
            cell.setBonus();
    };

    GameBoard.prototype.setPenaltyCell = function(val) {
        var cell = this.getCell(val);
        if (cell)
            cell.setPenalty();
    };

    GameBoard.prototype.setValidCell = function(val) {
        var cell = this.getCell(val);
        if (cell && !cell.isPlayed()) {
            cell.setValid(true);
        }
    };

    return GameBoard;
});
