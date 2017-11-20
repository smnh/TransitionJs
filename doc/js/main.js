requirejs.config({
    baseUrl: 'js',
    paths: {
        underscore: 'underscore.min'
    }
});

define([
    'underscore',
    'transition.min',
    'bezier.calc'
], function(_, transition, BezierCalc) {

    function Demos() {
        this.el = document.querySelector(".demos");

        this.logoRect = document.querySelector(".logo .rect");
        this.logoRectWrapper = document.querySelector(".logo .rectWrapper");

        this.bindRows();

        SyntaxHighlighter.defaults["gutter"] = false;
        SyntaxHighlighter.defaults["toolbar"] = false;
        SyntaxHighlighter.defaults["class-name"] = "code";
        SyntaxHighlighter.highlight();

        this.scheduleLogoAnimation();
    }

    _.extend(Demos.prototype, {

        scheduleLogoAnimation: function() {
            var self = this;
            window.setTimeout(function() {
                self.animateLogo();
            }, 5000);
        },

        cubicBezierToCSSTimingFunction: function(cubicBezier) {
            var c = cubicBezier;
            return "cubic-bezier(" + c.p1.x + "," + c.p1.y + "," + c.p2.x + "," + c.p2.y + ")";
        },

        animateLogo: function() {
            var self = this,
                duration = 1500,
                p0 = new BezierCalc.Point(0, 0),
                p1 = new BezierCalc.Point(0.4, -0.8),
                p2 = new BezierCalc.Point(0.6, 1.8),
                p3 = new BezierCalc.Point(1, 1),
                cubicBezier = new BezierCalc.BezierCurve(p0, p1, p2, p3),
                splitBezier = BezierCalc.splitBezierCurve(cubicBezier, 0.5),
                firstHalfCB = BezierCalc.normalizeBezierCurve(splitBezier[0]),
                secondHalfCB = BezierCalc.normalizeBezierCurve(splitBezier[1]),
                cubicBezierCSS, cubicBezierFirstHalfCSS, cubicBezierSecondHalfCSS;

            cubicBezier.p1.y = -0.4;
            cubicBezier.p2.y = 1.4;

            cubicBezierCSS = this.cubicBezierToCSSTimingFunction(cubicBezier);
            cubicBezierFirstHalfCSS = this.cubicBezierToCSSTimingFunction(firstHalfCB);
            cubicBezierSecondHalfCSS = this.cubicBezierToCSSTimingFunction(secondHalfCB);

            transition
                .begin(this.logoRectWrapper, ["transform", "scale(1.0)", "scale(1.2)", (duration / 2) + "ms", cubicBezierFirstHalfCSS])
                .promise.then(function() {
                    transition.begin(self.logoRectWrapper, ["transform", "scale(1.2)", "scale(1.0)", (duration / 2) + "ms", cubicBezierSecondHalfCSS]);
                });
            transition
                .begin(this.logoRect, [
                    ["transform", "rotate(0)", "rotate(360deg)", duration + "ms", cubicBezierCSS],
                    ["backgroundColor", "#ffffff", "#adb5c7", (duration / 2) + "ms", "ease-in-out", function() {
                        transition.begin(self.logoRect, ["backgroundColor", "#adb5c7", "#ffffff", (duration / 2) + "ms", "ease-in-out"]);
                    }]
                ])
                .promise.then(function() {
                    self.scheduleLogoAnimation();
                });
        },

        bindRows: function() {
            var rows = this.el.querySelectorAll(".row");

            _.each(rows, function(row) {
                var rect = row.querySelector(".rect"),
                    runButton = row.querySelector(".runButton"),
                    buttonSource = runButton.innerHTML,
                    funcSource = row.querySelector("pre").innerHTML;

                runButton.addEventListener("click", function() {
                    var func = new Function("element", "transition", funcSource + buttonSource);
                    func(rect, transition);
                }, false);
            });
        }

    });

    new Demos();

});
