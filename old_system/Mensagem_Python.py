from selenium import webdriver
import time
from selenium.webdriver.firefox.firefox_profile import FirefoxProfile
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
driver = webdriver.Chrome(ChromeDriverManager().install())
driver.get('https://web.whatsapp.com/')

with open('Nomes.txt', 'r', encoding='utf-8') as contato:
    contatos = contato.readlines()

nomeGetSet = ""
texto = ""

def get_nome():
    return nomeGetSet.strip()


def enviar_promocao():

    with open('Promoção.txt', 'r', encoding='utf-8') as texto:
        promocao = texto.read()
    
    mensagem()

    clip = driver.find_element_by_css_selector("span[data-testid='clip']")
    clip.click()

    attach = driver.find_element_by_css_selector("input[type='file']")
    attach.send_keys(promocao)

    elemento = driver.find_elements_by_css_selector("span[data-testid='send']")
    teste = len(elemento)

    cond = True
    while (cond == True):
        time.sleep(1)
        if (teste == 0):
            elemento = driver.find_elements_by_css_selector("span[data-testid='send']")
            teste = len(elemento)
        else:
            cond = False

    send = driver.find_element_by_css_selector("span[data-testid='send']")
    send.click()
    
    elemento = driver.find_elements_by_xpath("//span[contains(@data-testid, 'msg-time')]")
    test_send = len(elemento)
    
    cond = True
    while (cond == True):
        time.sleep(1)
        if (test_send > 0):
            elemento = driver.find_elements_by_xpath("//span[contains(@data-testid, 'msg-time')]")
            test_send = len(elemento)
        else:
            cond = False

    print("Próximo")


def mensagem():

    with open('Mensagem.txt', 'r', encoding='utf-8') as texto:
        mensagem = texto.read()
    
    campo_mensagem = driver.find_elements_by_xpath('//*[@id="main"]/footer/div[1]/div/span[2]/div/div[2]/div[1]/div/div[1]')
    campo_mensagem[0].click()

    for linha in mensagem:
        campo_mensagem[0].send_keys(linha)

    campo_mensagem[0].send_keys(Keys.ENTER)


def enviar_mensagem():

    mensagem()

    elemento = driver.find_elements_by_xpath("//span[contains(@data-testid, 'msg-time')]")
    test_send = len(elemento)
    
    cond = True
    while (cond == True):
        time.sleep(1)
        if (test_send > 0):
            elemento = driver.find_elements_by_xpath("//span[contains(@data-testid, 'msg-time')]")
            test_send = len(elemento)
        else:
            cond = False

    contato_andamento = open('Envio_andamento.txt', 'a', encoding='utf-8')
    contato_andamento.write(get_nome() + "\n")
    contato_andamento.close()

    print("Próximo")


def pesquisar_campo():

    campo_pessoa = driver.find_element_by_xpath('//*[@id="side"]/div[1]/div/div/div[2]/div/div[1]')
    campo_pessoa.click()
    for letra in get_nome():
        campo_pessoa.send_keys(Keys.BACKSPACE)
        
    campo_pessoa.send_keys(get_nome())
    campo_pessoa.click()

    for letra in get_nome():
        campo_pessoa.send_keys(Keys.BACKSPACE)
    
    campo_pessoa.send_keys(get_nome())

    time.sleep(2)

    elemento = driver.find_elements_by_xpath("//div[contains(@data-testid,'cell-frame-container')]")
    teste = len(elemento)
    
    cond = True
    condw = True

    if (teste > 1):
        campo_pessoa.send_keys(Keys.ENTER)
    else:
        cont = 0
        while (condw == True):
            time.sleep(5)
            if (teste == 0):
                if (cont <= 3):
                    elemento = driver.find_elements_by_xpath("//div[contains(@data-testid,'cell-frame-container')]")
                    teste = len(elemento)
                    cont = cont + 1
                else:
                    cond = False
                    condw = False
                    erro()
            else:
                campo_pessoa.send_keys(Keys.ENTER)
                condw = False
                cond = True

    elemento = driver.find_elements_by_xpath('//*[@id="app"]/div[1]/div[1]/div[2]/div[3]/span/div[1]/div/header/div/div[1]/button')
    teste = len(elemento)

    condw = True
    cont = 0
    while (condw == True):
        time.sleep(1)
        if (cont <= 2):
            if (teste == 1):
                elemento[0].click()
                condw = False
            else:
                elemento = driver.find_elements_by_xpath('//*[@id="app"]/div[1]/div[1]/div[2]/div[3]/span/div[1]/div/header/div/div[1]/button')
                teste = len(elemento)
                cont = cont + 1

        else:
            condw = False

    contato_andamento = open('Envio_andamento.txt', 'w', encoding='utf-8')
    contato_andamento.write(get_nome() + "\n")
    contato_andamento.close()

    
    return cond

def lista_andamento():
    with open('Envio_andamento.txt', 'r', encoding='utf-8') as contato_atual:
        arquivo = contato_atual.readlines()
    nomes = ""
    for linha in arquivo:
        nomes = nomes + linha
    
    print("\n\n\n === Andamento da Lista ===\n" + nomes)



def erro():
    contato_andamento = open('Erros/Envio_erro.txt', 'a', encoding='utf-8')
    contato_andamento.write(get_nome() + "\n")
    contato_andamento.close()

    contato_andamento = open('Envio_andamento.txt', 'a', encoding='utf-8')
    contato_andamento.write(get_nome() + "\n")
    contato_andamento.close()

    print("Envio cancelado!")


def repetido():
    contato_andamento = open('Erros/Envio_repetidos.txt', 'a', encoding='utf-8')
    contato_andamento.write(get_nome() + "\n")
    contato_andamento.close()

    contato_andamento = open('Envio_andamento.txt', 'a', encoding='utf-8')
    contato_andamento.write(get_nome() + "\n")
    contato_andamento.close()

    print("Envio cancelado!")


def caso(op):
    opcoes = {
    1: enviar_mensagem,
    2: enviar_promocao
    }

    return opcoes.get(op, "Opção inválida")

opcao = input('\n\n\n -------- Para envio de mensagem digite "1" --------\n -------- Para envio de promoção digite "2" --------\n\n\n')

input('\n\n\n**** Quando a página carregar dê um "ENTER" ****\n\n\n')

for pessoas in contatos:
    nomeGetSet = pessoas.strip()
    print(get_nome())
    
    if (pesquisar_campo()):
        opcao_int = int(opcao)

        output = caso(opcao_int)
        output()
        
    lista_andamento()

driver.close()
quit()
