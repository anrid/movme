'use strict'

const Argv = require('minimist')(process.argv.slice(2))
const Video = require('./video')

if (Argv._.length) {
  Video.create({
    files: Argv._,
    music: Argv.music,
    upload: Argv.upload
  })
} else {
  printUsage()
}

function printUsage () {
  console.log(`
  Usage:
  node render.js <video clip 1> <video clip 2> <...>

  Options:
  [--upload]                  Upload video to S3.
  [--music <music track>]     Mix in a background music track.
  `)
}
