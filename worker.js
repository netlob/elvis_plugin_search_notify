
console.log('Loaded service worker!');

self.addEventListener('push', ev => {
    const data = ev.data.json();
    if (data.hits.length == 0) return
    let id_list = data.hits.map(hit => hit.id).join(" OR ");
    let url = data.hits[0].originalUrl
    url = url.slice(0, url.indexOf("/file/")) + `/app/#/search/${encodeURI(id_list)}/relevance,created-desc/?enableAssetsOfCollections=true&showAssetsOfSubfolders=true`
    console.log('Got push', data);
    self.registration.showNotification(`${data.hits.length} new ${data.hits.length == 1 ? 'hit' : 'hits'} on ${data.search}!`, {
        body: data.hits.map(hit => hit.name).join(", "),
        data: { url: url },
        icon: data.hits.length ? data.hits[0].thumbnailUrl : "https://valke.net/media/images/stories/WoodWing/Elvis-DAM-Logo-2015_512.png"
    });
});

self.addEventListener('notificationclick', function (event) {
    clients.openWindow(event.notification.data.url);
}, false);