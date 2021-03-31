# Bak

Backup files and folders

## Install globally

```shell
cd bak
npm link
```

## Commands

### Create

Create a new configuration file

```shell
bak create <config_file>
```

### Add

Add a file or folder to a configuration file

```shell
bak add <file_folder> <config_file>
```

### Run

Run a configuration file

```shell
bak run <config_file>
```

## Configuration file

```jsonc
{
  // Directory where the backup will be made (required)
  "path": "",

  // Array with the files and folders to backup (optional)
  "backup": [
    {
      // Name of backup (optional)
      "name": "",

      // Description of backup (optional)
      "description": "",

      // Path to file or folder to backup (required)
      // This can be a string or a array of strings
      "path": "",

      // Type of compression: "", "7z", "zip" (optional, default="")
      "compression": "",

      // A subfolder is created inside the backup folder with this name
      // and it is where the content will be stored (optional, default=current backup path)
      "subfolder": "",

      // Rename the file o folder (optional, default=current name of file/folder)
      // Note: Be careful when the path is an array and no compression is needed
      // you need always set the "/o" patter to differentiate files and folder
      // Patters that can be used:
      // /s - Timestamp => yyyyMMddhhmmss
      // /d - Date => yyyyMMdd
      // /t - Time => hhmmss
      // /o - Original name of file/folder
      "rename": "",

      // Only keep "n" number of backups. This is useful when you have
      // a rename pattern like "/d_/o" and you want to delete previous backups
      // to only keep "n" backups (optional, default=0 <means no delete any backup>)
      // Note: This option only takes effect if the "rename" property
      // is specified in the element
      "keep": 3,

      // Backup this item? (optional, default=true)
      "active": true
    }
  ]
}
```
