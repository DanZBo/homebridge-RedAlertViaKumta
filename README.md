# homebridge-RedAlertViaKumta
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

This plugin is set as a motion sensor that turns on when there is an alarm in the configured city from ```KumtaAlertsChannel``` telegram channel.
With the sensor you could make automations to suit your needs

## **הוראות שימוש והגבלות: יש לקרוא בעיון חשוב מאוד.**

התוסף איננו תוסף רשמי של פיקוד העורף או מערכת הבטחון.
התוסף תלוי בתקינות מערכות צד ג כגון מערכת כומתה ואפליקציית הטלגרם ולכן יתכנו שיבושים ואו עיקובים בקבלת התרעות.
בכל מקרה יש להמשיך להשתמש במקביל לתוסף באמצעיים הרשמיים של מערכת הבטחון בישראל מכיוון שיכול להיות כשל בתוכנה.

## **Disclaimer - very important to read!**

Instructions for use and restrictions:

1. The supplement is not an official supplement of the Home Front Command or the security system in Israel.
2. The add-on depends on the integrity of third-party systems such as the beret system and the Telegram application, so there may be disruptions or delays in receiving alerts.
3. In any case, you must continue to use the official means of the security system in Israel at the same time as the add-on because there could be a software failure.

<b><u><br>
התקנה:
</b></u><br>
שלב ראשון: 
התקנת התוסף בממשק ה Homebridge 

לחפש את ה Plug-in לפי 'Kumta' בממשק Homebridge


<b><u><br>
**טלגרם**:
</b></u><br>
תנאים מקדימים:

- חשבון טלגרם ללא 2FA
- להיות מנוי לערוץ ```https://t.me/CumtaAlertsChannel``` בטלגרם.
- להוציא API HASH & ID לחשבון הטלגרם שלך.
- סריקת QR Code ע״י תוכנת הטלגרם בטלפון הנייד על מנת לחבר מכשיר נוסף. 

סרטון הדגמה ליצירת API HASH & ID בטלגרם: https://www.youtube.com/watch?v=8naENmP3rg4

שימו לב - ההודעת שנשלחת תגיע לתוכנת הטלגרם ולא בהודעת SMS לטלפון. 

<b><u>
הגדרות התוסף:
</b></u>
יש למלא את שמות הערים כפי שמגיעות מפיקוד העורף, בעברית, עם פסיקים: למשל: ``` תל אביב, הרצליה, חיפה```

יש למלא את API HASH & KEY מאתר טלגרם כפי שקיבלתם. 

סריקת QR וחיבור התוסף לחשבון הטלגרם:

לאחר כיבוי והדלקה של Homebridge יוצג במסך הלוגים QRCODE 

יש לסרוק את הקוד ע״י תוכנת הטלגרם בנייד להוספת מכשיר

הגדרות -> מכשיר -> התחבר במחשב

סרטון הדגמה לסריקת QR והוספת מכשיר - https://www.youtube.com/watch?v=omAZ-oTVYHI

<b><u>
הגדרות HomeKit
</b></u><br>
במסך התוספים של HomeBridge יש לחבר את התוסף ל Homekit ע״י סריקת ה QR (כמו כל תוסף אחר) 

לאחר חיבור התוסף ל Home בחדר `ברירת מחדל` יתווסף חיישן תנועה חדש שאליו ניתן להגדיר אוטומציות. 






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

Telegram HASH ID & KEY -> Short howto -> https://www.youtube.com/watch?v=8naENmP3rg4

To be subscribed to Kumta Telegram Channel using your telegram account: ```https://t.me/CumtaAlertsChannel```


1. Get telegram api_id and api_hash `https://core.telegram.org/api/obtaining_api_id`
2. Update your configuration in homebridge plugin configuration
3. Save and restart homebridge
4. Using your mobile telegram application, scan the QR code shows in homebridge logs window to add addtional device.

* 2FA authetication is not supported at this stage. please disable 2fa on your telegram account (or get temporary 2nd telegram account)
  
### Configuration

See the sample-config.file to see an example of working accessory. Following, all available options are explained:

 * ```cities``` The name of the cities separated by comma (for example: city1, city2). IN HEBREW! 
 * ```tg_api_id``` Telegram client api id.
 * ```tg_api_hash``` Telegram client api hash.
 * ```rockets_alerts_channel``` link to telegram channel for rocket attack alerts (default is https://t.me/CumtaAlertsChannel).Can be customizated to any needed like you want.
 * ```terror_alerts_channel```  link to telegram channel for terror attack alerts (default is https://t.me/CumtaAlerts2Channel). Can be customizated to any needed like you want.
 * ```debug``` enable/disable debug plugin mode (will show more logs). default is false
 * ```timeout``` motion active timeout. default is 7 seconds. recommend 7 seconds

