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
    log.error(`The configuration file ${log.path(absolutePathConfigFile)} already exist`)
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
          name: 'to',
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
  absoluteBackupPath = util.resolvePath(answers.to)

  // Check if backup folder exist
  if (!(await util.existFileOrFolder(absoluteBackupPath))) {
    log.error(`The backup directory ${log.path(absoluteBackupPath)} doesn't exist`)
    process.exit(1)
  }

  // Create default configuration object
  const config = {
    to: path.normalize(answers.to),
    backup: []
  }

  // Save configuration file
  const fileSaved = await util.saveConfigFile(config, absolutePathConfigFile)

  // Message
  if (fileSaved) {
    log.success('Backup configuration created successfully')
    process.exit(0)
  } else {
    log.error(`Error saving configuration file ${log.path(absolutePathConfigFile)}`)
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
    log.error(`The configuration file ${log.path(absolutePathConfigFile)} doesn't exist`)
    process.exit(1)
  }

  // Read configuration file
  const config = await util.readConfigFile(absolutePathConfigFile)

  // Check if the file or folder exist
  if (!(await util.existFileOrFolder(absolutePathFileOrFolder))) {
    log.error(`The file or folder ${log.path(absolutePathFileOrFolder)} doesn't exist`)
    process.exit(1)
  }

  // Check if the file or folder doesn't exist in the backup array
  if (util.isFileOrFolderInBackup(config.backup, fileOrFolder, absolutePathFileOrFolder)) {
    log.error(`The file or folder ${log.path(absolutePathFileOrFolder)} already exist in the configuration file`)
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
          message: 'Create a subfolder in the backup folder?:',
          default: ''
        },
        {
          type: 'input',
          name: 'rename',
          message: 'Rename the backup file/folder?:',
          default: ''
        },
        {
          type: 'input',
          name: 'keep',
          message: 'Only keep "n" backups:',
          default: 0
        },
        {
          type: 'confirm',
          name: 'active',
          message: 'Active?',
          default: true
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
    from: util.resolvePath(fileOrFolder),
    ...answers
  })

  // Save configuration file
  const fileSaved = await util.saveConfigFile(config, absolutePathConfigFile)

  // Message
  if (fileSaved) {
    log.success(`File or folder ${log.path(absolutePathFileOrFolder)} added successfully`)
    process.exit(0)
  } else {
    log.error(`Error saving configuration file ${log.path(absolutePathConfigFile)}`)
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
    log.error(`The configuration file ${log.path(absolutePathConfigFile)} doesn't exist`)
    process.exit(1)
  }

  // Read configuration file
  const config = await util.readConfigFile(absolutePathConfigFile)

  // Check if backup folder exist
  const absoluteBackupPath = util.resolvePath(config.to)
  if (!(await util.existFileOrFolder(absoluteBackupPath))) {
    log.error(`The backup directory ${log.path(absoluteBackupPath)} doesn't exist`)
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

    // Print name
    log.title(`▶️ ${index}. ${element.name}`)

    // Check if current element is active to backup
    if (!element.active) {
      log.warning('Note: Element is inactive\n')
      continue
    }

    // Check if path is filled
    if (!element.from || !element.from.length) {
      log.warning('Note: The path is empty\n')
      continue
    }

    // Print extra information
    if (element.description) {
      log.info(`Description: ${element.description}`)
    }
    if (element.compression) {
      log.info(`Compression: ${element.compression}`)
    }

    // Check if is needed compression
    switch (element.compression) {
      case '':
        await util.backupFileOrFolder(element, config.to)
        break
      case '7z':
        await util.backup7z(element, config.to)
        break
      case 'zip':
        await util.backupZip(element, config.to)
        break
      default:
        await util.backupFileOrFolder(element, config.to)
        break
    }

    // Print new line
    log.info()
  }
}

module.exports = {
  create,
  add,
  run
}
