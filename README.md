# elvis_plugin_search_notify

## Installation
The server can either be installed on the Elvis Server or on a separate machine.

- Clone or download this package.
- Place it inside the `plugins/active` folder
- Open src/config.ts and configure the settings. You can either configure the settings in this config file or by setting environment variables.
- Install nodejs (6.9 or higher).
- Open a terminal and go to the package folder.
- Install TypeScript via npm: npm install -g typescript
- Install node modules: npm install
- Start the server: npm start
- The server is correctly started when a startup message is showed.
- Scan your elvis for new plugins
 - Go to the elvis management console
 - Go to panel plugins
 - Click "Scan Elvis for plugins"
![Example](https://media.discordapp.net/attachments/588451250123833382/694874223822504026/unknown.png)

## Panel config
In order to use the notifications, make sure you are using Evlis on Chrome. Open the search notify panel, and fill in a search term which you would like to be notified about. Click on the + button (maybe twice is nothing happens). A dialog on the topleft of your screen should pop-up asking if you allow this site to push notifications. Click "allow". From now, everything should work.

The list of search terms is linked to your username, and currently only 1 logged-in browser is support at a time per user.
