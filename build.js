({
    baseUrl: "./src",
    paths: {
        Thenable: '../lib/thenable.min'
    },
    name: "../lib/almond",
    include: ["transition"],
    out: "transition.min.js",
    generateSourceMaps: true,
    preserveLicenseComments: false,
    optimize: "uglify2",
    wrap: {
        startFile: 'lib/start.frag',
        endFile: 'lib/end.frag'
    }
})