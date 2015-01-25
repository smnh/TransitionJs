define(['utils'], function(utils) {

    function Transition(options) {
        if (!options || !options.properties) {
            throw "Transition: 'properties' is a required option";
        }

        options = utils.defaults(options, Transition.defaultOptions);
        this.properties = options.properties;
        this.duration = options.duration;
        this.delay = options.delay;
        this.onTransitionEnd = options.onTransitionEnd;
        this.onBeforeChangeStyle = options.onBeforeChangeStyle;
        this.onAfterChangeStyle = options.onAfterChangeStyle;
        this.transitioningPropertyNames = [];
        this.allPropertiesWereFinished = true;
    }

    Transition.defaultOptions = {
        duration: '400ms',
        delay: '0s',
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
                if (transition.hasTransitioningProperty(properties[j].cssPropertyName)) {
                    transitioningPropertyNames.push(properties[j].cssPropertyName);
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
     * @param {Function} options.onBeforeChangeStyle
     * @param {Function} options.onAfterChangeStyle
     * @param {Function} options.onTransitionEnd
     */
    Transition.transition = function(element, options) {
        var transition, i;

        for (i = 0; i < options.properties.length; i++) {
            options.properties[i].domPropertyName = utils.supportedCssProperty(options.properties[i].propertyName);
            options.properties[i].cssPropertyName = utils.domToCSS(options.properties[i].domPropertyName);
        }

        Transition.finishTransitioningPropertiesIfExist(element, options.properties);
        transition = new Transition(options);
        transition.beginTransition(element);
    };

    Transition.prototype = {

        constructor: Transition,

        beginTransition: function(element) {
            var i, property,
                transitionProperties = [],
                transitionDurations = [],
                transitionDelays = [];

            for (i = 0; i < this.properties.length; i++) {
                property = this.properties[i];
                element.style[property.domPropertyName] = property.start + (property.unit ? property.unit : "");
                transitionProperties.push(property.cssPropertyName);
                transitionDurations.push(property.duration || this.duration);
                transitionDelays.push(property.delay || this.delay);
                this.transitioningPropertyNames.push(property.cssPropertyName);
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

                element.style[utils.transitionProperty] = transitionProperties.join(", ");
                element.style[utils.transitionDuration] = transitionDurations.join(", ");
                element.style[utils.transitionDelay] = transitionDelays.join(", ");

                for (i = 0; i < this.properties.length; i++) {
                    property = this.properties[i];
                    element.style[property.domPropertyName] = property.end + (property.unit ? property.unit : "");
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

        finishTransitioningProperty: function(element, propertyName) {
            var index,
                transitionPropertyCSS,
                transitionDurationCSS,
                transitionDelayCSS,
                transitionProperties,
                transitionDurations,
                transitionDelays;

            index = this.transitioningPropertyNames.indexOf(propertyName);
            if (index < 0) {
                throw "[Transition.finishTransitioningProperty]: Transition does not have transitioning property '" + propertyName + "'";
            }
            this.transitioningPropertyNames.splice(index, 1);

            transitionPropertyCSS = element.style[utils.transitionProperty];
            transitionDurationCSS = element.style[utils.transitionDuration];
            transitionDelayCSS = element.style[utils.transitionDelay];

            transitionProperties = transitionPropertyCSS.split(/\s*,\s*/);
            transitionDurations = transitionDurationCSS.split(/\s*,\s*/);
            transitionDelays = transitionDelayCSS.split(/\s*,\s*/);

            index = transitionProperties.indexOf(propertyName);
            if (index < 0) {
                throw "[Transition.removeTransitionProperty]: Did not find transitionProperty '" + propertyName + "'";
            }

            transitionProperties.splice(index, 1);
            transitionDurations.splice(index, 1);
            transitionDelays.splice(index, 1);

            element.style[utils.transitionProperty] = transitionProperties.join(", ");
            element.style[utils.transitionDuration] = transitionDurations.join(", ");
            element.style[utils.transitionDelay] = transitionDelays.join(", ");

            if (this.transitioningPropertyNames.length === 0) {
                this.removeTransitionEndListener(element, false);
            }
        },

        finishTransitioningProperties: function(element, propertyNames) {
            var i, index, propertyName,
                transitionPropertyCSS,
                transitionDurationCSS,
                transitionDelayCSS,
                transitionProperties,
                transitionDurations,
                transitionDelays;

            transitionPropertyCSS = element.style[utils.transitionProperty];
            transitionDurationCSS = element.style[utils.transitionDuration];
            transitionDelayCSS = element.style[utils.transitionDelay];

            transitionProperties = transitionPropertyCSS.split(/\s*,\s*/);
            transitionDurations = transitionDurationCSS.split(/\s*,\s*/);
            transitionDelays = transitionDelayCSS.split(/\s*,\s*/);

            for (i = 0; i < propertyNames.length; i++) {
                propertyName = propertyNames[i];

                index = this.transitioningPropertyNames.indexOf(propertyName);
                if (index < 0) {
                    throw "[Transition.finishTransitioningProperties]: Transition does not have transitioning property '" + propertyName + "'";
                }
                this.transitioningPropertyNames.splice(index, 1);

                index = transitionProperties.indexOf(propertyName);
                if (index < 0) {
                    throw "[Transition.removeTransitionProperty]: Did not find transitionProperty '" + propertyName + "'";
                }
                transitionProperties.splice(index, 1);
                transitionDurations.splice(index, 1);
                transitionDelays.splice(index, 1);
            }

            element.style[utils.transitionProperty] = transitionProperties.join(", ");
            element.style[utils.transitionDuration] = transitionDurations.join(", ");
            element.style[utils.transitionDelay] = transitionDelays.join(", ");

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
            var index, self = this;

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
                    window.setTimeout(function() {
                        self.onTransitionEnd(element, self.allPropertiesWereFinished);
                    }, 0);
                } else {
                    this.onTransitionEnd(element, self.allPropertiesWereFinished);
                }
            }
        }
    };

    return {
        transition: Transition.transition
    };

});