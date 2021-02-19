const dotenv = require("dotenv");
const sharp = require("sharp");

const {
  downloadFile,
  getTopPostOfOddlySatisfying,
  doStuffWithDownloadedImage,
  initiateSnoo,
  doStuffWithDownloadedVideo,
} = require("./utils/helpers");
const { IgApiClient } = require("instagram-private-api");
const { job } = require("cron");

const run = async (postNumber) => {
  dotenv.config();
  const r = initiateSnoo(process);
  const content = await getTopPostOfOddlySatisfying(
    r,
    postNumber,
    postNumber + 1
  );
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME);
  await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
  try {
    if (content.type === "video") {
      downloadFile(content.videoLink, "videoToBeUploaded.mp4", () =>
        downloadFile(content.audioLink, "soundToBeUploaded.mp3", () =>
          downloadFile(content.thumbnail, "thumbnail.jpg", () =>
            doStuffWithDownloadedVideo(ig, content)
          )
        )
      );
    } else {
      try {
        await downloadFile(content.imageLink, "downloaded.jpeg", () =>
          doStuffWithDownloadedImage(sharp, ig, content)
        );
      } catch (error) {
        console.log("🚀 ~ file: index.js ~ line 40 ~ run ~ error", error);
        return { error: true };
      }
    }
  } catch (error) {
    console.log("🚀 ~ file: index.js ~ line 45 ~ run ~ error", error);
    return { error: true };
  }
};

// try {
//   let CronJob = require("cron").CronJob;
//   let job = new CronJob("0 0 */1 * * *", function () {
//     let postNumber = new Date(Date.now()).getHours();
//     let result = run(postNumber);
//   });
//   job.start();
// } catch (error) {
//   console.log("🚀 ~ file: index.js ~ line 57 ~ error", error);
//   job.start();
// }
run()
