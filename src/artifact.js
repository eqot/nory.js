import http from 'http'

const URL_BASE = 'http://search.maven.org/solrsearch/select?rows=20&wt=json&q='

export default class Artifact {
  static getInfo (keyword) {
    return Artifact.getMetaData(keyword)
      .then(JSON.parse)
      .then(res => res.response.docs)
  }

  static getExatcMatch (keyword) {
    return Artifact.getInfo(keyword)
      .then(arts => {
        for (let i = 0; i < arts.length; i++) {
          if (arts[i].a === keyword) {
            return arts[i]
          }
        }

        return null
      })
  }

  static getNameAndVersion (art) {
    return art.g + ':' + art.a + ':' + art.latestVersion
  }

  static getLatestVersion (arts) {
    return new Promise((resolve, reject) => {
      Artifact.getLatestVersionInArray(arts)
        .then(latestArtifacts => {
          let result = {}
          latestArtifacts.forEach(art => {
            if (art) {
              result[art.a] = art
            }
          })

          resolve(result)
        })
    })
  }

  static getLatestVersionInArray (arts) {
    return Promise.all(arts.map(art => Artifact.getExatcMatch(art.name)))
  }

  static getMetaData (keyword) {
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
}
