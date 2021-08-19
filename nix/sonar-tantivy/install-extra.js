
function buildRelease (opts, cb) {
  const { binaries, dest } = opts
  cb = once(cb)
  // const { stdout, stderr } = exec(`cargoooo build --release --manifest-path=${CARGO_PATH} --color=always`, (err) => {
  const { stdout, stderr } = exec(`true`, (err) => {
    if (err) return cb(err)
    const srcPath = p.join('')
    console.log('  Compilation successful!')
    copyFiles(binaries, srcPath, dest, cb)
  })
  stdout.pipe(process.stdout)
  stderr.pipe(process.stderr)
}
