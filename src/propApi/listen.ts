import Api, { Form } from '../api';
import {
  fPresence,
  fProxy,
  fTyping,
  fNewMessage,
  fPayLoad,
  fReceipt,
  fLog,
  fMarkRead,
  fDelMessage,
} from '../utils/formatter';

const getPayLoad = (payload: number[]): Form[] => {
  const object = JSON.parse(String.fromCharCode(...payload));
  if (!Array.isArray(object.deltas)) {
    return [];
  }
  return object.deltas.map((delta: Form): Form => delta.deltaMessageReaction).filter(Boolean);
};

export default function (this: Api): boolean {
  if (this.idListen) {
    return false;
  }
  const id = (this.originIdListen % 2000) + 1;
  this.idListen = id;
  this.originIdListen = id;

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const handleDelta = (delta: Form): void => {
    switch (delta.class) {
      case 'NewMessage':
        this.emit('msg', fNewMessage(delta));
        break;
      case 'ClientPayload':
        getPayLoad(delta.payload).forEach((data: Form) => {
          this.emit('reaction', fPayLoad(data));
        });
        break;
      case 'NoOp':
        break;
      case 'ReadReceipt':
        this.emit('read_receipt', fReceipt(delta));
        break;
      case 'DeliveryReceipt':
        this.emit('delivery_receipt', fReceipt(delta));
        break;
      case 'ThreadName':
      case 'AdminTextMessage':
      case 'ParticipantLeftGroupThread':
      case 'ParticipantsAddedToGroupThread': {
        const { type, ...rest } = fLog(delta);
        this.emit(type, rest);
        break;
      }
      case 'MarkFolderSeen':
        break;
      case 'MarkRead':
        this.emit('mark_read', fMarkRead(delta));
        break;
      case 'MessageDelete':
        this.emit('del_msg', fDelMessage(delta));
        break;
      default:
        this.emit('other_delta', delta);
    }
  };
  const invoker = (): boolean => {
    this.pull().then((response: Form): void => {
      if (this.idListen !== id) {
        return;
      }
      (response as Form[]).forEach((ms: Form) => {
        switch (ms.type) {
          case 'typ':
            this.emit('typ', fTyping(ms));
            break;
          case 'buddylist_overlay':
            (Object.entries(ms.overlay) as [string, Form][])
              .forEach((entries: [string, Form]) => {
                this.emit('presence', fPresence(...entries));
              });
            break;
          case 'chatproxy-presence':
            (Object.entries(ms.buddyList) as [string, Form][])
              .forEach((entries: [string, Form]) => {
                if (entries[1].p) {
                  this.emit('presence', fProxy(...entries));
                }
              });
            break;
          case 'delta':
            handleDelta(ms.delta);
            break;
          case 'notification':
          case 'm_notification':
          case 'notifications_sync':
          case 'notifications_seen':
          case 'inbox':
            this.emit('inbox', ms);
            break;
          case 'deltaflow':
            this.emit('deltaflow', ms);
            break;
          default:
            this.emit('other', ms);
        }
      });
      invoker();
    }).catch(invoker);
    return true;
  };
  return invoker();
}
