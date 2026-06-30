<template>
  <div class="galaxy-container">
    <div class="galaxy-header">
      <h1>🌌 知识银河</h1>
      <p>点击星球聚焦 · 悬停预览 · 双击空白复位 · 拖拽旋转 · 滚轮缩放</p>
      <div class="galaxy-controls">
        <input v-model="searchText" @input="filterNodes" placeholder="搜索知识点..." class="search-input" />
        <div class="legend">
          <span v-for="cat in categories" :key="cat.name" class="legend-item">
            <span class="legend-dot" :style="{ background: cat.color }"></span>
            {{ cat.name }}
          </span>
        </div>
      </div>
    </div>
    <div ref="containerRef" class="canvas-container"></div>
    <div v-if="selectedNode" class="node-detail" @click="goToDetail(selectedNode)">
      <strong>{{ selectedNode.title }}</strong>
      <p>{{ selectedNode.summary }}</p>
      <span class="detail-hint">点击查看详情 →</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import graphData from '../../../graph-data.json'

const containerRef = ref(null)
const searchText = ref('')
const selectedNode = ref(null)

const categories = graphData.categories
const catColor = new Map(categories.map(c => [c.name, c.color]))
const GALAXY_RADIUS = 140
const MAX_DRIFT = 40

let scene, camera, renderer, controls
let nodeMeshes = []
let labelSprites = []
let particlesSystem
let animationId
let clock = new THREE.Clock()
let clickedNode = null
let raycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()
let hoveredNode = null

let flyData = null

function createLabelTexture(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.font = 'bold 16px "Microsoft YaHei", sans-serif'
  ctx.fillStyle = '#e2e8f0'
  ctx.textAlign = 'center'
  ctx.fillText(text, 128, 36)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

function createGlowTexture(colorHex) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, colorHex)
  gradient.addColorStop(0.2, colorHex)
  gradient.addColorStop(0.5, colorHex + '88')
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

function initScene() {
  const container = containerRef.value
  const width = container.clientWidth
  const height = Math.max(window.innerHeight - 280, 500)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000)
  camera.position.set(0, 120, 280)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 20
  controls.maxDistance = 600
  controls.maxPolarAngle = Math.PI * 0.8
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.25
  controls.target.set(0, 0, 0)
  controls.update()

  const ambientLight = new THREE.AmbientLight(0x334466, 2.5)
  scene.add(ambientLight)
  const pointLight = new THREE.PointLight(0x6366f1, 400, 900)
  pointLight.position.set(0, 80, 0)
  scene.add(pointLight)
  const pointLight2 = new THREE.PointLight(0x8b5cf6, 200, 600)
  pointLight2.position.set(0, -60, 0)
  scene.add(pointLight2)

  createStarField()
  createGalaxyDust()
  createNodes()
  createParticles()

  renderer.domElement.addEventListener('click', onClick)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('dblclick', onDoubleClick)
  renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false })
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeyDown)

  animate()
}

function createStarField() {
  const starsGeo = new THREE.BufferGeometry()
  const count = 3000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 400 + Math.random() * 700
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    const brightness = 0.3 + Math.random() * 0.7
    colors[i * 3] = brightness
    colors[i * 3 + 1] = brightness
    colors[i * 3 + 2] = brightness
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const starsMat = new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
  const stars = new THREE.Points(starsGeo, starsMat)
  scene.add(stars)
}

