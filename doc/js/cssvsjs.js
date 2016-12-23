requirejs.config({
    baseUrl: 'js',
    paths: {
        underscore: 'underscore',
        jquery: 'jquery-2.1.4.min'
    }
});

define([
    'underscore',
    'transition.min',
    'jquery'
], function(_, transition, $) {

    function doWork(time) {
        if (!time) {
            time = Date.now();
        }

        if (Date.now() - time > 500) {
            return;
        }

        var t = Date.now();
        var s = new Array(1000).join(".");
        for (var i=0; i < 3000; i++) {
            s.split(".").join(".");
        }
        console.log(Date.now() - t);

        window.setTimeout(function() {
            doWork(time);
        }, 0)
    }

    function runAnimations() {
        var $jqRect = $("#jqRect"),
            tjsRect = document.getElementById("tjsRect");

        $jqRect.css("left", "0");
        $jqRect.animate({
            left: 400
        }, {
            duration: 500,
            easing: "linear"
        });

        transition.begin(tjsRect, {
           property: "left",
           from: "0",
           to: "400px",
           duration: "500ms",
           timingFunction: "linear"
        });

        //window.setTimeout(function() {
        //    doWork();
        //}, 0);
    }

    document.getElementById("runButton").addEventListener("click", function() {
        runAnimations();
    }, false);

});
