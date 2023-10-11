# homebridge-RedAlertViaKumta

This plugin is set as a motion sensor that turns on when there is an alarm in the configured city from ```KumtaAlertsChannel``` telegram channel (it's default but you can configure different channel).
With the sensor you could make automations to suit your needs


### Plug In Installation

Option 1:
(Prefferd way): 

Via HomeBridge Plugins screen, search by `Kumta`

Option 2: 
Manually: 

Run the command: ```npm install -g homebridge-red-alert-via-kumta``` 

* Docker   - (In case HB is running using docker, this command must be run inside the docker, e.g. ```docker exec -it _container_id_ bash``` and then run the command. 


### Telegram Installation

Prerequisites:

Telegram account WITHOUT 2FA.

To be subscribed to Kumta Telegram Channel using your telegram account: ```https://t.me/CumtaAlertsChannel```


1. Get telegram api_id and api_hash `https://core.telegram.org/api/obtaining_api_id`
2. Update your configuration in homebridge plugin configuration
3. Save and restart homebridge
4. Using your mobile telegram application, scan the QR code shows in homebridge logs window to add addtional device.

* 2FA authetication is not supported at this stage. please disable 2fa on your telegram account (or get temporary 2nd telegram account)
  
### Configuration

See the sample-config.file to see an example of working accessory. Following, all available options are explained:

 * ```name``` Accessory name.
 * ```city``` The name of the city (exactly as it says in the pikud horef's site).
 * ```tg_api_id``` Telegram client api id (see 3 from installation).
 * ```tg_api_hash``` Telegram client api hash (see 3 from installation).
 * ```tg_listen_channel``` Telegram channel name or id your should be subscribed to this channel (default is ```CumtaAlertsChannel```).
