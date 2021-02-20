const findByPostID = async (client, postId) => {
  try {
    await client.connect();
    const database = client.db("posts");
    const collection = database.collection("postID");

    const query = { postId };

    const post = await collection.findOne(query);
    console.log("🚀 ~ file: db.js ~ line 10 ~ findByPostID ~ post", post);
    return post;
  } catch (error) {
    console.log("🚀 ~ file: db.js ~ line 30 ~ insertPostId ~ error", error);
  }
};

const insertPostId = async (client, postId, postName) => {
  try {
    await client.connect();
    const database = client.db("posts");
    const collection = database.collection("postID");

    const doc = { postId, name: postName };

    const result = await collection.insertOne(doc);
    console.log(
      `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`
    );
  } catch (error) {
    console.log("🚀 ~ file: db.js ~ line 30 ~ insertPostId ~ error", error);
  }
};

module.exports = {
  findByPostID,
  insertPostId,
};
