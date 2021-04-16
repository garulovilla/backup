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

      // If match property doesn't exist, then set default value
      if (!('match' in element)) {
        element.match = ''
      }

      // If rename property doesn't exist, then set default value
      if (!('rename' in element)) {
        element.rename = ''
      }

      // If active property doesn't exist, then set default value
      if (!('active' in element)) {
        element.active = true
      }

      // If keep property doesn't exist, then set default value
      if (!('keep' in element)) {
        element.keep = 0
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
    return (
      element.from === path.normalize(localPath) ||
      element.from === absolutePath
    )
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
 * Check if the path is a directory
 * @param {string} localPath Path
 * @returns {Promise<boolean>} Return true if the path is a directory
 */
const isDirectory = async (localPath) => {
  try {
    const stat = await fsp.stat(localPath)
    return stat.isDirectory()
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

  // Replace /n with name of elment
  rename = rename.replace(/\/n/gm, element.name)

  // Replace /b with subfolder name
  rename = rename.replace(/\/b/gm, element.subfolder)

  return rename
}

/**
 * Resolve path to
 * @param {string} backupPath Base path to backup
 * @param {string} base Filename or last folder in path
 * @param {object} element Element to backup
 * @returns {Promise<string>} Formatted path to
 */
const resolvePathTo = async (backupPath, base, element) => {
  // Get subfolder and set first to path
  let to = resolvePath(backupPath + '\\' + element.subfolder)
  let basename = base

  // Check if the current element needs a subfolder
  if (!(await existFileOrFolder(to))) {
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
 * Convert path element to array
 * @param {object} element Current backup element
 * @returns {Promise<string[]>} Array of path element
 */
const convertFromToArray = async (element) => {
  let fromArray = []
  const fromArrayFinal = []

  // Convert from to array
  if (Array.isArray(element.from)) {
    fromArray = element.from.slice(0)
  } else {
    fromArray.push(element.from)
  }

  // Resolve paths
  for (let index = 0; index < fromArray.length; index++) {
    const absolutePathFrom = resolvePath(fromArray[index])

    if (await existFileOrFolder(absolutePathFrom)) {
      // Check if it is a directory, if it is, check if the match property
      // is active. The match property allow filter the files inside the
      // folder
      if ((await isDirectory(absolutePathFrom)) && element.match !== '') {
        // Read folder
        const filesInFolderTo = await fsp.readdir(absolutePathFrom)

        // Create new regex from match
        const regex = convertWildcardToRegex(element.match)

        // Get matched files
        let matchedFiles = filesInFolderTo.filter((file) => {
          return regex.test(file)
        })

        // Add path to matched files
        matchedFiles = matchedFiles.map((file) => {
          return path.join(absolutePathFrom, file)
        })

        // Insert matched files only
        fromArrayFinal.push(...matchedFiles)
      } else {
        fromArrayFinal.push(absolutePathFrom)
      }
    } else {
      log.warning(
        `Note: File or folder ${log.path(absolutePathFrom)} doesn't exist`
      )
    }
  }

  // If no file was found, throw exception
  if (fromArrayFinal === undefined || fromArrayFinal.length === 0) {
    throw new Error('No file or folder match')
  }

  return fromArrayFinal
}

/**
 * Delete files or folders
 * @param {object} element Current element
 * @param {string[]} from From array
 * @param {string} to Backup folder
 */
const deleteOldBackupFilesOrFolders = async (element, from, to) => {
  // If rename is not active or keep is zero no delete older files
  if (!element.rename || element.keep === 0) {
    return
  }

  // Get folder to path
  const folderTo = resolvePath(to + '\\' + element.subfolder)

  // Get files and folder in backup path
  const filesInFolderTo = await fsp.readdir(folderTo)

  // Replace patters in rename with regex
  let rename = element.rename
  rename = rename.replace(/\/s/gm, '\\d{14}')
  rename = rename.replace(/\/d/gm, '\\d{8}')
  rename = rename.replace(/\/t/gm, '\\d{6}')

  // Main loop
  for (const fromItem of from) {
    // Get base
    const base = path.parse(fromItem).base

    // Replace original filename or foldername
    let sRegex = rename.replace(/\/o/gm, base)
    if (element.compression === '7z' || element.compression === 'zip') {
      sRegex += '.' + element.compression
    }
    sRegex += '$'

    // Create new regex from rename
    const regex = new RegExp(sRegex)

    // Get matched files
    let matchedFiles = filesInFolderTo.filter((file) => {
      return regex.test(file)
    })

    // If the keep property is low that matched files length, no delete
    if (matchedFiles.length <= element.keep) {
      continue
    }

    // Get creation date of files
    matchedFiles = await Promise.all(
      matchedFiles.map(async (file) => {
        const path = folderTo + '\\' + file
        const stat = await fsp.stat(path)
        return {
          path: path,
          birthtime: stat.birthtime
        }
      })
    )

    // Sort by creation date: from newest to oldest
    matchedFiles = matchedFiles.sort((a, b) => {
      return b.birthtime.getTime() - a.birthtime.getTime()
    })

    // Delete files
    for (let index = element.keep; index < matchedFiles.length; index++) {
      const path = matchedFiles[index].path
      try {
        await fse.remove(path)
        log.warning(`Deleted old file or folder: ${log.path(path)}`)
      } catch (e) {
        log.error(e)
      }
    }
  }
}

/**
 * Backup file or folder
 * @param {string} wildcard Wildcard
 * @return {object} regex Regex
 */
const convertWildcardToRegex = (wildcard) => {
  const w = wildcard.replace(/[.+^${}()|[\]\\]/g, '\\$&') // Regexp escape
  return new RegExp(`^${w
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
    .replace(/;/g, '|')}$`, 'i')
}

/**
 * Backup file or folder
 * @param {object} element Current backup element
 * @param {string} to To path
 */
const backupFileOrFolder = async (element, to) => {
  let from = []

  // Convert path element to array
  try {
    from = await convertFromToArray(element)
  } catch (error) {
    log.warning(error.message)
    return
  }

  // Resolve from and to path
  const fromToArray = []
  for (const fromItem of from) {
    const base = path.parse(fromItem).base
    const absolutePathTo = await resolvePathTo(to, base, element)
    fromToArray.push({
      from: fromItem,
      to: absolutePathTo
    })
  }

  // Copy files or folders
  for (const fromToItem of fromToArray) {
    try {
      await fse.copy(fromToItem.from, fromToItem.to)
      log.info(`From: ${log.path(fromToItem.from)}`)
      log.info(`To: ${log.path(fromToItem.to)}`)
    } catch (e) {
      log.error(e)
    }
  }

  // Delete old files or folders
  await deleteOldBackupFilesOrFolders(element, from, to)
}

/**
 * Backup file or folder as 7z
 * @param {object} element Current backup element
 * @param {string} to To path
 */
const backup7z = async (element, to) => {
  let from = []

  // Convert path element to array
  try {
    from = await convertFromToArray(element)
  } catch (error) {
    log.warning(error.message)
    return
  }

  // Get to path
  const base = path.parse(from[0]).base
  const absolutePathTo = await resolvePathTo(to, base, element)

  // Create 7z file
  const stream = seven.add(absolutePathTo, from, {
    $bin: pathTo7zip
  })

  // The next function is a wrapper, the promise resolve
  const streamEvents = () => {
    return new Promise((resolve, reject) => {
      // Wait until the 7z file is created successfully
      stream.on('end', async () => {
        // Log
        log.info(`From: ${log.path(from.join('\n      '))}`)
        log.info(`To: ${log.path(absolutePathTo)}`)

        // Delete old files or folders
        const fromArray = []
        fromArray.push(from[0])
        await deleteOldBackupFilesOrFolders(element, fromArray, to)
        resolve()
      })

      // Error creating the 7z file
      stream.on('error', (e) => reject(e))
    })
  }

  try {
    await streamEvents()
  } catch (e) {
    log.error(e)
  }
}

/**
 * Backup file or folder as zip
 * @param {object} element Current backup element
 * @param {string} to To path
 */
const backupZip = async (element, to) => {
  let from = []

  // Convert path element to array
  try {
    from = await convertFromToArray(element)
  } catch (error) {
    log.warning(error.message)
    return
  }

  // Get to path
  const base = path.parse(from[0]).base
  const absolutePathTo = await resolvePathTo(to, base, element)

  // Create zip file
  const zip = new AdmZip()
  for (const fromItem of from) {
    const isFileFlag = await isFile(fromItem)
    if (isFileFlag) {
      zip.addLocalFile(fromItem)
    } else {
      zip.addLocalFolder(fromItem, path.parse(fromItem).base)
    }
  }

  // Write zip
  zip.writeZip(absolutePathTo)

  // Log
  log.info(`From: ${log.path(from.join('\n      '))}`)
  log.info(`To: ${log.path(absolutePathTo)}`)

  // Delete old files or folders
  const fromArray = []
  fromArray.push(from[0])
  await deleteOldBackupFilesOrFolders(element, fromArray, to)
}

module.exports = {
  readConfigFile,
  saveConfigFile,
  existFileOrFolder,
  isFileOrFolderInBackup,
  resolvePath,
  backupFileOrFolder,
  backup7z,
  backupZip
}
