const tape = require('tape')
const tmp = require('temporary-directory')
const { runAll } = require('./lib/util')

const { IslandStore } = require('..')

function createStore (opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  tmp('sonar-test', ondircreated)
  function ondircreated (err, dir, cleanupTempdir) {
    if (err) return cb(err)
    const islands = new IslandStore(dir, opts)
    islands.ready(err => {
      if (err) return cb(err)
      cb(null, islands, cleanup)
    })
    function cleanup (cb) {
      islands.close(() => {
        cleanupTempdir(err => {
          cb(err)
        })
      })
    }
  }
}

tape('open close', t => {
  createStore({ network: false }, (err, islands, cleanup) => {
    t.true(islands.opened, 'opened property is set')
    t.error(err)
    cleanup(err => {
      t.error(err)
      t.end()
    })
  })
})

tape('batch and query', t => {
  createStore({ network: false }, (err, islands, cleanup) => {
    t.error(err, 'tempdir ok')
    islands.create('first', (err, island) => {
      t.error(err, 'island created')

      const records = [
        { title: 'Hello world', body: 'so rough' },
        { title: 'Hello moon', body: 'so dark' }
      ]

      runAll([
        next => {
          const batch = records.map(value => ({ op: 'put', schema: 'doc', value }))
          island.batch(batch, (err, res) => {
            t.error(err, 'batch ok')
            t.equal(res.length, 2)
            next()
          })
        },
        next => {
          island.query('search', 'hello', { waitForSync: true }, (err, res) => {
            t.error(err)
            t.equal(res.length, 2, 'hello search')
            const titles = res.map(r => r.value.title).sort()
            t.deepEqual(titles, ['Hello moon', 'Hello world'], 'hello results ok')
            next(err)
          })
        },
        next => {
          island.query('search', 'moon', (err, res) => {
            t.error(err)
            t.equal(res.length, 1, 'moon search')
            const titles = res.map(r => r.value.title).sort()
            t.deepEqual(titles, ['Hello moon'], 'moon results ok')
            next()
          })
        },
        next => {
          island.query('records', { schema: 'doc' }, (err, res) => {
            t.error(err)
            t.equal(res.length, 2)
            next()
          })
        },
        next => cleanup(next)
      ]).catch(err => t.fail(err)).then(() => t.end())
    })
  })
})
tape('put, get and delete', t => {
  createStore({ network: false }, (err, islands, cleanup) => {
    t.error(err, 'tempdir ok')
    islands.create('default', (err, island) => {
      t.error(err)
      island.put({ schema: 'foo', value: { title: 'hello' } }, (err, id) => {
        t.error(err)
        island.get({ id }, { waitForSync: true }, (err, records) => {
          t.error(err)
          t.equal(records.length, 1)
          t.equal(records[0].value.title, 'hello')
          island.del({ id: id, schema: 'foo' }, (err) => {
            t.error(err, 'deleted record')
            island.get({ id }, { waitForSync: true }, (err, records) => {
              t.error(err)
              // TODO: check that record doesn't exist anymore after del is implemented
              // console.log(records)
              // t.equal(records.length, 0, 'record not found anymore')
              cleanup(() => t.end())
            })
          })
        })
      })
    })
  })
})

tape('share and unshare islands', t => {
  createStore({ network: true }, (err, islands, cleanup) => {
    t.error(err, 'tempdir ok')
    islands.create('island', (err, island) => {
      t.error(err, 'island created')
      const hkey = island.key.toString('hex')
      const config = islands.getIslandConfig(hkey)
      t.true(config, 'island config exists')
      t.true(config.share, 'island config init shared')
      const status = islands.network.islandStatus(island)
      t.equal(status.shared, true, 'island network init shared')
      islands.updateIsland(hkey, { share: false }, (err) => {
        t.error(err, 'no error at update')
        const config = islands.getIslandConfig(hkey)
        t.equal(config.share, false, 'island updated config not shared')
        const status = islands.network.islandStatus(island)
        t.equal(status.shared, false, 'island updated network not shared')
        cleanup(err => {
          t.error(err)
          t.end()
        })
      })
    })
  })
})

tape('close island', t => {
  createStore({ network: false }, (err, islands, cleanup) => {
    t.error(err, 'tempdir ok')
    islands.create('island', (err, island) => {
      t.error(err, 'island created')
      t.true(island.opened, 'opened property set')
      island.close(err => {
        t.error(err, 'island closed')
        t.true(island.closed, 'closed property set')
        cleanup(err => {
          t.error(err)
          t.end()
        })
      })
    })
  })
})

tape('create island with same name', t => {
  createStore({ network: false }, (err, islands, cleanup) => {
    t.error(err)
    runAll([
      next => {
        islands.create('first', (err, island) => {
          t.error(err, 'no error for first island')
          next()
        })
      },
      next => {
        islands.create('first', (err, island) => {
          t.ok(err, 'error with same name')
          t.equal(err.message, 'island exists', 'correct error message')
          next()
        })
      },
      next => cleanup(next),
      next => t.end()
    ])
  })
})

tape('query empty island', t => {
  createStore({ network: false }, (err, islands, cleanup) => {
    t.error(err)
    islands.create('island', (err, island) => {
      t.error(err)
      island.query('search', 'anything', { waitForSync: true }, (err, res) => {
        t.error(err, 'query on empty island')
        t.deepEquals(res, [], 'empty result')
        cleanup(err => {
          t.error(err)
          t.end()
        })
      })
    })
  })
})

tape('put and delete schema', t => {
  const schema = {
    properties: {},
    type: 'object',
    $id: 'core/testor',
    name: 'core/testor'
  }
  createStore({ network: false }, (err, islands, cleanup) => {
    t.error(err)
    islands.create('island', (err, island) => {
      t.error(err)
      island.getSchemas((err, schemas) => {
        t.error(err)
        t.false('core/testor' in schemas, 'test schema not in schemas now')
        island.putSchema('core/testor', schema, (err) => {
          t.error(err, 'put test schema')
          island.getSchema('core/testor', (err, schema) => {
            t.error(err)
            t.ok(schema, 'test schema in schemas now')
            island.deleteSchema('core/testor', (err) => {
              t.error(err, 'delete schema')
              island.getSchemas((err, schemas) => {
                t.error(err)
                t.false('core/testor' in schemas, 'test schema not in schemas anymore')
                cleanup(err => {
                  t.error(err)
                  t.end()
                })
              })
            })
          })
        })
      })
    })
  })
})

tape('delete non-existing schema', t => {
  createStore({ network: false }, (err, islands, cleanup) => {
    t.error(err)
    islands.create('island', (err, island) => {
      t.error(err)
      island.deleteSchema('nonexistent', (err) => {
        t.ok(err, 'deletion not possible')
        cleanup(err => {
          t.error(err)
          t.end()
        })
      })
    })
  })
})
