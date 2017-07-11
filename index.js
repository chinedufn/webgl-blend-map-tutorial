var canvas = document.createElement('canvas')
canvas.width = 256
canvas.height = 256
canvas.style.border = 'solid 1px rgba(0, 0, 0, 0.1)'

var currentColor = 'black'

var buttonContainer = document.createElement('div')

// TODO: for loop this. Getting too long for no reason
// we aren't trying to learn about buttons lol
var redButton = document.createElement('button')
redButton.style.color = 'rgb(255, 0, 0)'
redButton.style.fontSize = '24px'
redButton.style.cursor = 'pointer'
redButton.innerHTML = 'red'
redButton.onclick = function () { currentColor = 'rgb(255, 0, 0)' }

var greenButton = document.createElement('button')
greenButton.style.color = 'rgb(0, 255, 0)'
greenButton.style.fontSize = '24px'
greenButton.style.cursor = 'pointer'
greenButton.innerHTML = 'green'
greenButton.onclick = function () { currentColor = 'rgb(0, 255, 0)' }

var blueButton = document.createElement('button')
blueButton.style.color = 'rgb(0, 0, 255)'
blueButton.style.fontSize = '24px'
blueButton.style.cursor = 'pointer'
blueButton.innerHTML = 'blue'
blueButton.onclick = function () { currentColor = 'rgb(0, 0, 255)' }

var blackButton = document.createElement('button')
blackButton.style.color = 'black'
blackButton.style.fontSize = '24px'
blackButton.style.cursor = 'pointer'
blackButton.innerHTML = 'black'
blackButton.onclick = function () { currentColor = 'black' }

var purpleButton = document.createElement('button')
purpleButton.style.color = 'purple'
purpleButton.style.fontSize = '24px'
purpleButton.style.cursor = 'pointer'
purpleButton.innerHTML = 'purple'
purpleButton.onclick = function () { currentColor = 'purple' }

buttonContainer.appendChild(redButton)
buttonContainer.appendChild(greenButton)
buttonContainer.appendChild(blueButton)
buttonContainer.appendChild(blackButton)
buttonContainer.appendChild(purpleButton)

var mountElem = document.querySelector('#webgl-blend-map-tutorial') || document.body
mountElem.appendChild(buttonContainer)
mountElem.appendChild(canvas)

var context = canvas.getContext('2d')
context.fillStyle = 'purple'
context.fillRect(0, 0, context.canvas.width, context.canvas.height)

var blendmapImage = new window.Image()
blendmapImage.src = canvas.toDataURL()

var terrainImage = new window.Image()

var isPainting = false

function startPainting (e) {
  isPainting = true
  addPoint(
      e.pageX - canvas.offsetLeft,
      e.pageY - canvas.offsetTop,
      false
  )
  repaint()
}

function movePaintbrush (e) {
  if (isPainting) {
    addPoint(
      (e.pageX || e.changedTouches[0].pageX) - canvas.offsetLeft,
      (e.pageY || e.changedTouches[0].pageY) - canvas.offsetTop,
      true
    )
    repaint()
  }
}

canvas.addEventListener('mousedown', startPainting)
canvas.addEventListener('touchstart', startPainting)

canvas.addEventListener('mousemove', movePaintbrush)
canvas.addEventListener('touchmove', movePaintbrush)

canvas.addEventListener('mouseup', function (e) {
  isPainting = false
})
canvas.addEventListener('touchend', function (e) {
  isPainting = false
})

var allPoints = []
function addPoint (x, y, connectWithPrevious) {
  allPoints.push({
    x: x,
    y: y,
    connect: connectWithPrevious,
    color: currentColor
  })
}

function repaint () {
  context.fillRect(0, 0, context.canvas.width, context.canvas.height)

  context.lineJoin = 'round'
  context.lineWidth = 20

  for (var i = 0; i < allPoints.length; i++) {
    context.beginPath()
    if (allPoints[i].connect) {
      context.moveTo(allPoints[i - 1].x, allPoints[i - 1].y)
    } else {
      context.moveTo(allPoints[i].x - 1, allPoints[i].y)
    }
    context.lineTo(allPoints[i].x, allPoints[i].y)

    context.closePath()

    context.strokeStyle = allPoints[i].color
    context.stroke()
  }

  blendmapImage.src = canvas.toDataURL()
  blendmapImage.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, blendmapTexture)
    // gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, blendmapImage)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, blendmapImage)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }
}

/**
 * WebGL Canvas Code
 */
var webGLCanvas = document.createElement('canvas')
webGLCanvas.width = 512
webGLCanvas.height = 512
mountElem.appendChild(webGLCanvas)

var gl = webGLCanvas.getContext('webgl')
gl.clearColor(0.0, 0.0, 0.0, 1.0)

var vertexPositionBuffer = gl.createBuffer()
var vertexIndexBuffer = gl.createBuffer()
var vertexUVsBuffer = gl.createBuffer()

