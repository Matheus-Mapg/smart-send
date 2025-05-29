import { Injectable } from '@nestjs/common';
import makeWASocket, { fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys';
import fs, { readFile } from 'fs';
import { access, readFile as readFileAssync, rm, writeFile } from 'fs/promises';
const mime = require('mime-types')
import { extname } from 'path';
import Log from 'pino'
import { cwd, exit } from 'process';
import { ShippingContent } from 'src/shipping-content/shipping-content';
import { StartSending } from 'src/start-sending/start-sending';
import { setTimeout } from 'timers/promises';
import { parse } from 'csv-parse/sync'
import { compareNumbers, extractPhoneNumbersFromCSV } from 'src/util';

@Injectable()
export class ConnectionService {

    connection: ReturnType<typeof makeWASocket>

    time_per_msg = 5 * 1000

    private autoFreshContacts: boolean = true

    private isShippingProcessing = false
    private isContactProcessing = false
    private canInsertContacts = true
    private isMigrationContactProcessing = false

    private stop: boolean = false
    private isShippingFinished = true
    private clear: boolean = false

    constructor(private readonly start: StartSending, private readonly shipping_content: ShippingContent) { }

    async initFiles() {

        try {
            await access(`${cwd()}/Nomes.txt`)

        } catch (error) {
            await writeFile(`${cwd()}/Nomes.txt`, '')
        }

        try {
            await access(`${cwd()}/Promoção.txt`)

        } catch (error) {
            await writeFile(`${cwd()}/Promoção.txt`, '')
        }

        try {
            await access(`${cwd()}/Mensagem.txt`)

        } catch (error) {
            await writeFile(`${cwd()}/Mensagem.txt`, '')
        }

        try {
            await access(`${cwd()}/Remover.txt`)

        } catch (error) {
            await writeFile(`${cwd()}/Remover.txt`, '')
        }

    }

    extractNumber(number) {
        return number.startsWith('55619') || number.startsWith('55629') ? number.substring(5) : number.startsWith('5561') || number.startsWith('5562') ? number.substring(4) : number.startsWith('619') || number.startsWith('629') ? number.substring(3) : number.startsWith('61') || number.startsWith('55') || number.startsWith('62') ? number.substring(2) : number.startsWith('9') ? number.substring(1) : number
    }

    async migrationContacts() {
        await setTimeout(2000);

        const pathContact = `${cwd()}/contacts.csv`;
        this.isMigrationContactProcessing = true;

        try {
            await access(pathContact);
        } catch (e) {
            this.isMigrationContactProcessing = false;
            return await this.migrationContacts();
        }

        const migrationContacts = await extractPhoneNumbersFromCSV(pathContact);
        const contactsOnWhatsapp = [];

        const existsWhatsapp = await this.connection.onWhatsApp(...migrationContacts);

        for (const contact of existsWhatsapp) {
            if (contact.exists) {
                const numberWhatsapp = contact.jid.split('@')[0]; // pega o número completo antes do sufixo
                contactsOnWhatsapp.push(numberWhatsapp);
                await this.insertContact(numberWhatsapp);
            }
        }

        // Comparação robusta usando sufixos
        const { found, notFound } = compareNumbers(migrationContacts, contactsOnWhatsapp);

        let message =
            `Encontrados (WhatsApp): ${found.length}\n` +
            `Total importados do CSV: ${migrationContacts.length}\n` +
            `Não encontrados (por sufixo de 8 dígitos): ${notFound.length}\n`;

        for (const number of notFound) {
            message += `\n\t- ${number}`;
        }

        await writeFile(`${cwd()}/Importacao.txt`, message);
        await rm(pathContact);
        await this.syncContacts();

        this.isMigrationContactProcessing = false;

        // Reinicia processo se necessário
        await this.migrationContacts();
    }

    async connect() {

        await this.initFiles()

        const { state, saveCreds } = await useMultiFileAuthState(`instance`)
        const { version } = await fetchLatestBaileysVersion()

        this.connection = makeWASocket({
            version,
            auth: state,
            generateHighQualityLinkPreview: false,
            logger: Log({ level: 'silent' }).child(['debug']),
            printQRInTerminal: true,
            syncFullHistory: true
        })


        this.connection.ev.process(async events => {
            if (events['connection.update']) {

                if (events['connection.update'].connection == 'close') {

                    if (events['connection.update']?.lastDisconnect?.error?.message.includes('Stream Errored') || events['connection.update']?.lastDisconnect?.error?.message.includes('Connection Closed'))
                        await this.connect()

                }
                else if (events['connection.update'].connection == 'open') {
                    this.migrationContacts()

                    await this.generateMenu()

                    if (this.isShippingFinished) {
                        await writeFile(`${cwd()}/progress-envited.json`, JSON.stringify({}), { encoding: 'utf-8' })

                        console.log('\n\n Envios finalizados!!')
                    }

                }



            }

            if (events['creds.update']) {
                await saveCreds()
            }


            if (events['contacts.upsert']) {

                this.isContactProcessing = true

                for (const iterator of events['contacts.upsert']) {
                    if (iterator.id.includes('@s.whatsapp.net')) {
                        const number = iterator.id.split('@')[0]

                        await this.insertContact(number)

                    }
                }

                this.autoFreshContacts && await this.syncContacts()

                this.isContactProcessing = false
            }

            if (events['messages.upsert']) {
                this.isContactProcessing = true

                for (const iterator of events['messages.upsert'].messages) {



                    if (iterator?.key?.remoteJid?.includes('@s.whatsapp.net')) {
                        const number = iterator?.key?.remoteJid?.split('@')[0]
                        await this.insertContact(number)
                    }
                }

                this.autoFreshContacts && await this.syncContacts()

                this.isContactProcessing = false
            }

        })
    }

    async generateMenu() {
        const optionShipping = await this.start.interact()

        this.shutdown()

        switch (optionShipping) {
            case 1: await this.send_message()
                break

            case 2: await this.send_file()
                break

            case 3: await this.send_message_file()
                break

            case 4:
                await this.clearProgress()
                await this.generateMenu()
                break

            case 5: this.stop = true; break

        }

        this.isShippingProcessing = false
    }

    async inProgressMenu() {
        const optionInProgress = await this.start.inProgress()

        switch (optionInProgress) {

            case 1: this.stop = true; break

            case 2: this.stop = true; this.clear = true; break
        }
    }

    sendding(number) {
        console.log()
        console.log(' Enviando...')
        console.table({ numero: number })
    }

    async shutdown() {

        this.stop && console.log('... a finalizar', this.isMigrationContactProcessing, this.isContactProcessing, this.isShippingProcessing, !this.stop)

        if (this.isMigrationContactProcessing || this.isContactProcessing || this.isShippingProcessing || !this.stop) {

            await setTimeout(1000)

            await this.shutdown()
        }

        this.clear && await this.clearProgress()

        this.stop && exit()
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

            const numbers = Object.keys(progress_json)

            const count_total_contacts_string = await this.shipping_content.getContacts()

            const count_total_contacts = count_total_contacts_string.split('\n')

            const count_contacts_enviting = count_total_contacts.length - numbers.length

            const timing_enviting = Math.floor(((count_contacts_enviting * this.time_per_msg) / 1000) / 60)

            const count_progress = `Contatos com sucesso ( ${numbers.length} ) último enviado ( ${number} ) finaliza em ( ${timing_enviting} min )` +
                `\nTotal de Contatos ( ${count_total_contacts.length} )`

            await writeFile(`${cwd()}/Envio_Andamento.txt`, count_progress)

            await writeFile(`${cwd()}/progress-envited.json`, JSON.stringify(progress_json), { encoding: 'utf-8' })
        }

        else {

            await writeFile(`${cwd()}/progress-envited.json`, JSON.stringify({ [number]: new Date() }), { encoding: 'utf-8' })

        }

    }

    async isEnvited(number) {
        console.clear()

        try {
            var progress = await readFileAssync(`${cwd()}/progress-envited.json`, { encoding: 'utf-8' })

        } catch (error) {
            progress = null
        }

        return !!progress && (!!JSON.parse(progress)[number])
    }

    async send_message() {
        this.inProgressMenu()

        this.isShippingFinished = false

        const contacts_string = await this.shipping_content.getContacts()

        const contacts = contacts_string.split('\n')

        const message = await this.shipping_content.getContent()

        for (const number of contacts) {

            this.isShippingProcessing = true

            const number_format = number.replace(/[^0-9]/g, '')

            const isEnvited = await this.isEnvited(number_format)

            if (isEnvited) continue

            this.sendding(number_format)

            const message_text = await this.connection.sendMessage(`${number_format}@s.whatsapp.net`, {
                text: message
            })

            await this.connection.waitForMessage(message_text.key.id)

            this.finshed(number_format)

            this.isShippingProcessing = false

            this.isShippingFinished = true

            await setTimeout(this.time_per_msg)

        }
    }

    async send_message_file() {
        this.inProgressMenu()

        this.isShippingFinished = false

        const contacts_string = await this.shipping_content.getContacts()

        const contacts = contacts_string.split('\n')

        const message = await this.shipping_content.getContent()

        const files_string = await this.shipping_content.getPromotion()

        const files = files_string.split('\n')

        for (const number of contacts) {

            this.isShippingProcessing = true

            const number_format = number.replace(/[^0-9]/g, '')

            const isEnvited = await this.isEnvited(number_format)

            if (isEnvited) continue

            this.sendding(number_format)

            const message_text = await this.connection.sendMessage(`${number_format}@s.whatsapp.net`, {
                text: message
            })

            await this.connection.waitForMessage(message_text.key.id)

            for await (const file of files) {

                const file_format = file.replace('\r', '')

                if (!!file_format.trim()) {
                    const path_file = `${cwd()}/${file_format}`

                    const mimetype = mime.lookup(extname(path_file))

                    await this.prepareSendFiles(path_file, mimetype, number_format)
                }
            }

            this.finshed(number_format)

            this.isShippingProcessing = false

            this.isShippingFinished = true

            await setTimeout(this.time_per_msg)
        }
    }

    async send_file() {
        this.inProgressMenu()

        this.isShippingFinished = false

        const contacts_string = await this.shipping_content.getContacts()

        const contacts = contacts_string.split('\n')

        const files_string = await this.shipping_content.getPromotion()

        const files = files_string.split('\n')

        for (const number of contacts) {

            this.isShippingProcessing = true

            const number_format = number.replace(/[^0-9]/g, '')

            const isEnvited = await this.isEnvited(number_format)

            if (isEnvited) continue

            this.sendding(number_format)

            for await (const file of files) {

                const file_format = file.replace('\r', '')

                if (!!file_format.trim()) {
                    const path_file = `${cwd()}/${file_format}`

                    const mimetype = mime.lookup(extname(path_file))

                    await this.prepareSendFiles(path_file, mimetype, number_format)
                }

            }

            this.finshed(number_format)

            this.isShippingProcessing = false

            this.isShippingFinished = true

            await setTimeout(this.time_per_msg)
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

    async clearProgress() {
        await writeFile(`${cwd()}/progress-envited.json`, JSON.stringify({}), { encoding: 'utf-8' })
    }

    async insertContact(contact) {

        if (!this.canInsertContacts) {
            await setTimeout(2000)

            await this.insertContact(contact)
            return
        }

        this.canInsertContacts = false

        try {
            var update_contacts = await readFileAssync(`${cwd()}/update-contact.json`, { encoding: 'utf-8' })

        } catch (error) {
            update_contacts = null
        }

        if (update_contacts) {

            const contacts_key = JSON.parse(update_contacts)

            contacts_key[contact] = new Date()

            await setTimeout(10)

            await writeFile(`${cwd()}/update-contact.json`, JSON.stringify(contacts_key))
        }
        else {
            await writeFile(`${cwd()}/update-contact.json`, JSON.stringify({ [contact]: new Date() }))
        }

        this.canInsertContacts = true

    }

    async syncContacts() {
        try {
            var update_contacts = await readFileAssync(`${cwd()}/update-contact.json`, { encoding: 'utf-8' })

        } catch (error) {
            update_contacts = null
        }

        try {
            var remove_contacts_string = await readFileAssync(`${cwd()}/Remover.txt`, { encoding: 'utf-8' })

        } catch (error) {
            remove_contacts_string = null
        }

        if (update_contacts) {

            let contacts_txt = ''

            const contacts_key = JSON.parse(update_contacts)

            if (remove_contacts_string) {
                var remove_contacts = remove_contacts_string.split('\n')

                remove_contacts = remove_contacts.map(e => e.replace('\r', ''))

            }

            for (const number in contacts_key) {

                if (remove_contacts?.find(e => e == number)) {
                    continue
                }

                if (!contacts_txt) {
                    contacts_txt += `${number}`
                }
                else {
                    contacts_txt += `\n${number}`
                }
            }

            await writeFile(`${cwd()}/Nomes.txt`, contacts_txt, { encoding: 'utf-8' })
        }
    }

}