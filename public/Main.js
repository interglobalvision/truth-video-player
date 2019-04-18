const electron = require('electron')
const {app, BrowserWindow, ipcMain, dialog} = electron

// Load the File System to execute our common tasks (CRUD)
const fs = require('fs')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const {
  default: installExtension,
  REACT_DEVELOPER_TOOLS
} = require('electron-devtools-installer')

const createWindow = () => {
  // Get screen size
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    fullscreen: true,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + '/preload.js',
      webSecurity: false
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL('http://localhost:3000/')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Install React Dev Tools
  installExtension(REACT_DEVELOPER_TOOLS)
  .then((name) => { console.log(`Added Extension:  ${name}`) })
  .catch((err) => { console.log('An error occurred: ', err) })

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

ipcMain.on('select-directory', (event) => {
  dialog.showOpenDialog( mainWindow, {
      properties: ['openDirectory']
    }, (dirPath) => {
      if (dirPath === undefined){
        console.error("You didn't select the directory")
        return
      }

      sendVideoFiles(event, dirPath[0])
    }
  )
})

function sendVideoFiles (e, dirPath) {
  // read contents of directory
  fs.readdir(dirPath, (err, items) => {
    let videoFiles = [];

    for (let i = 0; i < items.length; i++) {
      // get file extension
      const extension = path.extname(items[i]);

      // filter file by extension
      if (
        extension === '.mp4' ||
        extension === '.mov' ||
        extension === '.mkv'
      ) {
        // add file to array with directory path
        videoFiles.push(dirPath + '/' + items[i]);
      }
    }

    if (videoFiles.length === 0) {
      console.error("No valid video files in selected directory")
      return
    }

    // return video file array to renderer
    e.sender.send('directory-selected', videoFiles)
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
