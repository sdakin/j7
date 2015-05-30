define([], function()
{
    "use strict";

    function ScoreDetailsDlg() {
        var self = this;
        self.$dlg = $("#scoreDetailsDlg");
        self.$dlg.click(function() { self.hide(); });
    }

    ScoreDetailsDlg.prototype.hide = function() {
        this.$dlg.hide();
    };

    ScoreDetailsDlg.prototype.show = function(scores) {
        var $details = $("#scoreDetails");
        $details.empty();

        function addScore(scoreDescription, scoreVal, always) {
            if (scoreVal !== 0 || always) {
                var $line = '<div class="scoreLine">' +
                                '<div class="scoreDesc">' + scoreDescription + ' </div>' +
                                '<div class="scoreVal">' + scoreVal + '</div>' +
                            '</div>';
                $details.append($line);
            }
        }

        addScore("Lower row", scores.cells["lower row"], true);
        addScore("Middle row", scores.cells["middle row"], true);
        addScore("Upper row", scores.cells["upper row"], true);
        addScore("Opening 7's", scores.opening7s);
        addScore("Opening triples", scores.openingTriples);
        addScore("Triples", scores.triples);
        addScore("Up and downs", scores.upAndDowns);
        addScore("Acrosses", scores.acrosses);
        addScore("Unused bonuses", scores.unusedBonuses);
        addScore("13's", scores.thirteens);
        addScore("Opening 13's", scores.openingThirteens);

        this.$dlg.show();
    };

    return ScoreDetailsDlg;
});
