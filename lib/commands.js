const path = require('path')
const inquirer = require('inquirer')
const util = require('./util')
const log = require('./log')

/**
 * Create command
 * @param {string} configFile Configuration file path
 * @param {object} options Options for configuration file.
 * These options will be used instead of asking through the command line
 */
const create = async (configFile, options) => {
  // Get absolute paths
  const absolutePathConfigFile = util.resolvePath(configFile)
  let absoluteBackupPath = path.dirname(configFile)

  // Check if configuration file exist
  if (await util.existFileOrFolder(absolutePathConfigFile)) {
    log.error('The configuration file already exist')
    log.path(absolutePathConfigFile)
    process.exit(1)
  }

  // Ask for the path where to make the backup
  // or take the path from the options object
  let answers
  if (options === undefined) {
    try {
      answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'path',
          message: 'Directory where the backup will be made?',
          default: absoluteBackupPath
        }
      ])
    } catch (error) {
      log.error(error)
      process.exit(1)
    }
  } else {
    answers = { ...options }
  }

  // Get relative backup path
  absoluteBackupPath = util.resolvePath(answers.path)

  // Check if backup folder exist
  if (!(await util.existFileOrFolder(absoluteBackupPath))) {
    log.error("The backup directory doesn't exist")
    log.path(absoluteBackupPath)
    process.exit(1)
  }

  // Create default configuration object
  const config = {
    path: path.normalize(answers.path),
    backup: []
  }

  // Save configuration file
  const fileSaved = await util.saveConfigFile(config, absolutePathConfigFile)

  // Message
  if (fileSaved) {
    log.success('Backup configuration created successfully')
    log.path(absolutePathConfigFile)
    process.exit(0)
  } else {
    log.error('Error saving configuration file')
    log.path(absolutePathConfigFile)
    process.exit(1)
  }
}

/**
 * Add command
 * @param {string} configFile Configuration file path
 * @param {string} fileOrFolder File or folder path
 * @param {object} options Options for configuration file.
 * These options will be used instead of asking through the command line
 */
const add = async (configFile, fileOrFolder, options) => {
  // Get absolute paths
  const absolutePathConfigFile = util.resolvePath(configFile)
  const absolutePathFileOrFolder = util.resolvePath(fileOrFolder)

  // Check if configuration file exist
  if (!(await util.existFileOrFolder(absolutePathConfigFile))) {
    log.error("The configuration file doesn't exist")
    log.path(absolutePathConfigFile)
    process.exit(1)
  }

  // Read configuration file
  const config = await util.readConfigFile(absolutePathConfigFile)

  // Check if the file or folder exist
  if (!(await util.existFileOrFolder(absolutePathFileOrFolder))) {
    log.error("The file or folder doesn't exist")
    log.path(absolutePathFileOrFolder)
    process.exit(1)
  }

  // Check if the file or folder doesn't exist in the backup array
  if (util.isFileOrFolderInBackup(config.backup, fileOrFolder, absolutePathFileOrFolder)) {
    log.error('The file or folder already exist in the configuration file')
    log.path(absolutePathFileOrFolder)
    process.exit(1)
  }

  // Ask for additional options
  // or take from the options object
  let answers
  if (options === undefined) {
    try {
      answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Name:',
          default: ''
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          default: ''
        },
        {
          type: 'list',
          name: 'compression',
          message: 'Compression type?',
          default: 0,
          choices: ['none', '7z', 'zip']
        },
        {
          type: 'input',
          name: 'subfolder',
          message: 'Subfolder:',
          default: ''
        }
      ])
    } catch (error) {
      log.error(error)
      process.exit(1)
    }
  } else {
    answers = { ...options }
  }

  // Convert none compression to empty string
  if (answers.compression === 'none') {
    answers.compression = ''
  }

  // Add new object
  config.backup.push({
    path: path.normalize(fileOrFolder),
    ...answers
  })

  // Save configuration file
  const fileSaved = await util.saveConfigFile(config, absolutePathConfigFile)

  // Message
  if (fileSaved) {
    log.success('File or folder added successfully')
    log.path(absolutePathFileOrFolder)
    process.exit(0)
  } else {
    log.error('Error saving configuration file')
    log.path(absolutePathConfigFile)
    process.exit(1)
  }
}

/**
 * Run command
 * @param {string} configFile Configuration file path
 */
const run = async (configFile) => {
  // Get absolute paths
  const absolutePathConfigFile = util.resolvePath(configFile)

  // Check if configuration file exist
  if (!(await util.existFileOrFolder(absolutePathConfigFile))) {
    log.error("The configuration file doesn't exist")
    log.path(absolutePathConfigFile)
    process.exit(1)
  }

  // Read configuration file
  const config = await util.readConfigFile(absolutePathConfigFile)

  // Check if backup folder exist
  const absoluteBackupPath = util.resolvePath(config.path)
  if (!(await util.existFileOrFolder(absoluteBackupPath))) {
    log.error("The backup directory doesn't exist")
    log.path(absoluteBackupPath)
    process.exit(1)
  }

  // Check if backup array exist and has elements
  if (!config.backup.length) {
    log.error('The backup array is empty')
    process.exit(1)
  }

  // Loop to all files and directories
  let index = 0
  for (const element of config.backup) {
    // Add index
    index++

    // Get information
    const absolutePath = util.resolvePath(element.path)
    const existFileOrFolder = util.existFileOrFolder(absolutePath)
    const base = path.parse(absolutePath).base
    const name = element.name ? element.name : base

    // Log
    log.title(`✔️ ${index}. ${name}`)
    if (element.description) {
      log.normal(`-- Description: ${element.description}`)
    }

    // If file or folder exits, then backup
    if (existFileOrFolder) {
      // Set from and to paths
      const from = absolutePath
      const isFile = await util.isFile(from)
      const to = await util.formatPathTo(config.path, base, element)

      // Log
      log.normal(`-- From: ${from}`)
      log.normal(`-- Type: ${isFile ? 'File' : 'Folder'}`)
      if (element.compression) {
        log.normal(`-- Compression: ${element.compression}`)
      }
      log.normal(`-- Backup to: ${to}\n`)

      // Check if is needed compression
      switch (element.compression) {
        case '':
          await util.backupFileOrFolder(from, to)
          break
        case '7z':
          util.backup7z(from, to)
          break
        case 'zip':
          util.backupZip(from, to, base, isFile)
          break
        default:
          await util.backupFileOrFolder(from, to)
          break
      }
    } else {
      // Log
      log.normal("-- Note: Path doesn't exist\n")
    }
  }
}

module.exports = {
  create,
  add,
  run
}
