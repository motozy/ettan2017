const webpack = require("webpack");
module.exports = {
    entry: './app.js',
    output: {
        path: `${__dirname}/`,
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    plugins: [
        // JSファイルのminifyを実行する
        new webpack.optimize.UglifyJsPlugin({
            // minify時でもソースマップを利用する
            sourceMap: true
        })
    ]
};
