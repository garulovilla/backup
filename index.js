const { program } = require('commander')
const { create, run, add } = require('./source/commands')

program.version('0.0.1')

program
  .command('create <config_file>')
  .description('create config file')
  .action((configFile) => {
    create(configFile)
  })

program
  .command('run <config_file>')
  .description('run backup with file')
  .action((configFile) => {
    run(configFile)
  })

program
  .command('add <file_folder> <config_file>')
  .description('add file or folder to config file')
  .action((fileOrFolder, configFile) => {
    add(configFile, fileOrFolder)
  })

program.parse(process.argv)
