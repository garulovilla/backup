const fs = require('fs')

/**
 * Read configuration file
 * @param {string} path Path
 */
const readConfigFile = async (path) => {
  try {
    return JSON.parse(await fs.promises.readFile(path, 'utf-8'))
  } catch (e) {
  }
}

/**
 * Save configuration file
 * @param {object} config Configuration
 * @param {string} path Path
 */
const saveConfigFile = async (config, path) => {
  try {
    await fs.promises.writeFile(path, JSON.stringify(config, null, '\t'))
  } catch (e) {
  }
}

/**
 * Check if file of folder exist
 * @param {string} path Path of the file or folder to check if it exists in the array
 */
const existFileOrFolder = async (path) => {
  try {
    await fs.promises.access(path)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Check if file of folder exist in backup array
 * @param {array} array Backup array
 * @param {string} path Path of the file or folder to check if it exists in the array
 */
const isFileOrFolderInBackup = (array, path) => {
  return array.some((element) => { return element.path === path })
}

module.exports = {
  readConfigFile,
  saveConfigFile,
  existFileOrFolder,
  isFileOrFolderInBackup
}
