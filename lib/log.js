const chalk = require('chalk')

const success = chalk.green
const warning = chalk.yellow
const error = chalk.red
const path = chalk.blue

const log = {
  success: (...args) => {
    console.log(success(...args))
  },
  warning: (...args) => {
    console.log(warning(...args))
  },
  error: (...args) => {
    console.log(error(...args))
  },
  normal: (...args) => {
    console.log(...args)
  },
  path: (msg) => {
    console.log(path('Path: ' + msg))
  },
  title: (msg) => {
    console.log(path(msg))
  }
}

module.exports = log
