#!/bin/bash

# Check if jq is installed
if [ ! -f /usr/bin/jq ]; then
  echo "JSON processor 'jq' not found!"
  echo "Please install package 'jq' and try again."
  exit 1
fi

# Get current version from chrome/manifest.json using jq
v=`cat chrome/manifest.json | jq --raw-output '.version'`

# Build Chrome/Chromium version
fname=album-chrome-$v.zip

echo Generating $fname

# Zip all contents of 'chrome' and leave the file in 'dist'
cd chrome
zip -r $fname *
mkdir -p ../dist
mv $fname ../dist
cd ..

echo
echo -------------------------------------------------------------------------
echo File dist/$fname successfully created
echo -------------------------------------------------------------------------

# Build Firefox version
fname=album-firefox-$v.zip

echo Generating $fname

# Zip all contents of 'chrome' and leave the file in 'dist'
cd firefox
zip -r $fname *
mkdir -p ../dist
mv $fname ../dist
cd ..

echo
echo -------------------------------------------------------------------------
echo File dist/$fname successfully created
echo -------------------------------------------------------------------------

# Build Edge version
fname=album-edge-$v.zip

echo Generating $fname

# Zip all contents of 'edge' and leave the file in 'dist'
cd edge
zip -r $fname *
mkdir -p ../dist
mv $fname ../dist
cd ..

echo
echo -------------------------------------------------------------------------
echo File dist/$fname successfully created
echo -------------------------------------------------------------------------
