requirejs.config({
    baseUrl: 'scripts',
    paths: {
        lib: '../../lib',
        src: '../../src',
        utils: '../../src/utils',
        transition: '../../transition'
    }
});

require([
    'bubbles',
    'slider'
], function(bubbles, Slider) {

    new Slider();

});