function createGalaxyDust() {
  const dustGeo = new THREE.BufferGeometry()
  const count = 1500
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const colorObj = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = GALAXY_RADIUS * 0.3 + Math.random() * GALAXY_RADIUS * 1.7
    const x = Math.cos(angle) * r + (Math.random() - 0.5) * 30
    const y = (Math.random() - 0.5) * 40
    const z = Math.sin(angle) * r + (Math.random() - 0.5) * 30
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    colorObj.setHSL(0.55 + Math.random() * 0.25, 0.7, 0.4 + Math.random() * 0.4)
    colors[i * 3] = colorObj.r * 0.25
    colors[i * 3 + 1] = colorObj.g * 0.25
    colors[i * 3 + 2] = colorObj.b * 0.25
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  dustGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const dustMat = new THREE.PointsMaterial({ size: 1.0, vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  particlesSystem = new THREE.Points(dustGeo, dustMat)
  scene.add(particlesSystem)
}

function createNodes() {
  const total = graphData.nodes.length
  const innerCount = Math.ceil(total / 2)
  const outerCount = total - innerCount
  const innerRadius = 90
  const outerRadius = 150

  const assigned = []
  for (let i = 0; i < total; i++) {
    assigned.push(i < innerCount ? 0 : 1)
  }
  for (let i = assigned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [assigned[i], assigned[j]] = [assigned[j], assigned[i]]
  }

  let innerIdx = 0
  let outerIdx = 0

  graphData.nodes.forEach((node, i) => {
    const group = new THREE.Group()
    group.name = node.id

    const isInner = assigned[i] === 0
    const ringRadius = isInner ? innerRadius : outerRadius
    const ringNodeCount = isInner ? innerCount : outerCount
    const ringIdx = isInner ? innerIdx++ : outerIdx++
    const angle = (Math.PI * 2 / ringNodeCount) * ringIdx + (Math.random() - 0.5) * 0.3
    const yOffset = (Math.random() - 0.5) * 25

    const x = Math.cos(angle) * ringRadius
    const y = yOffset
    const z = Math.sin(angle) * ringRadius

    group.position.set(x, y, z)
    group.userData = {
      node,
      linkedIds: new Set(),
      home: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 6
      ),
      focusTarget: null,
      returning: false,
      wobbleOffset: Math.random() * Math.PI * 2,
      targetScale: 1,
      orbitRing: null
    }

    const linkCount = graphData.links.filter(l =>
      l.source === node.id || l.target === node.id
    ).length
    const nodeSize = 2 + linkCount * 0.5

    const glowTex = createGlowTexture(catColor.get(node.category))
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true })
    const glowSprite = new THREE.Sprite(glowMat)
    glowSprite.name = 'glowSprite'
    glowSprite.scale.set(nodeSize * 5, nodeSize * 5, 1)
    group.add(glowSprite)

    const coreGeo = new THREE.SphereGeometry(nodeSize * 0.4, 32, 32)
    const coreMat = new THREE.MeshStandardMaterial({ color: catColor.get(node.category), emissive: catColor.get(node.category), emissiveIntensity: 2, roughness: 0.2, metalness: 0.8 })
    const core = new THREE.Mesh(coreGeo, coreMat)
    core.name = 'core'
    group.add(core)

    const ringGeo = new THREE.TorusGeometry(nodeSize * 0.9, 0.15, 16, 64)
    const ringMat = new THREE.MeshStandardMaterial({ color: catColor.get(node.category), emissive: catColor.get(node.category), emissiveIntensity: 1.5, roughness: 0.3, transparent: true, opacity: 0 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.name = 'ring'
    ring.rotation.x = Math.PI / 2
    group.add(ring)

    const labelTex = createLabelTexture(node.title)
    const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false })
    const label = new THREE.Sprite(labelMat)
    label.name = 'label'
    label.scale.set(nodeSize * 5, nodeSize * 1.25, 1)
    label.position.y = nodeSize * 2.5
    group.add(label)
    labelSprites.push({ sprite: label, nodeId: node.id })

    graphData.links.forEach(l => {
      if (l.source === node.id) group.userData.linkedIds.add(l.target)
      if (l.target === node.id) group.userData.linkedIds.add(l.source)
    })

    group.scale.setScalar(0.01)
    scene.add(group)
    nodeMeshes.push(group)
  })
}

