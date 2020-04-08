require('axios-debug-log')
const test = require('tape-plus')
const { SonarClient } = require('..')
const debug = require('debug')('time')

const { makeClient } = require('./util/server')
const clock = require('./util/clock')

test('commands', async t => {
  const [client1, cleanup] = await makeClient({ network: false })
  await client1.createIsland('default')
  const client2 = new SonarClient({ endpoint: client1.endpoint })

  // A client with a command
  await client1.initCommandClient({
    name: 'pinger',
    commands: {
      ping: {
        oncall (args, channel) {
          t.equal(args, 'hi from client2', 'args ok')
          channel.reply('hi from 2')
          channel.once('data', d => {
            t.equal(d.toString(), 'ping', 'ping ok')
            channel.write('pong')
          })
        }
      }
    }
  })

  const [channel, res] = await client2.callCommand('@pinger ping', 'hi from client2')
  t.equal(res, 'hi from 2', 'response ok')
  channel.write('ping')

  await pify(cb => {
    channel.once('data', d => {
      t.equal(d.toString(), 'pong', 'pong ok')
      cb()
    })
  })

  client2.close()
  await cleanup()
})

test('query and subscription commands', async t => {
  t.plan(1)
  const complete = clock()
  let timer = clock()
  const [client, cleanup] = await makeClient({ network: false })
  debug('init', timer())
  const alltimer = clock()
  timer = clock()
  await client.createIsland('default')
  debug('create island', timer())

  timer = clock()
  const sub = await client.createSubscriptionStream('foo')
  debug('create subscription', timer())

  const [promise, cb] = createPromiseCallback()

  let i = 0
  let subtimer = clock()
  sub.on('data', record => {
    i++
    debug('sub', i, subtimer())
    subtimer = clock()
    if (record.value && record.value.title === 'hello') {
      debug('title correct on record', i)
      t.pass('record arrived in subscription stream')
      cb()
    }
  })

  timer = clock()
  await client.put({ schema: 'foo', value: { title: 'hello' } })
  debug('put took', timer())
  timer = clock()
  await promise
  debug('sub took', timer())
  debug('all inner', alltimer())

  timer = clock()
  await cleanup()
  debug('cleanup took', timer())
  debug('total', complete())
})

function createPromiseCallback () {
  let cb
  const promise = new Promise((resolve, reject) => {
    cb = function (err, ...args) {
      if (err) return reject(err)
      if (!args.args) args = undefined
      else if (args.length === 1) args = args[0]
      resolve(args)
    }
  })
  return [promise, cb]
}

function pify (fn) {
  return new Promise((resolve, reject) => {
    function cb (err, ...res) {
      if (err) return reject(err)
      if (!res.length) res = undefined
      else if (res.length === 1) res = res[0]
      resolve(res)
    }
    fn(cb)
  })
}
