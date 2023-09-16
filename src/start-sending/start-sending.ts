import { Injectable } from '@nestjs/common';
import select from '@inquirer/select';

@Injectable()
export class StartSending {

    async interact(){

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
                }

            ]
        })

    }
    
}
