define([], function()
{
    "use strict";

    function GameBoard() {
        this.$ui = $(".newBoard");
        this.cells = [[], [], []];

        var boardPos = this.$ui.position(), loc = {};
        for (var i = 0 ; i < 3 ; i++) {
            for (var j = 0 ; j < 7 ; j++) {
                var $newCell = $('<div class="cellMarker"></div>');
                this.cells[2 - i][j] = $newCell;
                this.$ui.append($newCell);
                loc.top = boardPos.top + (i * 45) + 1;
                loc.left = boardPos.left + (j * 45) + 1;
                $newCell.offset(loc);
            }
        }
    }

    GameBoard.prototype.setMarker = function(val, type) {
        if (val > 0 && val <= 21) {
            var row = Math.floor((val - 1) / 7), col = (val - 1) % 7;
            var $cell = this.cells[row][col];
            $cell.css("background-image", "url(/img/" + type + ".png)");
        }
    };

    return GameBoard;
});
