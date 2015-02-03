define([
    'underscore',
    'src/transition'
], function(_, transition) {

    function Pulsation() {
        this.el = document.createElement("div");
        this.el.className = "pulsation";
        this.fadeIn(this.el);
    }

    _.extend(Pulsation.prototype, {

        fadeOut: function(element) {
            var self = this;
            transition.transition(element, {
                properties: [
                    new transition.TransitionProperty("opacity", 1, 0, "2s")
                ],
                onTransitionEnd: function(element, finished) {
                    // finished will always be "false" because fadeIn transition begins before this transition finishes naturally
                    if (finished) {
                        element.parentNode.removeChild(element);
                    }
                }
            });
            // Begin fading-in in the middle of fade-out transition.
            window.setTimeout(function() {
                self.fadeIn(element);
            }, 1000);
        },

        fadeIn: function(element) {
            var self = this;
            transition.transition(element, {
                properties: [
                    new transition.TransitionProperty("opacity", 0, 1, "2s")
                ],
                onBeforeChangeStyle: function(element) {
                    // When fading-in for the first time, add the element to the DOM right after opacity:0 is set and
                    // before transition properties are set.
                    if (!element.parentNode) {
                        document.body.appendChild(element);
                    }
                },
                onTransitionEnd: function(element, finished) {
                    self.fadeOut(element);
                }
            });
        }
    });

    return Pulsation;

});