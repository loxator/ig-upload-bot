const dotenv = require("dotenv");
const sharp = require("sharp");
const { findByPostID, insertPostId } = require("./db/db");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const {
  downloadFile,
  getTopPostOfSubreddit,
  doStuffWithDownloadedImage,
  initiateSnoo,
  doStuffWithDownloadedVideo,
} = require("./utils/helpers");
const { IgApiClient } = require("instagram-private-api");

const cleanup = (files) => {
  for (const file of files) {
    fs.unlink(path.resolve(__dirname, file), (err) => {
      if (err) throw err;
      console.log("successfully deleted", file);
    });
  }
};

const run = async (postNumber) => {
  dotenv.config();
  const client = new MongoClient(process.env.dbURI);
  const r = initiateSnoo(process);
  const content = await getTopPostOfSubreddit(
    r,
    postNumber,
    postNumber + 1
  );

  const doesPostExist = await findByPostID(client, content.postID);
  if (!doesPostExist) {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
    try {
      if (content.type === "video") {
        await downloadFile(content.videoLink, "videoToBeUploaded.mp4");
        await downloadFile(content.audioLink, "soundToBeUploaded.mp3");
        await downloadFile(content.thumbnail, "thumbnail.jpg");
        await doStuffWithDownloadedVideo(ig, content);
        cleanup([
          "../thumbnail.jpg",
          "../final.mp4",
          "../videoToBeUploaded.mp4",
          "../soundToBeUploaded.mp3",
        ]);
      } else {
        await downloadFile(content.imageLink, "downloaded.jpeg");
        await doStuffWithDownloadedImage(sharp, ig, content);
        cleanup(["../output.jpg", "../downloaded.jpeg"]);
      }
    } catch (error) {
      console.log("🚀 ~ file: index.js ~ line 45 ~ run ~ error", error);
      await insertPostId(client, content.postID, content.title);
      await client.close();
      return { error: true };
    }
    await insertPostId(client, content.postID, content.title);
    await client.close();
  }
};

let postNumber = new Date(Date.now()).getHours();
run(postNumber);
