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
  public telegramSessionAccessoryUUID: string;
  public stringSession: any;
  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.services={};

    this.log.debug('Finished initializing platform:', this.config.name);
    this.telegramSessionAccessoryUUID =this.api.hap.uuid.generate('tgSession');

    this.telegramClient;
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });

  }

  async connect(){
    const tgSessionAccessory = this.accessories.find((v)=>{
      return v.UUID===this.telegramSessionAccessoryUUID;
    });
    const tgSession = (!tgSessionAccessory)?'':tgSessionAccessory.context.tgSession || '';
    this.stringSession = new sessions.StringSession(tgSession);
    this.telegramClient = new TelegramClient(this.stringSession, Number(this.config.tg_api_id), this.config.tg_api_hash, {});

    await this.telegramClient.connect();
    if (!(await this.telegramClient.checkAuthorization())) {
      await this.telegramClient.signInUserWithQrCode(
        {apiId: Number(this.config.tg_api_id), apiHash:this.config.tg_api_hash },
        {
          onError: (err) => this.log.info(`LOGIN ERROR => ${err}`),
          qrCode: async (qrCode) => {
            this.log.info('TELEGRAM QR CODE');
            this.log.info(
              qrcode.generate(
                `tg://login?token=${qrCode.token.toString('base64url')}`,
                {
                  small: true,
                },
              ),
            );
          },
        },
      );
      if(tgSessionAccessory){
        tgSessionAccessory.context.tgSession =this.stringSession.save();
      }
    }

    await this.hearbeatTelegramSession();
    this.telegramClient.addEventHandler(this.alertHandler.bind(this),
      new NewMessage({
        incoming: true,
        fromUsers:[this.config.tg_listen_channel],
      }),
    );
    this.telegramClient.autorized = true;
  }

  async hearbeatTelegramSession() {
    setTimeout(this.hearbeatTelegramSession.bind(this), 60000);
    return await this.telegramClient.getMe();
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    if(accessory.UUID !== this.telegramSessionAccessoryUUID){
      this.services[accessory.displayName] = accessory.getService(this.api.hap.Service.MotionSensor);
    accessory.getService(this.api.hap.Service.MotionSensor)!.updateCharacteristic(this.Characteristic.MotionDetected, 0);
    }

    this.accessories.push(accessory);
  }

  discoverDevices() {
    const uuid = this.api.hap.uuid.generate(this.config.city);
    if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
      const accessory = new this.api.platformAccessory(this.config.city, uuid);
      accessory.addService(this.api.hap.Service.MotionSensor, `${this.config.city} alerts`);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

      this.configureAccessory(accessory);
    }
    if (!this.accessories.find(accessory => accessory.UUID === this.telegramSessionAccessoryUUID)) {
      const telegramSessionAccessory = new this.api.platformAccessory('tgSession', this.telegramSessionAccessoryUUID);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [telegramSessionAccessory]);
      this.accessories.push(telegramSessionAccessory);
    }
    this.connect().catch((error)=>{
      this.log.error(error);
    });

  }


  alertHandler(event){
    const message = event.message.text;
    if(message.includes(this.config.city)) {
      const uuid = this.api.hap.uuid.generate(this.config.city);
      const accessory = this.accessories.find(accessory => accessory.UUID === uuid);
      accessory?.getService(this.api.hap.Service.MotionSensor)!.updateCharacteristic(this.Characteristic.MotionDetected, 1);

      setTimeout(()=>{
        accessory?.getService(this.api.hap.Service.MotionSensor)!.updateCharacteristic(this.Characteristic.MotionDetected, 0);
      }, 30000);
    }
  }
}
