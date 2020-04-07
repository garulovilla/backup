const chalk = require('chalk')

const success = chalk.green
const warning = chalk.yellow
const error = chalk.red
const file = chalk.blue

const log = {
  success: (msg) => {
    console.log(success(msg))
  },
  warning: (msg) => {
    console.log(warning(msg))
  },
  error: (msg) => {
    console.log(error(msg))
  },
  file: (msg) => {
    console.log(file(msg))
  },
  normal: (msg) => {
    console.log(msg)
  }
}

module.exports = log
