export class Config {
    /* 
    * When using this on a not localhost machine, OR when you changed the  ,make sure to update the "pluginServerUrl" in index.html at line 16.
    * 
    * /



    /**
     * Elvis server url.
     */
    static elvisUrl: string = process.env.IR_ELVIS_URL || 'http://localhost:8080';

    /**
     * HTTP Port where the app runs.
     */
    static httpPort: string = process.env.IR_HTTP_PORT || '433';


    /**
     * Slack webhook url.
     */
    static slackWebhook: string = process.env.SLACK_WEBHOOK || 'https://hooks.slack.com/services/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';


    /**
     * NOT REQUIRED ANYMORE
     * Web push keys
     * If you dont know what these are, leave them like this.
     * If you do know what these are and how to generate them, make sure to update the public key accordingly in the index.html file!
     */
    static publicVapidKey = process.env.PUBLIC_VAPID_KEY || 'BErbSfblbOSTn12duCuc5KT1kD-J9I1fENrERlhIIYfsUNwfTL4Mgbd2BH8FqYUhBJCl0DEbds_SFjQsbrB2Qs8';
    static privateVapidKey = process.env.PRIVATE_VAPID_KEY || 'vwKrOMmmzcy2J35DJ3AxF5VK7p7HOwIvqE8FpoOWqVA';

    /**
     * CORS header. Default value is elvisUrl. You can change this value to, for example '*' to open up access to other domains than the Elvis URL. 
     * This can be useful when tou want to access the Image Recognition Server API from a non - Elvis web client webpage.
     * 
     * Note: with Elvis 6.7 or higher, it's advised to keep the setting default and access the API via the Elvis Server which adds authentication.
     * In this case you configure the cors settings in Elvis Server: https://helpcenter.woodwing.com/hc/en-us/articles/115002689986-Elvis-6-API-cross-origin
     */
    static corsHeader: string = process.env.IR_CORS_HEADER || Config.elvisUrl;

    /**
     * Elvis username. 
     * 
     * Permission configuration:
     * - This user should be licensed as an API user.
     * - Ensure that the user can access the preview of all images imported in Elvis.
     */
    static elvisUsername: string = process.env.IR_ELVIS_USER || 'importmodule';

    /**
     * Elvis password.
     */
    static elvisPassword: string = process.env.IR_ELVIS_PASSWORD || 'changemenow';
}