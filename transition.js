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
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.transition = factory();
    }
}(this, function() {
/**
 * @license almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../lib/almond", function(){});

define('utils',[],function() {
    
    var transEndEventNames,
        supportedCssProperty,
        supportedCssPropertyHash = {},
        hasTransition,
        transitionProperty,
        transitionDuration,
        transitionDelay,
        transitionTimingFunction,
        transitionEndEvent,
        capsRegExp = /[A-Z]/g,
        firstCapRegExp = /^[A-Z]/,
        dashRegExp = /-([a-z])/g,
        msRegExp = /^ms-/,
        eventLoopCallbacks = [];

    transEndEventNames = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'msTransition': 'MSTransitionEnd',
        'transition': 'transitionend'
    };
    
    supportedCssProperty = (function() {
        var div = document.createElement('div'),
            prefixes = ['Webkit', 'Moz', 'O', 'ms', 'Khtml'],
            firstCharRegExp = /^[a-z]/,
            len = prefixes.length;
    
        return function(property) {
            var i, prefixedProperty, upperCaseProperty;

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
    
    hasTransition = supportedCssProperty('transition') !== null;
    transitionProperty = supportedCssProperty('transitionProperty');
    transitionDuration = supportedCssProperty('transitionDuration');
    transitionDelay = supportedCssProperty('transitionDelay');
    transitionTimingFunction = supportedCssProperty('transitionTimingFunction');
    transitionEndEvent = transEndEventNames[supportedCssProperty('transition')];
    
    function replacementFunction(match) {
        return "-" + match.toLowerCase();
    }

    function executeEventLoopCallbacks() {
        var i, callbacks = eventLoopCallbacks.slice(), callback, func;
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
    
    return {
    
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
            var source, prop;
            for (var i = 1, length = arguments.length; i < length; i++) {
                source = arguments[i];
                for (prop in source) {
                    if (hasOwnProperty.call(source, prop)) {
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
            for (var i = 1, length = arguments.length; i < length; i++) {
                var source = arguments[i];
                for (var prop in source) {
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
            var type = typeof obj;
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
    
});
/*!
**  Thenable -- Embeddable Minimum Strictly-Compliant Promises/A+ 1.1.1 Thenable
**  Copyright (c) 2013-2014 Ralf S. Engelschall <http://engelschall.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Source-Code distributed on <http://github.com/rse/thenable>
*/
!function(a,b,c){"function"==typeof define&&"undefined"!=typeof define.amd?define(b,function(){return c(a)}):"object"==typeof module&&"object"==typeof module.exports?module.exports=c(a):a[b]=function(){var d=a[b],e=c(a);return e.noConflict=function(){return a[b]=d,e},e}()}(this,"Thenable",function(){var a=0,b=1,c=2,d=function(b){return this instanceof d?(this.id="Thenable/1.0.7",this.state=a,this.fulfillValue=void 0,this.rejectReason=void 0,this.onFulfilled=[],this.onRejected=[],this.proxy={then:this.then.bind(this)},void("function"==typeof b&&b.call(this,this.fulfill.bind(this),this.reject.bind(this)))):new d(b)};d.prototype={fulfill:function(a){return e(this,b,"fulfillValue",a)},reject:function(a){return e(this,c,"rejectReason",a)},then:function(a,b){var c=this,e=new d;return c.onFulfilled.push(h(a,e,"fulfill")),c.onRejected.push(h(b,e,"reject")),f(c),e.proxy}};var e=function(b,c,d,e){return b.state===a&&(b.state=c,b[d]=e,f(b)),b},f=function(a){a.state===b?g(a,"onFulfilled",a.fulfillValue):a.state===c&&g(a,"onRejected",a.rejectReason)},g=function(a,b,c){if(0!==a[b].length){var d=a[b];a[b]=[];var e=function(){for(var a=0;a<d.length;a++)d[a](c)};"object"==typeof process&&"function"==typeof process.nextTick?process.nextTick(e):"function"==typeof setImmediate?setImmediate(e):setTimeout(e,0)}},h=function(a,b,c){return function(d){if("function"!=typeof a)b[c].call(b,d);else{var e;try{e=a(d)}catch(f){return void b.reject(f)}i(b,e)}}},i=function(a,b){if(a===b||a.proxy===b)return void a.reject(new TypeError("cannot resolve promise with itself"));var c;if("object"==typeof b&&null!==b||"function"==typeof b)try{c=b.then}catch(d){return void a.reject(d)}if("function"!=typeof c)a.fulfill(b);else{var e=!1;try{c.call(b,function(c){e||(e=!0,c===b?a.reject(new TypeError("circular thenable chain")):i(a,c))},function(b){e||(e=!0,a.reject(b))})}catch(d){e||a.reject(d)}}};return d});
define("Thenable", function(){});

define('transition',['./utils', 'Thenable'], function(utils, Thenable) {

    var timeRegExp = /[-+]?\d+(?:.\d+)?(?:s|ms)/i,
        transitionPropertyCommaRegExp = /\s*,\s*/,
        transitionTimingFunctionRegExpExec = /(?:\s*,)?\s*([^(,]+(?:\([^)]+\))?)/g;

    /**
     * TransitionProperty(property, from, to[, arg1[, arg2[, arg3[, arg4]]]])
     *
     * The argN arguments are used as transition-delay, transition-duration, transition-timing-function and
     * transitionend callback.
     *
     * The first argN value that can be parsed as a time is assigned to the transition-duration, and the second value
     * that can be parsed as a time is assigned to transition-delay.
     * Otherwise, if the argN value that can't be parsed as a time, then if it is a string it is assigned to
     * transition-timing-function, otherwise, if it is a function it is called from the transitionend event handler or
     * when property is restarted as a consequence of transition override.
     *
     * TransitionProperty(options)
     * options.property
     * options.from
     * options.to
     * options.duration: assigned to the transition-duration
     * options.delay: assigned to the transition-delay
     * options.timingFunction: assigned to the transition-timing-function
     * options.onTransitionEnd: called from the transitionend event handler
     * options.beginFromCurrentValue: boolean flag indicating whether transition of this property should continue
     *      another ongoing transition from its current value. If no other transition already transitions this property
     *      this flag is ignored.
     *
     * @constructor
     */
    function TransitionProperty() {
        var i, argument, obj = null, arr = null,
            durationSet = false;

        if (arguments.length === 1) {
            if (utils.isString(arguments[0])) {
                arr = arguments[0].split(" ");
            } else if (utils.isArray(arguments[0])) {
                arr = arguments[0];
            } else {
                obj = arguments[0];
            }
        } else {
            arr = arguments;
        }

        if (obj) {
            this.property = obj.property;
            this.from = obj.from;
            this.to = obj.to;
            this.duration = (utils.isString(obj.duration) && timeRegExp.test(obj.duration)) ? obj.duration : null;
            this.delay = (utils.isString(obj.delay) && timeRegExp.test(obj.delay)) ? obj.delay : null;
            this.timingFunction = (utils.isString(obj.timingFunction)) ? obj.timingFunction : null;
            this.onTransitionEnd = utils.isFunction(obj.onTransitionEnd) ? obj.onTransitionEnd : null;
            this.beginFromCurrentValue = utils.isBoolean(obj.beginFromCurrentValue) ? obj.beginFromCurrentValue : null;
        } else if (arr.length >= 3) {
            this.property = arr[0];
            this.from = arr[1];
            this.to = arr[2];
            this.duration = null;
            this.delay = null;
            this.timingFunction = null;
            this.onTransitionEnd = null;
            this.beginFromCurrentValue = null;
            for (i = 3; i < arr.length; i++) {
                argument = arr[i];
                if (utils.isString(argument)) {
                    if (timeRegExp.test(argument)) {
                        if (!durationSet) {
                            durationSet = true;
                            this.duration = argument;
                        } else {
                            this.delay = argument;
                        }
                    } else {
                        this.timingFunction = argument;
                    }
                } else if (utils.isFunction(argument)) {
                    this.onTransitionEnd = argument;
                }
            }
        } else {
            throw "[TransitionProperty] Invalid number of arguments."
        }

        this.domProperty = utils.supportedCssProperty(this.property);
        this.cssProperty = utils.domToCSS(this.domProperty);
    }

    function Transition(properties, options) {
        if (!properties) {
            throw "Transition: 'properties' is a required parameter";
        }

        options = utils.defaults(options || {}, Transition.defaultOptions);
        this.properties = properties;
        this.duration = options.duration;
        this.delay = options.delay;
        this.timingFunction = options.timingFunction;
        this.onTransitionEnd = options.onTransitionEnd;
        this.thenable = new Thenable();
        this.onBeforeChangeStyle = options.onBeforeChangeStyle;
        this.onAfterChangeStyle = options.onAfterChangeStyle;
        this.beginFromCurrentValue = utils.isBoolean(options.beginFromCurrentValue) ? options.beginFromCurrentValue : false;
        this.toBeTransitionedPropertyNames = [];
        this.toBeTransitionedProperties = [];
        this.transitioningPropertyNames = [];
        this.transitioningProperties = [];
        this.allPropertiesWereFinished = true;
    }

    Transition.defaultOptions = {
        duration: '400ms',
        delay: '0s',
        timingFunction: 'ease',
        onTransitionEnd: null,
        onBeforeChangeStyle: null,
        onAfterChangeStyle: null
    };

    Transition.property = function(properties) {
        return new TransitionProperty(properties);
    };

    /**
     * Applies CSS transition on specified element using properties other transition related data specified in options.
     *
     * @param {HTMLElement} element
     * @param {Array|Object} properties
     * @param {Object} options
     * @param {String} options.duration
     * @param {String} options.delay
     * @param {String} options.timingFunction
     * @param {Function} options.onBeforeChangeStyle
     * @param {Function} options.onAfterChangeStyle
     * @param {Function} options.onTransitionEnd
     */
    Transition.begin = function(element, properties, options) {
        var transition, i, property, _properties = [];

        if (properties.hasOwnProperty("properties")) {
            options = properties;
            properties = properties["properties"];
        }

        if (utils.isString(properties)) {
            _properties.push(new TransitionProperty(properties));
        } else if (utils.isArray(properties)) {
            // properties == [ ... ]
            if (utils.isString(properties[0]) && properties[0].indexOf(" ") === -1) {
                // properties == ['opacity', '0', '1', ...]
                _properties.push(new TransitionProperty(properties));
            } else {
                for (i = 0; i < properties.length; i++) {
                    property = properties[i];
                    if (utils.isArray(property) || !(property instanceof TransitionProperty)) {
                        // properties == [ ["opacity 0 1"], [ ... ], ... ]
                        // properties == [ ["opacity", 0, 1], [ ... ], ... ]
                        // properties == [ {property: "opacity", from: 0, to: 1}, { ... }, ... ]
                        property = new TransitionProperty(property);
                    }
                    // If not above, then property is instance of TransitionProperty
                    // properties == [new TransitionProperty("opacity", 0, 1)]
                    _properties.push(property);
                }
            }
        } else {
            // properties == { ... }
            if ("property" in properties) {
                // properties == { property: "opacity", from: 0, to: 1 }
                property = new TransitionProperty(properties);
                _properties.push(property);
            } else {
                for (property in properties) {
                    if (properties.hasOwnProperty(property)) {
                        if (utils.isArray(properties[property])) {
                            // properties == { "opacity": [0, 1], ... }
                            property = [property].concat(properties[property]);
                            property = new TransitionProperty(property);
                        } else {
                            // properties == { "opacity": {from: 0, to: 1}, ... }
                            property = utils.defaults({"property": property}, properties[property]);
                            property = new TransitionProperty(property);
                        }
                        _properties.push(property);
                    }
                }
            }
        }

        transition = new Transition(_properties, options);
        transition.beginTransition(element);

        return {
            then: transition.thenable.proxy.then,
            pause: function() {
                transition.pause();
            },
            remove: function() {
                transition.remove();
            }
        };
    };

    Transition.getElementTransitionValues = function(element) {
        var i,
            transitionPropertyCSS,
            transitionDurationCSS,
            transitionDelayCSS,
            transitionTimingFunctionCSS,
            cssProperties = [],
            durations = [],
            delays = [],
            timingFunctions = [],
            regExpResult,
            cssPropertiesLength,
            durationsLength,
            delaysLength,
            timingFunctionsLength;

        transitionPropertyCSS = element.style[utils.transitionProperty];

        // If the element has no specified properties in transition-property then do not get the rest of transition-*
        // properties and leave them empty. Otherwise, get the rest of transition-* properties and fill them to the
        // length of transition-property by repeating their values. Do we really need this?
        // https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Using_CSS_transitions#When_property_value_lists_are_of_different_lengths
        if (transitionPropertyCSS) {

            transitionDurationCSS = element.style[utils.transitionDuration];
            transitionDelayCSS = element.style[utils.transitionDelay];
            transitionTimingFunctionCSS = element.style[utils.transitionTimingFunction];

            cssProperties   = transitionPropertyCSS.split(transitionPropertyCommaRegExp);
            durations       = transitionDurationCSS ? transitionDurationCSS.split(transitionPropertyCommaRegExp) : ["0s"];
            delays          = transitionDelayCSS    ? transitionDelayCSS.split(transitionPropertyCommaRegExp)    : ["0s"];

            if (!transitionTimingFunctionCSS) {
                timingFunctions = ["ease"];
            } else {
                timingFunctions = [];
                while (regExpResult = transitionTimingFunctionRegExpExec.exec(transitionTimingFunctionCSS) !== null) {
                    timingFunctions.push(regExpResult[1])
                }
            }

            cssPropertiesLength = cssProperties.length;
            durationsLength = durations.length;
            delaysLength = delays.length;
            timingFunctionsLength = timingFunctions.length;

            for (i = 0; i < cssPropertiesLength; i++) {
                if (durationsLength <= i) {
                    durations.push(durations[i % durationsLength]);
                }
                if (delaysLength <= i) {
                    delays.push(delays[i % delaysLength]);
                }
                if (timingFunctionsLength <= i) {
                    timingFunctions.push(timingFunctions[i % timingFunctionsLength]);
                }
            }
        }

        return {
            cssProperties: cssProperties,
            durations: durations,
            delays: delays,
            timingFunctions: timingFunctions
        }
    };

    Transition.setElementTransitionValues = function(element, transitions) {
        element.style[utils.transitionProperty] = transitions.cssProperties.join(", ");
        element.style[utils.transitionDuration] = transitions.durations.join(", ");
        element.style[utils.transitionDelay] = transitions.delays.join(", ");
        element.style[utils.transitionTimingFunction] = transitions.timingFunctions.join(", ");
    };

    Transition.prototype = {

        constructor: Transition,

        beginTransition: function(element) {
            var i, property;

            this.finishTransitioningPropertiesIfExist(element);

            // Must ensure that all transition properties have "from" values. Otherwise we wouldn't be able to check
            // if a property has equal "from" and "to" values and not to transition them. Their "transitionend" event
            // wouldn't be called anyway.
            for (i = 0; i < this.properties.length; i++) {
                property = this.properties[i];
                if (!utils.isString(property.from) && !utils.isNumber(property.from)) {
                    property.from = window.getComputedStyle(element, null).getPropertyValue(property.cssProperty);
                }
            }

            for (i = 0; i < this.properties.length; i++) {
                property = this.properties[i];
                if (property.from == property.to) {
                    element.style[property.domProperty] = property.to;
                    this.executeOnTransitionEndForProperty(property, element, true);
                } else {
                    element.style[property.domProperty] = property.from;
                    this.toBeTransitionedPropertyNames.push(property.cssProperty);
                    this.toBeTransitionedProperties.push(property);
                }
            }

            if (utils.isFunction(this.onBeforeChangeStyle)) {
                this.onBeforeChangeStyle(element);
            }

            if (this.toBeTransitionedProperties.length === 0) {
                if (utils.isFunction(this.onAfterChangeStyle)) {
                    this.onAfterChangeStyle(element);
                }
                this.executeOnTransitionEnd(element, true);
                return;
            }

            // Trigger reflow
            // noinspection BadExpressionStatementJS
            element.offsetHeight;

            this.addTransitionEndListener(element);

            utils.executeInNextEventLoop(function() {
                var transitionValues, i, property;

                // If other transition began after this one in the same event loop, they could cause
                // toBeTransitionedProperties of this transition to be removed and thus end this transition.
                // No need to call "onAfterChangeStyle" and "removeTransitionEndListener" as they were already called
                // from "finishToBeTransitionedProperties".
                if (this.toBeTransitionedProperties.length === 0) {
                    return;
                }

                // Trigger reflow
                // noinspection BadExpressionStatementJS
                // element.offsetHeight;
                // this.beforeChangeStyle(element)

                // from http://www.w3.org/TR/css3-transitions/#starting
                // when one of these ‘transition-*’ properties changes at the same time as a property whose change might
                // transition, it is the new values of the ‘transition-*’ properties that control the transition.

                transitionValues = Transition.getElementTransitionValues(element);
                for (i = 0; i < this.toBeTransitionedProperties.length; i++) {
                    property = this.toBeTransitionedProperties[i];
                    transitionValues.cssProperties.push(property.cssProperty);
                    transitionValues.durations.push(property.duration || this.duration);
                    transitionValues.delays.push(property.delay || this.delay);
                    transitionValues.timingFunctions.push(property.timingFunction || this.timingFunction);
                }
                this.transitioningPropertyNames = this.toBeTransitionedPropertyNames;
                this.transitioningProperties = this.toBeTransitionedProperties;
                this.toBeTransitionedPropertyNames = [];
                this.toBeTransitionedProperties = [];
                Transition.setElementTransitionValues(element, transitionValues);

                for (i = 0; i < this.transitioningProperties.length; i++) {
                    property = this.transitioningProperties[i];
                    element.style[property.domProperty] = property.to;
                }

                // Trigger reflow
                // noinspection BadExpressionStatementJS
                // element.offsetHeight;
                if (utils.isFunction(this.onAfterChangeStyle)) {
                    this.onAfterChangeStyle(element);
                }

            }, this);

        },

        pause: function() {
            // TODO
        },

        remove: function() {
            // TODO
        },

        handleEvent: function(event) {
            // Compare event.target to event.currentTarget to ensure that this event is targeted to this element and
            // not one of its descendants elements that also listen to this event, and then bubbled up.
            // Because an element can have multiple transitions at once, check that the css property this event related
            // to is one of the transitioning properties of this transition.
            if (event.target === event.currentTarget && this.hasTransitioningProperty(event.propertyName)) {
                this.finishTransitioningProperty(event.currentTarget, event.propertyName);
            }
        },

        hasTransitioningProperty: function(propertyName) {
            return this.transitioningPropertyNames.indexOf(propertyName) >= 0;
        },

        removeTransitioningProperty: function(propertyName) {
            var property, index;
            index = this.transitioningPropertyNames.indexOf(propertyName);
            if (index < 0) {
                throw "[Transition.removeTransitioningProperty]: Transition does not have transitioning property '" + propertyName + "'";
            }
            this.transitioningPropertyNames.splice(index, 1);
            this.transitioningProperties.splice(index, 1);
        },

        hasToBeTransitionedProperty: function(propertyName) {
            return this.toBeTransitionedPropertyNames.indexOf(propertyName) >= 0;
        },

        removeToBeTransitionedProperty: function(propertyName) {
            var index;
            index = this.toBeTransitionedPropertyNames.indexOf(propertyName);
            if (index < 0) {
                throw "[Transition.removeToBeTransitionedProperty]: Transition does not have toBeTransitionedProperty '" + propertyName + "'";
            }
            this.toBeTransitionedPropertyNames.splice(index, 1);
            this.toBeTransitionedProperties.splice(index, 1);
        },

        getPropertyByPropertyName: function(propertyName) {
            var i;
            for (i = 0; i < this.properties.length; i++) {
                if (this.properties[i].cssProperty === propertyName) {
                    return this.properties[i];
                }
            }
            throw "[Transition.getPropertyByPropertyName]: Transition does not have property '" + propertyName + "'";
        },

        finishTransitioningProperty: function(element, propertyName) {
            var index, transitionValues, property;

            this.removeTransitioningProperty(propertyName);

            transitionValues = Transition.getElementTransitionValues(element);

            index = transitionValues.cssProperties.indexOf(propertyName);
            if (index < 0) {
                throw "[Transition.finishTransitioningProperty]: Did not find transitionProperty '" + propertyName + "'";
            }
            transitionValues.cssProperties.splice(index, 1);
            transitionValues.durations.splice(index, 1);
            transitionValues.delays.splice(index, 1);
            transitionValues.timingFunctions.splice(index, 1);

            Transition.setElementTransitionValues(element, transitionValues);

            property = this.getPropertyByPropertyName(propertyName);
            this.executeOnTransitionEndForProperty(property, element, true);

            if (this.transitioningProperties.length === 0) {
                this.removeTransitionEndListener(element, false);
            }
        },

        finishTransitioningPropertiesIfExist: function(element) {
            var i, j, transitionValues, transitions, transition, transitioningProperties, toBeTransitionedProperties,
                found = false;

            if (!element.hasOwnProperty("_transitions") || element._transitions.length === 0) {
                return;
            }

            transitionValues = Transition.getElementTransitionValues(element);
            transitions = element._transitions.slice(); // _transitions array may be changed inside this loop
            for (i = 0; i < transitions.length; i++) {
                transition = transitions[i];
                transitioningProperties = [];
                toBeTransitionedProperties = [];
                for (j = 0; j < this.properties.length; j++) {
                    if (transition.hasTransitioningProperty(this.properties[j].cssProperty)) {
                        transitioningProperties.push(this.properties[j]);
                    } else if (transition.hasToBeTransitionedProperty(this.properties[j].cssProperty)) {
                        toBeTransitionedProperties.push(this.properties[j]);
                    }
                }
                if (transitioningProperties.length) {
                    found = true;
                    transition.allPropertiesWereFinished = false;
                    transition.finishTransitioningProperties(element, transitioningProperties, transitionValues, this.beginFromCurrentValue);
                } else if (toBeTransitionedProperties.length) {
                    transition.allPropertiesWereFinished = false;
                    transition.finishToBeTransitionedProperties(element, toBeTransitionedProperties, this.beginFromCurrentValue);
                }
            }

            // Apply new transition values if some element transitions values were removed
            if (found) {
                Transition.setElementTransitionValues(element, transitionValues);
            }
        },

        finishTransitioningProperties: function(element, properties, transitionValues, beginFromCurrentValue) {
            var i, index, newProperty, oldProperty, propertyName;

            for (i = 0; i < properties.length; i++) {
                newProperty = properties[i];
                propertyName = newProperty.cssProperty;

                this.removeTransitioningProperty(propertyName);
                this.updateFromToCurrentValueIfNeeded(element, newProperty, beginFromCurrentValue);

                index = transitionValues.cssProperties.indexOf(propertyName);
                if (index < 0) {
                    throw "[Transition.finishTransitioningProperties]: Did not find transitionProperty '" + propertyName + "'";
                }
                transitionValues.cssProperties.splice(index, 1);
                transitionValues.durations.splice(index, 1);
                transitionValues.delays.splice(index, 1);
                transitionValues.timingFunctions.splice(index, 1);

                oldProperty = this.getPropertyByPropertyName(propertyName);
                this.executeOnTransitionEndForProperty(oldProperty, element, false);
            }

            if (this.transitioningProperties.length === 0) {
                this.removeTransitionEndListener(element, true);
            }
        },

        finishToBeTransitionedProperties: function(element, properties, beginFromCurrentValue) {
            var i, newProperty, oldProperty, propertyName;

            for (i = 0; i < properties.length; i++) {
                newProperty = properties[i];
                propertyName = newProperty.cssProperty;

                this.removeToBeTransitionedProperty(propertyName);
                this.updateFromToCurrentValueIfNeeded(element, newProperty, beginFromCurrentValue);

                oldProperty = this.getPropertyByPropertyName(propertyName);
                this.executeOnTransitionEndForProperty(oldProperty, element, false);
            }

            if (this.toBeTransitionedProperties.length === 0) {
                if (utils.isFunction(this.onAfterChangeStyle)) {
                    this.onAfterChangeStyle(element);
                }
                this.removeTransitionEndListener(element, true);
            }
        },

        updateFromToCurrentValueIfNeeded: function(element, property, beginFromCurrentValue) {
            var isBoolean = utils.isBoolean(property.beginFromCurrentValue);
            if (isBoolean && property.beginFromCurrentValue || !isBoolean && beginFromCurrentValue) {
                property.from = window.getComputedStyle(element, null).getPropertyValue(property.cssProperty);
            }
        },

        addTransitionEndListener: function(element) {
            if (!element.hasOwnProperty("_transitions")) {
                element._transitions = [];
            }

            element._transitions.push(this);
            element.addEventListener(utils.transitionEndEvent, /** @type EventListener */ this, false);
        },

        removeTransitionEndListener: function(element, useNewExecutionContext) {
            var index;

            if (!element.hasOwnProperty("_transitions")) {
                throw "element does not have own _transitions property";
            }

            index = element._transitions.indexOf(this);
            if (index < 0) {
                throw "Can't remove non existing transition from an element";
            }

            element._transitions.splice(index, 1);
            element.removeEventListener(utils.transitionEndEvent, /** @type EventListener */ this, false);

            this.executeOnTransitionEnd(element, useNewExecutionContext);
        },

        executeOnTransitionEndForProperty: function(property, element, finished) {
            var onTransitionEnd;
            if (utils.isFunction(property.onTransitionEnd)) {
                onTransitionEnd = property.onTransitionEnd;
                utils.executeInNextEventLoop(function() {
                    onTransitionEnd(element, finished);
                });
            }
        },

        executeOnTransitionEnd: function(element, useNewExecutionContext) {
            var onTransitionEnd;
            if (utils.isFunction(this.onTransitionEnd)) {
                onTransitionEnd = this.onTransitionEnd;
                if (useNewExecutionContext) {
                    utils.executeInNextEventLoop(function() {
                        onTransitionEnd(element, this.allPropertiesWereFinished);
                    }, this);
                } else {
                    onTransitionEnd(element, this.allPropertiesWereFinished);
                }
            }
            this.thenable.fulfill(this.allPropertiesWereFinished);
        }

    };

    return {
        TransitionProperty: TransitionProperty,
        property: Transition.property,
        transition: Transition.begin,
        begin: Transition.begin
    };

});
return requirejs('transition');
}));