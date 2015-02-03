define([
    'underscore',
    'src/transition'
], function(_, transition) {

    function Bubbles() {
        var i, bubble, fragment;

        this.el = document.createElement("div");
        this.el.className = "bubbles";
        this.bubbles = [];
        this.bubblesCount = 10;
        fragment = document.createDocumentFragment();


        for (i = 0; i < this.bubblesCount; i++) {
            bubble = document.createElement("div");
            bubble.className = "bubble";
            bubble.setAttribute("data-bubble-index", String(i));
            this.bubbles.push(bubble);
            fragment.appendChild(bubble);
        }

        this.el.appendChild(fragment);
        document.body.appendChild(this.el);
        this.animateBubbles();
    }

    _.extend(Bubbles.prototype, {

        animateBubbles: function() {
            var fadeInTransition, fadeOutTransition, count = 0, self = this;

            function fadeIn(bubble) {
                transition.transition(bubble, fadeInTransition);
            }

            function fadeOut(element, finished) {
                if (finished) {
                    transition.transition(element, fadeOutTransition);
                }
            }

            fadeInTransition = {
                properties: [
                    new transition.TransitionProperty("opacity", 0, 1),
                    new transition.TransitionProperty("transform", "scale(0.5)", "scale(1)")
                ],
                duration: "400ms",
                onTransitionEnd: fadeOut
            };

            fadeOutTransition = {
                properties:[
                    new transition.TransitionProperty("opacity", 1, 0),
                    new transition.TransitionProperty("transform", "scale(1)", "scale(0.5)")
                ],
                duration: "400ms"
            };

            window.setInterval(function() {
                var bubble = self.bubbles[count++ % self.bubbles.length];
                fadeIn(bubble);
            }, 100);
        }

    });

    return Bubbles;
});