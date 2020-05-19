const tape = require('tape')
const createServerClient = require('./util/server')

tape('sync', async t => {
  const [context, client] = await createServerClient()
  try {
    const { id } = await client.put({
      schema: 'foo',
      id: 'bar',
      value: { title: 'bar' }
    })
    await client.sync()
    const records = await client.get({ id })
    t.equal(records.length, 1)
    t.equal(records[0].id, 'bar')
  } catch (err) {
    t.fail(err)
  }
  await context.stop()
})

tape('delete record', async t => {
  const record = {
    schema: 'foo',
    id: 'bar',
    value: { title: 'bar' }
  }
  const [context, client] = await createServerClient()
  try {
    const { id } = await client.put(record)
    await client.sync()
    const records = await client.get({ id })
    t.equal(records.length, 1)
    await client.del(record)
    const nuRecords = await client.get({ id })
    // TODO: check that record doesn't exist anymore
    // console.log(nuRecords)
  } catch (err) {
    t.fail(err)
  }
  await context.stop()
})