function createParticles() {
  const particlesGeo = new THREE.BufferGeometry()
  const count = 400
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = GALAXY_RADIUS * 0.2 + Math.random() * GALAXY_RADIUS * 1.3
    const x = Math.cos(angle) * r
    const y = (Math.random() - 0.5) * 50
    const z = Math.sin(angle) * r
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
  }
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particlesMat = new THREE.PointsMaterial({ size: 0.4, color: 0x6366f1, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
  const particles = new THREE.Points(particlesGeo, particlesMat)
  particles.name = 'orbitParticles'
  scene.add(particles)
}


function flyCameraTo(targetPos, duration = 1.0) {
  const dirToTarget = camera.position.clone().sub(targetPos).normalize()
  const endCam = targetPos.clone().add(dirToTarget.multiplyScalar(55))

  flyData = {
    startTime: performance.now() / 1000,
    duration,
    startCamPos: camera.position.clone(),
    endCamPos: endCam,
    startLook: controls.target.clone(),
    endLook: targetPos.clone(),
  }
  controls.autoRotate = false
  controls.enableDamping = false
}

function onClick(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(nodeMeshes, true)

  if (intersects.length > 0) {
    let obj = intersects[0].object
    while (obj && !obj.userData.node) obj = obj.parent
    if (obj && obj.userData.node) {
      if (clickedNode && clickedNode !== obj) {
        deselectNode()
      }
      selectNode(obj)
      return
    }
  }
  if (clickedNode) deselectNode()
}

function selectNode(group) {
  clickedNode = group
  selectedNode.value = group.userData.node
  const clickedColor = catColor.get(group.userData.node.category)
  const linkedIds = group.userData.linkedIds

  flyCameraTo(new THREE.Vector3(0, 0, 0))

  const clickedPos = new THREE.Vector3(0, 0, 0)
  group.userData.focusTarget = clickedPos.clone()
  const camDir = camera.position.clone().sub(clickedPos).normalize()
  const up = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(camDir, up).normalize()
  const camUp = new THREE.Vector3().crossVectors(right, camDir).normalize()

  const linkedList = nodeMeshes.filter(g => linkedIds.has(g.name))

  linkedList.forEach((g, linkIdx) => {
    const angle = (Math.PI * 2 / Math.max(linkedList.length, 1)) * linkIdx + Math.random() * 0.5
    const radius = 14 + Math.random() * 14
    const offset = right.clone().multiplyScalar(Math.cos(angle) * radius)
      .add(camUp.clone().multiplyScalar(Math.sin(angle) * radius))
    g.userData.focusTarget = clickedPos.clone().add(offset)
    g.userData.orbitCenter = clickedPos.clone()
    g.userData.orbitRadius = radius
    g.userData.orbitSpeed = 0.25 + Math.random() * 0.45
    g.userData.orbitTilt = (Math.random() - 0.5) * 0.7

    if (g.userData.orbitRing) {
      g.userData.orbitRing.geometry.dispose()
      g.userData.orbitRing.material.dispose()
      scene.remove(g.userData.orbitRing)
      g.userData.orbitRing = null
    }
    const ringPoints = []
    const ringSegments = 128
    for (let ri = 0; ri <= ringSegments; ri++) {
      const ra = (Math.PI * 2 / ringSegments) * ri
      ringPoints.push(new THREE.Vector3(Math.cos(ra) * radius, 0, Math.sin(ra) * radius))
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints)
    const ringMat = new THREE.LineBasicMaterial({ color: clickedColor, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })
    const orbitRing = new THREE.Line(ringGeo, ringMat)
    orbitRing.position.copy(clickedPos)
    orbitRing.rotation.x = Math.PI / 2 + g.userData.orbitTilt * 0.6
    orbitRing.rotation.z = Math.cos(angle) * 0.3
    scene.add(orbitRing)
    g.userData.orbitRing = orbitRing
  })

  nodeMeshes.forEach(g => {
    const isClicked = g.name === group.name
    const isLinked = linkedIds.has(g.name)

    if (!isClicked && !isLinked) {
      g.userData.focusTarget = null
      g.userData.orbitCenter = null
      if (g.userData.orbitRing) {
        g.userData.orbitRing.geometry.dispose()
        g.userData.orbitRing.material.dispose()
        scene.remove(g.userData.orbitRing)
        g.userData.orbitRing = null
      }
    }

    g.children.forEach(child => {
      if (child.name === 'core') {
        child.material.emissiveIntensity = isClicked ? 4 : (isLinked ? 2.5 : 0.3)
        child.material.opacity = isClicked ? 1 : (isLinked ? 1 : 0.35)
        child.material.transparent = true
      }
      if (child.name === 'ring') {
        child.material.opacity = isClicked ? 1 : 0
        child.visible = isClicked
      }
      if (child.name === 'glowSprite') {
        child.material.opacity = isClicked ? 1 : (isLinked ? 0.7 : 0.1)
      }
    })

    g.userData.targetScale = isClicked ? 1.3 : (isLinked ? 0.72 : (linkedList.length === 0 ? 1 : 0.5))

    const label = g.getObjectByName('label')
    if (label) label.visible = true
  })

}

function deselectNode() {
  nodeMeshes.forEach(g => {
    const ud = g.userData
    if (ud.focusTarget || ud.orbitCenter) {
      ud.returning = true
      ud.velocity.set(0, 0, 0)
    }
    ud.focusTarget = null
    ud.orbitCenter = null
    ud.orbitRadius = undefined
    ud.orbitSpeed = undefined
    ud.orbitAngle = undefined
    ud.orbitTilt = undefined
    ud.targetScale = 1

    if (ud.orbitRing) {
      ud.orbitRing.geometry.dispose()
      ud.orbitRing.material.dispose()
      scene.remove(ud.orbitRing)
      ud.orbitRing = null
    }

    g.children.forEach(child => {
      if (child.name === 'core') {
        child.material.emissiveIntensity = 2
        child.material.opacity = 1
        child.material.transparent = false
      }
      if (child.name === 'ring') {
        child.material.opacity = 0
        child.visible = false
      }
      if (child.name === 'glowSprite') {
        child.material.opacity = 0.5
      }
    })
    const label = g.getObjectByName('label')
    if (label) label.visible = true
  })

  clickedNode = null
  selectedNode.value = null
  flyData = null
  controls.autoRotate = true
  controls.enableDamping = true
}

function onKeyDown(event) {
  if (event.key === 'Escape' && clickedNode) {
    deselectNode()
  }
}

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(nodeMeshes, true)

  let newHover = null
  if (intersects.length > 0) {
    let obj = intersects[0].object
    while (obj && !obj.userData.node) obj = obj.parent
    if (obj && obj.userData.node) newHover = obj
  }

  if (hoveredNode !== newHover) {
    hoveredNode = newHover
    renderer.domElement.style.cursor = hoveredNode ? 'pointer' : 'default'
  }
}

