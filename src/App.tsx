import { useState, useEffect } from 'react'
import './App.css'
import WebGLCanvas from './components/WebGLCanvas'
import Canvas2D from './components/Canvas2D'

function App() {
  return (
    <div className="App" style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <WebGLCanvas width={800} height={600} />
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <Canvas2D width={800} height={600} />
      </div>
    </div>
  )
}

export default App 