import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";


/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */

// GLTFLoader, used to load 3d models in .gltf file
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader()

// Used for animations, not for now
let mixer = null

// For cluster
// All shining particles(tiny) are included in this cluster 
var g = new THREE.SphereBufferGeometry(0.07)
var m = new THREE.MeshStandardMaterial()
m.transparent = true
m.opacity = 0.8
var m_color = new THREE.Color("#99ddff")
var pts = []
var cluster

// For cluster
// All shining particles(large) are included in this cluster 
var g_l = new THREE.SphereBufferGeometry(0.12)
var m_l = new THREE.MeshStandardMaterial()
m_l.transparent = true
m_l.opacity = 0.8
var m_l_color = new THREE.Color("#99ddff")
var pts_l = []
var cluster_l

let center

// Load FBX file
const loader = new FBXLoader();

/**
 *  For loading original model (with normal color and textures)
 */

// GLTF Loader
// gltfLoader.load(
//   'avatar-cartoon.glb',
//   (gltf) =>
//   {
//       gltf.scene.scale.set(40, 40, 40)
//       scene.add(gltf.scene)
//       console.log(gltf.scene)

//     //   gltf.scene.traverse(child => {
//     //   if (child.isMesh){
//     //     var prevMaterial = child.material;
//     //     child.material = new THREE.MeshPhysicalMaterial();
//     //     THREE.MeshBasicMaterial.prototype.copy.call( child.material, prevMaterial );
//     //     console.log(gltf.scene)
//     //   }
//     // });
//   }
// )

// FBX Loader
// loader.load(
//   '/pose/SK_Cartoon_Famale_021/SK_Cartoon_Famale_021.FBX',
//   (gltf) =>
//   {
//       // gltf.scale.set(40, 40, 40)
//       scene.add(gltf)
//       console.log(gltf)

//       // // Animation
//       // mixer = new THREE.AnimationMixer(gltf.scene)
//       // const action = mixer.clipAction(gltf.animations[2])
//       // action.play()
//   }
// )


// {...}_H models are used to draw shinging particles(tiny)
loader.load( '/pose/SK_Cartoon_Female_021/SK_Cartoon_Female_021_H.fbx', function ( group ) {

  var box3 = new THREE.Box3().setFromObject(group);
  var size = new THREE.Vector3();
  box3.getSize(size);
  const param = 50 / Math.max(size.x, size.y, size.z);
  group.scale.set(param, param, param);
  
  let v3 = new THREE.Vector3();
  group.traverse(child => {
    if (child.isMesh){
      let pos = child.geometry.attributes.position;
      child.material = new THREE.MeshStandardMaterial({color:"black"})
      for (let i = 1; i < pos.count; i+=40){
        v3.fromBufferAttribute(pos, i)
        v3.x = v3.x *param
        v3.y = v3.y *param
        v3.z = v3.z *param
        pts.push(v3.clone());
      }
    }
  });

  // Group is the original model with a completely black skin
  scene.add(group)
  
  m.emissive = m_color
  m.emissiveIntensity = 0.3
  m.color = m_color

  cluster = new THREE.InstancedMesh(g, m, pts.length)
  cluster.instanceMatrix.needsUpdate = true

  var dummy = new THREE.Object3D();
  for (let i = 0; i < pts.length; i++){
    dummy.position.set(pts[i].x, pts[i].y, pts[i].z);
    dummy.updateMatrix()
    cluster.setMatrixAt(i, dummy.matrix)
  }

  scene.add(cluster)
} );

// {...}_L models are used to draw shinging particles(large)
loader.load( '/pose/SK_Cartoon_Female_021/SK_Cartoon_Female_021_L.fbx', function ( group ) {

  const box3 = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box3.getSize(size);
  const param = 50 / Math.max(size.x, size.y, size.z);
  group.scale.set(param, param, param);
  center = new THREE.Vector3();
  box3.getCenter(center);
  
  let v3 = new THREE.Vector3();
  group.traverse(child => {
    if (child.isMesh){
      let pos = child.geometry.attributes.position;
      console.log(pos.count)
      for (let i = 1; i < pos.count; i+=10){
        v3.fromBufferAttribute(pos, i)
        v3.x = v3.x *param
        v3.y = v3.y *param
        v3.z = v3.z *param
        pts_l.push(v3.clone());
      }
    }
  });
  
  m_l.emissive = m_l_color
  m_l.emissiveIntensity = 0.3
  m_l.color = m_l_color

  cluster_l = new THREE.InstancedMesh(g_l, m_l, pts_l.length)
  cluster_l.instanceMatrix.needsUpdate = true

  var dummy = new THREE.Object3D();
  for (let i = 0; i < pts_l.length; i++){
    dummy.position.set(pts_l[i].x, pts_l[i].y, pts_l[i].z);
    dummy.updateMatrix()
    cluster_l.setMatrixAt(i, dummy.matrix)
  }
  
  scene.add(cluster_l)
} );



/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
// directionalLight.castShadow = true
// directionalLight.shadow.mapSize.set(1024, 1024)
// directionalLight.shadow.camera.far = 15
// directionalLight.shadow.camera.left = - 7
// directionalLight.shadow.camera.top = 7
// directionalLight.shadow.camera.right = 7
// directionalLight.shadow.camera.bottom = - 7
// directionalLight.position.set(- 5, 5, 0)
// scene.add(directionalLight)

/**
 * Sizes
 */
 const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-2, 39, 72)
camera.near = 0.01
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 30, 0)
controls.enableDamping = true
controls.autoRotate = true
controls.autoRotateSpeed = 4
controls.minPolarAngle = Math.PI/2;
controls.maxPolarAngle = Math.PI/2;
controls.enablePan = false
controls.dampingFactor = 0.15;
controls.maxDistance = 60
controls.enableZoom = false

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


// Environment
/**
 *  You shld only uncomment this part when you load original model
 */

// const pmremGenerator = new THREE.PMREMGenerator(renderer);
// pmremGenerator.compileEquirectangularShader();
// new EXRLoader().load('/brown_photostudio_02_2k.exr', (texture) => {
//   const envMap = pmremGenerator.fromEquirectangular(texture);
//   scene.environment = envMap.texture;
// });


/**
 * Post processing
 */
 const effectComposer = new EffectComposer(renderer)
 effectComposer.setSize(sizes.width, sizes.height)
 effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
 const renderPass = new RenderPass(scene, camera)
 effectComposer.addPass(renderPass)

 const unrealBloomPass = new UnrealBloomPass()
 effectComposer.addPass(unrealBloomPass)

 unrealBloomPass.strength = 5
 unrealBloomPass.radius = 1
 unrealBloomPass.threshold = 0.5
 effectComposer.render()

 gui.add(unrealBloomPass, 'enabled')
 gui.add(unrealBloomPass, 'strength').min(0).max(5).step(0.001)
 gui.add(unrealBloomPass, 'radius').min(0).max(100).step(0.001)
 gui.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    //Model animation, not for now
    if(mixer)
    {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Postprocessing
    effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()