/**
 * @overview   Transition.js JavaScript wrapper for CSS transitions
 * @see https://github.com/smnh/TransitionJs
 * @copyright  Copyright (c) 2014 Simon Hanukaev
 * @license    Licensed under MIT license
 * @version    0.1.0
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.transition = factory();
    }
}(this, function() {
