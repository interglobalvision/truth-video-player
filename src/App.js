import React, { Component } from 'react';
//import isElectron from 'is-electron';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  constructor() {
    super()

    this.state = {
      activeIndex: 0,
      activeVideo: null,
      videos: [],
      showControls: true,
      shuffleOrder: false,
      videosLoaded: false,
      videoPlaying: false,
      loopPlayback: true
    }

    this.gridSize = 25
    this.wrapperTransitionDelay = 3 //seconds
    this.hideControlsDelay = 2000 //ms
    this.playOrder = []

    this.controlPanelHideTimer = null

    this.hideControlsTimeout = this.hideControlsTimeout.bind(this)
    this.handleSelectDirectoryClick = this.handleSelectDirectoryClick.bind(this)
    this.handleDirectorySelected = this.handleDirectorySelected.bind(this)
    this.createVideos = this.createVideos.bind(this)
    this.handlePlay = this.handlePlay.bind(this)
    this.handleVideoEnd = this.handleVideoEnd.bind(this)
    this.wrapperStyle = this.wrapperStyle.bind(this)
  }

  componentDidMount() {
    window.ipcRenderer.on('directory-selected', this.handleDirectorySelected)
  }

  componentWillUnmount() {
    clearTimeout(this.controlPanelHideTimer)
  }

  setPlayOrder() {
    let playOrder = []
    let length = this.state.videos.length < this.gridSize ? this.gridSize : this.state.videos.length

    for (let i = 0; i < length; i++) {
      playOrder.push(i)
    }

    if (this.state.shuffleOrder) {
      playOrder.sort(() => Math.random() - 0.5)
    }

    this.playOrder = playOrder
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
    let activeIndex = this.state.activeIndex

    this[`video_${activeIndex}`].pause()

    this.setState({
      videos: videoFiles,
      showControls: false,
      videoPlaying: false
    })

    this.setPlayOrder()
    this.loadVideos()
  }

  loadVideos() {
    let videoIndex = 0

    for (let gridIndex = 0; gridIndex < this.gridSize; gridIndex++) {
      this[`video_${gridIndex}`].src = 'file://' + this.state.videos[videoIndex]

      videoIndex++

      // If less vidoes than gridSize
      // and we're at the last video
      if (this.gridSize > this.state.videos.length && videoIndex >= this.state.videos.length) {
        videoIndex = 0
      }
    }

    this.setState({
      videosLoaded: true
    })
  }

  handlePlay() {
    this.setState({
      showControls: false,
      videoPlaying: true
    })

    this.playVideo(this.state.activeIndex)
  }

  handleVideoEnd() {
    let activeIndex = 0

    if (this.state.activeIndex < (this.gridSize - 1) && this.state.activeIndex >= 0) {
      activeIndex = this.state.activeIndex + 1
    }

    this.setState({
      activeIndex: activeIndex
    })

    this.playVideo(activeIndex)
  }

  playVideo(activeIndex) {
    const index = this.playOrder[activeIndex]

    this[`video_${index}`].play()
  }

  wrapperStyle() {
    const index = this.playOrder[this.state.activeIndex]
    const gridSqrt = Math.sqrt(this.gridSize)
    const zoom = 'scale(' + gridSqrt + ')'
    const closestMultiple = Math.floor(index / gridSqrt) * gridSqrt
    const posX = (index - closestMultiple) * 20
    const posY = closestMultiple * 4
    const posXY = 'translate(-' + posX + '%, -' + posY + '%)'

    return {
      transform: zoom + ' ' + posXY,
      transition: 'transform ' + this.wrapperTransitionDelay + 's'
    }
  }

  render() {
    return (
      <div className={this.state.showControls ? 'App show-controls' : 'App'} onMouseMove={this.hideControlsTimeout}>
        <header id="control-panel">
          <h1>Truth Video Player</h1>
          <div>
            <label>Shuffle Order</label>
            <input type="checkbox" onChange={() => this.setState(prevState => ({
                shuffleOrder: !prevState.shuffleOrder
              }))} checked={this.state.shuffleOrder}></input>
          </div>
          <div>
            <label>Loop Playback</label>
            <input type="checkbox" onChange={() => this.setState(prevState => ({
                loopPlayback: !prevState.loopPlayback
              }))} checked={this.state.loopPlayback}></input>
          </div>
          <div>
            <button onClick={this.handleSelectDirectoryClick}>Select Directory</button>
          </div>
          <div>
            <button onClick={this.handlePlay} disabled={!this.state.videosLoaded}>Play</button>
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
