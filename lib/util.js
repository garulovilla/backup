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

      // If rename property doesn't exist, then set default value
      if (!('rename' in element)) {
        element.rename = ''
      }

      // If active property doesn't exist, then set default value
      if (!('active' in element)) {
        element.active = true
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
 * Get current date formatted
 * @returns {object} Object with formatted date
 */
const getFormattedDate = () => {
  const currentDate = new Date()
  const date = {
    y: currentDate.getFullYear(),
    M: currentDate.getMonth() + 1,
    d: currentDate.getDate(),
    h: currentDate.getHours(),
    m: currentDate.getMinutes(),
    s: currentDate.getSeconds()
  }

  // Month
  if (date.M < 10) {
    date.M = '0' + date.M
  }

  // Day
  if (date.d < 10) {
    date.d = '0' + date.d
  }

  // Hours
  if (date.h < 10) {
    date.h = '0' + date.h
  }

  // Minutes
  if (date.m < 10) {
    date.m = '0' + date.m
  }

  // Seconds
  if (date.s < 10) {
    date.s = '0' + date.s
  }

  return {
    yyyyMMdd: `${date.y}${date.M}${date.d}`,
    hhmmdd: `${date.h}${date.m}${date.s}`,
    timestamp: `${date.y}${date.M}${date.d}${date.h}${date.m}${date.s}`
  }
}

/**
 * Resolve rename pattern
 * @param {object} element Current element to backup
 * @param {string} base File/Folder name
 * @return {string} Resolved pattern
 */
const resolveRenamePattern = (element, base) => {
  const formattedDate = getFormattedDate()
  let rename = element.rename

  // Replace /s with timestamp yyyy
  rename = rename.replace(/\/s/gm, formattedDate.timestamp)

  // Replace /d with date yyyyMMdd
  rename = rename.replace(/\/d/gm, formattedDate.yyyyMMdd)

  // Replace /t with time hhmmss
  rename = rename.replace(/\/t/gm, formattedDate.hhmmdd)

  // Replace /o with original file/folder name
  rename = rename.replace(/\/o/gm, base)

  return rename
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
  let basename = base

  // Check if the current element needs a subfolder
  if (!await existFileOrFolder(to)) {
    await fse.mkdir(to, { recursive: true })
  }

  // Check if it's necessary rename
  if (element.rename) {
    basename = resolveRenamePattern(element, base)
  }

  // Check the type of compression
  switch (element.compression) {
    case '':
      to = to + '\\' + basename
      break
    case '7z':
      to = to + '\\' + basename + '.7z'
      break
    case 'zip':
      to = to + '\\' + basename + '.zip'
      break
    default:
      to = to + '\\' + basename
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
