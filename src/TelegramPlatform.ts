import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { TelegramClient, sessions } from 'telegram';
import qrcode from 'qrcode-terminal';
import {NewMessage} from 'telegram/events/index.js';

interface ChannelTypes{
  [key: string]: string | undefined;
}

export class TelegramPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  public readonly services: any;
  public telegramClient: any;
  public telegramSessionAccessoryUUID: string ;
  public stringSession: any;
  public tg_listen_channel: Array<string> ;
  public cities: Array<string> ;
  public name: string ;
  public channel_types:ChannelTypes;
  public debug: boolean;
  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.name = 'RedAlertViaKumta';

    this.tg_listen_channel = [];
    this.telegramSessionAccessoryUUID =this.api.hap.uuid.generate('tgSession');
    this.cities = [];
    this.telegramClient;
    this.channel_types = { };
    this.debug = config.debug || false;
    process.on('unhandledRejection', (reason)=>{
      this.log.error(`${reason}`);
    });

    this.log['easyDebug']= (...content) => {
      if (this.debug) {
        this.log.info(content.reduce((previous, current) => {
          return previous + ' ' + current;
        }));
      } else {
        this.log.debug(content.reduce((previous, current) => {
          return previous + ' ' + current;
        }));
      }
    };
    if (!this.config.cities || !this.config.tg_api_id || !this.config.tg_api_hash) {
      this.log.error(
        'No options found in configuration file, disabling plugin.  If you updated plugin try to open plugin settings and click save button',
      );
      return;
    }
    if(this.config.cities ==='אזור_פיקוד_העורף_בעברית') {
      this.log.error(
        'Cities not configured in configuration file, disabling plugin. Try to open plugin settings and configure cities again',
      );
      return;
    }
    if(this.config.tg_api_id==='YOUR_API_ID' || this.config.tg_api_hash==='YOUR_API_HASH'){
      this.log.error(
        'Telegram API credentionals is wrong in configuration file, disabling plugin.  Try to open plugin settings and configure Telegram API credentionals again',
      );
      return;
    }
    if(this.config.rockets_alerts_channel && this.config.rockets_alerts_channel!==''){
      const channelName = this.config.rockets_alerts_channel.replace('https://t.me/', '');
      this.tg_listen_channel.push(this.config.rockets_alerts_channel.replace('https://t.me/', ''));
      this.channel_types[channelName] = 'rockets';
    }
    if(this.config.terror_alerts_channel && this.config.terror_alerts_channel!==''){
      const channelName = this.config.terror_alerts_channel.replace('https://t.me/', '');
      this.tg_listen_channel.push(this.config.terror_alerts_channel.replace('https://t.me/', ''));
      this.channel_types[channelName] = 'terror';
    }
    if(this.tg_listen_channel.length===0){
      this.log.error(
        'No any channel found in configuration file, disabling plugin. If you updated plugin try to open plugin settings and click save button',
      );
      return;
    }

    this.cities = this.config.cities.split(',').map((v:string)=>{
      return v.replace(/^\s+|\s+$/g, '');
    });
    this.log['easyDebug']('Finished initializing platform:', this.name);

    this.api.on('didFinishLaunching', () => {
      this.log['easyDebug']('Executed didFinishLaunching callback');
      this.discoverDevices();
    });

  }

  async connect(){
    try {
      const tgSessionAccessory = this.accessories.find((v)=>{
        return v.UUID===this.telegramSessionAccessoryUUID;
      });
      const tgSession = (!tgSessionAccessory)?'':tgSessionAccessory.context.tgSession || '';

      this.log['easyDebug'](`${tgSession!==''? 'Telegram session was loaded from cache':'Telegram session not found in cache'}`);


      this.stringSession = new sessions.StringSession(tgSession);
      this.telegramClient = new TelegramClient(this.stringSession, Number(this.config.tg_api_id), this.config.tg_api_hash, {});


      this.updateTelegramAccessoryState();

      await this.telegramClient.connect();



      if (!(await this.telegramClient.checkAuthorization())) {
        if(tgSession!==''){
          this.log['easyDebug']('Telegram session was loaded from cache but authorization failed. Please check your telegram maybe you need some confirmations');
        }else{
          this.log['easyDebug']('Telegram session was not found in cache');
        }
        await this.telegramClient.signInUserWithQrCode(
          {apiId: Number(this.config.tg_api_id), apiHash:this.config.tg_api_hash },
          {
            onError: (err) => {
              this.log.error(`LOGIN ERROR => ${err}`);
            },
            qrCode: async (qrCode) => {
              this.log.info('TELEGRAM QR CODE');
              qrcode.generate(
                `tg://login?token=${qrCode.token.toString('base64url')}`,
                {
                  small: true,
                },
              );
            },
          },
        );
        if(tgSessionAccessory){
          this.log['easyDebug']('Telegram session was save to cache');

          tgSessionAccessory.context.tgSession =this.stringSession.save();
        }else{
          this.log['easyDebug']('Failed to save telegram session because accessory not found');
        }
      }

      this.log.info('CONNECT TO TELEGRAM SUCCESS');
      await this.checkUserSubscribtionChannels();
      await this.hearbeatTelegramSession();
      setInterval(this.updateTelegramAccessoryState.bind(this), 3000);
      this.telegramClient.addEventHandler(this.alertHandler.bind(this),
        new NewMessage({
          incoming: true,
          fromUsers:this.tg_listen_channel,
        }),
      );
    } catch (error) {
      this.log.error(`${error}`);
      return;
    }
  }

  async checkUserSubscribtionChannels(){
    try {
      const dialogsList = (await this.telegramClient.getDialogs()).map((v)=>v.entity.username);
      for(let i=0;i<this.tg_listen_channel.length;i++){
        if(dialogsList.includes(this.tg_listen_channel[i])){
          this.log.info(`https://t.me/${this.tg_listen_channel[i]} subscribtion virified`);
        }else{
          this.log.info(`PLEASE SUBSCRIBE TO https://t.me/${this.tg_listen_channel[i]} FOR GETTING ALERTS`);
        }
      }

    } catch (error) {
      this.log.error(`${error}`);

    }
  }

  async hearbeatTelegramSession() {
    //   this.log['easyDebug']('TELEGRAM HEARBEATING (EVERY 60000ms)');

    setTimeout(this.hearbeatTelegramSession.bind(this), 60000);
    return this.telegramClient.getMe().catch((error)=>{
      this.log.error(`${error}`);
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    try{
      this.log['easyDebug']('Loading accessory from cache:', accessory.displayName);
      if(accessory.UUID !== this.telegramSessionAccessoryUUID){
      /* Reconfigure exists before 2.3.0 version services */
        accessory.services=accessory.services.map((service)=>{
          if(service.displayName===`${accessory.displayName} alerts` && !service.subtype){
            service.subtype = 'rockets';
          }
          return service;
        });
        /* Reconfigure exists before 2.3.0 version services */

        if(!accessory.getService('rockets')){
          accessory.addService(this.api.hap.Service.MotionSensor, `${accessory.displayName} alerts`, 'rockets');
        }else{
        accessory.getService('rockets')!.setCharacteristic(this.Characteristic.MotionDetected, 0);
        }

        if(!accessory.getService('terror')){
          accessory.addService(this.api.hap.Service.MotionSensor, `${accessory.displayName} terror`, 'terror');
        }else{
        accessory.getService('terror')!.setCharacteristic(this.Characteristic.MotionDetected, 0);
        }
      }

      this.accessories.push(accessory);
      this.log['easyDebug']('Accessory configured successfully');
    }catch(error){
      this.log.error(`${error}`);
    }

  }



  discoverDevices() {
    for (let i=0; i< this.cities.length;i++){
      const city = this.cities[i];
      const uuid = this.api.hap.uuid.generate(`${city}_${this.name}`);
      if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
        const accessory = new this.api.platformAccessory(city, uuid);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.configureAccessory(accessory);
      }
    }

    let telegramSessionAccessory = this.accessories.find(accessory => accessory.UUID === this.telegramSessionAccessoryUUID);
    if (!telegramSessionAccessory) {
      telegramSessionAccessory = new this.api.platformAccessory('Telegram Connection', this.telegramSessionAccessoryUUID);
      telegramSessionAccessory.addService(this.Service.Outlet, 'Telegram connection state');
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [telegramSessionAccessory]);
      this.accessories.push(telegramSessionAccessory);
    }else{
      if(!telegramSessionAccessory.getService(this.Service.Outlet)){
        telegramSessionAccessory.addService(this.Service.Outlet, 'Telegram connection state');
      }
    }
    this.connect().catch((error)=>{
      this.log.error(error);
      this.updateTelegramAccessoryState();
    });

  }


  alertHandler(event){
    const message = event.message.text;
    const channel = event.message.chat.username;
    this.log['easyDebug'](`\nGOT MESSAGE: \n${message}\nFROM: ${channel}\n`);

    for (let i=0; i< this.cities.length;i++){
      try{
        const city = this.cities[i];

        if(message.includes(city)) {
          const uuid = this.api.hap.uuid.generate(`${city}_${this.name}`);
          const accessory = this.accessories.find(accessory => accessory.UUID === uuid);

          accessory?.getService(this.channel_types[channel]!)!.updateCharacteristic(this.Characteristic.MotionDetected, 1);
          this.log['easyDebug'](`City: ${city} was triggered. Type: ${this.channel_types[channel]}`);

          setTimeout(()=>{
          accessory?.getService(this.channel_types[channel]!)!.updateCharacteristic(this.Characteristic.MotionDetected, 0);
          }, 30000);
        }else{
          this.log['easyDebug'](`Alert message not include information about ${city} any attacks`);
        }

      }catch(err){
        this.log['easyDebug'](`${err}`);
      }
    }
  }

  async updateTelegramAccessoryState(){
    let state =0;
    const tgSessionAccessory = this.accessories.find((v)=>{
      return v.UUID===this.telegramSessionAccessoryUUID;
    });
    if(this.telegramClient && this.telegramClient.connected && (await this.telegramClient.checkAuthorization())){
      state =1;
    }
    tgSessionAccessory?.getService(this.Service.Outlet)!.updateCharacteristic(this.Characteristic.On, state);
  }
}
