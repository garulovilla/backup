const path = require('path')
const fsp = require('fs').promises
const fse = require('fs-extra')
const pathTo7zip = require('7zip-bin').path7za
const seven = require('node-7z')
const AdmZip = require('adm-zip')
const log = require('./log')

/**
 * Read configuration file
 * @param {string} path Path
 */
const readConfigFile = async (path) => {
  try {
    return JSON.parse(await fsp.readFile(path, 'utf-8'))
  } catch (e) {
    log.error(e)
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
    log.error(e)
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
  return array.some((element) => {
    return element.path === path
  })
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
    log.error(e)
  }
}

/**
 * Backup file or folder
 * @param {string} from From path
 * @param {string} to To path
 */
const backupFileOrFolder = async (from, to) => {
  const base = path.parse(from).base
  // Check if it is a file
  if (await isFile(from)) {
    log.normal('-- Copy file')
  } else {
    log.normal('-- Copy folder')
  }
  // Copy
  to += '\\' + base
  log.normal(`-- To: ${to} \n`)
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
const backup7z = async (from, to) => {
  const base = path.parse(from).base
  // Check if it is a file
  if (await isFile(from)) {
    log.normal('-- 7z file')
  } else {
    log.normal('-- 7z folder')
  }
  to += '\\' + base + '.7z'
  log.normal(`-- To: ${to} \n`)
  // Write 7z
  seven.add(to, from, {
    $bin: pathTo7zip
  })
}

/**
 * Backup file or folder as zip
 * @param {string} from From path
 * @param {string} to To path
 */
const backupZip = async (from, to) => {
  const zip = new AdmZip()
  const base = path.parse(from).base
  // Check if it is a file
  if (await isFile(from)) {
    log.normal('-- Zip file')
    zip.addLocalFile(from)
  } else {
    log.normal('-- Zip folder')
    zip.addLocalFolder(from, base)
  }
  to += '\\' + base + '.zip'
  log.normal(`-- To: ${to} \n`)
  // Write zip
  zip.writeZip(to)
}

module.exports = {
  readConfigFile,
  saveConfigFile,
  existFileOrFolder,
  isFileOrFolderInBackup,
  isFile,
  backupFileOrFolder,
  backup7z,
  backupZip
}
