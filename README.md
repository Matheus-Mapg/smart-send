# Automação Whatsapp

Esse projeto foi pensado e construído com o intuito de envio de mensagens em massa no Whatsapp Web

## Funcionamento e interface

<img src="readme/Inicial.png"/>


> **Antes de tudo, sempre que você inicia-lo irá abrir essas duas telas acima, na primeira solicitando que escaneie o código e na segunda qual método de envio**

- ### Preparação do Sistema

<details><summary>Instalando o Python</summary>

> Para que o programa inicie precisamos de um compilador do código chamado [python](https://www.python.org/downloads/) clique em download Python como na imagem abaixo:

<img src="readme/python.png"/>

> Execute o instalador e clique em "Add python to PATH" e logo depois em install now e continuar avançando sem medo

<img src="readme/install_python.jpg"/>

</details>
<details><summary>Instalando o Sistema</summary>


> Primeiro passo abra seu terminal de preferência e vá para o diretório de onde baixou a pasta e digite os seguintes comandos:
 ```bash 
 pip install selenium
 pip install webdrive_manager
 ```
 - **OBS: faça o download dos arquivos do projeto**

</details>

- ### Como usar e enviar as mensagens?

Agora com tudo pronto podemos ir para a Utilização do Sistema!

<details><summary>Pessoas</summary>

> Para adicionar as pessoa que você quer enviar, abra o txt `Nomes.txt` e coloque-os **linha a linha**
> Coloque os numeros sem o dígito 9, ex: 6187654321

<img src="readme/Pessoas.png"/>

</details>

<details><summary>Mensagem</summary>

## Preparando Mensagem
> Abra o `Mensagem.txt` e escreva a mensagem a ser enviada, **Não esqueça de salvar**

<img src="readme/Mensagem.png"/>

## Enviando mensagem

> Dê dois cliques no arquivo `Mensagem_zap_mozila.py` e envie 1

<img src="readme/Enviar_mensagem.png"/>

> Logo depois irá abrir a página do whatsapp scaneie e depois volte para o terminal e aperte `ENTER`

<img src="readme/Inicio.png"/>

</details>

<details><summary>Mensagem e Arquivo</summary>

## Preparando Mensagem
> Abra o `Mensagem.txt` e escreva a mensagem a ser enviada, **Não esqueça de salvar**

<img src="readme/Mensagem.png"/>

## Preparando Arquivo
> Abra o `Promoção.txt` e copie o diretório da pasta como mostrado abaixo:

<img src="readme/arquivo.png"/>

> Inverta as barras `\` pela `/` e coloque o nome do arquivo com a extenção

<img src="readme/promocao.png"/>

## Enviando mensagem

> Dê dois cliques no arquivo `Mensagem_zap.py` e envie 2

<img src="readme/Enviar_mensagem.png"/>

> Logo depois irá abrir a página do whatsapp scaneie e depois volte para o terminal e aperte `ENTER`

<img src="readme/Inicio.png"/>

</details>

<details><summary>Erros e Pesquisa</summary>

**Em Breve escreverei sobre!**

</details>

<details><summary>Envio_andamento</summary>

> O txt `Envio_andamento.py` é onde fica armazenado os contatos pecorridos pela execução, sempre aparecer o último contato enviado
>Caso a aplicação tenha parado por algum motivo, vá em `Nomes.txt` e tire ele e todos os de cima da lista, salve-o

<img src="readme/andamento.png"/>

</details>