module.exports = class RecordCache {
  constructor () {
    this.records = {}
    this._byId = {}
  }

  batch (records) {
    for (const [i, record] of records.entries()) {
      if (record.value) this.add(record)
      else {
        records[i] = this.upgrade(record)
      }
    }
    return records
  }

  add (record) {
    const cacheid = this.cacheid(record)
    this.records[cacheid] = record
    this._byId[record.id] = this._byId[record.id] || []
    this._byId[record.id].push(record)
  }

  upgrade (record) {
    const cacheid = this.cacheid(record)
    if (this.records[cacheid]) {
      return Object.assign({}, this.records[cacheid], record)
    }
    return record
  }

  cacheid (record) {
    return record.lseq
  }
}