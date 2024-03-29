let debug = false

let x = 50

const expressions = ['happy', 'sad', 'neutral', 'angry', 'surprised']
const FACTOR_MLT = 1
let exprLeft = ''
let exprRight = ''
const red = '#ff4a1d'
const blue = '#004ede'

let videoEl = null
const canvas = document.querySelector('#overlay')
const ctx = canvas.getContext('2d')
let options
let interval
let steps
const maxSteps = 7
const changeStep = 4
let gamePlay = false

function startGame () {
  console.log('start Game')
  gamePlay = true
  document.querySelector('#title_sound').pause()
  document.querySelector('#gameplay').play()
  document.querySelector('#gameplay').volume = 0.6;
  document.querySelector('#crowd').play()
  clearInterval(interval)
  x = 50
  steps = 0
  changeExpr()
  TweenMax.set('#timer_bar', { width: '100%' })

  interval = setInterval(changeExpr, 1000 * changeStep)
  TweenMax.to('#title', 0.2, { opacity: 0, ease: Expo.easeOut, transformOrigin: 'center' })

  TweenMax.set('.red .expression', { scale: 1, transformOrigin: 'center' })
  TweenMax.set('.blue .expression', { scale: 1, transformOrigin: 'center' })
  draw()
}

function changeExpr () {
  console.log('changeExpr')
  const cloned = JSON.parse(JSON.stringify(expressions))
  const pickLeft = parseInt(Math.random() * cloned.length)
  exprLeft = cloned[pickLeft]
  cloned.splice(pickLeft, 1)
  const pickRight = parseInt(Math.random() * cloned.length)
  exprRight = cloned[pickRight]

  document.querySelector('.red .expression img').src = 'assets/' + exprLeft + '.svg'
  document.querySelector('.blue .expression img').src = 'assets/' + exprRight + '.svg'

  setTimeout(function () {
    document.querySelector('#expression_change').play()
  }, 200)

  TweenMax.to(document.querySelector('.red .expression'), 0.2, { scale: 1.5, ease: Expo.easeIn })
  TweenMax.to(document.querySelector('.red .expression'), 0.8, { scale: 1, ease: Expo.easeOut, delay: 0.2 })
  TweenMax.to(document.querySelector('.blue .expression'), 0.2, { scale: 1.5, ease: Expo.easeIn })
  TweenMax.to(document.querySelector('.blue .expression'), 0.8, { scale: 1, ease: Expo.easeOut, delay: 0.2 })


  TweenMax.to('#timer_bar', 1, { delay: 0.2, width: 100 * (maxSteps - steps) / maxSteps + '%', ease: Back.easeOut })


  steps++

  if (steps > maxSteps) {
    const won = x > 50 ? '.blue' : '.red'
    endGame(won)
  }
}

function endGame (won) {
  console.log('end game')
  gamePlay = false
  document.querySelector('.red .expression img').src = 'assets/none.svg'
  document.querySelector('.blue .expression img').src = 'assets/none.svg'

  document.querySelector('#won').play()
  document.querySelector('#gameplay').pause()
  document.querySelector('#crowd').pause()
  TweenMax.to(won + ' .expression', 1, { overwrite: true, scale: 1.8, ease: Elastic.easeOut, transformOrigin: 'center' })

  clearInterval(interval)

 
  setTimeout(function(){
    document.querySelector('#title_sound').play()
     TweenMax.to('#title', 0.2, { opacity: 1, ease: Expo.easeIn, transformOrigin: 'center' })
  }, 4.5*1000)
  
}

async function draw () {
  const result = await faceapi.detectAllFaces(videoEl, options).withFaceExpressions()

  if (result) {
    const dims = faceapi.matchDimensions(canvas, videoEl, true)
    const resizedResult = faceapi.resizeResults(result, dims)

    if (debug) {
      const minConfidence = 0.05
      faceapi.draw.drawDetections(canvas, resizedResult)
      faceapi.draw.drawFaceExpressions(canvas, resizedResult, minConfidence)
    }

    result.forEach((f, i) => {
      x -= f.expressions[exprLeft] * FACTOR_MLT
      x += f.expressions[exprRight] * FACTOR_MLT
      TweenMax.set('#ball', { left: x + '%' })

      let colorDominant = '#999'
      let dominantExp = ''
      let currentMax = 0
      expressions.forEach(e => {
        const v = f.expressions[e]
        if (v > currentMax) {
          currentMax = v
          dominantExp = e
        }
      })
      if (dominantExp === exprLeft || dominantExp === exprRight) {
        colorDominant = dominantExp === exprLeft ? red : blue
      }

      const r = resizedResult[i].detection
      if (r) {
        const box = r.box
        ctx.beginPath()
        const calcX = 640 - (box.x + box.width / 2)
        ctx.arc(calcX, box.y, 15, 0, 2 * Math.PI)
        ctx.fillStyle = colorDominant
        ctx.fill()
      }
    })
  }

  if (gamePlay) {
    setTimeout(() => draw())
    if (x < 0) {
      endGame('.red')
    }
    if (x > 100) {
      endGame('.blue')
    }
  }
}

async function onReady () {
  options = getFaceDetectorOptions()
  await faceapi.detectAllFaces(videoEl, options).withFaceExpressions()
  console.log('Ready for real')
}

async function init () {
  await changeFaceDetector(TINY_FACE_DETECTOR)
  await faceapi.loadFaceExpressionModel('/')

  const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
  videoEl = document.querySelector('#inputVideo')
  videoEl.srcObject = stream

  document.querySelector('#title_sound').play()
}

init()

document.body.addEventListener('keypress', e => {
  if (e.code === 'Space') {
    startGame()
  }
  if (e.code === 'KeyD') debug = !debug
})
