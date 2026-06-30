<template>
  <div class="galaxy-container">
    <div class="galaxy-header">
      <h1>🌌 知识银河</h1>
      <p>点击星球聚焦 · 再点其他切换 · 点空白取消 · 拖拽旋转 · 滚轮缩放</p>
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

const containerRef = ref(null)
const searchText = ref('')
const selectedNode = ref(null)

const categories = [
  { name: '💬 对话精华', color: '#6366f1' },
  { name: '📚 技术笔记', color: '#10b981' },
  { name: '🛠 踩坑记录', color: '#f59e0b' },
  { name: '💡 灵感便签', color: '#ec4899' },
  { name: '🎨 设计素材', color: '#8b5cf6' },
  { name: '📋 项目日志', color: '#06b6d4' },
]

const graphData = {
  nodes: [
    { id: 'codex-intro', title: 'Codex 入门', category: '💬 对话精华', summary: 'Codex 终端 AI 助手的基础配置与使用', url: '/💬 对话精华/codex-intro' },
    { id: 'vpn-setup', title: 'VPN 代理设置', category: '💬 对话精华', summary: 'v2rayN SOCKS5 代理配置，端口 10808', url: '/💬 对话精华/vpn-setup' },
    { id: 'git-config', title: 'Git 配置', category: '📚 技术笔记', summary: '全局代理、用户信息、常用别名', url: '/📚 技术笔记/git-config' },
    { id: 'github-pages', title: 'GitHub Pages', category: '📚 技术笔记', summary: 'VitePress + GitHub Actions 自动部署', url: '/📚 技术笔记/github-pages' },
    { id: 'cua-usage', title: 'CUA 桌面操控', category: '💬 对话精华', summary: '截屏 + 键鼠模拟，操控 PS 等无 API 软件', url: '/💬 对话精华/cua-usage' },
    { id: 'codex-plugins', title: 'Codex 插件', category: '📚 技术笔记', summary: '5 个插件市场，279 个插件可选', url: '/📚 技术笔记/codex-plugins' },
    { id: 'claude-code', title: 'Claude Code', category: '💬 对话精华', summary: 'Claude Code 与 Codex 分工协作', url: '/💬 对话精华/claude-code' },
    { id: 'dark-ui', title: 'Dark UI 风格', category: '🎨 设计素材', summary: '#080c14 主背景，靛蓝强调色，18 色令牌', url: '/🎨 设计素材/dark-ui' },
    { id: 'python-tkinter', title: 'tkinter 开发', category: '📚 技术笔记', summary: '.pyw + pythonw.exe 无控制台启动', url: '/📚 技术笔记/python-tkinter' },
    { id: 'pitfall-vpn', title: 'Git 代理踩坑', category: '🛠 踩坑记录', summary: 'Git 不会自动走系统代理，需手动配置', url: '/🛠 踩坑记录/pitfall-vpn' },
    { id: 'pitfall-codex', title: 'Codex 代理踩坑', category: '🛠 踩坑记录', summary: 'Codex CLI 不自动走 git 代理', url: '/🛠 踩坑记录/pitfall-codex' },
    { id: 'idea-knowledge-graph', title: 'DNA 图谱灵感', category: '💡 灵感便签', summary: '知识节点像基因一样互相链接', url: '/💡 灵感便签/idea-knowledge-graph' },
    { id: 'project-schedule-tool', title: '排期工具', category: '📋 项目日志', summary: 'tkinter + SQLite 桌面排期工具', url: '/📋 项目日志/project-schedule-tool' },
    { id: 'dev-conventions', title: '开发规范', category: '📚 技术笔记', summary: 'dev-conventions 代码生成审查规范', url: '/📚 技术笔记/dev-conventions' },
    { id: 'auto-summary', title: '对话自动归档', category: '💡 灵感便签', summary: '每次对话后自动提取精华归档', url: '/💡 灵感便签/auto-summary' },
  ],
  links: [
    { source: 'codex-intro', target: 'codex-plugins' },
    { source: 'codex-intro', target: 'cua-usage' },
    { source: 'codex-intro', target: 'claude-code' },
    { source: 'vpn-setup', target: 'git-config' },
    { source: 'vpn-setup', target: 'pitfall-vpn' },
    { source: 'vpn-setup', target: 'pitfall-codex' },
    { source: 'git-config', target: 'github-pages' },
    { source: 'github-pages', target: 'codex-plugins' },
    { source: 'claude-code', target: 'dev-conventions' },
    { source: 'claude-code', target: 'dark-ui' },
    { source: 'cua-usage', target: 'python-tkinter' },
    { source: 'codex-plugins', target: 'pitfall-codex' },
    { source: 'dark-ui', target: 'dev-conventions' },
    { source: 'idea-knowledge-graph', target: 'github-pages' },
    { source: 'idea-knowledge-graph', target: 'auto-summary' },
    { source: 'project-schedule-tool', target: 'python-tkinter' },
    { source: 'auto-summary', target: 'claude-code' },
    { source: 'dev-conventions', target: 'project-schedule-tool' },
    { source: 'pitfall-vpn', target: 'pitfall-codex' },
    { source: 'codex-plugins', target: 'dev-conventions' },
  ]
}

