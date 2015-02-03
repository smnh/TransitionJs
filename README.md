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

```JavaScript
transition.transition(element, transitionOptions)
```

Begins CSS transitions on properties defined in transitionOptions of the specified element.

### `transitionOptions` object

- `properties`: Array of `TransitionProperty` instances
- `duration`: Default `transition-duration` for properties that do not specify their `duration`. Default is `400ms`.
- `delay`: Default `transition-delay` for properties that do not specify their `delay`. Default is `0s`.
- `timingFunction`: Default `transition-timing-function` for properties that do not specify their `timingFunction`. Default is `ease`.
- `continueFromCurrentValue`: Default `continueFromCurrentValue` for properties that do not specify their own value. Default is `false`.
- `onBeforeChangeStyle`: A function that will be called on [before-change style](http://www.w3.org/TR/css3-transitions/#before-change-style) [style change event](http://www.w3.org/TR/css3-transitions/#style-change-event).
- `onAfterChangeStyle`: A function that will be called on [after-change style](http://www.w3.org/TR/css3-transitions/#after-change-style) [style change event](http://www.w3.org/TR/css3-transitions/#style-change-event).
- `onTransitionEnd`: A function that will be invoked when all of the `properties` have finished their transitions. It is invoked with two arguments. The first is the element on which the transition was made. And the second is a boolean flag specifying if the transition was finished naturally (by firing `transitionend` event) or by another transition which began transitioning one of the properties that were already being transitioned by the current transition.

### `TransitionProperty` class

This class may be instantiated in two ways:

#### Passing an argument list

```JavaScript
new transition.TransitionProperty(property, from, to[, arg1[, arg2 [, arg3[, arg4]]]])
```

The `argN` arguments are used as `transition-delay`, `transition-duration`, `transition-timing-function` and `onTransitionEnd` callback.

The first `argN` value that can be parsed as a [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time) is assigned to the `transition-duration`, and the second value that can be parsed as a [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time) is assigned to `transition-delay`. Otherwise, if the `argN` value can't be parsed as a [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time), then if it is a string it is assigned to `transition-timing-function`, otherwise, if it is a function it will be used as `onTransitionEnd` callback which is invoked when the property have finished its transition.

#### Passing an options object

```JavaScript
new transition.TransitionProperty(options)
```

- `options.property`: String specifying the property name in camelCase (required)
- `options.from`: String or number specifying the initial property value (required)
- `options.to`: String or number specifying the final property value (required)
- `options.duration`: The [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time) assigned to the `transition-duration` (optional)
- `options.delay`: The [`time`](https://developer.mozilla.org/en-US/docs/Web/CSS/time) assigned to the `transition-delay` (optional)
- `options.timingFunction`: String specifying the `transition-timing-function` (optional)
- `options.continueFromCurrentValue`: If set to `true` when a transition is in-flight, the current property value of the in-flight transition is used as the starting value for the new transition. If set to `false` or not specified, the in-flight transition ends before the new transition begins using the `form` property value as the starting value. This flag is ignored if there is no in-flight transition. If not specified, the `continueFromCurrentValue` property of the transition is used. (optional)
- `options.onTransitionEnd`: Function which is invoked when the property have finished its transition (optional)

The options object may be used directly in `properties` array, then it will be transformed to `TransitionProperty` automatically.

As with the `transitionOptions`, the `onTransitionEnd` function will be invoked with two arguments, the transitioned element, and a boolean value indicating if the property have finished its transition naturally (by firing `transitionend` event) or not (e.g.: as a consequence of a new transition that began transitioning this property while it was already being transitioned by an in-flight transition).
