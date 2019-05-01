import Api from '../src/api';
import {
  pMe, pFriend,
} from './user';

let me: Api;
let friend: Api;

describe('Other', () => {
  beforeAll(async () => {
    me = await pMe;
    friend = await pFriend;
  });

  test('wrong server', async () => {
    me.iServer = Api.LEN_SV;
    await me.pull();
    expect(me.iServer).toBeGreaterThanOrEqual(0);
    expect(me.iServer).toBeLessThanOrEqual(Api.LEN_SV - 1);
  });

  test('block user', async () => {
    await me.unblockUser(friend.id);
    await expect(me.blockUser(friend.id)).rejects.toMatchObject({
      error: 1409006,
    });
    await me.unblockUser(friend.id);
  });

  test('block message', async () => {
    await me.blockMessage(friend.id);
    await expect(friend.sendTyping(me.id)).rejects.toMatchObject({
      error: 1356001,
    });
    await me.unblockMessage(friend.id);
  });

  test('change bio', () => me.changeBio('This is my Bio', 5000));
});
