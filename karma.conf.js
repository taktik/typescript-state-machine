const path = require('path')

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ["mocha"],
        
        exclude: [],
        files: [
            { pattern: "./test/index.js" }
        ],
        preprocessors: {
            "./test/index.js": ["webpack"],
        },
        reporters: ['progress','coverage-istanbul'],
        

  
        autoWatch: true,
        webpack : {
            entry: "./test/index.js",
            resolve: {
              extensions: [ '.ts', '.js' ]
            },
            module: {
              rules: [
                {
                  test: /\.tsx?$/,
                  use: 'ts-loader',
                  exclude: /node_modules/
                },
                {
                  test: /\.([jt])s$/,
                  enforce: 'post',
                  exclude: /(node_modules)/,
                  use: {
                    loader: 'istanbul-instrumenter-loader',
                    options: {esModules: true}
                  }
                }
              ]
            },
            mode: 'development',
            node: {
              fs: 'empty'
            }
        },
        coverageIstanbulReporter: {
          reports: [ 'html', 'text-summary' ],
          dir: path.join(__dirname, 'coverage'),
          fixWebpackSourcePaths: true,
          'report-config': {
            html: { outdir: 'html' }
          }
        },
       
        browsers: ["Chrome"],
    });
};