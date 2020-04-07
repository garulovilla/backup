const path = require('path')
const inquirer = require('inquirer')
const util = require('./util')
const log = require('./log')
/**
 * Create command
 * @param {string} configFile Configuration file path
 */
const create = async (configFile) => {
  // Get absolute paths
  const absolutePathConfigFile = path.resolve(configFile)
  let absoluteBackupPath = path.dirname(configFile)

  // Check if configuration file exist
  const existConfigFile = await util.existFileOrFolder(absolutePathConfigFile)
  if (existConfigFile) {
    log.error('The configuration file already exist')
    return
  }

  // Ask for the path where to make the backup
  let answers
  try {
    answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'backupPath',
        message: 'Directory where the backup will be made?',
        default: absoluteBackupPath
      }
    ])
  } catch (error) {
    return
  }

  // Get relative backup path
  absoluteBackupPath = path.resolve(answers.backupPath)

  // Check if backup folder exist
  const existBackupFolder = await util.existFileOrFolder(absoluteBackupPath)
  if (!existBackupFolder) {
    log.error("The backup directory doesn't exist")
    return
  }

  // Create default configuration object
  const config = {
    path: absoluteBackupPath,
    backup: []
  }

  // Save configuration file
  const fileSaved = util.saveConfigFile(config, absolutePathConfigFile)

  // Message
  if (fileSaved) {
    log.success('Backup configuration created successfully')
  } else {
    log.error('Error saving configuration file')
  }
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
  const existConfigFile = await util.existFileOrFolder(absolutePathConfigFile)
  if (!existConfigFile) {
    log.error("The configuration file doesn't exist")
    return
  }

  // Read configuration file
  const config = await util.readConfigFile(configFile)

  // If the backup array doesn't exist, add it
  if (!('backup' in config)) {
    config.backup = []
  }

  // Check if the file or folder exist
  const existFileOrFolder = util.existFileOrFolder(absolutePathFileOrFolder)
  if (!existFileOrFolder) {
    log.error("The file or folder doesn't exist")
    return
  }

  // Check if the file or folder doesn't exist in the backup array
  if (util.isFileOrFolderInBackup(config.backup, absolutePathFileOrFolder)) {
    log.error('The file or folder already exist in the configuration file')
    return
  }

  // Ask for additional options
  let answers
  try {
    answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'compression',
        message: 'Compression type?',
        default: 0,
        choices: ['none', '7z', 'zip']
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
  const fileSaved = util.saveConfigFile(config, absolutePathConfigFile)

  // Message
  if (fileSaved) {
    log.success('File or folder added successfully')
  } else {
    log.error('Error saving configuration file')
  }
}

/**
 * Run command
 * @param {string} configFile Configuration file path
 */
const run = async (configFile) => {
  // Get absolute paths
  const absolutePathConfigFile = path.resolve(configFile)

  // Check if configuration file exist
  const existConfigFile = await util.existFileOrFolder(absolutePathConfigFile)
  if (!existConfigFile) {
    log.error("The configuration file doesn't exist")
    return
  }

  // Read configuration file
  const config = await util.readConfigFile(configFile)
  const absoluteBackupPath = path.resolve(config.path)

  // Check if backup folder exist
  const existBackupFolder = await util.existFileOrFolder(absoluteBackupPath)
  if (!existBackupFolder) {
    log.error("The backup directory doesn't exist")
    return
  }

  // Check if backup array exist and has elements
  if (!('backup' in config) || !config.backup.length) {
    log.error('The backup array is empty')
    return
  }

  // Loop to all files and directories
  let index = 0
  for (const element of config.backup) {
    // Add index
    index++

    // Check if file or folder exist
    const existFileOrFolder = await util.existFileOrFolder(element.path)

    // Log
    log.file(`${index}. ${element.path}`)

    // If file or folder exits, then backup
    if (existFileOrFolder) {
      // Set from and to paths
      const from = element.path
      const to = config.path

      // Log
      log.normal('-- Path exist')

      // Check if is needed compression
      switch (element.compression) {
        case 'none':
          await util.backupFileOrFolder(from, to)
          break
        case '7z':
          await util.backup7z(from, to)
          break
        case 'zip':
          await util.backupZip(from, to)
          break
        default:
          await util.backupFileOrFolder(from, to)
          break
      }
    } else {
      // Log
      log.normal("-- Path doesn't exist")
    }
  }
}

module.exports = {
  create,
  add,
  run
}