const catColor = new Map(categories.map(c => [c.name, c.color]))
const SPHERE_RADIUS = 120
const MAX_DRIFT = 40

let scene, camera, renderer, controls
let nodeMeshes = []
let linkLines = []
let labelSprites = []
let particlesSystem
let animationId
let clock = new THREE.Clock()
let clickedNode = null
let raycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()

let flyData = null
let energyParticles = []

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

function fibonacciSphere(index, total) {
  const phi = Math.acos(1 - 2 * (index + 0.5) / total)
  const theta = Math.PI * (1 + Math.sqrt(5)) * index
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.sin(phi) * Math.sin(theta),
    z: Math.cos(phi)
  }
}

function initScene() {
  const container = containerRef.value
  const width = container.clientWidth
  const height = Math.max(window.innerHeight - 280, 500)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000)
  camera.position.set(0, 40, 220)
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
  createLinks()
  createParticles()

  renderer.domElement.addEventListener('click', onClick)
  window.addEventListener('resize', onResize)

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
  const count = 1200
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const colorObj = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = SPHERE_RADIUS * 0.5 + Math.random() * SPHERE_RADIUS * 1.5
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * 30
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * 30
    positions[i * 3 + 2] = r * Math.cos(phi) + (Math.random() - 0.5) * 30
    colorObj.setHSL(0.55 + Math.random() * 0.25, 0.7, 0.4 + Math.random() * 0.4)
    colors[i * 3] = colorObj.r * 0.25
    colors[i * 3 + 1] = colorObj.g * 0.25
    colors[i * 3 + 2] = colorObj.b * 0.25
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  dustGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const dustMat = new THREE.PointsMaterial({ size: 1.0, vertexColors: true, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
  particlesSystem = new THREE.Points(dustGeo, dustMat)
  scene.add(particlesSystem)
}

function createNodes() {
  graphData.nodes.forEach((node, i) => {
    const group = new THREE.Group()
    group.name = node.id
    const sph = fibonacciSphere(i, graphData.nodes.length)
    const r = SPHERE_RADIUS * (0.5 + Math.random() * 0.5)
    const x = sph.x * r
    const y = sph.y * r
    const z = sph.z * r

    group.position.set(x, y, z)
    group.userData = {
      node,
      linkedIds: new Set(),
      home: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ),
      focusTarget: null,
      returning: false,
      wobbleOffset: Math.random() * Math.PI * 2
    }

    const linkCount = graphData.links.filter(l =>
      l.source === node.id || l.target === node.id
    ).length
    const nodeSize = 2 + linkCount * 0.5

    const glowTex = createGlowTexture(catColor.get(node.category))
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true })
    const glowSprite = new THREE.Sprite(glowMat)
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

    scene.add(group)
    nodeMeshes.push(group)
  })
}

function createLinks() {
  graphData.links.forEach(link => {
    const srcGroup = nodeMeshes.find(g => g.name === link.source)
    const tgtGroup = nodeMeshes.find(g => g.name === link.target)
    if (!srcGroup || !tgtGroup) return

    const mid = new THREE.Vector3(
      (srcGroup.position.x + tgtGroup.position.x) / 2,
      (srcGroup.position.y + tgtGroup.position.y) / 2 + 20,
      (srcGroup.position.z + tgtGroup.position.z) / 2
    )
    const curve = new THREE.QuadraticBezierCurve3(srcGroup.position.clone(), mid, tgtGroup.position.clone())
    const points = curve.getPoints(40)

    const solidGeo = new THREE.BufferGeometry().setFromPoints(points)
    const solidMat = new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false })
    const solidLine = new THREE.Line(solidGeo, solidMat)
    scene.add(solidLine)

    const dashGeo = new THREE.BufferGeometry().setFromPoints(points)
    const dashMat = new THREE.LineDashedMaterial({ color: 0x6366f1, transparent: true, opacity: 0.2, dashSize: 12, gapSize: 28, blending: THREE.AdditiveBlending, depthWrite: false })
    const dashLine = new THREE.Line(dashGeo, dashMat)
    dashLine.computeLineDistances()
    scene.add(dashLine)

    linkLines.push({ solid: solidLine, dash: dashLine, userData: { source: link.source, target: link.target } })
  })
}

