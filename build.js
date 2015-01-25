({
    baseUrl: "./src",
    name: "../lib/almond",
    include: ["transition"],
    out: "transition.min.js",
    wrap: {
        startFile: 'lib/start.frag',
        endFile: 'lib/end.frag'
    }
})