import {
  createContext,
  useRef,
  useContext,
  ReactNode,
  useSyncExternalStore,
  useEffect,
} from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { useEvent } from "../useEvent";
import { useUpdate } from "../useForceRender";

type Status = "offline" | "online";

class SharedStateStore {
  /**
   * Shared document.
   * @see https://docs.yjs.dev/api/y.doc
   */
  doc = new Y.Doc();

  /**
   * Connection provider.
   * @see https://github.com/yjs/y-webrtc
   */
  provider: WebrtcProvider;

  /**
   * State subscribers. Whenever the state changes, all subscribers are notified.
   */
  subscribers = new Set<() => void>();

  /**
   * Last state snapshot.
   *
   * Because the state is a Y.Map it can't be typed correctly and it can't be
   * compared by React to determine if a render is necessary.
   *
   * Taking a snapshot helps with this.
   */
  snapshot: any;

  constructor() {
    this.getState().observe(() => {
      this.takeSnapshot();
      this.notifySubscribers();
    });
    this.takeSnapshot();
  }

  connect(roomId: string) {
    if (this.provider) {
      return;
    }
    this.provider = new WebrtcProvider(roomId, this.doc);
  }

  disconnect() {
    if (!this.provider) {
      return;
    }
    this.provider.destroy();
    this.provider = undefined;
  }

  subscribe(handler: () => void) {
    this.subscribers.add(handler);
  }

  unsubscribe(handler: () => void) {
    this.subscribers.delete(handler);
  }

  notifySubscribers() {
    this.subscribers.forEach((f) => f());
  }

  getState() {
    return this.doc.getMap<any>("state");
  }

  takeSnapshot() {
    this.snapshot = this.getState().toJSON();
  }

  getSnapshot<T>() {
    return this.snapshot as T;
  }

  update(fn: (state: Y.Map<any>) => void) {
    this.doc.transact(() => {
      fn(this.getState());
    });
  }
}

const SharedStateContext = createContext<SharedStateStore>(null);

type SharedStateProviderProps = {
  children: ReactNode;
};

export const SharedStateProvider = ({ children }: SharedStateProviderProps) => {
  const storeRef = useRef(new SharedStateStore());

  return (
    <SharedStateContext.Provider value={storeRef.current}>
      {children}
    </SharedStateContext.Provider>
  );
};

export const useSharedState = <T extends {}>() => {
  const store = useContext(SharedStateContext);

  const state = useSyncExternalStore(
    (onStoreChange) => {
      store.subscribe(onStoreChange);
      return () => {
        store.unsubscribe(onStoreChange);
      };
    },
    () => store.getSnapshot<T>()
  );

  return { state, store };
};
