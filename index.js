const PORT = process.env.PORT || 3000;
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

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

    // log out title and imgUrls
    console.log("Title: ", title);
    console.log("Images: ", imgUrls);
  })
  .catch((err) => {
    console.log("Error: ", err);
  });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
