# movme
A simple video renderer based on ffmpeg v3.x.

## Setup

```bash
git clone git@github.com:anrid/movme.git
cd movme
npm i
brew install ffmpeg

# For uploading to S3, set the following envs;
#
# $BASELINE_AWS_BUCKET    Your S3 bucket
# $BASELINE_AWS_REGION    Your S3 region (e.g. ap-southeast-1)
# $BASELINE_AWS_KEY       An AWS key
# $BASELINE_AWS_SECRET    An AWS secret
```

## Usage

Prints usage.

```bash
node lib/render.js

  Usage:
  node render.js <video clip 1> <video clip 2> <...>

  Options:
  [--upload]                  Upload video to S3.
  [--music <music track>]     Mix in a background music track.
```

Creates a new movie from 3 video clips and a music track and uploads it to S3.

```bash
node lib/render.js \
 ~/Downloads/klipp1.mp4 \
 ~/Downloads/klipp2.mp4 \
 ~/Downloads/klipp3.mp4 \
 --upload \
 --music ~/Downloads/work.mp3

Processing files:
/Users/anrid/Downloads/klipp1.mp4
/Users/anrid/Downloads/klipp2.mp4
/Users/anrid/Downloads/klipp3.mp4
Using music track: /Users/anrid/Downloads/work.mp3
Timeline:
Info: { time: '00:00:05.43', frames: 166, sec: 5.43 }
#0 /tmp/58ae7650-6a08-11e6-9f9e-3be60ee61688.ts
Info: { time: '00:00:05.60', frames: 171, sec: 5.6 }
#1 /tmp/58b999e0-6a08-11e6-9f9e-3be60ee61688.ts
Info: { time: '00:00:08.87', frames: 269, sec: 8.87 }
#2 /tmp/58cb9b40-6a08-11e6-9f9e-3be60ee61688.ts
Total timeline duration: 19.9
Converting timeline to mp4 ..
Args: -i concat:/tmp/58ae7650-6a08-11e6-9f9e-3be60ee61688.ts|/tmp/58b999e0-6a08-11e6-9f9e-3be60ee61688.ts|/tmp/58cb9b40-6a08-11e6-9f9e-3be60ee61688.ts -i /tmp/5644a240-6a08-11e6-9f9e-3be60ee61688.aac -c:v libx264 -tune zerolatency -preset fast -t 19.9 -b:v 2070k -maxrate 2070k -bufsize 4140k -vf scale=1920:1080 -threads 0 -c:a aac -filter_complex afade=t=out:st=17.9:d=2 -bsf:a aac_adtstoasc /tmp/58d5fb80-6a08-11e6-9f9e-3be60ee61688.mp4
Created /tmp/58d5fb80-6a08-11e6-9f9e-3be60ee61688.mp4 in 20.07 seconds.
Uploading to https://s3-ap-southeast-1.amazonaws.com/fina.io/videos/58d5fb80-6a08-11e6-9f9e-3be60ee61688.mp4 ..
Waiting for 1 last uploads to complete ..
It’s a Done Deal.
```
