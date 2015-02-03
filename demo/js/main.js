requirejs.config({
    baseUrl: '../',
    paths: {
        underscore: 'lib/underscore'
    }
});

require([
    'demo/js/bubbles',
    'demo/js/slider',
    'demo/js/pulsation'
], function(Bubbles, Slider, Pulsation) {

    new Bubbles();
    new Slider();
    new Pulsation();

});