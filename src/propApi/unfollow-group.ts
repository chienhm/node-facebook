import Api, { Form, Id } from '../api';

export default function (this: Api, groupId: Id, isUnfollow = true): Form {
  return this.post('https://www.facebook.com/groups/membership/unfollow_group/', {
    group_id: groupId,
    unfollow: Number(isUnfollow),
  });
}
