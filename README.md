# TransitionJs
A JavaScript library that provides a convenient way to create CSS transitions pragmatically.  

- Correctly cleans and restarts CSS transition properties while calling their `onTransitionEnd` callbacks.
- Correctly adds new transitions to an element with already running transitions.
- Provides the onTransitionEnd callback that is called not only when the transition was finished, but also when the transition was halted. For example, when a transition was manually stopped (not yet implemented) or another transition with the same transition property started on the same element.
- All transitions scheduled in the same JavaScript execution context stack will be started together and in a separate execution context stack.
- Supports AMD and Global scope inclusion.

Visit [http://transitionjs.org](http://transitionjs.org) for more info and examples.

## Basic Usage

Following code fades out an element by transitioning its `opacity` from `1` to `0` and its `scale` from `1` to `0.5`. Both properties transitioned with a duration of 400 milliseconds. After transition finishes, the element's `display` is set to `none`.

```JavaScript
transition.begin(element, [
        "opacity 1 0",
        "transform scale(1) scale(0.5)"
    ], {
        // Duration of 400ms is used both for opacity and transform
        duration: "400ms",
        onTransitionEnd: function(element, finished) {
            // if transition will be halted in the middle, finished will equal to false
            if (finished) {
                // If the transition was finished naturally, hide the element.
                element.style.display = "none";
            }
        }
    }
);
```

## API

```JavaScript
transition.begin(element, properties[, options])
```

The `begin` method applies CSS transition effect on the passed `element` using the passed `properties` that define the transition effect.

### Parameters

`element` - The element on which the CSS transition effect will be applied.

`properties` - The transition properties of a single or multiple CSS transitions. This parameter can take several forms:

* Array: `[propertyName, fromValue, toValue[, duration, timingFunction, delay, onTransitionEnd]]`  
example: `["opacity", "0", "1", "1s", "linear", "0s", onTransitionEndCallback]`  
Array of transition properties and transition values. The first three values are required and must be specified in the following order: a CSS transition property name, a value to transition "from" and a value to transition "to". The rest of the values (duration, delay, timing function and onTransitionEnd callback) are optional and their order conforms to the CSS [transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition) property specification: the first value that can be parsed as a time is assigned to the transition-duration, and the second value that can be parsed as a time is assigned to transition-delay.
* String: `` `${propertyName} ${fromValue} ${toValue}[ ${duration} ${timingFunction} ${delay}]` ``  
Example: `"opacity 0 1 1s linear 0s"`  
String with space separated transition properties and transition values. The order and the requirements of the values in this string must follow the same rules defined for the values specified inside an array. Due to its nature, this form does not allow specifying the `onTransitionEnd` callback.  
Note: some CSS properties (e.g.: transform) can themselves receive a space separated values such as `transform: translateX(200px) rotate(180deg);`. In this case, you should use the "Array" form.
* Object: `{property: "opacity", from: "0", to: "1"}`  
Using this form, you can specify all the properties you can specify using the array form (`property` name, `from` value, `to` value, `duration`, `delay`, `timingFunction` and `onTransitionEnd` callback). In addition, you can specify the `beginFromCurrentValue` flag. Visit [http://transitionjs.org](http://transitionjs.org) for more info and examples.
* Array of Arrays, Strings or Objects  
Array of Arrays, Strings or Objects, each specifying single transition property. This form allows transitioning multiple transition properties on a single element at once:  
`["opacity 0 1 1s", ["color", "red", "blue", "500ms"]]`

`options` - Transition options object with the following optional fields:

* `onTransitionEnd`  
A callback function that is called when all transition properties have finished their transitions. Receives two parameters, `element` and `finished`. The `finished` parameter will be `false` if the transition was stopped or one of the transitioned properties was used in a new transition.
* `onBeforeChangeStyle`  
A callback function that is called before the new CSS property value is applied to the element. This callback tries to mimic the [before-change style](http://www.w3.org/TR/css3-transitions/#before-change-style) event.
* `onAfterChangeStyle`  
A callback function that is called after the new CSS property value is applied to the element. This callback tries to mimic the [after-change style](http://www.w3.org/TR/css3-transitions/#after-change-style) event.
* `beginFromCurrentValue`  
Sets the default `beginFromCurrentValue` value for properties that do not specify their own `beginFromCurrentValue` value. See examples below for more info.
* `duration`  
Sets the default [transition-duration](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-duration) for the transition properties that do not specify their own duration. Default is `400ms`.
* `delay`  
Sets the default [transition-delay](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-delay) for the transition properties that do not specify their own delay. Default is `0s`.
* `timingFunction`  
Sets the default [transition-timing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) for the transition properties that do not specify their own timing-function. Default is `ease`.

### Returns

An object with a `promise` field holding a Promise that will be resolved when the transition ends. In a similar way to the `onFulfilled` callback, the promise resolves with an object having two fields: the animated `element` and the `finished` flag that indicating if the transition finished animating.

```JavaScript
transition.begin(element, "opacity 1 0 2s").promise.then(function(result) {
    // result.element - the animated element
    // result.finished - is the transition finished animating or was halted in the middle
});
```

## Advanced Usage Example

```JavaScript
function fadeOut(element) {
    // Don't let fade out transition to finish, begin fading-in again in the middle of fade-out transition.
    window.setTimeout(function() {
        fadeIn(element);
    }, 1000);
    transition.begin(element, "opacity 1 0 2s", {
        onTransitionEnd: function(element, finished) {
            // Because we called fadeIn from within setTimeout with 1s, the fade-in transition will be halted
            // in the middle and this callback will be invoked with finished set to "false".
            if (finished) {
                // This code never runs, because finished is false
                element.parentNode.removeChild(element);
            }
        }
    });
}

function fadeIn(element) {
    transition.begin(element, "opacity 0 1 2s", {
        // On successive runs, fadeIn is called from within setTimeout function while fade-out transition is running.
        // Setting beginFromCurrentValue to true makes sure the new fade-in transition will continue the effect from
        // the current opacity calue and not 0.
        beginFromCurrentValue: true,
        onBeforeChangeStyle: function(element) {
            // When fading-in for the first time, add the element to the DOM right after the
            // opacity is set to 0 but before transition properties are applied on the element. 
            if (!element.parentNode) {
                document.body.appendChild(element);
            }
        },
        onTransitionEnd: function(element, finished) {
            // Fade out the element right after it had finished fading in.
            fadeOut(element);
        }
    });
}

var element = document.createElement("div");
element.style.cssText = "position: absolute; top: 100px; left:100px; width: 100px; height: 100px; background: #ff0000";
fadeIn(element);
```
