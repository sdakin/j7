define([], function()
{
    "use strict";

    // initVal is the actual visible value of the cell (1-based)
    function OldCell(initVal) {
        this.$ui = $(".boardcell[data-val='" + (initVal) + "']");
        this.val = initVal;
    }

    OldCell.prototype.isBonus = function() {
        return this.$ui.hasClass("bonuscell");
    };

    OldCell.prototype.isPlayed = function() {
        return this.$ui.hasClass("playedcell");
    };

    OldCell.prototype.setBonus = function(flag) {
        this.setPenalty(false);
        if (flag === undefined || flag === true)
            this.$ui.addClass("bonuscell");
        else
            this.$ui.removeClass("bonuscell");
    };

    OldCell.prototype.setPenalty = function(flag) {
        if (flag === undefined || flag === true)
            this.$ui.addClass("penaltycell");
        else
            this.$ui.removeClass("penaltycell");
    };

    OldCell.prototype.setValid = function(flag) {
        if (flag === undefined || flag === true)
            this.$ui.addClass("validcell");
        else
            this.$ui.removeClass("validcell");
    };

    return OldCell;
});
