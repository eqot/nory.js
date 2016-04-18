import argv from 'argv'
import http from 'http'

const URL_BASE = 'http://search.maven.org/solrsearch/select?rows=20&wt=json&q='

const args = argv.run()
const command = args.targets[0]
switch (command) {
  case 'search':
    searchArtifactory(args.targets[1])
}

function searchArtifactory (keyword) {
  getMetaData(keyword)
    .then(JSON.parse)
    .then(res => res.response)
    .then((data) => {
      data.docs.forEach((art) => {
        const name = getArtifactoryNameAndVersion(art)
        const matchMessage = (art.a === keyword) ? '    <--- exact match' : ''
        console.log(name + matchMessage)
      })
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
