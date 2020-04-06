const { program } = require('commander')

program.version('0.0.1')

program
  .command('create <config_file>')
  .description('create config file')
  .action((configFile) => {

  })

program
  .command('run <config_file>')
  .description('run backup with file')
  .action((configFile) => {

  })

program
  .command('add <file_folder> <config_file>')
  .description('add file or folder to config file')
  .action((fileOrFolder, configFile) => {

  })

program.parse(process.argv)
