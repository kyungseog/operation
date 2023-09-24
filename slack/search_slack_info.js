const util = require("../data-center/utility.js");

populateConversationStore();

//private_channel 검색전 해당 채널에 bot을 초대해야함
async function populateConversationStore() {
  try {
    const options = {
      exclude_archived: true,
      types: "private_channel",
      limit: 500,
    };
    const result = await util.slackApp.client.conversations.list(options);
    const list = result.channels.map((r) => [r.id, r.name]);
    console.log(list);
  } catch (error) {
    console.error(error);
  }
}

async function userGroupList() {
  try {
    const result = await util.slackApp.client.usergroups.list();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
