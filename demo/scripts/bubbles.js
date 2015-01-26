define([
    'lib/underscore',
    'src/transition'
], function(_, transition) {

    var bubblesElm = document.getElementById("bubbles"),
        bubbles = [],
        bubblesCount = 10;

    function createBubbles() {
        var i, bubble, fragment;

        fragment = document.createDocumentFragment();

        for (i = 0; i < bubblesCount; i++) {
            bubble = document.createElement("div");
            bubble.className = "bubble";
            bubble.setAttribute("data-bubble-index", String(i));
            bubbles.push(bubble);
            fragment.appendChild(bubble);
        }

        bubblesElm.appendChild(fragment);
    }

    function animateBubbles() {
        var fadeInTransition, fadeOutTransition, count = 0;

        function fadeIn(bubble) {
            //var bubble, i;
            //for (i = 0; i < 4; i++) {
            //    bubble = bubbles[count++ % bubbles.length];
            //    fadeInTransition.properties[0].delay = ((i % 4) * 100) + "ms";
            //    console.log("fadeIn ", bubble, " count = " + count);
            //    transition.transition(bubble, fadeInTransition, fadeOut);
            //}
            transition.transition(bubble, fadeInTransition);
//                .then(function(result) {
//                    fadeOut(result.element, result.finished);
//                });
        }

        function fadeOut(element, finished) {
            //console.log("fadeOut ", element);
            if (finished) {
                transition.transition(element, fadeOutTransition);
            }
            //if (parseInt(element.getAttribute("data-bubble-index"), 10) % 4 === 0) {
            //    fadeIn();
            //}
            //var bubble = bubbles[count++ % bubbles.length];
            //fadeIn(bubble);
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

        //fadeIn();
        
        //for (var i = 0; i < 4; i++) {
        //    window.setTimeout(function() {
        //        var bubble = bubbles[count++ % bubbles.length];
        //        fadeIn(bubble);
        //    }, 100 * i);
        //}

        window.setInterval(function() {
            var bubble = bubbles[count++ % bubbles.length];
            fadeIn(bubble);
        }, 100);
    }

    createBubbles();
    animateBubbles();

    return bubbles;
});