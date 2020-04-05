import request = require('request');
import express = require('express');
import http = require('https');
import fs = require('fs');
import { Application } from 'express';
import bodyParser = require('body-parser');
import { Config } from './config';
import { ElvisApi } from './elvis-api/api';
import { ApiManager } from './elvis-api/api-manager';
// import webpush = require('web-push');

// webpush.setVapidDetails('mailto:sjoerdabolten@gamil.com', Config.publicVapidKey, Config.privateVapidKey);

// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/demo.netlob.dev/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/demo.netlob.dev/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/demo.netlob.dev/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};


class Server {
    private static instance: Server;

    public static getInstance(): Server {
        return this.instance || (this.instance = new this());
    }

    private app: Application;
    private httpApp: Application;
    private apiManager: ElvisApi = ApiManager.getApi();

    private constructor() {
        this.httpApp = express();
        this.app = this.httpApp;
    }

    public start(): void {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(this.allowCrossDomain);
        this.app.use(express.static(__dirname, { dotfiles: 'allow' }));

        http.createServer(credentials, this.httpApp).listen(Config.httpPort, () => {
            this.logStartupMessage('HTTP Server started at port: ' + Config.httpPort);
        });

        this.app.post('/subscribe', async (req, res) => {
            // if (!(req.body.subscription && req.body.search && req.body.userprofile)) return res.status(422).json({});
            if (!(req.body.search && req.body.userprofile)) return res.status(422).json({});


            delete req.body.userprofile.authorities;

            const current = JSON.parse(fs.readFileSync("subscriptions.json", "utf8"));
            let sub = {
                // subscription: req.body.subscription,
                searches: [req.body.search],
                old_hits: [],
                new_hits: {
                    [req.body.search]: []
                },
                userprofile: req.body.userprofile
            }

            current.push(sub);
            fs.writeFileSync("subscriptions.json", JSON.stringify(current));
            this.checkQueries(req.body.userprofile.username, false);
            res.status(201).json(sub);
        });

        this.app.get('/list/:username', async (req, res) => {
            req = req;
            const current = JSON.parse(fs.readFileSync("subscriptions.json", "utf8"));
            const subscription = current.find(sub => sub.userprofile.username == req.params.username)
            if (!subscription) return res.status(200).json(false);
            for (let i in subscription.searches) {
                const search = subscription.searches[i];
                const res = await this.apiManager.searchGet(search);
                let hits = [];
                res.hits.forEach(hit => {
                    if (subscription.old_hits.includes(hit.id)) return;
                    else hits.push(hit);
                });
                subscription.old_hits = subscription.old_hits.concat(hits.map(hit => hit.id));
                if (hits.length && subscription.new_hits[search]) subscription.new_hits[search] = subscription.new_hits[search].concat(hits.map(hit => hit.id));
            }
            res.status(200).json(subscription || false);
        })

        this.app.put('/list/:username', async (req, res) => {
            if (!req.body.search) return res.status(422).json(false);

            const current = JSON.parse(fs.readFileSync("subscriptions.json", "utf8"));
            const index = current.findIndex(sub => sub.userprofile.username == req.params.username);

            if (!current[index].searches.includes(req.body.search)) current[index].searches.push(req.body.search), current[index].new_hits[req.body.search] = [];

            res.status(201).json(current[index]);

            fs.writeFileSync("subscriptions.json", JSON.stringify(current));
            this.checkQueries(req.params.username, false);
        })

        this.app.delete('/list/:username', async (req, res) => {
            if (!req.body.search) return res.status(422).json(false);

            const current = JSON.parse(fs.readFileSync("subscriptions.json", "utf8"));
            const index = current.findIndex(sub => sub.userprofile.username == req.params.username);

            if (current[index].searches.includes(req.body.search)) current[index].searches = current[index].searches.filter(search => search != req.body.search);

            res.status(201).json(current[index]);

            fs.writeFileSync("subscriptions.json", JSON.stringify(current));
            this.checkQueries(req.params.username, false);
        })

        this.app.post('/list/:username', async (req, res) => {
            if (!req.body.search) return res.status(422).json(false);

            const current = JSON.parse(fs.readFileSync("subscriptions.json", "utf8"));
            const index = current.findIndex(sub => sub.userprofile.username == req.params.username);

            if (current[index].searches.includes(req.body.search)) current[index].new_hits[req.body.search] = [];

            res.status(201).json(current[index]);

            fs.writeFileSync("subscriptions.json", JSON.stringify(current));
            this.checkQueries(req.params.username, false);
        })


        this.checkQueries("all-usernames", true);
    }

