define(['utils'], function(utils) {

    /**
     * TransitionProperty(property, from, to[, arg1[, arg2 [, arg3[, arg4]]]])
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
     *
     * @constructor
     */
    function TransitionProperty() {
        var i, argument, obj,
            timeRegExp = /[-+]?\d+(?:.\d+)(?:s|ms)/i,
            durationSet = false;

        if (arguments.length === 1) {
            obj = arguments[0];
            this.property = obj.property;
            this.from = obj.from;
            this.to = obj.to;
            this.duration = (typeof obj.duration === "string" && timeRegExp.test(obj.duration)) ? obj.duration : null;
            this.delay = (typeof obj.delay === "string" && timeRegExp.test(obj.delay)) ? obj.delay : null;
            this.timingFunction = (typeof obj.timingFunction === "string") ? obj.timingFunction : null;
            this.onTransitionEnd = (typeof obj.onTransitionEnd === "function") ? obj.onTransitionEnd : null;
        } else if (arguments.length >= 3) {
            this.property = arguments[0];
            this.from = arguments[1];
            this.to = arguments[2];
            this.duration = null;
            this.delay = null;
            this.timingFunction = null;
            this.onTransitionEnd = null;
            for (i = 3; i < arguments.length; i++) {
                argument = arguments[i];
                if (typeof argument === "string") {
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
                } else if (typeof argument === "function") {
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

    Transition.finishTransitioningPropertiesIfExist = function(element, properties) {
        var i, j, transitions, transition, transitioningPropertyNames;

        if (!element.hasOwnProperty("_transitions") || element._transitions.length === 0) {
            return;
        }

        transitions = element._transitions;
        for (i = 0; i < transitions.length; i++) {
            transition = transitions[i];
            transitioningPropertyNames = [];
            for (j = 0; j < properties.length; j++) {
                if (transition.hasTransitioningProperty(properties[j].cssProperty)) {
                    transitioningPropertyNames.push(properties[j].cssProperty);
                }
            }
            if (transitioningPropertyNames.length) {
                transition.allPropertiesWereFinished = false;
                transition.finishTransitioningProperties(element, transitioningPropertyNames);
            }
        }
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

        Transition.finishTransitioningPropertiesIfExist(element, options.properties);
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

            cssProperties =   transitionPropertyCSS.split(commaRegExp);
            durations =       transitionDurationCSS       ? transitionDurationCSS.split(commaRegExp)       : ["0s"];
            delays =          transitionDelayCSS          ? transitionDelayCSS.split(commaRegExp)          : ["0s"];
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
                transitions;

            transitions = Transition.getElementTransitions(element);

            for (i = 0; i < this.properties.length; i++) {
                property = this.properties[i];
                element.style[property.domProperty] = property.from;
                transitions.cssProperties.push(property.cssProperty);
                transitions.durations.push(property.duration || this.duration);
                transitions.delays.push(property.delay || this.delay);
                transitions.timingFunctions.push(property.timingFunction || this.timingFunction);
                this.transitioningPropertyNames.push(property.cssProperty);
            }

            // Trigger reflow
            // noinspection BadExpressionStatementJS
            element.offsetHeight;

            if (typeof this.onBeforeChangeStyle === "function") {
                this.onBeforeChangeStyle(element);
            }

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
                if (typeof this.onAfterChangeStyle === "function") {
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

        finishTransitioningProperty: function(element, propertyName) {
            var index, transitions, property, onTransitionEnd;

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
            if (typeof property.onTransitionEnd === "function") {
                onTransitionEnd = property.onTransitionEnd;
                utils.executeInNextEventLoop(function() {
                    onTransitionEnd(element, true);
                });
            }

            if (this.transitioningPropertyNames.length === 0) {
                this.removeTransitionEndListener(element, false);
            }
        },

        finishTransitioningProperties: function(element, propertyNames) {
            var i, index, propertyName, transitions, property;

            transitions = Transition.getElementTransitions(element);

            for (i = 0; i < propertyNames.length; i++) {
                propertyName = propertyNames[i];

                index = this.transitioningPropertyNames.indexOf(propertyName);
                if (index < 0) {
                    throw "[Transition.finishTransitioningProperties]: Transition does not have transitioning property '" + propertyName + "'";
                }
                this.transitioningPropertyNames.splice(index, 1);

                index = transitions.cssProperties.indexOf(propertyName);
                if (index < 0) {
                    throw "[Transition.removeTransitionProperty]: Did not find transitionProperty '" + propertyName + "'";
                }
                transitions.cssProperties.splice(index, 1);
                transitions.durations.splice(index, 1);
                transitions.delays.splice(index, 1);
                transitions.timingFunctions.splice(index, 1);

                property = this.getPropertyByCssProperty(propertyName);
                if (typeof property.onTransitionEnd === "function") {
                    (function(onTransitionEnd) {
                        utils.executeInNextEventLoop(function() {
                            onTransitionEnd(element, false);
                        });
                    })(property.onTransitionEnd);
                }
            }

            Transition.setElementTransitions(element, transitions);

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

            if (typeof this.onTransitionEnd === "function") {
                if (useNewExecutionContext) {
                    utils.executeInNextEventLoop(function() {
                        this.onTransitionEnd.call(undefined, element, this.allPropertiesWereFinished);
                    }, this);
                } else {
                    this.onTransitionEnd.call(undefined, element, this.allPropertiesWereFinished);
                }
            }
        }
    };

    return {
        TransitionProperty: TransitionProperty,
        transition: Transition.transition
    };

});