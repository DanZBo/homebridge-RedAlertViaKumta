# homebridge-RedAlertViaKumta

This plugin is set as a motion sensor that turns on when there is an alarm in the configured city from ```CumtaAlertsChannel``` telegram channel (it's default but you can configure different channel).
With the sensor you could make automations to suit your needs


### Installation

1. Install homebridge using: ```npm install -g homebridge```
2. Install this plugin using: ```npm install -g homebridge-red-alert-via-kumta``` or sudo npm install -g git+https://github.com/DanZBo/homebridge-RedAlertViaKumta.git
3. Get telegram api_id and api_hash https://core.telegram.org/api/obtaining_api_id
4. Update your configuration file. See sample-config.json in this repository for a sample.
5. Login in your telegram account by QR code from logs (not support account this 2fa for now)

You can also install this straight from the homebridge web ui.
In the plugins tab, search for redalert.

### Configuration

See the sample-config.file to see an example of working accessory. Following, all available options are explained:

 * ```name``` Accessory name.
 * ```city``` The name of the city (exactly as it says in the pikud horef's site).
 * ```tg_api_id``` Telegram client api id (see 3 from installation).
 * ```tg_api_hash``` Telegram client api hash (see 3 from installation).
 * ```tg_listen_channel``` Telegram channel name or id your should be subscribed to this channel (default is ```CumtaAlertsChannel```).