function onTouchStart(event) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(nodeMeshes, true)
    if (intersects.length > 0) {
      let obj = intersects[0].object
      while (obj && !obj.userData.node) obj = obj.parent
      if (obj && obj.userData.node) {
        event.preventDefault()
        if (clickedNode && clickedNode !== obj) deselectNode()
        selectNode(obj)
      }
    }
  }
}

function onDoubleClick() {
  if (clickedNode) deselectNode()
  flyCameraTo(new THREE.Vector3(0, 0, 0), 0.8)
}

function filterNodes() {
  if (!searchText.value.trim()) {
    nodeMeshes.forEach(g => {
      g.userData._filteredOut = false
      const label = g.getObjectByName('label')
      if (label) label.visible = true
    })
    labelSprites.forEach(l => l.sprite.visible = true)
    if (clickedNode) deselectNode()
    return
  }
  const q = searchText.value.toLowerCase()
  let firstMatch = null
  nodeMeshes.forEach(g => {
    const node = g.userData.node
    const match = node.title.toLowerCase().includes(q) || node.category.toLowerCase().includes(q)
    g.userData._filteredOut = !match
    if (match && !firstMatch) firstMatch = g
  })
  labelSprites.forEach(l => {
    const node = graphData.nodes.find(n => n.id === l.nodeId)
    if (node) {
      l.sprite.visible = node.title.toLowerCase().includes(q) || node.category.toLowerCase().includes(q)
    }
  })
  if (firstMatch) {
    flyCameraTo(firstMatch.position.clone(), 0.6)
    if (clickedNode && clickedNode !== firstMatch) deselectNode()
  }
}

