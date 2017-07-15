/**
 * Section 1: Creating our paintbrush controls
 */

// Create the canvas that we will be using our paintbrush on.
// The contents of this canvas will become to blend map that
// we use to multitexture our WebGL plane.
var drawCanvas = document.createElement('canvas')
drawCanvas.width = 256
drawCanvas.height = 256
drawCanvas.style.width = '256px'
drawCanvas.style.height = '256px'
drawCanvas.style.border = 'solid 1px rgba(0, 0, 0, 0.1)'

// We start our paintbrush
var brushColor = 'purple'

// Create the sliders that allow you to change the
// red, green and blue components of the paintbrush color
function createColorSlider () {
  var colorSlider = document.createElement('input')
  colorSlider.type = 'range'
  colorSlider.min = 0
  colorSlider.max = 255
  colorSlider.step = 1
  colorSlider.oninput = handleSliderChange

  return colorSlider
}
var redSlider = createColorSlider()
var blueSlider = createColorSlider()
var greenSlider = createColorSlider()

// Whenever our sliders are slid we update the brush color
function handleSliderChange () {
  brushColor = `rgb(${redSlider.value}, ${greenSlider.value}, ${blueSlider.value})`
  setColorDisplays()
}

// Wrap the sliders in a div that has a label
// of R, G or B
function addSliderLabel (label, colorSlider) {
  var sliderLabel = document.createElement('label')
  sliderLabel.display = 'inline-block'
  sliderLabel.innerHTML = label

  var sliderWrapper = document.createElement('div')
  sliderWrapper.display = 'block'
  sliderWrapper.appendChild(sliderLabel)
  sliderWrapper.appendChild(colorSlider)

  return sliderWrapper
}

// Create a div to hold all of our sliders
var sliderContainer = document.createElement('div')
sliderContainer.appendChild(addSliderLabel('R', redSlider))
sliderContainer.appendChild(addSliderLabel('G', greenSlider))
sliderContainer.appendChild(addSliderLabel('B', blueSlider))

// Reset the display that shows what the current brush color is
function setColorDisplays () {
  colorDisplay.innerHTML = `rgb(${redSlider.value}, ${greenSlider.value}, ${blueSlider.value})`
  swatchDisplay.style.backgroundColor = brushColor
}

// Create the displays that show what the current color is
var colorDisplay = document.createElement('span')
var swatchDisplay = document.createElement('div')
swatchDisplay.style.width = '20px'
swatchDisplay.style.height = '20px'
swatchDisplay.style.marginRight = '5px'
swatchDisplay.style.borderRadius = '50%'
setColorDisplays()

// Create the container that holds our brush's color display
var colorDisplayContainer = document.createElement('div')
colorDisplayContainer.style.display = 'flex'
colorDisplayContainer.style.alignItems = 'center'
colorDisplayContainer.appendChild(swatchDisplay)
colorDisplayContainer.appendChild(colorDisplay)

// Create the preset buttons to select the appropriate color
// for painting one of our four textures
var buttonContainer = document.createElement('div')
buttonContainer.style.display = 'flex'
buttonContainer.style.width = '500px'
buttonContainer.style.flexWrap = 'wrap'

// Create one of our preset buttons
function createColorButton (color, label) {
  var colorButton = document.createElement('button')

  colorButton.style.color = `rgb(${color.join(',')})`
  colorButton.style.fontSize = '24px'
  colorButton.style.cursor = 'pointer'
  colorButton.style.marginTop = '5px'
  colorButton.style.marginRight = '5px'
  colorButton.innerHTML = label
  colorButton.onclick = function () {
    brushColor = `rgb(${color.join(',')})`
    redSlider.value = color[0]
    greenSlider.value = color[1]
    blueSlider.value = color[2]
    setColorDisplays()
  }

  buttonContainer.appendChild(colorButton)
}

// Add an undo button
var undoButton = document.createElement('button')
undoButton.style.cursor = 'pointer'
undoButton.style.marginRight = '5px'
undoButton.innerHTML = 'Undo'
undoButton.onclick = undo
buttonContainer.appendChild(undoButton)

// Create our four preset buttons. Our fragment will
// read these colors from the blend map in order to know
// which textures to sample
createColorButton([0, 0, 0], 'stone')
createColorButton([255, 0, 0], 'lava')
createColorButton([0, 255, 0], 'moss')
createColorButton([0, 0, 255], 'water')

