import http from 'http'

const URL_BASE = 'http://search.maven.org/solrsearch/select?rows=20&wt=json&q='

export default class Artifactory {
  static getInfo (keyword) {
    return Artifactory.getMetaData(keyword)
      .then(JSON.parse)
      .then(res => res.response.docs)
  }

  static getExatcMatch (keyword) {
    return Artifactory.getInfo(keyword)
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

  static getNameAndVersion (art) {
    return art.g + '.' + art.a + ':' + art.latestVersion
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
