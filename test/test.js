const { create, add, run } = require('../lib/commands')

const createTest = async () => {
  console.log('Create command')
  await create('%USERPROFILE%\\bak-config.json', {
    path: '%USERPROFILE%\\Backup'
  })
}

const addTest = async () => {
  console.log('Add command')
  await add(
    '%USERPROFILE%/bak-config.json',
    '%WINDIR%/System32/drivers/etc/hosts',
    {
      name: 'Host file',
      subfolder: 'Windows'
    }
  )
}

const runTest = async () => {
  console.log('Run command')
  await run('%USERPROFILE%\\bak-config.json')
}

const currentTest = 'run'

switch (currentTest) {
  case 'create':
    createTest()
    break
  case 'add':
    addTest()
    break
  case 'run':
    runTest()
    break
}
