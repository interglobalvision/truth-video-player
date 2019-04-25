const path = require('path')
const electron = require('electron')
const {app, BrowserWindow, ipcMain, dialog} = electron
const url = require('url');
const isDev = require('electron-is-dev');

// Load the File System to execute our common tasks (CRUD)
const fs = require('fs')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

if (isDev) {
  const {
    default: installExtension,
    REACT_DEVELOPER_TOOLS
  } = require('electron-devtools-installer')
}

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
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`)

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // Install React Dev Tools
  if (isDev) {
    installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => { console.log(`Added Extension:  ${name}`) })
    .catch((err) => { console.log('An error occurred: ', err) })
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
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
        //extension === '.mkv' ||
        //extension === '.mov' ||
        extension === '.mp4'
      ) {
        // add file to array with directory path
        videoFiles.push(dirPath + '/' + items[i]);
      }
    }

    if (videoFiles.length === 0) {
      console.error('No valid video files in selected directory')
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
