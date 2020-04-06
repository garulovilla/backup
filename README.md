# Backup
Backup files and folders

## Configuration file

```json
{
  // Directory where the backup will be made
  "path": "",
  // Array with the files and folders to backup
  "backup": [
    {
      // Path to file or folder to backup
      "path": "",
      // Type of compression = [none, 7zip, zip]
      "compression": "none"
    }
  ]
}
```