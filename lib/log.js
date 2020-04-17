const chalk = require('chalk')

const log = {
  success: (...args) => {
    console.log(chalk.green(...args))
  },

  warning: (...args) => {
    console.log(chalk.yellow(...args))
  },

  error: (...args) => {
    console.log(chalk.red(...args))
  },

  info: (...args) => {
    console.log(...args)
  },

  path: (...args) => {
    return chalk.cyan(...args)
  },

  title: (msg) => {
    console.log(chalk.magenta(msg))
  }
}

module.exports = log
