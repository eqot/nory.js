import argv from 'argv'

import artifactory from './artifactory'
import gradle from './gradle'

function execute() {
  const args = argv.run()
  const [command, name] = args.targets
  switch (command) {
    case 's':
    case 'search':
      searchArtifactory(name)
      break

    case 'i':
    case 'install':
      installArtifactory(name)
      break

    case 'u':
    case 'update':
      updateArtifactory()
      break
  }
}

function searchArtifactory (keyword) {
  artifactory.getInfo(keyword)
    .then(arts => {
      arts.forEach(art => {
        const name = artifactory.getNameAndVersion(art)
        const matchMessage = (art.a === keyword) ? '    <--- exact match' : ''
        console.log(name + matchMessage)
      })
    })
}

function installArtifactory (keyword) {
  artifactory.getExatcMatch(keyword)
    .then(art => {
      const name = artifactory.getNameAndVersion(art)
      gradle.injectArtifactory(name)
    })
}

function updateArtifactory () {
  gradle.getArtifactory()
    .then(console.log)
}

execute()
