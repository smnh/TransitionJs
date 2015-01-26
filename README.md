# TransitionJs
A JavaScript utility for creating CSS transitions

## Usage

```JavaScript
var disappearTransition = {
    properties: [
        new transition.TransitionProperty("opacity", 1, 0),
        new transition.TransitionProperty("transform", "scale(1)", "scale(0.5)")
    ],
    duration: "400ms",
    onTransitionEnd: function(element, finished) {
        if (finished) {
            element.style.display = "none";
        }
    }
};
transition.transition(element, disappearTransition);
```

## API

### `transition` method

`transition.transition(element, transitionOptions)`

Begins CSS transitions on properties defined in transitionOptions of the specified element.

### `transitionOptions` object

- `properties`: Array of TransitionProperty instances
- `duration`: Default transition-duration for properties that do not specify duration
- `delay`: Default transition-delay for properties that do not specify delay
- `timingFunction`: Default transition-timing-function for properties that do not specify timingFunction
- `onTransitionEnd`: A function that will be invoked when all the `properties` finished their transitions. Invoked with two arguments. The first is the element on which the transition was made. And the second is a boolean value specifying if the transition was finished naturally (by firing `transitionend` event) or not. Which may be possible when creating another transition with one of the properties defined in this transition on the same element while this property is transitioning.

### `TransitionProperty` class

`TransitionProperty(property, from, to[, arg1[, arg2 [, arg3[, arg4]]]])`

The argN arguments are used as transition-delay, transition-duration, transition-timing-function and transitionend callback.

The first argN value that can be parsed as a time is assigned to the transition-duration, and the second value that can be parsed as a time is assigned to transition-delay. Otherwise, if the argN value that can't be parsed as a time, then if it is a string it is assigned to transition-timing-function, otherwise, if it is a function it is called from the `transitionend` event handler or when property transition was cancelled (e.g.: as a consequence of another transition with the same property)

`TransitionProperty(options)`

- `options.property`: the property name in camelCase (required)
- `options.from`: the initial property value (required)
- `options.to`: the final property value (required)
- `options.duration`: assigned to the transition-duration (optional)
- `options.delay`: assigned to the transition-delay (optional)
- `options.timingFunction`: assigned to the transition-timing-function (optional)
- `options.onTransitionEnd`: called from the `transitionend` event handler or when property transition was cancelled (e.g.: as a consequence of another transition with the same property) (optional)

The options object may be used directly in `properties` array, then it will be transformed to `TransitionProperty` automatically.

As with `transitionOptions`, the `onTransitionEnd` function will be invoked with two arguments, the transitioned element, and a boolean value indicating if the property finished its transition naturally (by firing `transitionend` event) or not.