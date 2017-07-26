const utils = require('./utils');

if (typeof Promise === "undefined") {
    Promise = require("bluebird");
}

let timeRegExp = /[-+]?\d+(?:.\d+)?(?:s|ms)/i;
let transitionPropertyCommaRegExp = /\s*,\s*/;
let transitionTimingFunctionRegExpExec = /(?:\s*,)?\s*([^(,]+(?:\([^)]+\))?)/g;

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
    let i, argument, obj = null, arr = null,
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

TransitionProperty.prototype.executeOnTransitionEnd = function(element, finished) {
    if (utils.isFunction(this.onTransitionEnd)) {
        let onTransitionEnd = this.onTransitionEnd;
        utils.executeInNextEventLoop(function() {
            onTransitionEnd(element, finished);
        });
    }
};

TransitionProperty.prototype.setFromToCurrentValueIfNeeded = function(element, beginFromCurrentValue) {
    let isBoolean = utils.isBoolean(this.beginFromCurrentValue);
    if (isBoolean && this.beginFromCurrentValue || !isBoolean && beginFromCurrentValue) {
        this.from = window.getComputedStyle(element, null).getPropertyValue(this.cssProperty);
    }
};

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
    this.resolve = null;
    this.reject = null;
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
    let transition, i, property, _properties = [];

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
        promise: new Promise(function(resolve, reject) {
            transition.resolve = resolve;
            transition.reject = reject;
        }),
        pause: function() {
            transition.pause();
        },
        remove: function() {
            transition.remove();
        }
    };
};

/**
 * This function returns transition values for duration, delay and timing function of transition properties.
 *
 * For example, if an element has the following transition definition:
 *   transition-property: color, background-color, width;
 *   transition-duration: 1s, 400ms
 *   transition-delay: 2s
 *
 * Then the return value will be:
 * {
 *     cssProperties: ['color', 'background-color', 'width'],
 *     durations: ['1s', '400ms', '1s', '400ms'],
 *     delays: ['2s', '2s', '2s', '2s'],
 *     timingFunctions: ['ease', 'ease', 'ease', 'ease']
 * }
 *
 * In the case where the lists of values in transition properties do not have the same length, the length of the
 * transition-property list determines the number of items in each list examined when starting transitions.
 * The lists are matched up from the first value: excess values at the end are not used. If one of the other properties
 * doesn’t have enough comma-separated values to match the number of values of transition-property, the UA must
 * calculate its used value by repeating the list of values until there are enough. This truncation or repetition does
 * not affect the computed value.
 * https://drafts.csswg.org/css-transitions/#transitions
 *
 * @param element
 * @returns {{
 *      cssProperties: Array,
 *      durations: Array,
 *      delays: Array,
 *      timingFunctions: Array
 * }}
 */
Transition.getElementTransitionValues = function(element) {
    let i,
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
        let i, property;

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
            if (String(property.from) === String(property.to)) {
                element.style[property.domProperty] = property.to;
                property.executeOnTransitionEnd(element, true);
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
            let transitionValues, i, property;

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
        let index;
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
        let index;
        index = this.toBeTransitionedPropertyNames.indexOf(propertyName);
        if (index < 0) {
            throw "[Transition.removeToBeTransitionedProperty]: Transition does not have toBeTransitionedProperty '" + propertyName + "'";
        }
        this.toBeTransitionedPropertyNames.splice(index, 1);
        this.toBeTransitionedProperties.splice(index, 1);
    },

    getPropertyByPropertyName: function(propertyName) {
        let i;
        for (i = 0; i < this.properties.length; i++) {
            if (this.properties[i].cssProperty === propertyName) {
                return this.properties[i];
            }
        }
        throw "[Transition.getPropertyByPropertyName]: Transition does not have property '" + propertyName + "'";
    },

    finishTransitioningProperty: function(element, propertyName) {
        let index, transitionValues, property;

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
        property.executeOnTransitionEnd(element, true);

        if (this.transitioningProperties.length === 0) {
            this.removeTransitionEndListener(element, false);
        }
    },

    finishTransitioningPropertiesIfExist: function(element) {
        let i, j, transitionValues, transitions, transition, transitioningProperties, toBeTransitionedProperties,
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
        let i, index, newProperty, oldProperty, propertyName;

        for (i = 0; i < properties.length; i++) {
            newProperty = properties[i];
            propertyName = newProperty.cssProperty;

            this.removeTransitioningProperty(propertyName);
            newProperty.setFromToCurrentValueIfNeeded(element, beginFromCurrentValue);

            index = transitionValues.cssProperties.indexOf(propertyName);
            if (index < 0) {
                throw "[Transition.finishTransitioningProperties]: Did not find transitionProperty '" + propertyName + "'";
            }
            transitionValues.cssProperties.splice(index, 1);
            transitionValues.durations.splice(index, 1);
            transitionValues.delays.splice(index, 1);
            transitionValues.timingFunctions.splice(index, 1);

            oldProperty = this.getPropertyByPropertyName(propertyName);
            oldProperty.executeOnTransitionEnd(element, false);
        }

        if (this.transitioningProperties.length === 0) {
            this.removeTransitionEndListener(element, true);
        }
    },

    finishToBeTransitionedProperties: function(element, properties, beginFromCurrentValue) {
        let i, newProperty, oldProperty, propertyName;

        for (i = 0; i < properties.length; i++) {
            newProperty = properties[i];
            propertyName = newProperty.cssProperty;

            this.removeToBeTransitionedProperty(propertyName);
            newProperty.setFromToCurrentValueIfNeeded(element, beginFromCurrentValue);

            oldProperty = this.getPropertyByPropertyName(propertyName);
            oldProperty.executeOnTransitionEnd(element, false);
        }

        if (this.toBeTransitionedProperties.length === 0) {
            if (utils.isFunction(this.onAfterChangeStyle)) {
                this.onAfterChangeStyle(element);
            }
            this.removeTransitionEndListener(element, true);
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
        let index;

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

    executeOnTransitionEnd: function(element, useNewExecutionContext) {
        let onTransitionEnd;
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
        this.resolve({
            element: element,
            finished: this.allPropertiesWereFinished
        });
    }

};

module.exports = {
    TransitionProperty: TransitionProperty,
    property: Transition.property,
    transition: Transition.begin,
    begin: Transition.begin
};
