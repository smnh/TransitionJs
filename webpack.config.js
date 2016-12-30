const webpack = require('webpack');

module.exports = {
    devtool: "source-map",
    entry: {
        'transition': './src/transition.js',
        'transition.min': './src/transition.js'
    },
    output: {
        path: __dirname + '/lib',
        filename: '[name].js',
        library: "transition",
        libraryTarget: "umd"
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
        }]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            sourceMap: true,
            compress: {warnings: false},
            output: {comments: false}
        })
    ]
};
