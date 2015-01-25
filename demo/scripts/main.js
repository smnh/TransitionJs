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
    'bubbles'
], function(bubbles) {

});