function animate() {
  const time = performance.now() / 1000
  animationId = requestAnimationFrame(animate)

  const dt = Math.min(clock.getDelta(), 0.1)

  if (flyData) {
    const elapsed = performance.now() / 1000 - flyData.startTime
    const t = Math.min(elapsed / flyData.duration, 1)
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    controls.target.lerpVectors(flyData.startLook, flyData.endLook, ease)
    camera.position.lerpVectors(flyData.startCamPos, flyData.endCamPos, ease)
    if (t >= 1) {
      flyData = null
      controls.enableDamping = true
    }
  }

  controls.update()

  nodeMeshes.forEach(group => {
    const ud = group.userData
    const target = ud.focusTarget
    const nodeColor = catColor.get(ud.node.category)

    if (ud._hoverLerp === undefined) ud._hoverLerp = 0
    if (ud._filterLerp === undefined) ud._filterLerp = 1
    const hoverTarget = (hoveredNode === group && group !== clickedNode) ? 1 : 0
    ud._hoverLerp += (hoverTarget - ud._hoverLerp) * dt * 6
    const filterTarget = ud._filteredOut ? 0 : 1
    ud._filterLerp += (filterTarget - ud._filterLerp) * dt * 5

    if (group === clickedNode) {
      if (ud.focusTarget) {
        group.position.lerp(ud.focusTarget, dt * 3)
        if (group.position.distanceTo(ud.focusTarget) < 0.3) {
          group.position.copy(ud.focusTarget)
          ud.focusTarget = null
        }
      }
      if (!ud.focusTarget) {
        ud.wobbleOffset += dt * 0.25
        const wx = Math.sin(ud.wobbleOffset * 1.1) * 0.18
        const wy = Math.cos(ud.wobbleOffset * 0.9) * 0.18
        const wz = Math.cos(ud.wobbleOffset * 1.3) * 0.18
        group.position.set(wx, wy, wz)
      }

      const ring = group.getObjectByName('ring')
      if (ring) {
        ring.rotation.z += dt * 1.2
        ring.rotation.x = Math.PI / 2 + Math.sin(ud.wobbleOffset * 1.5) * 0.25
      }
    } else if (ud.orbitCenter) {
      if (target) {
        group.position.lerp(target, dt * 3)
        if (group.position.distanceTo(target) < 1.5) {
          ud.focusTarget = null
          const dx = group.position.x - ud.orbitCenter.x
          const dy = group.position.y - ud.orbitCenter.y
          ud.orbitAngle = Math.atan2(dy, dx)
        }
      } else {
        ud.orbitAngle += ud.orbitSpeed * dt
        const r = ud.orbitRadius
        const ox = ud.orbitCenter.x + Math.cos(ud.orbitAngle) * r
        const oy = ud.orbitCenter.y + Math.sin(ud.orbitAngle * (0.5 + ud.orbitTilt)) * r * 0.55
        const oz = ud.orbitCenter.z + Math.sin(ud.orbitAngle) * r
        group.position.lerp(new THREE.Vector3(ox, oy, oz), dt * 2.5)

        if (ud.orbitRing) {
          ud.orbitRing.position.copy(ud.orbitCenter)
        }
      }
    } else if (target) {
      group.position.lerp(target, dt * 3)
    } else if (ud.returning) {
      group.position.lerp(ud.home, dt * 2)
      if (group.position.distanceTo(ud.home) < 1) {
        group.position.copy(ud.home)
        ud.returning = false
      }
    } else {
      const vel = ud.velocity
      group.position.x += vel.x * dt
      group.position.y += vel.y * dt
      group.position.z += vel.z * dt

      const home = ud.home
      const dx = group.position.x - home.x
      const dy = group.position.y - home.y
      const dz = group.position.z - home.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist > MAX_DRIFT) {
        const nx = dx / dist
        const ny = dy / dist
        const nz = dz / dist
        vel.x -= nx * 4 * dt
        vel.y -= ny * 4 * dt
        vel.z -= nz * 4 * dt
      }

      vel.x += (Math.random() - 0.5) * 6 * dt
      vel.y += (Math.random() - 0.5) * 6 * dt
      vel.z += (Math.random() - 0.5) * 6 * dt

      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
      const maxSpeed = 15
      if (speed > maxSpeed) {
        const s = maxSpeed / speed
        vel.x *= s
        vel.y *= s
        vel.z *= s
      }

    }

    const core = group.getObjectByName('core')
    if (core && group !== clickedNode) {
      core.rotation.y += dt * 0.5
    }
    if (core && group === clickedNode) {
      core.rotation.y += dt * 2
    }

    const ts = ud.targetScale || 1
    const effectiveScale = ts * ud._filterLerp
    const targetVec = new THREE.Vector3(effectiveScale, effectiveScale, effectiveScale)
    group.scale.lerp(targetVec, dt * 4)

    const coreVis = group.getObjectByName('core')
    const glowVis = group.getObjectByName('glowSprite')
    const labelVis = group.getObjectByName('label')

    if (group !== clickedNode && group !== hoveredNode && !ud.returning && !ud.focusTarget) {
      if (coreVis && coreVis.material.emissiveIntensity !== undefined) {
        const baseEmissive = 2 + Math.sin(time * 1.5 + ud.wobbleOffset) * 0.5
        const hoverEmissive = 3.5
        const idleEmissive = (clickedNode && !ud.orbitCenter) ? 0.4 : (ud._filterLerp < 0.01 ? 0.15 : baseEmissive)
        coreVis.material.emissiveIntensity = idleEmissive + (hoverEmissive - idleEmissive) * ud._hoverLerp
        coreVis.material.opacity = clickedNode ? 0.35 : (0.25 + (1 - 0.25) * ud._filterLerp)
        coreVis.material.transparent = true
      }
      if (glowVis) {
        const baseGlow = 0.5 + Math.sin(time * 1.5 + ud.wobbleOffset) * 0.15
        glowVis.material.opacity = clickedNode ? 0.1 : ((baseGlow + (0.85 - baseGlow) * ud._hoverLerp) * ud._filterLerp)
      }
      if (labelVis) {
        labelVis.material.opacity = clickedNode ? 0.5 : (0.9 * ud._filterLerp)
      }
    }

    if (ud.orbitCenter && group !== clickedNode) {
      if (coreVis && coreVis.material.emissiveIntensity !== undefined) {
        coreVis.material.emissiveIntensity = 2.5 + Math.sin(time * 2 + ud.wobbleOffset) * 0.4
        coreVis.material.opacity = 1
        coreVis.material.transparent = true
      }
      if (glowVis) {
        glowVis.material.opacity = 0.6 + Math.sin(time * 1.5 + ud.wobbleOffset) * 0.1
      }
      if (labelVis) {
        labelVis.material.opacity = 0.85
      }
    }

    if (hoveredNode && hoveredNode !== clickedNode && hoveredNode.userData._hoverLerp > 0.05) {
      const hoverCat = hoveredNode.userData.node.category
      const hoverIntensity = hoveredNode.userData._hoverLerp
      if (group !== hoveredNode && group !== clickedNode && !ud.orbitCenter) {
        const c = group.getObjectByName('core')
        if (c && c.material.emissiveIntensity !== undefined) {
          const catTarget = group.userData.node.category === hoverCat ? 2.8 : 1.2
          const catBase = 2 + Math.sin(time * 1.5 + ud.wobbleOffset) * 0.5
          c.material.emissiveIntensity += (catTarget - catBase) * hoverIntensity * 0.6
        }
      }
    }
  })

  if (particlesSystem) {
    particlesSystem.rotation.y += dt * 0.04
    particlesSystem.rotation.x += dt * 0.015
  }

  const orbitParticles = scene.getObjectByName('orbitParticles')
  if (orbitParticles) {
    orbitParticles.rotation.y += dt * 0.06
    orbitParticles.rotation.x += dt * 0.02
  }

  renderer.render(scene, camera)
}

