/* eslint-env node */
const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const BannerBuilder = require('./build/BannerBuilder')

const banner = BannerBuilder.buildBanner()

const config = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        filename: 'hh-plus-plus.user.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.svg$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                        },
                    },
                ],
            },
            {
                test: /\.lazy\.scss$/i,
                use: [
                    { loader: 'style-loader', options: { injectType: 'lazyStyleTag', attributes: { class: 'script-styles' } } },
                    'css-loader',
                    'sass-loader',
                ],
            },
        ]
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                parallel: true,
                uglifyOptions: {
                    output: {
                        beautify: false,
                        preamble: banner,
                    },
                    sourceMap: {
                        url: 'inline',
                    },
                },
                sourceMap: false,
            }),
        ],
    },
    plugins: [
        new webpack.BannerPlugin({
            banner,
            raw: true,
            entryOnly: true
        })
    ]
}

module.exports = (env, argv) => {

    if (argv.mode === 'development') {
        config.output.filename = 'hh-plus-plus.dev.user.js'
    }

    return config
}
