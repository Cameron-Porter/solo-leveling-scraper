const axios = require('axios');
const cheerio = require('cheerio');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const sizeOf = require('image-size');

const url = 'https://www.solo-leveling-manhwa.com/solo-leveling-chapter-';

for (let i = 0; i < 201; i++) {
  let newURL = url + i;
  axios(newURL)
    .then(async (result) => {
      // capture the h1 text in a single variable
      const html = result.data;
      const $ = cheerio.load(html);
      const title = $('h1').text();

      // capture all image urls that contain imgur in url
      const imgUrls = [];
      $('img').each(function () {
        const img = $(this).attr('src');
        if (img.includes('imgur')) {
          imgUrls.push(img);
        }
      });

      // download all images to local folder
      for (let i = 0; i < imgUrls.length; i++) {
        await downloadImage(imgUrls[i], i);
      }
      // convert to pdf
      addImagesToPDF('./images', title);
    })
    .catch((err) => {
      console.log('Error: ', err);
    });
}

const downloadImage = async (image, index) => {
  let base = 100;
  let imageSavedIndex = index + base;
  const fileName = `image_${imageSavedIndex}.jpg`; // Generate unique file names for each image
  const path = `./images/${fileName}`; // Save images to the 'images' directory

  try {
    const response = await axios.get(image, { responseType: 'arraybuffer' });
    fs.writeFileSync(path, Buffer.from(response.data));
  } catch (error) {
    console.error(`Error downloading ${image}: ${error.message}`);
  }
};

const addImagesToPDF = (imageFolder, title) => {
  const doc = new PDFDocument({ autoFirstPage: false });
  const files = fs.readdirSync(imageFolder);

  let currentPage = 1;

  files.forEach((file, index) => {
    const imagePath = `${imageFolder}/${file}`;
    const dimensions = sizeOf(imagePath);
    let { width, height } = dimensions;

    if (currentPage === 1 && index === 0) {
      doc.addPage({ size: [720, 200] });
      doc.text(`${title}`, { align: 'center', valign: 'center' });
    } else {
      doc.addPage({ size: [width, height] });
    }
    doc.image(imagePath, 0, 0, { width: width, height: height });

    currentPage++;
  });

  doc.pipe(fs.createWriteStream(`./manhwa/${title}.pdf`));
  doc.end();
};
