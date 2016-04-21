import argv from 'argv'
import Table from 'cli-table'
import colors from 'colors'

import artifact from './artifact'
import gradle from './gradle'

const DEFAULT_STYLE = { head: ['cyan'] }

export default function execute() {
  const args = argv.run()
  const [command, name] = args.targets
  switch (command) {
    case 's':
    case 'search':
      searchArtifact(name)
      break

    case 'i':
    case 'install':
      installArtifact(name)
      break

    case 'c':
    case 'check':
      checkArtifact()
      break

    case 'u':
    case 'update':
      updateArtifact()
      break
  }
}

function searchArtifact (name) {
  artifact.find(name)
    .then(arts => {
      let table = new Table({
        head: ['groupId', 'artifactId', 'version', 'match'],
        style: DEFAULT_STYLE
      })

      arts.forEach(art => {
        const matchFlag = (art.a === name) ? '\u2713'.green : ''
        table.push(
          [art.g, art.a, art.latestVersion, matchFlag]
        )
      })

      console.log(table.toString())
    })
}

function installArtifact (name) {
  artifact.findExactMatch(name)
    .then(gradle.injectArtifact)
}

function checkArtifact () {
  gradle.getArtifacts()
    .then(currentArtifacts => {
      artifact.getLatestVersion(currentArtifacts)
        .then(latestArtifacts => {
          gradle.compareArtifacts(currentArtifacts, latestArtifacts)
        })
    })
}

function updateArtifact () {
  gradle.getArtifacts()
    .then(currentArtifacts => {
      artifact.getLatestVersion(currentArtifacts)
        .then(latestArtifacts => {
          gradle.updateArtifacts(currentArtifacts, latestArtifacts)
        })
    })
}
