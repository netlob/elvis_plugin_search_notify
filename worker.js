
console.log('Loaded service worker!');

self.addEventListener('push', ev => {
    const data = ev.data.json();
    console.log('Got push', data);
    self.registration.showNotification(`${data.hits.length} new ${data.hits.length == 1 ? 'hit' : 'hits'} on ${data.search}!`, {
        body: data.hits.map(hit => hit.name).join(", "),
        icon: data.hits.length ? data.hits[0].thumbnailUrl : "https://valke.net/media/images/stories/WoodWing/Elvis-DAM-Logo-2015_512.png"
    });
});