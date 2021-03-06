define(["data/ScoreCounter"], function(ScoreCounter)
{
    "use strict";

    function ScoreView(initModel) {
        var self = this;

        self.model = initModel;
        self.$bonusUI = $("#openingBonus");
        self.$scoreUI = $("#scoreVal");
        self.$tickerUI = $(".tickerText");

        self.model.addListener(ScoreCounter.OPENINGBONUS_CHANGED, function(e) {
            self.handleOpeningBonusChanged(e);
        });

        self.model.addListener(ScoreCounter.SCORE_CHANGED, function(e) {
            self.handleScoreChanged(e);
        });

        self.model.addListener(ScoreCounter.SCORE_MESSAGE, function(e) {
            self.handleScoreMessage(e);
        });

        // force a firing of the two events we're listening for
        // to ensure the correct initial state
        self.handleOpeningBonusChanged({bonus:self.model.openingBonus});
        self.handleScoreChanged({score:self.model.score});
    }

    ScoreView.prototype.addTickerText = function(spinNum, text) {
        var self = this;
        if (spinNum != self.spinNum) {
            self.clear();
            self.spinNum = spinNum;
        }

        self.$tickerUI.append($('<div>' + text + '</div>'));
        var frameHeight = $(".tickerTextFrame").height(),
            textHeight = self.$tickerUI.height(), offset;
        if (textHeight < frameHeight)
            offset = (frameHeight - textHeight) / 2;
        else
            offset = frameHeight - textHeight;
        self.$tickerUI.css("top", offset);
    };

    ScoreView.prototype.clear = function() {
        this.$tickerUI.empty();
    };

    ScoreView.prototype.getScore = function() {
        return this.$scoreUI.text();
    };

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

    ScoreView.prototype.handleScoreMessage = function(event) {
        this.addTickerText(event.spinNum, event.msg);
    };

    return ScoreView;
});
