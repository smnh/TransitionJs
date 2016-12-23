let capsRegExp = /[A-Z]/g;
let firstCapRegExp = /^[A-Z]/;
let dashRegExp = /-([a-z])/g;
let msRegExp = /^ms-/;
let eventLoopCallbacks = [];
let supportedCssPropertyHash = {};
let transEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'oTransitionEnd',
    'msTransition': 'MSTransitionEnd',
    'transition': 'transitionend'
};

let supportedCssProperty = (function() {
    let div = document.createElement('div');
    let prefixes = ['Webkit', 'Moz', 'O', 'ms', 'Khtml'];
    let firstCharRegExp = /^[a-z]/;
    let len = prefixes.length;

    return function(property) {
        let i, prefixedProperty, upperCaseProperty;

        if (supportedCssPropertyHash.hasOwnProperty(property)) {
            return supportedCssPropertyHash[property];
        }

        // Check if W3C standard property is supported
        if (typeof div.style[property] !== "undefined") {
            supportedCssPropertyHash[property] = property;
            return property;
        }

        // Standard property is not supported, add vendor prefix and test for different vendors.
        upperCaseProperty = property.replace(firstCharRegExp, function(firstChar) {
            return firstChar.toUpperCase();
        });

        for (i = 0; i < len; i++) {
            prefixedProperty = prefixes[i] + upperCaseProperty;
            if (typeof div.style[prefixedProperty] !== "undefined") {
                supportedCssPropertyHash[property] = prefixedProperty;
                return prefixedProperty;
            }
        }

        return null;
    };
})();

let hasTransition = supportedCssProperty('transition') !== null;
let transitionProperty = supportedCssProperty('transitionProperty');
let transitionDuration = supportedCssProperty('transitionDuration');
let transitionDelay = supportedCssProperty('transitionDelay');
let transitionTimingFunction = supportedCssProperty('transitionTimingFunction');
let transitionEndEvent = transEndEventNames[supportedCssProperty('transition')];

function replacementFunction(match) {
    return "-" + match.toLowerCase();
}

function executeEventLoopCallbacks() {
    let i, callbacks = eventLoopCallbacks.slice(), callback, func;
    eventLoopCallbacks = [];
    for (i = 0; i < callbacks.length; i++) {
        callback = callbacks[i];
        func = callback.func;
        if (callback.context) {
            func.apply(callback.context);
        } else {
            func();
        }
    }
}

module.exports = {

    supportedCssProperty: supportedCssProperty,

    hasTransition: hasTransition,
    transitionProperty: transitionProperty,
    transitionDuration: transitionDuration,
    transitionDelay: transitionDelay,
    transitionTimingFunction: transitionTimingFunction,
    transitionEndEvent: transitionEndEvent,

    camelCaseToDashes: function(str) {
        return str.replace(capsRegExp, replacementFunction);
    },

    domToCSS: function(name) {
        return name.replace(capsRegExp, function(match) {
            return '-' + match.toLowerCase();
        }).replace(msRegExp, '-ms-');
    },

    cssToDOM: function(name) {
        return name.replace(dashRegExp, function(match, p1) {
            return p1.toUpperCase();
        }).replace(firstCapRegExp, function(match) {
            return match.toLowerCase();
        });
    },

    requestAnimationFrame: function(callback, context) {
        return window.requestAnimationFrame(function(timestamp) {
            if (context) {
                callback.apply(context, [timestamp]);
            } else {
                callback(timestamp);
            }
        }, null);
    },

    executeInNextEventLoop: function(func, context) {
        if (eventLoopCallbacks.length === 0) {
            window.setTimeout(executeEventLoopCallbacks, 0)
        }
        eventLoopCallbacks.push({
            func: func,
            context: context
        });
    },

    /**
     * Extend a given object with all the properties in passed-in object(s).
     * http://underscorejs.org/docs/underscore.html
     */
    extend: function(obj) {
        if (!this.isObject(obj)) return obj;
        let source, prop;
        for (let i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            for (prop in source) {
                if (source.hasOwnProperty(prop)) {
                    obj[prop] = source[prop];
                }
            }
        }
        return obj;
    },

    /**
     * Fill in a given object with default properties.
     * http://underscorejs.org/docs/underscore.html
     */
    defaults: function(obj) {
        if (!this.isObject(obj)) return obj;
        for (let i = 1, length = arguments.length; i < length; i++) {
            let source = arguments[i];
            for (let prop in source) {
                if (source.hasOwnProperty(prop)) {
                    if (obj[prop] === void 0) obj[prop] = source[prop];
                }
            }
        }
        return obj;
    },

    /**
     * Is a given variable an object?
     * http://underscorejs.org/docs/underscore.html
     */
    isObject: function(obj) {
        let type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    },

    isFunction: function(obj) {
        return typeof obj === 'function';
    },

    isString: function(obj) {
        return typeof obj === 'string';
    },

    isNumber: function(obj) {
        return typeof obj === 'number';
    },

    isBoolean: function(obj) {
        return typeof obj === 'boolean';
    },

    isArray: Array.isArray || function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
};
