({
    baseUrl: "./src",
    name: "../lib/almond",
    include: ["transition"],
    out: "transition.min.js",
    generateSourceMaps: true,
    preserveLicenseComments: false,
    optimize: "uglify2",
    paths: {
        Thenable: '../lib/thenable.min'
    },
    wrap: {
        startFile: 'lib/start.frag',
        endFile: 'lib/end.frag'
    }
})