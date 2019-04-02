const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const rollup = require('rollup')
const uglify = require('uglify-js')
const yargs = require('yargs')

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

let builds = require('./config').getAllBuilds()

// filter builds via command line arg
if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => {
    return filters.some(f => b.output.file.slice(path.resolve(__dirname, '../').length).indexOf(f) > -1)
    // return filters.some(f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1)
  })
} else {
  // filter out weex builds by default
  builds = builds.filter(b => {
    return b.output.file.indexOf('weex') === -1
  })
}

build(builds)

function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++
      if (built < total) {
        next()
      }
    }).catch(logError)
  }

  next()
}

function buildEntry (config) {
  const output = config.output
  const { file, banner } = output
  const isProd = /min\.js$/.test(file)
  return rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({ code }) => {
      if (isProd) {
        var minified = (banner ? banner + '\n' : '') + uglify.minify(code, {
          output: {
            ascii_only: true
          },
          compress: {
            pure_funcs: ['makeMap']
          }
        }).code
        return write(file, minified, true)
      } else {
        return write(file, code)
      }
    })
}

function write (dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report (extra) {
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      const dir = yargs.argv.dir
      if (process.argv[2] && process.argv[2].split(',')[0] === 'quickapp' && dir) {
        const file = dest.indexOf('compiler') > -1 ? 'factory-with-compiler.js' : 'factory.js'
        // 在这里修改框架在hap框架中的打包位置
        const filePath = path.resolve(process.cwd(), dir, file)
        fs.writeFile(filePath, code, err => {
          if (err) {
            reject(err)
          }
          if (zip) {
            zlib.gzip(code, (err, zipped) => {
              if (err) return reject(err)
              console.log(blue('zip in quickapp success'))
              resolve()
            })
          } else {
            console.log(blue('build quickapp success, to the path: '))
            console.log(green(filePath))
            resolve()
          }
        })
      } else {
        resolve()
      }
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err)
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  console.log(e)
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}

function green (str) {
  return '\x1b[32m' + str + '\x1b[37m'
}
