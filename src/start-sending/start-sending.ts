import { Injectable } from '@nestjs/common';
import select from '@inquirer/select';

@Injectable()
export class StartSending {

    async interact() {

        console.clear()

        return await select({
            message: 'Deseja que o envio seja feito com:',
            choices: [
                {
                    name: 'Somente Mensagem',
                    value: 1
                },
                {
                    name: 'Somente Arquivo',
                    value: 2
                },
                {
                    name: 'Arquivo e Texto',
                    value: 3
                },
                {
                    name: 'Limpar progresso',
                    value: 4
                },
                {
                    name: 'Desligar sistema',
                    value: 5
                }

            ]
        })

    }

    async inProgress() {
        return await select({
            message: 'Deseja parar os envios?',
            choices: [
                {
                    name: 'Parar',
                    value: 1
                },
                {
                    name: 'Finalizar (Apagar Progresso!!!!!!!)',
                    value: 2
                }

            ]
        })
    }

}
