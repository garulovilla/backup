const path = require('path')
const fsp = require('fs').promises
const fse = require('fs-extra')
const pathTo7zip = require('7zip-bin').path7za
const seven = require('node-7z')
const AdmZip = require('adm-zip')
const log = require('./log')

/**
 * Read configuration file
 * @param {string} localPath Path
 * @returns {Promise<object>} Return configuration object
 */
const readConfigFile = async (localPath) => {
  try {
    // Read json file
    const config = JSON.parse(await fsp.readFile(localPath, 'utf-8'))

    // Check if property backup exist, if not add
    if (!('backup' in config)) {
      config.backup = []
    }

    // Loop to backup array to initialize elements with default values
    for (const element of config.backup) {
      // If name property doesn't exist, then set default value
      if (!('name' in element)) {
        element.name = ''
      }

      // If description property doesn't exist, then set default value
      if (!('description' in element)) {
        element.description = ''
      }

      // If compression property doesn't exist, then set default value
      if (!('compression' in element)) {
        element.compression = ''
      }

      // If subfolder property doesn't exist, then set default value
      if (!('subfolder' in element)) {
        element.subfolder = ''
      }
    }

    return config
  } catch (e) {
    log.error(e)
  }
}

/**
 * Save configuration file
 * @param {object} config Configuration
 * @param {string} localPath Path
 * @returns {Promise<boolean>} Return true if configuration file was saved
 */
const saveConfigFile = async (config, localPath) => {
  try {
    await fsp.writeFile(localPath, JSON.stringify(config, null, '  '))
    return true
  } catch (e) {
    log.error(e)
    return false
  }
}

/**
 * Check if file of folder exist
 * @param {string} localPath Path of the file or folder to check if it exists in the array
 * @returns {Promise<boolean>} Return true if the file or folder exist
 */
const existFileOrFolder = async (localPath) => {
  try {
    await fsp.access(localPath)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Check if file of folder exist in backup array
 * @param {array} backupArray Backup array
 * @param {string} localPath Path of the file or folder to check if it exists in the array
 * @param {string} absolutePath Absolute path of the file or folder
 * @returns {boolean} Return true if one file or folder already exist in the array
 */
const isFileOrFolderInBackup = (backupArray, localPath, absolutePath) => {
  return backupArray.some((element) => {
    return element.path === path.normalize(localPath) || element.path === absolutePath
  })
}

/**
 * Check if the path is a file
 * @param {string} localPath Path
 * @returns {Promise<boolean>} Return true if the path is a file
 */
const isFile = async (localPath) => {
  try {
    const stat = await fsp.stat(localPath)
    return stat.isFile()
  } catch (e) {
    log.error(e)
  }
}

/**
 * Resolve path
 * @param {string} pathToResolve Path to resolve
 * @returns {string} Resolved path
 */
const resolvePath = (pathToResolve) => {
  // Resolve environment variables in path property
  pathToResolve = pathToResolve.replace(/%([^%]+)%/g, (_, n) => process.env[n])

  // Resolve
  pathToResolve = path.resolve(pathToResolve)

  // Normalize
  pathToResolve = path.normalize(pathToResolve)

  return pathToResolve
}

/**
 * Format path to
 * @param {string} backupPath Base path to backup
 * @param {string} base Filename or last folder in path
 * @param {object} element Element to backup
 * @returns {Promise<string>} Formatted path to
 */
const formatPathTo = async (backupPath, base, element) => {
  // Get subfolder and set first to path
  let to = resolvePath(backupPath + '\\' + element.subfolder)

  // Check if the current element needs a subfolder
  if (!await existFileOrFolder(to)) {
    await fse.mkdir(to)
  }

  // Check the type of compression
  switch (element.compression) {
    case '':
      to = to + '\\' + base
      break
    case '7z':
      to = to + '\\' + base + '.7z'
      break
    case 'zip':
      to = to + '\\' + base + '.zip'
      break
    default:
      to = to + '\\' + base
      break
  }

  return path.normalize(to)
}

/**
 * Backup file or folder
 * @param {string} from From path
 * @param {string} to To path
 */
const backupFileOrFolder = async (from, to) => {
  try {
    await fse.copy(from, to)
  } catch (e) {
    log.error(e)
  }
}

/**
 * Backup file or folder as 7z
 * @param {string} from From path
 * @param {string} to To path
 */
const backup7z = (from, to) => {
  seven.add(to, from, {
    $bin: pathTo7zip
  })
}

/**
 * Backup file or folder as zip
 * @param {string} from From path
 * @param {string} to To path
 * @param {string} base Filename or last folder in path
 * @param {string} isFile True if the current path is a file
 */
const backupZip = (from, to, base, isFile) => {
  const zip = new AdmZip()
  // Check if it is a file
  if (isFile) {
    zip.addLocalFile(from)
  } else {
    zip.addLocalFolder(from, base)
  }
  // Write zip
  zip.writeZip(to)
}

module.exports = {
  readConfigFile,
  saveConfigFile,
  existFileOrFolder,
  isFileOrFolderInBackup,
  isFile,
  resolvePath,
  formatPathTo,
  backupFileOrFolder,
  backup7z,
  backupZip
}
