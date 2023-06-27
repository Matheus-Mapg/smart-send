import { Injectable } from '@nestjs/common';
import makeWASocket, { fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { readFile } from 'fs';
import { readFile as readFileAssync, writeFile } from 'fs/promises';
import { url } from 'inspector';
const mime = require('mime-types')
import { extname, resolve } from 'path';
import Log from 'pino'
import { cwd } from 'process';
import { ShippingContent } from 'src/shipping-content/shipping-content';
import { StartSending } from 'src/start-sending/start-sending';
import { setTimeout } from 'timers/promises';

@Injectable()
export class ConnectionService {

    connection: ReturnType<typeof makeWASocket>

    constructor(private readonly start: StartSending, private readonly shipping_content: ShippingContent) { }

    async connect() {

        const { state, saveCreds } = await useMultiFileAuthState(`instance`)
        const { version } = await fetchLatestBaileysVersion()

        this.connection = makeWASocket({
            version,
            auth: state,
            generateHighQualityLinkPreview: true,
            logger: Log({ level: 'silent' }).child(['debug']),
            printQRInTerminal: true,
            syncFullHistory: false
        })



        this.connection.ev.process(async events => {
            if (events['connection.update']) {

                if (events['connection.update'].connection == 'close') {

                    if (events['connection.update']?.lastDisconnect?.error?.message.includes('Stream Errored') || events['connection.update']?.lastDisconnect?.error?.message.includes('Connection Closed'))
                        await this.connect()

                }
                else if (events['connection.update'].connection == 'open') {
                    const value = await this.start.interact()

                    switch (value) {
                        case 1: await this.send_message()
                            break

                        case 2: await this.send_file()
                            break

                        case 3: await this.send_message_file()
                            break
                    }

                    await writeFile(`${cwd()}/progress-envited.json`, JSON.stringify({}), { encoding: 'utf-8' })

                    console.log('\n\n Envios finalizados!!')
                }



            }

            if (events['creds.update']) {
                await saveCreds()
            }
        })
    }

    sendding(number) {
        console.log()
        console.log(' Enviando...')
        console.table({ numero: number })
    }

    async finshed(number) {
        console.log(' Finalizado!!')

        try {
            var progress = await readFileAssync(`${cwd()}/progress-envited.json`, { encoding: 'utf-8' })

        } catch (error) {
            progress = null
        }

        if (progress) {

            const progress_json = JSON.parse(progress)

            progress_json[number] = new Date()

            await writeFile(`${cwd()}/progress-envited.json`, JSON.stringify(progress_json), { encoding: 'utf-8' })
        }

        else {

            await writeFile(`${cwd()}/progress-envited.json`, JSON.stringify({ [number]: new Date() }), { encoding: 'utf-8' })

        }

    }

    async isEnvited(number){
        try {
            var progress = await readFileAssync(`${cwd()}/progress-envited.json`, { encoding: 'utf-8' })

        } catch (error) {
            progress = null
        }

        return !!progress && ( !!JSON.parse(progress)[number] )
    }

    async send_message() {
        const contacts_string = await this.shipping_content.getContacts()

        const contacts = contacts_string.split('\n')

        const message = await this.shipping_content.getContent()

        for (const number of contacts) {

            const number_format = number.replace(/[^0-9]/g, '')

            const isEnvited = await this.isEnvited(number_format)

            if( isEnvited ) continue

            this.sendding(number_format)

            const message_text = await this.connection.sendMessage(`${number_format}@s.whatsapp.net`, {
                text: message
            })

            await this.connection.waitForMessage(message_text.key.id)

            this.finshed(number_format)
            
            await setTimeout(10000)

        }
    }

    async send_message_file() {
        const contacts_string = await this.shipping_content.getContacts()

        const contacts = contacts_string.split('\n')

        const message = await this.shipping_content.getContent()

        const files_string = await this.shipping_content.getPromotion()

        const files = files_string.split('\n')

        for (const number of contacts) {

            const number_format = number.replace(/[^0-9]/g, '')

            const isEnvited = await this.isEnvited(number_format)

            if( isEnvited ) continue

            this.sendding(number_format)

            const message_text = await this.connection.sendMessage(`${number_format}@s.whatsapp.net`, {
                text: message
            })

            await this.connection.waitForMessage(message_text.key.id)

            for await (const file of files) {

                const file_format = file.replace('\r', '')

                const path_file = `${cwd()}/${file_format}`

                const mimetype = mime.lookup(extname(path_file))

                await this.prepareSendFiles(path_file, mimetype, number_format)

            }

            this.finshed(number_format)
            
            await setTimeout(10000)
        }
    }

    async send_file() {
        const contacts_string = await this.shipping_content.getContacts()

        const contacts = contacts_string.split('\n')

        const files_string = await this.shipping_content.getPromotion()

        const files = files_string.split('\n')

        for (const number of contacts) {

            const number_format = number.replace(/[^0-9]/g, '')

            const isEnvited = await this.isEnvited(number_format)

            if( isEnvited ) continue

            this.sendding(number_format)

            for await (const file of files) {

                const file_format = file.replace('\r', '')

                const path_file = `${cwd()}/${file_format}`

                const mimetype = mime.lookup(extname(path_file))

                await this.prepareSendFiles(path_file, mimetype, number_format)

            }

            this.finshed(number_format)
            
            await setTimeout(10000)
        }
    }


    async prepareSendFiles(path, mimetype, number): Promise<Buffer> {

        return new Promise((resolve, rejects) => {
            readFile(path, async (err, data) => {
                if (err) {
                    rejects(err)
                }

                if (mimetype.includes('image')) {
                    await this.connection.sendMessage(`${number}@s.whatsapp.net`, {
                        image: data
                    })


                }
                else if (mimetype.includes('video')) {
                    await this.connection.sendMessage(`${number}@s.whatsapp.net`, {
                        video: data,
                    })
                }
                else {

                    await this.connection.sendMessage(`${number}@s.whatsapp.net`, {
                        document: data,
                        mimetype
                    })
                }

                resolve(data)
            })
        })
    }
}

