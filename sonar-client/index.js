const axios = require('axios')

class SonarClient {
  constructor (baseUrl, islandKey) {
    this.baseUrl = baseUrl
    this.islandKey = islandKey
  }

  create (name) {
    return this._call('PUT', '/_create/' + name)
  }

  getSchema (schemaName) {
    if (this.schema && schemaName === undefined) {
      schemaName = this.schema
    }
    return this._call('GET', '/' + this.islandKey + '/' + schemaName + '/_schema')
  }

  putSchema (schemaName, schema) {
    if (this.schema && schemaName && schema === undefined) {
      schema = schemaName
    }
    return this._call('PUT', '/' + this.islandKey + '/' + this.schema + '/_schema')
  }

  get (schema, id) {
    if (this.schema && id === undefined) {
      id = schema
      schema = this.schema
    }
    return this._call('GET', '/' + this.islandKey + '/' + schema + '/' + id)
  }

  put (record) {
    const { schema, id, value } = record
    if (id) {
      return this._call('PUT', '/' + this.islandKey + '/' + schema + '/' + id, value)
    } else {
      return this._call('POST', '/' + this.islandKey + '/' + schema, value)
    }
  }

  search (query) {
    if (typeof query === 'string') {
      query = JSON.stringify(query)
    } else if (query instanceof QueryBuilder) {
      query = query.getQuery()
    }
    return this._call('POST', '/' + this.islandKey + '/_search', query)
  }

  async _call (method, url, data) {
    if (data === undefined) data = {}
    const fullUrl = this.baseUrl + url
    const result = await axios({
      method,
      url: fullUrl,
      data,
      headers: { 'Content-Type': 'application/json' }
    })
    return result.data
  }
}

class QueryBuilder {
  constructor (schema) {
    this.schema = schema
    // FIXME: This should not be necessary
    this.query = {
      query: {
        bool : {
          must: [],
          must_not: []
        }
      }
    }
  }

  bool (boolType, queries) {
    this.query['query']['bool'][boolType] = queries
    return this
  }

  limit (limit) {
    this.query['limit'] = limit
    return this
  }

  term (field, value) {
    return {term: { [field]: value }}
  }

  getQuery () {
    return this.query
  }
  //get query () {
    //return this.query
  //}

  //set query (value) {
    //this.query = value
  //}

}

module.exports = {
  SonarClient,
  QueryBuilder
}
