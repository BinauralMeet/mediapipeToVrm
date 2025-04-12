import {useRef} from 'react'
import './App.css'
import WebGLCanvas, { WebGLCanvasRef } from './components/WebGLCanvas'
import VideoControlPanel, { VideoControlPanelRef } from './components/VideoControlPanel'
import { useVideoControl } from './hooks/useVideoControl'

function App() {
  const webGLCanvasRef = useRef<WebGLCanvasRef>(null)
  const videoControlPanelRef = useRef<VideoControlPanelRef>(null)
  const { isVideoActive, handleVideoToggle } = useVideoControl(webGLCanvasRef)

  return (
    <div className="App" style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', display: 'flex' }}>
      <VideoControlPanel 
        ref={videoControlPanelRef}
        isVideoActive={isVideoActive}
        onVideoToggle={handleVideoToggle}
        webGLCanvasRef={webGLCanvasRef}
      />
      <div style={{ width: '66.67%', height: '100%', position: 'relative' }}>
        <WebGLCanvas ref={webGLCanvasRef} width={800} height={600} landmarks={videoControlPanelRef.current?.getLandmarks()} />
      </div>
    </div>
  )
}

export default App 