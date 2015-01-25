# TransitionJs
A JavaScript utility for creating CSS transitions

## Usage

```JavaScript
var disappearTransition = {
    properties: [{
        propertyName: "opacity",
        start: 1,
        end: 0
    }, {
        propertyName: "transform",
        start: "scale(1)",
        end: "scale(0.5)"
    }],
    duration: "400ms",
    onTransitionEnd: function(element) {
        element.style.display = "none";
    }
};
transition.transition(element, disappearTransition);
```
