define([
    'underscore',
    'src/transition'
], function(_, transition) {

    function Tests() {
        this.el = document.createElement("div");
        this.el.className = "tests";

        document.body.appendChild(this.el);

        this.createRows();
    }

    _.extend(Tests.prototype, {

        createRows: function() {
            _.each(this.animations, function(animation) {
                if (animation.enabled) {
                    this.addRow(animation.animate);
                }
            }, this);
        },

        addRow: function(func) {
            var rowEl, rectEl, codeEl, runElm;

            rowEl = document.createElement("div");
            rowEl.className = "row";

            rectEl = document.createElement("div");
            rectEl.className = "rect";

            codeEl = document.createElement("div");
            codeEl.className = "code";
            codeEl.appendChild(document.createTextNode(this.getFunctionSource(func)));

            runElm = document.createElement("div");
            runElm.className = "runButton";
            runElm.appendChild(document.createTextNode("animate()"));
            runElm.addEventListener("click", function() {
                func(rectEl);
            }, false);

            rowEl.appendChild(rectEl);
            rowEl.appendChild(codeEl);
            rowEl.appendChild(runElm);
            this.el.appendChild(rowEl);
        },

        getFunctionSource: function(func) {
            var string, space, spaceRegExp;

            string = func.toString();
            space = string.match(/\n([^\n]*)}$/);
            if (space) {
                space = space[1];
                spaceRegExp = new RegExp("^" + space, 'mg');
                string = string.replace(spaceRegExp, "");
            }

            return string;
        },

        animations: [
            {
                enabled: true,
                title: "Basic animation",
                animate: function(element) {
                    transition.begin(element, ["background-color", "#ffffff", "#ADB5C7", "500ms", "linear"]);
                }
            },
            {
                enabled: true,
                title: "Multiple properties",
                animate: function(element) {
                    transition.begin(element, [
                        ["transform", "rotate(0)", "rotate(360deg)", "2000ms", "linear"],
                        ["background-color", "#ffffff", "#ADB5C7", "1000ms", "linear", function(element, finished) {
                            if (finished) {
                                transition.begin(element, ["background-color", "#ADB5C7", "#ffffff", "1000ms", "linear"]);
                            }
                        }]
                    ]);
                }
            },
            {
                enabled: true,
                title: "Multiple transitions",
                animate: function(element) {
                    transition.begin(element, ["transform", "rotate(0)", "rotate(360deg)", "2000ms", "linear"], {
                        onTransitionEnd: function(element, finished) {
                            if (finished) {
                                animate(element);
                            }
                        }
                    });
                    transition.begin(element, ["background-color", "#ffffff", "#ADB5C7", "1000ms", "linear"], {
                        onTransitionEnd: function(element, finished) {
                            if (finished) {
                                transition.begin(element, ["background-color", "#ADB5C7", "#ffffff", "1000ms", "linear"]);
                            }
                        }
                    });
                }
            }
        ]

    });

    return Tests;

});