// Add all of our color controls into the page
var mountElem = document.querySelector('#webgl-blend-map-tutorial') || document.body
mountElem.appendChild(buttonContainer)
mountElem.appendChild(sliderContainer)
mountElem.appendChild(colorDisplayContainer)

// Create the canvas that will hold our WebGL terrain
var webGLCanvas = document.createElement('canvas')
webGLCanvas.width = 512
webGLCanvas.height = 512
mountElem.appendChild(webGLCanvas)

// Add our paintbrush canvas and WebGL canvas into the page
var canvasContainer = document.createElement('div')
canvasContainer.style.display = 'flex'
canvasContainer.appendChild(drawCanvas)
canvasContainer.appendChild(webGLCanvas)
mountElem.appendChild(canvasContainer)

/**
 * Section 2 - Painting to our blendmap
 */

// Get our 2d context for our painting canvas. This allows
// us to draw onto our 2d canvas
var canvas2dContext = drawCanvas.getContext('2d')
canvas2dContext.fillStyle = brushColor
canvas2dContext.fillRect(0, 0, canvas2dContext.canvas.width, canvas2dContext.canvas.height)

// A flag to let us know whether or not we should draw onto our canvas when the mouse
// moves over the canvas
var isPainting = false

// When the user clicks or touches the canvas we begin painting to our canvas
function startPainting (e) {
  isPainting = true
  addPoint(
      e.pageX - drawCanvas.offsetLeft,
      e.pageY - drawCanvas.offsetTop,
      // This indicates not to connect this new paint with the
      // previous blob of paint
      false
  )
}

// Add a new point to our canvas and connect it with the previous point.
// This happens when you're dragging your mouse / finger
function movePaintbrush (e) {
  if (isPainting) {
    addPoint(
      (e.pageX || e.changedTouches[0].pageX) - drawCanvas.offsetLeft,
      (e.pageY || e.changedTouches[0].pageY) - drawCanvas.offsetTop,
      // This indicates to connect this blob of paint with
      // the previous blob of paint
      true
    )
  }
}

// When the user lifts their finger or mouse we stop painting
// We keep track of the last point that they drew before release
// their mouse so that our undo button can revert us back to that
// point
var lastMouseReleaseIndices = []
function stopPainting () {
  lastMouseReleaseIndices.push(allPoints.length - 1)
  isPainting = false
}

// Add event listeners to draw when we mouse / touching the canvas
drawCanvas.addEventListener('mousedown', startPainting)
drawCanvas.addEventListener('touchstart', startPainting)
drawCanvas.addEventListener('mousemove', movePaintbrush)
drawCanvas.addEventListener('touchmove', movePaintbrush)
drawCanvas.addEventListener('mouseup', stopPainting)
drawCanvas.addEventListener('touchend', stopPainting)

// Keep track of everytime the user adds a new blob of paint.
// When we repaint our canvas we go through all of the blobs
// of paint that they added and redraw to the canvas at
// those points.
var allPoints = []
function addPoint (x, y, connectWithPrevious) {
  allPoints.push({
    x: x,
    y: y,
    connect: connectWithPrevious,
    color: brushColor
  })
}

// To undo a paint stroke we remove the last element in our array of
// paint points
function undo () {
  if (lastMouseReleaseIndices.length > 1) {
    allPoints = allPoints.slice(
      0,
      lastMouseReleaseIndices[lastMouseReleaseIndices.length - 2]
    )
  } else if (lastMouseReleaseIndices.length === 1) {
    allPoints = []
  }

  lastMouseReleaseIndices.pop()
}

