define([], function()
{
    "use strict";

    // initVal is the actual visible value of the cell (1-based)
    function Cell(initVal) {
    	this.$ui = $(".boardcell[data-val='" + (initVal) + "']");
    	this.val = initVal;
    }

    Cell.prototype.isBonus = function() {
        return this.$ui.hasClass("bonuscell");
    };

    Cell.prototype.isPlayed = function() {
        return this.$ui.hasClass("playedcell");
    };

    Cell.prototype.setBonus = function(flag) {
        if (flag === undefined || flag === true)
            this.$ui.addClass("bonuscell");
        else
            this.$ui.removeClass("bonuscell");
    };

    Cell.prototype.setValid = function(flag) {
        if (flag === undefined || flag === true)
            this.$ui.addClass("validcell");
        else
            this.$ui.removeClass("validcell");
    };

    return Cell;
});
