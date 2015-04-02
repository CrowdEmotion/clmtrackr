
PWD=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

echo $DIR

osascript <<EOF
tell app "Terminal"
  do script "cd $PWD; python -m SimpleHTTPServer"
end tell
EOF

echo TEST
sleep 1
open http://localhost:8000/examples/clm_emotiondetection_local.html


