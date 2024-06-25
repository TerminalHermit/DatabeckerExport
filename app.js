const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { parse, format } = require('date-fns');


function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function writeFileToPath(filePath, data) {
  return new Promise((resolve, reject) => {
    const directory = path.dirname(filePath);
    fs.mkdir(directory, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        fs.writeFile(filePath, data, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(filePath);
          }
        });
      }
    });
  });
}


const printInvoicesWithPositions = async () => {
  try {
    const invoices = await readCSV('out/Invoice.csv');
    const positions = await readCSV('out/Position.csv');

    invoices.forEach(invoice => {
      let data = '';
      data += `Invoice ID: ${invoice.InvoiceNumber}\n`;
      data += `Kunde: ${invoice.Customer}\n`
      const parsedDate = parse(`${invoice.Date}`, 'MM/dd/yy HH:mm:ss', new Date());
      const formatdate = format(parsedDate, 'yyyy-MM-dd')
      data += `Datum: ${formatdate}\n`
      data += `Text: ${invoice.Text}`
      data += '-----------------------\n'
      data += 'Positions:\n'

      let outPath = `export/${parsedDate.getFullYear()}/${invoice.Customer}/${formatdate}.txt`
      
      positions.forEach(position => {
        if (position.DocumentNumber === invoice.InvoiceNumber) {
          let q = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(`${position.Quantity}`);
          let pricenet = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(`${position.UnitpriceNet}`);
          data += `- ${q}(${position.Unit}) je ${pricenet} euro X ${position.ShortText}[${position.ArticleNumber}]\n`;
        }
      });

      writeFileToPath(outPath, data)
    });
  } catch (error) {
    console.error('Error reading CSV files:', error);
  }
};

printInvoicesWithPositions();

