import { useState, useCallback } from 'react'
import { startMpTrack, stopMpTrack } from '../utils/mediapipeCamera'
import { WebGLCanvasRef } from '../components/WebGLCanvas'

export const useVideoControl = (webGLCanvasRef: React.RefObject<WebGLCanvasRef>) => {
  const [isVideoActive, setIsVideoActive] = useState(false)

  const handleVideoToggle = useCallback(async () => {
    if (!isVideoActive) {
      try {
        await startMpTrack(false)
        setIsVideoActive(true)
      } catch (error) {
        console.error('ビデオの開始に失敗しました:', error)
      }
    } else {
      stopMpTrack()
      setIsVideoActive(false)
    }
  }, [isVideoActive, webGLCanvasRef])

  return {
    isVideoActive,
    handleVideoToggle
  }
} 