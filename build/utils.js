'use strict'
const path = require('path')
const config = require('../config')
const packageConfig = require('../package.json')

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

exports.assetsPath = function (_path) {
  const assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory

  return path.posix.join(assetsSubDirectory, _path)
}

exports.styleLoaders = function (generateSourceMap, usePostCSS, extractCSS) {
  const output = [
    usePostCSS ?
    {
      test: /\.css$/,
      use: [
        extractCSS
            ? MiniCssExtractPlugin.loader
            : 'vue-style-loader',
        {
          loader: 'css-loader',
          options: {
            sourceMap: generateSourceMap,
            importLoaders: 1
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: generateSourceMap
          }
        }
      ]
    } :
    {
      test: /\.css$/,
      use: [
        extractCSS
            ? MiniCssExtractPlugin.loader
            : 'vue-style-loader',
        {
          loader: 'css-loader',
          options: {
            sourceMap: generateSourceMap,
          }
        }
      ]
    },
    {
      test: /\.less$/,
      use: [
        'vue-style-loader',
        {
          loader: 'css-loader',
          options: {
            sourceMap: generateSourceMap,
          }
        },
        {
          loader: 'less-loader',
          options: {
            sourceMap: generateSourceMap
          }
        }
      ]
    },
    {
      test: /\.sass$/,
      use: [
        'vue-style-loader',
        {
          loader: 'css-loader',
          options: {
            sourceMap: generateSourceMap,
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: generateSourceMap,
            sassOptions: {
              indentedSyntax: true
            }
          }
        }
      ]
    },
    {
      test: /\.scss$/,
      use: [
        extractCSS
            ? MiniCssExtractPlugin.loader
            : 'vue-style-loader',
        {
          loader: 'css-loader',
          options: {
            sourceMap: generateSourceMap,
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: generateSourceMap
          }
        }
      ]
    },
    {
      test: /\.styl(us)?$/,
      use: [
        'vue-style-loader',
        {
          loader: 'css-loader',
          options: {
            sourceMap: generateSourceMap,
          }
        },
        {
          loader: 'stylus-loader',
          options: {
            sourceMap: generateSourceMap
          }
        }
      ]
    }
  ];

  return output
}

exports.createNotifierCallback = () => {
  const notifier = require('node-notifier')

  return (severity, errors) => {
    if (severity !== 'error') return

    const error = errors[0]
    const filename = error.file && error.file.split('!').pop()

    notifier.notify({
      title: packageConfig.name,
      message: severity + ': ' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}