function createParticles() {
  const particlesGeo = new THREE.BufferGeometry()
  const count = 300
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = SPHERE_RADIUS * 0.3 + Math.random() * SPHERE_RADIUS * 1.2
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r
    positions[i * 3 + 2] = Math.cos(phi) * r
  }
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particlesMat = new THREE.PointsMaterial({ size: 0.4, color: 0x6366f1, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
  const particles = new THREE.Points(particlesGeo, particlesMat)
  particles.name = 'orbitParticles'
  scene.add(particles)
}

function updateLinks() {
  linkLines.forEach(item => {
    const srcGroup = nodeMeshes.find(g => g.name === item.userData.source)
    const tgtGroup = nodeMeshes.find(g => g.name === item.userData.target)
    if (!srcGroup || !tgtGroup) return
    const mid = new THREE.Vector3(
      (srcGroup.position.x + tgtGroup.position.x) / 2,
      (srcGroup.position.y + tgtGroup.position.y) / 2 + 20,
      (srcGroup.position.z + tgtGroup.position.z) / 2
    )
    const curve = new THREE.QuadraticBezierCurve3(srcGroup.position.clone(), mid, tgtGroup.position.clone())
    const points = curve.getPoints(40)

    item.solid.geometry.dispose()
    item.solid.geometry = new THREE.BufferGeometry().setFromPoints(points)

    item.dash.geometry.dispose()
    item.dash.geometry = new THREE.BufferGeometry().setFromPoints(points)
    item.dash.computeLineDistances()
  })
}

function flyCameraTo(targetPos, duration = 1.0) {
  const dirToTarget = camera.position.clone().sub(targetPos).normalize()
  const endCam = targetPos.clone().add(dirToTarget.multiplyScalar(45))

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

  flyCameraTo(group.position.clone())

  const clickedPos = group.position.clone()
  const camDir = camera.position.clone().sub(clickedPos).normalize()
  const up = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(camDir, up).normalize()
  const camUp = new THREE.Vector3().crossVectors(right, camDir).normalize()

  const linkedList = nodeMeshes.filter(g => linkedIds.has(g.name))

  linkedList.forEach((g, linkIdx) => {
    const angle = (Math.PI * 2 / Math.max(linkedList.length, 1)) * linkIdx + Math.random() * 0.5
    const radius = 15 + Math.random() * 14
    const offset = right.clone().multiplyScalar(Math.cos(angle) * radius)
      .add(camUp.clone().multiplyScalar(Math.sin(angle) * radius))
    g.userData.focusTarget = clickedPos.clone().add(offset)
    g.userData.orbitCenter = clickedPos.clone()
    g.userData.orbitRadius = radius
    g.userData.orbitSpeed = 0.3 + Math.random() * 0.5
    g.userData.orbitTilt = (Math.random() - 0.5) * 0.7
  })

  energyParticles.forEach(ep => {
    ep.group.children.forEach(c => {
      if (c.material) { c.material.dispose() }
      if (c.geometry) { c.geometry.dispose() }
    })
    scene.remove(ep.group)
  })
  energyParticles = []

  if (linkedList.length > 0) {
    linkedList.forEach(tgtGroup => {
      for (let p = 0; p < 3; p++) {
        const droplet = new THREE.Group()
        const headGeo = new THREE.SphereGeometry(0.4, 8, 8)
        const tailGeo = new THREE.SphereGeometry(0.2, 6, 6)
        const headMat = new THREE.MeshBasicMaterial({ color: clickedColor, transparent: true, opacity: 0, depthWrite: false })
        const tailMat = new THREE.MeshBasicMaterial({ color: clickedColor, transparent: true, opacity: 0, depthWrite: false })
        const head = new THREE.Mesh(headGeo, headMat)
        const tail = new THREE.Mesh(tailGeo, tailMat)
        tail.position.z = -0.65
        droplet.add(head)
        droplet.add(tail)
        scene.add(droplet)
        energyParticles.push({
          group: droplet,
          head,
          tail,
          srcGroup: group,
          tgtGroup,
          t: p / 3,
          speed: 0.15 + Math.random() * 0.3
        })
      }
    })
  }

  nodeMeshes.forEach(g => {
    const isClicked = g.name === group.name
    const isLinked = linkedIds.has(g.name)

    if (!isClicked && !isLinked) {
      g.userData.focusTarget = null
      g.userData.orbitCenter = null
    }

    g.children.forEach(child => {
      if (child.name === 'core') {
        child.material.emissiveIntensity = isClicked ? 4 : (isLinked ? 2.5 : 0.3)
        child.material.opacity = isClicked ? 1 : (isLinked ? 1 : 0.12)
        child.material.transparent = true
      }
      if (child.name === 'ring') {
        child.material.opacity = isClicked ? 1 : 0
        child.visible = isClicked
      }
      if (child.isSprite && child.name !== 'label') {
        child.material.opacity = isClicked ? 1 : (isLinked ? 0.6 : 0.04)
      }
    })

    if (isClicked) { g.scale.setScalar(1.3) }
    else if (isLinked) { g.scale.setScalar(0.55) }
    else { g.scale.setScalar(linkedList.length === 0 ? 0 : 0.28) }

    const label = g.getObjectByName('label')
    if (label) label.visible = linkedList.length === 0 ? isClicked : (isClicked || isLinked)
  })

  linkLines.forEach(item => {
    const isLinked = item.userData.source === group.name || item.userData.target === group.name
    item.dash.material.opacity = isLinked ? 0.65 : 0.02
    item.dash.material.color.set(isLinked ? clickedColor : 0x6366f1)
    item.solid.material.opacity = isLinked ? 0.18 : 0.02
    item.solid.material.color.set(isLinked ? clickedColor : 0x334466)
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
    g.scale.setScalar(1)
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
      if (child.isSprite && child.name !== 'label') {
        child.material.opacity = 0.5
      }
    })
    const label = g.getObjectByName('label')
    if (label) label.visible = true
  })

  energyParticles.forEach(ep => {
    ep.group.children.forEach(c => {
      if (c.material) c.material.dispose()
      if (c.geometry) c.geometry.dispose()
    })
    scene.remove(ep.group)
  })
  energyParticles = []

  clickedNode = null
  selectedNode.value = null
  flyData = null
  controls.autoRotate = true
  controls.enableDamping = true

  linkLines.forEach(item => {
    item.dash.material.opacity = 0.2
    item.dash.material.color.set(0x6366f1)
    item.solid.material.opacity = 0.05
    item.solid.material.color.set(0x334466)
  })
}

