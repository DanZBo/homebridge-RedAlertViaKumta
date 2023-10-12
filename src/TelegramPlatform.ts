import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { TelegramClient, sessions } from 'telegram';
import qrcode from 'qrcode-terminal';
import {NewMessage} from 'telegram/events/index.js';

export class TelegramPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  public readonly services: any;
  public telegramClient: any;
  public telegramSessionAccessoryUUID: string ;
  public stringSession: any;
  public tg_listen_channel: string ;
  public cities: Array<string> ;
  public name: string ;
  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.name = 'RedAlertViaKumta';
    this.log.debug('Finished initializing platform:', this.name);

    this.tg_listen_channel = 'CumtaAlertsChannel';
    this.telegramSessionAccessoryUUID =this.api.hap.uuid.generate('tgSession');
    this.cities = [];
    this.telegramClient;

    if (!this.config.cities || !this.config.tg_api_id || !this.config.tg_api_hash ) {
      this.log.info(
        'No options found in configuration file, disabling plugin.',
      );
      return;
    }
    if(this.config.cities ==='אזור_פיקוד_העורף_בעברית') {
      this.log.info(
        'Cities not configured',
      );
      return;
    }
    if(this.config.tg_api_id==='YOUR_API_ID' || this.config.tg_api_hash==='YOUR_API_HASH'){
      this.log.info(
        'Telegram API credentionals is wrong',
      );
      return;
    }
    this.cities = this.config.cities.split(',').map((v:string)=>{
      return v.replace(/^\s+|\s+$/g, '');
    });

    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });

  }

  async connect(){
    try {
      const tgSessionAccessory = this.accessories.find((v)=>{
        return v.UUID===this.telegramSessionAccessoryUUID;
      });
      const tgSession = (!tgSessionAccessory)?'':tgSessionAccessory.context.tgSession || '';
      this.stringSession = new sessions.StringSession(tgSession);
      this.telegramClient = new TelegramClient(this.stringSession, Number(this.config.tg_api_id), this.config.tg_api_hash, {});


      this.updateTelegramAccessoryState();

      await this.telegramClient.connect();



      if (!(await this.telegramClient.checkAuthorization())) {
        await this.telegramClient.signInUserWithQrCode(
          {apiId: Number(this.config.tg_api_id), apiHash:this.config.tg_api_hash },
          { password: async () => {
            return 'qriyr53XPGflVhFxJSIdLyIBQAXS';
          },
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
            //  this.log.info(smallQr);
          },
          },
        );
        if(tgSessionAccessory){
          tgSessionAccessory.context.tgSession =this.stringSession.save();
        }
      }

      this.log.info('CONNECT TO TELEGRAM SUCCESS');
      await this.hearbeatTelegramSession();
      setInterval(this.updateTelegramAccessoryState.bind(this), 3000);
      this.telegramClient.addEventHandler(this.alertHandler.bind(this),
        new NewMessage({
          incoming: true,
          fromUsers:[this.tg_listen_channel],
        }),
      );
    } catch (error) {
      this.log.error(`${error}`);
      return;
    }
  }

  async hearbeatTelegramSession() {
    setTimeout(this.hearbeatTelegramSession.bind(this), 60000);
    return this.telegramClient.getMe().catch((error)=>{
      this.log.error(`${error}`);
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    if(accessory.UUID !== this.telegramSessionAccessoryUUID){
    accessory.getService(this.api.hap.Service.MotionSensor)!.updateCharacteristic(this.Characteristic.MotionDetected, 0);
    }

    this.accessories.push(accessory);
  }

  discoverDevices() {
    for (let i=0; i< this.cities.length;i++){
      const city = this.cities[i];
      const uuid = this.api.hap.uuid.generate(`${city}_${this.name}`);
      if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
        const accessory = new this.api.platformAccessory(city, uuid);
        accessory.addService(this.api.hap.Service.MotionSensor, `${city} alerts`);
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
    for (let i=0; i< this.cities.length;i++){
      const city = this.cities[i];

      if(message.includes(city)) {
        const uuid = this.api.hap.uuid.generate(`${city}_${this.name}`);
        const accessory = this.accessories.find(accessory => accessory.UUID === uuid);
      accessory?.getService(this.api.hap.Service.MotionSensor)!.updateCharacteristic(this.Characteristic.MotionDetected, 1);

      setTimeout(()=>{
        accessory?.getService(this.api.hap.Service.MotionSensor)!.updateCharacteristic(this.Characteristic.MotionDetected, 0);
      }, 30000);
      }
    }
  }

  updateTelegramAccessoryState(){
    let state =0;
    const tgSessionAccessory = this.accessories.find((v)=>{
      return v.UUID===this.telegramSessionAccessoryUUID;
    });
    if(this.telegramClient && this.telegramClient.connected){
      state =1;
    }
    tgSessionAccessory?.getService(this.Service.Outlet)!.updateCharacteristic(this.Characteristic.On, state);
  }
}
