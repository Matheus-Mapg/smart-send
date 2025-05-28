import * as fs from 'fs'

import * as csv from 'csv-parse'

export async function extractPhoneNumbersFromCSV(path: string): Promise<string[]> {
    const phones = new Set<string>()

    return new Promise((resolve, reject) => {
        fs.createReadStream(path)
            .pipe(csv.parse({ columns: true }))
            .on('data', (row) => {
                Object.entries(row).forEach(([key, value]) => {
                    if (key.toLowerCase().includes('phone') && value) {
                        const valueString = value.toString()

                        const multiplesNumbers = valueString.split(':::')

                        multiplesNumbers.map((value) => value.replace(/[^\d]/g, ''))

                        for (const number of multiplesNumbers) {
                            if (number.length >= 8) phones.add(number)
                        }
                    }
                })
            })
            .on('end', () => resolve([...phones]))
            .on('error', reject)
    })
}

function cleanNumber(num) {
    return num.replace(/[^\d]/g, '')
}

function last8(num) {
    const clean = cleanNumber(num)
    return clean.slice(-8)
}

export function compareNumbers(contactsMultiplesFormats, contactsOnWhatsapp) {
    const found = []
    const notFound = []

    // Criar um Set com os sufixos de 8 dígitos dos contatos do WhatsApp
    const whatsappSuffixes = new Set(
        contactsOnWhatsapp.map(last8)
    )

    // Sets para evitar duplicatas no resultado
    const foundSuffixes = new Set()
    const notFoundSuffixes = new Set()

    for (const contact of contactsMultiplesFormats) {
        const suffix = last8(contact)

        if (suffix.length < 8) continue // ignora inválidos

        if (whatsappSuffixes.has(suffix) && !foundSuffixes.has(suffix)) {
            found.push(contact)
            foundSuffixes.add(suffix)
        } else if (!whatsappSuffixes.has(suffix) && !notFoundSuffixes.has(suffix)) {
            notFound.push(contact)
            notFoundSuffixes.add(suffix)
        }
    }

    return { found, notFound, foundSuffixes, notFoundSuffixes }
}