function onResize() {
  const container = containerRef.value
  const width = container.clientWidth
  const height = Math.max(window.innerHeight - 280, 500)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function goToDetail(node) {
  window.location.href = node.url
}

watch(searchText, filterNodes)

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  if (renderer) {
    renderer.domElement.removeEventListener('click', onClick)
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('dblclick', onDoubleClick)
    renderer.domElement.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('keydown', onKeyDown)
    renderer.dispose()
  }
})
</script>

<style scoped>
.galaxy-container {
  position: relative;
  background: radial-gradient(ellipse at center, #0a101c 0%, #080c14 60%, #020408 100%);
  min-height: 100vh;
  margin: -24px;
  padding: 24px;
  overflow: hidden;
}
.galaxy-header {
  text-align: center;
  margin-bottom: 12px;
  position: relative;
  z-index: 10;
  pointer-events: none;
}
.galaxy-header h1 {
  font-size: 32px;
  color: #e2e8f0;
  margin: 0;
  letter-spacing: 6px;
}
.galaxy-header p {
  color: #64748b;
  margin: 6px 0;
  font-size: 13px;
}
.galaxy-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 10px;
  pointer-events: all;
}
.search-input {
  background: #0a101c;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 8px 16px;
  color: #e2e8f0;
  font-size: 14px;
  width: 240px;
  outline: none;
  font-family: 'Microsoft YaHei', sans-serif;
}
.search-input:focus {
  border-color: #6366f1;
}
.search-input::placeholder {
  color: #475569;
}
.legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 12px;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.canvas-container {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}
.node-detail {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f1725;
  border: 1px solid #6366f1;
  border-radius: 12px;
  padding: 16px 24px;
  max-width: 420px;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 0 60px rgba(99, 102, 241, 0.3);
  transition: transform 0.2s;
}
.node-detail:hover {
  transform: translateX(-50%) translateY(-4px);
}
.node-detail strong {
  color: #e2e8f0;
  font-size: 16px;
}
.node-detail p {
  color: #94a3b8;
  font-size: 13px;
  margin: 6px 0;
}
.detail-hint {
  color: #6366f1;
  font-size: 12px;
}
</style>
