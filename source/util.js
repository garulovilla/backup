const fsp = require('fs').promises
const fse = require('fs-extra')
const log = console.log

/**
 * Read configuration file
 * @param {string} path Path
 */
const readConfigFile = async (path) => {
  try {
    return JSON.parse(await fsp.readFile(path, 'utf-8'))
  } catch (e) {
    log(e)
  }
}

/**
 * Save configuration file
 * @param {object} config Configuration
 * @param {string} path Path
 * @returns {boolean} Return true if the configuration file was saved
 */
const saveConfigFile = async (config, path) => {
  try {
    await fsp.writeFile(path, JSON.stringify(config, null, '\t'))
    return true
  } catch (e) {
    log(e)
    return false
  }
}

/**
 * Check if file of folder exist
 * @param {string} path Path of the file or folder to check if it exists in the array
 * @returns {boolean} Return true if the file or folder exist
 */
const existFileOrFolder = async (path) => {
  try {
    await fsp.access(path)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Check if file of folder exist in backup array
 * @param {array} array Backup array
 * @param {string} path Path of the file or folder to check if it exists in the array
 * @returns {boolean} Return true if one file or folder already exist in the array
 */
const isFileOrFolderInBackup = (array, path) => {
  return array.some((element) => { return element.path === path })
}

/**
 * Check if the path is a file
 * @param {string} path Path
 * @returns {boolean} Return true if the path is a file
 */
const isFile = async (path) => {
  try {
    const stat = await fsp.stat(path)
    return stat.isFile()
  } catch (e) {
    log(e)
  }
}

/**
 * Copy file or folder
 * @param {string} from From path
 * @param {string} to To path
 */
const copyFileOrFolder = async (from, to) => {
  try {
    await fse.copy(from, to)
  } catch (e) {
    log(e)
  }
}

module.exports = {
  readConfigFile,
  saveConfigFile,
  existFileOrFolder,
  isFileOrFolderInBackup,
  isFile,
  copyFileOrFolder
}
