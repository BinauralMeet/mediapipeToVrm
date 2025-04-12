import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';

interface WebGLCanvasProps {
  width: number;
  height: number;
}

const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

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
      if (vrmRef.current && sceneRef.current) {
        const box = new THREE.Box3().setFromObject(vrmRef.current.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // モデルの高さに基づいてカメラ位置を設定
        const distance = size.y * 1.5;
        cameraRef.current.position.set(0, center.y, distance);
        cameraRef.current.lookAt(center);
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
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current || !vrmRef.current || !isModelLoaded) return;
    
    const animate = () => {
      requestAnimationFrame(animate);
      vrmRef.current?.update(0.016);
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };
    
    animate();
    
    return () => {
      // アニメーションのクリーンアップ
    };
  }, [isModelLoaded]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Three.jsのセットアップ
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 20);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // ライティングの設定
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // VRMローダーの設定
    const loader = new GLTFLoader();
    loader.register((parser: any) => {
      return new VRMLoaderPlugin(parser);
    });

    // VRMモデルの読み込み
    loader.load(
      'https://binaural.me/public_packages/uploader/vrm/avatar/AvatarSample_E2.vrm',
      (gltf: GLTF) => {
        const vrm = gltf.userData.vrm as VRM;
        vrmRef.current = vrm;
        scene.add(vrm.scene);

        // モデルのサイズに基づいてカメラ位置を調整
        const box = new THREE.Box3().setFromObject(vrm.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // モデルの高さに基づいてカメラ位置を設定
        const distance = size.y * 1.5;
        camera.position.set(0, center.y, distance);
        camera.lookAt(center);
        
        // モデルが読み込まれたことを示す
        setIsModelLoaded(true);
      },
      (progress: { loaded: number; total: number }) => {
        console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%');
      },
      (error: unknown) => console.error(error)
    );

    // クリーンアップ
    return () => {
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} />;
};

export default WebGLCanvas; 