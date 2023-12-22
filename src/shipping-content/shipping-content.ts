import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { cwd } from 'process';

@Injectable()
export class ShippingContent {

    path_contacts = `${cwd()}`

    async getContacts(): Promise<string> {
        try {
            var update_contacts = await readFile(`${this.path_contacts}/Nomes.txt`, { encoding: 'utf-8' })

        } catch (error) {
            update_contacts = null
        }

        return update_contacts;
    }

    async getPromotion(): Promise<string> {
        try {
            var promotions = await readFile(`${this.path_contacts}/Promoção.txt`, { encoding: 'utf-8' })

        } catch (error) {
            promotions = null
        }

        return promotions
    }

    async getContent(): Promise<string> {
        try {
            var content = await readFile(`${this.path_contacts}/Mensagem.txt`, { encoding: 'utf-8' })

        } catch (error) {
            content = null
        }

        return content
    }
}