function filterNodes() {
  if (!searchText.value.trim()) {
    nodeMeshes.forEach(g => g.visible = true)
    labelSprites.forEach(l => l.sprite.visible = true)
    if (clickedNode) deselectNode()
    return
  }
  const q = searchText.value.toLowerCase()
  let firstMatch = null
  nodeMeshes.forEach(g => {
    const node = g.userData.node
    const match = node.title.toLowerCase().includes(q) || node.category.toLowerCase().includes(q)
    g.visible = match
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

    if (group === clickedNode) {
      ud.wobbleOffset += dt * 0.25
      const wx = Math.sin(ud.wobbleOffset * 1.1) * 0.18
      const wy = Math.cos(ud.wobbleOffset * 0.9) * 0.18
      const wz = Math.cos(ud.wobbleOffset * 1.3) * 0.18
      group.position.copy(ud.home).add(new THREE.Vector3(wx, wy, wz))

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
  })

  updateLinks()

  linkLines.forEach(item => {
    item.dash.material.dashOffset -= dt * 18
  })

  energyParticles.forEach(ep => {
    ep.t += ep.speed * dt
    if (ep.t > 1) ep.t -= 1
    const t = ep.t
    const mt = 1 - t
    const p0 = ep.srcGroup.position
    const p2 = ep.tgtGroup.position
    const mx = (p0.x + p2.x) / 2
    const my = (p0.y + p2.y) / 2 + 20
    const mz = (p0.z + p2.z) / 2
    const px = mt * mt * p0.x + 2 * mt * t * mx + t * t * p2.x
    const py = mt * mt * p0.y + 2 * mt * t * my + t * t * p2.y
    const pz = mt * mt * p0.z + 2 * mt * t * mz + t * t * p2.z
    const nt = Math.min(t + 0.03, 1)
    const nmt = 1 - nt
    const nx = nmt * nmt * p0.x + 2 * nmt * nt * mx + nt * nt * p2.x
    const ny = nmt * nmt * p0.y + 2 * nmt * nt * my + nt * nt * p2.y
    const nz = nmt * nmt * p0.z + 2 * nmt * nt * mz + nt * nt * p2.z
    const dx = nx - px
    const dy = ny - py
    const dz = nz - pz
    ep.group.position.set(px, py, pz)
    if (dx !== 0 || dy !== 0 || dz !== 0) {
      ep.group.lookAt(px + dx * 2, py + dy * 2, pz + dz * 2)
    }
    const pulse = 0.1 + Math.sin(t * Math.PI) * 0.85
    ep.head.material.opacity = pulse
    ep.tail.material.opacity = pulse * 0.7
  })

  if (particlesSystem) {
    particlesSystem.rotation.y += dt * 0.06
    particlesSystem.rotation.x += dt * 0.02
  }

  const orbitParticles = scene.getObjectByName('orbitParticles')
  if (orbitParticles) {
    orbitParticles.rotation.y += dt * 0.04
    orbitParticles.rotation.x += dt * 0.03
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