    private logStartupMessage(serverMsg: string): void {
        console.info('Running NodeJS ' + process.version + ' on ' + process.platform + ' (' + process.arch + ')');
        console.info(serverMsg);
    }

    private allowCrossDomain = (req, res, next) => {
        req = req;

        res.header('Access-Control-Allow-Origin', Config.corsHeader);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept');

        next();
    }


    private async checkQueries(username, push) {
        const subscriptions = JSON.parse(fs.readFileSync("subscriptions.json", "utf8"));
        for (let index in subscriptions) {
            const subscription = subscriptions[index];
            if (username == "all-usernames" || subscription.userprofile.username == username) {
                for (let i in subscription.searches) {
                    const search = subscription.searches[i];
                    if (!subscriptions[index].new_hits[search]) subscriptions[index].new_hits[search] = [];
                    const res = await this.apiManager.searchGet(search);
                    let hits = [];
                    res.hits.forEach(hit => {
                        hit.name = hit.metadata.name;
                        // delete hit.metadata;
                        if (subscription.old_hits.includes(hit.id)) return;
                        else hits.push(hit);
                    });
                    subscriptions[index].old_hits = subscriptions[index].old_hits.concat(hits.map(hit => hit.id));
                    if (hits.length) {
                        subscriptions[index].new_hits[search] = subscriptions[index].new_hits[search].concat(hits.map(hit => hit.id));
                        // if (push) webpush.sendNotification(subscription.subscription, JSON.stringify({ hits: hits, search: search })).catch(error => {
                        //     console.error(error.stack);
                        // });
                        if (push) this.sendSlack({ hits: hits, search: search })
                    }
                }
            }
        };
        fs.writeFileSync("subscriptions.json", JSON.stringify(subscriptions));
    }

    private sendSlack(payload) {
        if (payload.hits.length == 0) return
        let id_list = payload.hits.map(hit => hit.id).join(" OR ");

        const generateUrl = q => {
            let url = payload.hits[0].originalUrl
            url = url.slice(0, url.indexOf("/file/")) + `/app/#/search/${encodeURI(q)}/relevance,created-desc/?enableAssetsOfCollections=true&showAssetsOfSubfolders=true`
            return url;
        }

        let postData = `
                {
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "There are *${payload.hits.length}* new results for _${payload.search}_"
                            }
                        },
                        {
                            "type": "divider"
                        },
                        ${
            payload.hits.map(hit => {
                return `
                                                {
                                                    "type": "section",
                                                    "text": {
                                                        "type": "mrkdwn",
                                                        "text": "*${hit.name}*\nModified: ${hit.metadata.assetModified.formatted}\nTags: ${hit.metadata.tags.toString()}"
                                                    },
                                                    "accessory": {
                                                        "type": "button",
                                                        "text": {
                                                            "type": "plain_text",
                                                            "emoji": true,
                                                            "text": "View"
                                                        },
                                                        "url": "${generateUrl(hit.id)}"
                                                    }
                                                }`
            }).join(",") + ","
            }
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "*<${generateUrl(id_list)}|Show new results for ${payload.search}>*"
                            }
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "*<${generateUrl('flowers')}|Show all results for ${payload.search}>*"
                            }
                        }
                    ]
                }
          `;

        const options = {
            'method': 'POST',
            'url': Config.slackWebhook,
            'headers': {
                'Content-type': 'application/json'
            },
            body: postData
        };

        request(options, error => {
            if (error) throw new Error(error);
        });
    }

    public startInterval(interval) {
        setInterval(() => this.checkQueries("all-usernames", true), interval * 1000);
    }
}


let server: Server = Server.getInstance();
server.start();
server.startInterval(10); // in seconds