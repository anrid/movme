'use strict'

const Spawn = require('child_process').spawn
const P = require('bluebird')
const Uuid = require('node-uuid')
const Argv = require('minimist')(process.argv.slice(2))
const S3 = require('./s3')

const run = P.coroutine(function * (files) {
  const timer = Date.now()
  console.log('Processing files:')
  console.log(files)

  const audio1 = yield extractAudio(files[0])
  const finalAudio = yield mixAudio(audio1.outfile, '/Users/anrid/Downloads/work.mp3')

  // Process the whole timeline.
  const timeline = []
  console.log('Timeline:')
  for (const file of files) {
    const scene = yield convertToTs(file)
    console.log(`#${timeline.length} ${scene.outfile}`)
    timeline.push(scene)
  }

  const duration = getTotalTimelineDuration(timeline)
  console.log('Total timeline duration:', duration)

  const output = yield buildTimeline(timeline, finalAudio.outfile, {
    resolution: '1080p',
    duration
  })

  const elapsed = ((Date.now() - timer) / 1000).toFixed(2)
  console.log(`Created ${output.outfile} in ${elapsed} seconds.`)

  // Upload our movie to S3.
  yield S3.uploadFiles([output.outfile])

  console.log('It’s a Done Deal.')
})

if (Argv._.length) {
  run(Argv._)
} else {
  printUsage()
}

function printUsage () {
  console.log(`
  Usage:
  node renderer.js <video clip 1> <video clip 2> <...>

  Will upload the new movie to Amazon S3:
  Region: ${process.env.BASELINE_AWS_REGION}
  Bucket: ${process.env.BASELINE_AWS_BUCKET}
  URL:    https://s3-${process.env.BASELINE_AWS_REGION}.amazonaws.com/${process.env.BASELINE_AWS_BUCKET}/videos/00000000-aaaa-bbbb-cccc-xxxxyyyyzzzz.mp4
  `)
}

function getTotalTimelineDuration (timeline) {
  return timeline.reduce((acc, x) => {
    acc += x.info.sec
    return acc
  }, 0)
}

function mixAudio (track1, track2) {
  const outfile = `/tmp/${Uuid.v1()}.aac`
  const cmd = 'ffmpeg'

  const filters = [
    '[0:0] afade=t=in:ss=0:d=1 [a1]',
    '[1:0] afade=t=in:ss=0:d=1 [a2]',
    '[a1][a2] amix=inputs=2:duration=longest:dropout_transition=3'
  ]

  const args = [
    '-i', track1,
    '-i', track2,
    '-filter_complex', filters.join(' ; '),
    '-c:a', 'aac',
    outfile
  ]

  return runCommand(cmd, args)
  .then((result) => ({ outfile, result }))
}

function extractAudio (infile, boost) {
  const outfile = `/tmp/${Uuid.v1()}.aac`
  const cmd = 'ffmpeg'
  const args = [
    '-i', infile,
    '-c:a', 'aac',
    outfile
  ]

  return runCommand(cmd, args)
  .then((result) => ({ outfile, result }))
}

function buildTimeline (timeline, audio, opts) {
  const settings = {
    bitrate: opts.resolution === '1080p' ? '2070k' : '920k',
    bufsize: opts.resolution === '1080p' ? '4140k' : '1840k',
    scale: opts.resolution === '1080p' ? 'scale=1920:1080' : 'scale=1280:720'
  }
  const concat = timeline.map((x) => x.outfile).join('|')

  const outfile = `/tmp/${Uuid.v1()}.mp4`
  const cmd = 'ffmpeg'
  const args = [
    '-i', `concat:${concat}`,
    '-i', audio,
    '-c:v', 'libx264',
    '-tune', 'zerolatency',
    '-preset', 'fast',
    '-t', opts.duration,
    '-b:v', settings.bitrate,
    '-maxrate', settings.bitrate,
    '-bufsize', settings.bufsize,
    '-vf', settings.scale,
    '-threads', '0',
    '-c:a', 'aac',
    '-filter_complex', `afade=t=out:st=${opts.duration - 2}:d=2`,
    '-bsf:a', 'aac_adtstoasc',
    outfile
  ]
  console.log(`Converting timeline to mp4 ..`)
  console.log('Args:', args.join(' '))

  return runCommand(cmd, args)
  .then((result) => ({ outfile, result }))
}

function convertToTs (infile) {
  const outfile = `/tmp/${Uuid.v1()}.ts`
  const cmd = 'ffmpeg'
  const args = [
    '-i', infile,
    '-map', '0:0',
    '-c', 'copy',
    '-bsf:v', 'h264_mp4toannexb',
    '-f', 'mpegts',
    outfile
  ]

  return runCommand(cmd, args)
  .then((result) => {
    const info = parseResult(result)
    return { outfile, info }
  })
}

function runCommand (cmd, args) {
  return new P((resolve) => {
    const c = Spawn(cmd, Array.isArray(args) ? args : [args])

    let buffer = ''
    c.stdout.on('data', (data) => {
      buffer += data.toString()
    })
    c.stderr.on('data', (data) => {
      buffer += data.toString()
    })
    c.on('close', (code) => {
      // console.log(buffer)
      resolve(buffer)
    })
  })
}

function parseResult (result) {
  const info = {
    time: (/time=\s*(\d+:\d+:\d+\.\d+) /.exec(result))[1],
    frames: parseInt((/frame=\s*(\d+) /.exec(result))[1], 10),
    // file: (/Output #\d+, .*?'(.*?)':/.exec(result))[1],
    sec: 0
  }
  const [hour, min, sec, ms] = info.time.split(/[:\.]/)
  info.sec += parseInt(hour, 10) * 60 * 60
  info.sec += parseInt(min, 10) * 60
  info.sec += parseInt(sec, 10)
  info.sec = parseFloat(`${info.sec}.${ms}`)

  console.log('Info:', info)
  return info
}
