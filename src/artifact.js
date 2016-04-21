import https from 'https'

export default class Artifact {
  static MAVEN_URL = 'https://search.maven.org/solrsearch/select?rows=20&wt=json&q='

  static find (name) {
    return new Promise ((resolve, reject) => {
      https.get(Artifact.MAVEN_URL + name, res => {
        let body = ''

        res.on('data', chunk => {
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
    }).then(JSON.parse)
      .then(res => res.response.docs)
  }

  static findExactMatch (name) {
    return Artifact.find(name)
      .then(arts => {
        return arts.filter(art => art.a === name)[0]
      })
  }

  static getLatestVersion (arts) {
    return new Promise((resolve, reject) => {
      Promise.all(arts.map(art => Artifact.findExactMatch(art.name)))
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
}