// Loop through all of the points in our array of paint strokes
// and use that to re-draw our canvas
function redrawPaintCanvas () {
  // Start by clearing our canvas
  canvas2dContext.fillRect(0, 0, canvas2dContext.canvas.width, canvas2dContext.canvas.height)

  // Set the line type and size
  canvas2dContext.lineJoin = 'round'
  canvas2dContext.lineWidth = 20

  for (var i = 0; i < allPoints.length; i++) {
    canvas2dContext.beginPath()
    if (allPoints[i].connect && allPoints[i - 1]) {
      // If this is a connected brush stroke we connect it with
      // the previous brush stroke
      canvas2dContext.moveTo(allPoints[i - 1].x, allPoints[i - 1].y)
    } else {
      // If this is just a click we draw a 1 pixel wide stroke
      // right where they clicked
      canvas2dContext.moveTo(allPoints[i].x - 1, allPoints[i].y)
    }

    // Draw our paint line
    canvas2dContext.lineTo(allPoints[i].x, allPoints[i].y)
    canvas2dContext.closePath()
    canvas2dContext.strokeStyle = allPoints[i].color
    canvas2dContext.stroke()
  }

  // Make our WebGL canvas's blend map reload itself from the contents of our canvas
  blendmapImage.src = drawCanvas.toDataURL()
}

/**
 * Section 3: Drawing our WebGL terrain
 */

// Get our WebGL context. We'll use this in order to
// draw onto our WebGL canvas
var gl = webGLCanvas.getContext('webgl')
gl.clearColor(0.0, 0.0, 0.0, 1.0)
gl.viewport(0, 0, 512, 512)

// Create WebGLBuffers for our vertices. We will buffer their
// positions, the other to draw them, and the coordinates in our
// texture (uvs) that each vertex should use
var vertexPositionBuffer = gl.createBuffer()
var vertexIndexBuffer = gl.createBuffer()
var vertexUVsBuffer = gl.createBuffer()

// We're going to generate a terrain. A terrain is just
// a bunch of triangles in a grid. The points on the triangles have different
// heights. To make this tutorial a little simpler, we're just going to make
// our "terrain" completely flat. Otherwise we'd need to add in some code to
// handle normals and lighting
var positions = []
var indices = []
var uvs = []

// The distance into the scene that we're placing the terrain
var distanceAway = -85

// Keep track of which tile we are currently rendering. Each tile
// is a square made up of two triangles. Knowing which tile number
// we are on lets us know where to put this square
var tileNum = 0

// Generate our vertex data for the rows and columns
// of our terrain grid
var numRowsColumns = 64
for (var y = 0; y < numRowsColumns; y++) {
  for (var x = 0; x < numRowsColumns; x++) {
    positions = positions.concat([
      // Bottom left tile corner
      x, y, distanceAway,
      // Bottom right tile corner
      1 + x, y, distanceAway,
      // Top right tile corner
      1 + x, 1 + y, distanceAway,
      // Top left tile corner
      x, 1 + y, distanceAway
    ])

    // The bottom left of our grid will use [0, 0] of
    // our blend map uvs. The top right of our grid
    // will use [1, 1] of our blend map uvs
    uvs = uvs.concat([
      // Bottom left tile corner
      x / numRowsColumns, y / numRowsColumns,
      // Bottom right tile corner
      (x + 1) / numRowsColumns, y / numRowsColumns,
      // Top right tile corner
      (x + 1) / numRowsColumns, (y + 1) / numRowsColumns,
      // Top left tile corner
      x / numRowsColumns, (y + 1) / numRowsColumns
    ])

    // These are used by gl.drawElements to draw our grid
    indices = indices.concat([
      0, 1, 2, 0, 2, 3
    ].map(function (num) {
      return num + (4 * tileNum)
    }))

    tileNum++
  }
}

// Create a WebGL texture for our blend map
var blendmapTexture = gl.createTexture()
var blendmapImage = new window.Image()
blendmapImage.src = drawCanvas.toDataURL()
blendmapImage.onload = function () {
  handleLoadedTexture(blendmapTexture, blendmapImage)
}

// Create a WebGL texture for our terrain texture atlas
var terrainTexture = gl.createTexture()
var terrainImage = new window.Image()
terrainImage.crossOrigin = 'anonymous'
terrainImage.onload = function () {
  handleLoadedTexture(terrainTexture, terrainImage)
}
terrainImage.src = '/terrain.jpg'

var bothImagesLoaded = false
// When our images load we and add them to our texture buffers
function handleLoadedTexture (texture, image) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  // Do we need this line?
  gl.bindTexture(gl.TEXTURE_2D, null)

  // Once both images have loaded we set up all of the WebGL state that
  // we'll need to draw our WebGL terrain
  if (bothImagesLoaded) {
    setupWebGLState()
  }
  bothImagesLoaded = true
}


// Our vertex shader just draws the terrain based on the vertices that we pass in
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

