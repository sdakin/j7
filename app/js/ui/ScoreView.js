define(["data/ScoreCounter"], function(ScoreCounter)
{
    "use strict";

    function ScoreView(initModel) {
        var self = this;

        self.model = initModel;
        self.$bonusUI = $("#openingBonus");
        self.$scoreUI = $("#scoreVal");

        self.model.addListener(ScoreCounter.OPENINGBONUS_CHANGED, function(e) {
            self.handleOpeningBonusChanged(e);
        });

        self.model.addListener(ScoreCounter.SCORE_CHANGED, function(e) {
            self.handleScoreChanged(e);
        });

        // force a firing of the two events we're listening for
        // to ensure the correct initial state
        self.handleOpeningBonusChanged({bonus:self.model.openingBonus});
        self.handleScoreChanged({score:self.model.score});
    }

    ScoreView.prototype.handleOpeningBonusChanged = function(event) {
        if (event.bonus) {
            this.$bonusUI.show();
        } else {
            this.$bonusUI.hide();
        }
    };

    ScoreView.prototype.handleScoreChanged = function(event) {
        this.$scoreUI.text(event.score);
    };

    return ScoreView;
});
