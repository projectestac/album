#!/bin/bash

# Get current version from chrome/manifest.json using jq
v=`cat chrome/manifest.json | jq --raw-output '.version'`

# Build fname based on $v
fname=album-$v.zip

echo Generating $fname

# Zip all contents of 'chrome' and leave the file in 'dist'
cd chrome
zip -r $fname *
mkdir -p ../dist
mv $fname ../dist
cd ..
echo File $fname successfully created into /dist

