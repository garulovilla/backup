const inquirer = require('inquirer')
const path = require('path')
const util = require('./util')

/**
 * Create command
 * @param {string} configFile Configuration file path
 */
const create = async (configFile) => {

}

/**
 * Run command
 * @param {string} configFile Configuration file path
 */
const run = async (configFile) => {

}

/**
 * Add command
 * @param {string} configFile Configuration file path
 * @param {string} fileOrFolder File or folder path
 */
const add = async (configFile, fileOrFolder) => {
  // Get absolute paths
  const absolutePathConfigFile = path.resolve(configFile)
  const absolutePathFileOrFolder = path.resolve(fileOrFolder)

  // Check if configuration file exist
  if (!await util.existFileOrFolder(absolutePathConfigFile)) {
    console.log('The configuration file doesn\'t exist')
    return
  }

  // Read configuration file
  const config = await util.readConfigFile(configFile)

  // If the backup array doesn't exist, add it
  if (!('backup' in config)) {
    config.backup = []
  }

  // Check if the file or folder exist
  if (!await util.existFileOrFolder(absolutePathFileOrFolder)) {
    console.log('The file or folder doesn\'t exist')
    return
  }

  // Check if the file or folder doesn't exist in the backup array
  if (util.isFileOrFolderInBackup(config.backup, absolutePathFileOrFolder)) {
    console.log('The file or folder already exist in the configuration file')
    return
  }

  // Ask for additional options
  let answers
  try {
    answers = await inquirer
      .prompt([{
        type: 'list',
        name: 'compression',
        message: 'Compression type?',
        default: 0,
        choices: [
          'none',
          '7zip',
          'zip'
        ]
      }
      ])
  } catch (error) {
    return
  }

  // Add new object
  config.backup.push({
    path: absolutePathFileOrFolder,
    ...answers
  })

  // Save configuration file
  util.saveConfigFile(config, configFile)

  // Log
  console.log('File or folder added successfully')
}

module.exports = {
  create,
  run,
  add
}
