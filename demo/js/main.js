requirejs.config({
    baseUrl: '../',
    paths: {
        underscore: 'lib/underscore'
    }
});

require([
    'demo/js/bubbles',
    'demo/js/slider'
], function(Bubbles, Slider) {

    new Bubbles();
    new Slider();

});