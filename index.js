const axios = require("axios");
const cheerio = require("cheerio");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const url = "https://www.solo-leveling-manhwa.com/solo-leveling-chapter-0";

axios(url)
  .then((result) => {
    // need to capture the h1 text in a single variable
    const html = result.data;
    const $ = cheerio.load(html);
    const title = $("h1").text();

    // need to capture all image urls that contain imgur in url
    const imgUrls = [];
    $("img").each(function () {
      const img = $(this).attr("src");
      if (img.includes("imgur")) {
        imgUrls.push(img);
      }
    });

    // need to download all images to local folder
    for (let i = 0; i < imgUrls.length; i++) {
      downloadImage(imgUrls[i], i);
    }
    // need to convert to pdf
    addImagesToPDF("./images", title);
    //convertToPDF(title, imgUrls);
  })
  .catch((err) => {
    console.log("Error: ", err);
  });

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const convertToPDF = async (title) => {
  const doc = new PDFDocument();
  const pdfStream = fs.createWriteStream(`${title}.pdf`);
  doc.pipe(pdfStream);

  const imgPaths = grabDownloadedFiles();
  for (let i = 0; i < imgPaths.length; i++) {
    console.log(`Adding ${imgPaths[i]} to PDF...`);
    addImageToPDF(`./images/${imgPaths[i]}`, `${title}.pdf`);
  }

  doc.end();

  pdfStream.on("finish", () => {
    console.log(`PDF ${title}.pdf created successfully!`);
  });

  pdfStream.on("error", (error) => {
    console.error(`Error creating PDF: ${error}`);
  });
};

const downloadImage = async (image, index) => {
  let base = 100;
  let imageSavedIndex = index + base;
  const fileName = `image_${imageSavedIndex}.jpg`; // Generate unique file names for each image
  const path = `./images/${fileName}`; // Save images to the 'images' directory

  try {
    const response = await axios.get(image, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data));
    console.log(`Downloaded ${image} to ${path}`);
  } catch (error) {
    console.error(`Error downloading ${image}: ${error.message}`);
  }
};

const grabDownloadedFiles = () => {
  try {
    // Specify the path to the folder
    const folderPath = "./images"; // Update this to your folder path

    // Read the contents of the folder synchronously
    const files = fs.readdirSync(folderPath);

    // Log the names of files in the folder
    console.log("Files in the folder:", files);

    return files; // Return the array of file names
  } catch (err) {
    console.error("Error reading folder:", err);
    throw err; // Throw the error for handling in the calling code
  }
};

const addImagesToPDF = (imageFolder, title) => {
  const doc = new PDFDocument({ autoFirstPage: false });
  const files = fs.readdirSync(imageFolder);
  const totalImages = files.length;
  doc.addPage({ size: [720, 200] }); // Set dimensions for the title page
  doc.text(`${title}`, { align: "center", valign: "center" });

  let currentPage = 2;

  files.forEach((file, index) => {
    const imagePath = `${imageFolder}/${file}`;

    let pageHeight = index === totalImages - 1 ? 855 : 4000;
    if (currentPage === 1 && index === 0) pageHeight = 855; // First page should be 855 height

    doc.addPage({ size: [720, pageHeight] });

    doc.image(imagePath, 0, 0, { width: 720, height: pageHeight });

    currentPage++;
  });

  doc.pipe(fs.createWriteStream(`${title}.pdf`));
  doc.end();
};
