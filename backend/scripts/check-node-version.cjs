'use strict'

var minimumMajorVersion = 22
var currentMajorVersion = Number(process.versions.node.split('.')[0])

if (currentMajorVersion >= minimumMajorVersion) {
  process.exit(0)
}

console.error('Error: GitLab MR Board requiere Node.js 22 o superior.')
console.error('Versión detectada: Node.js ' + process.versions.node + '.')
console.error('Actualizá Node.js, abrí una terminal nueva y ejecutá nuevamente npm install y npm run dev.')
process.exit(1)
