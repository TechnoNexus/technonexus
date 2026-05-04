export class MockDataConnection {
  constructor(peerId) {
    this.peer = peerId;
    this.open = true;
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  send(data) {
    // Simulated send - in real tests we can spy on this
    this.sentData = data;
  }

  close() {
    this.open = false;
    this.trigger('close');
  }

  trigger(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }
}

export class MockPeer {
  constructor(id) {
    this.id = id;
    this.events = {};
    this.destroyed = false;
    
    // Simulate async open
    setTimeout(() => {
      this.trigger('open', id || 'mock-peer-id');
    }, 0);
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  connect(targetId) {
    const conn = new MockDataConnection(targetId);
    // Simulate async connection open
    setTimeout(() => {
      conn.trigger('open');
    }, 0);
    return conn;
  }

  destroy() {
    this.destroyed = true;
    this.trigger('close');
  }

  trigger(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }
}
