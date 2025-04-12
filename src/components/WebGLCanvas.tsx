import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createVrmAvatar, VRMAvatar, applyMPLandmarkToVrm } from '../utils/vrm';
import { AllLandmarks } from '../utils/vrmIK';

interface WebGLCanvasProps {
  width: number;
  height: number;
  landmarks?: AllLandmarks;
}

export interface WebGLCanvasRef {
  getVrmAvatar: () => VRMAvatar | null;
}

const WebGLCanvas = forwardRef<WebGLCanvasRef, WebGLCanvasProps>(({ width, height, landmarks }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const vrmAvatarRef = useRef<VRMAvatar | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    getVrmAvatar: () => vrmAvatarRef.current,
  }));

  // キャンバスサイズの変更を監視
  useEffect(() => {
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      
      // キャンバスのサイズを更新
      rendererRef.current.setSize(width, height);
      
      // カメラのアスペクト比を更新
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      // VRMモデルが読み込まれている場合は、カメラ位置を再調整
      if (vrmAvatarRef.current && sceneRef.current) {
        const box = new THREE.Box3().setFromObject(vrmAvatarRef.current.vrm.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // モデルの高さに基づいてカメラ位置を設定
        const distance = size.y * 1.5;
        cameraRef.current.position.set(0, center.y, distance);
        cameraRef.current.lookAt(center);
        
        // コントロールのターゲットを更新
        if (controlsRef.current) {
          controlsRef.current.target.copy(center);
          controlsRef.current.update();
        }
      }
    };
    
    // 初期設定とリサイズイベントの登録
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height]);

  // アニメーションループを別のuseEffectで管理
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current || !vrmAvatarRef.current || !isModelLoaded) return;
    
    const animate = () => {
      requestAnimationFrame(animate);
      vrmAvatarRef.current?.vrm.update(0.016);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };
    
    animate();
    
    return () => {
      // アニメーションのクリーンアップ
    };
  }, [isModelLoaded]);

  // ランドマークの更新を監視
  useEffect(() => {
    if (!vrmAvatarRef.current || !landmarks) return;
    applyMPLandmarkToVrm(vrmAvatarRef.current, landmarks);
  }, [landmarks]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Three.jsのセットアップ
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 20);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true 
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // ライティングの設定
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // VRMモデルの読み込み
    createVrmAvatar('https://binaural.me/public_packages/uploader/vrm/avatar/AvatarSample_E2.vrm')
      .then((avatar) => {
        vrmAvatarRef.current = avatar;
        scene.add(avatar.vrm.scene);

        // モデルのサイズに基づいてカメラ位置を調整
        const box = new THREE.Box3().setFromObject(avatar.vrm.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // モデルの高さに基づいてカメラ位置を設定
        const distance = size.y * 1.5;
        camera.position.set(0, center.y, distance);
        camera.lookAt(center);

        // OrbitControlsの設定
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 10;
        controls.maxPolarAngle = Math.PI / 2;
        controls.target.copy(center);
        controls.update();
        controlsRef.current = controls;

        // イベントリスナーの設定
        const handlePointerDown = (event: PointerEvent) => {
          event.preventDefault();
        };
        const handlePointerMove = (event: PointerEvent) => {
          event.preventDefault();
        };
        const handlePointerUp = (event: PointerEvent) => {
          event.preventDefault();
        };
        const handleWheel = (event: WheelEvent) => {
          event.preventDefault();
        };

        canvasRef.current?.addEventListener('pointerdown', handlePointerDown);
        canvasRef.current?.addEventListener('pointermove', handlePointerMove);
        canvasRef.current?.addEventListener('pointerup', handlePointerUp);
        canvasRef.current?.addEventListener('wheel', handleWheel);

        // モデルが読み込まれたことを示す
        setIsModelLoaded(true);

        return () => {
          canvasRef.current?.removeEventListener('pointerdown', handlePointerDown);
          canvasRef.current?.removeEventListener('pointermove', handlePointerMove);
          canvasRef.current?.removeEventListener('pointerup', handlePointerUp);
          canvasRef.current?.removeEventListener('wheel', handleWheel);
        };
      })
      .catch((error) => console.error(error));

    // クリーンアップ
    return () => {
      if (vrmAvatarRef.current) {
        vrmAvatarRef.current.dispo?.();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          touchAction: 'none',
          position: 'absolute',
          top: 0,
          left: 0
        }} 
      />
    </div>
  );
});

export default WebGLCanvas; 