define(['./utils'], function(utils) {

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
        var i, argument, obj,
            timeRegExp = /[-+]?\d+(?:.\d+)?(?:s|ms)/i,
            durationSet = false;

        if (arguments.length === 1) {
            obj = arguments[0];
            this.property = obj.property;
            this.from = obj.from;
            this.to = obj.to;
            this.duration = (utils.isString(obj.duration) && timeRegExp.test(obj.duration)) ? obj.duration : null;
            this.delay = (utils.isString(obj.delay) && timeRegExp.test(obj.delay)) ? obj.delay : null;
            this.timingFunction = (utils.isString(obj.timingFunction)) ? obj.timingFunction : null;
            this.onTransitionEnd = utils.isFunction(obj.onTransitionEnd) ? obj.onTransitionEnd : null;
            this.beginFromCurrentValue = utils.isBoolean(obj.beginFromCurrentValue) ? obj.beginFromCurrentValue : null;
        } else if (arguments.length >= 3) {
            this.property = arguments[0];
            this.from = arguments[1];
            this.to = arguments[2];
            this.duration = null;
            this.delay = null;
            this.timingFunction = null;
            this.onTransitionEnd = null;
            this.beginFromCurrentValue = null;
            for (i = 3; i < arguments.length; i++) {
                argument = arguments[i];
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

    function Transition(options) {
        if (!options || !options.properties) {
            throw "Transition: 'properties' is a required option";
        }

        options = utils.defaults(options, Transition.defaultOptions);
        this.properties = options.properties;
        this.duration = options.duration;
        this.delay = options.delay;
        this.timingFunction = options.timingFunction;
        this.onTransitionEnd = options.onTransitionEnd;
        this.onBeforeChangeStyle = options.onBeforeChangeStyle;
        this.onAfterChangeStyle = options.onAfterChangeStyle;
        this.beginFromCurrentValue = utils.isBoolean(options.beginFromCurrentValue) ? options.beginFromCurrentValue : true;
        this.transitioningPropertyNames = [];
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

    /**
     * Applies CSS transition on specified element using properties other transition related data specified in options.
     *
     * @param {HTMLElement} element
     * @param {Object} options
     * @param {Array} options.properties
     * @param {String} options.duration
     * @param {String} options.delay
     * @param {String} options.timingFunction
     * @param {Function} options.onBeforeChangeStyle
     * @param {Function} options.onAfterChangeStyle
     * @param {Function} options.onTransitionEnd
     */
    Transition.transition = function(element, options) {
        var transition, i, property;

        for (i = 0; i < options.properties.length; i++) {
            property = options.properties[i];
            if (!(property instanceof TransitionProperty)) {
                options.properties[i] = new TransitionProperty(property);
            }
        }

        transition = new Transition(options);
        transition.beginTransition(element);
    };

    Transition.getElementTransitions = function(element) {
        var i, commaRegExp = /\s*,\s*/,
            transitionPropertyCSS,
            transitionDurationCSS,
            transitionDelayCSS,
            transitionTimingFunctionCSS,
            cssProperties = [],
            durations = [],
            delays = [],
            timingFunctions = [],
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

            cssProperties   = transitionPropertyCSS.split(commaRegExp);
            durations       = transitionDurationCSS       ? transitionDurationCSS.split(commaRegExp)       : ["0s"];
            delays          = transitionDelayCSS          ? transitionDelayCSS.split(commaRegExp)          : ["0s"];
            timingFunctions = transitionTimingFunctionCSS ? transitionTimingFunctionCSS.split(commaRegExp) : ["ease"];

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

    Transition.setElementTransitions = function(element, transitions) {
        element.style[utils.transitionProperty] = transitions.cssProperties.join(", ");
        element.style[utils.transitionDuration] = transitions.durations.join(", ");
        element.style[utils.transitionDelay] = transitions.delays.join(", ");
        element.style[utils.transitionTimingFunction] = transitions.timingFunctions.join(", ");
    };

    Transition.prototype = {

        constructor: Transition,

        beginTransition: function(element) {
            var i, property,
                transitions, transitionsLength;

            transitions = Transition.getElementTransitions(element);

            transitionsLength = transitions.cssProperties.length;
            this.finishTransitioningPropertiesIfExist(element, transitions);
            // If some element transitions were removed, apply new style to prevent transition to old values until the next event loop.
            if (transitionsLength !== transitions.cssProperties.length) {
                Transition.setElementTransitions(element, transitions);
            }

            for (i = 0; i < this.properties.length; i++) {
                property = this.properties[i];
                if (!utils.isString(property.from) && !utils.isNumber(property.from)) {
                    property.from = window.getComputedStyle(element, null).getPropertyValue(property.cssProperty);
                }
            }

            for (i = 0; i < this.properties.length; i++) {
                property = this.properties[i];
                if (property.from == property.to) {
                    this.executeOnTransitionEndForProperty(property, element, true);
                    continue;
                }
                element.style[property.domProperty] = property.from;
                transitions.cssProperties.push(property.cssProperty);
                transitions.durations.push(property.duration || this.duration);
                transitions.delays.push(property.delay || this.delay);
                transitions.timingFunctions.push(property.timingFunction || this.timingFunction);
                this.transitioningPropertyNames.push(property.cssProperty);
            }

            if (utils.isFunction(this.onBeforeChangeStyle)) {
                this.onBeforeChangeStyle(element);
            }

            if (this.transitioningPropertyNames.length === 0) {
                for (i = 0; i < this.properties.length; i++) {
                    property = this.properties[i];
                    element.style[property.domProperty] = property.to;
                }
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
                // Trigger reflow
                // noinspection BadExpressionStatementJS
                // element.offsetHeight;
                // this.beforeChangeStyle(element)

                // from http://www.w3.org/TR/css3-transitions/#starting
                // when one of these ‘transition-*’ properties changes at the same time as a property whose change might
                // transition, it is the new values of the ‘transition-*’ properties that control the transition.

                Transition.setElementTransitions(element, transitions);

                for (i = 0; i < this.properties.length; i++) {
                    property = this.properties[i];
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

        handleEvent: function(event) {
            // Compare event.target to event.currentTarget in case the event was bubbled up to an ancestor element that
            // also listens to transition end event
            if (event.target === event.currentTarget) {
                this.finishTransitioningProperty(event.currentTarget, event.propertyName);
            }
        },

        hasTransitioningProperty: function(propertyName) {
            return this.transitioningPropertyNames.indexOf(propertyName) >= 0;
        },

        getPropertyByCssProperty: function(cssProperty) {
            var i;
            for (i = 0; i < this.properties.length; i++) {
                if (this.properties[i].cssProperty === cssProperty) {
                    return this.properties[i];
                }
            }
            throw "[Transition.getPropertyByCssProperty]: Transition does not have property '" + cssProperty + "'";
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

        finishTransitioningProperty: function(element, propertyName) {
            var index, transitions, property;

            index = this.transitioningPropertyNames.indexOf(propertyName);
            if (index < 0) {
                throw "[Transition.finishTransitioningProperty]: Transition does not have transitioning property '" + propertyName + "'";
            }
            this.transitioningPropertyNames.splice(index, 1);

            transitions = Transition.getElementTransitions(element);

            index = transitions.cssProperties.indexOf(propertyName);
            if (index < 0) {
                throw "[Transition.removeTransitionProperty]: Did not find transitionProperty '" + propertyName + "'";
            }

            transitions.cssProperties.splice(index, 1);
            transitions.durations.splice(index, 1);
            transitions.delays.splice(index, 1);
            transitions.timingFunctions.splice(index, 1);

            Transition.setElementTransitions(element, transitions);

            property = this.getPropertyByCssProperty(propertyName);
            this.executeOnTransitionEndForProperty(property, element, true);

            if (this.transitioningPropertyNames.length === 0) {
                this.removeTransitionEndListener(element, false);
            }
        },

        finishTransitioningPropertiesIfExist: function(element, elementTransitions) {
            var i, j, transitions, transition, transitioningProperties;

            if (!element.hasOwnProperty("_transitions") || element._transitions.length === 0) {
                return;
            }

            transitions = element._transitions;
            for (i = 0; i < transitions.length; i++) {
                transition = transitions[i];
                transitioningProperties = [];
                for (j = 0; j < this.properties.length; j++) {
                    if (transition.hasTransitioningProperty(this.properties[j].cssProperty)) {
                        transitioningProperties.push(this.properties[j]);
                    }
                }
                if (transitioningProperties.length) {
                    transition.allPropertiesWereFinished = false;
                    transition.finishTransitioningProperties(element, transitioningProperties, elementTransitions, this.beginFromCurrentValue);
                }
            }
        },

        finishTransitioningProperties: function(element, properties, transitions, beginFromCurrentValue) {
            var i, index, newProperty, oldProperty, cssProperty, isBoolean;

            for (i = 0; i < properties.length; i++) {
                newProperty = properties[i];
                cssProperty = newProperty.cssProperty;

                index = this.transitioningPropertyNames.indexOf(cssProperty);
                if (index < 0) {
                    throw "[Transition.finishTransitioningProperties]: Transition does not have transitioning property '" + cssProperty + "'";
                }
                this.transitioningPropertyNames.splice(index, 1);

                index = transitions.cssProperties.indexOf(cssProperty);
                if (index < 0) {
                    throw "[Transition.removeTransitionProperty]: Did not find transitionProperty '" + cssProperty + "'";
                }

                isBoolean = utils.isBoolean(newProperty.beginFromCurrentValue);
                if (isBoolean && newProperty.beginFromCurrentValue || !isBoolean && beginFromCurrentValue) {
                    newProperty.from = window.getComputedStyle(element, null).getPropertyValue(newProperty.cssProperty);
                }
                transitions.cssProperties.splice(index, 1);
                transitions.durations.splice(index, 1);
                transitions.delays.splice(index, 1);
                transitions.timingFunctions.splice(index, 1);

                oldProperty = this.getPropertyByCssProperty(cssProperty);
                this.executeOnTransitionEndForProperty(oldProperty, element, false);
            }

            if (this.transitioningPropertyNames.length === 0) {
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
        }
    };

    return {
        TransitionProperty: TransitionProperty,
        transition: Transition.transition
    };

});