import argv from 'argv'
import http from 'http'

const URL_BASE = 'http://search.maven.org/solrsearch/select?rows=20&wt=json&q='

function execute() {
  const args = argv.run()
  const [command, name] = args.targets
  switch (command) {
    case 'search':
      searchArtifactory(name)
      break;

    case 'install':
      installArtifactory(name)
      break;
  }
}

function searchArtifactory (keyword) {
  getArtifactoryInfo(keyword)
    .then(arts => {
      arts.forEach(art => {
        const name = getArtifactoryNameAndVersion(art)
        const matchMessage = (art.a === keyword) ? '    <--- exact match' : ''
        console.log(name + matchMessage)
      })
    })
}

function installArtifactory (keyword) {
  getExatcMatchArtifactory(keyword)
    .then(art => {
      const name = getArtifactoryNameAndVersion(art)
      console.log(name)
    })
}

function getArtifactoryInfo (keyword) {
  return getMetaData(keyword)
    .then(JSON.parse)
    .then(res => res.response.docs)
}

function getExatcMatchArtifactory (keyword) {
  return getArtifactoryInfo(keyword)
    .then(arts => {
      let result = null
      arts.forEach(art => {
        if (art.a === keyword) {
          result = art
        }
      })

      return result
    })
}

function getArtifactoryNameAndVersion (art) {
  return art.g + '.' + art.a + ':' + art.latestVersion
}

function getMetaData (keyword) {
  return new Promise ((resolve, reject) => {
    http.get(URL_BASE + keyword, (res) => {
      let body = ''

      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        if (body.length > 0) {
          resolve(body)
        } else {
          reject()
        }
      })
    }).on('error', reject)
  })
}

execute()
