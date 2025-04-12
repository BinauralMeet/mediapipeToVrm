import { useState, useEffect, useRef } from 'react'
import './App.css'
import WebGLCanvas, { WebGLCanvasRef } from './components/WebGLCanvas'
import Canvas2D, { Canvas2DRef } from './components/Canvas2D'
import { Button } from '@mui/material'
import VideocamIcon from '@mui/icons-material/Videocam'
import { startMpTrack, stopMpTrack } from './utils/mediapipeCamera'
import { AllLandmarks } from './utils/vrmIK'
import { drawFikStructure } from './utils/vrmIK'
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh'
import { HAND_CONNECTIONS, POSE_CONNECTIONS } from '@mediapipe/holistic'
import * as MP from '@mediapipe/drawing_utils'

function App() {
  const [isVideoActive, setIsVideoActive] = useState(false)
  const [landmarks, setLandmarks] = useState<AllLandmarks | undefined>(undefined)
  const canvasRef = useRef<Canvas2DRef>(null)
  const webGLCanvasRef = useRef<WebGLCanvasRef>(null)

  useEffect(() => {
    // onLandmarkUpdateの実装
    const onLandmarkUpdate = (lms: AllLandmarks) => {
      const ctx = canvasRef.current?.getContext()
      if (!ctx) return

      // キャンバスをクリア
      ctx.clearRect(0, 0, 320, 240)

      if (lms.image) ctx.drawImage(lms.image, 0, 0)
      
      // landmarksの状態を更新
      setLandmarks(lms)

      // ランドマークを描画
      MP.drawConnectors(ctx, lms.poseLm, POSE_CONNECTIONS,
                  { color: '#00FF00', lineWidth: 4 }); // Green lines
      MP.drawLandmarks(ctx, lms.poseLm,
                  { color: '#FF0000', lineWidth: 2, radius: 3 }); // Red dots
      MP.drawConnectors(ctx, lms.faceLm, FACEMESH_TESSELATION,
                                    { color: 'rgba(200, 200, 200, 0.5)', lineWidth: 1 }); // Light grey, semi-transparent
      const handLandmarkStyle = { color: '#FFFFFF', lineWidth: 2, radius: 3 }; // White dots
      const leftHandConnectionStyle = { color: '#CC0000', lineWidth: 4 };     // Dark Red lines
      const rightHandConnectionStyle = { color: '#00CC00', lineWidth: 4 };    // Dark Green lines
      MP.drawConnectors(ctx, lms.leftHandLm, HAND_CONNECTIONS, leftHandConnectionStyle);
      MP.drawLandmarks(ctx, lms.leftHandLm, handLandmarkStyle);
      MP.drawConnectors(ctx, lms.rightHandLm, HAND_CONNECTIONS, rightHandConnectionStyle);
      MP.drawLandmarks(ctx, lms.rightHandLm, handLandmarkStyle);

      // FIK構造を描画
      const vrmAvatar = webGLCanvasRef.current?.getVrmAvatar()
      if (vrmAvatar?.structure) {
        drawFikStructure(vrmAvatar.structure, lms, ctx)
      }
    }

    // グローバルなonLandmarkUpdateを上書き
    ;(window as any).onLandmarkUpdate = onLandmarkUpdate

    return () => {
      // クリーンアップ
      delete (window as any).onLandmarkUpdate
    }
  }, [])

  const handleVideoToggle = async () => {
    if (!isVideoActive) {
      try {
        await startMpTrack(false) // falseはfaceOnlyパラメータ
        setIsVideoActive(true)
      } catch (error) {
        console.error('ビデオの開始に失敗しました:', error)
      }
    } else {
      stopMpTrack()
      setIsVideoActive(false)
    }
  }

  return (
    <div className="App" style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', display: 'flex' }}>
      <div style={{ width: '33.33%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', width: '320px', height: '240px', marginBottom: '20px' }}>
          <Canvas2D ref={canvasRef} width={320} height={240} />
        </div>
        <Button
          variant="contained"
          color={isVideoActive ? "secondary" : "primary"}
          startIcon={<VideocamIcon />}
          onClick={handleVideoToggle}
          sx={{
            padding: '12px 24px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }
          }}
        >
          {isVideoActive ? 'ビデオを停止' : 'ビデオを開始'}
        </Button>
      </div>
      <div style={{ width: '66.67%', height: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <WebGLCanvas ref={webGLCanvasRef} width={800} height={600} landmarks={landmarks} />
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <Canvas2D width={800} height={600} />
        </div>
      </div>
    </div>
  )
}

export default App 