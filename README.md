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

- `properties`: Array of `TransitionProperty` instances
- `duration`: Default `transition-duration` for properties that do not specify duration
- `delay`: Default `transition-delay` for properties that do not specify delay
- `timingFunction`: Default `transition-timing-function` for properties that do not specify timingFunction
- `onTransitionEnd`: A function that will be invoked when all of the `properties` have finished their transitions. It is invoked with two arguments. The first is the element on which the transition was made. And the second is a boolean value specifying if the transition was finished naturally (by firing `transitionend` event) or not. Which may be possible when another transition begins transitioning one of the properties that is already being transitioned by the current transition on the same element.

### `TransitionProperty` class

This class may be instantiated in two ways:

#### Passing an argument list

`new transition.TransitionProperty(property, from, to[, arg1[, arg2 [, arg3[, arg4]]]])`

The `argN` arguments are used as `transition-delay`, `transition-duration`, `transition-timing-function` and `onTransitionEnd` callback.

The first `argN` value that can be parsed as a [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time) is assigned to the `transition-duration`, and the second value that can be parsed as a [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time) is assigned to `transition-delay`. Otherwise, if the `argN` value can't be parsed as a [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time), then if it is a string it is assigned to `transition-timing-function`, otherwise, if it is a function it will be used as `onTransitionEnd` callback which is invoked when the property have finished its transition.

#### Passing an options object

`new transition.TransitionProperty(options)`

- `options.property`: String specifying the property name in camelCase (required)
- `options.from`: String or number specifying the initial property value (required)
- `options.to`: String or number specifying the final property value (required)
- `options.duration`: The [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time) assigned to the `transition-duration` (optional)
- `options.delay`: The [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time) assigned to the `transition-delay` (optional)
- `options.timingFunction`: String specifying the `transition-timing-function` (optional)
- `options.onTransitionEnd`: Function which is invoked when the property have finished its transition (optional)

The options object may be used directly in `properties` array, then it will be transformed to `TransitionProperty` automatically.

As with the `transitionOptions`, the `onTransitionEnd` function will be invoked with two arguments, the transitioned element, and a boolean value indicating if the property have finished its transition naturally (by firing `transitionend` event) or not (e.g.: as a consequence of another transition that begin transitioning this property while it is already being transitioned).
