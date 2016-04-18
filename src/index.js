import argv from 'argv'

import artifactory from './artifactory'

function execute() {
  const args = argv.run()
  const [command, name] = args.targets
  switch (command) {
    case 'search':
      searchArtifactory(name)
      break

    case 'install':
      installArtifactory(name)
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
      console.log(name)
    })
}

execute()
