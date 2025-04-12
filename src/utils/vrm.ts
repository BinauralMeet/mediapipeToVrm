import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three'
import {createStrcture3DEx, drawFikStructure, FikStructure3DEx, updateStructure3DEx, setRestingPoseToVrm, AllLandmarks} from './vrmIK'

declare const d:any                  //  from index.html


export interface VRMAvatar{
  vrm: VRM
  dispo?: ()=>void
  structure?: FikStructure3DEx
}
export function freeVrmAvatar(avatar: VRMAvatar){
  avatar.vrm.scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => mat.dispose())
      } else {
        obj.material.dispose()
      }
    }
  })
}

export function createVrmAvatar(url:string){
  const promise = new Promise<VRMAvatar>((resolve, reject)=>{
    loadVrmAvatar(url).then((vrm)=>{
      /*  //  add coordinate arrows at right hand
      const hand = vrm.humanoid.getNormalizedBoneNode('rightHand')
      if (hand){
        const sphereG = new THREE.SphereGeometry(0.03, 4, 4);
        const coneG = new THREE.ConeGeometry(0.03, 0.08, 4);
        const materialW = new THREE.MeshBasicMaterial( {color: 0x00AAAAAA} );
        const materialG = new THREE.MeshBasicMaterial( {color: 0x0000FF00} );
        const materialR = new THREE.MeshBasicMaterial( {color: 0x00FF0000} );
        const materialB = new THREE.MeshBasicMaterial( {color: 0x000000FF} );
        let sphere = new THREE.Mesh(sphereG, materialW)
        hand.add(sphere);
        let cone = new THREE.Mesh(coneG, materialR);
        cone.translateX(0.1)
        cone.rotateZ(-0.5*Math.PI)
        hand.add(cone);
        cone = new THREE.Mesh(coneG, materialG);
        cone.translateY(0.1)
        hand.add(cone);
        cone = new THREE.Mesh(coneG, materialB);
        cone.translateZ(0.1)
        cone.rotateX(0.5*Math.PI)
        hand.add(cone);
      }   //  */
      setRestingPoseToVrm(vrm)
      const avatar:VRMAvatar = {
        vrm,
      }
      //  console.log(`avatar for ${participant.id} loaded.`)
      resolve(avatar)
    })
  })
  return promise
}

function fillRoundedRect(vas:CanvasRenderingContext2D, x:number, y:number, width:number, height:number, radius:number) {
  vas.beginPath();
  vas.moveTo(x, y + radius);
  vas.arcTo(x, y + height, x + radius, y + height, radius);
  vas.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  vas.arcTo(x + width, y, x + width - radius, y, radius);
  vas.arcTo(x, y, x, y + radius, radius);
  vas.fill();
}

let loader: GLTFLoader
function loadVrmAvatar(url: string){
  const promise = new Promise<VRM>((resolve, _reject)=>{
    if (!loader){
      loader = new GLTFLoader()
      loader.register(parser => new VRMLoaderPlugin(parser))
    }
    loader.load(
      url,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM
        if (!vrm) return;
        VRMUtils.combineSkeletons(vrm.scene)
        let head = vrm.scene.getObjectByName('Head')
        const firstPersonBone = vrm.humanoid?.getNormalizedBoneNode('head');
        if (!head && firstPersonBone) head = firstPersonBone;
        if (head){
          const height = head.matrixWorld.elements[13]
          //console.log(`height:${height} head:${head}`)
          vrm.scene.position.y = 0.5 - height
        }
        resolve(vrm)
      },
    )
  })
  return promise
}


export function applyMPLandmarkToVrm(avatar:VRMAvatar, landmarks: AllLandmarks|undefined, c2dDebug?: CanvasRenderingContext2D){
  if (!avatar.vrm) return
  if (landmarks){
    if (!avatar.structure){
      avatar.structure = createStrcture3DEx(avatar.vrm)
    }
    updateStructure3DEx(avatar.vrm, avatar.structure, landmarks)

    if (c2dDebug){    //  debug drawing for FIK
      drawFikStructure(avatar.structure, landmarks, c2dDebug)
    }
  }
}
