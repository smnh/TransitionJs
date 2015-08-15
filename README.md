# TransitionJs
A JavaScript library that provides a convenient way to create CSS transitions pragmatically.  
Please visit [http://transitionjs.org](http://transitionjs.org) for more info.

## Usage

Fading out an element while scaling it down from x1 to x0.5

```JavaScript
transition.begin(element, ["opacity 1 0", "transform scale(1) scale(0.5)"], {
    duration: "400ms",
    onTransitionEnd: function(element, finished) {
        if (finished) {
            element.style.display = "none";
        }
    }
});
```

## API

```JavaScript
transition.begin(element, properties[, options])
```

`begin` method applies CSS transition effect on the passed element using the passed properties that define the transition effect.

### Parameters

`element` - The element on which the CSS transition effect will be applied

`properties` - The properties of a single or multiple CSS transitions.

`options` - optional object with the following optional fields

property name | description
--------------|------------
`duration` | Sets the default `transition-duration` for properties that do not specify their own `duration`. Default is `400ms`.  
`delay` | Sets the default `transition-delay` for properties that do not specify their own `delay`. Default is `0s`.  
`timingFunction` |Sets the default `transition-timing-function` for properties that do not specify their own `timingFunction`. Default is `ease`.
`beginFromCurrentValue` | Sets the default `beginFromCurrentValue` value for properties that do not specify their own `beginFromCurrentValue` value.
`onBeforeChangeStyle` | A callback function that is called before the new CSS property value is applied to the element. This callback tries to mimic the [before-change style](http://www.w3.org/TR/css3-transitions/#before-change-style) event.
`onAfterChangeStyle` | A callback function that is called after the new CSS property value is applied to the element. This callback tries to mimic the [after-change style](http://www.w3.org/TR/css3-transitions/#after-change-style) event.
`onTransitionEnd` | A callback function that is called when all transition properties have finished their transitions. Receives two parameters, `element` and `finished`. The `finished` parameter will be `false` if the transition was stopped or one of the transitioned properties was used in a new transition.

## Advanced Usage

```JavaScript
function fadeOut(element) {
    transition.begin(element, "opacity 1 0 2s", {
        onTransitionEnd: function(element, finished) {
            // finished will always be "false" because fadeIn transition begins before this transition finishes
            if (finished) {
                element.parentNode.removeChild(element);
            }
        }
    });
    // Begin fading-in in the middle of fade-out transition.
    window.setTimeout(function() {
        fadeIn(element);
    }, 1000);
}

function fadeIn(element) {
    transition.transition(element, "opacity 0 1 2s", {
        onBeforeChangeStyle: function(element) {
            // When fading-in for the first time, add the element to the DOM right after
            // opacity:0 is set and before transition properties are set. 
            if (!element.parentNode) {
                document.body.appendChild(element);
            }
        },
        onTransitionEnd: function(element, finished) {
            fadeOut(element);
        }
    });
}

var element = document.createElement("div");
element.style.cssText = "width: 100px; height: 100px; background: #ff0000";
fadeIn(element);
```
