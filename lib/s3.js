'use strict'

const AWS = require('aws-sdk')
const P = require('bluebird')
const Fs = require('fs')
const Path = require('path')
const Hoek = require('hoek')
const Boom = require('boom')
const T = require('tcomb')
const Mimer = require('mimer')

Hoek.assert(process.env.BASELINE_AWS_BUCKET, 'Missing env `BASELINE_AWS_BUCKET`')
Hoek.assert(process.env.BASELINE_AWS_REGION, 'Missing env `BASELINE_AWS_REGION`')
Hoek.assert(process.env.BASELINE_AWS_KEY, 'Missing env `BASELINE_AWS_KEY`')
Hoek.assert(process.env.BASELINE_AWS_SECRET, 'Missing env `BASELINE_AWS_SECRET`')

AWS.config.region = process.env.BASELINE_AWS_REGION

const S3 = new AWS.S3({
  accessKeyId: process.env.BASELINE_AWS_KEY,
  secretAccessKey: process.env.BASELINE_AWS_SECRET
})
P.promisifyAll(S3)

// S3 uploader.
const s3Uploader = P.coroutine(function * _co (items) {
  let promises = []
  for (const item of items) {
    promises.push(uploadItem(item))
    if (promises.length >= 5) {
      // Wait a bit.
      yield P.all(promises)
      promises = []
    }
  }

  if (promises.length) {
    // Wait for any remaining promises to fulfill.
    console.log(`Waiting for ${promises.length} last uploads to complete ..`)
    yield P.all(promises)
  }
  return 'OK'
})

function uploadItem (item) {
  return P.try(() => {
    T.String(item.bucket)
    T.String(item.key)
    T.String(item.path)

    const params = {
      Bucket: item.bucket,
      Key: item.key,
      Body: Fs.createReadStream(item.path),
      StorageClass: 'REDUCED_REDUNDANCY',
      ACL: 'public-read',
      ContentType: Mimer(item.key)
    }
    console.log(`Uploading -> ${params.Bucket}:${params.Key}`)
    return S3.uploadAsync(params)
  })
}

function uploadFiles (files) {
  const items = files.map((file) => {
    const stats = Fs.statSync(file)
    if (!stats.size) {
      throw Boom.notFound('File is empty: ' + file)
    }
    return createItem(file, stats.size, 'videos')
  })
  return s3Uploader(items)
}

function createItem (file, size, prefix) {
  return {
    bucket: process.env.BASELINE_AWS_BUCKET,
    key: `${prefix}/${Path.basename(file)}`,
    path: file,
    size
  }
}

module.exports = {
  uploadFiles
}
