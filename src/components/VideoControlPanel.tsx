import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import { Button } from '@mui/material'
import VideocamIcon from '@mui/icons-material/Videocam'
import Canvas2D, { Canvas2DRef } from './Canvas2D'
import { AllLandmarks } from '../utils/vrmIK'
import { drawFikStructure } from '../utils/vrmIK'
import { applyMPLandmarkToVrm, setRestingPoseToVrm } from '../utils/vrm'
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh'
import { HAND_CONNECTIONS, POSE_CONNECTIONS } from '@mediapipe/holistic'
import * as MP from '@mediapipe/drawing_utils'
import { WebGLCanvasRef } from './WebGLCanvas'

interface VideoControlPanelProps {
  isVideoActive: boolean
  onVideoToggle: () => void
  webGLCanvasRef: React.RefObject<WebGLCanvasRef>
}

export interface VideoControlPanelRef {
  getCanvasContext: () => CanvasRenderingContext2D | null
  getLandmarks: () => AllLandmarks | undefined
}

const VideoControlPanel = forwardRef<VideoControlPanelRef, VideoControlPanelProps>(({ isVideoActive, onVideoToggle, webGLCanvasRef }, ref) => {
  const canvasRef = useRef<Canvas2DRef>(null)
  const [landmarks, setLandmarks] = useState<AllLandmarks | undefined>(undefined)

  useImperativeHandle(ref, () => ({
    getCanvasContext: () => canvasRef.current?.getContext() || null,
    getLandmarks: () => landmarks
  }))

  useEffect(() => {
    const onLandmarkUpdateHandler = (lms: AllLandmarks) => {
      const ctx = canvasRef.current?.getContext()
      if (!ctx) return

      // キャンバスをクリア
      ctx.clearRect(0, 0, 320, 240)

      if (lms.image) ctx.drawImage(lms.image, 0, 0)
      
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

      // VRMアバターにランドマークを適用
      if (vrmAvatar) {
        applyMPLandmarkToVrm(vrmAvatar, lms)
      }

      // landmarksの状態を更新
      setLandmarks(lms)
    }

    // グローバルなonLandmarkUpdateを上書き
    ;(window as any).onLandmarkUpdate = onLandmarkUpdateHandler

    return () => {
      // クリーンアップ
      delete (window as any).onLandmarkUpdate
    }
  }, [webGLCanvasRef, isVideoActive])

  return (
    <div style={{ width: '33.33%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', width: '320px', height: '240px', marginBottom: '20px' }}>
        <Canvas2D ref={canvasRef} width={320} height={240} />
      </div>
      <Button
        variant="contained"
        color={isVideoActive ? "secondary" : "primary"}
        startIcon={<VideocamIcon />}
        onClick={onVideoToggle}
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
  )
})

VideoControlPanel.displayName = 'VideoControlPanel'

export default VideoControlPanel 