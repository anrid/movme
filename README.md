# movme
A simple video renderer based on ffmpeg v3.x.

## Usage

```bash
# Expects the following envs to be set:
#
# $BASELINE_AWS_BUCKET    Your S3 bucket
# $BASELINE_AWS_REGION    Your S3 region (e.g. ap-southeast-1)
# $BASELINE_AWS_KEY       An AWS key
# $BASELINE_AWS_SECRET    An AWS secret

# Prints usage.
$ node lib/render.js

  Usage:
  node renderer.js <video clip 1> <video clip 2> <...>

  Will upload the new movie to Amazon S3:
  Region: ap-southeast-1
  Bucket: fina.io
  URL:    https://s3-ap-southeast-1.amazonaws.com/fina.io/videos/00000000-aaaa-bbbb-cccc-xxxxyyyyzzzz.mp4
```

```bash
# Creates a movie from 3 video clips on in ~/Downloads.
$ node lib/render.js ~/Downloads/klipp1.mp4 ~/Downloads/klipp2.mp4 ~/Downloads/klipp3.mp4

Processing files:
[ '/Users/anrid/Downloads/klipp1.mp4',
  '/Users/anrid/Downloads/klipp2.mp4',
  '/Users/anrid/Downloads/klipp3.mp4' ]
Timeline:
Info: { time: '00:00:05.43', frames: 166, sec: 5.43 }
#0 /tmp/6788ef10-69a0-11e6-87fc-fb6f9a48f528.ts
Info: { time: '00:00:05.60', frames: 171, sec: 5.6 }
#1 /tmp/67930130-69a0-11e6-87fc-fb6f9a48f528.ts
Info: { time: '00:00:08.87', frames: 269, sec: 8.87 }
#2 /tmp/679c9e20-69a0-11e6-87fc-fb6f9a48f528.ts
Total timeline duration: 19.9
Converting timeline to mp4 ..
Created /tmp/67a4b470-69a0-11e6-87fc-fb6f9a48f528.mp4 in 19.64 seconds.
Uploading -> fina.io:videos/67a4b470-69a0-11e6-87fc-fb6f9a48f528.mp4
Waiting for 1 last uploads to complete ..
It’s a Done Deal.
```
