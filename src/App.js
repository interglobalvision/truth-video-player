import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor() {
    super()

    this.state = {
      activeVideoIndex: null,
      videoSrcList: [],
      showControls: true,
      shuffleOrder: true,
      videosLoaded: false,
      loopPlayback: true,
      isPlaying: false,
      devMode: false
    }

    this.gridSize = 9 // must be a square number (9, 16, 25...)

    /* X position multiplier
    /  gridSize === 9 ? 33.333333333
    /  gridSize === 16 ? 25
    /  gridSize === 25 ? 20
    */
    this.xPosMultiplier = 33.333333333

    /* Y position multiplier
    /  gridSize === 9 ? 11.111111111
    /  gridSize === 16 ? 6.25
    /  gridSize === 25 ? 5
    */
    this.yPosMultiplier = 11.111111111

    this.wrapperTransitionDelay = 3000 // ms
    this.hideControlsDelay = 2000 // ms
    this.playOrder = []

    this.controlPanelHideTimer = null
    this.loadFollowingVideoTimer = null
    this.lastVideoIndexLoaded = 0

    this.hideControlsTimeout = this.hideControlsTimeout.bind(this)
    this.handleSelectDirectoryClick = this.handleSelectDirectoryClick.bind(this)
    this.handleDirectorySelected = this.handleDirectorySelected.bind(this)
    this.createVideos = this.createVideos.bind(this)
    this.playVideo = this.playVideo.bind(this)
    this.pauseVideo = this.pauseVideo.bind(this)
    this.handleVideoEnd = this.handleVideoEnd.bind(this)
    this.wrapperStyle = this.wrapperStyle.bind(this)
    this.loadFollowingVideo = this.loadFollowingVideo.bind(this)
  }

  componentDidMount() {
    window.ipcRenderer.on('directory-selected', this.handleDirectorySelected)
  }

  componentWillUnmount() {
    clearTimeout(this.controlPanelHideTimer)
    clearTimeout(this.loadFollowingVideoTimer)
  }

  // Create video elements in grid
  createVideos() {
    let videos = []

    for (let i = 0; i < this.gridSize; i++) {
      videos.push(
        <div className="video-container" key={`video_container_${i}`}>
          <video autoPlay={false} muted={false} volume={1} key={`video_${i}`} onEnded={this.handleVideoEnd} ref={el => {
            this[`video_${i}`] = el
          }}></video>
        </div>
      )
    }

    return videos
  }

  handleSelectDirectoryClick() {
    window.ipcRenderer.send('select-directory')

    if (this.state.isPlaying) {
      this.pauseVideo()
    }
  }

  hideControlsTimeout() {
    clearTimeout(this.controlPanelHideTimer)
    this.setState({
      showControls: true
    })
    this.controlPanelHideTimer = setTimeout(() => {
      this.setState({
        showControls: false
      })
    }, this.hideControlsDelay)
  }

  handleDirectorySelected(event, videoFiles) {
    if (this.state.shuffleOrder) {
      videoFiles.sort(() => Math.random() - 0.5)
    }

    this.setState({
      activeVideoIndex: 0,
      videoSrcList: videoFiles
    })

    this.shufflePlayOrder()
    this.loadInitialVideos()
  }

  shufflePlayOrder() {
    let playOrder = []

    for (let i = 0; i < this.gridSize; i++) {
      playOrder.push(i)
    }

    playOrder.sort(() => Math.random() - 0.5)

    this.playOrder = playOrder
  }

  loadInitialVideos() {
    let videoIndex = 0

    for (let gridIndex = 0; gridIndex < this.gridSize; gridIndex++) {
      this[`video_${this.playOrder[gridIndex]}`].src = 'file://' + this.state.videoSrcList[videoIndex]

      this.lastVideoIndexLoaded = videoIndex

      videoIndex++

      if (this.gridSize > this.state.videoSrcList.length && videoIndex >= this.state.videoSrcList.length) {
        // If less videos than gridSize
        // and we're at the last video
        videoIndex = 0
      }
    }

    this.setState({
      videosLoaded: true
    })
  }

  handleVideoEnd() {
    let prevVideoIndex = this.state.activeVideoIndex
    let nextVideoIndex = 0

    if (prevVideoIndex < (this.state.videoSrcList.length - 1) || this.state.loopPlayback) {

      if (prevVideoIndex < (this.gridSize - 1)) {
        nextVideoIndex = prevVideoIndex + 1
      }

      this.setState({
        activeVideoIndex: nextVideoIndex
      })

      this.playVideo(nextVideoIndex)

      this.loadFollowingVideoTimer = setTimeout(() => {
        clearTimeout(this.loadFollowingVideoTimer)
        this.loadFollowingVideo(prevVideoIndex)
      }, this.wrapperTransitionDelay)

    } else {
      this.setState({
        activeVideoIndex: 0,
        isPlaying: false
      })
    }
  }

  loadFollowingVideo(prevVideoIndex) {
    let prevVideoElementIndex = this.playOrder[prevVideoIndex]
    let indexToLoad = 0

    if (this.lastVideoIndexLoaded < (this.state.videoSrcList.length - 1)) {
      indexToLoad = this.lastVideoIndexLoaded + 1
    }

    this[`video_${prevVideoElementIndex}`].src = 'file://' + this.state.videoSrcList[indexToLoad]

    this.lastVideoIndexLoaded = indexToLoad
  }

  playVideo(activeVideoIndex) {
    let activeVideoElementIndex = 0
    if (activeVideoIndex !== undefined) {
      activeVideoElementIndex = this.playOrder[activeVideoIndex]
    } else {
      activeVideoElementIndex = this.playOrder[this.state.activeVideoIndex]
    }

    this[`video_${activeVideoElementIndex}`].play()

    this.setState({
      isPlaying: true
    })
  }

  pauseVideo() {
    const activeVideoElementIndex = this.playOrder[this.state.activeVideoIndex]

    this[`video_${activeVideoElementIndex}`].pause()

    this.setState({
      isPlaying: false
    })
  }

  wrapperStyle() {
    const index = this.playOrder[this.state.activeVideoIndex]
    const gridSqrt = Math.sqrt(this.gridSize)
    const zoom = 'scale(' + gridSqrt + ')'
    const closestMultiple = Math.floor(index / gridSqrt) * gridSqrt
    const posX = (index - closestMultiple) * this.xPosMultiplier
    const posY = closestMultiple * this.yPosMultiplier
    const posXY = 'translate(-' + posX + '%, -' + posY + '%)'
    const transform = this.state.devMode ? 'none' : zoom + ' ' + posXY
    return {
      transform: transform,
      transition: 'transform ' + this.wrapperTransitionDelay + 'ms',
      gridTemplateColumns: 'repeat(' + gridSqrt + ', 1fr)',
      gridTemplateRows: 'repeat(' + gridSqrt + ', 1fr)',
    }
  }

  render() {
    return (
      <div className={this.state.showControls ? 'App show-controls' : 'App'} onMouseMove={this.hideControlsTimeout}>
        <header id="control-panel">
          <h1>In Search of the Truth</h1>
          <div className="panel-section">
            <input id="option-devmode" type="checkbox" onChange={() => this.setState(prevState => ({
                devMode: !prevState.devMode
              }))} checked={this.state.devMode}></input>
            <label htmlFor="option-devmode">Dev Mode</label>
          </div>
          <div className="panel-section">
            <input id="option-shuffle" type="checkbox" onChange={() => this.setState(prevState => ({
                shuffleOrder: !prevState.shuffleOrder
              }))} checked={this.state.shuffleOrder}></input>
            <label htmlFor="option-shuffle">Shuffle Order</label>
          </div>
          <div className="panel-section">
            <input id="option-loop" type="checkbox" onChange={() => this.setState(prevState => ({
                loopPlayback: !prevState.loopPlayback
              }))} checked={this.state.loopPlayback}></input>
            <label htmlFor="option-loop">Loop Playback</label>
          </div>
          <div className="panel-section">
            <div><span style={{fontSize: '10px'}}>*Shuffle and Loop must be configured before selecting directory</span></div>
          </div>
          <div className="panel-section">
            <button onClick={this.handleSelectDirectoryClick}>Select Directory</button>
          </div>
          <div className="panel-section">
            <button onClick={() => {
              if (this.state.isPlaying) {
                this.pauseVideo()
              } else {
                this.playVideo()
              }}} disabled={!this.state.videosLoaded}>{this.state.isPlaying ? 'Pause' : 'Play'}</button>
          </div>
        </header>
        <div id="wrapper" style={this.wrapperStyle()}>
          {this.createVideos()}
        </div>
      </div>
    );
  }
}

export default App;