var positions = []
var indices = []
var uvs = []
var distance = -85
var tileNum = 0
for (var y = 0; y < 64; y++) {
  for (var x = 0; x < 64; x++) {
    positions = positions.concat([
      // Bottom left tile corner
      x, y, distance,
      // Bottom right tile corner
      1 + x, y, distance,
      // Top right tile corner
      1 + x, 1 + y, distance,
      // Top left tile corner
      x, 1 + y, distance
    ])

    uvs = uvs.concat([
      // Bottom left tile corner
      x / 64, y / 64,
      // Bottom right tile corner
      (x + 1) / 64, y / 64,
      // Top right tile corner
      (x + 1) / 64, (y + 1) / 64,
      // Top left tile corner
      x / 64, (y + 1) / 64
    ])

    indices = indices.concat([
      0, 1, 2, 0, 2, 3
    ].map(function (num) {
      return num + (4 * tileNum)
    }))

    tileNum++
  }
}

gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer)
// Buffer objects hold a linear array of memory of arbitrary size.
// This memory must be allocated before it can be uploaded to or used.
// So this code gets the size, allocates the linear memory, and then fills it with this data
// TODO: Look up what an ELEMENT_ARRAY_BUFFER is and what gl.STATIC_DRAW does
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

gl.bindBuffer(gl.ARRAY_BUFFER, vertexUVsBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW)

var count = 0
function handleLoadedTexture (texture, image) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  // Do we need this line?
  gl.bindTexture(gl.TEXTURE_2D, null)

  count += 1
  if (count === 2) {
    setUpWebGLState()
  }
}

var blendmapTexture = gl.createTexture()
blendmapImage.crossOrigin = 'anonymous'
blendmapImage.onload = function () {
  handleLoadedTexture(blendmapTexture, blendmapImage)
}

var terrainTexture = gl.createTexture()
terrainImage.crossOrigin = 'anonymous'
terrainImage.onload = function () {
  handleLoadedTexture(terrainTexture, terrainImage)
}
terrainImage.src = '/terrain.jpg'

var vertexShader = `
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

varying vec2 vTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main (void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  vTextureCoord = aTextureCoord;
}
`

// TODO: Slider to control tiling from 1.0 - 20.0, start at 6.0. Pass in a uniform for 6.0 or whatever the value is
var fragmentShader = `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uBlendmapSampler;
uniform sampler2D uTerrainSampler;

void main (void) {
 vec4 blendColor = texture2D(uBlendmapSampler, vec2(vTextureCoord.s, vTextureCoord.t));

 vec4 mossColor = texture2D(uTerrainSampler, vec2(mod(vTextureCoord.s * 0.5 * 6.0, 0.5), mod(vTextureCoord.t * 0.5 * 6.0, 0.5) - 0.5));

 vec4 lavaColor = texture2D(uTerrainSampler, vec2(mod(vTextureCoord.s * 0.5 * 6.0, 0.5) + 0.5, mod(vTextureCoord.t * 0.5 * 6.0, 0.5) - 0.5));

 vec4 rockColor = texture2D(uTerrainSampler, vec2(mod(vTextureCoord.s * 0.5 * 6.0, 0.5) + 0.5, mod(vTextureCoord.t * 0.5 * 6.0, 0.5)));

 vec4 waterColor = texture2D(uTerrainSampler, vec2(mod(vTextureCoord.s * 0.5 * 6.0, 0.5), mod(vTextureCoord.t * 0.5 * 6.0, 0.5)));
 float foo = mod (2.0, 1.0);

 float blackWeight = 1.0 - blendColor.x - blendColor.y - blendColor.z;

 gl_FragColor = mossColor * blackWeight +
 lavaColor * blendColor.x +
 rockColor * blendColor.y +
 waterColor * blendColor.z;
}
`

var vert = gl.createShader(gl.VERTEX_SHADER)
var frag = gl.createShader(gl.FRAGMENT_SHADER)

gl.shaderSource(vert, vertexShader)
gl.compileShader(vert)

gl.shaderSource(frag, fragmentShader)
gl.compileShader(frag)

var shaderProgram = gl.createProgram()
gl.attachShader(shaderProgram, vert)
gl.attachShader(shaderProgram, frag)

gl.linkProgram(shaderProgram)

gl.useProgram(shaderProgram)

function setUpWebGLState () {
  var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition')
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
  gl.enableVertexAttribArray(vertexPositionAttribute)
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0)

  var textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord')
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexUVsBuffer)
  gl.enableVertexAttribArray(textureCoordAttribute)
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0)

  var blendmapSamplerUniform = gl.getUniformLocation(shaderProgram, 'uBlendmapSampler')
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, blendmapTexture)
  gl.uniform1i(blendmapSamplerUniform, 0)

  var terrainSamplerUniform = gl.getUniformLocation(shaderProgram, 'uTerrainSampler')
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, terrainTexture)
  gl.uniform1i(terrainSamplerUniform, 1)

  var mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix')
  gl.uniformMatrix4fv(mvMatrixUniform, false, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -32, -32, 0, 1])

  // TODO: How come we need a perspective matrix?
  var pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix')
  gl.uniformMatrix4fv(pMatrixUniform, false, require('gl-mat4/perspective')([], Math.PI / 4, 400 / 400, 0.1, 1000))
}

// TODO: Use create-draw-function. Write unit tests two accept two textures
function drawWebGLCanvas () {
  setUpWebGLState()
  if (count === 2) {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.viewport(0, 0, 512, 512)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer)
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
  }

  window.requestAnimationFrame(drawWebGLCanvas)
}
drawWebGLCanvas()
