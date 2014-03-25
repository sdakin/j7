define([], function()
{
    "use strict";

    function Cell(initVal) {
        this.$ui = $('<div class="cellMarker" data-val="' + initVal + '"></div>');
    }

    function setState(flag, $ui, img, className) {
    }

    Cell.prototype.isBonus = function() {
        return this.$ui.hasClass("bonus-cell");
    };

    Cell.prototype.isPlayed = function() {
        return this.$ui.hasClass("played-cell");
    };

    Cell.prototype.setBonus = function() {
        this.$ui.removeClass("valid-cell");
        this.$ui.removeClass("penalty-cell");
        this.$ui.css("background-image", "url(/img/bonus.png)");
        this.$ui.addClass("played-cell");
        this.$ui.addClass("bonus-cell");
    };

    Cell.prototype.setPlayed = function() {
        this.$ui.removeClass("valid-cell");
        this.$ui.css("background-image", "url(/img/played.png)");
        this.$ui.addClass("played-cell");
    };

    Cell.prototype.setPenalty = function() {
        this.$ui.removeClass("valid-cell");
        this.$ui.css("background-image", "url(/img/penalty.png)");
        this.$ui.addClass("played-cell");
        this.$ui.addClass("penalty-cell");
    };

    Cell.prototype.setValid = function(flag) {
        if (flag === undefined || flag === true) {
            this.$ui.css("background-image", "url(/img/valid.png)");
            this.$ui.addClass("valid-cell");
        }
        else {
            this.$ui.css("background-image", "");
            this.$ui.removeClass("valid-cell");
        }
    };

    return Cell;
});
