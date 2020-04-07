# Bak

Backup files and folders

## Install

```shell
npm install -g bak
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
  // Directory where the backup will be made
  "path": "",
  // Array with the files and folders to backup
  "backup": [
    {
      // Path to file or folder to backup
      "path": "",
      // Type of compression = [none, 7z, zip]
      "compression": "none"
    }
  ]
}
```
