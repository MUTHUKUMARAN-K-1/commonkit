$ErrorActionPreference = 'Stop'
$previousFlags = $env:RUSTFLAGS
try {
  $env:RUSTFLAGS = '--cfg near'
  cargo build -p commonkit-contract --target wasm32-unknown-unknown --release --locked
  if ($LASTEXITCODE -ne 0) { throw 'Contract build failed' }
} finally { $env:RUSTFLAGS = $previousFlags }