// Here we create our fragment shader
var fragmentShader = `
precision mediump float;

varying vec2 vTextureCoord;

// These are our blend map and the
// terrain texture atlas that we loaded
uniform sampler2D uBlendmapSampler;
uniform sampler2D uTerrainSampler;

void main (void) {
   // Read the color from our blend map based on this vertex's uv coord
   vec4 blendColor = texture2D(uBlendmapSampler, vec2(vTextureCoord.s, vTextureCoord.t));

   float numRepeats = 6.0;
   // Our texture atlas is split into four sections, if you open the terrain.jpg image you'll see what I mean
   // Here we take our texture coordinates and then shrink and move them to fit within each of the four sections.
   // We then multiply by numRepeats to make the texture tile. If you play around with these numbers you'll get
   // A good sense of how this works
   vec4 rockColor = texture2D(uTerrainSampler, vec2(mod(vTextureCoord.s * 0.5 * numRepeats, 0.5) + 0.5, mod(vTextureCoord.t * 0.5 * numRepeats, 0.5)));
   vec4 lavaColor = texture2D(uTerrainSampler, vec2(mod(vTextureCoord.s * 0.5 * numRepeats, 0.5) + 0.5, mod(vTextureCoord.t * 0.5 * numRepeats, 0.5) - 0.5));
   vec4 mossColor = texture2D(uTerrainSampler, vec2(mod(vTextureCoord.s * 0.5 * numRepeats, 0.5), mod(vTextureCoord.t * 0.5 * numRepeats, 0.5) - 0.5));
   vec4 waterColor = texture2D(uTerrainSampler, vec2(mod(vTextureCoord.s * 0.5 * numRepeats, 0.5), mod(vTextureCoord.t * 0.5 * numRepeats, 0.5)));

   // Subtract the red, green and blue to get the black component
   // of our blend map
   float blackWeight = 1.0 - blendColor.x - blendColor.y - blendColor.z;

   // black component is rock
   gl_FragColor = rockColor * blackWeight +
   // red component is lava
   lavaColor * blendColor.x +
   // green component is moss
   mossColor * blendColor.y +
   // blue component is water
   waterColor * blendColor.z;
}
`

// Create a shader program using the vertex and fragment shaders
// that we wrote above
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

// Set our WebGL context up with all of the state that in needs
// in order to draw our multitextured terrain
function setupWebGLState () {
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
  // gi.STATIC_DRAW is a hint that we're storing this data once but
  // using it to draw over and over and over again. The underlying OpenGL
  // implementation will use this to optimize how the buffer to fit
  // our intended usage
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexUVsBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW)

  // Vertex positions
  var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition')
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer)
  gl.enableVertexAttribArray(vertexPositionAttribute)
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0)

  // Vertex uvs
  var textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord')
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexUVsBuffer)
  gl.enableVertexAttribArray(textureCoordAttribute)
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0)

  // Terrain texture atlas
  var terrainSamplerUniform = gl.getUniformLocation(shaderProgram, 'uTerrainSampler')
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, terrainTexture)
  gl.uniform1i(terrainSamplerUniform, 1)

  // Blendmap
  var blendmapSamplerUniform = gl.getUniformLocation(shaderProgram, 'uBlendmapSampler')
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, blendmapTexture)
  gl.uniform1i(blendmapSamplerUniform, 0)

  // Model view matrix
  var mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix')
  // This is a matrix that moves our terrain 32 units to the left and 32 units down
  gl.uniformMatrix4fv(mvMatrixUniform, false, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -32, -32, 0, 1])

  // Perspective matrix
  var pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix')
  gl.uniformMatrix4fv(pMatrixUniform, false, require('gl-mat4/perspective')([], Math.PI / 4, 400 / 400, 0.1, 1000))

  // Order of vertices to draw for our terrain
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer)
}

// Redraw out paintbrush canvas and WebGL canvas every request animation frame
function drawBothCanvases () {
  redrawPaintCanvas()

  if (bothImagesLoaded) {
    // Clear the WebGL canvas terrain
    gl.clear(gl.COLOR_BUFFER_BIT)
    // Redraw the WebGL canvas terrain
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
  }

  window.requestAnimationFrame(drawBothCanvases)
}
// Start our reequest animation frame draw loop
drawBothCanvases()
