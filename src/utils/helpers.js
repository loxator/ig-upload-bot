const fs = require("fs");
const https = require("https");
const { readFile } = require("fs");
const { promisify } = require("util");
const ffmpeg = require("fluent-ffmpeg");
const readFileAsync = promisify(readFile);
const snoowrap = require("snoowrap");
const path = require("path");
const downloadFile = async (url, fileName) => {
  try {
    let file = fs.createWriteStream(`./${fileName}`);
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        response.pipe(file);
        response.on("end", () => {
          resolve();
        });
      });
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: helpers.js ~ line 30 ~ downloadFile ~ error",
      error
    );
  }
};

const getTopPostOfSubreddit = async (r, postNumber, limit) => {
  try {
    const subreddit = await r.getSubreddit(process.env.subreddit);
    const topPost = await subreddit.getTop({ time: "hour", limit })[postNumber];

    if (!topPost.is_video && topPost.domain === "i.redd.it") {
      return {
        type: "image",
        title: topPost.title,
        author: topPost.author.name,
        imageLink: topPost.url_overridden_by_dest,
        postID: topPost.id,
      };
    } else if (
      topPost.is_video &&
      !topPost.is_gif &&
      topPost.domain === "v.redd.it"
    ) {
      return {
        type: "video",
        title: topPost.title,
        author: topPost.author.name,
        postID: topPost.id,
        videoLink: topPost.media.reddit_video.fallback_url,
        thumbnail: topPost.thumbnail,
        audioLink: topPost.media.reddit_video.fallback_url.replace(
          /DASH_\d+/,
          "DASH_audio"
        ),
      };
    }
  } catch (error) {
    console.log("ERROR", error);
  }
};

const mergeAudioAndVideo = async (audioFile, videoFile, resultFile) => {
  return new Promise((resolve, reject) => {
    try {
      let result = ffmpeg(videoFile)
        .addInput(audioFile)
        .size("720x?")
        .aspectRatio("4:5")
        .saveToFile(resultFile)
        .on("end", () => {
          resolve();
        });
    } catch (error) {
      console.log(
        "🚀 ~ file: helpers.js ~ line 70 ~ returnnewPromise ~ error",
        error
      );

      reject(error);
    }
  });
};

const doStuffWithDownloadedVideo = async (ig, content) => {
  await mergeAudioAndVideo(
    "videoToBeUploaded.mp4",
    "soundToBeUploaded.mp3",
    "final.mp4"
  );
  try {
    await ig.publish.video({
      // read the file into a Buffer
      coverImage: await readFileAsync(
        path.resolve(__dirname, "../../thumbnail.jpg")
      ),
      video: await readFileAsync(path.resolve(__dirname, "../../final.mp4")),

      caption: `${content.title} - Posted on r/InstaCelebsGossip by ${
        content.author
      }
                ${convertTilteToHashTag(content.title)}`,
    });

    console.log("Done ig.publish.video ");
  } catch (error) {
    console.log(
      "🚀 ~ file: helpers.js ~ line 107 ~ doStuffWithDownloadedVideo ~ error",
      error
    );
    return {
      error: true,
      message: "Error occured",
    };
  }
};

const doStuffWithDownloadedImage = async (sharp, ig, content) => {
  await sharp("downloaded.jpeg")
    .resize({ width: 1080, height: 1080 })
    .toFormat("jpg")
    .toFile("output.jpg");
  await ig.publish.photo({
    // read the file into a Buffer
    file: await readFileAsync("output.jpg"),
    caption: `${content.title} - Posted on r/InstaCelebsGossip by ${
      content.author
    }. Get more hot ☕️ on https://www.reddit.com/r/InstaCelebsGossip/
                 ${convertTitleToHashTag(content.title)}`,

    
  });
};
const initiateSnoo = (process) => {
  try {
    return new snoowrap({
      userAgent: "insta-uploader",
      clientId: process.env.clientId,
      clientSecret: process.env.clientSecret,
      accessToken: process.env.accessToken,
      refreshToken: process.env.refreshToken,
    });
  } catch (error) {
    console.log(
      "🚀 ~ file: helpers.js ~ line 97 ~ initiateSnoo ~ error",
      error
    );
  }
};

const convertTitleToHashTag = (words) => {
  let result = "";
  words.split(" ").map((word) => {
    if(word.length > 5) result += `#${word} `;
  });

  return result;
};

module.exports = {
  initiateSnoo,
  downloadFile,
  getTopPostOfSubreddit,
  mergeAudioAndVideo,
  doStuffWithDownloadedImage,
  doStuffWithDownloadedVideo,
};
